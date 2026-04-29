# Dog Companion Implementation Plan

## Current Implementation

Soi Dog is wired as the first companion character:

- id: `soi-dog`
- display name: `Soi Dog`
- role: `companion`
- seed: `assets/generated/characters/companions/soi-dog.png`
- animations: `idle`, `walk`, `special-attack`
- combat: `canUseSuperSlap: false`, `hitboxProfile: none`, `hurtboxProfile: dog-small`

`Level1Scene` currently uses the scene-owned companion approach. The dog spawns near and behind the selected player, follows within the combat lane, idles when caught up, and plays `special-attack` roughly every 5 seconds. This first pass is visual only: it deliberately does not damage enemies or grant meter, so the existing player, Rush, enemy, restart, menu, and HUD flows stay isolated.

## Goal

Add a dog companion as a data-driven ally that supports the selected player without replacing the existing playable, NPC, enemy, or boss flow.

The dog should be authored like a character asset pack, but treated at runtime as a companion actor:

- follows the player within the combat lane
- avoids blocking player movement and enemy pressure
- can perform a timed special attack
- does not use Super Slap, score UI ownership, or player selection
- can be enabled per player, level, or progression flag

## Role

Recommended new role: `companion`.

Why:

- `npc` currently means non-combat by contract and uses `idle`, `talk`, `walk`, `react`, `cheer`, and `panic`
- `enemy` and `boss` assume hostile AI and damageable encounter state
- `player` is the only role allowed to use Super Slap and selection UI

The backend can expose the dog as a companion owned by a player or level. The runtime registry can still load it from the same character path system once `CharacterRole` and validation allow `companion`.

## Action Set

Implemented runtime actions:

- `idle`: standing near the player
- `walk`: follow and reposition
- `special-attack`: timed 5-second visual assist pulse

Optional polish actions:

- `run`: catch up when outside the leash range
- `attack`: short bite or bark-lunge contact
- `hurt`: optional flinch if the dog can be interrupted
- `recall`: return-to-player transition
- `sit`
- `sniff`
- `celebrate`

All sheets should use the existing `256x256` transparent frame convention, facing right, with a bottom-center ground baseline.

## Asset Paths

Implemented id: `soi-dog`.

Implemented local convention:

```text
public/assets/generated/characters/companions/soi-dog.png
public/assets/generated/animations/soi-dog/idle.png
public/assets/generated/animations/soi-dog/walk.png
public/assets/generated/animations/soi-dog/special-attack.png
```

Runtime registry paths should omit the `public/` prefix:

```text
assets/generated/characters/companions/soi-dog.png
assets/generated/animations/soi-dog/<action>.png
```

If the generated manifest needs companion grouping, add `characters/companions/` alongside the current `characters/npcs/` and `characters/enemies/` lanes.

## Backend Character Contract Changes

Planned contract additions:

- add `companion` to `CharacterRole`
- allow `seed.path` for `companion` at `assets/generated/characters/companions/<id>.png`
- add a required companion animation set in `scripts/validate-assets.mjs`
- keep `canUseSuperSlap: false` for companions
- add companion-safe combat profiles instead of reusing hostile enemy profiles blindly
- add a companion AI profile kind or companion metadata block

Suggested registry shape:

```json
{
  "id": "soi-dog",
  "displayName": "Soi Dog",
  "handle": "Street Companion",
  "role": "companion",
  "faction": "heroes",
  "seed": {
    "key": "character:soi-dog:seed",
    "path": "assets/generated/characters/companions/soi-dog.png"
  },
  "render": {
    "scale": 0.32,
    "originX": 0.5,
    "originY": 0.88
  },
  "stats": {
    "maxHp": 55,
    "speed": 330,
    "attackDamage": 0,
    "superDamage": 0,
    "weight": 0.42
  },
  "physics": {
    "bodyWidth": 100,
    "bodyHeight": 72,
    "bodyOffsetX": 78,
    "bodyOffsetY": 134
  },
  "combat": {
    "canUseSuperSlap": false,
    "hitboxProfile": "none",
    "hurtboxProfile": "dog-small",
    "aiProfile": "companion-follow"
  }
}
```

Implemented combat profile additions:

- `hurtboxes.dog-small`: compact non-human hurtbox tuning
- `aiProfiles.companion-follow`: kind `companion`, reserved for companion-specific follow logic

Future damage-system additions, if desired:

- `hitboxes.companion-bite`: short range, low damage multiplier, small knockback, low hit-stop
- `hitboxes.companion-special`: medium forward range, no meter gain

## 5-Second Special Attack

Current behavior: timed visual assist pulse, not a player Super Slap.

Rules:

- trigger automatically roughly every 5 seconds while the level is active
- dog switches to `special-attack` animation for a short visual burst
- do not apply enemy damage in this first pass
- do not grant Super Slap meter from companion hits
- cancel when the player is defeated, the level is paused, or all enemies are cleared

Future assist-damage tuning:

```text
duration: 5.0s
pulse interval: 0.8s
max pulses: 6
damage per pulse: 6-10
knockback: 70-110
stun: 0.08-0.14s
hit-stop: 35-55ms
target radius from player: 520px x, 80px lane y
```

## Runtime Integration Options

Option A: scene-owned companion actor.

- Add a `Companion` actor type beside the current `Enemy` type in `Level1Scene`.
- Use `createCharacterSprite` and registry animations exactly like enemies and NPCs.
- Keep follow, target selection, and special timing in the scene.
- Best first implementation because the current combat loop is scene-owned.

Option B: companion controller module.

- Add a small controller that receives player, enemies, combat profile helpers, and delta time.
- Scene owns sprite creation, controller owns follow and special state.
- Better if Level1Scene keeps growing, but still avoids a large actor-system rewrite.

Option C: generalized actor model.

- Promote player, enemies, NPCs, and companions into one actor state model.
- Useful later for multiple levels and backend-driven encounters.
- Too broad for the first dog pass unless the combat sprint is already refactoring actors.

Recommended path: Option A for the first dog, with naming and state shaped so it can move to Option B later.

## Integration Checklist

Before gameplay code changes:

- approve the `companion` role contract
- add dog seed and animation assets at the proposed paths
- update `docs/backend_character_contract.md` after the role is accepted
- update `scripts/add-character.mjs` and `scripts/validate-assets.mjs`
- add companion combat and AI profiles
- decide whether companion availability belongs to player data, level data, or progression data
