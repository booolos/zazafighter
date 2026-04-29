# UI/UX And Animation Sprint Plan

## Current Checkpoint

The game is now playable through the menu, character select, and level loop. The start button works, Casey is renamed, the player starts on the left, NPCs/enemies are on the right, and the tattoo shop is positioned across the street from the weed shop in a Pattaya nightlife backdrop.

The current asset foundation includes:

- 12 registry-driven characters
- 90 generated animation strips
- generated HUD/control button assets
- generated Pattaya storefront/background layers
- runtime character loading from `src/game/content/characterRegistry.json`
- backend-facing character scaffold and validation scripts

The current animation strips are sprint-ready placeholders generated from seed art. They are good enough for runtime integration, hit timing, and UI testing, but they are not final production animation.

Asset-quality warning: the deterministic strips are intentionally stable, but they are not production art. Treat them as alignment, frame-count, timing, and fallback references. Production animation should come from approved imagegen seed frames and reviewed full action strips, then be normalized into the same runtime format only after QA.

## Older Static-ZF Review Reference

The user's pasted older code review came from a static-ZF implementation context. Keep it as a reference for product and readability concerns, not as current code evidence. The current project is a Vite/TypeScript/Phaser beat-em-up with registry-driven characters, deterministic placeholder strips, DOM HUD controls, and runtime combat profiles.

Applicable ideas to carry forward:

- audit the asset set before more runtime tuning so final-art gaps, placeholder strips, missing jump states, and UI-control assets are visible in one list
- prioritize animation readability at actual browser scale over full-size contact-sheet appeal
- use imagegen for approved character seed frames first, then full strips, rather than asking one generation to solve identity, pose, layout, and cleanup at once
- make jump a real beat-em-up hop with shadow separation, invulnerability rules, and landing recovery
- make knockback depend on character weight/hurtbox class so light enemies pop, medium enemies move predictably, and heavy enemies feel grounded
- keep controls explicit and icon-forward, especially jump/dodge/slap/super on mobile landscape
- browser-QA every feature on desktop and mobile landscape before treating it as done

Non-applicable older-review assumptions:

- do not import static HTML/CSS/JS structure into the current Vite/TypeScript scene organization
- do not treat older static file paths as canonical; use the current `public/assets/generated/...` paths and `src/game/content/characterRegistry.json`
- do not overwrite deterministic strips just to appear more polished; the replacement must pass runtime and art QA

## Product Target

Build a side-scrolling 2D street-fighting prototype with a Pattaya nightlife, neon, degen-side Thailand tone. The UI should feel like game hardware and street signage, not a generic web app. The player should immediately understand:

- who they are playing
- how much HP and meter they have
- where the objective is
- which touch controls perform movement, jump, slap, dodge, and super
- when pause, restart, KO, and victory states are active

Persistent UI must protect the playfield. The center and lower-middle fight area should stay mostly open during normal play.

## UI/UX Sprint Goals

### 1. HUD Readability

Keep the top HUD compact and asset-driven:

- left: player identity, HP, slap meter
- center: objective chip
- right: pause button

Use generated UI frame assets for the player panel, objective chip, HP frame, slap meter frame, and pause button.

Acceptance:

- HUD is readable over dark and bright background areas.
- Text never overlaps frames or bars.
- The objective chip is visible but does not dominate the scene.
- Desktop and mobile layouts use the same visual language.

### 2. Controls Visibility

Controls should remain visible in the in-app browser and on mobile:

- joystick anchored lower-left
- slap/dodge/jump/super cluster anchored lower-right
- pause remains top-right
- controls dim during pause/outcome overlays but remain visually understandable

Acceptance:

- controls are visible at desktop 16:9, laptop, and mobile landscape sizes
- controls do not cover the player or core enemy silhouettes at spawn
- each control uses generated button art
- pointer/touch interactions still set `touchState`

### 3. Jump And Air Actions

Jump should exist as a real player verb, not just a decorative animation. In this beat-em-up lane setup, jump should read as a quick arcade hop with shadow separation rather than full platformer physics.

Recommended mechanic:

