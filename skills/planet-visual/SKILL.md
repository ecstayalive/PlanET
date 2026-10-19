---
name: planet-visual
description: Use when visual examples, diagrams, layout previews, or comparisons help the user understand an implementation or make a design decision.
---
# PlanET Visual
Help the user understand the proposed implementation and its trade-offs. Use the user's language. PlanET supplies optional presentation styles and local display/confirmation infrastructure, not a required diagram language, content layout, or design process.
## Choose the expression
Select the simplest useful medium: authored HTML for a walkthrough or layout, concrete examples for behavior, and architecture/data-flow diagrams for responsibility and interaction. Combine them only when useful. Native diagrams are an optional convenience; use inline SVG or HTML when they communicate the structure better. Preserve user goals and decisions rather than forcing the problem into a preset card or node structure.
For HTML, optionally copy [style-template.html](assets/style-template.html) and author your own markup. It supplies colors, typography, spacing, and reusable styles only. Read [design.md](references/design.md) for expression examples; no fixed sequence of panels is required.
## Display or decision
- Use `mode: "view"` for diagrams, architectural overviews, and before/after comparisons. Share the URL and continue authorized work.
- Use `mode: "decision"` when a consequential user choice or explicit implementation authorization is needed. Explain alternatives, consequences, and the proposed scope in the medium best suited to the question.
- Browser responses count only after explicit submission. Match the screen and revision, then interpret the actual choice/feedback: only explicit approval of the described design authorizes implementation. Corrections, rejection, or ordinary feedback do not. Detailed refinements remain in conversation and native developer tools; a visual does not replace user alignment.
## Start the local viewer
Resolve the path below from this skill's installed directory. Node.js 22+ is required; no dependency installation, MCP server, or remote backend is needed.
```sh
node /absolute/path/to/planet-visual/scripts/serve.mjs --dir /absolute/path/to/session
```
Choose a session directory outside source control, such as a task-specific temporary directory or `.planet/visual/<descriptive-session-name>` in the project. The server prints JSON with `url` and `directory`. Share the complete URL, including the fragment containing its session token. It serves only the local loopback interface. Browser refreshes retain the URL and reconnect automatically.

Use the host's persistent/background execution facility. In Codex, keep the exec session alive in foreground; in Claude Code, use its background Bash facility; in Pi, use an available persistent process facility or let the user run the command in another terminal. Do not assume detached processes survive the host. If local browser access is unavailable, provide a static artifact or explain in chat and continue; do not expose a network listener just to bypass the limitation.
## Publish and read
Write `screen.json` in the returned directory using the schema in [screens.md](references/screens.md). Write to a temporary file and rename it to `screen.json` when possible so readers see a complete update. Give changed questions meaningful new IDs. The server also hashes content to reject stale answers when a screen is edited without changing its ID.

The viewer updates through server-sent events over HTTP. It supports native flowcharts, text, code, static HTML/SVG previews in isolated frames, and explicit choice/free-text replies. It does not execute code from screens in the agent's shell. This transport avoids a custom WebSocket implementation or an additional runtime dependency.

Confirmed answers are appended to `events.jsonl`; each includes `screen`, `revision`, `choice`, `feedback`, and `confirmedAt`. Match both ID and revision against the authenticated `/screen` response before using an answer. Do not reuse an answer from an earlier screen. Read the file when the user replies or when the host can observe the process; the viewer does not automatically initiate agent turns. Do not poll indefinitely or treat elapsed time as consent.

Stop the process when the visual task is finished. SIGINT/SIGTERM closes active connections; the default idle timeout is one hour. Session files stay local for review. The plugin performs no telemetry or remote requests.
