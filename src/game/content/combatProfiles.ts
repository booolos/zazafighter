import profilesJson from './combatProfiles.json';

export type HitboxProfile = {
  range: number;
  laneHeight: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  damageMultiplier: number;
  knockback: number;
  stun: number;
  hitStopMs: number;
  meterGain: number;
  meterGainOnWhiff: number;
  cooldownMs: number;
  vfx?: 'fx:hit-impact:burst' | 'fx:super-slap:burst';
};

export type AiProfile = {
  kind: 'player' | 'npc' | 'enemy' | 'boss';
  reactsToCombat?: boolean;
  dialogue?: boolean;
  aggroRange: number;
  preferredRange: number;
  laneSpeedMultiplier: number;
  attackCooldownMin: number;
  attackCooldownMax: number;
};

export type HurtboxProfile = {
  width: number;
  height: number;
  offsetY: number;
  damageTakenMultiplier: number;
  knockbackMultiplier: number;
};

type CombatProfiles = {
  hitboxes: Record<string, HitboxProfile>;
  hurtboxes: Record<string, HurtboxProfile>;
  aiProfiles: Record<string, AiProfile>;
};

export const combatProfiles = profilesJson as unknown as CombatProfiles;

export function getHitboxProfile(key: string): HitboxProfile {
  const profile = combatProfiles.hitboxes[key];
  if (!profile) throw new Error(`Unknown hitbox profile: ${key}`);
  return profile;
}

export function getAiProfile(key: string): AiProfile {
  const profile = combatProfiles.aiProfiles[key];
  if (!profile) throw new Error(`Unknown AI profile: ${key}`);
  return profile;
}

export function getHurtboxProfile(key: string): HurtboxProfile {
  const profile = combatProfiles.hurtboxes[key];
  if (!profile) throw new Error(`Unknown hurtbox profile: ${key}`);
  return profile;
}
