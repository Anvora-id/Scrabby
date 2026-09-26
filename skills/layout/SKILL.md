---
name: layout
description: Use when placing anything on a Scrabby prototype website: base.css, page structure, spacing, alignment, shared components and where parts go when the request doesn't say.
---

# Layout

Where things go and how they line up. Every site starts from `base.css`, which is already written. It holds a safe reset, the default tokens, the page container and the shared parts: buttons, cards, fields, popups and the fixed parts.

## Must follow

1. Every page links `base.css` first, then `style.css`: `<link rel="stylesheet" href="base.css">` above `<link rel="stylesheet" href="style.css">`.
2. Never retype or copy `base.css`. Change its token values in the `:root` of `style.css`. Add a rule to `style.css` only for what `base.css` doesn't do.
3. Never write a reset such as `* { margin: 0 }` or `* { padding: 0 }`. `base.css` has a safe one. `* { margin: 0 }` moves every popup to the top left corner.
4. Never give a `<dialog>` a `position`, `top`, `left`, `inset`, `margin` or `translate`. The browser centers it. Change only its width, padding and colors.
5. Use the shared classes for the shared parts, everywhere they appear:

| Part | Class |
|---|---|
| Main action button (one per view; a popup is its own view) | `button` |
| Every other button | `button button-secondary` |
| Card | `card` |
| Card grid | `grid` |
| Form, field, error, success message | `form`, `field`, `field-error`, `form-message` |
| Picture with no image yet | `placeholder` |
| Top bar, the site's name, its links | `site-header`, `site-name`, `nav`, `nav-link` |
| Bottom strip | `site-footer` |
| Hero: text and picture | `hero`, `hero-text`, `hero-media` |
| Label above the Hero heading, line under a heading, small print | `badge`, `lead`, `small` |
| Section heading with its lead line | `section-head` |
| Band colors of a section | `band-tint`, `band-strong`, `band-dark` |
| Popup's × and its buttons | `popup-close`, `popup-actions` |
| Top of a page with no Hero | `page-head` |
| A section with everything centered | `container centered` |
| Answers or options to pick from | `choices`, `choice` |
| Filter, sort or toggle buttons | `chips`, `chip` (the one on has `aria-pressed="true"`) |
| Progress through steps | `progress`, `progress-bar` |
| A picture and words side by side, or any two columns | `split` |
| Parts in a column or in a row | `stack`, `row` |

6. Never invent a new class for a part in this table. To change how one looks on one Block, add a second class and set only what differs: `class="button hero-button"`. Every class in the HTML has a rule, or comes from `base.css`.
7. Style each kind of part once and reuse it. Never write near-copies with slightly different values, such as 15px next to 16px.

## Page structure

8. Each page is `<header class="site-header">`, `<main>` and `<footer class="site-footer">`. Each Hero and Section is a `<section>` directly inside `<main>`.
9. Inside every `<section>`, header and footer, put the content in `<div class="container">`. All left edges then line up. Backgrounds reach the screen edges; text and buttons stay in the container.
10. A Hero uses `hero`, as the Visual style Skill shows: text on one side, the picture on the other. On phones they stack, text first.

## Spacing

11. Space in three steps: inside a group `--space-1`, between groups `--space-2` or `--space-3`, between sections `--space-4` or more. The space between groups is at least twice the space inside one.
12. In a flex or grid layout, space the children with `gap`, never with margins on the children. Never set `margin` or `padding` on a part that `base.css` already spaces.
13. A `<div>` you add to group parts gets `stack` (parts in a column) or `row` (side by side). A plain `<div>` has no gap, so its parts touch.
14. A child's corner radius is never larger than its parent's. Buttons and fields use `--radius-sm`, cards `--radius-md`, popups `--radius-lg`.
15. Use these distances. `base.css` already sets the ones marked ✓.

| Between | Space |
|---|---|
| Badge and the heading under it | `--space-2` |
| Heading and its lead line | `--space-2` ✓ (`section-head`, `page-head`) |
| Lead line and the buttons under it | `--space-3` ✓ (`hero-text`) |
| Section heading group and the section's content | `--space-4` ✓ (`section-head`) |
| Cards in a grid | `--space-3` ✓ (`grid`) |
| Inside a card: its edge and its content | `--space-3` ✓ |
| Inside a card: title, text and price | `--space-1` ✓ |
| Label and its field | 6px ✓ |
| One field and the next | `--space-3` ✓ (`form`) |
| Buttons side by side | `--space-2` ✓ (`row`) |
| One section and the next | `--section-pad` above and below ✓ |
| Text and the screen edge on phones | `--space-2` ✓ (`container`) |

