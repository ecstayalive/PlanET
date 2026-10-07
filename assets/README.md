# PlanET identity

Use the exact capitalization **PlanET**. The orbital mark evokes a planet and
the wordmark connects planning with engineering taste. A shared gradient moves
through teal, sage, and warm gold across the letterforms. The name remains readable
in one color.

The orbital mark uses a circle and a tilted ring, without a satellite dot. This
keeps the silhouette quiet and readable at small sizes.

The README banner includes the tagline **Harness coding agents to write elegant,
concise, maintainable code.** It states PlanET's role directly: helping coding
agents improve the quality of their implementation. The compact logos retain
just the wordmark so they remain readable at small sizes. The tagline shares
the wordmark's teal-to-sage-to-gold gradient.

## Assets

| Asset | Use |
| --- | --- |
| [logo.svg](logo.svg) | README and Markdown previews; transparent background |
| [logo.svg](../skills/planet-visual/public/logo.svg) | Light backgrounds; shared with the self-contained visual skill |
| [logo-dark.svg](logo-dark.svg) | Dark backgrounds |
| [logo-mono.svg](logo-mono.svg) | Single-color reproduction; default dark ink |
| [icon.svg](icon.svg) | Square avatar or app icon on light backgrounds |
| [icon-mono.svg](icon-mono.svg) | Single-color icon |
| [preview.html](preview.html) | Open locally to compare graphical and terminal treatments |
| [preview.svg](preview.svg) | Self-contained vector overview of the identity and terminal tiles |
| [visual-view.svg](visual-view.svg) | Actual visual workspace export: architecture, implementation, and rationale |
| [visual-decision.svg](visual-decision.svg) | Actual visual workspace export: comparable choices and explicit confirmation |

All images are self-contained SVGs. All logos and icons have transparent
backgrounds. The vector overview also has a transparent outer canvas, with colored
sample panels to demonstrate light and dark surfaces. Wordmark letters are paths, so rendering
does not depend on installed fonts. The lettering is derived from Lato Bold by
Łukasz Dziedzic (SIL Open Font License); no font binaries are bundled.

The visual workspace previews are vector exports from the running application,
using the bundled view and decision examples. Text is outlined, with no embedded
bitmap images, scripts, external resources, session URLs, or tokens. The preview
captures omit box shadows and the decorative dot grid to keep the export vector-only.

| Tone | Light surfaces | Dark surfaces / terminal |
| --- | --- | --- |
| Teal | `#397D80` | `#81B4AE` |
| Sage | `#6E907F` | `#A4BBA4` |
| Warm gold | `#A48B64` | `#D0B991` |

Colors are deliberately muted. One continuous SVG gradient unifies the wordmark,
including variations within a letter. The terminal approximates that progression
with three diagonal bands across its solid tiles.
Use the monochrome asset when colors would reduce legibility. Its `currentColor`
fill and stroke can be themed when the SVG is embedded inline; external images
use the default ink. Preserve the viewBox proportions and surrounding whitespace.

## Terminal treatment

Prefer the compact `PlanET` wordmark in normal interaction. Use the optional
seven-row tiled banner only for an intentional welcome or brand presentation.
Do not print it on every turn or in JSON/protocol streams.

`COLORTERM=truecolor` or `24bit` enables the exact three-color palette. A
`TERM` containing `256color` uses indexed equivalents; other terminals use basic
ANSI colors whose shades follow the theme. Filled cells are background-colored
spaces, avoiding gaps between block glyphs. With color disabled, `██` preserves
the silhouette. `NO_COLOR` and `TERM=dumb` disable color even with `--color`;
dumb terminals use plain `PlanET`. Redirected output is uncolored unless explicitly
requested. The 66-column banner falls back to the compact wordmark in a narrow TTY.
Host interfaces may not preserve ANSI styling in model messages, so this renderer
is an optional local command rather than a prompt instruction.
