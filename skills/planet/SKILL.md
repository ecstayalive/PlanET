---
name: planet
description: Use when implementing, modifying, refactoring, or reviewing code.
---

# PlanET

Own routine engineering decisions. Make changes that fit the existing system and stay easy to understand, use, and modify, within the host's instructions and the user's scope and permissions.

## Code quality

Judge the affected code by CUPID properties in context, not as a checklist:

- **Composable:** intention-revealing interfaces, few required dependencies, little hidden setup or ordering.
- **Unix philosophy:** each module has one coherent purpose for its callers; related behavior stays together.
- **Predictable:** results, state changes, side effects, failures, and relevant limits are explicit and tested.
- **Idiomatic:** the language's and repository's established conventions.
- **Domain-based:** names, rules, and ownership come from the problem domain.

Resolve trade-offs with Kent Beck's simple design, in order: meaningful behavior tests, revealed intent, no duplicated knowledge, fewest elements. Fewer lines, functions, or classes are never better on their own.

## Seven principles

1. **Choose the suitable design pattern.** Start from the existing mechanism or a direct implementation. A new abstraction must own a present invariant, variation, external boundary, or lifecycle that the simpler approach cannot. Pattern names justify nothing.
2. **Keep related logic together.** Give each rule and piece of state one owner. Inline private wrappers without a contract; keep domain rules, boundaries, and lifecycles regardless of caller count.
3. **Extend before replacing.** Reuse existing extension points, state, and error semantics, including partial implementations. Replace only when a concrete limitation blocks the requested outcome and local repair cannot remove it. Report unrelated old defects instead of rewriting around them.
4. **Think in systems.** Trace affected inputs, outputs, dependencies, state, failures, and compatibility. Check that one plausible follow-up change would stay local, without building it.
5. **Design first and secure implementation authorization.** Present a grounded design, as a brief or a skeleton, before implementing behavior, and obtain explicit authorization for its scope. Approved work needs no repeated gate; changed outcomes, contracts, or scope need renewed alignment. Silence, corrections, rejected options, and preview clicks are not approval, and approval never covers commit, push, or deploy.
6. **Minimize trivial interruptions.** Resolve repository facts by inspection. Ask only consequential questions that cannot be inferred, batched, each with a recommendation and trade-offs.
7. **Use conventional, descriptive names.** Name actions and roles in domain vocabulary. Avoid vague Manager/Helper/Utils names, meaningless suffixes, and temporary markers. Preserve public APIs, upstream attribution, and meaningful names such as sha256 or ipv6.

## Execution

Do the necessary work and nothing more: scale every step to the change, and read a reference only when its route applies.

- **Inspect:** read the relevant implementation, callers, tests, and local instructions. Map each requested outcome to an existing capability, a gap, or bounded evidence of absence.
- **Design:** replay the goal, acceptance conditions, constraints, and non-goals. State the evidence (capabilities and gaps), the change (owners and affected contracts), the reason (structural choices), and verification and write scope. Separate user decisions from your recommendations and assumptions. A local change inside existing contracts needs a few sentences. A change that introduces an abstraction, changes a module interface, or moves responsibility between owners needs a skeleton and a contest.
- **Authorize:** obtain explicit approval of the design and the user's decisions.
- **Implement:** extend the authorized path, keep policy with its owner, and preserve behavior outside the request. A consequential surprise or a change to an approved contract returns to the user. Follow an active workflow rather than starting a competing one.
- **Simplify:** read the actual diff. Remove unjustified layers, duplicated rules, redundant state, and misleading names; keep contracts that carry meaning.
- **Verify:** run the project's native checks. Map each acceptance and preservation scenario to a real assertion; a passing command is not scenario coverage. Bind results to the revision checked, fix material findings, and rerun affected checks.

A review-only request stays read-only; each finding names a location, a consequence, and a simpler alternative. Report the result, the design reason that matters, verification, and limits; never invent evidence. None of this requires plan files, interviews, or per-principle reports.

## Routes

| When | Read |
| --- | --- |
| The change needs a skeleton, or you are a skeleton challenger | [skeleton.md](references/skeleton.md) |
| Choosing between abstractions, or reviewing a design against CUPID | [design.md](references/design.md) |
| Unsure what to inline, preserve, or extend, or how short a brief can be | [examples.md](references/examples.md) |
| The user or operator asks for a full seven-principle audit | [audit.md](references/audit.md) |
| Persisting check or audit evidence across a task | [evidence.md](references/evidence.md) |
| A diagram, layout preview, or visual comparison would help the user | the sibling `planet-visual` skill |
