# Soi Six HD Girls 16-Frame Asset Pipeline Audit - 2026-05-15

Scope: docs/art-source preparation only. No runtime source, public manifest, or shipped asset files were changed.

Characters audited: `soi-six-hd-dao`, `soi-six-hd-kanda`, `soi-six-hd-mintra`, `soi-six-hd-ploy`, `soi-six-hd-mew`.

## Current Runtime Counts

All five runtime girls use `384x384` transparent frames, render scale `0.34`, origin `(0.5, 0.95)`. None of the currently wired runtime strips are true 16-frame strips.

| Character | Idle | Talk | Walk | Run | React | Cheer | Panic |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Dao | 8 | 8 | 10 | 11 | 4 | 8 | 11 |
| Kanda | 8 | 8 | 10 | 11 | 4 | 8 | 11 |
| Mintra | 8 | 8 | 10 | 11 | 4 | 8 | 11 |
| Ploy | 8 | 8 | 10 | 11 | 4 | 8 | 11 |
| Mew | 10 | 10 | 10 | 10 | 4 | 10 | 10 |

## Files That Need True 16-Frame Regeneration

Regenerate these as new true 16-frame source passes later; do not pad, duplicate, tween, or frame-hold the current strips to reach 16.

| Character | Runtime files to replace later |
| --- | --- |
| Dao | `public/assets/generated/animations/soi-six-hd-dao/idle.png`, `talk.png`, `walk.png`, `run.png`, `react.png`, `cheer.png`, `panic.png` |
| Kanda | `public/assets/generated/animations/soi-six-hd-kanda/idle.png`, `talk.png`, `walk.png`, `run.png`, `react.png`, `cheer.png`, `panic.png` |
| Mintra | `public/assets/generated/animations/soi-six-hd-mintra/idle.png`, `talk.png`, `walk.png`, `run.png`, `react.png`, `cheer.png`, `panic.png` |
| Ploy | `public/assets/generated/animations/soi-six-hd-ploy/idle.png`, `talk.png`, `walk.png`, `run.png`, `react.png`, `cheer.png`, `panic.png` |
| Mew | `public/assets/generated/animations/soi-six-hd-mew/idle.png`, `talk.png`, `walk.png`, `run.png`, `react.png`, `cheer.png`, `panic.png` |

Priority order: regenerate locomotion first (`run`, `panic`, `walk`), then social loops (`idle`, `talk`, `cheer`), then decide whether `react` should become a true 16-frame reaction or remain a short 4-frame one-shot by design.

## Source Sheet Inputs

Use these only as seed/reference material for the later generation pass:

| Character | Source sheet | Size | Current status |
| --- | --- | ---: | --- |
| Dao | `public/assets/generated/source-sheets/soi-six-hd-dao-source-v1-20260515.png` | `1774x887` | Good covered streetwear base. |
| Kanda | `public/assets/generated/source-sheets/soi-six-hd-kanda-source-v1-20260515.png` | `1774x887` | Good VIP hostess base; review lower-row feet before reuse. |
| Mintra | `public/assets/generated/source-sheets/soi-six-hd-mintra-source-v1-20260515.png` | `1774x887` | Strong base; chroma-key cleanup needed before extraction. |
| Ploy | `public/assets/generated/source-sheets/soi-six-hd-ploy-source-v1-20260515.png` | `1751x898` | Strong base; boots give a readable foot silhouette. |
| Mew | `public/assets/generated/source-sheets/soi-six-hd-mew-source-v1-20260515.png` | `1619x972` | Hold/repaint before advancing; keep adult, covered, non-explicit styling. |

## Normalization Without Clipping Feet

Target output for every regenerated runtime strip: `6144x384` PNG, 16 equal `384x384` transparent frames, right-facing, bottom-center anchored.

Use one shared scale per character/action strip, based on the largest accepted alpha bbox in that strip. Do not scale each frame independently.

Ground/bottom targets from the current shipped sheets:

| Character | Current max alpha height | Current bottom buffer | Recommended foot baseline |
| --- | ---: | ---: | ---: |
| Dao | `346px` | `20px` | bbox bottom at `y=364` |
| Kanda | `346px` | `20px` | bbox bottom at `y=364` |
| Mintra | `346px` | `20px` | bbox bottom at `y=364` |
| Ploy | `346px` | `20px` | bbox bottom at `y=364` |
| Mew | `344px` | `18px` | bbox bottom at `y=366`, or normalize down to `y=364` if matching the other four |

Per-strip notes:

- `idle`, `talk`, `cheer`, `react`: current lateral margins are generous. Keep the body centered on `x=192`; lock foot bottom to the baseline above and preserve at least `16px` bottom transparency.
- `walk`: current max bbox widths are `174-192px` for Dao/Kanda/Mintra/Ploy and `191px` for Mew. Regenerate with full stride visible, then center by the midpoint of the supporting feet, not by hair/arms.
- `run` and `panic`: these are the widest strips today, up to `251px` for Dao. Budget for `260-280px` max bbox width inside each `384px` frame; keep at least `48px` side clearance after normalization so forward feet and trailing heels do not touch the cell edge.
- Mew: repaint or regenerate the source before normalization if keeping her in this pass. Do not normalize a source frame whose outfit/cropping fails the covered, adult, non-explicit requirement.

Reject any frame before strip assembly if the alpha bbox touches any cell edge, if a shoe/heel/toe is cut by the source, or if the lowest foot cannot fit with at least `16px` transparent bottom padding. When a generated pose is too tall, reduce the shared strip scale slightly; do not crop the foot to preserve apparent height.

## Later Pipeline Pass

1. Generate each action as a single 16-frame strip per character, not frame-by-frame.
2. Keep adult, covered, non-nude, non-explicit prompts and the same identity/outfit across the full strip.
3. Remove chroma-key to alpha with despill before final normalization.
4. Normalize to `384x384` cells using bottom-center foot anchoring and one shared scale.
5. Render a preview contact sheet and inspect feet, hands, identity, outfit continuity, and alpha edges.
6. Only after visual QA, update runtime assets and manifests in a separate implementation task.
