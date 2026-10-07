import { renderDiagram } from './diagram.js';

const token = new URLSearchParams(location.hash.slice(1)).get('token');
const headers = { Authorization: `Bearer ${token}` };
const form = document.querySelector('#decision');
const message = document.querySelector('#message');
let current;
let refresh = Promise.resolve();

function renderScreen(screen, events) {
  const answered = events.some(event => event.screen === screen.id && event.revision === screen.revision);
  if (current?.revision === screen.revision) {
    if (answered) {
      for (const element of form.elements) element.disabled = true;
      message.textContent = 'Confirmed. Continue in your conversation when ready.';
    }
    return;
  }
  current = screen;
  document.title = `${screen.title} · PlanET`;
  document.querySelector('#mode').textContent = screen.mode === 'decision' ? 'YOUR DECISION' : 'DESIGN VIEW';
  document.querySelector('#title').textContent = screen.title;
  document.querySelector('#summary').textContent = screen.summary ?? '';
  const panels = document.querySelector('#panels');
  panels.replaceChildren();
  const choices = document.querySelector('#choices');
  choices.replaceChildren();
  const legend = document.createElement('legend');
  legend.textContent = 'Choose a direction';
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
      if (item.diagram) {
        card.classList.add('flow-card');
        const diagram = document.createElement('div');
        diagram.className = 'diagram';
        diagram.tabIndex = 0;
        diagram.setAttribute('aria-label', `${item.title}. Scroll to explore the flow.`);
        // Only the validated graph renderer constructs this markup; labels are escaped.
        diagram.innerHTML = renderDiagram(item.diagram, `${screen.id}-panel-${index}`);
        card.append(diagram);
        const hint = document.createElement('p');
        hint.className = 'diagram-hint';
        hint.textContent = 'Swipe or scroll to follow the flow →';
        card.append(hint);
      }
      if (item.text || item.description) {
        const text = document.createElement('p');
        text.textContent = item.text ?? item.description;
        card.append(text);
      }
      if (item.code !== undefined) {
        const code = document.createElement('pre');
        code.textContent = item.code;
        card.append(code);
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
  document.querySelector('#confirm').textContent = screen.choices?.length ? 'Confirm choice' : 'Send response';
  for (const element of form.elements) element.disabled = answered;
  message.textContent = answered ? 'Confirmed. Continue in your conversation when ready.'
    : screen.mode === 'view' ? 'A view of the work. No response is required.' : 'Explore the options, then confirm your decision.';
}

function refreshScreen() {
  // Serialize refreshes so a delayed response cannot replace a newer design.
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
    message.textContent = 'Choose an option or enter your preferred direction.';
    return;
  }
  const button = document.querySelector('#confirm');
  button.disabled = true;
  try {
    const response = await fetch('/confirm', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ screen: screen.id, revision: screen.revision, choice, feedback }),
    });
    if (!response.ok) {
      message.textContent = response.status === 409 ? 'This decision has changed or was already confirmed. Review the current content.' : 'Unable to submit. Please try again.';
      await refreshScreen();
      return;
    }
    await refreshScreen();
  } catch {
    message.textContent = 'Connection paused. Reconnect to check whether your response was received.';
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
    message.textContent = 'Open the complete URL shared by your agent.';
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
      connection.textContent = 'Connected';
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
      // Reconnecting restores the current screen and confirmation state.
    }
    connection.textContent = 'Reconnecting';
    await new Promise(done => setTimeout(done, 1500));
  }
}

connectUpdates();
