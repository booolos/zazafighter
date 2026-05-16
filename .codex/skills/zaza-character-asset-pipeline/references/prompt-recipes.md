# Prompt Recipes

Use these as starting points. Keep one character and one asset family per generation.

## Full-Body Seed From Photo

```text
Use case: stylized-concept
Asset type: Zaza Fighter source character seed
Input image: user-provided photo/picture as visual identity and styling reference.
Primary request: Create one adult stylized arcade game character based on the reference, full body, standing pose, covered go-go microbikini / nightlife swimwear or club outfit, high-definition glossy painted sprite style, confident playful expression.
Frame requirements: one complete full-body character, shoes fully visible, generous padding on all sides.
Background: perfectly flat solid #00ff00 chroma key, no floor plane, no shadows, no text, no labels, no watermark.
Avoid: multiple characters, cropped feet, extra limbs, warped hands/feet, explicit nudity, sex acts, photorealistic background, poster composition.
```

Approve this seed visually before asking for motion.

## Full-Body Action Source

```text
Create one adult stylized arcade game character matching the approved seed exactly: same hair, face, outfit, body proportions, shoes, palette, and silhouette.
Asset: source sheet for one action only: [idle / walk / run / cheer / talk / react].
Layout: [4 or 8] separate full-body poses with wide #00ff00 gutters between poses. Every pose must be fully inside its own area with shoes visible and generous padding.
Motion: readable pose progression with idle/hold/return rhythm; no frantic thrash.
Background: perfectly flat solid #00ff00 chroma key, no shadows, no scenery, no text.
Avoid: multiple girls, cropped legs, tiny character, row crossover, merged poses, inconsistent outfit, duplicate non-moving frames.
```

If the output is not in exact runtime slots, treat it as source and repack.

## Portrait Expression Source

```text
Create one adult stylized arcade portrait expression source sheet matching the approved character: same face, hair, makeup, jewelry, outfit palette, and lighting.
Asset: close portrait frames for feet-check overlay.
Layout: 8 to 12 separate portrait frames with wide #00ff00 gutters. Head and shoulders only, face centered, no cropping.
Expressions: relaxed smile, shy smile, glance, laugh, giggle, playful smirk, soft blush painted into the actual image, return to relaxed.
Background: perfectly flat solid #00ff00 chroma key, no text, no UI, no watermark.
Avoid: CSS-like glow/pulse, duplicate frames, side-by-side profiles inside one frame, warped face, cropped head, explicit sexual expression.
```

The blush or expression must be painted into the generated frames. Do not add fake CSS animation later.

## Feet-Check Source

```text
Create one adult stylized arcade feet-check source sheet matching the approved character's leg tone and shoe style.
Asset: high-definition lower-leg and feet closeups in [shoe style/color].
Layout: 8 separate pose cells with wide #00ff00 gutters. Each pose must keep the feet fully inside its cell.
Pose sequence: relaxed heels, heel lift, arch turn, toe flex, ankle roll, heel dangle, toes-forward pose, return to relaxed.
Style target: match the best existing Soi Six feet-check closeups: glossy arcade painting, attractive close crop, coherent shoe/skin identity, clean toes and heel shape.
Background: perfectly flat solid #00ff00 chroma key, no floor, no shadows, no text, no labels, no watermark.
Avoid: cropped toes, cropped heels, legs crossing into neighboring cells, extra toes, warped feet, inconsistent shoes, row crossover, multiple characters.
```

Raw feet sheets are almost always source only. Repack exact 512x512 frames before wiring.
