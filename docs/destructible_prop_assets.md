# Destructible Prop Frames

This pass adds normalized 256x256-frame destruction sheets for street elements. They are registered in Phaser as FX animations and are ready for a later destructible-props gameplay sprint.

## Runtime Sheets

| Prop set | Runtime path | Animation key | Frames |
| --- | --- | --- | --- |
| Scooter wreck | `public/assets/generated/fx/destructibles/scooter-destruction-6x256.png` | `fx:destructible:scooter:break` | 6 |
| Sign / bin / cone clutter | `public/assets/generated/fx/destructibles/street-clutter-destruction-6x256.png` | `fx:destructible:street-clutter:break` | 6 |
| Plant / chair clutter | `public/assets/generated/fx/destructibles/plant-chair-destruction-6x256.png` | `fx:destructible:plant-chair:break` | 6 |

## Source / Review Copies

Raw imagegen strips and imported review sheets are kept under:

```text
tmp/imagegen/destructibles/
art-source/_imagegen_review/destructibles/
```

## Gameplay Hook Notes

Next sprint should add prop actors with health, map each placed prop to one of the animation keys above, and replace the prop sprite with the matching break FX when hit by slap, Rush, dog special, or enemy knockback.