- desktop input: `W`/`Up` remains lane movement; final jump binding should be a separate key such as `I` or `C`
- mobile input: dedicated jump button near slap/dodge
- short vertical arc, roughly 0.38-0.48 seconds
- player shadow stays on the lane while the sprite rises
- limited air control
- air slap can become a later combo feature
- grounded enemy attacks should miss during the high part of the jump
- landing should have a tiny dust puff and recovery window

Animation states needed:

- `jump-start`: 3-4 frames
- `jump-rise`: 2-3 frames
- `jump-fall`: 2-3 frames
- `land`: 3-4 frames
- optional `air-attack`: 4 frames

Acceptance:

- jump is readable at runtime scale
- jump does not break lane positioning
- jump has clear start, airborne, and landing states
- UI has a distinct jump control
- enemies do not hit the player unrealistically during peak jump

### 4. Screen Flow

The player flow should be reliable:

1. Menu
2. Character select
3. Level
4. Pause
5. KO or win
6. Restart or menu

Acceptance:

- Start cannot accidentally double-click through character select.
- Character select supports pointer and keyboard.
- Pause overlay buttons work.
- Restart keeps HUD active.
- Menu returns to a clean non-level state.

### 5. Overlay Style

Pause, KO, and victory overlays should use generated frame art. Rectangular debug panels should be replaced with thematic framed panels and button plates.

Acceptance:

- pause, restart, menu buttons look like part of the same UI kit
- overlays dim the scene without hiding character positions completely
- controls are de-emphasized behind overlays

## Animation Sprint Goals

### Current Runtime Contract

Player animations:

- `idle`
- `walk`
- `jump-start`
- `jump-rise`
- `jump-fall`
- `land`
- optional `air-attack`
- `dodge`
- `attack`
- `hurt`
- `stunned`
- `knockdown`
- `get-up`
- `death`
- `super-slap`
- `victory`

NPC animations:

- `idle`
- `talk`
- `walk`
- `react`
- `cheer`
- `panic`

Enemy and boss animations:

- `idle`
- `walk`
- `attack`
- `hurt`
- `stunned`
- `knockdown`
- `get-up`
- `death`

All runtime strips must stay:

- PNG with alpha
- 256x256 frame cells
- facing right
- bottom-center aligned
- no labels
- no baked background
- saved under `public/assets/generated/animations/<character-id>/<action>.png`

## Image Generation Animation Pipeline

Use image generation for production-quality animation improvements, but only through a controlled pipeline.

Detailed execution notes live in `docs/animation_art_execution_plan.md`.

## Animation Quality Bar

The target is not "AI placeholder, but nicer." The target is animation that feels intentionally art-directed and game-ready.

Quality requirements:

- one locked character model per character before any sheet production
- consistent face, clothing, body proportions, and silhouette across every action
- strong action readability at in-game scale, not only full-size preview scale
- clear anticipation, contact, follow-through, and recovery frames for attacks
- no mushy AI limb drift, duplicated hands, broken shoes, changing tattoos, or changing clothing
- no text, labels, frame numbers, grid lines, background, or watermark inside runtime frames
- each action sheet should be reviewed as an animation loop and as individual frames
- production strips should improve on the deterministic placeholders, not merely replace them

Production strategy:

- generate fewer images, review harder
- pilot with Kiko before expanding to the whole roster
- keep the current deterministic strips as fallback and alignment reference
- create approved seed frames before full strips
- generate and review complete strips action-by-action after seed approval
- only overwrite runtime strips after a generated replacement passes QA
- save rejected attempts in a non-runtime review folder, not in the live asset path

### Phase A: Style Lock

Generate or refine one approved transparent seed pose per priority character:

1. Kiko
2. Casey
3. Street Punk
4. Corrupt Bouncer
5. Weed Vendor
6. Tattoo Artist

Each approved seed must match:

- same stylized 2D game art direction
- Pattaya neon lighting influence
- clean silhouette at 256x256
- transparent or chroma-key removable background
- consistent body proportions with existing registry scale

Do not generate full animation sheets until the seed look is approved.

### Phase B: Key Pose Sheets

For each priority character, generate key-pose sheets rather than one giant all-actions sheet.

Recommended batches:

- locomotion: idle, walk
- combat: attack, hurt, stunned
- jump: jump-start, jump-rise, jump-fall, land, optional air-attack
- recovery: knockdown, get-up, death
- special: dodge, super-slap, victory
- NPC: talk, react, cheer, panic

