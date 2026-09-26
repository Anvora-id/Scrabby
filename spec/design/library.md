<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Library

A tab beside Canvas ([Shell](#shell)). Assets are never dragged onto Blocks; the image and video Traits pick them from a dropdown ([Trait](#trait)). **Hackathon build: images and video.** Sound is Stretch (PRD §6); it comes with its Trait and tile icon.

- Panel padding 16px. Heading "Library" (`--fs-lg` weight 900), hint "Images and videos for this Project. Pick one inside an image or video Trait." (`--fs-sm`, `--hint`).
- A primary "Upload" button ([Buttons](#buttons)) that accepts image and video files.
- A grid of 124×124px tiles, gap 12px: `--surface`, 2px `--line` border, a 3px `--line` bottom edge, radius `--r-panel`, centered, lifting 2px on hover. Each tile shows the image itself (fit inside, 84px tall, radius 8px), then the file name (`--fs-sm` weight 700, one line, ending in "…" if long). A 40px `--hint` image icon ([Icons](#icons), duotone) stands in while an image loads or if it can't be shown. A video tile shows a 40px `--hint` `video-camera` icon (duotone), then the file name.
