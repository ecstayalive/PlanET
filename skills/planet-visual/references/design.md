# Visual design

Make diagrams and previews understandable at a glance. Use warm neutral surfaces,
deep green text, restrained sage accents, generous spacing, and amber for a
meaningful decision. Match the user's language for screen titles and labels.

## Flowcharts

Prefer a panel's native `diagram` field for data flows, responsibility maps, and
implementation stages. The viewer supplies deterministic alignment, branch
spacing, connector arrows, semantic node colors, and readable typography.

- Orient the main path left-to-right; use top-to-bottom for a tall or narrow flow.
- Label nodes by responsibility or behavior, not incidental filenames.
- Use `source`, `process`, `decision`, and `result` kinds to convey role.
- Keep one idea per node with a short detail explaining its responsibility.
- Label edges only when the relationship would otherwise be ambiguous.
- Split dense graphs into an overview and focused subflows instead of shrinking
  text. Native layout accepts acyclic graphs; explain feedback loops separately.
- For before/after comparisons, preserve terminology so the change is obvious.

## Pages and comparisons

Lead with the actual result and one sentence explaining what matters. Use the
diagram as the visual anchor, then show concise rationale, code, or comparisons.
Avoid process logs, protocol details, and metrics without evidence.

Make decision alternatives comparable: similar preview size, matching content,
clear differences, and concise tradeoffs. Recommend in the option description,
never through a preselected radio button. Require explicit confirmation.

Use isolated HTML previews for actual UI layouts. Prefer system fonts, responsive
layout, a clear focal point, and sufficient contrast. Avoid remote fonts,
decorative animation, and giant blank containers. Frames are static; use the
application's own preview facilities to test live application interaction.
