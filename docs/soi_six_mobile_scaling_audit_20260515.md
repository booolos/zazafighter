# Soi Six Mobile Scaling Audit

Date: 2026-05-15

Scope: static inspection plus local validation for the Soi Six scale pass, focused on whether the larger covered ambient girls can overlap the HUD, sidewalk, exit marker, Casey, and Dang. No runtime code was changed.

## Summary

The Soi Six HD ambient girls are safe from the bottom mobile controls while idle on the sidewalk, but they are not fully safe once the runner behavior pulls them into the combat lane. Their current visual footprint is about 324 px tall and 324 px wide before transparent padding, using `render.scale: 0.34` and the runtime multiplier `2.48`. At lane Y positions around 588-654, their top edge sits roughly 280-346 world px and their bottom edge sits roughly 604-670 world px.

The highest-risk overlap is not with the top HUD. It is with Casey, Dang, props, and exit readability during approach/linger, because Soi Six runners are allowed to target `LANE_TOP..LANE_BOTTOM - 10` and then render at actor-like depths while still being non-combat ambient actors.

## Evidence

- `WORLD_HEIGHT` is 720; `AMBIENT_SIDEWALK_TOP..BOTTOM` is `552..594`; `LANE_TOP..BOTTOM` is `588..668`.
- Soi Six HD NPCs use 384 px frames, `originY: 0.95`, and `render.scale: 0.34`; runtime scale is `0.34 * 2.48 = 0.8432`.
- Resulting full-frame display bounds:
  - At `y=552`: top `244.4`, bottom `568.2`.
  - At `y=586`: top `278.4`, bottom `602.2`.
  - At `y=634`: top `326.4`, bottom `650.2`.
  - At `y=654`: top `346.4`, bottom `670.2`.
- Mobile landscape zoom currently only changes for heights `<=430`, using `height / 470` clamped to `0.84..0.92`. This shows more vertical world, but it does not reserve HUD-safe world space.
- The top HUD is DOM-only and fixed above the canvas. The canvas camera still follows Casey with `offsetY=56`, so top-world actors can visually sit under HUD chrome on small landscape screens even when they do not mathematically leave the world.
- Soi Six runner targets use `player.y + targetOffsetY`, clamped to `LANE_TOP..LANE_BOTTOM - 10`, so ambient girls can linger in Casey's and Dang's lane.
- While on or near the sidewalk, ambient depth is forced to `AMBIENT_SIDEWALK_BOTTOM - 2`; beyond `AMBIENT_SIDEWALK_BOTTOM + 4`, depth becomes `sprite.y - 12`. This can put runners behind Casey/Dang, but their large silhouettes still occupy the same play space.

## Findings

### Medium: runners intrude into Casey/Dang's combat silhouette

The approach clamp allows ambient runners to settle at `y=588..658`, which is the same vertical band Casey and Dang occupy. With 324 px HD frames, an approaching runner at `y=634` has a visual bottom around `650`, nearly the same ground footprint as Casey, and can sit within `42..118` px horizontally depending on personality. That is enough to obscure reads during attacks or companion movement, even if depth ordering often keeps Casey in front.

Recommended constants:

- Keep Soi Six runner approach targets on a narrower ambient lane: `SOI_SIX_RUNNER_TARGET_Y_MIN = 572`, `SOI_SIX_RUNNER_TARGET_Y_MAX = 618`.
- Use per-personality `targetOffsetY` no lower than `-44..-24` for runners, instead of values like `[-16, -4]`, so they approach Casey from the sidewalk edge rather than his feet.
- Increase touch/linger horizontal separation from the current effective `42..118` to `72..132` for HD runners. Dao and Mew are the tightest today; make their `targetOffsetX` at least `[72, 96]`.

### Medium: exit marker readability can be crowded near the right edge

The random Soi Six ambient picker clamps ambient spawn X to `exit.x - 170`, while the authored exit is at `x=2050`. A 324 px-wide HD runner spawned or returning near `x=1880` can visually occupy roughly `1718..2042`, just left of the exit beam and label. The final authored prop at `x=2090` also competes for this area.

Recommended constants:

- For Soi Six HD ambient girls, use `SOI_SIX_AMBIENT_EXIT_CLEARANCE_X = 260` instead of the current effective `170`.
- Keep runner target X clamped to `exit.x - 260` as well, not just initial/home X.

### Low: top HUD overlap is mostly acceptable, but the camera has no HUD-aware safe zone

At the current mobile zoom floor, the 324 px-tall girls are unlikely to collide with the bottom controls when idle or moving. The top HUD can still cover upper body space on short landscape screens because zoom and follow offset are not tied to HUD height. This is most visible when Casey is high in the lane and a tall ambient girl is near `y=552..586`.

Recommended constants:

- Raise the short-landscape zoom denominator from `470` to `500`, keeping the clamp range `0.84..0.92`, or lower the max to `0.90`. Either option buys about 20-30 px more vertical world on 390-430 px tall mobile screens.
- If camera tuning is preferred over zoom, change the Level1 follow Y offset from `56` to `76` only for short landscape screens.

### Low: sidewalk band is too shallow for the new HD scale

The sidewalk band is only 42 px tall (`552..594`), while the HD girls are 324 px tall. That is fine for a painterly background crowd, but it makes the sidewalk/lane distinction fragile once runners move.

Recommended constants:

- Treat HD Soi Six home positions as a tighter sidewalk baseline: `SOI_SIX_AMBIENT_HOME_Y_MIN = 558`, `SOI_SIX_AMBIENT_HOME_Y_MAX = 586`.
- Keep general non-runner `AMBIENT_SIDEWALK_TOP..BOTTOM` unchanged unless other levels are being retuned.

## Suggested Follow-Up Patch Shape

Do not change the global character scale. The current `0.34` HD NPC scale reads well next to Casey. Prefer adding Soi Six-specific movement clamps:

- `SOI_SIX_RUNNER_TARGET_Y_MIN = 572`
- `SOI_SIX_RUNNER_TARGET_Y_MAX = 618`
- `SOI_SIX_AMBIENT_EXIT_CLEARANCE_X = 260`
- `SOI_SIX_RUNNER_MIN_TARGET_OFFSET_X = 72`

Then apply those only when `level.ambientBehavior === 'soi-six-runner'`. This keeps Walking Street and other ambient NPC layouts from being affected by the Soi Six scale pass.

## Validation

- `npm run validate:assets` passed: 27 characters, 5 backgrounds.
- `npm run build` passed. Existing warnings remain for CSS asset URLs under `../assets/generated/ui/...` and for the large bundled Phaser chunk.
