<!-- Generated from TDD.md by scripts/split-specs.mjs. Do not edit. -->
## Appendix A. The demo's Build 1 document

`instructionDocument(demoProject()).document` must be exactly: the first ```` ```markdown ```` block of `skills/instruction-header.md` (it starts `## How to read this` and ends with the Library rule), then a blank line, then:

```markdown
## Block types used

- Site: The whole website; its Traits describe every page.
- Page: One page of the website, in its own `.html` file.
- Navbar: The bar of links for getting around the site.
- Hero: The big eye-catching banner at the top of a page, usually with a headline, an image and a button.
- Section: One band of a page that groups content with one purpose.
- Card grid: A grid of similar Cards. Repeat the Cards to a full grid with varied content only if a "fake data" Trait asks for it; otherwise show the Cards placed.
- Card: A small box that shows one thing, usually an image, a title and a short text.
- Form: Fields a visitor fills in and sends; sending is fake and shows a success message.
- Popup: A box that opens over the page and has a way to close it. It stays closed unless an "on click" opens it, a Note or "tell Bob" says when it opens, or a "let Bob pick" covers it.
- Footer: The strip at the bottom with small print, contact details and links.
- Textbox: Words: a heading, paragraph or label, whichever fits.
- Frame: One picture. With no image Trait, a plain placeholder box labelled with the Block's name; a Library Asset only under "let Bob pick".
- Button: Something a visitor clicks.
- Panel: Groups what's inside; has no meaning of its own.

## Site "Maya's bake sale" #b1

- color (main color of this Block; decide where it shows, keep text readable): pink (#F8BBD0)
- vibe (overall feel: wording, shapes, spacing, motion): playful
- font (typeface for this Block's text): friendly

### Page "Home" (index.html) #b2

- Navbar "Top bar 1" (Instance of "Top bar") #b21
  - position (where it sits inside its parent): stays on top when scrolling
  - Button "Menu" #b22
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz" #b23
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Hero "Big welcome" #b16
  - size (room it takes in its parent; "full screen" fills the window): full width
  - Textbox "Textbox" #b15
    - text (exact words to show, as written): "Fresh cakes every Saturday"
  - Frame "Frame" #b14
    - image (show this picture): assets/cupcakes.jpg
    - image (show this picture): assets/bake-stall.jpg
    - purpose (what this Block does by itself, no click needed): slideshow
  - Button "Order" #b13
    - on click (when a visitor clicks this Block): open "Order" popup #b12
- Popup "Order" #b12
  - Form "Order form" #b11
    - Note: "name, which cake, pickup time"
    - Button "Button" #b10
      - on click (when a visitor clicks this Block): submits (fake)
- Section "Next sale" #b20
  - purpose (what this Block does by itself, no click needed): countdown
  - Panel "Panel" #b19
    - Frame "Frame" #b17
      - image (show this picture): assets/cookies.jpg
    - Textbox "Textbox" #b18
      - text (exact words to show, as written): "Cookies are half price!"
- Footer "Bottom 1" (Instance of "Bottom") #b24
  - Textbox "Textbox" #b25
    - text (exact words to show, as written): "Made by Maya, age 11"

### Page "Menu" (menu.html) #b3

- Navbar "Top bar 2" (Instance of "Top bar") #b28
  - position (where it sits inside its parent): stays on top when scrolling
  - Button "Menu" #b29
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz" #b30
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Card grid "Cakes" #b27
  - fake data (fill with made-up content as described): "6 cakes with prices"
  - purpose (what this Block does by itself, no click needed): filter / sort (fake)
  - Card "Card" #b26
    - image (show this picture): you choose
    - on click (when a visitor clicks this Block): adds to cart (fake)
- Footer "Bottom 2" (Instance of "Bottom") #b31
  - Textbox "Textbox" #b32
    - text (exact words to show, as written): "Made by Maya, age 11"

### Page "Quiz" (quiz.html) #b4

- Navbar "Top bar 3" (Instance of "Top bar") #b35
  - position (where it sits inside its parent): stays on top when scrolling
  - Button "Menu" #b36
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz" #b37
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Section "Which cupcake are you?" #b34
  - The user says: "3 questions, then show which cupcake you are"
  - You choose: the colors
  - Button "Button" #b33
    - on click (when a visitor clicks this Block): checks an answer
- Footer "Bottom 3" (Instance of "Bottom") #b38
  - Textbox "Textbox" #b39
    - text (exact words to show, as written): "Made by Maya, age 11"

## Custom Blocks

- Navbar "Top bar"
  - position (where it sits inside its parent): stays on top when scrolling
  - Button "Menu"
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz"
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Footer "Bottom"
  - Textbox "Textbox"
    - text (exact words to show, as written): "Made by Maya, age 11"

## Library

- assets/cupcakes.jpg: image, 1200×800 px, used by a Trait
- assets/layer-cake.jpg: image, 1200×800 px
- assets/cookies.jpg: image, 1200×800 px, used by a Trait
- assets/bake-stall.jpg: image, 1200×800 px, used by a Trait
- assets/lemon-drizzle.jpg: image, 1200×800 px
- assets/brownie.jpg: image, 1200×800 px
```

(The document ends with one newline after the last Library line.)
