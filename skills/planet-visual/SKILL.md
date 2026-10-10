---
name: planet-visual
description: Use when a coding task benefits from a browser-based diagram, design comparison, UI preview, or an important visual decision. Show progress without pausing unless a consequential user choice is required.
---
# PlanET Visual
Make designs and results easy to inspect. Use the user's language for screens. Do not start a visual interview or make every preview an approval gate.
## Display or decision
- Use `mode: "view"` for diagrams, architectural overviews, and before/after comparisons. Share the URL and continue authorized work.
- Use `mode: "decision"` as a visual companion board for consequential choices, A/B design comparisons, and explicit write authorization. The visual board presents clear layout and architectural choices so the user can compare options visually and select a direction with one click.
- Browser selections count only after the user presses **Authorize & Confirm choice** or **Send response**. Detailed code refinement and design adjustments remain anchored in the conversation and the developer's native IDE, avoiding bloated in-browser editors. A screen event records the authorized direction in `events.jsonl`. Chat corrections remain authoritative.
## Start the local viewer
Resolve the path below from this skill's installed directory. Node.js 22+ is required; no dependency installation, MCP server, or remote backend is needed.
```sh
node /absolute/path/to/planet-visual/scripts/serve.mjs --dir /absolute/path/to/session
```
Choose a session directory outside source control, such as a task-specific temporary directory or `.planet/visual/<descriptive-session-name>` in the project. The server prints JSON with `url` and `directory`. Share the complete URL, including the fragment containing its session token. It serves only the local loopback interface. Browser refreshes retain the URL and reconnect automatically.

Use the host's persistent/background execution facility. In Codex, keep the exec session alive in foreground; in Claude Code, use its background Bash facility; in Pi, use an available persistent process facility or let the user run the command in another terminal. Do not assume detached processes survive the host. If local browser access is unavailable, provide a static artifact or explain in chat and continue; do not expose a network listener just to bypass the limitation.
## Publish and read
Read [design.md](references/design.md) when preparing diagrams or comparisons. Use native flowcharts for coherent node, connector, and branch styling.

Write `screen.json` in the returned directory using the schema in [screens.md](references/screens.md). Write to a temporary file and rename it to `screen.json` when possible so readers see a complete update. Give changed questions meaningful new IDs. The server also hashes content to reject stale answers when a screen is edited without changing its ID.

The viewer updates through server-sent events over HTTP. It supports native flowcharts, text, code, static HTML/SVG previews in isolated frames, and explicit choice/free-text replies. It does not execute code from screens in the agent's shell. This transport avoids a custom WebSocket implementation or an additional runtime dependency.

Confirmed answers are appended to `events.jsonl`; each includes `screen`, `revision`, `choice`, `feedback`, and `confirmedAt`. Match both ID and revision against the authenticated `/screen` response before using an answer. Do not reuse an answer from an earlier screen. Read the file when the user replies or when the host can observe the process; the viewer does not automatically initiate agent turns. Do not poll indefinitely or treat elapsed time as consent.

Stop the process when the visual task is finished. SIGINT/SIGTERM closes active connections; the default idle timeout is one hour. Session files stay local for review. The plugin performs no telemetry or remote requests.
