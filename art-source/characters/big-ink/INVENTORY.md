# Casey / Big Ink v2 Animation Inventory

Character id: `big-ink`
Display name: Casey
Frame size: 256x256 px
Anchor: bottom-center, visual ground line at y=239
Final strip folder: `public/assets/generated/animations/big-ink-v2/`

| Action | Strip | Frames | Dimensions | Status | Notes |
| --- | --- | ---: | --- | --- | --- |
| idle | `public/assets/generated/animations/big-ink-v2/idle.png` | 4 | 1024x256 | final | True frame loop from stable Casey source; feet locked to a shared ground line, no scale or squash. |
| smoking-light-joint | `public/assets/generated/animations/big-ink-v2/smoking-light-joint.png` | 6 | 1536x256 | final | Casey raises/lights/smokes a generic joint with small ember/smoke motion; no brand text or labels. |
| smoking-idle | `public/assets/generated/animations/big-ink-v2/smoking-idle.png` | 6 | 1536x256 | final | Calm post-light smoke loop with stable feet/body and drifting smoke bubbles. |
| walk | `public/assets/generated/animations/big-ink-v2/walk.png` | 6 | 1536x256 | final | Normalized walk strip from the best Big Ink source; stable bottom-center anchor. |
| attack | - | 0 | - | deferred | Not shipped in v2; existing source needs dedicated cleanup rather than another placeholder. |
| hurt | - | 0 | - | deferred | Not shipped in v2; existing source needs dedicated cleanup rather than another placeholder. |
| knockdown | - | 0 | - | deferred | Not shipped in v2; existing source needs dedicated cleanup rather than another placeholder. |
| get-up | - | 0 | - | deferred | Not shipped in v2; existing source needs dedicated cleanup rather than another placeholder. |
| victory | - | 0 | - | deferred | Not shipped in v2; existing source needs dedicated cleanup rather than another placeholder. |
| rush | - | 0 | - | deferred | Not shipped in v2; existing source needs dedicated cleanup rather than another placeholder. |

Integration notes:
- No gameplay code or public manifest was changed.
- To integrate, point Casey's `big-ink` animation paths at `public/assets/generated/animations/big-ink-v2/` and update frame counts where needed.
- `smoking-light-joint.png` is the publishable light-joint action strip; `smoking-idle.png` is the calmer loop once already smoking.
- Preview sheets with a ground/anchor guide live in `art-source/characters/big-ink/previews/`.
