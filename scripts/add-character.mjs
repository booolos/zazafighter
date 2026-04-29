import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(repoRoot, 'src/game/content/characterRegistry.json');

const roleAliases = {
  playable: 'player',
  player: 'player',
  npc: 'npc',
  enemy: 'enemy',
  boss: 'boss'
};

const seedFoldersByRole = {
  player: '',
  npc: 'npcs',
  enemy: 'enemies',
  boss: 'enemies'
};

const roleDefaults = {
  player: {
    stats: { maxHp: 110, speed: 300, attackDamage: 22, superDamage: 68, weight: 1 },
    combat: { canUseSuperSlap: true, hitboxProfile: 'quick-slap', hurtboxProfile: 'human-medium', aiProfile: 'player' },
    animations: ['idle', 'walk', 'dodge', 'jump', 'attack', 'hurt', 'stunned', 'knockdown', 'get-up', 'death', 'super-slap', 'victory']
  },
  npc: {
    stats: { maxHp: 80, speed: 70, attackDamage: 0, superDamage: 0, weight: 1 },
    combat: { canUseSuperSlap: false, hitboxProfile: 'none', hurtboxProfile: 'human-medium', aiProfile: 'idle-npc' },
    animations: ['idle', 'talk', 'walk', 'react', 'cheer', 'panic']
  },
  enemy: {
    stats: { maxHp: 80, speed: 150, attackDamage: 14, superDamage: 0, weight: 1 },
    combat: { canUseSuperSlap: false, hitboxProfile: 'basic-punch', hurtboxProfile: 'human-medium', aiProfile: 'street-rusher' },
    animations: ['idle', 'walk', 'attack', 'hurt', 'stunned', 'knockdown', 'get-up', 'death']
  },
  boss: {
    stats: { maxHp: 180, speed: 110, attackDamage: 24, superDamage: 0, weight: 1.5 },
    combat: { canUseSuperSlap: false, hitboxProfile: 'boss-heavy', hurtboxProfile: 'human-heavy', aiProfile: 'heavy-bouncer' },
    animations: ['idle', 'walk', 'attack', 'hurt', 'stunned', 'knockdown', 'get-up', 'death']
  }
};

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printUsage();
  process.exit(0);
}

if (!args.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.id)) {
  printUsage();
  process.exit(1);
}

const role = roleAliases[args.role ?? 'enemy'];
if (!role) {
  console.error(`Invalid role "${args.role}". Use player, playable, npc, enemy, or boss.`);
  process.exit(1);
}

const defaults = roleDefaults[role];
const displayName = titleize(args.id);
const seedFolder = seedFoldersByRole[role];
const seedPath = assetPath('assets/generated/characters', seedFolder, `${args.id}.png`);
const animationRoot = `assets/generated/animations/${args.id}`;
const draftRoot = path.join(repoRoot, 'public/assets/generated/character-drafts', args.id);
const draftPath = path.join(draftRoot, 'character.draft.json');

const draftRecord = {
  id: args.id,
  displayName,
  handle: displayName,
  role,
  faction: role === 'player' ? 'heroes' : role === 'npc' ? 'locals' : 'rivals',
  seed: { key: `character:${args.id}:seed`, path: seedPath },
  render: { scale: role === 'boss' ? 0.52 : 0.46, originX: 0.5, originY: 0.9 },
  stats: defaults.stats,
  physics: role === 'boss'
    ? { bodyWidth: 128, bodyHeight: 220, bodyOffsetX: 64, bodyOffsetY: 20 }
    : { bodyWidth: 105, bodyHeight: 195, bodyOffsetX: 76, bodyOffsetY: 34 },
  combat: defaults.combat,
  animations: buildAnimations(args.id, defaults.animations, animationRoot),
  status: 'draft'
};

const existingDraftRecord = readExistingDraft(draftPath);
const activeRecord = existingDraftRecord ?? draftRecord;
const registryRecord = stripDraftFields(activeRecord);
const assetDirectories = listAssetDirectories(activeRecord);
const animationDirectories = listAnimationDirectories(activeRecord);
const plannedWrites = [
  path.relative(repoRoot, draftRoot),
  ...assetDirectories.map((directory) => path.relative(repoRoot, directory)),
  path.relative(repoRoot, draftPath)
];

