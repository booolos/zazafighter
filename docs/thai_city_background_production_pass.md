# Thai City Background Production Pass

Prepared for Zaza Fighter on 2026-05-15. This pass is documentation and prompt planning only; it does not touch character/NPC sprites or current asset wiring.

## Current Level And Background Audit

Runtime framing:

- World: `2200x720` (`WORLD_WIDTH`, `WORLD_HEIGHT`).
- Playable lane: `y=588..668`, with the scene adding a subtle dark lane overlay.
- Ambient sidewalk band: `y=552..594`.
- Stage backgrounds are scaled to world height and repeated horizontally, so final production backgrounds should be `2200x720` to avoid obvious tiling.
- Keep the bottom lane visually open, low-detail, and readable behind fighters, props, hits, and pickups.

Current levels from `src/game/content/levels.ts`:

| Level id | Title/city | Current background | Gap |
|---|---|---|---|
| `pattaya-walking-street` | Pattaya Walking Street | Default `background:level1-pattaya-storefronts` | Needs real Walking Street hero pass; current background is generic Pattaya storefronts. |
| `pattaya-soi-six` | Pattaya Soi Six | `background:soi-six` -> `soi-six-neon-bars-placeholder.jpg` | Has placeholder only; needs final Soi 6 narrow neon barfront pass. |
| `bangkok-sukhumvit` | Bangkok Sukhumvit | Reuses `background:walking-street` | Needs unique Bangkok Nana/Sukhumvit/BTS pass. |
| `phuket-bangla-road` | Phuket Bangla Road | Reuses `background:soi-buakhao` | Needs unique Bangla Road/Patong pass. |
| `chiang-mai-nimman` | Chiang Mai Nimman | Default generic Pattaya storefronts | Level title is Nimman, but requested art direction is better as Chiang Mai night market/Loi Kroh; needs unique Chiang Mai pass. |
| `krabi-ao-nang` | Krabi Ao Nang | Default generic Pattaya storefronts | Not in this pass; needs beach market pass later. |
| `koh-samui-chaweng` | Koh Samui Chaweng | Reuses `background:beach-road` | Needs unique Chaweng Beach Road pass. |
| `hua-hin-night-market` | Hua Hin Night Market | Reuses `background:soi-buakhao` | Not selected for the six prompts below; could reuse the Chiang Mai/Hua Hin night market art recipe with signage changes. |
| `ayutthaya-riverside` | Ayutthaya Riverside | Reuses `background:beach-road` | Not in this nightlife pass; needs riverside/old-city pass later. |
| `koh-phangan-haad-rin` | Koh Phangan Haad Rin | Reuses `background:walking-street` | Not in this pass; needs beach party strip pass later. |

Current generated background files:

- `walking-street.jpg`, `beach-road.jpg`, `soi-buakhao.jpg`, and `soi-six-neon-bars-placeholder.jpg` are `1024x576`, so they are scaled and repeated.
- `level1-pattaya-far-2048x720.jpg`, `level1-pattaya-play-lane.jpg`, `pattaya-neon-sidewalk-road-v2.jpg`, and `tattoo-weed-street-2048x720.jpg` are closer to production framing.
- New production files should use versioned `2200x720` names under `public/assets/generated/backgrounds/`.

## Global Image Requirements

Use these constraints in every prompt:

- Output exactly `2200x720`, side-scrolling beat-em-up background, one continuous horizontal scene.
- Camera at street level, slight wide-angle perspective, horizon around upper-middle, storefronts and signs in the top/middle, clean road/play lane across the bottom.
- Bottom `140px` should be mostly empty asphalt/concrete from `y=580` down, with only subtle reflections, lane texture, puddles, painted curb edges, and low debris.
- No background crowds, no pedestrians, no children, no vehicles blocking the lane, no fighter-like characters, no foreground NPCs.
- Ambient adult women, if needed, should be separate NPC sprites later; do not bake them into the background.
- Avoid copyrighted brand logos, real business names, legible trademarked signage, celebrity faces, or photo-collage realism.
- Style: polished 2D game background, semi-realistic painterly neon, crisp silhouettes, saturated Thai nightlife color, readable shapes, high contrast but not noisy.

## Background Briefs And Prompts

### 1. Pattaya Walking Street

