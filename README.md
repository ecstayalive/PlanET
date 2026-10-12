<p align="center">
  <img src="assets/logo.svg" alt="PlanET — Harness coding agents to write elegant, concise, maintainable code." width="520">
</p>

Software development is a systems engineering discipline. Aligning requirements is essential, but it is not enough: AI-generated code can still be cluttered, overengineered, and difficult to maintain.

Tools such as Superpowers bring useful discipline to agent workflows. PlanET focuses on the engineering judgment inside that work: choosing suitable design patterns, extending existing capabilities, keeping related logic together, and removing unnecessary complexity. Agents should own routine technical decisions and ask users only necessary, consequential questions.

PlanET is an engineering harness for **Claude Code, Codex, and Pi**, delivered as a plugin with one shared set of engineering principles and an optional local visual workspace. It is designed for everyday coding: straightforward installation, ordinary task requests, and decisions that stay grounded in the existing codebase.

## Installation

Requires **Node.js 22+**, **Git**, and one of the supported coding agents. Install directly from [ecstayalive/PlanET](https://github.com/ecstayalive/PlanET); you do not need to clone the repository or run `npm install` first.

### Claude Code

Run these commands **inside a Claude Code session**:

```text
/plugin marketplace add ecstayalive/PlanET
/plugin install planet@planet
```

Start a new session after installation. [Claude Code installation reference](https://code.claude.com/docs/en/discover-plugins).

### Codex

Run these commands **in your terminal**:

```sh
codex plugin marketplace add ecstayalive/PlanET
codex plugin add planet@planet
```

Start a new session after installation. If your Codex version does not provide `plugin add`, update it or install PlanET from the added marketplace in the desktop client's Plugins directory. [OpenAI Docs: plugin marketplaces](https://developers.openai.com/plugins/build/plugins).

### Pi

Run this command **in your terminal**:

```sh
pi install git:github.com/ecstayalive/PlanET
```

Start a new Pi session after installation. [Pi package installation reference](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/packages.md).

### Use PlanET

Use your agent normally after installation. With startup loading enabled, PlanET's engineering guidance applies to coding tasks automatically. You can also ask the agent to apply PlanET to an implementation, refactor, or code review. For explicit invocation:

| Agent | Engineering skill | Visual workspace |
| --- | --- | --- |
| Claude Code | `/planet:planet` | `/planet:planet-visual` |
| Codex | `$planet:planet` | `$planet:planet-visual` |
| Pi | `/skill:planet` | `/skill:planet-visual` |

The agent inspects existing modules, establishes clear responsibilities and interfaces, and obtains your write authorization before modifying code. When helpful, it delivers a visual companion board for layout or architecture comparison.

For example: **“Add Markdown export using the existing export pipeline.”** PlanET guides the agent to find the current implementation, define the exporter's module contract, and present the design before modifying code. To inspect the design, add **“Show how the new exporter fits into the existing flow.”**

In Codex, you can also select either skill from the skill picker. Automatic startup loading depends on host hook support and trust settings; explicit skills remain available when hooks are disabled. PlanET has no cloud backend, telemetry, or runtime dependencies. Model inference is handled by your coding agent.

## Principles

1. **Choose the suitable design pattern.** Start with the existing mechanism or a direct implementation. Justify a new abstraction by the current problem it solves, not a pattern name.
2. **Keep related logic together.** Give behavior and state a clear owner. Inline meaningless private wrappers; preserve useful domain rules, boundaries, and lifecycles regardless of caller count.
3. **Extend before replacing.** Inspect existing capabilities, callers, and tests. Reuse extension points, state, and error semantics; require evidence before replacing them.
4. **Think in systems.** Trace affected inputs, outputs, state, failures, and compatibility. Check whether one plausible follow-up change would remain local, without implementing that future feature.
5. **Design first and secure write authorization.** Present a grounded design with module responsibilities and affected contracts before modifying code. Obtain explicit authorization for its scope; reuse existing approval and realign if the scope changes.
6. **Minimize trivial interruptions.** Inspect repository facts independently. Batch consequential questions with recommendations and trade-offs; use a visual companion only when seeing helps.
7. **Name things by their role.** Use domain vocabulary for actions and actual responsibilities. Preserve established public APIs, attribution, and meaningful algorithm, protocol, or version names.

The policy lives in [the PlanET skill](skills/planet/SKILL.md). Host adapters load that same policy instead of maintaining separate versions. Naming guidance does not claim to modify hidden model internals or remove upstream attribution.

The principles are language-agnostic. Your agent uses the repository's existing compiler, test runner, formatter, and conventions; PlanET provides engineering guidance rather than a language-specific toolchain.

The working sequence is **Inspect → Design → Authorize → Implement → Simplify → Verify**. Before writes, the agent replays your goal, acceptance conditions, constraints, and decisions, then explains existing capabilities/gaps, proposed owners/contracts, structural choices, verification, and write scope. Small changes need only a few sentences, not mandatory plan files or interviews. Review-only requests stay review-only.

## Code quality: CUPID and simple design

The seven principles guide the agent's actions. [Dan North's CUPID](https://dannorth.net/blog/cupid-for-joyful-coding/) describes the code properties those actions should improve:

| Property | What to inspect |
| --- | --- |
| **Composable** | Intention-revealing interfaces, necessary dependencies, and little hidden setup or ordering knowledge |
| **Unix philosophy** | A coherent purpose for callers, with related behavior kept together |
| **Predictable** | Explicit results, state changes, side effects, errors, and relevant operational limits |
| **Idiomatic** | Established language, ecosystem, and repository conventions |
| **Domain-based** | Business vocabulary, rules, and ownership that reflect the problem |

Use [Kent Beck's simple-design rules](https://martinfowler.com/bliki/BeckDesignRules.html) to resolve trade-offs: satisfy meaningful behavior tests, reveal intent, remove duplicated knowledge, then remove unnecessary elements. Fewer classes, functions, files, or lines are not independently better.

Evaluate the design and actual diff, not whether the agent names these frameworks. A plausible follow-up change helps assess maintainability: can it be made locally without copying policy or breaking existing behavior? Authorization and unnecessary questions are process measures, separate from code quality. [Design guidance](skills/planet/references/design.md) and [examples](skills/planet/references/examples.md) make these checks concrete.

## User alignment and independent evaluation

Extend existing capabilities, including unfinished features, before introducing another implementation. Replacement needs evidence that an existing limitation blocks the requested outcome, that local repair is insufficient, and that compatibility/migration is addressed. Unrelated old defects do not justify a rewrite.

The agent distinguishes your decisions from its recommendations and assumptions. Consequential outcome, contract, or scope changes return to you; corrections and rejected choices are not approval. Technical readiness and write authorization are separate judgments.

After implementation, the skill calls for a separate read-only reviewer when the host supports it and operator/project instructions permit delegation. The reviewer inspects actual code, callers, diff, user decisions, and checks using the [shared evaluation standard](skills/planet/references/evaluation.md). Each principle has evidence-based coverage ratios or violation counts with named units; missing evidence is unknown, and empty denominators are not full marks. Repeated evidence can be grouped without hiding omissions. There is no reassuring weighted total that cancels a regression or unauthorized change.

The implementing agent reconciles findings, repairs within approved scope, and obtains focused re-review. A reviewer cannot authorize writes or expand the design. When delegation is unavailable or disallowed, report that limitation; self-check is not independent review. This is a workflow instruction, not a bundled subagent runtime or a mechanical write gate.

## Evaluation in your project

PlanET applies the evaluation loop to your actual changes, not only to its own benchmark cases. Your agent uses your project's compiler, tests and static checks, maps acceptance and preserved contracts to real assertions, reviews the diff, and repairs confirmed findings within the approved scope. It reports useful coverage and material unknowns rather than a universal code-quality score. A permitted independent reviewer checks the current artifacts; later fixes need current verification and focused re-review.

An optional [evidence recorder](skills/planet/references/evidence.md) ships inside the core skill. With Node.js 22+ and Git, it snapshots the initial working tree, records explicitly authorized native commands, and flags stale check/review evidence. It works from your repository without a PlanET checkout or dependency installation; artifacts stay outside your source repository. It does not authenticate approval, enforce a sandbox or certify that model judgments are true. Without it, the same workflow uses native host evidence and discloses limitations. Small tasks need concise results, not mandatory report files.

## Skill structure and context cost

- **`planet`** holds the shared engineering policy loaded by startup adapters when enabled. Its compact body combines CUPID properties, simple-design trade-offs, seven operating principles, and a concrete execution contract.
- **`planet-visual`** is loaded when diagrams, layout previews, or visual comparisons help. Its full instructions are not included in the startup policy.
- **Reference documents** are linked with explicit reading conditions, so detailed design guidance and screen schemas are consulted only when relevant.

Whitespace cleanup reduces formatting overhead, not the amount of guidance. Fewer lines do not imply proportionally fewer tokens; actual token counts depend on the model's tokenizer.

## Pi prompt-prefix stability

PlanET snapshots its shared instructions once when the extension loads. In current Pi, it contributes one stable `planet` system-prompt section, leaving the host's existing sections and tools intact. Repeated turns use identical content and ordering; an unchanged section produces no new section delta. After compaction, the same section is restored. Reload the extension to adopt policy edits.

For older Pi, or a prompt forced by another extension, PlanET appends the same stable text to the existing prompt and avoids duplicate appends. It never inserts synthetic user messages into conversation history, prepends changing instructions, or injects session IDs, timestamps, screen content, or progress into the prefix.

This avoids cache invalidation caused by PlanET itself. Actual cache hits still depend on the provider, model, cache lifetime, other extensions, tools, and history; the plugin cannot promise a cache-hit percentage.

## Visual workspace

The visual workspace is a lightweight companion board, not a browser-based IDE or diagram editor. PlanET provides an optional [style template](skills/planet-visual/assets/style-template.html) and local display/confirmation infrastructure, not a prescribed content layout. The agent chooses authored HTML, concrete examples, architecture/data-flow diagrams, or comparisons according to what helps you understand the implementation. The native flowchart renderer is optional; HTML/SVG can express structures it cannot. Detailed discussion, code review, and editing stay in conversation, terminal, or native IDE. Screens distinguish **views** from **decisions**:

- A **view** explains a design or shows a result while authorized work continues. The example below maps the existing export path and its Markdown extension, with the proposed implementation and design rationale alongside it.

![PlanET view mode showing the existing export flow, its Markdown extension, and a focused implementation](assets/visual-view.svg)

- A **decision** requests a consequential choice or scoped write approval. Review the alternatives, then explicitly submit your direction or feedback. The example below compares two navigation layouts. Neither option is preselected. A request to revise or a rejection does not grant write authorization.

![PlanET decision mode comparing sidebar and top navigation with a response field and explicit confirmation](assets/visual-decision.svg)

Ask the agent to show a design or comparison, then open the local link it shares. The agent prepares and updates the visual workspace. A view needs no reply. For a decision, review the alternatives, confirm your choice, and return to the conversation to continue.

The workspace runs locally and supports agent-authored static HTML/SVG, examples, read-only code previews with file/symbol context, and written feedback. The style template contains presentation styles only; content and layout remain the agent's choice. Scripts and remote assets remain disabled in preview frames. Request adjustments in conversation; the agent updates the board. Submitted responses survive refresh, but do not automatically start an agent turn or imply approval. Only explicit approval of the presented design grants scoped write authorization, not permission to commit, push, deploy, or expand scope. Without a local browser, use conversation or a static preview.

## Identity and terminal display

The identity pairs a simple orbital mark with the **PlanET** wordmark. The name and capitalization carry the identity even when color and graphics are unavailable. All image assets are SVG. The README centers a self-contained, transparent SVG banner with a tightly fitted canvas. Terminal output uses text or a tiled wordmark.

- [Light logo](skills/planet-visual/public/logo.svg), [dark logo](assets/logo-dark.svg), and [monochrome logo](assets/logo-mono.svg).
- [Standalone icon](assets/icon.svg) and [monochrome icon](assets/icon-mono.svg).
- [Brand guide and preview](assets/README.md).

```sh
node scripts/logo.mjs                 # Compact wordmark; color on a capable TTY
node scripts/logo.mjs --banner        # Optional seven-row color-block banner
node scripts/logo.mjs --no-color      # Plain text
node scripts/logo.mjs --color         # Explicit ANSI color for a preview
```

The renderer respects `NO_COLOR`, `TERM=dumb`, redirected output, and narrow TTYs. True-color terminals use a coordinated three-color palette; 256-color and basic ANSI terminals receive the closest available treatment. Colored banners use background-colored spaces; without color, solid Unicode blocks preserve the letterforms. Dumb terminals use plain `PlanET`. No special font or image protocol is required. Display is opt-in and never enters agent prompts or startup output.

## Development and verification

Clone the repository:

```sh
git clone https://github.com/ecstayalive/PlanET.git
cd PlanET
```

Try the checkout for one session with `claude --plugin-dir .` or `pi -e .`. For Codex, use `codex plugin marketplace add .`, then `codex plugin add planet@planet` and start a new session.

To use only the skills, copy the complete `skills/planet` and `skills/planet-visual` directories into your agent's skills directory. This does not install the startup adapters; standalone Codex names are `$planet` and `$planet-visual`.

No `npm install` is needed. Run the checks:

```sh
npm run check
npm test
claude plugin validate --strict .claude-plugin/plugin.json
claude plugin validate --strict .claude-plugin/marketplace.json
```

Checks cover package metadata, skill references, script syntax, host adapters, visual protocol invariants, and the evidence recorder's behavior against temporary user repositories. These tests do not evaluate generated application code. [Behavioral evaluations](evals/README.md) separately compare no-skill, current-skill, and candidate-skill runs using the design, actual diff, behavior tests, and selected follow-up changes. The cases are an evaluation design, not reported model results: a valid package does not prove the model will follow its instructions or produce maintainable code.
