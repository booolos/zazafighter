# Feet Check Asset Standard

Every Feet Check girl ships as a matched triplet. Do not mix parts between generations.

## Required Triplet

1. Full-body street sprite sheet
   - Used in the level as the ambient runner.
   - Same identity, outfit, makeup, nails, and heels as the close-up assets.
   - Required actions: `idle`, `talk`, `walk`, `run`, `react`, `cheer`, `panic`.
   - Preferred frame size: `384x384`.
   - Preferred walk/run: 10-16 frames, clear alternating foot contacts.

2. Animated face portrait strip
   - Used on the left side of the Feet Check overlay.
   - Gorgeous adult face, blushing/shy/sensual expression with visible frame-to-frame blush or eye/pose change.
   - Same hair, jewelry, makeup, skin tone, and outfit palette as the full-body sheet.
   - File: `public/assets/generated/interactions/feet-check/<character-id>-face.png`.
   - Current runtime format: 4 frames at `640x720`, single horizontal strip `2560x720`.
   - Preferred playback: 5-8 fps, subtle loop.

3. Casey POV foot/heel animation strip
   - Used on the right side of the Feet Check overlay.
   - First-person looking down at one foot and heel.
   - Same skin tone, nail color, anklet/tattoo detail, and heel style as the full-body sheet.
   - Animation can be toe flex, heel slipping partly off, arch turn, or heel strap tease.
   - File: `public/assets/generated/interactions/feet-check/<character-id>-heels-strip.png`.
   - Required frame size: `512x512`.
   - Preferred frame count: 10-16 frames.
   - Preferred playback: 18-24 fps.

## Quality Rules

- Adult only, no minors, no nudity, no exposed nipples/genitals, no sex act.
- Sexy and suggestive is okay; explicit porn is not.
- Feet must be anatomically coherent: five toes, believable arch, heel pressure, no melted toes, no extra toes, no flat foot in high heel.
- Animation must have real pose progression. No single pose translated across frames.
- Keep the whole triplet in one character identity. If a new girl is generated, generate all three pieces from the same source pass or tightly matched prompts.
- Outfit rules are level-specific: Soi Six girls use ultra-sexy covered microbikini / platform-heel looks; beach levels use bikinis, flip-flops, sandals, anklets, and sand/wet-pavement foot poses.
- Angles must vary across girls. Use a mix of toes-forward POV, side-profile heel slip, foot on curb/step, seated foot angled across frame, heel strap close-up, and beach flip-flop slip later.

## Prompt Template

```text
Create a matched 2D game asset triplet for one adult nightlife NPC named <name>.
She is clearly 25+ years old, <ethnicity/style>, glamorous, very attractive, wearing <level-specific outfit> with <heel/flip-flop style>.
Keep the same identity across all outputs: same face, hair, makeup, skin tone, jewelry, nail color, outfit palette, and heel design.
Sexy and suggestive, but no nudity, no exposed nipples or genitals, no sex act.

Output A: full-body sprite sheet on flat #00ff00 chroma-key, <rows/columns>, 384-style framing, with idle, walk, run, flirt/cheer rows. Walk/run must have alternating footfalls and consistent bottom foot alignment.

Output B: animated face portrait strip, 4 frames at 640x720, blushing/shy/sensual expression intensifying across frames, same identity and outfit details, premium semi-realistic 2D game art.

Output C: Casey POV looking down at one foot in the same heel or flip-flop, 512x512 animation strip, 10-16 frames, heel slipping partly off/toe flex/arch turn/flip-flop slip, impeccable toes, toenail polish matching Output A, no anatomy errors.
```
