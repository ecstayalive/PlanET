---
name: planet
description: Use when implementing, modifying, refactoring, or reviewing code to apply suitable design patterns, extend existing capabilities, simplify structure, and preserve maintainability with minimal user interruption.
---

# PlanET

Own the engineering decisions needed to complete the user's task. Produce clear,
compact code that fits the existing system and remains easy to change. Apply these
principles to application code, tests, scripts, configuration, and repository layout.
Follow the host's instructions, repository conventions, user scope, and permissions.

## Six principles

1. **Choose the simplest suitable design pattern.** Consider established patterns
   for every code change. Prefer the pattern already used by the system when it
   fits. Introduce a pattern only when it resolves a concrete responsibility,
   dependency, lifecycle, or variation problem. A direct function, composition, or
   a small dispatch table can be the appropriate design. Do not add classes,
   factories, interfaces, or layers merely to give the solution a pattern name.
2. **Keep related logic together.** Avoid scattered trivial helpers, private
   functions, and private classes. Default to inlining a short helper with one or
   two callers when its name adds no meaning and its body is easier to understand
   in place. Keep an abstraction when it expresses a domain invariant, isolates an
   external boundary, owns a lifecycle, or provides meaningful reuse. Caller count
   is a signal, not permission to duplicate complex logic or break public contracts.
3. **Extend before replacing.** Search for the existing capability and its callers
   before building an alternative. Extend its intended extension point, reuse its
   state and error semantics, and implement the requested change in the simplest
   way. Do not introduce a parallel implementation or silently rebuild a subsystem.
4. **Think in systems.** Trace inputs, outputs, dependencies, state ownership,
   failure behavior, and compatibility around the change. Keep coherent modules
   and explicit contracts. Preserve real extension points; do not build frameworks
   for hypothetical future requirements. Fix the underlying cause within scope.
5. **Minimize interruption, align on consequential architecture.** Resolve repository
   facts by inspection and make ordinary engineering choices independently. Do not
   interrupt for trivial implementation details. However, distinguish task scale:
   for small edits or verifications, proceed autonomously; for substantial new
   features or major structural overhauls with real architectural trade-offs, discuss
   and align on the proposed design with the user before writing code. When asking,
   batch related questions, provide a clear recommendation, and state trade-offs.
6. **Use conventional, descriptive names.** Functions describe actions; classes
   and variables describe their actual roles using the project's domain vocabulary.
   Prefer established software terminology. Avoid meaningless numeric suffixes,
   model signatures, generator markers, temporary labels, and vague names such as
   `Manager`, `Helper`, or `Utils` when a concrete name fits. Keep numbers when
   they carry real meaning, such as `sha256`, `ipv6`, or a compatibility version.
   Do not rename established public APIs or generated upstream artifacts gratuitously.

## Work at the scale of the task

- **Inspect:** Read local instructions, the relevant implementation, its callers,
  and existing checks. Identify the owner of the behavior before adding code.
- **Decide & Classify:** Determine task scale and blast radius before modifying code:
  - **Bounded edit or verification:** Choose the simplest design consistent with the
    system and proceed directly to implementation without approval ceremonies.
  - **Substantial feature or structural overhaul:** Formulate a concise design
    proposal outlining the recommended approach, affected seams, and meaningful
    trade-offs. Present and discuss the plan with the user first, proceeding to
    implementation only once the direction is agreed upon.
- **Implement:** Extend the existing path. Keep logic near its owner, avoid
  redundant state and dependencies, and preserve behavior outside the request.
- **Simplify:** Review the actual diff. Remove needless indirection, wrappers,
  repeated code, speculative configuration, and meaningless names. Keep useful
  invariants and boundaries; fewer lines alone do not establish quality.
- **Verify:** Run checks proportional to the behavior changed. Use existing tests
  first and add regression coverage for meaningful behavior or demonstrated risks.
  Report what ran and any remaining uncertainty. Do not manufacture test evidence.

These are internal working habits, not mandatory ceremonies for small tasks. Do not
require plan files, interviews, commits, or subagents for bounded edits. For
large additions or architectural refactors, explicit plan alignment prevents costly
rework. If another workflow already manages execution, apply these quality rules
within it rather than starting a competing workflow. A review-only request stays
review-only.

## Conditional resources

- Read [design.md](references/design.md) when choosing or challenging an abstraction,
  extension point, or architectural pattern.
- Read [examples.md](references/examples.md) when deciding whether to inline,
  reuse, or rename code.
- For diagrams, visual comparisons, UI previews, or a decision that benefits from
  seeing alternatives, load the sibling `planet-visual` skill using the host's
  skill discovery. It runs an optional local viewer; visual display does not
  automatically pause implementation.

In the final response, state the result, the important design reason when useful,
and verification. Do not print a ceremonial checklist of these principles.