## Alignment

16. Everything in a section starts at the container's left edge: heading, lead, buttons, chips, cards, forms and custom parts. Never center one part under a left-aligned heading. Never write `text-align: center`, `justify-content: center` or `margin-inline: auto` for a section's parts.
17. To center a whole section, such as a quiz or a countdown, add `centered` to its container: `<div class="container centered">`. Its heading, lead, buttons and content then share one middle line.
18. Center only the text inside a small tile, such as a `choice` or a countdown number. Text next to a picture is left-aligned.
19. Tiles that belong together, such as a countdown or a row of numbers, use a grid with a fixed column count: `repeat(4, 1fr)`, `repeat(2, 1fr)` on phones. One tile never wraps onto a line by itself.
20. Parts side by side line up on one line: a picture and its words are centered on each other (`split` does this), buttons and fields in one row share one height.

## Recipes for each Block

21. Build each Block the way this table says, unless its Traits say otherwise. Leave out what the Block doesn't have.

| Block | Recipe |
|---|---|
| Navbar | `site-header`: `site-name` on the left, the links in `nav` on the right. A Button that goes to a page is an `<a class="nav-link">`; the current page's link has `aria-current="page"`. Any other Button in it is `button` or `button-secondary`. |
| Hero | `hero` on a `band-tint` or `band-strong` section: `badge`, `<h1>`, `lead`, then its buttons in a `row`. Its picture in `hero-media`. |
| Page with no Hero | Its first section is a `page-head` with the page's `<h1>` and a `lead` line. The Blocks follow in their own sections. |
| Section | `<section>` with a `container`, a `section-head` (`<h2>` and a `lead` line) and its contents. Change the band from the section before it. |
| Card grid | A section with a `section-head`, then `grid`. |
| Card | `card`: picture first (it reaches the card's edges), then `<h3>`, a short line, then details such as a `price` or a `small` date. |
| Form | `form` of `field`s, the main `button` last. On a wide page, put it in a `split` next to a heading and a lead line, or in a `card`. |
| Popup | `popup-close`, `<h2>`, one intro line, its contents, `popup-actions`. |
| Questions or a quiz | One question at a time in a `card`. Each question is a `stack`: a `badge` "Question 1 of 3", a `progress` bar, the question as `<h3>`, the answers as `choice` buttons in `choices`. The result replaces the question in the same card. |
| Footer | `site-footer`: the site's name on the left, its Textbox on the right. Links only if the user placed them. |
| Panel with a picture and words | `split`: the picture in one column, the words in a `stack` in the other. |
| Filters or sorting over a Card grid | `chips` between the `section-head` and the `grid`. |
| Frame | Its image, or a `placeholder`. |

## Where parts go when the request doesn't say

22. Never place a part with `position: absolute` and made-up `top` or `left` values. Use this table:

| Part | Where | How |
|---|---|---|
| Popup | Center of the screen, over a dark backdrop | `<dialog>` opened with `showModal()` |
| Message after an action | Under the form or button that caused it | `form-message` with `aria-live="polite"` |
| Short message not tied to a form | Bottom center of the screen, for 4 seconds | `toast` with `role="status"` |
| Top bar that stays on top | Top of the screen, full width | `site-header stays-on-top` |
| Floating button | Bottom right corner, clear of the phone's edge | `floating-corner` |
| Menu that opens from a button | Right under its button, left edges lined up | parent `position: relative`, menu `position: absolute; top: 100%; left: 0` |
| Links | In the top bar, on one line; they wrap on phones | `nav` |
| Buttons of one group | Side by side, the main one first | `row` |

## Check before you finish

23. Go through this list and fix what fails:
    - Every page links `base.css`, then `style.css`.
    - Every class in the HTML has a rule in `style.css` or `base.css`.
    - Every popup opens in the center of the screen with its own background.
    - Every section's content, not only its heading, starts at the same left edge.
    - No two parts touch. Every wrapper `<div>` is a `stack`, `row`, `grid` or `split`.
    - Each button, card and field looks the same everywhere it appears.
