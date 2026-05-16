const fs = require('fs');

const registryPath = 'src/game/content/characterRegistry.json';
const data = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const girls = [
  { id: 'npc-girl-red', name: 'Mia', handle: 'Club Goer' },
  { id: 'npc-girl-black', name: 'Chloe', handle: 'Club Goer' },
  { id: 'npc-girl-denim', name: 'Emma', handle: 'Party Girl' },
  { id: 'npc-girl-silver', name: 'Lily', handle: 'Party Girl' }
];

girls.forEach(girl => {
  // Check if it already exists
  if (data.characters.some(c => c.id === girl.id)) return;

  const character = {
    id: girl.id,
    displayName: girl.name,
    handle: girl.handle,
    role: 'npc',
    faction: 'nightlife',
    seed: {
      key: `character:${girl.id}:seed`,
      path: `assets/generated/characters/npcs/${girl.id}.png`
    },
    render: {
      scale: 0.48,
      originX: 0.5,
      originY: 0.9
    },
    stats: {
      maxHp: 70,
      speed: 90,
      attackDamage: 0,
      superDamage: 0,
      weight: 0.82
    },
    physics: {
      bodyWidth: 76,
      bodyHeight: 184,
      bodyOffsetX: 90,
      bodyOffsetY: 42
    },
    combat: {
      canUseSuperSlap: false,
      hitboxProfile: 'none',
      hurtboxProfile: 'human-light',
      aiProfile: 'idle-npc'
    },
    animations: {
      idle: {
        key: `anim:${girl.id}:idle`,
        file: `assets/generated/animations/${girl.id}/idle.png`,
        frames: 6,
        frameWidth: 256,
        frameHeight: 256,
        frameRate: 6,
        repeat: -1
      }
    }
  };
  data.characters.push(character);
});

fs.writeFileSync(registryPath, JSON.stringify(data, null, 2) + '\n');
console.log('Added girls to registry.');
