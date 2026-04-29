# Character Expansion Pipeline

## Goal

Adding a character should be data-first:

1. Pick a permanent character id and role.
2. Generate or place the seed and required animation sheets.
3. Create a registry-shaped draft.
4. Add the record to `src/game/content/characterRegistry.json`.
5. Run asset validation.
6. Wire the character into progression, encounter, or selection data when gameplay asks for it.

Backend-facing field contract: `docs/backend_character_contract.md`.

## Current Runtime Shape

Scenes should not load character files directly. They should ask the content registry for a character id, and the preload step should load the registry paths.

Current runtime behavior:

- `src/game/content/characterRegistry.json` contains every playable, NPC, enemy, and boss record.
- `src/game/assets/loaders.ts` loads `character.seed.path` as `character.seed.key`.
- `src/game/assets/loaders.ts` loads every `animations[*].file` as the matching `animations[*].key`.
- animation sheets are registered under runtime keys shaped like `character:<id>:<action>`.

That means a backend record is ready only when its registry paths and files are both correct.

## ID And Role Rules

Use lowercase kebab-case ids:

- `kiko`
- `big-ink`
- `weed-vendor`
- `street-punk`
- `corrupt-bouncer`

Never use display names as runtime keys. Display names and handles can change; ids should not.

Registry roles:

- `player`
- `npc`
- `enemy`
- `boss`

The scaffold accepts `playable` as an alias, but the draft and registry record will use `player`.

## Local Asset Convention

Current seed images are flat by role:

```text
public/assets/generated/characters/<player-id>.png
public/assets/generated/characters/npcs/<npc-id>.png
public/assets/generated/characters/enemies/<enemy-id>.png
public/assets/generated/characters/enemies/<boss-id>.png
```

Current animation sheets are shared by id:

```text
public/assets/generated/animations/<character-id>/
  idle.png
  walk.png
  dodge.png
  attack.png
  hurt.png
  stunned.png
  knockdown.png
  get-up.png
  death.png
  super-slap.png
  victory.png
```

Only include actions that the role uses, but the current sprint contract is deliberately complete: players carry combat, recovery, super, and victory states; NPCs carry idle/talk/walk/react/cheer/panic; enemies and bosses carry combat plus recovery states.

Draft contracts live outside runtime content:

```text
public/assets/generated/character-drafts/<character-id>/character.draft.json
```

## Scaffolding

Create a draft and empty target folders:

```bash
npm run add:character -- soi-champion boss
```

See what would be created:

```bash
npm run add:character -- soi-champion boss --dry-run
```

Append an existing draft to the registry after all referenced files exist:

```bash
npm run add:character -- soi-champion boss --registry
```

Conservative behavior:

- default mode never edits `src/game/content/characterRegistry.json`
- existing drafts are not overwritten
- `--registry` reads the existing draft
- `--registry` exits before writing if any seed or required animation file is missing

## Required Animation Sets

Playable character:

- `idle`
- `walk`
- `dodge`
- `attack`
- `hurt`
- `stunned`
- `knockdown`
- `get-up`
- `death`
- `super-slap`
- `victory`

NPC:

- `idle`
- `talk`
- `walk`
- `react`
- `cheer`
- `panic`

Enemy:

- `idle`
- `walk`
- `attack`
- `hurt`
- `stunned`
- `knockdown`
- `get-up`
- `death`

Boss or mini-boss:

- `idle`
- `walk`
- `attack`
- `hurt`
- `stunned`
- `knockdown`
- `get-up`
- `death`

All current animation sheets use `256x256` frames.

## Registry Checklist

Before a character is added to the runtime registry:

- `id` is unique kebab-case
- `role` is one of `player`, `npc`, `enemy`, or `boss`
- `seed.key` is `character:<id>:seed`
- `seed.path` follows the local role path convention
- each required animation has `key: "anim:<id>:<action>"`
- each required animation uses `file: "assets/generated/animations/<id>/<action>.png"`
- all required files exist under `public/`
- combat profile ids exist in `src/game/content/combatProfiles.json`
- only `player` records can set `canUseSuperSlap: true`
- the generated manifest character entry matches `seed.path` when present

## Combat And AI

Prefer existing combat profiles:

- hitboxes: `none`, `quick-slap`, `heavy-slap`, `basic-punch`, `wide-swing`, `boss-heavy`, `super-slap-wave`
- hurtboxes: `human-light`, `human-medium`, `human-heavy`
- AI: `player`, `idle-npc`, `talking-npc`, `street-rusher`, `cautious-rival`, `scooter-punk`, `heavy-bouncer`

Add a combat profile only when a new character cannot be expressed by the reusable profiles. That keeps future backend-added characters mostly data-only.

## Validation

Run:

```bash
npm run validate:assets
```

Validation currently checks registry shape, required role animations, local file presence, profile references, Super Slap role rules, generated manifest asset presence, and registry/manifest path agreement.

## Backend Integration Gaps

The client still imports `characterRegistry.json` at build time. A future backend integration needs:

- a fetch/load step before Phaser preload
- a way to merge backend records with bundled records
- CDN URL support or a remote asset base URL in the loader
- progression/unlock data for playable characters
- encounter/spawn data for enemies and bosses
- manifest publishing for generated character seed entries
