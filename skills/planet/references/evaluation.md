# Measurable evaluation and independent review

This is PlanET's shared operational rubric for the existing seven principles, not a new principle set or a universal code-quality score. Apply it to the user's actual project and task, not just PlanET benchmarks. A separate reviewer provides independent evidence, not permission to write.

## Close the user's task with evidence

1. Before implementation, identify the requested outcomes, affected contracts and critical scenarios. Inspect the project's native compiler, tests, static checks and conventions; use those tools rather than imposing a language-specific suite. Separate existing defects/edits from this task. Keep the basis in conversation for small changes.
2. In the aligned design, name the acceptance and preservation scenarios, including meaningful error paths and operational bounds. Map them to existing checks or proposed tests within the write scope. Planned checks are not passed checks. Extend useful tests; never weaken assertions to obtain green output.
3. After implementation, inspect the actual diff and execute the agreed checks under host permissions. Bind results to the source revision checked. A command's exit zero is not a count of covered scenarios: cite the assertions and behavior each scenario exercises. For persisted evidence, optionally use the installed [recorder](evidence.md); no project setup or PlanET checkout is required.
4. Give a permitted reviewer the original decisions, baseline, current diff and execution evidence. It independently checks contracts, assertions, failure paths, structural trade-offs and one plausible follow-up's locality. Report code observations separately from command results and predictions. When delegation is unavailable, disclose self-review rather than inventing independent evidence.
5. Reconcile findings against code and user decisions. Repair confirmed issues within scope, rerun affected checks, and obtain focused re-review at the new revision. Unresolved material correctness/contract violations prevent a completion claim; missing critical evidence remains explicitly unverified. Scope-changing fixes return to the user. Stop after the agreed criteria are satisfied, not after a target score or endless optional polish.
6. Give the user a compact closure: what changed and why, preserved behavior, applicable verified scenarios/total with material unknowns, unresolved risks and review limits. Keep detailed counts/citations available for inspection, not a mandatory seven-item report.

The recorder only checks artifact consistency. Real quality still depends on meaningful project checks, independent inspection and user judgment; host permissions and protected artifacts provide stronger boundaries where available. Product-level behavioral benchmarks separately test whether this workflow improves results.

## Freeze the evaluation basis

Before counting, identify the user outcomes and observable acceptance conditions, constraints/non-goals, user decisions, proposed scope, and the exact design revision under review. Keep the record in conversation for small tasks; a document is optional.

Inspect relevant existing capabilities, including unfinished features, their owners, callers, state, errors, and tests. Map each outcome to an existing capability, a missing piece, or evidence of absence within a stated search scope. Classify existing capabilities as reuse, extend, repair, or replace. An incomplete feature is not evidence that the whole design is wrong.

A replacement dossier identifies the requested or approved outcome, the concrete existing limitation blocking it, why extension/local repair is insufficient, and the compatibility/migration plan. Distinguish pre-existing defects from regressions introduced or made reachable by the current change. Report unrelated old defects separately; neither discovering them nor obtaining generic write approval justifies a rewrite.

Give requirement, behavior, contract, abstraction, decision, scenario, and naming groups stable descriptive identifiers as needed. Reviewers independently check the inventory. A newly found relevant unit invalidates a completeness claim: update the basis and recount instead of excluding it to improve a percentage. Keep task/revision and units consistent across compared reports.

## Counting and evidence rules

- For coverage, record `met / total applicable units`. Enumerate or cite the units; the numerator contains only units supported by evidence. Unknown units remain in the denominator and are separately counted. Missing evidence is never success.
- For violation counts, record the concrete instances and locations. If the population cannot be inspected, use an unknown count, not zero.
- A zero denominator is `not_applicable`, not 100%. Explain why the check does not apply. Absence of inspected evidence is `unknown`, not inapplicability.
- Use `met`, `violated`, `unknown`, or `not_applicable` per metric. Partial coverage records the actual fraction rather than an invented ordinal score. These categories operationalize judgment; they do not turn naming or abstraction quality into an objective scientific measurement.
- Complete coverage can be represented compactly. Group identifiers under the same naming rule, related contracts, or code ranges; reuse citations. Inspect all members of the group, document exceptions, and preserve the real unit counts. Ordinary small tasks need only material findings in the user-facing summary, not a report for every variable.
- In design review, count inspected paths and planned verification, not tests purportedly passed. In implementation review, inspect the actual diff, preserved behavior, and execution evidence. Label predicted versus observed evidence explicitly.

