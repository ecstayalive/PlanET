# PlanET development

Apply [the PlanET skill](skills/planet/SKILL.md) to changes in this repository.
Preserve one shared set of principles across all host adapters. Host adapters
register resources and load instructions; they do not duplicate engineering policy.

Keep runtime code dependency-free unless a dependency provides a concrete benefit.
Keep generated visual session files out of the package and source control.
Run `npm run check` and `npm test` after runtime changes. Do not claim model
behavior is validated by manifest or protocol tests; behavioral evaluation is separate.
