# Optional task evidence recorder

Use this only when a persisted check/review handoff helps the user's actual task. It ships with the skill; users need neither a PlanET checkout nor `npm install`. Node.js 22+ and Git are required. Without them, use native host results and record the same scope/revision limitations in conversation. This utility records evidence, not code quality, permissions, or model effectiveness.

## Record the user's project, not a benchmark

Resolve [evidence.mjs](../scripts/evidence.mjs) from this skill's installed directory. Choose a task-specific directory outside the source repository; artifact writes need host permission. Protect that directory from implementation edits where the host supports it. Keep work serialized.

```sh
# After design alignment, before the implementation's first source change:
node /installed/planet/scripts/evidence.mjs snapshot /path/to/user-project /tmp/planet-task-evidence
# After implementation, run only the project's agreed checks:
node /installed/planet/scripts/evidence.mjs check /tmp/planet-task-evidence -- npm test
# Python example instead; select the actual project command, not both by default:
node /installed/planet/scripts/evidence.mjs check /tmp/planet-task-evidence -- python -m pytest
node /installed/planet/scripts/evidence.mjs verify /tmp/planet-task-evidence
```

`check` executes the explicit argument vector in the project's root without an implicit shell. Shell syntax needs an explicitly authorized shell command. On Windows, use an executable or an explicit shell for commands provided as `.cmd` scripts. The recorder inherits the host environment; it does not create a sandbox or authorize execution. Commands are limited to two minutes and 1 MiB of buffered output; launch/limit failures remain unknown. For longer checks, use the native host and disclose that they are outside this recorder rather than inventing a successful record. Logs and command arguments stay local but can contain secrets; do not supply or share secret-bearing arguments/logs.

## What is observed

- `basis.json` fingerprints the initial working-tree files, including dirty and nonignored untracked files. It never stages, commits, cleans, or overwrites an existing baseline.
- `check-<id>.json` records the actual command, start/end source fingerprints, times, output, error and exit status.
- `verify` compares the current source to the baseline and reports each check as `met`, `violated` or `unknown`. A changed source revision, source edits during a check, missing snapshot, malformed record or baseline mismatch cannot become a current pass. No check records means unknown, not full marks. A current nonzero exit remains visible even alongside successful commands.
- The counted units are **command executions**, not acceptance scenarios, test assertions or code-quality points. Map meaningful scenarios to real test assertions as the policy's Verify step requires; do not derive scenario coverage from command counts.

Git-listed files are the fingerprint boundary, not a complete semantic diff. Ignored files, external dependencies and execution environment are outside it. Symlink target and submodule contents are explicitly unverified; tracked paths whose parent links leave the repository are not read. Unsupported Git path encoding fails explicitly rather than inventing a complete snapshot. Source changes during snapshot reads, including edit-and-restore races, require host isolation or a stable snapshot for stronger guarantees. Continue reviewing the native diff and callers.

## Bind a reviewer report

When a [full audit](audit.md) is requested, a permitted independent reviewer can write `review.json` alongside the baseline/check records. Include the exact `basis` and `revision` returned by `verify`, a `reviewer` run identity, `technicalVerdict`, `metrics`, `findings`, and `openDecisions`. Metric fields follow the shared rubric. For coverage, `units` lists distinct applicable unit or naming-group IDs, including unknown units, and its length equals `total`; group repeated citations, not hidden units. Use either coverage fields or `count`, not both. Count metrics cite the inspected population or violation instances. Unknown counts can be null. Inapplicability needs an established zero population, a reason and cited evidence. Never use a zero denominator as a pass.

```json
{
  "basis": "replace-with-baseline-fingerprint",
  "revision": "replace-with-reviewed-source-fingerprint",
  "reviewer": "replace-with-host-reviewer-run-id",
  "technicalVerdict": "insufficient_evidence",
  "metrics": [{
    "principle": "P4", "metric": "scenario-coverage", "status": "unknown",
    "met": null, "total": null, "unknown": null, "units": [], "evidence": [],
    "reason": "Illustrative report only; no scenario evidence has been inspected."
  }],
  "findings": [],
  "openDecisions": []
}
```

`verify` reports matching review data as **reported**, not independently proven. It identifies omitted principles, invalid arithmetic and stale revisions; it cannot validate citation meaning, reviewer independence/read-only behavior, or user approval. Full review still accounts for all seven principles under the shared standard. After repairs, rerun affected checks and obtain focused review at the new revision; retain old artifacts as history.

Exit zero from `verify` means a report was generated, not that the project passed. `check` exits nonzero on command failure, recording error or changed source. There is no overall quality score or automatic write/merge gate. Record consistency checks are not authentication: an agent with write access to artifacts can fabricate them. Use host permissions, original tool traces and operator validation for provenance and authority.
