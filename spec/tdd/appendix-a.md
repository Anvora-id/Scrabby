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

## Site "Maya's bake sale" #b1

- color (main color of this Block; decide where it shows, keep text readable): pink (#F8BBD0)
- vibe (overall feel: wording, shapes, spacing, motion): playful
- font (typeface for this Block's text): friendly

### Page "Home" (index.html) #b2

- Navbar "Top bar 1" (Instance of "Top bar") #b17
  - Button "Menu" #b18
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz" #b19
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Hero "Big welcome" #b16
  - Textbox "Textbox" #b15
    - text (exact words to show, as written): "Fresh cakes every Saturday"
  - Frame "Frame" #b14
    - image (show this picture): assets/cupcakes.jpg
  - Button "Order" #b13
    - on click (when a visitor clicks this Block): open "Order" popup #b12
- Popup "Order" #b12
  - Form "Order form" #b11
    - Button "Button" #b10
      - on click (when a visitor clicks this Block): submits (fake)
- Footer "Bottom 1" (Instance of "Bottom") #b20
  - Textbox "Textbox" #b21

### Page "Menu" (menu.html) #b3

- Navbar "Top bar 2" (Instance of "Top bar") #b24
  - Button "Menu" #b25
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz" #b26
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Card grid "Cakes" #b23
  - fake data (fill with made-up content as described): "6 cakes with prices"
  - Card "Card" #b22
    - image (show this picture): you choose
- Footer "Bottom 2" (Instance of "Bottom") #b27
  - Textbox "Textbox" #b28

### Page "Quiz" (quiz.html) #b4

- Navbar "Top bar 3" (Instance of "Top bar") #b31
  - Button "Menu" #b32
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz" #b33
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Section "Which cupcake are you?" #b30
  - The user says: "3 questions, then show which cupcake you are"
  - Button "Button" #b29
    - on click (when a visitor clicks this Block): checks an answer
- Footer "Bottom 3" (Instance of "Bottom") #b34
  - Textbox "Textbox" #b35

## Custom Blocks

- Navbar "Top bar"
  - Button "Menu"
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz"
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Footer "Bottom"
  - Textbox "Textbox"

## Library

- assets/cupcakes.jpg: image, 1200×800 px, used by a Trait
- assets/layer-cake.jpg: image, 1200×800 px
- assets/cookies.jpg: image, 1200×800 px
- assets/bake-stall.jpg: image, 1200×800 px
- assets/lemon-drizzle.jpg: image, 1200×800 px
- assets/brownie.jpg: image, 1200×800 px
```

(The document ends with one newline after the last Library line.)