## Measures for all seven principles

Metric names below are local identifiers. Coverage targets are 1 for required units within the agreed scope; unjustified changes and missed necessary decisions target 0. Other counts are diagnostic signals whose meaning requires the cited context. Do not optimize counts by changing scope or removing useful contracts.

| Principle | Quantifiable measures | Evidence and interpretation |
| --- | --- | --- |
| P1: suitable pattern | `abstraction-justification`: justified new abstractions / new abstractions; `speculative-elements`: count of elements built only for hypothetical needs | Each new abstraction identifies its present invariant, variation, boundary, or lifecycle and why a direct/existing implementation is insufficient. Count proposed elements for design review and actual elements for implementation review. Retaining a useful external adapter is not a violation. |
| P2: related logic | `owner-coverage`: changed behaviors with clear behavior/state owners / changed behaviors; `invariant-preservation`: preserved relevant domain contracts / relevant domain contracts to preserve; `duplicate-policy-sources`: extra independently maintained copies of the same rule | Inspect owners and meaningful contracts, not just file count. Shared code text is not necessarily shared domain knowledge. A removed private wrapper may be harmless, while inlining canRefund into two callers loses a policy owner. |
| P3: extend first | `capability-inspection`: outcomes mapped to inspected existing capability or bounded absence evidence / outcomes; `capability-disposition`: relevant existing capabilities with a reuse/extend/repair/replace decision / relevant capabilities; `replacement-justification`: complete outcome-linked dossiers / proposed or actual replacements | Include partial implementations. Existing owners, state, validation, and errors should be reused. A dossier must connect the defect to this task and show why incremental repair is insufficient. A newly discovered unrelated flaw is not replacement evidence. |
| P4: systems thinking | `contract-accounting`: affected contracts with relevant facts accounted for / affected contracts; `scenario-coverage`: planned (design) or successfully verified (implementation) critical scenarios / agreed critical scenarios; `follow-up-locality`: count of policy duplications or cross-owner coordination points required by one plausible follow-up | Relevant facts include inputs/outputs, dependencies and invocation order, state ownership, side effects, errors, operational limits, and compatibility. Justify inapplicable facts. Explain where the follow-up would belong without building it; multiple coordinated files can be legitimate, so coordination count is diagnostic, not a universal zero target. |
| P5: design and alignment | `outcome-traceability`: outcomes with acceptance conditions and proposed/approved design mapping / outcomes; `decision-resolution`: resolved consequential decisions / consequential decisions; `scope-deviations`: changes outside approved outcomes/contracts/scope | Cite user decisions and authorization separately from recommendations or assumptions. A delegated engineering detail can be settled by the agent within the agreed contract; a consequential business default must not be presented as user agreement. Approval must match the reviewed design. |
| P6: avoid interruptions | `avoidable-questions`: questions answered by available repository evidence; `missed-decisions`: consequential unresolved decisions silently guessed; `question-quality`: decision questions with a recommendation and relevant trade-offs / decision questions; `unnecessary-rounds`: extra rounds caused by splitting independently answerable questions | Group related questions when possible; sequential discovery can legitimately reveal new questions. Required authorization is not an avoidable question. Lowest question count is not the goal. Use transcript and repository evidence, not assumed preferences. |
| P7: descriptive names | `naming-coverage`: inspected new/changed identifiers or naming groups fitting roles/domain/conventions / new/changed identifiers or groups; `unjustified-contract-renames`: established public/generated/protocol names changed without a task-linked reason | Identify group membership and check its exceptions. Cite domain vocabulary and local conventions. Preserved public/upstream identifiers are not new naming violations; changing them may require compatibility evidence. Record actual naming findings, not a ban on all digits or every use of Manager. |

Required coverage below 1 or an unknown required unit means the specific completeness claim is not established. Material acceptance, correctness, or contract violations require changes. Explicitly accepted trade-offs remain visible in the measurements; they are not relabeled as perfect quality. Do not compute a weighted total that hides individual violations.

### CUPID and simple-design coverage

The same evidence serves these lenses; do not award extra points for naming the framework:

