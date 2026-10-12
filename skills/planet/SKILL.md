---
name: planet
description: Use when implementing, modifying, refactoring, or reviewing code.
---

# PlanET

Own routine engineering decisions. Make changes that fit the existing system and remain easy to understand, use, and modify. Apply this guidance to code, tests, scripts, configuration, and repository layout within the host's instructions and the user's scope and permissions.

## Code quality: CUPID

Assess the affected code through these properties, not a quota of patterns or a universal score:

- **Composable:** Keep interfaces intention-revealing, with few required dependencies and little hidden setup or ordering knowledge.
- **Unix philosophy:** Give each module a clear, coherent purpose from its caller's perspective; keep related behavior together rather than fragmenting it into tiny pieces.
- **Predictable:** Make results, state changes, side effects, and failure behavior explicit and verifiable, including relevant operational limits.
- **Idiomatic:** Follow the language, ecosystem, and repository's established conventions unless a concrete problem justifies a change.
- **Domain-based:** Express rules, names, and module ownership in the problem domain, not generic technical wrappers.

## Simple design

Use Kent Beck's simple-design rules as a trade-off order: satisfy meaningful behavior tests, reveal intent, remove duplicated knowledge, then remove unnecessary elements. Fewer classes, functions, files, or lines are not independently better; retain elements that protect the earlier goals.

## Seven operating principles

1. **Choose the suitable design pattern.** Start with the existing mechanism or a direct implementation. For a new abstraction, identify the current invariant, variation, external boundary, or lifecycle it owns and why the simpler approach is insufficient. Pattern names alone justify nothing.
2. **Keep related logic together.** Assign behavior and state to a clear owner. Inline short private wrappers without a meaningful contract; preserve domain rules, external boundaries, lifecycles, and useful reuse regardless of caller count.
3. **Extend before replacing.** Read the existing capability, callers, and tests. Reuse its extension point, state, and error semantics. Replace only with evidence that its contract cannot meet the requirement; avoid parallel implementations.
4. **Think in systems.** Trace affected inputs, outputs, dependencies, state owners, failures, and compatibility. Consider one plausible follow-up change: can it stay local without copying policy or synchronizing redundant state? Preserve that seam without building the hypothetical feature.
5. **Design first, clarify boundaries, and secure write authorization.** Present a grounded design before modifying code. Obtain explicit authorization for that design's scope; approved work needs no repeated gate, but consequential scope changes need renewed alignment. Silence, elapsed time, and mere preview interactions are not authorization.
6. **Minimize trivial interruptions.** Resolve repository facts by inspection. Ask only about consequential choices that cannot be inferred; batch questions with a recommendation and trade-offs. Use conversation and native tools for refinements, and a visual companion only when seeing helps.
7. **Use conventional, descriptive names.** Name actions and actual roles using domain vocabulary. Avoid vague Manager/Helper/Utils names, meaningless suffixes, model signatures, and temporary markers. Preserve established public APIs, upstream attribution, and meaningful algorithm, protocol, or version names such as sha256 and ipv6.

## Execution contract

- **Inspect:** Read the relevant implementation, callers, tests, and local instructions. Map the user's outcomes to existing capabilities, including partial ones, and locate their owners and extension points. Extend these first. Any replacement must identify a concrete limitation blocking the requested outcome, why local repair is insufficient, and how compatibility is preserved; unrelated old defects do not authorize a rewrite.
- **Design:** Replay the user's goal, observable acceptance conditions, constraints, and non-goals. Present **evidence** (existing capabilities and gaps), **change** (owners and affected contracts), **reason** (structural choices), and **verification/scope** (checks and proposed write boundary). Distinguish user decisions from agent recommendations and assumptions. Resolve consequential differences with the user; small tasks need only a few sentences. Each behavior change needs an owner and understood dependencies, state, errors, and compatibility.
- **Authorize:** Obtain explicit write authorization for the presented design and user decisions in conversation or a confirmed visual decision. A request for adjustments or a rejected option is not approval. Reuse matching approval; changed outcomes, contracts, or scope require renewed alignment. Approval does not grant permission to commit, push, deploy, or expand scope.
- **Implement:** Extend the authorized path. Keep policy with its owner and preserve behavior outside the request. Follow another active workflow rather than launching a competing one.
- **Simplify:** Inspect the actual diff against CUPID and simple design. Remove unjustified layers, duplicated rules, redundant state, and misleading names. Keep valuable contracts; explain any remaining consequential trade-off with concrete evidence.
- **Verify:** Apply [evaluation.md](references/evaluation.md) to this user task: use the project's native checks, map acceptance/preservation scenarios to real assertions, and bind evidence to the actual source revision. Fix material findings and rerun affected checks; report useful coverage, uncertainty and review limits. A review finding identifies a location, consequence, and simpler alternative. Command success is not scenario coverage or proof of maintainability.

## Independent evaluation

After code implementation, obtain a separate, read-only agent's review when the host supports it and operator/project instructions permit delegation. Give it the user decisions, exact design/scope, baseline and diff, code/callers, and check evidence; use [evaluation.md](references/evaluation.md) for measurable criteria and the handoff. It inspects the artifacts independently, not just the implementer's summary. Reconcile findings, fix within approved scope, and recheck affected evidence; scope-changing fixes return to the user. If delegation is unavailable or disallowed, disclose the limit: self-check is not independent review. Neither a reviewer verdict nor a score grants user authorization.

These are internal habits, not mandatory documents, interviews, commits, or seven-item user reports. Group repeated evidence without hiding omissions. A review-only request stays read-only. In the final response, state the result, useful design reason, verification, and review limits; never invent evidence.

## Conditional resources

- Read [design.md](references/design.md) when choosing an abstraction, changing a module interface, or evaluating CUPID trade-offs.
- Read [examples.md](references/examples.md) when deciding what to inline, preserve, extend, or include in a design brief.
- Load the sibling `planet-visual` skill for helpful diagrams, layout previews, or visual comparisons. It is an optional local companion board, not an editor or an automatic approval pause.
