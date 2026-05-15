import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(repoRoot, 'src/game/content/characterRegistry.json');
const combatProfilesPath = path.join(repoRoot, 'src/game/content/combatProfiles.json');
const generatedManifestPath = path.join(repoRoot, 'public/assets/generated/manifest.json');

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const combatProfiles = JSON.parse(fs.readFileSync(combatProfilesPath, 'utf8'));
const generatedManifest = JSON.parse(fs.readFileSync(generatedManifestPath, 'utf8'));
const failures = [];
const warnings = [];

const requiredByRole = {
  player: ['idle', 'walk', 'dodge', 'jump', 'attack', 'hurt', 'stunned', 'knockdown', 'get-up', 'death', 'super-slap', 'victory'],
  npc: ['idle', 'talk', 'walk', 'react', 'cheer', 'panic'],
  enemy: ['idle', 'walk', 'attack', 'hurt', 'stunned', 'knockdown', 'get-up', 'death'],
  boss: ['idle', 'walk', 'attack', 'hurt', 'stunned', 'knockdown', 'get-up', 'death'],
  companion: ['idle', 'walk', 'special-attack']
};

const seedFoldersByRole = {
  player: '',
  npc: 'npcs',
  enemy: 'enemies',
  boss: 'enemies',
  companion: 'companions'
};

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function assertFile(relativePath, label) {
  const fullPath = path.join(repoRoot, 'public', relativePath);
  if (!fs.existsSync(fullPath)) {
    fail(`${label} missing: public/${relativePath}`);
    return false;
  }
  return true;
}

function isKebabCase(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function assertNumber(value, label, { min = Number.NEGATIVE_INFINITY, allowZero = true } = {}) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    fail(`${label} must be a number`);
    return;
  }
  if (!allowZero && value === 0) {
    fail(`${label} must be non-zero`);
    return;
  }
  if (value < min) fail(`${label} must be >= ${min}`);
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function assetPath(...parts) {
  return parts.filter(Boolean).join('/');
}

function expectedSeedPath(character) {
  return assetPath('assets/generated/characters', seedFoldersByRole[character.role], `${character.id}.png`);
}

function isGeneratedAnimationFile(characterId, file) {
  if (typeof file !== 'string') return false;
  const prefix = `assets/generated/animations/${characterId}`;
  return file.startsWith(prefix) && file.endsWith('.png') && !file.includes('..');
}

function validateCombatProfiles() {
  const hitboxes = combatProfiles.hitboxes ?? {};
  const hurtboxes = combatProfiles.hurtboxes ?? {};
  const aiProfiles = combatProfiles.aiProfiles ?? {};

  if (!hasOwn(hitboxes, 'none')) fail('combatProfiles.hitboxes must include "none"');
  if (!hasOwn(hitboxes, 'super-slap-wave')) fail('combatProfiles.hitboxes must include "super-slap-wave"');

  for (const [key, profile] of Object.entries(hitboxes)) {
    if (!isKebabCase(key)) fail(`Invalid hitbox profile id: ${key}`);
    for (const field of ['range', 'laneHeight', 'width', 'height', 'offsetX', 'offsetY', 'damageMultiplier', 'knockback', 'stun', 'hitStopMs', 'meterGain', 'meterGainOnWhiff', 'cooldownMs']) {
      assertNumber(profile[field], `hitbox ${key}.${field}`, { min: field === 'offsetY' ? Number.NEGATIVE_INFINITY : 0 });
    }
    if (profile.vfx && !['fx:hit-impact:burst', 'fx:super-slap:burst'].includes(profile.vfx)) {
      fail(`hitbox ${key}.vfx has unknown animation key ${profile.vfx}`);
    }
  }

  for (const [key, profile] of Object.entries(hurtboxes)) {
    if (!isKebabCase(key)) fail(`Invalid hurtbox profile id: ${key}`);
    for (const field of ['width', 'height', 'offsetY', 'damageTakenMultiplier', 'knockbackMultiplier']) {
      assertNumber(profile[field], `hurtbox ${key}.${field}`, { min: field === 'offsetY' ? Number.NEGATIVE_INFINITY : 0 });
    }
  }

  for (const [key, profile] of Object.entries(aiProfiles)) {
    if (!isKebabCase(key)) fail(`Invalid ai profile id: ${key}`);
    if (!['player', 'npc', 'enemy', 'boss', 'companion'].includes(profile.kind)) {
      fail(`ai profile ${key}.kind must be player, npc, enemy, boss, or companion`);
    }
    for (const field of ['aggroRange', 'preferredRange', 'laneSpeedMultiplier', 'attackCooldownMin', 'attackCooldownMax']) {
      assertNumber(profile[field], `ai profile ${key}.${field}`, { min: 0 });
    }
    if (profile.attackCooldownMax < profile.attackCooldownMin) {
      fail(`ai profile ${key}.attackCooldownMax must be >= attackCooldownMin`);
    }
  }
}

