# Bob's Skills

Five Skills that every Build and every Assistant turn load, all at once (ticket 23, "What does each Skill teach Bob?"):

| Skill | What it holds |
|---|---|
| `code-rules/` | File layout, `data-block` marks, safety, the accessibility and mobile floor, code a beginner can read, a final self-check |
| `layout/` | `base.css`, page structure, the shared classes, three spacing steps, default positions for parts the request doesn't place |
| `behavior/` | "on click" and "purpose" in plain JavaScript: popups, show/hide, fake forms and cart, sound, small-app actions, interaction motion |
| `content/` | Made-up content, plain-HTML Card grids, wording rules and bans |
| `visual-style/` | Colors, Google Fonts, type and space, the vibe table, restraint, the "generated look" ban list |

`base.css` is not a Skill. The agent server puts it in the files before Build 1, so the reset, the tokens, the popup and the shared buttons, cards and fields are right without Bob writing them. Bob changes its tokens in `style.css`.

`instruction-header.md` is not a Skill. It holds the "How to read this" header of the instruction document and the two-line prompt ending, as text the app pastes.

Each `SKILL.md` is in Bob's format: `name` and `description` front matter, then the rules. The budget is about 115 rules and 4,500 words across all five, with must-follow rules first. Test changes with 3–5 fixed sample Projects.

## Credits

The Skills are our own text. They borrow ideas and rules from the published Skills below, rewritten in our own words; no Skill is used whole. Credits live here, not in the Skills, so they cost no tokens on a Build. The surveys are in `docs/research/web-dev-skills.md` and `docs/research/ui-skills-2026.md`.

**Apache-2.0**
- Anthropic, `frontend-design` (https://github.com/anthropics/skills): the brief wins, the look comes from the subject, restraint, the quality floor, copy rules, parts of the ban list. Used in `code-rules`, `content`, `visual-style`.
- Anthropic, `web-artifacts-builder` (same repo): the purple-gradient and Inter bans. Used in `visual-style`.
- OpenAI, `frontend-skill` (https://github.com/openai/skills, commit `82d2c5b`): two typefaces and one accent at most, hero rules, short supporting copy. Used in `content`, `visual-style`.
- Paul Bakaus, `impeccable` (https://github.com/pbakaus/impeccable): the quality floor, contrast, one kind of elevation, card radii, gradient text and glass bans. Used in `code-rules`, `visual-style`.
- Google Labs, `taste-design` (https://github.com/google-labs-code/stitch-skills): bans on stand-in names, round made-up numbers and AI clichés; one main hero button; `100dvh`. Used in `content`, `visual-style`.

**MIT**
- Vercel, Web Interface Guidelines (https://github.com/vercel-labs/web-interface-guidelines): buttons for actions and links for navigation, labels, alt text, zoom, paste, inline errors, `aria-live`, 16px field text, `scroll-margin-top`, `overscroll-behavior: contain`. Used in `code-rules`, `behavior`, `base.css`.
- Addy Osmani, `accessibility` (https://github.com/addyosmani/web-quality-skills): `:focus-visible`, the reduced-motion block, `aria-invalid`, native `<dialog>`. Used in `code-rules`, `behavior`.
- Addy Osmani, `frontend-ui-engineering` (https://github.com/addyosmani/agent-skills): no lorem ipsum, one spacing scale. Used in `content`, `visual-style`.
- Matthew Blode, `ui-animation` (https://github.com/mblode/agent-skills): transform and opacity only, durations, no `ease-in`, scroll reveals that run once, interface sound rules. Used in `behavior`.
- nextlevelbuilder, `ui-ux-pro-max` (https://github.com/nextlevelbuilder/ui-ux-pro-max-skill): 44px tap targets, 16px body text. Used in `code-rules`, `visual-style`.

- Matthew Blode, `ui-design` (https://github.com/mblode/agent-skills): section plus container, three spacing steps, one main button per view, `gap` over child margins, no near-duplicate values. Used in `layout`.
- nextlevelbuilder, `design-system` references (https://github.com/nextlevelbuilder/ui-ux-pro-max-skill): state order, disabled opacity, focus ring, popup width, card padding. Used in `base.css`.
- Jakub Krehel, `better-layout` (https://github.com/jakubkrehel/skills): the gap between groups is twice the gap inside one; backgrounds reach the edges, controls stay inside. Used in `layout`.
- Dammyjay93, `interface-design` (https://github.com/Dammyjay93/interface-design): the radius scale, popups stay centered. Used in `layout`, `base.css`.
- Leonxlnx, `taste-skill` (https://github.com/Leonxlnx/taste-skill): label above the field and error below, navigation on one line. Used in `layout`, `base.css`.

**No licence (ideas only, no text)**
- ChilliCream, `prototype-feature` (https://github.com/ChilliCream/agent-skills): build only what was asked, no fake loading.

Our own, with no published source: the `data-block` marks, keeping the user's edits, the reading rules, the fake-only backend recipes, the `purpose` recipes, the vibe table and code written for beginners.