Brief: Iconic Pattaya Walking Street entrance and neon strip energy: red arch signage, dense bar signs, overhead cables, narrow shopfronts, beer-neon glow, wet asphalt. It should feel like the first big Pattaya level, not generic storefronts.

Prompt:

```text
Create a 2200x720 side-scrolling beat-em-up game background inspired by Pattaya Walking Street at night, Thailand nightlife district, with a bold red walking-street-style entrance arch in the upper left third, stacked neon bar signs, Thai/English fictional signage, tangled overhead utility cables, wet asphalt reflections, shuttered shopfronts, beer neon, tattoo shop and cannabis-style sandwich-board shapes in the midground, saturated cyan magenta red lighting, polished semi-realistic 2D game art. Keep the camera street-level with deep horizontal perspective. The bottom 140 pixels must be a clear playable lane: mostly empty dark wet road/concrete from y=580 to y=720, low-detail reflections only, no obstacles, no crowds, no pedestrians, no vehicles in the lane, no foreground characters, no children, no copyrighted logos, no real business names. Leave open sidewalk pockets around y=552-594 for separate ambient NPC sprites. High readability for characters in front, crisp storefront silhouettes, one continuous 2200x720 image, no UI, no text overlays except fictional background signs.
```

Proposed asset:

- File: `public/assets/generated/backgrounds/pattaya-walking-street-v1-2200x720.jpg`
- Key: `background:pattaya-walking-street-v1`
- Code constant: `backgroundPattayaWalkingStreetV1`
- Intended level: `pattaya-walking-street`

### 2. Pattaya Soi Six

Brief: Tight Pattaya Soi 6 lane with close barfronts, pink neon, stool/chair silhouettes against walls, shallow storefront depth, more intimate than Walking Street. The current placeholder should be replaced by this.

Prompt:

```text
Create a 2200x720 side-scrolling beat-em-up game background inspired by Pattaya Soi 6 at night, a narrow neon bar street with close low-rise barfronts on both sides, dense pink and violet neon, small fictional bar signs, rolling shutters, patio chair silhouettes pushed against storefronts, hanging cables, AC units, tiled thresholds, wet concrete and road reflections. Polished semi-realistic 2D game art, saturated magenta cyan violet palette, readable shapes, no real business names. The bottom 140 pixels must be a clear playable lane from y=580 to y=720: open dark road/concrete, subtle puddles and reflections only, no chairs or scooters intruding into the lane. No crowds, no pedestrians, no baked-in women, no children, no vehicles blocking gameplay, no foreground characters. Reserve clear sidewalk pockets around y=552-594 for separate adult ambient NPC sprites. One continuous horizontal 2200x720 scene, no UI, no text overlays except fictional neon signage.
```

Proposed asset:

- File: `public/assets/generated/backgrounds/pattaya-soi-six-v1-2200x720.jpg`
- Key: `background:pattaya-soi-six-v1`
- Code constant: `backgroundPattayaSoiSixV1`
- Intended level: `pattaya-soi-six`

### 3. Bangkok Nana / Sukhumvit

Brief: Bangkok nightlife under/near the BTS line: elevated rail columns, Sukhumvit road geometry, Nana-style neon clusters, hotel/condo silhouettes, taxis/tuk-tuks only far in background, no lane clutter.

Prompt:

```text
Create a 2200x720 side-scrolling beat-em-up game background inspired by Bangkok Sukhumvit and Nana at night, with elevated BTS skytrain tracks crossing the upper background, concrete rail columns, dense fictional neon nightlife signs, hotel and condo towers, street food light boxes, overhead wires, wet city pavement, distant taxi color accents far behind the playable area, saturated Bangkok neon in magenta cyan amber. Polished semi-realistic 2D game background, crisp urban silhouettes, no real logos or real venue names. The bottom 140 pixels from y=580 to y=720 must remain a clean playable lane: mostly open asphalt/concrete with subtle reflections and lane texture only, no crowds, no pedestrians, no vehicles or tuk-tuks in the lane, no foreground characters, no children. Leave readable open sidewalk pockets around y=552-594 for separate ambient adult NPC sprites. One continuous 2200x720 side-scrolling image, no UI, no text overlays except fictional background signs.
```

Proposed asset:

