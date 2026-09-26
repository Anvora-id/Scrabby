<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Bob badge

The product always calls its agent Bob. This badge names the model actually doing Bob's work (W-14).

- **Look:** a pill right after the word "Bob" or the title it sits in, gap 8px. `--bob` fill, 2px `--bob-dark` border, white weight-700 `--fs-sm`, radius `--r-pill`, padding 2px 9px.
- **Text:** "running on " + the model's plain name, for example "running on Gemini" or "running on IBM Bob". The server reports the name. The user never picks it.
- **Tooltip:** "Bob's answers come from Gemini right now." (with the model named).
- **Where:** Bob's title bar in Try & tweak ([Assistant](#assistant)), and the Build card's title row while a Build runs ([Build button and Build card](#build-button-and-build-card)). Nowhere else.
