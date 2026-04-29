# Slap Street: Ink District Production Roadmap

## Current State

The project now has a sprint-ready asset foundation:

- 4 Pattaya nightlife background/runtime layers
- 12 normalized transparent character seed sprites
- 16 transparent prop cutouts
- 13 transparent UI cutouts
- 3 VFX sprite sheets
- 90 standardized placeholder animation sheets
- a generated asset manifest at `public/assets/generated/manifest.json`

The current animation sheets are useful for Phaser integration and early gameplay tuning, but they are placeholder motion created from seed sprites. Final production animation still needs bespoke frame strips.

## Production Principle

Do not let code, animation, and content drift apart.

Every playable or non-playable character should be represented by:

- character data
- normalized seed sprite
- animation sheet set
- combat profile or NPC behavior profile
- manifest entry
- QA status

Every new feature should be testable in the browser on mobile landscape before it is considered complete.

## Phase 1: Asset Pipeline Hardening

Goal: make the asset pack reliable enough that coders can build without guessing.

Work:

- Keep `public/assets/generated/manifest.json` as the source of truth for generated runtime assets.
- Add a stricter character manifest format for playable characters, NPCs, enemies, bosses, and vendors.
- Add validation scripts for:
  - missing files
  - wrong image dimensions
  - missing alpha on sprites, props, UI, and VFX
  - mismatched animation frame sizes
  - missing required actions per character role
- Create contact sheets automatically for:
  - characters
  - props
  - UI
  - VFX
  - animation previews
- Keep source generations in `public/assets/generated/source/` for traceability.
- Keep processed runtime assets separate from source sheets.

Done when:

- one command can validate the whole asset pack
- one command can regenerate preview/contact sheets
- the manifest clearly says which assets are final, placeholder, or needs-regeneration

## Phase 2: Final Animation Production

Goal: replace placeholder animation sheets with production-quality animation strips while keeping the same runtime paths and frame dimensions.

Frame standard:

- `256x256` frame slots
- PNG with alpha
- facing right
- bottom-center foot baseline
- no labels
- no background
- no shadows baked onto a floor
- consistent body scale across all actions for the same character

Playable main animations:

- `idle`: 4 frames
- `walk`: 6 frames
- `run`: 6 frames
- `attack-light`: 4 frames
- `attack-heavy`: 5 frames
- `combo-finisher`: 6 frames
- `jump`: 4 frames
- `dodge`: 4 frames
- `hurt`: 2 frames
- `knockdown`: 4 frames
- `get-up`: 4 frames
- `death`: 4 frames
- `super-slap`: 6 frames
- `victory`: 4 frames

Enemy animations:

- `idle`: 4 frames
- `walk`: 6 frames
- `attack`: 4 frames
- `hurt`: 2 frames
- `stunned`: 4 frames
- `knockdown`: 4 frames
- `get-up`: 4 frames
- `death`: 4 frames

Mini-boss animations:

- all enemy animations
- `windup`: 4 frames
- `heavy-attack`: 6 frames
- `rage`: 4 frames

NPC animations:

- `idle`: 4 frames
- `talk`: 4 frames
- `walk`: 6 frames
- `react`: 4 frames
- `cheer`: 4 frames
- `panic`: 4 frames

Animation production process:

1. Approve one seed frame.
2. Build a reference canvas around that seed frame.
3. Generate or hand-draw one full action strip at a time.
4. Normalize to `256x256` slots.
5. Render preview sheet.
6. Test in Phaser against actual movement/combat timing.
7. Replace placeholder runtime sheet only after QA.

Done when:

- Kiko and Big Ink have final bespoke animation sets
- the basic street enemy has a final combat animation set
- one NPC has final idle/talk/react
- Phaser animation timing is tuned against real sheets

## Phase 3: Data-Driven Character System

Goal: make adding characters later a content task instead of a scene rewrite.

Work:

- Introduce a `characters.json` or TypeScript registry with one entry per character.
- Each character entry defines:
  - id
  - display name
  - role
  - faction
  - asset folder
  - required animations
  - optional animations
  - stats
  - collision size
  - attack boxes
  - hurt box
  - super ability eligibility
  - AI behavior profile
  - UI portrait/icon
  - unlock state
- Build loader helpers that read the registry and load every required sprite sheet.
- Build animation helpers that create Phaser animations from registry data.
- Build factory helpers:
  - `createPlayer(id)`
  - `createEnemy(id)`
  - `createNpc(id)`
  - `createBoss(id)`
- Keep scenes unaware of individual filenames.

Done when:

- adding a new enemy requires adding assets and one registry entry
- adding a new playable character requires assets, stats, and optional unlock metadata
- scenes use character ids, not hard-coded asset paths

## Phase 4: Combat Prototype Sprint

Goal: make the game feel like a real beat-em-up with readable slap combat.

Core verbs:

- move left/right
- move up/down within shallow lane
- light slap
- heavy attack
- dodge
- Super Slap
- interact/enter shop

Combat systems:

