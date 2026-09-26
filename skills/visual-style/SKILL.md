---
name: visual-style
description: Use when choosing how a Scrabby prototype website looks: colors, fonts, vibe, spacing, layout and motion amount.
---

# Visual style

How the site looks. The Design Traits the user placed come first; this Skill fills the rest.

## Must follow

1. Take the look from the site's subject. A bakery doesn't look like a bank.
2. Without a `vibe` Trait or `You choose`, keep the look plain and quiet. Under `You choose`, be bold.
3. Put every color, font and space size in CSS custom properties at the top of `style.css`, and use only those.

## Colors

4. The `color` Trait's hex becomes a custom property. A `color` Trait on one Block sets the property on that Block's class.
5. Choose the neutrals yourself: a background, a text color and a muted text color that suit the main color.
6. A light color (pink, mint, sunny yellow) is a background or a fill with dark text on it. Never use it as text on white.
7. Use at most one accent color, unless the user placed more.

```css
/* Colors, fonts and spacing for the whole site */
:root {
  --color-main: #F8BBD0;       /* color Trait: pink */
  --color-background: #FFFBF8;
  --color-text: #2B2224;
  --color-muted: #6E5F63;
  --font-heading: "Pacifico", cursive;
  --font-body: system-ui, sans-serif;
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 48px;
}

/* Menu section: color Trait navy */
.menu { --color-main: #1E3A5F; }
```

## Fonts

8. Load Google Fonts with one `<link>` in every page's `<head>`, after a `preconnect`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pacifico&family=Nunito:wght@400;700&display=swap">
```

9. Write spaces in a font name as `+`: `family=Playfair+Display:wght@400;700`.
10. Use at most two font families. Two `font` Traits in one Block make a heading font and a body font.
11. A feeling typed in a `font` Trait ("something cozy") means: pick one Google Font that matches it.
12. With no `font` Trait, pick one Google Font for headings that suits the subject, and use `system-ui` for body text.

## Type and space

13. Body text is 16px with a line height of about 1.5. Lines of text are at most 70 characters wide (`max-width: 70ch`).
14. Use only the spacing sizes in `:root`.
15. Cards and boxes use either a border or a shadow, not both. Corners are 12–16px, unless the vibe says otherwise.

## Size and position Traits

16. `full screen` is `min-height: 100dvh`, never `100vh`.
17. `stays on top when scrolling` is `position: sticky; top: 0;`.
18. `floating corner` is `position: fixed;` in the bottom right corner, clear of the page's content on phones.

## Vibe

19. The `vibe` Trait sets these four things for its Block and everything inside it:

| vibe | shapes | spacing | motion | wording |
|---|---|---|---|---|
| playful | round corners (20px+), chunky buttons, bright accent | roomy | a small bounce on buttons | warm and fun |
| calm | soft corners, soft muted colors | lots of empty space | slow fades only | gentle and short |
| bold | square corners, very large heavy headings, strong contrast | tight | one strong entrance | direct and punchy |
| minimal | thin lines, few colors, no shadows | very roomy | almost none | as few words as possible |
| elegant | a serif heading font, fine lines, small corners | roomy | slow, subtle fades | polished and formal |
| retro | thick borders, hard offset shadows, a period font | medium | quick and snappy | friendly and nostalgic |

## Restraint

20. One bold element per page, such as a big headline, one striking image or one strong color block. Keep the rest quiet.
21. One motion moment per page. Add more only when a `vibe` asks for it or a `purpose` Trait needs it.

## Hero

22. A Hero has one main button.
23. Text over a photo stays readable: put a dark overlay or a solid panel behind it.

## Never, when you choose the look

24. Don't use these unless the user asked for them. Cards the user placed and emoji the user typed stay.
    - Purple gradients.
    - Gradient text.
    - All-caps labels above headings.
    - Emoji as icons.
    - Inter as the font.
    - A row of identical cards with the same grey shadow as the default layout.
    - Glass or blur effects as decoration.
    - Every section fading up as it scrolls into view.