if (args.dryRun) {
  console.log(`Dry run: would scaffold ${args.id} (${activeRecord.role}).`);
  for (const planned of plannedWrites) console.log(`- ${planned}`);
  if (args.registry) explainRegistryWrite(registryRecord);
  process.exit(0);
}

fs.mkdirSync(draftRoot, { recursive: true });
for (const directory of assetDirectories) fs.mkdirSync(directory, { recursive: true });
for (const directory of animationDirectories) writeIfMissing(path.join(directory, '.gitkeep'), '');

let wroteDraft = false;
if (!fs.existsSync(draftPath)) {
  fs.writeFileSync(draftPath, `${JSON.stringify(draftRecord, null, 2)}\n`);
  wroteDraft = true;
}

let registryUpdated = false;
if (args.registry) {
  registryUpdated = appendToRegistry(registryRecord);
}

console.log(`${wroteDraft ? 'Created' : 'Found existing'} character draft: ${path.relative(repoRoot, draftPath)}`);
console.log(`Seed target: public/${registryRecord.seed.path}`);
for (const directory of animationDirectories) {
  console.log(`Animation target: ${path.relative(repoRoot, directory)}/`);
}
if (registryUpdated) console.log(`Appended ${args.id} to src/game/content/characterRegistry.json`);
if (!args.registry) {
  console.log('Registry unchanged. Add real art, then copy the draft record into the registry or rerun with --registry.');
}

function parseArgs(rawArgs) {
  const options = {
    dryRun: false,
    help: false,
    registry: false,
    positionals: []
  };

  for (const arg of rawArgs) {
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--registry') options.registry = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      printUsage();
      process.exit(1);
    } else {
      options.positionals.push(arg);
    }
  }

  if (options.positionals.length > 2) {
    printUsage();
    process.exit(1);
  }

  return {
    ...options,
    id: options.positionals[0],
    role: options.positionals[1]
  };
}

function printUsage() {
  console.error('Usage: node scripts/add-character.mjs <kebab-case-id> [player|playable|npc|enemy|boss] [--dry-run] [--registry]');
  console.error('');
  console.error('Default: creates a draft contract plus empty asset target folders only.');
  console.error('--registry: append the registry entry after every referenced asset file exists.');
  console.error('--dry-run: print the planned paths without writing files.');
}

function titleize(id) {
  return id.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');
}

function assetPath(...parts) {
  return parts.filter(Boolean).join('/');
}

function buildAnimations(id, actions, root) {
  return Object.fromEntries(actions.map((action) => [
    action,
    {
      key: `anim:${id}:${action}`,
      file: `${root}/${action}.png`,
      frames: frameCount(action),
      frameWidth: 256,
      frameHeight: 256,
      frameRate: frameRate(action),
      repeat: repeat(action)
    }
  ]));
}

function frameCount(action) {
  if (action === 'walk' || action === 'super-slap') return 6;
  if (action === 'hurt') return 2;
  return 4;
}

function frameRate(action) {
  if (action === 'walk') return 10;
  if (action === 'attack' || action === 'super-slap') return 12;
  if (action === 'jump') return 10;
  if (action === 'dodge') return 14;
  if (action === 'hurt') return 10;
  if (action === 'stunned') return 8;
  if (action === 'knockdown' || action === 'get-up') return 9;
  if (action === 'death') return 8;
  if (action === 'victory' || action === 'cheer') return 7;
  if (action === 'talk' || action === 'react' || action === 'panic') return 7;
  return 6;
}

function repeat(action) {
  if (['idle', 'walk', 'talk', 'stunned', 'victory', 'cheer', 'panic'].includes(action)) return -1;
  return 0;
}

function writeIfMissing(file, content) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, content);
}

function readExistingDraft(file) {
  if (!fs.existsSync(file)) return undefined;

  const draft = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (draft.id !== args.id) {
    console.error(`${path.relative(repoRoot, file)} has id "${draft.id}", expected "${args.id}".`);
    process.exit(1);
  }
  if (args.role && draft.role !== role) {
    console.error(`${path.relative(repoRoot, file)} has role "${draft.role}", expected "${role}".`);
    process.exit(1);
  }
  return draft;
}