The image-generation prompt should describe one character, one action group, and a strict sprite-sheet layout. Avoid mixing multiple characters in one generation.

### Phase C: Chroma-Key To Alpha

Default imagegen path:

1. Generate on a flat chroma-key background.
2. Use the local chroma-key removal helper.
3. Validate transparent corners and clean edges.
4. Split or normalize into 256x256 frames.
5. Assemble final strips at the existing runtime paths.

If chroma-key removal cannot handle a character because of smoke, translucent effects, hair, or complex glow, pause and decide whether to use true transparency CLI fallback.

### Phase D: Normalization

Every generated frame must pass:

- same canvas size
- same baseline
- no top or side clipping
- unique frames
- no text artifacts
- no inconsistent face/body drift
- readable silhouette at runtime scale

Use the existing generator/audit patterns as the validation baseline, but replace placeholder frame imagery with the image-generated production art.

### Phase E: Runtime Timing

After final strips are in place:

- tune `frameRate` per action
- wire active hit frames
- tune cancel windows
- tune dodge invuln timing
- tune enemy stun/recovery
- tune victory and KO poses

## Priority Order

### 1. Asset Audit

- inventory every current character seed, animation strip, VFX sheet, UI frame, and control button
- mark each asset as `production`, `placeholder`, `missing`, or `needs-regeneration`
- identify which required actions are absent from the runtime contract, especially jump states and landing feedback
- confirm deterministic strips still match `256x256`, alpha, facing-right, baseline, and path requirements
- produce a short QA list that separates blocking runtime issues from art-polish issues

### 2. Runtime Animation Readability

- compare idle, walk, attack, hurt, dodge, super, knockdown, get-up, death, and victory at actual in-game scale
- tune frame rates, action locks, active hit frames, hit-stop, and recovery windows against current strips before replacing art
- keep attack contact frames visually aligned with hitbox timing
- verify silhouettes remain readable against bright storefronts and dark road sections
- add or refine dust, hit impact, shadow, and flash feedback where animation frames alone do not read

### 3. Imagegen Pilot

- approve Kiko seed first, then Casey, then Street Punk
- generate full strips only after seed approval
- pilot Kiko idle, walk, jump-start, jump-rise, jump-fall, land, attack, dodge, and super-slap
- normalize approved output into non-runtime review folders first
- compare approved strips against deterministic placeholders in browser before replacing live runtime paths

### 4. Jump Mechanic

- implement a real arcade hop with a short vertical arc, lane-safe landing, and a lane-shadow that stays grounded
- keep `W`/`Up` for lane movement and use a separate desktop jump key such as `I` or `C`
- wire the mobile jump button as a distinct control in the slap/dodge/super cluster
- make grounded enemy attacks miss during the high part of the jump
- add landing recovery and dust feedback

### 5. Weight-Based Knockback

- tune knockback using current stats and hurtbox profile multipliers instead of one universal launch feel
- make light characters take stronger pushback, medium characters stay baseline, and heavy characters absorb more force
- keep Super Slap powerful but still weight-aware
- verify knockback never breaks lane bounds, death poses, or enemy pressure pacing
- document any balance constants next to combat profile data for future roster additions

### 6. UI Controls

- finish HUD/control polish after jump input is real
- keep joystick lower-left and slap/dodge/jump/super lower-right
- ensure pause, restart, KO, and victory overlays use the generated UI kit language
- fix any remaining menu/character-select double input issues
- keep controls visible but de-emphasized behind pause/outcome overlays

### 7. Browser QA

- screenshot-test desktop 16:9, laptop, and mobile landscape
- verify menu -> character select -> level -> pause -> KO/win -> restart/menu flow
- test pointer/touch `touchState` updates for every control, including jump
- compare deterministic and pilot imagegen strips in the actual Vite browser build
- log remaining art, animation, UI, and combat issues with file/path references

## Immediate Next Decision

Before generating production art, choose the pilot target:

- Kiko first if we want the fastest readable player test.
- Casey first if we want to lock the heavier tattoo-shop protagonist style.
- Street Punk first if we want to validate enemy hit/recovery readability.

Recommended: Kiko first, then Casey, then Street Punk.
