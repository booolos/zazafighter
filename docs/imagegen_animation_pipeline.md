# Imagegen Animation Pipeline

This is the runtime art pipeline for adding or replacing character animation frames.

## Contract

- Generate one horizontal action strip at a time.
- Use equal cells, normally `256x256` runtime frames.
- Keep one character, one action, one facing direction per sheet.
- Use a flat `#00ff00` chroma-key background.
- Import with `scripts/import-imagegen-sheet.py`.
- Review outputs in `public/assets/generated/animations/_imagegen_review/` before scaling the pass.

## Runtime Action Sets

Players:

- `idle`
- `walk`
- `dodge` runtime key, presented to players as `RUSH`
- `jump`
- `attack`
- `hurt`
- `stunned`
- `knockdown`
- `get-up`
- `death`
- `super-slap`
- `victory`

Enemies and bosses:

- `idle`
- `walk`
- `attack`
- `hurt`
- `stunned`
- `knockdown`
- `get-up`
- `death`

NPCs:

- `idle`
- `talk`
- `walk`
- `react`
- `cheer`
- `panic`

## Import Example

```bash
python3 scripts/import-imagegen-sheet.py \
  --input tmp/imagegen/kiko-walk-source.png \
  --out public/assets/generated/animations/kiko/walk.png \
  --frames 6 \
  --split-mode components \
  --target-height 226 \
  --review-copy public/assets/generated/animations/_imagegen_review/kiko/walk-imported.png \
  --source-copy public/assets/generated/animations/_imagegen_review/kiko/walk-source.png
```

Use `--split-mode components` when imagegen leaves uneven horizontal padding or lets limbs drift across equal cell boundaries. Use the default equal split only when the sheet clearly obeys exact cell slots.

## Prompt Template

```text
Use case: game asset sprite animation sheet.
Asset type: production 2D fighting game character <ACTION> animation strip for Phaser runtime.
Primary request: Create a <FRAME_COUNT>-frame horizontal animation strip of <CHARACTER> performing <ACTION>. Same character identity and outfit in every frame.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal. The background must be one uniform color with no shadows, gradients, texture, floor plane, scenery, labels, or lighting variation. Do not use #00ff00 anywhere in the character.
Style/medium: polished hand-painted 2D arcade fighting game sprite art, clean readable silhouette, crisp edges, strong anatomy, consistent proportions, high-quality production game asset.
Composition/framing: one horizontal strip with exactly <FRAME_COUNT> equal 256x256 cells. Character faces right in all frames. Bottom-center foot contact should align across all cells. Full body visible, no cropping.
Animation requirements: true animation with distinct key poses. Do not simply wobble, smear, scale, squash, or slide the same pose.
Constraints: no text, no numbers, no UI, no watermark, no shadows, no extra characters, no background objects. Exact frame strip layout, consistent scale, consistent costume, same facing direction.
```
