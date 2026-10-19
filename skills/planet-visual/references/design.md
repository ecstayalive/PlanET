# Visual expression and optional style

The visual companion explains a design; it does not dictate how to design it. Choose the representation that makes the user's current question easiest to understand. Content, layout, and explanatory sequence are authored by the agent, not fixed by PlanET.

## Choose a medium

| User needs to understand | Useful expression | Make visible |
| --- | --- | --- |
| A page layout or interaction arrangement | Static HTML mockup or side-by-side previews | Comparable content, differences, and trade-offs |
| What a behavior change actually does | Concrete input/output or before/after examples | Normal behavior, meaningful failure cases, and preserved rules |
| Where an extension belongs | Architecture/responsibility diagram | Existing modules, partial capability, new behavior, and ownership |
| How state or data moves | Flow, sequence, or state diagram | Calls, ordering, state owners, errors, and operational boundaries |
| Why one approach fits better | HTML walkthrough, comparison table, or concise annotated example | The current constraint and consequences of each alternative |

A simple example can be clearer than a diagram. A diagram can be clearer than several code blocks. Combine media when they answer different questions, not to fill a preset page. Distinguish existing, proposed, and uncertain behavior; do not depict an agent recommendation as an agreed user decision.

## Optional PlanET styles

[style-template.html](../assets/style-template.html) supplies warm neutral surfaces, deep green text, restrained sage accents, spacing, and amber notes. Copy its inline styles into an `html` preview if useful, then supply the markup appropriate to the task. The CSS variables and classes are optional; there are no required sections or approval controls in the template.

Use readable text, sufficient contrast, meaningful headings, responsive layout, and labels that do not rely only on color. Match the user's language. Omit decorative animation, remote fonts, and empty containers. Keep generated screens in the session directory, not in the package.

## Author freely within the preview boundary

Use the existing `html` field for a complete explanatory fragment, static UI sketch, example table, or inline SVG architecture diagram. Use text/code panels when those are enough. Provide file and symbol context when presenting actual code, and label illustrative examples as such.

The optional `diagram` field is a deterministic helper for small acyclic flows, not the preferred format for every problem. Its node types and limits apply only when using that helper. For feedback loops, sequences, or another structure it cannot express naturally, author inline SVG or HTML instead of distorting the design to fit the renderer.

Static frames allow inline styles and data images, but not scripts, remote assets, navigation, or forms. Place real decision choices and confirmation in the viewer's outer `choices`/response controls, not in decorative HTML buttons. Use the application's own authorized preview facilities for live interaction; do not describe a static mockup as tested behavior.

## Alignment remains in the conversation

Make alternatives comparable, with visible consequences and a recommendation where appropriate. No option is preselected. Clearly state the design/scope a requested approval would cover. Confirmed submissions record responses; a correction or rejection is not implementation authorization. Detailed requirements, user decisions, and code refinements remain anchored in conversation and native tools.

A view needs no reply and does not stop already authorized work. A decision waits for the actual consequential choice or scoped approval, regardless of whether it is explained with HTML, examples, or a diagram.
