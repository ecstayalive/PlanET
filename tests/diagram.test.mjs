import assert from 'node:assert/strict';
import test from 'node:test';
import { layoutDiagram, renderDiagram } from '../skills/planet-visual/public/diagram.js';
import { validateScreen } from '../skills/planet-visual/scripts/screen.mjs';

const graph = {
  nodes: [
    { id: 'request', label: 'Request', kind: 'source' },
    { id: 'dispatch', label: 'Dispatch', kind: 'process' },
    { id: 'csv', label: 'CSV', kind: 'result' },
    { id: 'markdown', label: 'Markdown', kind: 'result' },
  ],
  edges: [{ from: 'request', to: 'dispatch' }, { from: 'dispatch', to: 'csv' }, { from: 'dispatch', to: 'markdown' }],
};

test('flowchart topology separates branches and preserves sibling order', () => {
  const flow = layoutDiagram(graph);
  assert.ok(flow.nodes.get('dispatch').x > flow.nodes.get('request').x);
  assert.equal(flow.nodes.get('csv').x, flow.nodes.get('markdown').x);
  assert.ok(flow.nodes.get('markdown').y - flow.nodes.get('csv').y > 100);
  const shuffled = layoutDiagram({ ...graph, edges: [...graph.edges].reverse() });
  for (const [id, node] of flow.nodes) {
    assert.equal(shuffled.nodes.get(id).x, node.x);
    assert.equal(shuffled.nodes.get(id).y, node.y);
    assert.ok(node.x + 212 <= flow.width);
    assert.ok(node.y + 103 <= flow.height);
  }
  const vertical = layoutDiagram({ ...graph, direction: 'down' });
  assert.ok(vertical.nodes.get('dispatch').y > vertical.nodes.get('request').y);
  assert.equal(vertical.nodes.get('csv').y, vertical.nodes.get('markdown').y);
  assert.ok(vertical.nodes.get('csv').x !== vertical.nodes.get('markdown').x);
});

test('invalid graph topology is rejected at the screen boundary', () => {
  const screen = diagram => ({ id: 'flow', mode: 'view', title: 'Flow', panels: [{ title: 'Architecture', diagram }] });
  assert.throws(() => validateScreen(screen({ ...graph, edges: [{ from: 'request', to: 'missing' }] })), /existing/);
  assert.throws(() => validateScreen(screen({ ...graph, edges: [...graph.edges, { from: 'markdown', to: 'request' }] })), /acyclic/);
  assert.throws(() => layoutDiagram({ ...graph, nodes: [graph.nodes[0], graph.nodes[0]] }), /unique/);
  assert.throws(() => layoutDiagram({ ...graph, direction: 'diagonal' }), /direction/);
});

test('SVG labels cannot inject markup and marker ids remain distinct', () => {
  const unsafe = { nodes: [{ id: 'input', label: '<script>alert(1)</script>', detail: 'A & B' }], edges: [] };
  const svg = renderDiagram(unsafe, 'first-flow');
  assert.ok(!svg.includes('<script>'));
  assert.ok(svg.includes('&lt;script&gt;'));
  assert.ok(svg.includes('A &amp; B'));
  assert.ok(svg.includes('first-flow-arrow'));
  assert.ok(renderDiagram(unsafe, 'second-flow').includes('second-flow-arrow'));
  assert.throws(() => renderDiagram(unsafe, 'invalid" onload="'), /namespace/);
});
