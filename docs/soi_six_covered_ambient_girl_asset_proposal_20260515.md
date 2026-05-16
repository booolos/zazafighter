# Soi Six Covered Ambient Girl Asset Proposal - 2026-05-15

Scope: docs and art-source planning only. These are not runtime assets and should not be added to the public manifest until a later chop, normalization, and QA pass.

## Production Standard

- Adult women only; every prompt and review note must explicitly say adult, late 20s or older.
- Nightlife silhouette should read as Pattaya/Soi Six, but stay publishable: clubwear, streetwear, moto jackets, satin dresses, opaque tights, denim, boots, sneakers, heels.
- No nudity, pornographic framing, sex acts, explicit anatomy focus, see-through clothing, school uniforms, or underage-coded styling.
- Prefer full-body, right-facing silhouettes on chroma-key green or transparent strips.
- Future sprite-strip target remains 256x256 per frame, bottom-center foot anchor, stable scale, complete feet/hands, readable at mobile size.

## Advance Candidates

| Candidate | Source in proposal | Original source | Status | Notes |
| --- | --- | --- | --- | --- |
| Mintra | `art-source/proposals/soi-six-covered-ambient-girls-20260515/source-candidates/advance/mintra-hd-source.png` | `public/assets/generated/source-sheets/soi-six-hd-mintra-source-v1-20260515.png` | Advance | Strong HD sheet; teal top, dark skirt, boots. Needs frame-count review and chroma-key cleanup. |
| Kanda | `art-source/proposals/soi-six-covered-ambient-girls-20260515/source-candidates/advance/kanda-hd-source.png` | `public/assets/generated/source-sheets/soi-six-hd-kanda-source-v1-20260515.png` | Advance | Strong VIP hostess silhouette; dress reads nightlife without explicit content. Check lower-row crop before import. |
| Dao | `art-source/proposals/soi-six-covered-ambient-girls-20260515/source-candidates/advance/dao-hd-source.png` | `public/assets/generated/source-sheets/soi-six-hd-dao-source-v1-20260515.png` | Advance | Best covered streetwear candidate: moto jacket, denim, sneakers. Good base for ambient runner/walker. |
| Ploy | `art-source/proposals/soi-six-covered-ambient-girls-20260515/source-candidates/advance/ploy-hd-source.png` | `public/assets/generated/source-sheets/soi-six-hd-ploy-source-v1-20260515.png` | Advance | Most covered HD candidate; pants and boots give a clean silhouette for animation. |
| npc-girl-denim | `art-source/proposals/soi-six-covered-ambient-girls-20260515/source-candidates/advance/npc-girl-denim-idle-256x256.png` | `art-source/_ambient_girl_normalized/npc-girl-denim/idle-256x256.png` | Advance as idle reference | Already normalized idle strip; can guide scale/anchor for future strips. |
| npc-girl-silver | `art-source/proposals/soi-six-covered-ambient-girls-20260515/source-candidates/advance/npc-girl-silver-idle-256x256.png` | `art-source/_ambient_girl_normalized/npc-girl-silver/idle-256x256.png` | Advance with coverage check | Usable as a baseline idle candidate; review outfit read at game scale. |
| npc-girl-black | `art-source/proposals/soi-six-covered-ambient-girls-20260515/source-candidates/advance/npc-girl-black-idle-256x256.png` | `art-source/_ambient_girl_normalized/npc-girl-black/idle-256x256.png` | Advance with coverage check | Usable as a silhouette/anchor reference; may need a more covered repaint for final use. |

Advance contact sheet:

`art-source/proposals/soi-six-covered-ambient-girls-20260515/covered-ambient-girls-advance-contact-sheet.png`

## Screened Hold

| Candidate | Source in proposal | Original source | Status | Reason |
| --- | --- | --- | --- | --- |
| Mew | `art-source/proposals/soi-six-covered-ambient-girls-20260515/source-candidates/screened-hold/mew-hd-source.png` | `public/assets/generated/source-sheets/soi-six-hd-mew-source-v1-20260515.png` | Hold/repaint | Quality may be useful, but outfit coverage is not aligned with this pass. Repaint as jacket, skirt, shorts, or pants before advancing. |
| Nina | `art-source/proposals/soi-six-covered-ambient-girls-20260515/source-candidates/screened-hold/nina-idle-imported.png` | `art-source/_imagegen_review/soi-six-nina/idle-imported.png` | Hold/repaint | Idle timing may be useful, but coverage should be increased before this pass uses it. |
| Ruby | `art-source/proposals/soi-six-covered-ambient-girls-20260515/source-candidates/screened-hold/ruby-idle-imported.png` | `art-source/_imagegen_review/soi-six-ruby/idle-imported.png` | Hold/repaint | Idle timing may be useful, but styling is more pin-up than ambient street silhouette. |
| microbikini runners | Not copied | `public/assets/generated/source-sheets/soi-six-microbikini-runners-v1.png` | Reject for this pass | Explicitly outside the more-covered direction. Do not advance for covered ambient NPC production. |

Screened-hold contact sheet:

`art-source/proposals/soi-six-covered-ambient-girls-20260515/covered-ambient-girls-screened-hold-contact-sheet.png`

## New Covered Candidate Briefs

Use these as next-generation prompts if new source sheets are generated later. Keep the same chroma-key and no-runtime rule from the existing pipeline.

1. `soi-six-jacket-hostess`: Adult Thai woman, late 20s, cropped satin bomber jacket over opaque fitted black top, high-waisted charcoal trousers, ankle boots, hoop earrings, confident door-host stance. Rows: walk, talk/callout, react.
2. `soi-six-moto-promoter`: Adult Thai woman, early 30s, teal moto jacket, dark jeans, white sneakers, crossbody belt bag, helmet under one arm only in seed pose. Rows: walk, wave/callout, panic.
3. `soi-six-denim-dancer`: Adult Thai woman, late 20s, oversized denim jacket, metallic top with full coverage, black bike shorts over opaque tights, chunky boots. Rows: dance-step idle, cheer, walk.
4. `soi-six-vip-jumpsuit`: Adult Asian woman, early 30s, sleek black sleeveless jumpsuit, gold belt, heels, bob haircut, composed lounge-host posture. Rows: idle, talk, react.
5. `soi-six-neon-streetwear`: Adult Thai woman, late 20s, neon windbreaker, fitted opaque tank, cargo skirt over leggings, platform sneakers, playful street promoter gestures. Rows: walk, callout, panic.

## Next Pass Checklist

- Crop/chop the HD sheets into rows without changing source identity.
- Remove chroma-key to alpha and normalize accepted frames to 256x256.
- Reject frames with cropped feet, repeated stills, identity drift, outfit drift, impossible limbs, or explicit framing.
- Only after visual QA, create runtime strips in a separate implementation task.
- Do not edit `src/`, `public/manifest.json`, or runtime asset registries as part of this planning pass.
