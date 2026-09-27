<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Brand and Bob

**Bob is the mascot** (D-Q20): a little builder robot in a blue hard hat with a `</>` badge on his chest. The artwork is two vector files in `assets/`, copied as-is into `public/` so the app serves them; they are never generated or redrawn: `assets/Scrabby_2.svg` → `public/bob.svg` (the full figure) and `assets/bob-head.svg` → `public/bob-head.svg` (the head, square). `assets/Scrabby.png` (1254px) is a raster copy for the video and deck, never used in the app. Its own colors are `--bob`, near-black `#020102` outlines and off-white `#F3F4F8`. They belong to the artwork only: the rest of the UI has **no black outlines** (D-Q22).

- **Never** redraw, recolor, crop the body, stretch or add poses. Bob's pose stays exactly as drawn (D-Q20). The one allowed crop is **Bob's head**, which is its own file, `bob-head.svg`. Use it for avatars: an `<img>` in a circle (`border-radius: 50%`, `object-fit: cover`) with a white fill and a 2px `--line` ring.
- **Smallest sizes:** full figure 40px tall; head 24px across.
- **Where Bob appears** (only these places, so he stays special):

  | Place | What |
  |---|---|
  | Menu bar | Full figure, 40px tall, before the wordmark ([Shell](#shell)) |
  | Assistant | Head: 28px before "Bob" in the title bar, 24px beside each of Bob's messages, 48px above the empty-chat line ([Assistant](#assistant)) |
  | Build card | Full figure, 170px tall, hopping on the Build stage ([Build button and Build card](#build-button-and-build-card)) |
  | Speech bubbles | Full figure, 74px tall, beside the bubble ([Speech bubble](#speech-bubble)) |
  | Greeting | The logo, Bob 160px tall, at the top of the greeting card ([Screen layout](#screen-layout)) |
  | Empty Library and Checkpoints | Head, 48px, above the empty line, as in the empty chat ([Library](#library), [Checkpoints](#checkpoints)) |

- **Logo** = Bob's full figure + the **wordmark** "Scrabby" in Nunito 900, letter-spacing −.01em, gap 8px, figure bottom-aligned with the text's baseline (on the greeting card the wordmark is centered on Bob's middle instead, [Screen layout](#screen-layout)). The logo is for the app, video, deck and cover. The favicon is `bob-head.svg`.
