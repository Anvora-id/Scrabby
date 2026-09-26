<!-- Generated from DESIGN.md by scripts/split-specs.mjs. Do not edit. -->
## Library

A tab beside Canvas ([Shell](#shell)). Assets are never dragged onto Blocks; the image and video Traits pick them from a dropdown ([Trait](#trait)). **Hackathon build: images and video.** Sound is Stretch (PRD §6); it comes with its Trait and tile icon.

- Panel padding 16px. Heading "Library" (`--fs-lg` weight 900), hint "Images and videos for this Project. Pick one inside an image or video Trait." (`--fs-sm`, `--hint`).
- A primary "Upload" button ([Buttons](#buttons)) that accepts image and video files.
- A responsive grid of square tiles, gap 12px, as many columns as fit. The column width grows with the panel: at least 16% of the panel's width, never under 168px or over 260px, and the columns share any leftover space. Empty columns are kept, so a few photos never grow huge. A tile has padding 8px: `--surface`, 2px `--line` border, a 3px `--line` bottom edge, radius `--r-panel`, centered, lifting 2px on hover; it grows taller only when a rename problem needs the room. Each tile shows the image itself (fit inside a 3:2 box the tile's full width, radius 8px), then the file name (`--fs-sm` weight 700, one line, ending in "…" if long). A 40px `--hint` image icon ([Icons](#icons), duotone) stands in while an image loads or if it can't be shown. A video tile shows a 40px `--hint` `video-camera` icon (duotone), then the file name.
- **Empty:** centered in the panel, Bob's head (48px, white, 2px `--line` ring) above "Nothing here yet. Upload an image or a video." (`--hint`, `--fs-md`, weight 700), like the empty chat ([Assistant](#assistant)).
