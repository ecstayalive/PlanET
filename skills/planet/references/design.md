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

## Follow-up locality and review findings

For maintainability, choose one plausible follow-up change and locate where it would belong. Check whether it would duplicate policy or require coordinated changes to independent owners. Preserve a useful seam without implementing that future feature. Fewest files, lowest complexity, or highest coverage alone cannot establish quality.

A review finding needs a concrete location, consequence, and simpler alternative. For example: two exporters define the same validation rule, so a validation change can produce inconsistent errors; put both behind the existing validation path. "Violates SOLID", "needs a strategy pattern", or "is not CUPID" is not evidence. Review the actual code and diff against a fixed scope and revision; author explanations alone are not evidence.

## Sources

- [Dan North: CUPID for joyful coding](https://dannorth.net/blog/cupid-for-joyful-coding/) defines the five properties and their contextual trade-offs.
- [Martin Fowler: Beck's four rules of simple design](https://martinfowler.com/bliki/BeckDesignRules.html) discusses correctness, intention, duplication, and unnecessary elements.
- [Martin Fowler: Yagni](https://martinfowler.com/bliki/Yagni.html) distinguishes speculative capabilities from work that makes code easier to change.
- [Google engineering practices: What to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html) provides concrete checks for design, complexity, tests, and names.
