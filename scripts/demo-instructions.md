## How to read this

This is the user's request for their website, written as Blocks and Traits.

- Each Block line ends with the Block's id, like `#b4`. Mark that Block's code with `data-block="b4"`.
- Nesting shows what sits inside what. The order of Blocks and where they sat on the Canvas mean nothing: you choose the layout.
- "Block types used" says what each kind of Block is for.
- Each Trait line reads `label (meaning): value`. A Trait describes its Block as a whole, including what's inside it. Keep nested Blocks consistent with it without copying it: a playful Section has playful contents, and Cards in a navy Section match navy. A Trait set on a nested Block decides that Block.
- When a Block has several Traits of one kind, use them together where you can: two colors make a palette, two images make a gallery, two fonts make a heading font and a body font, two "on click" steps both run. Where they clash, pick one. Going to a page always happens last.
- `(Instance of "Product card")` marks a copy of a Custom Block. Build one shared pattern for all its Instances and vary only what differs.
- `Note: "…"` and `The user says: "…"` are the user's own words about the website. Follow them.
- `You choose: <field>` lets you decide that field, boldly: a striking style, playful wording, parts the user never placed. `You choose: anything in this Block` covers the Block and everything inside it. Traits the user set stay as set.
- `label (meaning): you choose` means the user wants that one thing and leaves the choice to you. Make a deliberate choice. A Note under that Trait guides the choice.
- Fill anything the user left unset plainly: simple wording, colors that match the rest, only the parts needed.
- A Popup stays closed unless an "on click" opens it, a Note or `The user says` says when it opens, or `You choose` covers it.
- `go to missing page` means the page was deleted. Make that link do nothing and leave a comment saying so.
- The Library lists every Asset the user uploaded. Use an Asset that no Trait names only under `You choose`, or for an image, sound or video Trait set to `you choose`. If no Asset fits, use a placeholder.

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

## Library

- assets/cupcakes.svg: image, 1200×800 (used by a Trait)

## Custom Blocks

- "Top bar" (Navbar): two Buttons, "Menu" and "Quiz". An Instance sits on every Page.
- "Bottom" (Footer): one Text. An Instance sits on every Page.

## Site "Maya's bake sale" #b1
- color (main color of this Block; decide where it shows, keep text readable): pink (#F8BBD0)
- vibe (overall feel: wording, shapes, spacing, motion): playful
- font (typeface for this Block's text): friendly

### Page "Home" (index.html) #b2
- Navbar "Top bar" (Instance of "Top bar") #b5
  - Button "Menu" #b6
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz" #b7
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Hero "Big welcome" #b8
  - Textbox #b9
    - text (exact words to show, as written): "Fresh cakes every Saturday"
  - Frame #b10
    - image (show this picture): assets/cupcakes.svg
  - Button "Order" #b11
    - on click (when a visitor clicks this Block): open "Order" popup #b12
- Popup "Order" #b12
  - Form "Order form" #b13
    - Button #b14
      - on click (when a visitor clicks this Block): submits (fake)
- Footer "Bottom" (Instance of "Bottom") #b15
  - Textbox #b16

### Page "Menu" (menu.html) #b3
- Navbar "Top bar" (Instance of "Top bar") #b17
  - Button "Menu" #b18
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz" #b19
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Card grid "Cakes" #b20
  - fake data (fill with made-up content as described): 6 cakes with prices
  - Card #b21
    - image (show this picture): you choose
- Footer "Bottom" (Instance of "Bottom") #b22
  - Textbox #b23

### Page "Quiz" (quiz.html) #b4
- Navbar "Top bar" (Instance of "Top bar") #b24
  - Button "Menu" #b25
    - on click (when a visitor clicks this Block): go to "Menu" page (menu.html) #b3
  - Button "Quiz" #b26
    - on click (when a visitor clicks this Block): go to "Quiz" page (quiz.html) #b4
- Section "Which cupcake are you?" #b27
  - The user says: "3 questions, then show which cupcake you are"
  - Button #b28
    - on click (when a visitor clicks this Block): checks an answer
- Footer "Bottom" (Instance of "Bottom") #b29
  - Textbox #b30
