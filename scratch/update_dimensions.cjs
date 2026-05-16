const fs = require('fs');

const registryPath = 'src/game/content/characterRegistry.json';
const data = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const ids = ['npc-girl-red', 'npc-girl-black', 'npc-girl-denim', 'npc-girl-silver'];

data.characters.forEach(character => {
  if (ids.includes(character.id)) {
    character.animations.idle.frameWidth = 342;
    character.animations.idle.frameHeight = 341;
    character.render.scale = 0.25;
  }
});

fs.writeFileSync(registryPath, JSON.stringify(data, null, 2) + '\n');
console.log('Updated frame dimensions.');
