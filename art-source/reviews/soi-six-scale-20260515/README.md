# Soi Six Scale Review - 2026-05-15

Local contact-sheet report for current Soi Six girl animation sprites, source sheets, and feet-check strips.

Generated artifacts:

- `sprite-scale-contact-sheet.png` - first-frame, native-scale character/action overview.
- `animation-strip-contact-sheet.png` - full animation strip thumbnails with metrics.
- `feet-check-strip-contact-sheet.png` - full feet-check and face strip thumbnails.
- `feet-check-frame-contact-sheet.png` - feet-check frames split out at equal scale.
- `source-sheet-contact-sheet.png` - generated Soi Six source sheets.

Heuristic flags:

- `edge n/m`: alpha touches within 2 px of a frame edge on `n` of `m` frames; worth checking for cropping.
- `small`: median alpha height is under 55% of frame height; worth checking for undersized art.
- `wide/crop?`: median alpha width is over 90% of frame width; often signals side cropping.
- Opaque PNGs are marked `opaque: visual check` on the contact sheets because alpha bounds cannot isolate the subject.

Scanned `92` animation strips, `12` feet-check/face images, and `12` source sheets.

## Flagged Assets

| Asset | Kind | Frames | Frame | Visible median | Flags |
| --- | --- | ---: | --- | --- | --- |
| `public/assets/generated/animations/soi-six-hd-dao/cheer.png` | animation | 6 | 512x384 | 391x346 | edge 5/6 |
| `public/assets/generated/animations/soi-six-hd-dao/idle.png` | animation | 6 | 512x384 | 398x346 | edge 3/6 |
| `public/assets/generated/animations/soi-six-hd-dao/react.png` | animation | 3 | 512x384 | 406x346 | edge 3/3 |
| `public/assets/generated/animations/soi-six-hd-dao/talk.png` | animation | 6 | 512x384 | 398x346 | edge 5/6 |
| `public/assets/generated/animations/soi-six-hd-kanda/cheer.png` | animation | 6 | 512x384 | 380x346 | edge 5/6 |
| `public/assets/generated/animations/soi-six-hd-kanda/idle.png` | animation | 6 | 512x384 | 264x346 | edge 3/6 |
| `public/assets/generated/animations/soi-six-hd-kanda/react.png` | animation | 3 | 512x384 | 387x346 | edge 2/3 |
| `public/assets/generated/animations/soi-six-hd-kanda/talk.png` | animation | 6 | 512x384 | 384x346 | edge 3/6 |
| `public/assets/generated/animations/soi-six-hd-mintra/cheer.png` | animation | 6 | 512x384 | 387x346 | edge 4/6 |
| `public/assets/generated/animations/soi-six-hd-mintra/idle.png` | animation | 6 | 512x384 | 266x346 | edge 2/6 |
| `public/assets/generated/animations/soi-six-hd-mintra/react.png` | animation | 3 | 512x384 | 380x346 | edge 2/3 |
| `public/assets/generated/animations/soi-six-hd-mintra/talk.png` | animation | 6 | 512x384 | 274x346 | edge 2/6 |
| `public/assets/generated/animations/soi-six-hd-ploy/cheer.png` | animation | 6 | 512x384 | 390x346 | edge 6/6 |
| `public/assets/generated/animations/soi-six-hd-ploy/idle.png` | animation | 6 | 512x384 | 396x346 | edge 6/6 |
| `public/assets/generated/animations/soi-six-hd-ploy/react.png` | animation | 3 | 512x384 | 399x346 | edge 3/3 |
| `public/assets/generated/animations/soi-six-hd-ploy/talk.png` | animation | 6 | 512x384 | 392x346 | edge 6/6 |
| `public/assets/generated/interactions/feet-check/soi-six-hd-dao-face.png` | feet-check | 5 | 512x720 | 512x720 | edge 5/5, wide/crop? |
| `public/assets/generated/interactions/feet-check/soi-six-hd-kanda-face.png` | feet-check | 5 | 512x720 | 512x720 | edge 5/5, wide/crop? |
| `public/assets/generated/interactions/feet-check/soi-six-hd-mew-face.png` | feet-check | 5 | 512x720 | 512x720 | edge 5/5, wide/crop? |
| `public/assets/generated/interactions/feet-check/soi-six-hd-mintra-face.png` | feet-check | 5 | 512x720 | 512x720 | edge 5/5, wide/crop? |
| `public/assets/generated/interactions/feet-check/soi-six-hd-mintra-heels-strip.png` | feet-check | 10 | 512x512 | 512x512 | edge 10/10, wide/crop? |
| `public/assets/generated/interactions/feet-check/soi-six-hd-ploy-face.png` | feet-check | 5 | 512x720 | 512x720 | edge 5/5, wide/crop? |
| `public/assets/generated/interactions/feet-check/soi-six-hd-ploy-heels-strip.png` | feet-check | 10 | 512x512 | 512x512 | edge 10/10, wide/crop? |

