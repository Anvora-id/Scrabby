<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Look decisions, 2026-09-26

Settled with the user on the look lab mockup (`prototypes/look-lab.html`). D-Q1 to D-Q13 are earlier decisions already written into the sections above. These decisions change the look only: what each screen holds and does (Checkpoints, Warnings, Bob picks, the Traits) follows PRD.md and TDD.md.

- **D-Q14** Direction: inspired by the block editor young coders know, but with its own identity, so it doesn't read as a clone. The problem with the old look was that it was washed-out and pastel. The personality is a mix of a chunky tactile toy (Blocks you could pick up and press) and crafty paper and stickers (sticker Traits, sticky-note Notes, a paper Canvas). References: Duolingo and Nintendo's Mario Maker.
- **D-Q15** Brand color Grape `#6B4EFF`: Scrabby and the user.
- **D-Q16** Bob blue `#315DFB` (the mascot's own blue) is Bob's color: it marks Bob and only Bob, next to Grape.
- **D-Q17** Nunito for the whole app; JetBrains Mono for code.
- **D-Q18** Category colors at Medium strength (71% lightness), replacing the 82% pastels.
- **D-Q19** Springy toy motion. The chunky bottom edges stay as in the mockup: 4px on Blocks, 5px on the big Build button (4px on the normal one), 3px on panels and primary buttons, 2px on small buttons, and they press down on click.
- **D-Q20** The mascot is Bob, the builder robot in `assets/Scrabby_2.svg` (a clean vector). The logo is Bob plus the "Scrabby" wordmark. Bob's pose stays exactly as drawn.
- **D-Q21** Problems are soft tomato `#FF5A4E`, not orange.
- **D-Q22** No black cartoon outlines in the UI; they stay on Bob's artwork.
- **D-Q23** Only Notes tilt (−1.6°). (One exception since 2026-09-27: the greeting's toy Blocks turn in 3D toward the pointer, [Screen layout](#screen-layout).) Everything else is straight: Blocks, Trait stickers, loose ideas, dragged items, chips, the Build stage and Bob. (Tilted stickers and a tilted loose idea were tried in the mockup and dropped.)
- **D-Q24** The Build step shows a Build stage (Bob hopping beside a pile of bricks that fills and clears itself in a loop), so even when a Build can't light up each Block or Trait as it goes, you can still see that Bob is working. There is no progress bar.
- **D-Q25** The code editor stays dark, tinted toward Grape.
- **D-Q26** The Canvas is dotted paper (`--ws` with `--ws-dot`), not graph paper or kraft paper.
- **D-Q27** Notes have no tape: a plain sticky note with a curled corner and a soft shadow.
