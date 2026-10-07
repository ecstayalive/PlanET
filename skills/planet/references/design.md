# Design decisions

Evaluate the actual problem before reaching for a pattern:

| Observed problem | Suitable direction | Avoid |
| --- | --- | --- |
| A short, stable transformation | Direct function or expression | A class hierarchy around one operation |
| Several real behaviors share a contract | Existing strategy mechanism or a dispatch table | A factory and registry with one implementation |
| An external API differs from the domain | Adapter at the integration boundary | Provider conditionals scattered through business code |
| Construction has real lifecycle/configuration rules | Existing factory or explicit construction | Dependency containers for ordinary local objects |
| State transitions have distinct rules | Explicit state machine | Boolean combinations with ambiguous transitions |
| An established feature needs one more case | Extend its current extension point | A second pipeline with duplicated policy and state |

For a new abstraction, identify the current pressure it resolves and the cost it
introduces. Keep this reasoning brief; it usually does not need a document or a
question. If removing the abstraction loses no important invariant, boundary, or
reuse, prefer the direct implementation.

When extending existing code, check its callers, tests, error behavior, state owner,
and compatibility contract. If the owner cannot support the new requirement,
make the smallest justified refactor rather than patching around it indefinitely.
Replacing a component can be appropriate when required, but the reason must come
from evidence such as an incompatible contract, not a preference for new code.

Review maintainability by imagining one plausible follow-up change. Identify
where it belongs and whether it requires duplicating policy or synchronizing
multiple sources of truth. Preserve that useful seam without implementing the
follow-up feature. Do not impose arbitrary file-size or function-length limits.

A review finding needs a concrete location, consequence, and simpler alternative.
"Violates SOLID" or "needs a strategy pattern" is not sufficient evidence.
