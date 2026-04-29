# Backend Character Contract

## Purpose

Characters are backend/data additions. The game does not need an in-game character editor.

The current local source of truth is:

- `src/game/content/characterRegistry.json`
- `src/game/content/combatProfiles.json`
- `public/assets/generated/manifest.json`
- files under `public/assets/generated/`

At runtime, Phaser loads exactly the `seed.path` and `animations[*].file` values from the registry. Validation expects those local paths to exist under `public/`.

## Registry Record

Use one permanent kebab-case `id` per character. The registry role values are `player`, `npc`, `enemy`, and `boss`; backend UI may call players "playable", but emitted records must use `player`.

Example enemy record:

```json
{
  "id": "new-rival",
  "displayName": "New Rival",
  "handle": "Soi Heat",
  "role": "enemy",
  "faction": "rivals",
  "seed": {
    "key": "character:new-rival:seed",
    "path": "assets/generated/characters/enemies/new-rival.png"
  },
  "render": {
    "scale": 0.46,
    "originX": 0.5,
    "originY": 0.9
  },
  "stats": {
    "maxHp": 80,
    "speed": 150,
    "attackDamage": 14,
    "superDamage": 0,
    "weight": 1
  },
  "physics": {
    "bodyWidth": 105,
    "bodyHeight": 195,
    "bodyOffsetX": 76,
    "bodyOffsetY": 34
  },
  "combat": {
    "canUseSuperSlap": false,
    "hitboxProfile": "basic-punch",
    "hurtboxProfile": "human-medium",
    "aiProfile": "street-rusher"
  },
  "animations": {
    "idle": {
      "key": "anim:new-rival:idle",
      "file": "assets/generated/animations/new-rival/idle.png",
      "frames": 4,
      "frameWidth": 256,
      "frameHeight": 256,
      "frameRate": 6,
      "repeat": -1
    }
  }
}
```

Draft files created by `scripts/add-character.mjs` include `"status": "draft"`. Treat that as draft-only metadata; `--registry` strips it before appending to the runtime registry.

## Local Asset Paths

The validator now enforces the current local path convention:

```text
player seed: public/assets/generated/characters/<id>.png
npc seed:    public/assets/generated/characters/npcs/<id>.png
enemy seed:  public/assets/generated/characters/enemies/<id>.png
boss seed:   public/assets/generated/characters/enemies/<id>.png

animations:  public/assets/generated/animations/<id>/<action>.png
draft:       public/assets/generated/character-drafts/<id>/character.draft.json
```

Bosses currently use the enemy seed folder because the generated manifest does not have a dedicated boss lane yet. If a future sprint adds `characters/bosses/`, update `scripts/add-character.mjs`, `scripts/validate-assets.mjs`, and `public/assets/generated/manifest.json` together.

The generated manifest's `characters[*].path` should match `seed.path` for any registry character listed in the manifest.

## Required Animations

`npm run validate:assets` enforces these minimum action sets:

- `player`: `idle`, `walk`, `dodge`, `attack`, `hurt`, `stunned`, `knockdown`, `get-up`, `death`, `super-slap`, `victory`
- `npc`: `idle`, `talk`, `walk`, `react`, `cheer`, `panic`
- `enemy`: `idle`, `walk`, `attack`, `hurt`, `stunned`, `knockdown`, `get-up`, `death`
- `boss`: `idle`, `walk`, `attack`, `hurt`, `stunned`, `knockdown`, `get-up`, `death`

All current sheets use `256x256` frames. The extra recovery and NPC reaction states are already generated so future gameplay work can wire them without changing the backend contract.

## Combat Profiles

Characters should reference existing reusable profiles unless design needs a new one.

Hitbox profiles:

- `none`
- `quick-slap`
- `heavy-slap`
- `basic-punch`
- `wide-swing`
- `boss-heavy`
- `super-slap-wave`

Hurtbox profiles:

- `human-light`
- `human-medium`
- `human-heavy`

AI profiles:

- `player`
- `idle-npc`
- `talking-npc`
- `street-rusher`
- `cautious-rival`
- `scooter-punk`
- `heavy-bouncer`

Non-player characters must not set `canUseSuperSlap` to true.

## Scaffold Flow

Create a draft without touching the runtime registry:

```bash
npm run add:character -- new-rival enemy
```

Preview the generated paths without writing files:

```bash
npm run add:character -- new-rival enemy --dry-run
```

After real seed and animation PNGs exist, append the draft to the registry:

```bash
npm run add:character -- new-rival enemy --registry
```

`--registry` reads an existing draft if one is present and refuses to modify the registry while any referenced asset file is missing.

## Validation Gate

Run before handing a character pack to gameplay:

```bash
npm run validate:assets
```

The validator catches missing files, duplicate ids, invalid ids, missing required animations, non-player Super Slap flags, unknown combat profile references, malformed combat profiles, registry key/path drift, and manifest seed path mismatches.
