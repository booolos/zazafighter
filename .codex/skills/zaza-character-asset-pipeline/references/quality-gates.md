# Quality Gates

## Reject Source Art When

- More than one character appears in a generated source meant for one girl.
- Any frame cuts off feet, heels, head, or full-body silhouette.
- A pose crosses into another frame or row.
- Anatomy is warped, duplicated, fused, or inconsistent.
- Character size changes enough to pop during playback.
- Frames are effectively identical and will not animate.
- The source is too low-resolution after cropping a single character.
- The outfit, hair, face, or shoe identity drifts between frames.
- The background is not removable chroma key.

## Feet-Check QA

- First inspect current Soi Six feet-check strips; if they are already good, preserve them as the visual benchmark and avoid unnecessary replacement.
- Runtime strip is one horizontal row.
- Frame size is exactly 512x512 unless the project registry and validator are intentionally changed.
- Each frame contains one coherent lower-leg/feet pose.
- Feet stay within the frame with visual padding.
- Motion reads slowly: pose, hold, return.
- Overlay draw code uses per-frame canvas drawing or sprite frame animation.
- No CSS scrolling, pulsing, filter animation, or fake blush.

## Portrait QA

- Runtime strip is one horizontal row.
- Current target frame is 640x720 unless project metadata changes.
- Face remains centered and similarly scaled in every frame.
- Expression changes are painted into the frame.
- No double profile, no cropped face, no lateral scrolling illusion.

## Full-Body Sprite QA

- Full body and shoes visible in every frame.
- Bottom-center anchor is stable.
- Runtime frame dimensions match registry.
- Scale is tuned in game; high-res files usually require lower render scale.
- Soi Six runner behavior must still let one girl approach Casey periodically.

## Verification Commands

```bash
npm run validate:assets
npm run build
```

Then inspect in the browser at the active dev-server URL.
