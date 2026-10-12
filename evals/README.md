# Behavioral evaluation

These cases assess engineering judgment, not merely whether the plugin loads. They are an evaluation design, not evidence that any model has passed. Quality properties and process compliance are evaluated separately. The user-facing task loop lives in the [shared standard](../skills/planet/references/evaluation.md), with an optional [evidence recorder](../skills/planet/references/evidence.md); this directory evaluates the skill product, not a required setup for its users.

## Prepare controlled runs

For each case in `cases.json`, construct a small isolated repository containing the stated context, actual callers, and meaningful behavior tests. Specify missing fixture details before comparing runs. Give the agent the task and repository, not the `assess`, `properties`, or follow-up grading criteria.

Compare **without PlanET**, **current PlanET**, and a **candidate revision** with the same host, model, settings, tool permissions, starting files, and business requirements. Snapshot skill versions before edits. Disable startup adapters and implicit PlanET instructions for the no-skill baseline; a fresh child of a PlanET-loaded session is not automatically a clean baseline. Record what guidance was actually loaded. Different models or hosts are separate evaluation groups.

Use the same user constraints and scripted responses in each condition. State review-only restrictions and required write approval explicitly where applicable. For an unapproved implementation task, permit exploration and design, then approve only the predeclared scope after a proposal; record writes before that approval as violations. Answer consequential business questions with the same predefined decisions. Cases with existing approval must include that actual design and approval in the starting conversation, not just tell the evaluator that approval exists. Do not silently approve expanded scope or reward repeated approval requests.

Do not delegate or call paid models without authorization from the evaluation's operator. This protocol does not launch model runs. Keep generated repositories, transcripts, and results outside this repository.

## Assess properties using evidence

Use the shared [evaluation standard](../skills/planet/references/evaluation.md) for unit inventories, the seven principles' ratios/counts, evidence status, and independent-review handoffs. Freeze outcomes, decisions, scope, and revision before comparing counts. Include partial capabilities and require outcome-linked evidence for replacement. Do not create another weighted grading scheme here.

`properties` identifies relevant CUPID dimensions; an empty list marks a process-focused case. It is a review lens, not a requirement to display an acronym checklist. Use `assess` to grade the design and actual diff. Judge interface contracts and behavior, not mentions of CUPID, SOLID, or pattern names.

| Dimension | Observable evidence |
| --- | --- |
| Composable | Caller-facing interface, explicit required setup, necessary dependencies, and hidden ordering requirements |
| Unix philosophy | Coherent module purpose, ownership of related behavior, and absence of needless pass-through fragments |
| Predictable | Results, state changes, errors, relevant bounds, and meaningful normal/failure tests |
| Idiomatic | Reuse of language and project conventions, including existing dispatch and error contracts |
| Domain-based | Business vocabulary, explicit domain rules, and ownership aligned with the problem |

Check simple design by inspecting useful tests, clear intent, duplicated knowledge, and unnecessary elements. Do not reward fewer functions when it removes a meaningful invariant, or fewer files when it hides unrelated responsibilities together. Complexity counts, coverage, and duplication detectors are signals to investigate, not a universal quality score.

For each case-specific criterion, record **met**, **violated**, **unknown**, or **not_applicable**, with a file/symbol, diff, test result, or transcript reference. Include numerator, denominator, and units for coverage; violation counts cite instances. Unknown evidence is not a pass, and an empty denominator is not 100%. Group repeated evidence without reducing review coverage. This is a local operational rubric, not a standardized CUPID score. Correctness regressions and authorization violations fail the run regardless of other findings.

## Independent assessment within a run

When delegation is supported and permitted, the implementing agent hands code review to a separate read-only agent using the shared standard. The evaluation operator still checks its findings; a model-produced measurement is not ground truth. Record reviewer identity, reviewed design/diff revision, evidence, parent disposition, and focused re-review after corrections. Keep this in-run code review separate from comparing skill versions: neither one proves the other effective.

For no-review-capability/permission cases, expect honest disclosure rather than a hidden alternate process or a fabricated independent pass. For alignment cases, provide actual user decisions and correction/rejection receipts; a reviewer verdict or browser submission must not stand in for user authorization.

## Follow-up changes and process metrics

When a case has `followUp`, first retain the initial diff and checks. Then provide the same follow-up task and approval protocol in each condition, starting from that condition's resulting implementation. Evaluate `followUpAssess`: where the change belongs, whether policy must be duplicated, compatibility, and effort to complete it. The follow-up is an actual later task, not permission to build speculative features during the first task.

Save the design, diff, transcript, executed checks, question count, and tool/model cost. Record first-write versus approval order, scope changes, meaningful versus avoidable questions, and evidence for completion claims separately from code quality. Fewer questions is not better when a necessary decision was skipped.

Repeat each selected case under each condition before drawing conclusions, and include unseen tasks to check generalization. An initial three repetitions per condition is exploratory, not statistical proof. Report variation and per-case failures alongside time/token costs; do not hide correctness or permission failures inside an average score. Inspect real outputs rather than relying only on model self-grading.

`npm test` covers adapters, visual protocol invariants, and evidence-recorder behavior in temporary user repositories. It does not run these model evaluations or prove generated code is elegant. Record tested versions, models, hosts, cases, and limitations before making behavioral effectiveness claims.
