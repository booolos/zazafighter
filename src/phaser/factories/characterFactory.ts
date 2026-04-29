import Phaser from 'phaser';
import { playCharacterAnimation } from '../../game/assets/loaders';
import type { CharacterDefinition } from '../../game/content/characters';

export type ArcadeCharacterSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

const RUNTIME_CHARACTER_SCALE = 2.48;

export function getRuntimeScale(character: CharacterDefinition) {
  return character.render.scale * RUNTIME_CHARACTER_SCALE;
}

export function createCharacterSprite(
  scene: Phaser.Scene,
  character: CharacterDefinition,
  x: number,
  y: number,
  options: {
    action?: string;
    immovable?: boolean;
    flipX?: boolean;
    drag?: number;
    collideWorldBounds?: boolean;
  } = {}
): ArcadeCharacterSprite {
  const action = options.action ?? 'idle';
  const texture = character.animations[action]?.key ?? character.seed.key;
  const sprite = scene.physics.add.sprite(x, y, texture, 0)
    .setOrigin(character.render.originX, character.render.originY)
    .setScale(getRuntimeScale(character))
    .setImmovable(Boolean(options.immovable))
    .setFlipX(Boolean(options.flipX));

  sprite.setBodySize(character.physics.bodyWidth, character.physics.bodyHeight);
  sprite.setOffset(character.physics.bodyOffsetX, character.physics.bodyOffsetY);
  sprite.setDrag(options.drag ?? 0, options.drag ?? 0);
  sprite.setCollideWorldBounds(Boolean(options.collideWorldBounds));

  if (character.animations[action]) {
    playCharacterAnimation(sprite, character.id, action);
  }

  return sprite;
}
