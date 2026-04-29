# Animation Art Execution Plan

## Purpose

This document turns the UI/UX and animation sprint plan into an execution checklist for replacing deterministic placeholder animation strips with production-quality art.

The current deterministic strips are useful because they are stable, normalized, and already wired into the Vite/TypeScript/Phaser runtime. They are not production art. Do not discard them; use them as fallback strips, timing references, alignment references, and before/after comparison material.

## Older Static-ZF Review Handling

The older user-pasted review was written against a static-ZF context. Treat it as static historical guidance, not as a live review of the current codebase.

Translate only the applicable parts:

- preserve the product intent: readable arcade beat-em-up action, strong UI controls, and clear player feedback
- keep the focus on real browser behavior rather than isolated asset previews
- audit assets before replacing them
- improve animation readability before scaling content volume
- use imagegen as a controlled art-production step, not as a direct runtime overwrite
- keep jump, knockback, and mobile controls understandable at play speed

Ignore static-ZF assumptions that conflict with the current app:

- static page structure
- old asset paths
- non-registry character wiring
- any review note that assumes the game is not already running through Vite/TypeScript/Phaser

## Priority 1: Asset Audit

Create a small audit table for every runtime character and action:

- character id
- role
- action
- current file path
- expected frame count
- actual dimensions
- alpha present
- baseline consistent
- current quality state: `production`, `placeholder`, `missing`, or `needs-regeneration`
- blocking issue, if any

Audit targets:

- `public/assets/generated/characters/*`
- `public/assets/generated/animations/<character-id>/*.png`
- `public/assets/generated/fx/*`
- `public/assets/generated/ui/*`
- `public/assets/generated/manifest.json`
- `src/game/content/characterRegistry.json`

Acceptance:

- every runtime strip has a clear quality state
- missing or weak jump states are called out
- deterministic strips remain available as fallback
- no production replacement enters runtime paths before passing QA

## Priority 2: Runtime Animation Readability

Before new art replaces anything, use the current strips to tune the runtime feel:

- frame rates per action
- action locks and cancel windows
- active hit-frame timing
- hurt/stun/knockdown/get-up recovery
- Super Slap anticipation, contact, and follow-through
- dust, hit impact, shadow, camera shake, and hit-stop feedback

Acceptance:

- attack frames line up with hitbox contact
- the player can read idle, walk, attack, hurt, dodge, super, KO, and victory at runtime scale
- bright neon backgrounds do not swallow character silhouettes
- placeholder art limitations are documented separately from timing bugs

## Priority 3: Imagegen Pilot

Pilot order:

1. Kiko
2. Casey
3. Street Punk

Seed-frame gate:

- one character only
- transparent or easily removable chroma-key background
- consistent body proportions with current runtime scale
- readable face, clothing, hands, shoes, and silhouette at `256x256`
- no text, frame numbers, watermark, UI, or background
- approved before any full strips are generated

Strip-production gate:

- one action group per generation batch
- no mixed-character sheets
- output reviewed as individual frames and as a loop
- normalized into `256x256` cells
- baseline and scale matched to deterministic strips
- placed in a review folder first, not directly in `public/assets/generated/animations/...`

Pilot strip set:

- `idle`
- `walk`
- `jump-start`
- `jump-rise`
- `jump-fall`
- `land`
- `attack`
- `dodge`
- `super-slap`

Acceptance:

- approved imagegen strips visibly improve on deterministic placeholders
- identity does not drift between actions
- browser comparison shows improved readability at gameplay scale
- rejected attempts remain outside runtime paths

## Priority 4: Jump Mechanic

Build jump as a beat-em-up hop, not a platformer jump.

Runtime behavior:

- separate desktop jump key such as `I` or `C`
- `W`/`Up` continues to mean lane movement
- mobile jump button sits with slap, dodge, and super
- short arc, roughly `0.38-0.48` seconds
- sprite rises while grounded shadow remains on the lane
- grounded enemy attacks miss at jump peak
- landing has a small recovery window and dust puff

Animation behavior:

- `jump-start`
- `jump-rise`
- `jump-fall`
- `land`
- optional later `air-attack`

Acceptance:

- jump does not break lane bounds
- airborne state is readable without UI text
- landing recovery is noticeable but not sluggish
- mobile jump control is easy to hit without blocking the fight lane

## Priority 5: Weight-Based Knockback

Use current character stats and hurtbox profiles as the balance surface.

Target feel:

- light characters: stronger pushback, faster visual displacement
- medium characters: baseline knockback
- heavy characters: reduced pushback, stronger grounded feel
- Super Slap: high impact, still moderated by weight

Acceptance:

- knockback respects lane bounds
- death and knockdown poses do not slide absurdly after impact
- heavy enemies feel meaningfully heavier without becoming unresponsive
- combat profile constants are documented for future roster work

## Priority 6: UI Controls

Controls should be immediately understandable and stay out of the center fight lane.

Required layout:

- joystick lower-left
- slap, dodge, jump, and super lower-right
- pause top-right
- controls dim behind pause, KO, and victory overlays

Acceptance:

- all controls are visible on desktop, laptop, and mobile landscape
- pointer/touch state updates for every control
- jump has a distinct icon/button, not a hidden gesture
- overlay buttons and HUD controls use the same generated UI-kit language

## Priority 7: Browser QA

Use the browser build as the source of truth.

QA matrix:

- desktop 16:9
- laptop viewport
- mobile landscape
- menu
- character select
- level loop
- pause
- KO
- victory
- restart
- menu return

QA checks:

- no text overlaps HUD frames or buttons
- controls do not cover spawn silhouettes
- jump, dodge, slap, and super all work by keyboard and pointer/touch
- imagegen pilot strips render with clean alpha and correct baseline
- deterministic fallback strips still load when production replacements are not approved

Acceptance:

- screenshots exist for representative desktop and mobile landscape states
- each failing item is logged with a concrete path or runtime behavior
- no production art replacement is accepted based only on a contact sheet
