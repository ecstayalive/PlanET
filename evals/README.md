# Behavioral evaluation

These cases test whether PlanET leads a model to write more elegant code at an acceptable context cost. They are an evaluation design, not evidence that any model has passed. This directory evaluates the skill product; users need none of it.

No industry standard measures code elegance. [ISO/IEC 25010](https://iso25000.com/index.php/en/iso-25000-standards/iso-25010/57-maintainability) names maintainability's characteristics without scoring them, and static metrics often contradict each other. Recent work measures what maintainability costs: the effort of later changes ([MaintainCoder](https://arxiv.org/abs/2503.24260)) and repository health across dependent changes ([SWE-STEPS](https://arxiv.org/abs/2604.03035)). These cases follow that approach.

## Prepare controlled runs

For each case in `cases.json`, build a small isolated repository with the stated context, real callers, meaningful behavior tests, and hidden tests the agent never sees. Write the case's `reference` solution in that repository's terms before any run. Give the agent the task and repository only, never `route`, `reference`, `assess`, or follow-up fields.

Compare **without PlanET**, **current PlanET**, and a **candidate revision** with the same host, model, settings, tool permissions, starting files, and scripted user responses. Snapshot skill versions before edits. Disable startup adapters and implicit PlanET instructions for the no-skill baseline; a fresh child of a PlanET-loaded session is not a clean baseline. Different models or hosts are separate groups.

Script the user identically in each condition. For an unapproved implementation task, permit exploration, design, and a skeleton within the task's paths, then approve only the predeclared scope; behavior implemented before approval is a violation, and so is any write when the scripted user forbids writes. Answer consequential business questions with the same predefined decisions. Cases with existing approval must include that design and approval in the starting conversation.

Do not delegate or call paid models without the operator's authorization. This protocol does not launch model runs. Keep generated repositories, transcripts, and results outside this repository.

## Grade in separate tracks

Report each track per case and per condition. Never fold tracks into one weighted score: a correctness or authorization failure fails the run regardless of the rest.

### 1. Follow-up effort (primary)

When a case has `followUp`, keep the initial diff and checks, then give the same follow-up task and approval in each condition, starting from that condition's own result. Measure:

- diff size and the number of distinct owners (modules) the follow-up touches;
- copies of an existing rule the follow-up had to add or edit;
- hidden-test pass rate after the follow-up, for old and new behavior;
- `followUpAssess` criteria, each met or violated with a citation.

Lower effort with preserved behavior is the strongest evidence of elegant structure. Add follow-ups to new cases wherever a natural next change exists.

### 2. Static signals against the reference

Compare the diff with the case's `reference`, read by a person:

- new abstractions, files, and indirection layers beyond the reference (speculative design);
- duplicated rules: copies of a rule the fixture already owns;
- caller burden: required setup steps, ordering constraints, and parameters a caller must supply;
- change in cognitive complexity of touched functions, using one tool across all conditions.

These are signals to investigate, not scores. Exceeding the reference is fine when it buys a stated, real benefit; record the reason. Fewer elements are never better on their own.

### 3. Blind pairwise judgment

Show a judge two anonymized diffs for the same case, plus the task and repository, never the condition or transcript. The judge picks the more maintainable diff or a tie, and must name a location and a concrete consequence (for example, "the deadline rule exists twice in B"). A reason without a consequence counts as a tie. Swap the diff order across repetitions to cancel position bias, and have a person spot-check a sample of judgments, including all disagreements with track 1. A model judgment is not ground truth.

### 4. Process compliance

Grade `assess` criteria as **met**, **violated**, **unknown**, or **not_applicable**, each with a file, diff, test, or transcript reference. Unknown is not a pass. Record first-write versus approval order, scope changes, and necessary versus avoidable questions. Fewer questions is not better when a necessary decision was skipped. For skeleton cases, judge each contest disposition on the code: conceding to a correct challenger is right, conceding to a wrong one is a failure, and so is defending a weaker proposal. Without delegation, expect the user to be offered the skeleton beside a real rejected alternative and an honest statement that no contest took place.

### 5. Necessity and cost

Each case names its expected `route`; `scripts/check.mjs` defines what each route loads and its token budget. Record:

- the PlanET files actually read, against the route's files;
- skeletons, contests, or subagents run on a `small` route case, each a violation;
- total input tokens, cache-read tokens, subagent runs, and wall time from native host usage.

Loading-specific cases cover bootstrap activation, compaction and update restoration, and explicit skill use with an untrusted hook. Grade them only for current and candidate installations. Unrelated non-coding prompts should load no policy or reference bodies.

## Interpret results

Repeat each case under each condition, and include unseen tasks to check generalization. Three repetitions per condition is exploratory, not statistical proof. Report per-case results and variation alongside cost; do not hide failures in an average.

`npm test` covers adapters, visual protocol invariants, and the evidence recorder. `npm run check` enforces route budgets. Neither runs these evaluations or proves generated code is elegant. Record tested versions, models, hosts, cases, and limitations before claiming behavioral effects. For a per-principle audit of a single change, use the [audit rubric](../skills/planet/references/audit.md).
