# Examples of engineering taste

## Inline a trivial wrapper

```javascript
function getOrderTotal(order) {
  return order.total;
}
const total = getOrderTotal(order);
```

Prefer `const total = order.total;` when the wrapper has no meaningful contract.
Do not create a separate private class to hold this expression.

## Preserve meaningful policy

```javascript
function canRefund(order, now) {
  return order.status === 'paid' && now < order.refundDeadline;
}
```

This short function names a domain rule. One or two callers do not make its name
meaningless. Keep the rule with the order/refund domain rather than in `utils`.
Do not remove an independently useful contract merely to minimize function count.

## Extend the existing mechanism

If an exporter already dispatches using `exporters[format]`, implement a new format
through that mapping. Preserve the existing streaming, validation, and error path.
Do not add a second export service with its own format switch. For a one-format
exporter, a direct extension can still be simpler than creating a plugin framework.

## An incomplete feature is not a failed architecture

Suppose an existing export pipeline supports validation and streaming but its Markdown formatter omits escaping. Add escaping at the formatter and retain shared validation and streaming. Missing one behavior is not evidence that the pipeline needs replacement.

If that pipeline buffers all output and the approved requirement is bounded-memory export, inspect whether its owner can support incremental output with a local refactor. Replacement is justified only if a concrete limitation blocks that requirement, local repair is insufficient, and compatibility/migration is accounted for. An unrelated logging defect does not justify replacing exports.

## Name the role

Prefer `parseConfig`, `Order`, `orders`, and `retryDelay` to `processHelper2`,
`OrderManagerV2`, `data1`, and `tmpValue`. Preserve meaningful conventional names
like `sha256`, `http2`, and a real `v2` protocol compatibility boundary. Do not
erase upstream attribution or pretend semantic naming changes hidden model behavior.

## A grounded design brief

The following is an illustrative export repository, not a claim about files in PlanET:

> **Goal/decisions:** Produce Markdown tables while preserving CSV/JSON and unknown-format errors. This is the user's requested outcome; the dispatch choice below is my recommendation, not an additional user requirement.
> **Evidence:** `src/export.mjs` owns `exporters[format]` and validates requests before dispatch. A partial Markdown formatter exists; extend its missing escaping behavior rather than creating a second exporter. Callers rely on the same unknown-format error.
> **Change:** Add `exportMarkdown` to that mapping. Keep validation and error ownership in `export.mjs`; preserve the CSV/JSON contract and avoid new shared state.
> **Reason:** The existing dispatch already composes exporters behind one predictable interface. Another factory or service would duplicate policy without solving a current problem.
> **Verification/scope:** Test Markdown formatting, existing formats, and invalid inputs. I propose changes only to the exporter and its tests; may I implement this design?

This meets the design contract without a plan file or five CUPID headings. If the user already approved this design and scope, proceed without asking again. For a larger change, expand the affected responsibilities and contracts and discuss consequential choices. Use a visual comparison only when seeing alternatives helps.

A weak brief says "Use Strategy, follow SOLID/CUPID, and keep it modular" without locating an existing owner or explaining a changed contract. Stating framework names does not establish design quality.

## Judge the diff, not the explanation

A new `ExportFactory` that constructs an `ExportService` that forwards to the existing mapping adds interface knowledge without hiding useful complexity. Remove those wrappers; this improves composability and reduces unnecessary elements.

In contrast, an adapter that normalizes an external provider's response and errors owns a real contract, even with one provider. Keep that adapter when removing it would expose SDK differences to business callers. Fewest classes is subordinate to clear intent and non-duplicated rules.

A function named `saveInvoice` that catches a failed write and returns success is not predictable, even if its happy-path test passes. Make the failure contract visible and test it. For retries of external writes, establish idempotency and bounded retry behavior rather than adding retries to every exception.

For a follow-up export format, the dispatch mapping should remain the owner; validation should not need to be copied into each exporter. This is a design thought experiment, not permission to implement another format.

## Decide or ask

Choose the existing project's formatter, module layout, and dependency conventions
by inspection without asking.

For major architectural choices (e.g. streaming vs batch processing) or unspecified
business rules that materially change outcomes (e.g. billing cutoff timezones),
formulate a clear design proposal with trade-offs, discuss it with the user, and
obtain agreement as part of the design phase.

## Independent evaluation is not authorization

The implementing agent gives a separate permitted reviewer the user decisions, approved design, exact change boundary, code/diff, and check evidence. The reviewer uses [evaluation.md](evaluation.md), reads the artifacts, and can return, for example, capability inspection `2/2` but contract accounting `1/2`, citing the unexamined error path. These are illustrative counts, not results from this repository. Do not average them into a reassuring total score.

The parent fixes a confirmed missing error-path check within the approved scope and obtains focused re-review. If the proposed fix changes an approved failure contract, first return to the user. A reviewer saying "ready" cannot approve that contract change. If no separate agent is available or permitted, say independent review was not performed.

## Close a user task without manufacturing a score

In the illustrative export project, agree on five scenarios: CSV preservation, JSON preservation, Markdown formatting, escaping, and invalid-input behavior. One successful `npm test` command is not `1/1` acceptance coverage. Inspect its assertions: if only four scenarios are exercised, report `4/5` with invalid-input behavior unverified, then add the missing check within approved scope. An absent assertion is not a passed scenario.

The reviewer also finds that two formatters now copy validation. The parent checks the actual diff, restores the existing validation owner and reruns the affected checks. Obtain focused review of that new source revision; the earlier test/review receipt no longer covers it. State the result concisely: preserved formats, the chosen extension point, verified scenarios and review limits. These counts illustrate a user workflow, not measured results from PlanET.

Without a permitted reviewer, disclose that the same code received self-check only. Without the optional evidence recorder, retain native tool outputs and their revision references. Neither limitation justifies inventing a pass or requiring the user to install a new framework.

## Display or wait

Show a before/after module diagram while continuing an authorized refactor. For a
visual product preference that cannot be inferred, show two layouts and wait for
an explicit confirmation. A preview click is not authorization to publish or deploy.
