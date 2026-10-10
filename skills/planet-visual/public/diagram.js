// Shared graph contract: deterministic layout preserves readable branches and labels.
export function calcEdgePath(from, to, down = false) {
  const start = down ? [from.x + 106, from.y + 100] : [from.x + 212, from.y + 50];
  const end = down ? [to.x + 106, to.y - 4] : [to.x - 4, to.y + 50];
  const mid = down ? (start[1] + end[1]) / 2 : (start[0] + end[0]) / 2;
  return down ? `M${start} C${start[0]},${mid} ${end[0]},${mid} ${end}`
    : `M${start} C${mid},${start[1]} ${mid},${end[1]} ${end}`;
}

export function layoutDiagram(diagram, preserveCoordinates = false) {
  if (!diagram || typeof diagram !== 'object' || !Array.isArray(diagram.nodes) ||
      !Array.isArray(diagram.edges) || diagram.nodes.length < 1 || diagram.nodes.length > 24 ||
      diagram.edges.length > 48 || !['right', 'down'].includes(diagram.direction ?? 'right')) {
    throw new Error('A diagram needs 1–24 nodes, up to 48 edges, and direction right or down.');
  }
  const nodes = new Map();
  for (const node of diagram.nodes) {
    if (!node || typeof node !== 'object' || typeof node.id !== 'string' ||
        !/^[a-z][a-z0-9-]*$/.test(node.id) || nodes.has(node.id) ||
        typeof node.label !== 'string' || !node.label.trim() || node.label.length > 60 ||
        (node.detail !== undefined && (typeof node.detail !== 'string' || node.detail.length > 100)) ||
        !['source', 'process', 'decision', 'result'].includes(node.kind ?? 'process')) {
      throw new Error('Diagram nodes need unique slug ids, concise labels, and a supported kind.');
    }
    nodes.set(node.id, { ...node, column: 0, incoming: 0, children: [] });
  }
  const connections = new Set();
  for (const edge of diagram.edges) {
    if (!edge || !nodes.has(edge.from) || !nodes.has(edge.to) ||
        (edge.label !== undefined && (typeof edge.label !== 'string' || edge.label.length > 28)) ||
        connections.has(`${edge.from}/${edge.to}`)) {
      throw new Error('Diagram edges must connect existing nodes without duplicate connections.');
    }
    connections.add(`${edge.from}/${edge.to}`);
    nodes.get(edge.to).incoming++;
    nodes.get(edge.from).children.push(edge.to);
  }
  const queue = [...nodes.values()].filter(node => node.incoming === 0);
  for (let index = 0; index < queue.length; index++) {
    for (const id of queue[index].children) {
      const child = nodes.get(id);
      child.column = Math.max(child.column, queue[index].column + 1);
      if (--child.incoming === 0) queue.push(child);
    }
  }
  if (queue.length !== nodes.size) throw new Error('Flowcharts must be acyclic; split feedback loops into separate panels.');
  const columns = Array.from({ length: Math.max(...queue.map(node => node.column)) + 1 }, () => []);
  for (const node of nodes.values()) columns[node.column].push(node);
  const rows = Math.max(...columns.map(column => column.length));
  const down = diagram.direction === 'down';
  const width = down ? rows * 250 + 48 : columns.length * 280 + 48;
  const height = down ? columns.length * 158 + 48 : rows * 136 + 48;
  for (const column of columns) {
    for (const [row, node] of column.entries()) {
      const origNode = diagram.nodes.find(n => n.id === node.id);
      if (preserveCoordinates && origNode && typeof origNode.x === 'number' && typeof origNode.y === 'number') {
        node.x = origNode.x;
        node.y = origNode.y;
      } else {
        node.x = down ? 24 + (rows - column.length) * 125 + row * 250 : 24 + node.column * 280;
        node.y = down ? 24 + node.column * 158 : 24 + (rows - column.length) * 68 + row * 136;
      }
    }
  }
  const calcWidth = Math.max(width, ...[...nodes.values()].map(n => (n.x ?? 0) + 260));
  const calcHeight = Math.max(height, ...[...nodes.values()].map(n => (n.y ?? 0) + 140));
  return { nodes, edges: diagram.edges, width: calcWidth, height: calcHeight, down };
}

function escapeXml(text) {
  return String(text).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);
}

export function renderDiagram(diagram, namespace = 'flow') {
  const { nodes, edges, width, height, down } = layoutDiagram(diagram);
  if (!/^[a-z][a-z0-9-]*$/.test(namespace)) throw new Error('Diagram namespace must be a slug.');
  const marker = `${namespace}-arrow`;
  const fragments = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Flowchart" style="min-width:${Math.min(width, 800)}px">`,
    `<defs><marker id="${marker}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" fill="none" stroke="#698478" stroke-width="1.5"/></marker></defs>`];
  for (const edge of edges) {
    const from = nodes.get(edge.from);
    const to = nodes.get(edge.to);
    const start = down ? [from.x + 106, from.y + 100] : [from.x + 212, from.y + 50];
    const end = down ? [to.x + 106, to.y - 4] : [to.x - 4, to.y + 50];
    const mid = down ? (start[1] + end[1]) / 2 : (start[0] + end[0]) / 2;
    const path = calcEdgePath(from, to, down);
    fragments.push(`<path d="${path}" data-from="${edge.from}" data-to="${edge.to}" fill="none" stroke="#8aa294" stroke-width="1.7" marker-end="url(#${marker})"/>`);
    if (edge.label) {
      const x = (start[0] + end[0]) / 2;
      const y = (start[1] + end[1]) / 2 - 10;
      const textWidth = Math.min(edge.label.length * 7 + 16, 210);
      fragments.push(`<rect x="${x - textWidth / 2}" y="${y - 11}" width="${textWidth}" height="20" rx="5" fill="#f9faf6"/><text x="${x}" y="${y + 3}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="#607568">${escapeXml(edge.label)}</text>`);
    }
  }
  for (const node of nodes.values()) {
    const kind = node.kind ?? 'process';
    const color = kind === 'decision' ? '#a47235' : kind === 'result' ? '#2c6b52' : '#527b6c';
    const fill = kind === 'decision' ? '#fff8ed' : kind === 'result' ? '#eaf5ed' : '#ffffff';
    fragments.push(`<g transform="translate(${node.x},${node.y})" data-node-id="${node.id}" class="diagram-node"><rect x="0" y="3" width="212" height="100" rx="12" fill="#203c2d" opacity=".035"/><rect width="212" height="100" rx="12" fill="${fill}" stroke="#d4e0d6"/><rect x="15" y="16" width="5" height="5" rx="2" fill="${color}"/><text x="27" y="21" font-family="system-ui,sans-serif" font-size="9" letter-spacing="1.3" fill="${color}">${kind.toUpperCase()}</text>`);
    for (const [text, offset, size, weight, limit] of [
      [node.label, 44, 14, 600, 24], [node.detail ?? '', 76, 10, 400, 34],
    ]) {
      const lines = String(text).match(new RegExp(`.{1,${limit}}(?:\\s|$)|.{1,${limit}}`, 'gu')) ?? [];
      for (const [index, line] of lines.slice(0, 2).entries()) {
        const suffix = index === 1 && lines.length > 2 ? '…' : '';
        fragments.push(`<text x="15" y="${offset + index * (size + 3)}" font-family="system-ui,sans-serif" font-size="${size}" font-weight="${weight}" fill="${size === 14 ? '#243c32' : '#73847b'}">${escapeXml(line.trim() + suffix)}</text>`);
      }
    }
    fragments.push('</g>');
  }
  return `${fragments.join('')}</svg>`;
}
