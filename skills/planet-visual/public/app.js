import { renderDiagram } from './diagram.js';

const token = new URLSearchParams(location.hash.slice(1)).get('token');
const headers = { Authorization: `Bearer ${token}` };
const form = document.querySelector('#decision');
const message = document.querySelector('#message');
let current;
let refresh = Promise.resolve();

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function renderScreen(screen, events) {
  const answered = events.some(event => event.screen === screen.id && event.revision === screen.revision);
  if (current?.revision === screen.revision) {
    if (answered) {
      for (const element of form.elements) element.disabled = true;
      message.textContent = '已确认并授权。请回到终端继续执行。';
    }
    return;
  }
  current = screen;
  document.title = `${screen.title} · PlanET`;
  document.querySelector('#mode').textContent = screen.mode === 'decision' ? 'YOUR DECISION · 方案决策' : 'DESIGN VIEW · 架构视图';
  document.querySelector('#title').textContent = screen.title;
  document.querySelector('#summary').textContent = screen.summary ?? '';

  const panels = document.querySelector('#panels');
  panels.replaceChildren();
  const choices = document.querySelector('#choices');
  choices.replaceChildren();

  const legend = document.createElement('legend');
  legend.textContent = '选择方案并授权 (Choose a direction)';
  choices.append(legend);

  for (const [items, container, isChoice] of [
    [screen.panels ?? [], panels, false],
    [screen.choices ?? [], choices, true],
  ]) {
    for (const [index, item] of items.entries()) {
      const card = document.createElement(isChoice ? 'label' : 'article');
      card.className = 'card';
      if (isChoice) {
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'choice';
        input.value = item.id;
        card.append(input);
      }
      const heading = document.createElement('h2');
      heading.textContent = isChoice ? item.label : item.title;
      card.append(heading);

      // Clean SVG Flowchart
      if (item.diagram) {
        card.classList.add('flow-card');
        const diagram = document.createElement('div');
        diagram.className = 'diagram';
        diagram.tabIndex = 0;
        diagram.setAttribute('aria-label', `${item.title}. Flowchart.`);
        diagram.innerHTML = renderDiagram(item.diagram, `${screen.id}-panel-${index}`);
        card.append(diagram);
        const hint = document.createElement('p');
        hint.className = 'diagram-hint';
        hint.textContent = '左右滑动以查看完整流程拓扑 →';
        card.append(hint);
      }

      // Contextual Text Description
      if (item.text || item.description) {
        const text = document.createElement('p');
        text.textContent = item.text ?? item.description;
        card.append(text);
      }

      // Contextual Code Box (with file path and symbol anchors)
      if (item.code !== undefined) {
        const codeBox = document.createElement('div');
        codeBox.className = 'code-context-box';

        if (item.file || item.symbol || item.language) {
          const headerEl = document.createElement('div');
          headerEl.className = 'code-context-header';
          headerEl.innerHTML = `
            <span class="code-file-label">📄 <strong>${escapeHtml(item.file || '代码契约')}</strong></span>
            ${item.symbol ? `<span class="code-symbol-badge">@${escapeHtml(item.symbol)}</span>` : ''}
            ${item.language ? `<span class="code-lang-badge">${escapeHtml(item.language)}</span>` : ''}
          `;
          codeBox.append(headerEl);
        }

        const code = document.createElement('pre');
        code.textContent = item.code;
        codeBox.append(code);
        card.append(codeBox);
      }

      if (item.html !== undefined) {
        const frame = document.createElement('iframe');
        frame.title = isChoice ? item.label : item.title;
        frame.setAttribute('sandbox', '');
        frame.srcdoc = '<!doctype html><meta charset="utf-8">'
          + '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; form-action \'none\'">'
          + '<style>body{font-family:system-ui,sans-serif;margin:16px;color:#202e36}*{box-sizing:border-box}</style>'
          + item.html;
        card.append(frame);
      }
      container.append(card);
    }
  }

  form.reset();
  form.hidden = screen.mode !== 'decision';
  choices.hidden = !(screen.choices?.length);
  document.querySelector('#confirm').textContent = screen.choices?.length ? '授权并确认选择 (Authorize choice)' : '发送确认反馈 (Send response)';
  for (const element of form.elements) element.disabled = answered;
  message.textContent = answered
    ? '已确认并授权。请回到终端继续执行。'
    : screen.mode === 'view'
      ? '设计视图：用于直观了解架构走向。如需调整请在终端向 AI 说明。'
      : '请在上方选定目标方案并授权，或在下方留下备注说明。详细代码调整可在终端中直接对齐。';
}

function refreshScreen() {
  refresh = refresh.then(async () => {
    const [screenResponse, eventsResponse] = await Promise.all([
      fetch('/screen', { headers }), fetch('/events', { headers }),
    ]);
    if (screenResponse.status === 404) return;
    if (!screenResponse.ok || !eventsResponse.ok) {
      throw new Error(screenResponse.status === 401 ? 'Use the complete session URL to connect.' : 'Content is unavailable. Please try again.');
    }
    renderScreen(await screenResponse.json(), await eventsResponse.json());
  }).catch(error => { message.textContent = error.message; });
  return refresh;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const screen = current;
  const choice = new FormData(form).get('choice') ?? undefined;
  const feedback = document.querySelector('#feedback').value;

  if (!choice && !feedback.trim()) {
    message.textContent = '请选择一个方案方向，或输入您的指导意见。';
    return;
  }
  const button = document.querySelector('#confirm');
  button.disabled = true;
  try {
    const response = await fetch('/confirm', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        screen: screen.id,
        revision: screen.revision,
        choice,
        feedback: feedback.trim(),
      }),
    });
    if (!response.ok) {
      message.textContent = response.status === 409 ? '方案已更新或已被确认。正在刷新当前内容...' : '提交失败，请重试。';
      await refreshScreen();
      return;
    }
    await refreshScreen();
  } catch {
    message.textContent = '连接中断，请检查服务状态。';
  } finally {
    if (current?.revision === screen.revision && !form.querySelector('input:disabled, textarea:disabled')) {
      button.disabled = false;
    }
  }
});

async function connectUpdates() {
  const connection = document.querySelector('#connection');
  if (!token) {
    connection.textContent = 'Session URL needed';
    message.textContent = '请打开带有鉴权 token 的完整会话链接。';
    return;
  }
  for (;;) {
    try {
      const response = await fetch('/updates', { headers });
      if (response.status === 401) {
        connection.textContent = 'Session expired';
        return;
      }
      if (!response.ok) throw new Error('Disconnected');
      connection.textContent = 'Connected · 已连接';
      await refreshScreen();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        if (pending.includes('\n\n')) {
          pending = pending.slice(pending.lastIndexOf('\n\n') + 2);
          await refreshScreen();
        }
      }
    } catch {
      // Reconnect loop
    }
    connection.textContent = 'Reconnecting · 重连中';
    await new Promise(done => setTimeout(done, 1500));
  }
}

connectUpdates();
