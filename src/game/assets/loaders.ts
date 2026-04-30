import Phaser from 'phaser';
import { characterRegistry, type AnimationDefinition, type CharacterDefinition } from '../content/characterRegistry';
import { assetKeys, assetPaths } from './manifest';

export function loadCoreAssets(scene: Phaser.Scene) {
  scene.load.image(assetKeys.backgroundFar, assetPaths.backgroundFar);
  scene.load.image(assetKeys.background, assetPaths.background);
  scene.load.image(assetKeys.backgroundPlayLane, assetPaths.backgroundPlayLane);
  scene.load.image(assetKeys.backgroundThumb, assetPaths.backgroundThumb);
  scene.load.image(assetKeys.uiObjectiveChip, assetPaths.uiObjectiveChip);
  scene.load.image(assetKeys.uiDialogueFrame, assetPaths.uiDialogueFrame);
  scene.load.image(assetKeys.uiCharacterPanel, assetPaths.uiCharacterPanel);
  const propKeys = [
    'propGreenScooter','propRedScooter','propStreetFoodCart','propTrafficCone',
    'propTrashBin','propPottedPlant','propBeerNeonSign','propTattooSandwichBoard',
    'propWeedSandwichBoard','propRollingShutter','propCableBundle','propInkBottle',
    'propBahtCoin','propEnergySoda','propPuddleDecal','propStickerChair'
  ] as const;
  for (const key of propKeys) {
    scene.load.image(assetKeys[key], assetPaths[key]);
  }
  scene.load.spritesheet(assetKeys.superSlapFx, assetPaths.superSlapFx, {
    frameWidth: 256,
    frameHeight: 256
  });
  scene.load.spritesheet(assetKeys.hitImpactFx, assetPaths.hitImpactFx, {
    frameWidth: 256,
    frameHeight: 256
  });
  scene.load.spritesheet(assetKeys.dustStepFx, assetPaths.dustStepFx, {
    frameWidth: 256,
    frameHeight: 256
  });
  scene.load.spritesheet(assetKeys.destructibleScooterFx, assetPaths.destructibleScooterFx, {
    frameWidth: 256,
    frameHeight: 256
  });
  scene.load.spritesheet(assetKeys.destructibleStreetClutterFx, assetPaths.destructibleStreetClutterFx, {
    frameWidth: 256,
    frameHeight: 256
  });
  scene.load.spritesheet(assetKeys.destructiblePlantChairFx, assetPaths.destructiblePlantChairFx, {
    frameWidth: 256,
    frameHeight: 256
  });
}

export function loadCharacterAssets(scene: Phaser.Scene, characters: CharacterDefinition[] = characterRegistry) {
  for (const character of characters) {
    scene.load.image(character.seed.key, character.seed.path);
    for (const animation of Object.values(character.animations)) {
      scene.load.spritesheet(animation.key, animation.file, {
        frameWidth: animation.frameWidth,
        frameHeight: animation.frameHeight
      });
    }
  }
}

export function registerGameAnimations(scene: Phaser.Scene) {
  registerFxAnimation(scene, 'fx:super-slap:burst', assetKeys.superSlapFx, 8, 22, 0);
  registerFxAnimation(scene, 'fx:hit-impact:burst', assetKeys.hitImpactFx, 6, 18, 0);
  registerFxAnimation(scene, 'fx:dust-step:puff', assetKeys.dustStepFx, 6, 14, 0);
  registerFxAnimation(scene, 'fx:destructible:scooter:break', assetKeys.destructibleScooterFx, 6, 14, 0);
  registerFxAnimation(scene, 'fx:destructible:street-clutter:break', assetKeys.destructibleStreetClutterFx, 6, 14, 0);
  registerFxAnimation(scene, 'fx:destructible:plant-chair:break', assetKeys.destructiblePlantChairFx, 6, 14, 0);

  for (const character of characterRegistry) {
    for (const [action, animation] of Object.entries(character.animations)) {
      registerCharacterAnimation(scene, character.id, action, animation);
    }
  }
}

function registerCharacterAnimation(
  scene: Phaser.Scene,
  characterId: string,
  action: string,
  animation: AnimationDefinition
) {
  const key = getAnimationKey(characterId, action);
  if (scene.anims.exists(key)) return;
  scene.anims.create({
    key,
    frames: scene.anims.generateFrameNumbers(animation.key, {
      start: 0,
      end: animation.frames - 1
    }),
    frameRate: animation.frameRate,
    repeat: animation.repeat
  });
}

function registerFxAnimation(
  scene: Phaser.Scene,
  key: string,
  textureKey: string,
  frames: number,
  frameRate: number,
  repeat: number
) {
  if (scene.anims.exists(key)) return;
  scene.anims.create({
    key,
    frames: scene.anims.generateFrameNumbers(textureKey, { start: 0, end: frames - 1 }),
    frameRate,
    repeat,
    hideOnComplete: repeat === 0
  });
}

export function getAnimationKey(characterId: string, action: string) {
  return `character:${characterId}:${action}`;
}

export function playCharacterAnimation(
  sprite: Phaser.GameObjects.Sprite,
  characterId: string,
  action: string,
  ignoreIfPlaying = true
) {
  const key = getAnimationKey(characterId, action);
  if (ignoreIfPlaying && sprite.anims.currentAnim?.key === key && sprite.anims.isPlaying) {
    return;
  }
  sprite.play(key, false);
}
