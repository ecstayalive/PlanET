# Visual screen format

Write one JSON object to `screen.json`:

```json
{
  "id": "navigation-layout",
  "mode": "decision",
  "title": "选择导航布局",
  "summary": "功能相同，区别在于空间分配。推荐侧边栏以容纳当前栏目。",
  "panels": [
    { "title": "当前结构", "text": "相关功能集中在导航模块。" },
    { "title": "建议", "file": "src/navigation.mjs", "symbol": "renderNavigation", "language": "javascript", "code": "renderNavigation(items)" }
  ],
  "choices": [
    { "id": "sidebar", "label": "侧边栏", "description": "栏目更易浏览", "html": "<aside>首页<br>项目<br>设置</aside>" },
    { "id": "topbar", "label": "顶部导航", "description": "内容区域更宽", "html": "<nav>首页 · 项目 · 设置</nav>" }
  ]
}
```

`id` and choice IDs use descriptive ASCII slugs: letters, digits, and hyphens,
starting with a letter. `mode` is `view` or `decision`; `title` is required.
This is a delivery envelope, not a required design layout. Choose HTML, examples,
text/code, or diagrams to explain the task; omit unused fields and panels. The file
path in the example is illustrative, not a claim about this repository.

`summary`, `panels`, and `choices` are optional. Panels have a required `title`
and any of `text`, `code`, `html`, `diagram`, `file`, `symbol`, `language`, or `originalCode`.
Choices have required `id` and `label`, plus optional `description`, `html`, `code`,
`file`, `symbol`, or `originalCode`. A view cannot include choices. A decision without choices
accepts a free-text reply. Choice IDs must be unique.

Provide file/symbol context for actual code and language where supported. Label
illustrative examples explicitly. `originalCode` is optional metadata, not an automatic
diff view; show before/after as separate panels or authored HTML when useful.
Code can explain a contract without a flowchart. Detailed review and edits belong
in the native IDE or terminal.

Use `html` for agent-authored walkthroughs, example tables, static mockups, or inline
SVG diagrams. Optionally include [style-template.html](../assets/style-template.html)
for presentation styles; it imposes no content structure. Put the full fragment,
including inline styles, in this field. Real decisions use the outer `choices`
and response controls, not buttons inside a preview.
Frames are sandboxed: scripts, remote images, external fonts, forms, and navigation
are unavailable. Bundle a complete visual as inline markup or a data image. Text
and code are rendered as text, not HTML. Do not embed secrets in previews.

## Native flowcharts

The native renderer is optional for small acyclic flows. Use authored HTML or inline
SVG when a different diagram better describes the implementation:

```json
{
  "title": "Export flow",
  "diagram": {
    "direction": "right",
    "nodes": [
      { "id": "request", "label": "Export request", "kind": "source" },
      { "id": "dispatch", "label": "Validate & dispatch", "detail": "Existing contract", "kind": "process" },
      { "id": "result", "label": "Markdown export", "kind": "result" }
    ],
    "edges": [
      { "from": "request", "to": "dispatch" },
      { "from": "dispatch", "to": "result", "label": "new format" }
    ]
  }
}
```

`direction` is `right` (default) or `down`. Node IDs must be unique slugs. Each node
has a required label (up to 60 characters), optional detail (up to 100 characters),
and kind `source`, `process`, `decision`, or `result`. Edges connect existing IDs
and may include a short label. Up to 24 nodes and 48 edges are supported. The graph
must be acyclic; focused subflows are more legible than dense diagrams.

Native flowcharts use clear, deterministic layout with clean node styling and
readable connecting curves. They provide an immediate visual overview of data flows
and module interactions so the user can evaluate architecture and choice trade-offs
at a glance without context switching.

An authenticated `GET /screen` adds a content-derived `revision`. Browser responses
must include that revision, so an old browser tab cannot confirm a changed design.
One explicit answer is accepted per revision; publishing a revised question permits
a new answer. For view mode, omit `choices` and use the same panel format.

The server publishes updates via `GET /updates` (SSE), accepts responses through
`POST /confirm`, and exposes recorded replies through `GET /events`. These API
routes require `Authorization: Bearer <token>`. The browser obtains its token from
the URL fragment; it never sends the fragment as a query string or referrer.
The viewer records chosen options and feedback, not browser edits to source code or
a design blueprint. Submission alone does not establish authorization: the agent
must inspect the response for explicit approval of the presented design and scope.
Rejections, correction requests, and ordinary feedback do not authorize writes.