function stripDraftFields(record) {
  const { status, ...registryRecord } = record;
  return registryRecord;
}

function expectedSeedPath(record) {
  return assetPath('assets/generated/characters', seedFoldersByRole[record.role], `${record.id}.png`);
}

function expectedAnimationFile(record, action) {
  return `assets/generated/animations/${record.id}/${action}.png`;
}

function listAssetDirectories(record) {
  const directories = [
    path.join(repoRoot, 'public', path.dirname(record.seed.path)),
    ...listAnimationDirectories(record)
  ];
  return [...new Set(directories)];
}

function listAnimationDirectories(record) {
  const directories = Object.values(record.animations).map((animation) => (
    path.join(repoRoot, 'public', path.dirname(animation.file))
  ));
  return [...new Set(directories)];
}

function appendToRegistry(record) {
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  if (!Array.isArray(registry.characters)) {
    throw new Error('src/game/content/characterRegistry.json must contain a characters array.');
  }
  if (registry.characters.some((character) => character.id === record.id)) {
    console.error(`${record.id} already exists in src/game/content/characterRegistry.json. Registry unchanged.`);
    process.exit(1);
  }

  const shapeFailures = validateRegistryRecord(record);
  if (shapeFailures.length > 0) {
    console.error(`Cannot append ${record.id} to the registry until the draft matches the runtime contract:`);
    for (const failure of shapeFailures) console.error(`- ${failure}`);
    process.exit(1);
  }

  const missingAssets = listMissingAssets(record);
  if (missingAssets.length > 0) {
    console.error(`Cannot append ${record.id} to the registry until these files exist:`);
    for (const missing of missingAssets) console.error(`- public/${missing}`);
    process.exit(1);
  }

  registry.characters.push(record);
  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
  return true;
}

function validateRegistryRecord(record) {
  const errors = [];
  if (!roleDefaults[record.role]) errors.push(`role must be player, npc, enemy, or boss`);
  if (record.seed?.key !== `character:${record.id}:seed`) {
    errors.push(`seed.key must be character:${record.id}:seed`);
  }
  const seedFile = expectedSeedPath(record);
  if (record.seed?.path !== seedFile) errors.push(`seed.path must be ${seedFile}`);
  if (record.role !== 'player' && record.combat?.canUseSuperSlap) {
    errors.push(`canUseSuperSlap can only be true for player records`);
  }

  for (const action of roleDefaults[record.role]?.animations ?? []) {
    if (!record.animations?.[action]) errors.push(`missing required animation ${action}`);
  }

  for (const [action, animation] of Object.entries(record.animations ?? {})) {
    if (animation.key !== `anim:${record.id}:${action}`) {
      errors.push(`${action}.key must be anim:${record.id}:${action}`);
    }
    const animationFile = expectedAnimationFile(record, action);
    if (animation.file !== animationFile) errors.push(`${action}.file must be ${animationFile}`);
    if (animation.frameWidth !== 256 || animation.frameHeight !== 256) {
      errors.push(`${action} must use 256x256 frames`);
    }
  }

  return errors;
}

function listMissingAssets(record) {
  const referencedPaths = [
    record.seed.path,
    ...Object.values(record.animations).map((animation) => animation.file)
  ];
  return referencedPaths.filter((relativePath) => !fs.existsSync(path.join(repoRoot, 'public', relativePath)));
}

function explainRegistryWrite(record) {
  const shapeFailures = validateRegistryRecord(record);
  if (shapeFailures.length > 0) {
    console.log('--registry would be blocked until the draft matches the runtime contract:');
    for (const failure of shapeFailures) console.log(`- ${failure}`);
    return;
  }

  const missingAssets = listMissingAssets(stripDraftFields(record));
  if (missingAssets.length > 0) {
    console.log('--registry would be blocked until these files exist:');
    for (const missing of missingAssets) console.log(`- public/${missing}`);
  } else {
    console.log(`--registry would append ${record.id} to src/game/content/characterRegistry.json`);
  }
}
