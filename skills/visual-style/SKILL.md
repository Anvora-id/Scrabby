---
name: visual-style
description: Use when deciding how a Scrabby prototype website looks: the design plan, color, fonts, hierarchy, the hero, depth, vibe and the final design check.
---

# Visual style

How the site looks. The Design Traits the user placed come first; this Skill decides the rest. The aim is a site that looks designed for its subject, not a template: clear hierarchy, one bold idea, calm everywhere else.

## Must follow

1. Plan before you write any code. Put the plan as the first comment of `style.css`:

```css
/* Design plan
   Subject: a Saturday bake sale run by a kid, for neighbours
   Feeling: playful (vibe Trait)
   Brand: #F8BBD0 (color Trait: pink)
   Fonts: Fredoka for headings, Nunito for text
   The one bold thing: the hero headline, huge and dark, next to the cupcake picture
   Bands: hero tint, menu plain, quiz dark, footer tint
*/
```

2. Then set the plan in the `:root` of `style.css`. Set `--brand` and the fonts; change other tokens only for a `vibe`.
3. Never write a color value anywhere else. Every color comes from the tokens of `base.css`: `--brand-50` to `--brand-900`, `--color-text`, `--color-muted`, `--color-background`, `--color-surface`, `--color-border`.

## Color

4. `--brand` is the `color` Trait's hex. With no `color` Trait, choose one hex that suits the subject: a bakery warm, a science club deep blue or green. Never the default blue-purple.
5. `base.css` turns `--brand` into a full scale that passes contrast by itself: buttons use `--brand-600`, links `--brand-700`, tints `--brand-50` to `--brand-200`. A light brand such as pink therefore gets deep pink buttons with light pink bands. Don't fight this.
6. A `color` Trait on one Block: add the class `brand-scope` to that Block and set its own `--brand` on its class in `style.css`. Everything inside it then uses that color.
7. Neutrals cover most of the page. The brand shows in a few strong places: the main button, one tinted or dark band, the badge, links and decorative shapes.
8. Change the background from band to band with `band-tint`, `band-strong` and `band-dark` on the `<section>`. Use `band-dark` at most once per page. Two bands next to each other never share a color, except plain ones.
9. Never put grey text on a colored band. The band classes set the right text colors.

## Fonts

10. Load Google Fonts with one `<link>` in every page's `<head>`, after a `preconnect`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&family=Nunito:wght@400;600;700&display=swap">
```

11. Write spaces in a font name as `+`: `family=Playfair+Display:wght@400;700`.
12. Use two families: a heading font with character that suits the subject, and a calm text font. Two `font` Traits in one Block make the heading font and the text font. A feeling typed in a `font` Trait ("something cozy") means: pick a Google Font that matches it.
13. Never use Inter, Roboto, Arial, Open Sans, Lato or `system-ui` for headings.
14. Good pairs, if nothing else guides you:

| Feeling | Headings | Text |
|---|---|---|
| playful | Fredoka, Baloo 2 | Nunito |
| calm | Lora, Newsreader | Nunito Sans |
| bold | Archivo Black, Anton | Archivo |
| minimal | Sora, Manrope | Karla |
| elegant | Cormorant Garamond, Fraunces | Mulish |
| retro | Righteous, Bungee | Karla |

## Hierarchy

15. Each page has one `<h1>`, in the Hero or at the top. It is the biggest text by far. Section headings are `<h2>`, card titles `<h3>`.
16. Under an `<h1>` or a section's `<h2>` put one short `lead` line that says what this is for.
17. At most three text sizes in one section. Make less important text smaller and `--color-muted` (the `small` class), never bolder.
18. Body text weight is 400; headings 600 or more. A very thin or very heavy weight only at 40px and up.
19. Paragraphs are left-aligned and at most 65 characters wide. Center only headings and short lines.

## What you may add

20. To make a page look finished you may add parts that only support what the user placed:
    - a `lead` line under a heading, and a `badge` above the Hero's `<h1>`
    - the Site's name as `site-name` in the top bar
    - an intro line in a Popup, and a `field-hint` under a field
    - decorative shapes and backgrounds made with CSS
21. Never add a button, link, form field, section, page or feature the user didn't place. Every word you add follows the Content Skill.

## The hero

22. The Hero is the one bold thing on its page. Build it with `hero`: text in `hero-text`, the picture in `hero-media`.

```html
<!-- Hero: the big welcome -->
<section class="band-tint" data-block="b8">
  <div class="container hero">
    <div class="hero-text">
      <p class="badge">Every Saturday, 9 to 1</p>
      <h1>Fresh cakes every Saturday</h1>
      <p class="lead">Cupcakes, loaves and cookies, baked the night before.</p>
      <button type="button" class="button" data-open="order-popup">Order</button>
    </div>
    <div class="hero-media">
      <img src="assets/cupcakes.jpg" alt="A tray of pink cupcakes">
    </div>
  </div>
</section>
```

23. Text over a photo stays readable: put a dark overlay or a solid panel behind it.

## Depth and shape

24. Use only the shadows `--shadow-1` (resting card), `--shadow-2` (raised) and `--shadow-3` (popup). A part gets a shadow or a border, not both. Sections get neither: bands separate them.
25. Corners grow with the part: `--radius-sm` for buttons and fields, `--radius-md` for cards, `--radius-lg` for popups and hero pictures, `--radius-pill` for badges.

## Size and position Traits

26. `full screen` is `min-height: 85dvh`, so the next section peeks in. Never `100vh`.
27. `stays on top when scrolling`: add the class `stays-on-top`.
28. `floating corner`: add the class `floating-corner`.

## Vibe

29. The `vibe` Trait changes these tokens and choices for its Block and everything inside it:

| vibe | tokens | bands | motion | wording |
|---|---|---|---|---|
| playful | `--radius-sm: 14px; --radius-md: 24px; --radius-lg: 32px` | tint and strong | a small bounce on buttons | warm and fun |
| calm | `--radius-sm: 10px; --radius-md: 20px` | tint only | slow fades only | gentle and short |
| bold | `--radius-sm: 0; --radius-md: 0; --radius-lg: 0` | one dark band | one strong entrance | direct and punchy |
| minimal | `--radius-sm: 4px; --radius-md: 8px`, cards with a border and no shadow | plain only | almost none | as few words as possible |
| elegant | `--radius-sm: 2px; --radius-md: 4px`, a serif heading font | tint and one dark | slow, subtle fades | polished and formal |
| retro | `--radius-sm: 4px`, borders 3px, `box-shadow: 6px 6px 0 var(--brand-900)` | strong | quick and snappy | friendly and nostalgic |

## Restraint

30. One bold thing per page. Keep the rest quiet.
31. One motion moment per page. Add more only when a `vibe` asks for it or a `purpose` Trait needs it.

## Never, when you choose the look

32. Don't use these unless the user asked for them. Cards the user placed and emoji the user typed stay.
    - Purple gradients, or gradient text.
    - All-caps labels above headings.
    - Emoji as icons.
    - A row of identical cards as the default layout.
    - Glass or blur effects as decoration.
    - Every section fading up as it scrolls into view.
    - `→` added to button labels, or meta lines joined with `·`.
    - One corner radius on everything.

## Design check before you finish

33. Look at each page as a visitor would, then fix what fails:
    - Squint: one thing stands out first, and it is the plan's bold thing.
    - Every section has a heading, and the bands change from one section to the next.
    - No color value is written outside `:root`.
    - Buttons, cards and fields look the same everywhere.
    - Remove one decoration you don't need.
