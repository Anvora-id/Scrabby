---
name: content
description: Use when writing any words or made-up content on a Scrabby prototype website: fake data, card contents, buttons and messages.
---

# Content

Every word you put on the page, and every made-up record.

## Must follow

1. Text in a `text` Trait appears exactly as the user wrote it, emoji included.
2. Invent content only where a `fake data` Trait or `You choose` asks for it. Anywhere else, write only the words a part needs to work: a heading, a button label, a message.
3. Never add testimonials, reviews, "by the numbers" sections or statistics to fill a gap.
4. Never use images from the internet. Under `You choose`, pick a Library Asset no Trait names. Otherwise a Frame Block with no `image` Trait is a plain box labelled with the Block's name.

## Card grids

5. Write every Card out in the HTML, one after another. Never build Cards from a JavaScript list: the user must be able to find and edit each one.
6. Show only the Cards the user placed, unless a `fake data` Trait asks for more. Then repeat the Card's pattern until the grid is full, with different content in each. Each Card you add carries the Card grid's id.

```html
<!-- Menu cards -->
<div class="card-grid" data-block="b10">
  <article class="card" data-block="b11" data-category="cake" data-price="4.50">
    <img src="assets/carrot-cake.jpg" alt="Slice of carrot cake with cream cheese icing">
    <h3>Carrot cake</h3>
    <p>Spiced sponge, walnuts and a thick layer of cream cheese.</p>
    <p class="price">$4.50</p>
  </article>
  <article class="card" data-block="b10" data-category="bread" data-price="6">
    …
  </article>
</div>
```

## Made-up records

7. Make records believable and specific to the site's subject: "Lemon drizzle loaf", not "Product 1".
8. Vary the lengths: some names short, some long, some descriptions one line, some two.
9. Prices end in real-looking amounts ($4.50, $12.95). Write dates the way people read them ("Sat 3 Oct").
10. Never use:
    - "John Doe", "Jane Smith", "Acme" or other stand-in names.
    - Lorem ipsum or any placeholder text.
    - Round made-up numbers (99%, 50% off, 10,000 happy customers).
    - AI clichés: "Elevate", "Seamless", "Unleash", "Next-level", "Discover the magic".

## Wording

11. Write for the site's visitor, in the voice the `vibe` Trait asks for. With no `vibe`, write plainly.
12. A button says what it does: "Order cake", "Send message", not "Submit" or "Click here".
13. Use sentence case for headings and buttons: "Our cakes", not "Our Cakes".
14. Supporting text is one short sentence. Cut words that add nothing.
15. Call one action by one name everywhere: a button that says "Join the club" leads to "You've joined the club".
16. An error says what to do: "Enter an email like sam@example.com", not "Invalid input".
17. An empty state says what to do next: "No tasks yet. Add one above."
18. Never put notes to the user, design comments or instructions on the page. They go in code comments.