## Full Metrics

| Asset | Kind | Frames | Frame | Alpha | Visible median | Edge touches |
| --- | --- | ---: | --- | --- | --- | ---: |
| `public/assets/generated/animations/npc-girl-black/cheer.png` | animation | 3 | 512x256 | transparent | 356x222 | 0 |
| `public/assets/generated/animations/npc-girl-black/idle.png` | animation | 3 | 512x256 | transparent | 356x222 | 0 |
| `public/assets/generated/animations/npc-girl-black/panic.png` | animation | 3 | 512x256 | transparent | 356x222 | 0 |
| `public/assets/generated/animations/npc-girl-black/react.png` | animation | 3 | 512x256 | transparent | 356x222 | 0 |
| `public/assets/generated/animations/npc-girl-black/talk.png` | animation | 3 | 512x256 | transparent | 356x222 | 0 |
| `public/assets/generated/animations/npc-girl-black/walk.png` | animation | 3 | 512x256 | transparent | 356x222 | 0 |
| `public/assets/generated/animations/npc-girl-denim/cheer.png` | animation | 3 | 512x256 | transparent | 345x222 | 0 |
| `public/assets/generated/animations/npc-girl-denim/idle.png` | animation | 3 | 512x256 | transparent | 345x222 | 0 |
| `public/assets/generated/animations/npc-girl-denim/panic.png` | animation | 3 | 512x256 | transparent | 345x222 | 0 |
| `public/assets/generated/animations/npc-girl-denim/react.png` | animation | 3 | 512x256 | transparent | 345x222 | 0 |
| `public/assets/generated/animations/npc-girl-denim/talk.png` | animation | 3 | 512x256 | transparent | 345x222 | 0 |
| `public/assets/generated/animations/npc-girl-denim/walk.png` | animation | 3 | 512x256 | transparent | 345x222 | 0 |
| `public/assets/generated/animations/npc-girl-red/cheer.png` | animation | 3 | 512x256 | transparent | 346x222 | 0 |
| `public/assets/generated/animations/npc-girl-red/idle.png` | animation | 3 | 512x256 | transparent | 346x222 | 0 |
| `public/assets/generated/animations/npc-girl-red/panic.png` | animation | 3 | 512x256 | transparent | 346x222 | 0 |
| `public/assets/generated/animations/npc-girl-red/react.png` | animation | 3 | 512x256 | transparent | 346x222 | 0 |
| `public/assets/generated/animations/npc-girl-red/talk.png` | animation | 3 | 512x256 | transparent | 346x222 | 0 |
| `public/assets/generated/animations/npc-girl-red/walk.png` | animation | 3 | 512x256 | transparent | 346x222 | 0 |
| `public/assets/generated/animations/npc-girl-silver/cheer.png` | animation | 3 | 512x256 | transparent | 333x222 | 0 |
| `public/assets/generated/animations/npc-girl-silver/idle.png` | animation | 3 | 512x256 | transparent | 333x222 | 0 |
| `public/assets/generated/animations/npc-girl-silver/panic.png` | animation | 3 | 512x256 | transparent | 333x222 | 0 |
| `public/assets/generated/animations/npc-girl-silver/react.png` | animation | 3 | 512x256 | transparent | 333x222 | 0 |
| `public/assets/generated/animations/npc-girl-silver/talk.png` | animation | 3 | 512x256 | transparent | 333x222 | 0 |
| `public/assets/generated/animations/npc-girl-silver/walk.png` | animation | 3 | 512x256 | transparent | 333x222 | 0 |
| `public/assets/generated/animations/soi-six-hd-dao/cheer.png` | animation | 6 | 512x384 | transparent | 391x346 | 5 |
| `public/assets/generated/animations/soi-six-hd-dao/idle.png` | animation | 6 | 512x384 | transparent | 398x346 | 3 |
| `public/assets/generated/animations/soi-six-hd-dao/panic.png` | animation | 11 | 384x384 | transparent | 208x346 | 0 |
| `public/assets/generated/animations/soi-six-hd-dao/react.png` | animation | 3 | 512x384 | transparent | 406x346 | 3 |
| `public/assets/generated/animations/soi-six-hd-dao/run.png` | animation | 11 | 384x384 | transparent | 208x346 | 0 |
| `public/assets/generated/animations/soi-six-hd-dao/talk.png` | animation | 6 | 512x384 | transparent | 398x346 | 5 |
| `public/assets/generated/animations/soi-six-hd-dao/walk.png` | animation | 10 | 384x384 | transparent | 179x346 | 0 |
| `public/assets/generated/animations/soi-six-hd-kanda/cheer.png` | animation | 6 | 512x384 | transparent | 380x346 | 5 |
| `public/assets/generated/animations/soi-six-hd-kanda/idle.png` | animation | 6 | 512x384 | transparent | 264x346 | 3 |
| `public/assets/generated/animations/soi-six-hd-kanda/panic.png` | animation | 11 | 384x384 | transparent | 199x346 | 0 |
| `public/assets/generated/animations/soi-six-hd-kanda/react.png` | animation | 3 | 512x384 | transparent | 387x346 | 2 |
| `public/assets/generated/animations/soi-six-hd-kanda/run.png` | animation | 11 | 384x384 | transparent | 199x346 | 0 |
| `public/assets/generated/animations/soi-six-hd-kanda/talk.png` | animation | 6 | 512x384 | transparent | 384x346 | 3 |
| `public/assets/generated/animations/soi-six-hd-kanda/walk.png` | animation | 10 | 384x384 | transparent | 161x346 | 0 |
| `public/assets/generated/animations/soi-six-hd-mew/cheer.png` | animation | 10 | 384x384 | transparent | 120x344 | 0 |
| `public/assets/generated/animations/soi-six-hd-mew/idle.png` | animation | 10 | 384x384 | transparent | 134x344 | 0 |
| `public/assets/generated/animations/soi-six-hd-mew/panic.png` | animation | 10 | 384x384 | transparent | 188x344 | 0 |
| `public/assets/generated/animations/soi-six-hd-mew/react.png` | animation | 3 | 512x384 | transparent | 147x344 | 0 |
| `public/assets/generated/animations/soi-six-hd-mew/run.png` | animation | 10 | 384x384 | transparent | 188x344 | 0 |
| `public/assets/generated/animations/soi-six-hd-mew/talk.png` | animation | 10 | 384x384 | transparent | 134x344 | 0 |
| `public/assets/generated/animations/soi-six-hd-mew/walk.png` | animation | 10 | 384x384 | transparent | 172x344 | 0 |
| `public/assets/generated/animations/soi-six-hd-mintra/cheer.png` | animation | 6 | 512x384 | transparent | 387x346 | 4 |
| `public/assets/generated/animations/soi-six-hd-mintra/idle.png` | animation | 6 | 512x384 | transparent | 266x346 | 2 |
| `public/assets/generated/animations/soi-six-hd-mintra/panic.png` | animation | 11 | 384x384 | transparent | 200x346 | 0 |
| `public/assets/generated/animations/soi-six-hd-mintra/react.png` | animation | 3 | 512x384 | transparent | 380x346 | 2 |
| `public/assets/generated/animations/soi-six-hd-mintra/run.png` | animation | 11 | 384x384 | transparent | 200x346 | 0 |
| `public/assets/generated/animations/soi-six-hd-mintra/talk.png` | animation | 6 | 512x384 | transparent | 274x346 | 2 |
| `public/assets/generated/animations/soi-six-hd-mintra/walk.png` | animation | 10 | 384x384 | transparent | 168x346 | 0 |
| `public/assets/generated/animations/soi-six-hd-ploy/cheer.png` | animation | 6 | 512x384 | transparent | 390x346 | 6 |
| `public/assets/generated/animations/soi-six-hd-ploy/idle.png` | animation | 6 | 512x384 | transparent | 396x346 | 6 |
| `public/assets/generated/animations/soi-six-hd-ploy/panic.png` | animation | 11 | 384x384 | transparent | 207x346 | 0 |
| `public/assets/generated/animations/soi-six-hd-ploy/react.png` | animation | 3 | 512x384 | transparent | 399x346 | 3 |
| `public/assets/generated/animations/soi-six-hd-ploy/run.png` | animation | 11 | 384x384 | transparent | 207x346 | 0 |
| `public/assets/generated/animations/soi-six-hd-ploy/talk.png` | animation | 6 | 512x384 | transparent | 392x346 | 6 |
| `public/assets/generated/animations/soi-six-hd-ploy/walk.png` | animation | 10 | 384x384 | transparent | 175x346 | 0 |
| `public/assets/generated/animations/soi-six-nina/cheer.png` | animation | 2 | 512x256 | transparent | 314x226 | 0 |
| `public/assets/generated/animations/soi-six-nina/idle.png` | animation | 2 | 512x256 | transparent | 324x220 | 0 |
| `public/assets/generated/animations/soi-six-nina/panic.png` | animation | 2 | 512x256 | transparent | 306x220 | 0 |
| `public/assets/generated/animations/soi-six-nina/react.png` | animation | 2 | 512x256 | transparent | 311x220 | 0 |
| `public/assets/generated/animations/soi-six-nina/talk.png` | animation | 2 | 512x256 | transparent | 320x220 | 0 |
| `public/assets/generated/animations/soi-six-nina/walk.png` | animation | 3 | 512x256 | transparent | 319x220 | 0 |
| `public/assets/generated/animations/soi-six-ruby/cheer.png` | animation | 2 | 512x256 | transparent | 324x226 | 0 |
| `public/assets/generated/animations/soi-six-ruby/idle.png` | animation | 2 | 512x256 | transparent | 334x220 | 0 |
| `public/assets/generated/animations/soi-six-ruby/panic.png` | animation | 2 | 512x256 | transparent | 318x220 | 0 |
| `public/assets/generated/animations/soi-six-ruby/react.png` | animation | 2 | 512x256 | transparent | 323x221 | 0 |
| `public/assets/generated/animations/soi-six-ruby/talk.png` | animation | 2 | 512x256 | transparent | 330x220 | 0 |
| `public/assets/generated/animations/soi-six-ruby/walk.png` | animation | 3 | 512x256 | transparent | 331x220 | 0 |
| `public/assets/generated/animations/soi-six-thai-lada/cheer.png` | animation | 2 | 512x256 | transparent | 342x226 | 0 |
| `public/assets/generated/animations/soi-six-thai-lada/idle.png` | animation | 2 | 512x256 | transparent | 344x226 | 0 |
| `public/assets/generated/animations/soi-six-thai-lada/panic.png` | animation | 3 | 512x256 | transparent | 391x226 | 0 |
| `public/assets/generated/animations/soi-six-thai-lada/react.png` | animation | 2 | 512x256 | transparent | 344x226 | 0 |
| `public/assets/generated/animations/soi-six-thai-lada/run.png` | animation | 3 | 512x256 | transparent | 391x226 | 0 |
| `public/assets/generated/animations/soi-six-thai-lada/talk.png` | animation | 2 | 512x256 | transparent | 344x226 | 0 |
| `public/assets/generated/animations/soi-six-thai-lada/walk.png` | animation | 3 | 512x256 | transparent | 378x226 | 0 |
| `public/assets/generated/animations/soi-six-thai-mali/cheer.png` | animation | 2 | 512x256 | transparent | 344x226 | 0 |
| `public/assets/generated/animations/soi-six-thai-mali/idle.png` | animation | 2 | 512x256 | transparent | 346x226 | 0 |
| `public/assets/generated/animations/soi-six-thai-mali/panic.png` | animation | 3 | 512x256 | transparent | 398x226 | 0 |
| `public/assets/generated/animations/soi-six-thai-mali/react.png` | animation | 2 | 512x256 | transparent | 346x226 | 0 |
| `public/assets/generated/animations/soi-six-thai-mali/run.png` | animation | 3 | 512x256 | transparent | 397x226 | 0 |
| `public/assets/generated/animations/soi-six-thai-mali/talk.png` | animation | 2 | 512x256 | transparent | 346x226 | 0 |
| `public/assets/generated/animations/soi-six-thai-mali/walk.png` | animation | 3 | 512x256 | transparent | 379x226 | 0 |
| `public/assets/generated/animations/soi-six-thai-pim/cheer.png` | animation | 2 | 512x256 | transparent | 362x220 | 0 |
| `public/assets/generated/animations/soi-six-thai-pim/idle.png` | animation | 2 | 512x256 | transparent | 363x220 | 0 |
| `public/assets/generated/animations/soi-six-thai-pim/panic.png` | animation | 3 | 512x256 | transparent | 388x220 | 0 |
| `public/assets/generated/animations/soi-six-thai-pim/react.png` | animation | 2 | 512x256 | transparent | 359x220 | 0 |
| `public/assets/generated/animations/soi-six-thai-pim/run.png` | animation | 3 | 512x256 | transparent | 388x220 | 0 |
| `public/assets/generated/animations/soi-six-thai-pim/talk.png` | animation | 2 | 512x256 | transparent | 362x220 | 0 |
| `public/assets/generated/animations/soi-six-thai-pim/walk.png` | animation | 3 | 512x256 | transparent | 388x220 | 0 |
| `public/assets/generated/interactions/feet-check/soi-six-hd-dao-face.png` | feet-check | 5 | 512x720 | transparent | 512x720 | 5 |
| `public/assets/generated/interactions/feet-check/soi-six-hd-dao-heels-strip.png` | feet-check | 10 | 512x512 | opaque | n/a | 0 |
| `public/assets/generated/interactions/feet-check/soi-six-hd-kanda-face.png` | feet-check | 5 | 512x720 | transparent | 512x720 | 5 |
| `public/assets/generated/interactions/feet-check/soi-six-hd-kanda-heels-strip.png` | feet-check | 10 | 512x512 | opaque | n/a | 0 |
| `public/assets/generated/interactions/feet-check/soi-six-hd-mew-face.png` | feet-check | 5 | 512x720 | transparent | 512x720 | 5 |
| `public/assets/generated/interactions/feet-check/soi-six-hd-mew-heels-strip.png` | feet-check | 10 | 512x512 | opaque | n/a | 0 |
| `public/assets/generated/interactions/feet-check/soi-six-hd-mintra-face.png` | feet-check | 5 | 512x720 | transparent | 512x720 | 5 |
| `public/assets/generated/interactions/feet-check/soi-six-hd-mintra-heels-strip.png` | feet-check | 10 | 512x512 | transparent | 512x512 | 10 |
| `public/assets/generated/interactions/feet-check/soi-six-hd-ploy-face.png` | feet-check | 5 | 512x720 | transparent | 512x720 | 5 |
| `public/assets/generated/interactions/feet-check/soi-six-hd-ploy-heels-strip.png` | feet-check | 10 | 512x512 | transparent | 512x512 | 10 |
| `public/assets/generated/interactions/feet-check/soi-six-hd-rina-face.png` | feet-check | 2 | 320x720 | opaque | n/a | 0 |
| `public/assets/generated/interactions/feet-check/soi-six-hd-rina-heels-strip.png` | feet-check | 10 | 512x512 | opaque | n/a | 0 |
| `public/assets/generated/source-sheets/soi-six-hd-dao-source-v1-20260515.png` | source-sheet | 2 | 887x887 | opaque | n/a | 0 |
| `public/assets/generated/source-sheets/soi-six-hd-kanda-source-v1-20260515.png` | source-sheet | 2 | 887x887 | opaque | n/a | 0 |
| `public/assets/generated/source-sheets/soi-six-hd-mew-source-v1-20260515.png` | source-sheet | 1 | 1619x972 | opaque | n/a | 0 |
| `public/assets/generated/source-sheets/soi-six-hd-mintra-source-v1-20260515.png` | source-sheet | 2 | 887x887 | opaque | n/a | 0 |
| `public/assets/generated/source-sheets/soi-six-hd-ploy-source-v1-20260515.png` | source-sheet | 1 | 1751x898 | opaque | n/a | 0 |
| `public/assets/generated/source-sheets/soi-six-microbikini-runners-v1.png` | source-sheet | 1 | 1536x1024 | opaque | n/a | 0 |
| `public/assets/generated/source-sheets/soi-six-thai-lada-row-source.png` | source-sheet | 1 | 1536x341 | opaque | n/a | 0 |
| `public/assets/generated/source-sheets/soi-six-runners-v1-rows/soi-six-thai-lada-source-row.png` | source-sheet | 1 | 1536x341 | opaque | n/a | 0 |
| `public/assets/generated/source-sheets/soi-six-thai-mali-row-source.png` | source-sheet | 1 | 1536x341 | opaque | n/a | 0 |
| `public/assets/generated/source-sheets/soi-six-runners-v1-rows/soi-six-thai-mali-source-row.png` | source-sheet | 1 | 1536x341 | opaque | n/a | 0 |
| `public/assets/generated/source-sheets/soi-six-thai-pim-row-source.png` | source-sheet | 1 | 1536x342 | opaque | n/a | 0 |
| `public/assets/generated/source-sheets/soi-six-runners-v1-rows/soi-six-thai-pim-source-row.png` | source-sheet | 1 | 1536x342 | opaque | n/a | 0 |