- player and enemy health
- hit-stop
- knockback
- invulnerability windows
- combo window
- attack cooldowns
- active hitboxes by animation frame
- hurtboxes
- lane-depth targeting
- enemy aggro distance
- simple enemy attack patterns
- boss windup/stun loop
- super meter gain from hits and damage taken

Super Slap rules:

- only playable main characters can use it
- requires full meter
- consumes full meter
- launches a forward shockwave
- causes knockback, hit-stop, camera shake, and blue neon VFX
- cannot be used by NPCs, enemies, or mini-bosses

Done when:

- Kiko and Big Ink both feel distinct
- at least two enemy types fight differently
- Super Slap is powerful but not always available
- the player can clear a short street encounter and enter the tattoo shop

## Phase 5: Level 1 Vertical Slice

Goal: ship one polished playable mobile landscape level.

Level: Pattaya nightlife soi, tattoo shop across from weed shop.

Flow:

1. Start near the weed shop.
2. Learn movement and slap.
3. Fight first street punk.
4. Meet vendor/NPC.
5. Fight enemy group in the wet street lane.
6. Charge Super Slap.
7. Use Super Slap to clear a heavy enemy.
8. Reach tattoo shop door.
9. Trigger level-clear screen.

Environment work:

- parallax background
- midground storefront layer
- foreground prop placement
- collision boundaries
- exit trigger
- camera bounds
- puddle and neon reflection polish
- safe play lane readability

Encounter work:

- enemy spawn points
- enemy pacing
- mini-boss or heavy enemy gate
- reward pickups
- score/combo rewards

Done when:

- level can be completed in 2 to 4 minutes
- works on mobile landscape
- no essential UI blocks the play lane
- game still runs if a future asset is missing by showing a clear fallback

## Phase 6: Mobile UI and Menus

Goal: make the game usable on phones without feeling like a web demo.

Screens:

- boot/preload
- title menu
- character select
- pause
- settings
- rotate-device overlay
- level clear
- game over

HUD:

- health
- Super Slap meter
- combo counter
- objective chip
- coin/score
- pause button

Touch controls:

- virtual joystick
- slap button
- dodge/jump button
- Super Slap button
- optional interact button when near doors/NPCs

Done when:

- all controls fit landscape phones
- portrait blocker appears in portrait
- UI is readable against bright Pattaya neon
- controls have press feedback
- Super Slap button clearly shows charged state

## Phase 7: NPC, Dialogue, and World Flavor

Goal: make the world feel alive without overloading the first level.

NPC types:

- weed shop vendor
- tattoo artist
- lounge manager
- bar promoter
- street-food vendor
- scooter mechanic

NPC behaviors:

- idle
- talk
- react to fight
- walk small patrol
- cheer after fight

Dialogue:

- short one-line barks
- no long cutscenes in Level 1
- optional shop flavor lines
- clear mission prompts

Done when:

- NPCs can be placed from data
- each NPC has a behavior profile
- dialogue lines are authored outside scene code

## Phase 8: Audio

Goal: make combat feel punchy and the Pattaya setting alive.

Needed audio:

- slap hit
- heavy hit
- Super Slap charge
- Super Slap release
- enemy hurt
- pickup
- UI tap
- level clear
- neon hum
- wet street ambience
- distant nightlife crowd
- scooter pass-by
- music loop

Implementation:

- use compressed web audio
- separate SFX and music volume
- respect mobile autoplay rules by starting audio after user tap
- add mute/pause handling

Done when:

- every main verb has sound
- loop does not fatigue quickly
- audio starts reliably on mobile after first interaction

## Phase 9: Progression and Content Expansion

Goal: prepare for more levels and more characters.

Systems:

- character unlocks
- level unlocks
- upgrades or perks
- coin rewards
- score ranks
- simple save data in local storage

Content expansion:

- Level 2: tattoo shop interior
- Level 3: beach road / scooter chase-style fight
- Level 4: rooftop sign district
- optional boss arena

Done when:

- new level config can be added without scene rewrite
- new characters can be unlocked from data

## Phase 10: QA, Performance, and Release

Goal: make the vertical slice solid enough for GitHub Pages.

QA:

- desktop browser smoke test
- mobile landscape test
- portrait blocker test
- touch controls test
- asset loading test
- missing asset fallback test
- animation baseline test
- hitbox/hurtbox debug test
- level complete test

Performance:

- asset size audit
- texture size audit
- preloading progress
- avoid overdraw from huge transparent sheets
- compress backgrounds
- keep spritesheet dimensions browser-safe

Release:

- GitHub Pages build
- manifest orientation
- favicon/app icons
- README with play instructions
- known issues list

Done when:

- production build passes
- deployed build loads on mobile
- one complete level is playable end to end

## Immediate Next Sprint Recommendation

The next sprint should be:

1. Implement data-driven asset and character registry.
2. Replace scene hard-coding with manifest-driven loading.
3. Wire current animation sheets into Phaser animations.
4. Build hitbox/hurtbox debug overlay.
5. Implement Level 1 playable loop with Kiko, Big Ink, one enemy, and one NPC.

This gives the project a stable skeleton before investing more time in final bespoke animation.
