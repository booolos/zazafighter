# Codex Build Brief

Build a mobile-web-only, landscape Phaser 3 game called Slap Street: Ink District.

## Stack
- Phaser 3
- Vite
- JavaScript modules
- GitHub Pages static hosting
- Arcade Physics
- No backend
- Touch controls only

## Resolution and orientation
- 1280x720 base resolution
- Phaser.Scale.FIT and CENTER_BOTH
- Portrait blocker overlay
- Request fullscreen and attempt screen.orientation.lock('landscape') after Start tap
- Include manifest.json orientation: landscape

## Scenes
BootScene, PreloadScene, MenuScene, CharacterSelectScene, Level1Scene, UIScene.

## Controls
Virtual joystick left. Attack, Jump/Dodge, Super Slap buttons right. Pause top-right.

## Main characters
main_hat / Kiko: green cap fighter, faster/agile.
big_ink / Casey: tattooed lounge-owner, heavier/stronger.

## Super Slap
Exclusive to playable main characters. Full meter required. Forward shockwave, knockback, screen shake, hit-stop, neon VFX.

## NPCs
Indian tattoo artist, lounge manager, bouncer, vendor, customer, mechanic. NPCs idle/talk/react/walk, cannot use Super Slap.

## Enemies
Street thug, rival artist, scooter punk, corrupt bouncer mini-boss.

## Level 1
Tattoo Street, 2400x720, parallax background, tattoo shop door at far right, street props, NPCs near storefront, enemies in street. Win by defeating enemies and reaching the shop door.

## Fallback rule
Prototype must run with placeholder shapes if final art files are missing, while preserving final asset paths.
