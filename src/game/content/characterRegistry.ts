import registryJson from './characterRegistry.json';

export type CharacterRole = 'player' | 'npc' | 'enemy' | 'boss' | 'companion';

export type AnimationDefinition = {
  key: string;
  file: string;
  frames: number;
  frameWidth: number;
  frameHeight: number;
  frameRate: number;
  repeat: number;
};

export type FeetCheckDefinition = {
  title: string;
  subtitle: string;
  faceImage: string;
  faceFrames?: number;
  faceFrameWidth?: number;
  faceFrameHeight?: number;
  faceFps?: number;
  stripImage: string;
  frames: number;
  frameWidth: number;
  frameHeight: number;
  fps: number;
};

export type CharacterDefinition = {
  id: string;
  displayName: string;
  handle: string;
  role: CharacterRole;
  faction: string;
  seed: {
    key: string;
    path: string;
  };
  render: {
    scale: number;
    originX: number;
    originY: number;
  };
  stats: {
    maxHp: number;
    speed: number;
    attackDamage: number;
    superDamage: number;
    weight: number;
  };
  physics: {
    bodyWidth: number;
    bodyHeight: number;
    bodyOffsetX: number;
    bodyOffsetY: number;
  };
  combat: {
    canUseSuperSlap: boolean;
    hitboxProfile: string;
    hurtboxProfile: string;
    aiProfile: string;
  };
  animations: Record<string, AnimationDefinition>;
  feetCheck?: FeetCheckDefinition;
};

export type CharacterRegistry = {
  characters: CharacterDefinition[];
};

const registry = registryJson as unknown as CharacterRegistry;

export const characterRegistry = registry.characters;

export const playableCharacters = characterRegistry.filter((character) => character.role === 'player');
export const npcCharacters = characterRegistry.filter((character) => character.role === 'npc');
export const enemyCharacters = characterRegistry.filter((character) => character.role === 'enemy' || character.role === 'boss');
export const companionCharacters = characterRegistry.filter((character) => character.role === 'companion');

export type PlayerId = string;

export function getCharacter(id: string): CharacterDefinition {
  const character = characterRegistry.find((candidate) => candidate.id === id);
  if (!character) {
    throw new Error(`Unknown character id: ${id}`);
  }
  return character;
}

export function getAnimation(characterId: string, action: string): AnimationDefinition {
  const character = getCharacter(characterId);
  const animation = character.animations[action];
  if (!animation) {
    throw new Error(`Character ${characterId} does not define animation ${action}`);
  }
  return animation;
}

export function hasAnimation(characterId: string, action: string): boolean {
  return Boolean(getCharacter(characterId).animations[action]);
}

export function getPlayerCharacter(id: string | undefined): CharacterDefinition {
  const fallback = playableCharacters[0];
  if (!id) return fallback;
  const character = characterRegistry.find((candidate) => candidate.id === id && candidate.role === 'player');
  return character ?? fallback;
}

export function getCharactersByRole(role: CharacterRole): CharacterDefinition[] {
  return characterRegistry.filter((character) => character.role === role);
}
