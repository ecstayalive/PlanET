# Skeleton and contest

A skeleton makes a design reviewable as code before behavior exists. Author and challenger both work from this file under the shared [policy](../SKILL.md).

## Write the skeleton (author)

1. Extend the pattern the code already uses. Introduce a new one only when the feature's variation, boundary, invariant, or lifecycle requires it, and name the simpler alternative it beats.
2. Record a baseline of the working tree, including pre-existing edits.
3. Write into the repository, within the task's paths:
   - interfaces and types, with doc comments stating invariants, errors, side effects, ordering, and relevant bounds;
   - stub bodies that fail explicitly, such as `throw new Error('not implemented: exportMarkdown')`;
   - the real call sites rewritten to use them, so a reader sees what callers must know.

   When extending an existing mechanism, the skeleton is the changed signatures and the new entry in that mechanism, not a parallel structure.
4. Run cheap static checks (parse, type-check) when available. Failing behavior tests are expected.

The skeleton is the only write allowed before authorization. When the user withholds writes or the request is review-only, present it in conversation. If the user rejects the design, revert to the baseline and keep pre-existing edits.

## Run the contest (author)

The challenger is a separate agent with a fresh context, used when the host supports one and operator/project instructions permit delegation. The contest picks the better design, not the newer or the original one.

1. **Snapshot** your skeleton as proposal A.
2. **Hand off** a short, cold-start-complete packet; the challenger reads the code itself:
   - the paths of `SKILL.md` and this file, which it reads first;
   - objective, request, acceptance conditions, non-goals, user decisions, assumptions, and open decisions;
   - repository, baseline, the skeleton diff, affected paths, and pre-existing edits to leave alone;
   - your rationale (pattern choice, owners, rejected alternative) as claims to test.
3. **Rebut** each change on evidence: concede, restore A with a counter-argument, or merge. Independence does not make the challenger right, and authorship does not make A right.
4. **Reply once:** send the disputed points with your rebuttals and both versions. The challenger concedes or holds with new evidence and opens no new topics. Resume the same challenger when possible; otherwise give a fresh one the packet plus both diffs. The contest ends here.
5. **Present:** the working tree holds your final version. Give the pattern choice, owners, rejected alternative, open decisions, and a summary of agreed changes. For each unresolved point, show both diffs, each side's strongest argument, and your recommendation. Then ask for implementation authorization.

Without a permitted challenger, the user is the challenger: present A beside the strongest alternative you rejected, and state that no agent contest took place. Neither agent's verdict grants authorization.

## Challenge (challenger)

You compete with the author for the better design; you are not a proofreader.

- Inspect callers, owners, and tests in the repository, not just the packet.
- Edit skeleton-level code in place within the task's scope: interfaces, types, contracts, stubs, and call sites, from small corrections up to a competing design. Add or delete whole skeleton files as that design needs. Leave pre-existing edits intact. No commit, push, deploy, approval, or further delegation.
- Keep every stub body throwing. State intended behavior (lookups, clock source, error mapping) in the contract comment; the author implements it only after approval.
- Finish with your version in the working tree. The author already holds snapshot A and compares against it, so do not restore A or keep your version only in a separate patch.
- Answer from the code:
  - **Concise interface:** what must a caller know (setup, ordering, errors, configuration)? Can that shrink without hiding a real rule?
  - **Clear responsibility:** does each rule and piece of state have one owner? Is any policy copied?
  - **Warranted abstraction:** does the skeleton extend the existing pattern? Does each new abstraction own something a direct implementation cannot?
  - **Names and follow-up:** do names state roles in domain vocabulary, and does one plausible follow-up stay local?
- Report at most five changes, most consequential first, each in two or three sentences: location, concrete consequence, comparison with A. Or report "no change" with the strongest objection you tested and why A survives it. The diff carries the code.

## Arguments

A position wins by its consequences for the code. A valid argument names a location and a concrete consequence, then compares it with the alternative:

- Callers must call `init()` before `run()`; folding setup into construction removes the hidden ordering.
- The refund deadline rule now exists in the scheduler and the worker; a deadline change would need two coordinated edits.
- `ExportFactory` forwards to the existing `exporters` mapping; removing it leaves every caller unchanged.
- Adding another format stays local under A but touches three owners under B.

"Cleaner", "more SOLID", "uses Strategy", or "more extensible" without a named follow-up are not arguments. Concede when the opposing consequence is real and yours is weaker; hold with evidence the other side has not answered. A merge is often best: one side's interface with the other's ownership. When both positions stay defensible, the choice is the user's trade-off.

## Conformance check

After implementation, the author compares the final diff with the approved skeleton or brief:

- Every approved interface, contract, and owner appears as approved, or its deviation is listed with location, reason, and re-approval. An unapproved deviation returns to the user.
- No stub marker remains unless explicitly out of scope; search for the markers.
- Behavior outside the approved paths is unchanged.

This is your own check, not independent review; label it so. It replaces a second contest. A full audit runs only on request.
