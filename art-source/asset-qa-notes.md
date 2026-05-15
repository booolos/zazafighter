# Asset QA Notes

## 2026-05-14 v2 animation pass

Accepted for registry wiring:
- Casey / Big Ink: `public/assets/generated/animations/big-ink-v2/idle.png`, `walk.png`, and `smoking-idle.png`. These are 256x256 strips with usable normalized character art; walk and smoking-idle contain real frame variation. `smoking-light-joint.png` is usable source/runtime art, but no existing registry action consumes it, so it was left unwired in this minimal pass.
- Dang / Soi Dog: `public/assets/generated/animations/soi-dog/walk-run-v2.png` and `rush-attack-v2.png`. Both are 6-frame 256x256 image-generated strips with readable movement/action poses. `return-to-owner-v2.png` is a reversed walk variant, but no existing registry action consumes it, so it was left unwired.

Rejected / not wired:
- `public/assets/generated/animations/indian-fighter-*-v2/`: these PNGs are present and correctly sized, but each action strip repeats one still frame across all frames. Walk, attack, hurt, knockdown, and get-up therefore behave like static placeholders rather than usable animation.
- `public/assets/generated/backgrounds/*.svg`: rejected for this pass because final wired visual assets must come from image generation, not SVG background placeholders.
