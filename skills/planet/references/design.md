# Design decisions and evidence

## CUPID in a real change

CUPID describes code properties to improve in context, not five independent pass/fail rules. Assess the changed module and its callers; report material trade-offs, not an acronym checklist.

| Property | Check in the design and diff | Evidence or warning sign |
| --- | --- | --- |
| Composable | Can a caller use the interface without learning its internals? Are setup, ordering, and dependencies necessary and visible? | A small coherent contract is useful; several tiny methods with a secret invocation sequence are not. |
| Unix philosophy | Does the module have one coherent purpose for its callers? Do related rules change together? | A change has a clear owner; a single-purpose operation is not split into pass-through classes. |
| Predictable | Are results, state ownership, side effects, errors, and relevant limits explicit? | Behavior tests cover normal and meaningful failure paths; a retry policy does not silently duplicate effects. |
| Idiomatic | Does the change follow established language and project conventions? | Extends the existing dispatch/error style instead of introducing a second framework. |
| Domain-based | Do names, rules, and ownership express the problem being solved? | A refund deadline belongs with refund policy, not a generic utility shared with unrelated behavior. |

An interface includes what callers must know beyond a type signature: invariants, ordering, errors, configuration, side effects, and relevant operational bounds. Make affected contracts explicit without documenting unrelated parts of the system.

## Simple design and abstraction choice

Apply simple design in this order: meaningful behavior tests, clear intent, a single source for each rule, then removal of unnecessary elements. This is a working interpretation of Kent Beck's rules, not a numerical minimization target. Passing weak tests is not enough, and inlining a domain rule merely to reduce function count sacrifices intent.

Evaluate the actual problem before reaching for a pattern:

| Observed problem | Suitable direction | Avoid |
| --- | --- | --- |
| A short, stable transformation | Direct function or expression | A class hierarchy around one operation |
| Several real behaviors share a contract | Existing strategy mechanism or a dispatch table | A factory and registry with one implementation |
| An external API differs from the domain | Adapter at the integration boundary | Provider conditionals scattered through business code |
| Construction has real lifecycle/configuration rules | Existing factory or explicit construction | Dependency containers for ordinary local objects |
| State transitions have distinct rules | Explicit state machine | Boolean combinations with ambiguous transitions |
| An established feature needs one more case | Extend its current extension point | A second pipeline with duplicated policy and state |

For a proposed abstraction, state its present responsibility, the complexity it hides, and its cost to callers. Imagine removing it: does complexity vanish, or does a meaningful rule, boundary, or lifecycle become scattered? Keep the abstraction in the latter case. Do not require multiple implementations when a real invariant or external boundary already justifies the contract.

Check callers, tests, error behavior, state ownership, and compatibility before extending code. Include partial implementations in the capability inventory: identify the missing behavior and extend or repair the existing owner first. If it cannot meet the requirement, make the smallest justified refactor. A replacement needs an observed limitation tied to the requested outcome, an explanation of why local repair is insufficient, and a compatibility/migration plan. Unrelated pre-existing defects are separate findings, not justification to rebuild the system.

## Design completion and review

Replay the user's intended outcomes, observable acceptance conditions, constraints, and non-goals before presenting the change. Distinguish actual user decisions from assumptions, agent recommendations, and delegated implementation details. Resolve consequential differences in conversation rather than choosing an unapproved default. A design brief then grounds the change in existing capabilities and gaps, assigns changed behavior to owners, explains affected contracts, and identifies verification and write scope. Small tasks need only a few sentences; do not invent interfaces or documents to fill a template.

Before writes, obtain authorization for the presented design and decisions. A correction request or rejected option is not approval. While implementing an approved design, a visual is a view unless a new consequential choice is needed. Its format can be HTML, an example, or a diagram; it explains the design rather than defining the engineering process. A substantive outcome/contract/scope change returns to alignment; a minor detail inside the approved contract does not need another approval.

For maintainability, choose one plausible follow-up change and locate where it would belong. Check whether it would duplicate policy or require coordinated changes to independent owners. Preserve a useful seam without implementing that future feature. Fewest files, lowest complexity, or highest coverage alone cannot establish quality.

A review finding needs a concrete location, consequence, and simpler alternative. For example: two exporters define the same validation rule, so a validation change can produce inconsistent errors; put both behind the existing validation path. "Violates SOLID", "needs a strategy pattern", or "is not CUPID" is not evidence.

## Review using the shared standard

Use [evaluation.md](evaluation.md) for the seven principles' counting rules, CUPID/simple-design mapping, user-decision checks, and independent-agent handoff. Review the actual code and diff against a fixed scope and revision; author explanations alone are not evidence. Group repeated evidence without reducing coverage. Keep technical readiness and user authorization separate, and disclose missing review capability rather than relabeling self-review as independent assessment.

## Sources

- [Dan North: CUPID for joyful coding](https://dannorth.net/blog/cupid-for-joyful-coding/) defines the five properties and their contextual trade-offs.
- [Martin Fowler: Beck's four rules of simple design](https://martinfowler.com/bliki/BeckDesignRules.html) discusses correctness, intention, duplication, and unnecessary elements.
- [Martin Fowler: Yagni](https://martinfowler.com/bliki/Yagni.html) distinguishes speculative capabilities from work that makes code easier to change.
- [Google engineering practices: What to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html) provides concrete checks for design, complexity, tests, and names.