- File: `public/assets/generated/backgrounds/bangkok-nana-sukhumvit-v1-2200x720.jpg`
- Key: `background:bangkok-nana-sukhumvit-v1`
- Code constant: `backgroundBangkokNanaSukhumvitV1`
- Intended level: `bangkok-sukhumvit`

### 4. Phuket Bangla Road

Brief: Patong/Bangla Road nightlife with warm carnival neon, sign canopies, bar entrances, tropical humidity, and a more tourist-district party strip feel than Pattaya.

Prompt:

```text
Create a 2200x720 side-scrolling beat-em-up game background inspired by Phuket Patong Bangla Road at night, tropical nightlife strip with warm amber neon, colorful fictional bar signs, canopy frames, open-front club entrances, palm hints and humid haze, wet pavement reflections, layered shopfronts, overhead wires, saturated yellow orange pink cyan lighting. Polished semi-realistic 2D game art, street-level horizontal perspective, no copyrighted logos, no real business names. The bottom 140 pixels from y=580 to y=720 must be a clear playable lane: empty dark wet asphalt/concrete, subtle reflections and small texture only, no crowds, no pedestrians, no vehicles, no scooters blocking, no foreground characters, no children. Reserve open sidewalk pockets near y=552-594 for separate ambient adult NPC sprites. One continuous 2200x720 image, readable silhouettes for game characters, no UI, no text overlays except fictional background signage.
```

Proposed asset:

- File: `public/assets/generated/backgrounds/phuket-bangla-road-v1-2200x720.jpg`
- Key: `background:phuket-bangla-road-v1`
- Code constant: `backgroundPhuketBanglaRoadV1`
- Intended level: `phuket-bangla-road`

### 5. Chiang Mai Night Market / Loi Kroh

Brief: Retarget `chiang-mai-nimman` toward a stronger Chiang Mai nightlife read: night market lanterns, Loi Kroh-style bar signs, northern craft stalls, red truck silhouettes far back, temple/old city hints, warmer green/amber accent.

Prompt:

```text
Create a 2200x720 side-scrolling beat-em-up game background inspired by Chiang Mai night market and Loi Kroh Road at night, northern Thailand nightlife with warm lantern strings, small fictional bar signs, market stall awnings, craft stall textures, old-city brick and subtle temple-roof silhouettes in the far background, green and amber neon accents, wet pavement after rain, overhead cables, relaxed but gritty night market mood. Polished semi-realistic 2D game art, crisp readable storefronts, no real business names, no copyrighted logos. The bottom 140 pixels from y=580 to y=720 must be an empty playable lane: mostly clear asphalt/concrete with subtle reflections, no stalls extending into the lane, no crowds, no pedestrians, no foreground people, no children, no vehicles blocking gameplay. Leave open sidewalk pockets around y=552-594 for separate adult ambient NPC sprites. One continuous horizontal 2200x720 image, no UI, no text overlays except fictional background signs.
```

Proposed asset:

- File: `public/assets/generated/backgrounds/chiang-mai-loi-kroh-night-market-v1-2200x720.jpg`
- Key: `background:chiang-mai-loi-kroh-night-market-v1`
- Code constant: `backgroundChiangMaiLoiKrohNightMarketV1`
- Intended level: `chiang-mai-nimman`, or rename level later to `chiang-mai-loi-kroh` if content copy is updated.

### 6. Koh Samui Chaweng

Brief: Chaweng Beach Road nightlife: island strip with scooters parked far off-lane, beach palms, resort signs, neon bars, sand/damp asphalt edge, purple island-night palette.

Prompt:

```text
Create a 2200x720 side-scrolling beat-em-up game background inspired by Koh Samui Chaweng Beach Road at night, island nightlife street with fictional neon bar and resort signs, palm tree silhouettes, hints of beach sand and sea breeze haze, low shopfronts, scooter parking pushed far into the background, wet asphalt reflections, purple cyan lime neon accents, tropical night atmosphere. Polished semi-realistic 2D game background, street-level wide horizontal perspective, crisp readable shapes, no real business names, no copyrighted logos. The bottom 140 pixels from y=580 to y=720 must remain a clear playable lane: open road/concrete, subtle reflections and texture only, no scooters or objects intruding into gameplay, no crowds, no pedestrians, no baked-in women, no children, no foreground characters. Leave clear sidewalk pockets near y=552-594 for separate adult ambient NPC sprites. One continuous 2200x720 image, no UI, no text overlays except fictional background signage.
```