| Lens | Reuse these measures and facts |
| --- | --- |
| Composable | P1 justification; P4 interface/dependency/ordering accounting; P3 existing integration paths |
| Unix philosophy | P2 coherent owners and invariant preservation; P1 unnecessary fragments |
| Predictable | P4 state, side effects, errors, bounds, scenarios; P3 preserved validation/error paths |
| Idiomatic | P3 existing mechanisms and conventions; P7 naming/convention evidence |
| Domain-based | P2 domain invariants and ownership; P5 user outcomes; P7 domain vocabulary |
| Meaningful behavior tests | P4 critical-scenario execution evidence, including old behavior and failures |
| Reveals intent | P1 responsibilities, P4 contracts, and P7 names |
| No duplicated knowledge | P2 policy sources and P3 parallel paths |
| Fewest necessary elements | P1 justification and P2 invariant preservation: removal cannot sacrifice the earlier goals |

## Keep quality, alignment, and authority separate

Record a technical verdict (`ready`, `needs_changes`, or `insufficient_evidence`) and authorization (`confirmed`, `pending`, `rejected`, or `unknown`) separately, with their evidence. Technical readiness never grants authority. Known absence of approval is pending; missing access to the conversation receipt is unknown.

A design can be ready to discuss with listed user decisions still open, but it is not ready to implement until consequential decisions are resolved and its scope is explicitly authorized. After a changed outcome, contract, or scope, re-align with the user and update review coverage. Minor choices within approved contracts do not require another gate.

Hard failures cannot be averaged away: unauthorized writes, unauthorized scope changes, confirmed change-introduced correctness/security/compatibility regressions, or fabricated evidence. Missing critical verification is insufficient evidence, not an assumed pass. Unrelated pre-existing defects are separate findings, not automatic reasons to block or rebuild the entire system.

This rubric is instruction-based. It does not mechanically prevent writes, prove a model will comply, or replace host permission controls.

## Independent agent handoff

After implementation, request a separate read-only review when the host supports it and operator/project instructions permit delegation. An existing authorized reviewer workflow can fulfill this requirement using this rubric. Do not launch another competing workflow or additional agents automatically. Without delegation support/permission, disclose that independent review was not performed; self-check may still supply evidence but is not a substitute claim.

Provide a compact, cold-start-complete packet:

1. Objective, user request, acceptance conditions/non-goals, actual user decisions and scope authorization receipt. Include known assumptions and unresolved decisions.
2. Repository/cwd, baseline ref or snapshot, exact design and source revision, affected paths, and complete staged/unstaged/new-file delta. Separate pre-existing edits from this task; a HEAD hash alone does not describe a dirty worktree. Check/review evidence from an earlier source revision cannot establish coverage of later changes.
3. Existing capability inventory and replacement dossiers, contract/scenario lists, check commands and results with artifact references. These are leads to verify, not conclusions to trust.
4. Read-only authority: inspect implementation, callers, tests, diff, and original tool/approval receipts independently. Rerun relevant native checks only when permitted; tests can have side effects, so source read-only authority is not unrestricted execution authority. No source changes, commit/push/deploy, user approval, or further delegation. Evidence collection must stay within the host's permission limits.
5. Output: basis/stage, each applicable principle's measures with unit counts and citations, unknown/inapplicable reasons, findings, unresolved user decisions, technical verdict and authorization status. Stop when the scoped evidence is sufficient; escalate missing critical inputs rather than inventing them.

A compact report can use this shape; illustrative nulls below mean no measurement was performed:

```json
{
  "basis": "descriptive-design-revision-and-diff-snapshot",
  "stage": "implementation",
  "metrics": [
    {
      "principle": "P3",
      "metric": "capability-inspection",
      "status": "unknown",
      "met": null,
      "total": null,
      "unknown": null,
      "units": [],
      "evidence": [],
      "reason": "Repository evidence has not been inspected."
    }
  ],
  "findings": [],
  "openDecisions": [],
  "technicalVerdict": "insufficient_evidence",
  "authorization": "unknown"
}
```

For count metrics use `count` (null when unknown), units and citations instead of inventing a denominator. For non-applicable coverage use total 0 only when absence was established, plus a reason. All seven principles must be accounted for in a full review, including justified inapplicability; report limits if only a subset was commissioned. A structured report checks observability, not automatic scoring truth.

The parent adjudicates findings against current code and user decisions. Fix confirmed issues within authorized scope, then obtain focused re-review of the changed evidence and its impact. Scope-changing fixes return to the user. Preserve outstanding findings and review-version history; do not repeat broad reviews merely for optional polish. Never report an earlier review as covering later unreviewed changes.