validateCombatProfiles();

const ids = new Set();
const manifestCharactersById = new Map((generatedManifest.characters ?? []).map((entry) => [entry.key, entry]));

for (const character of registry.characters) {
  if (!isKebabCase(character.id)) fail(`Invalid character id: ${character.id}`);
  if (ids.has(character.id)) fail(`Duplicate character id: ${character.id}`);
  ids.add(character.id);

  if (!requiredByRole[character.role]) fail(`${character.id} has unknown role ${character.role}`);
  if (character.seed.key !== `character:${character.id}:seed`) {
    fail(`${character.id} seed.key must be character:${character.id}:seed`);
  }
  const seedPath = expectedSeedPath(character);
  if (character.seed.path !== seedPath) {
    fail(`${character.id} seed.path must be ${seedPath}`);
  }
  if (character.role !== 'player' && character.combat.canUseSuperSlap) {
    fail(`${character.id} is ${character.role} but canUseSuperSlap is true`);
  }
  if (!hasOwn(combatProfiles.hitboxes ?? {}, character.combat.hitboxProfile)) {
    fail(`${character.id} references unknown hitboxProfile ${character.combat.hitboxProfile}`);
  }
  if (!hasOwn(combatProfiles.hurtboxes ?? {}, character.combat.hurtboxProfile)) {
    fail(`${character.id} references unknown hurtboxProfile ${character.combat.hurtboxProfile}`);
  }
  if (!hasOwn(combatProfiles.aiProfiles ?? {}, character.combat.aiProfile)) {
    fail(`${character.id} references unknown aiProfile ${character.combat.aiProfile}`);
  }
  if (character.role === 'enemy' && !character.combat.aiProfile) fail(`${character.id} enemy has no aiProfile`);
  if (character.role === 'boss' && !character.combat.aiProfile) fail(`${character.id} boss has no aiProfile`);

  assertFile(character.seed.path, `${character.id} seed`);
  const manifestCharacter = manifestCharactersById.get(character.id);
  if (manifestCharacter && manifestCharacter.path !== character.seed.path) {
    fail(`${character.id} manifest character path must match registry seed.path`);
  }

  const required = requiredByRole[character.role] ?? [];
  for (const action of required) {
    if (!character.animations[action]) {
      fail(`${character.id} missing required animation ${action}`);
    }
  }

  for (const [action, animation] of Object.entries(character.animations ?? {})) {
    if (animation.key !== `anim:${character.id}:${action}`) {
      fail(`${character.id}/${action} key must be anim:${character.id}:${action}`);
    }
    if (!isGeneratedAnimationFile(character.id, animation.file)) {
      fail(`${character.id}/${action} file must be a PNG under assets/generated/animations/${character.id}*`);
    }
    if (animation.frameWidth !== 256 || animation.frameHeight !== 256) {
      fail(`${character.id}/${action} must use 256x256 frames`);
    }
    if (animation.frames < 1) fail(`${character.id}/${action} has invalid frame count`);
    assertFile(animation.file, `${character.id}/${action}`);
  }
}

for (const background of generatedManifest.backgrounds ?? []) {
  assertFile(background.path, `background ${background.key}`);
}
for (const item of generatedManifest.props ?? []) {
  assertFile(item.path, `prop ${item.key}`);
}
for (const item of generatedManifest.ui ?? []) {
  assertFile(item.path, `ui ${item.key}`);
}
for (const item of generatedManifest.fx ?? []) {
  assertFile(item.path, `fx ${item.key}`);
  if (item.frameWidth !== 256 || item.frameHeight !== 256) {
    fail(`fx ${item.key} must use 256x256 frames`);
  }
}

const registryGeneratedIds = new Set(generatedManifest.characters?.map((entry) => entry.key) ?? []);
for (const character of registry.characters) {
  if (!registryGeneratedIds.has(character.id)) {
    warn(`${character.id} is not listed in public/assets/generated/manifest.json characters`);
  }
}

if (warnings.length > 0) {
  console.warn(`Asset validation warnings (${warnings.length}):`);
  for (const message of warnings) console.warn(`- ${message}`);
}

if (failures.length > 0) {
  console.error(`Asset validation failed (${failures.length}):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`Asset validation passed: ${registry.characters.length} characters, ${generatedManifest.backgrounds?.length ?? 0} backgrounds.`);