Proposed asset:

- File: `public/assets/generated/backgrounds/koh-samui-chaweng-v1-2200x720.jpg`
- Key: `background:koh-samui-chaweng-v1`
- Code constant: `backgroundKohSamuiChawengV1`
- Intended level: `koh-samui-chaweng`

## Optional Hua Hin Variant

If Hua Hin is prioritized over Koh Samui, reuse the Chiang Mai night-market structure but make it flatter, seafood-market focused, and orange/red:

- File: `public/assets/generated/backgrounds/hua-hin-night-market-v1-2200x720.jpg`
- Key: `background:hua-hin-night-market-v1`
- Code constant: `backgroundHuaHinNightMarketV1`
- Intended level: `hua-hin-night-market`

Prompt seed:

```text
Create a 2200x720 side-scrolling beat-em-up game background inspired by Hua Hin Night Market at night, seafood stalls, warm orange lanterns, fictional Thai market signs, low shopfronts, awnings, wet pavement, relaxed coastal market atmosphere, polished semi-realistic 2D game art. Bottom 140 pixels from y=580 to y=720 must be a clean empty playable lane with subtle reflections only. No crowds, no pedestrians, no children, no foreground characters, no vehicles or stalls blocking the lane, no real business names or copyrighted logos. Leave sidewalk pockets around y=552-594 for separate ambient adult NPC sprites.
```

## Proposed Manifest Additions

Add new keys to `src/game/assets/manifest.ts` only after assets exist:

```ts
backgroundPattayaWalkingStreetV1: 'background:pattaya-walking-street-v1',
backgroundPattayaSoiSixV1: 'background:pattaya-soi-six-v1',
backgroundBangkokNanaSukhumvitV1: 'background:bangkok-nana-sukhumvit-v1',
backgroundPhuketBanglaRoadV1: 'background:phuket-bangla-road-v1',
backgroundChiangMaiLoiKrohNightMarketV1: 'background:chiang-mai-loi-kroh-night-market-v1',
backgroundKohSamuiChawengV1: 'background:koh-samui-chaweng-v1',
```

Add matching paths:

```ts
backgroundPattayaWalkingStreetV1: 'assets/generated/backgrounds/pattaya-walking-street-v1-2200x720.jpg',
backgroundPattayaSoiSixV1: 'assets/generated/backgrounds/pattaya-soi-six-v1-2200x720.jpg',
backgroundBangkokNanaSukhumvitV1: 'assets/generated/backgrounds/bangkok-nana-sukhumvit-v1-2200x720.jpg',
backgroundPhuketBanglaRoadV1: 'assets/generated/backgrounds/phuket-bangla-road-v1-2200x720.jpg',
backgroundChiangMaiLoiKrohNightMarketV1: 'assets/generated/backgrounds/chiang-mai-loi-kroh-night-market-v1-2200x720.jpg',
backgroundKohSamuiChawengV1: 'assets/generated/backgrounds/koh-samui-chaweng-v1-2200x720.jpg',
```

Add generated-manifest records:

```json
{
  "key": "pattaya-walking-street-v1",
  "path": "assets/generated/backgrounds/pattaya-walking-street-v1-2200x720.jpg",
  "role": "production Pattaya Walking Street stage background"
}
```

Repeat the same JSON shape for:

- `pattaya-soi-six-v1`
- `bangkok-nana-sukhumvit-v1`
- `phuket-bangla-road-v1`
- `chiang-mai-loi-kroh-night-market-v1`
- `koh-samui-chaweng-v1`

## Proposed Level Wiring After Asset Generation

- `pattaya-walking-street` -> `assetKeys.backgroundPattayaWalkingStreetV1`
- `pattaya-soi-six` -> `assetKeys.backgroundPattayaSoiSixV1`
- `bangkok-sukhumvit` -> `assetKeys.backgroundBangkokNanaSukhumvitV1`
- `phuket-bangla-road` -> `assetKeys.backgroundPhuketBanglaRoadV1`
- `chiang-mai-nimman` -> `assetKeys.backgroundChiangMaiLoiKrohNightMarketV1`
- `koh-samui-chaweng` -> `assetKeys.backgroundKohSamuiChawengV1`

Do not wire these until the files are present and validated at `2200x720`.
