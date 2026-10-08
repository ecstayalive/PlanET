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

## Name the role

Prefer `parseConfig`, `Order`, `orders`, and `retryDelay` to `processHelper2`,
`OrderManagerV2`, `data1`, and `tmpValue`. Preserve meaningful conventional names
like `sha256`, `http2`, and a real `v2` protocol compatibility boundary. Do not
erase upstream attribution or pretend semantic naming changes hidden model behavior.

## Decide or ask

For a localized bugfix, trivial wrapper inlining, or adding an export format to an
established pipeline, proceed directly without asking. Choose the existing project's
formatter, module layout, and dependency conventions by inspection.

For a substantial new subsystem, a schema migration, or choosing between divergent
architectures (e.g. streaming vs batch processing), formulate a clear design proposal
with trade-offs, discuss it with the user, and obtain agreement before writing code.
If a business rule remains unspecified and materially changes outcomes (e.g. billing
cutoff timezones), ask that specific question with a recommended choice.

## Display or wait

Show a before/after module diagram while continuing an authorized refactor. For a
visual product preference that cannot be inferred, show two layouts and wait for
an explicit confirmation. A preview click is not authorization to publish or deploy.
