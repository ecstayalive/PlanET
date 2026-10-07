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
    { "title": "建议", "code": "renderNavigation(items)" }
  ],
  "choices": [
    { "id": "sidebar", "label": "侧边栏", "description": "栏目更易浏览", "html": "<aside>首页<br>项目<br>设置</aside>" },
    { "id": "topbar", "label": "顶部导航", "description": "内容区域更宽", "html": "<nav>首页 · 项目 · 设置</nav>" }
  ]
}
```

`id` and choice IDs use descriptive ASCII slugs: letters, digits, and hyphens,
starting with a letter. `mode` is `view` or `decision`; `title` is required.
`summary`, `panels`, and `choices` are optional. Panels have a required `title`
and any of `text`, `code`, `html`, or `diagram`. Choices have required `id` and `label`, plus
optional `description` and `html`. A view cannot include choices. A decision
without choices accepts a free-text reply. Choice IDs must be unique.

Use `html` for static mockups or inline SVG diagrams, with inline styles if needed.
Frames are sandboxed: scripts, remote images, external fonts, forms, and navigation
are unavailable. Bundle a complete visual as inline markup or a data image. Text
and code are rendered as text, not HTML. Do not embed secrets in previews.

## Native flowcharts

Prefer the native renderer for clear, consistently styled flows:

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

An authenticated `GET /screen` adds a content-derived `revision`. Browser responses
must include that revision, so an old browser tab cannot confirm a changed design.
One explicit answer is accepted per revision; publishing a revised question permits
a new answer. For view mode, omit `choices` and use the same panel format.

The server publishes updates via `GET /updates` (SSE), accepts responses through
`POST /confirm`, and exposes recorded replies through `GET /events`. These API
routes require `Authorization: Bearer <token>`. The browser obtains its token from
the URL fragment; it never sends the fragment as a query string or referrer.
