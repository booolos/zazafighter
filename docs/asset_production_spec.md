# Slap Street Asset Production Spec

## Goal

Create a sprint-ready asset pack for a mobile-web Phaser beat-em-up. The next coding sprint should be able to load assets from stable paths without deciding art direction or naming conventions.

## Locked Direction

- Game: Slap Street: Ink District
- Format: mobile web, landscape, 1280x720 camera
- Engine target: Phaser 3 / Vite
- Setting: tattoo shop directly across the street from weed shop in a Pattaya nightlife soi
- Style: crisp stylized arcade brawler, hand-painted, premium mobile readability
- Palette: red tattoo neon, green weed-shop neon, hot pink beer-bar neon, cyan/purple VFX, warm amber interiors, black streetwear

## Runtime Asset Standards

### Characters

- PNG with alpha
- 512x512 normalized seed frame
- Facing right
- Bottom-center foot baseline
- No labels, no shadows baked onto a floor, no background
- Shared outline weight, camera angle, and lighting direction

### Character Animation Sheets

- PNG with alpha
- 256x256 frame slots
- One action per sheet
- Facing right
- Same scale and foot baseline across every frame
- No labels, no frame numbers, no background

### Environments

- PNG/JPG/WebP
- 16:9 landscape-friendly
- 2048x720 preferred for parallax layers
- Central playable lane stays clear
- No HUD, no characters, no concept-sheet borders

### Props

- PNG with alpha
- 256x256 or 512x512 item slots
- No labels, no background, no floor shadow
- Game-readable silhouettes

### VFX

- PNG with alpha
- 256x256 slots
- Sheet layout declared in manifest
- No labels or background

### UI

- PNG with alpha for decorative frames/icons
- DOM/CSS will handle readable text where possible
- Touch controls should be icon-forward and not block the center play lane

## Asset Inventory

### Batch 0: Approved Foundation

- `backgrounds/tattoo-weed-street.png`
- `characters/kiko.png`
- `characters/big-ink.png`
- `characters/weed-vendor.png`
- `characters/street-punk.png`
- `fx/super-slap-8x256.png`

### Batch 1: Level 1 Environment

- `backgrounds/level1-far-alley.png`
- `backgrounds/level1-storefronts.png`
- `backgrounds/level1-play-lane.png`
- `props/street-props-pack.png`

These must feel Pattaya-themed: tourist-strip neon, soi alley density, scooters, palm hints, beer-bar and massage-sign atmosphere, street-food cart, baht/currency flavor, wet tropical pavement, and tangled overhead utility wires. Keep it fictional and game-safe: no real brands, no explicit sexual content, no minors, no readable slurs.

### Batch 2: Characters

- `characters/tattoo-artist.png`
- `characters/lounge-manager.png`
- `characters/bouncer.png`
- `characters/customer.png`
- `characters/mechanic.png`
- `characters/rival-artist.png`
- `characters/scooter-punk.png`
- `characters/corrupt-bouncer.png`

### Batch 3: Animation Runtime Sheets

For both player mains:

- idle 4 frames
- walk 6 frames
- attack 4 frames
- hurt 2 frames
- super-slap 6 frames

For one basic enemy:

- idle 4 frames
- walk 6 frames
- attack 4 frames
- hurt 2 frames

### Batch 4: UI and Items

- `ui/mobile-hud-kit.png`
- `ui/menu-panels-kit.png`
- `ui/portraits-icons-items.png`
- `fx/hit-impact-6x256.png`
- `fx/dust-step-6x256.png`

## QA Gate

Every generated asset must pass:

- correct folder and filename
- dimensions match manifest
- alpha where required
- no labels or prompt artifacts
- no unwanted background on sprites/props/VFX
- characters share baseline and lighting
- tattoo shop vs weed shop layout remains readable
- mobile play lane is not cluttered
