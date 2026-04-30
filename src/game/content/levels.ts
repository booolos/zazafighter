import { assetKeys } from '../assets/manifest';

export type PickupKind = 'coin' | 'health' | 'meter';

export type LevelPropDefinition = {
  key: string;
  x: number;
  y: number;
  scale: number;
  flipX?: boolean;
  depth?: number;
  destructible?: boolean;
  fxKey?: string;
  hp?: number;
  dropKind?: PickupKind;
  hitbox?: { width: number; height: number; offsetY?: number };
  occludes?: boolean;
};

export type LevelEnemySpawn = {
  id: string;
  x: number;
  y: number;
  engageDelay: number;
};

export type LevelAmbientNpcDefinition = {
  id: string;
  x: number;
  y: number;
  flipX?: boolean;
  action?: string;
};

export type LevelThemeDefinition = {
  accent: number;
  haze: number;
  signText: string;
  signColor: number;
};

export type LevelDefinition = {
  id: string;
  title: string;
  briefing: string;
  exitLabel: string;
  clearTitle: string;
  theme: LevelThemeDefinition;
  playerStart: { x: number; y: number };
  vendor: { id: string; x: number; y: number; flipX?: boolean };
  exit: { x: number; y: number };
  backgroundKey?: string;
  ambientNpcs?: LevelAmbientNpcDefinition[];
  enemyStarts: LevelEnemySpawn[];
  props: LevelPropDefinition[];
};

const plant = (
  x: number,
  y: number,
  scale = 0.4
): LevelPropDefinition => ({
  key: assetKeys.propPottedPlant,
  x,
  y,
  scale,
  destructible: true,
  fxKey: 'fx:destructible:plant-chair:break',
  dropKind: 'health',
  hitbox: { width: 76, height: 94, offsetY: -44 },
  occludes: true
});

const cone = (x: number, y: number): LevelPropDefinition => ({
  key: assetKeys.propTrafficCone,
  x,
  y,
  scale: 0.32,
  destructible: true,
  fxKey: 'fx:destructible:street-clutter:break',
  dropKind: 'coin',
  hitbox: { width: 64, height: 84, offsetY: -38 },
  occludes: true
});

const bin = (x: number, y: number): LevelPropDefinition => ({
  key: assetKeys.propTrashBin,
  x,
  y,
  scale: 0.36,
  depth: 495,
  destructible: true,
  fxKey: 'fx:destructible:street-clutter:break',
  dropKind: 'coin',
  hitbox: { width: 82, height: 96, offsetY: -46 }
});

const scooter = (x: number, y: number, red = false, flipX = false): LevelPropDefinition => ({
  key: red ? assetKeys.propRedScooter : assetKeys.propGreenScooter,
  x,
  y,
  scale: 0.46,
  flipX,
  depth: 495,
  destructible: true,
  fxKey: 'fx:destructible:scooter:break',
  hp: 2,
  dropKind: 'meter',
  hitbox: { width: 164, height: 88, offsetY: -42 }
});

const sign = (x: number, y: number, weed = false): LevelPropDefinition => ({
  key: weed ? assetKeys.propWeedSandwichBoard : assetKeys.propTattooSandwichBoard,
  x,
  y,
  scale: 0.42,
  depth: 495,
  destructible: true,
  fxKey: 'fx:destructible:street-clutter:break',
  dropKind: 'coin',
  hitbox: { width: 88, height: 116, offsetY: -58 }
});

const chair = (x: number, y: number): LevelPropDefinition => ({
  key: assetKeys.propStickerChair,
  x,
  y,
  scale: 0.4,
  destructible: true,
  fxKey: 'fx:destructible:plant-chair:break',
  dropKind: 'coin',
  hitbox: { width: 92, height: 82, offsetY: -38 },
  occludes: true
});

const cart = (x: number, y: number): LevelPropDefinition => ({
  key: assetKeys.propStreetFoodCart,
  x,
  y,
  scale: 0.55,
  depth: 495,
  destructible: true,
  fxKey: 'fx:destructible:street-clutter:break',
  hp: 2,
  dropKind: 'health',
  hitbox: { width: 168, height: 104, offsetY: -54 }
});

const ink = (x: number, y: number): LevelPropDefinition => ({
  key: assetKeys.propInkBottle,
  x,
  y,
  scale: 0.28,
  destructible: true,
  fxKey: 'fx:destructible:plant-chair:break',
  dropKind: 'meter',
  hitbox: { width: 62, height: 82, offsetY: -36 },
  occludes: true
});

const neon = (x: number, y: number): LevelPropDefinition => ({
  key: assetKeys.propBeerNeonSign,
  x,
  y,
  scale: 0.42,
  depth: -7
});

const shutter = (x: number, y: number): LevelPropDefinition => ({
  key: assetKeys.propRollingShutter,
  x,
  y,
  scale: 0.62,
  depth: -8
});

export const levels: LevelDefinition[] = [
  {
    id: 'tattoo-weed-street',
    title: 'Tattoo Weed Street',
    briefing: 'Tattoo shop across from the weed shop. Clear the block and reach the ink door.',
    exitLabel: 'NEXT',
    clearTitle: 'SHOP CLEAR',
    theme: { accent: 0x00dfff, haze: 0x1b0f2d, signText: 'TATTOO  |  ZAZA', signColor: 0xef2b2d },
    playerStart: { x: 520, y: 584 },
    vendor: { id: 'weed-vendor', x: 1095, y: 570, flipX: true },
    exit: { x: 2075, y: 560 },
    ambientNpcs: [
      { id: 'soi-six-nina', x: 285, y: 598, flipX: false, action: 'idle' },
      { id: 'soi-six-ruby', x: 785, y: 606, flipX: true, action: 'talk' },
      { id: 'npc-girl-red', x: 450, y: 595, flipX: false, action: 'idle' },
      { id: 'npc-girl-black', x: 950, y: 600, flipX: true, action: 'idle' }
    ],
    enemyStarts: [
      { id: 'street-punk', x: 1325, y: 585, engageDelay: 0 },
      { id: 'rival-artist', x: 1510, y: 612, engageDelay: 2.4 },
      { id: 'corrupt-bouncer', x: 1740, y: 568, engageDelay: 4.8 }
    ],
    props: [
      neon(405, 372), plant(460, 660), cone(690, 654), cart(870, 648),
      scooter(1180, 660, false, true), sign(360, 666), bin(1390, 658),
      { key: assetKeys.propCableBundle, x: 1570, y: 472, scale: 0.55, depth: -6 },
      scooter(1660, 658, true), sign(1820, 666, true), ink(1980, 654), plant(2080, 666, 0.42), chair(1305, 660)
    ]
  },
  {
    id: 'walking-street-neon',
    title: 'Walking Street Neon Alley',
    briefing: 'Neon signs, bar barkers, and trouble spilling out of the side alley.',
    exitLabel: 'NEON',
    clearTitle: 'ALLEY CLEAR',
    theme: { accent: 0xff2e9a, haze: 0x241035, signText: 'WALKING STREET', signColor: 0xff2e9a },
    playerStart: { x: 440, y: 594 },
    vendor: { id: 'bar-promoter', x: 910, y: 586, flipX: true },
    exit: { x: 1980, y: 560 },
    backgroundKey: assetKeys.backgroundWalkingStreet,
    ambientNpcs: [
      { id: 'soi-six-ruby', x: 635, y: 594, flipX: false, action: 'cheer' },
      { id: 'soi-six-nina', x: 830, y: 606, flipX: true, action: 'idle' },
      { id: 'npc-girl-denim', x: 500, y: 600, flipX: true, action: 'idle' },
      { id: 'npc-girl-silver', x: 1050, y: 595, flipX: false, action: 'idle' }
    ],
    enemyStarts: [
      { id: 'street-punk', x: 1150, y: 590, engageDelay: 0 },
      { id: 'scooter-punk', x: 1370, y: 624, engageDelay: 1.4 },
      { id: 'rival-artist', x: 1640, y: 580, engageDelay: 3.1 },
      { id: 'corrupt-bouncer', x: 1870, y: 606, engageDelay: 5.2 }
    ],
    props: [
      neon(520, 360), sign(700, 664, true), scooter(980, 660, false),
      cone(1215, 654), bin(1430, 660), scooter(1560, 658, true, true), chair(1760, 662), plant(2050, 666, 0.38)
    ]
  },
  {
    id: 'soi-buakhao-back-row',
    title: 'Soi Buakhao Back Row',
    briefing: 'Back-row scooters and late-night repair stalls. Keep moving through the soi.',
    exitLabel: 'SOI',
    clearTitle: 'SOI CLEAR',
    theme: { accent: 0xffca3a, haze: 0x2b1907, signText: 'SOI BUAKHAO', signColor: 0xffca3a },
    playerStart: { x: 450, y: 600 },
    vendor: { id: 'scooter-mechanic', x: 1030, y: 596, flipX: true },
    exit: { x: 2050, y: 560 },
    backgroundKey: assetKeys.backgroundSoiBuakhao,
    ambientNpcs: [
      { id: 'soi-six-nina', x: 630, y: 604, flipX: true, action: 'talk' },
      { id: 'npc-girl-red', x: 850, y: 600, flipX: false, action: 'idle' },
      { id: 'npc-girl-silver', x: 1250, y: 605, flipX: true, action: 'idle' }
    ],
    enemyStarts: [
      { id: 'scooter-punk', x: 1175, y: 588, engageDelay: 0 },
      { id: 'street-punk', x: 1395, y: 625, engageDelay: 1.6 },
      { id: 'scooter-punk', x: 1610, y: 602, engageDelay: 3.2 },
      { id: 'rival-artist', x: 1860, y: 575, engageDelay: 5.4 }
    ],
    props: [
      cone(540, 654), bin(760, 660), scooter(920, 660, true), scooter(1230, 660, false, true),
      chair(1460, 660), plant(1680, 666), sign(1870, 666), ink(2020, 654)
    ]
  },
  {
    id: 'indian-lounge-block',
    title: 'Indian Lounge Block',
    briefing: 'Lounge row is packed with loud shirts, bare feet, and stubborn door crews.',
    exitLabel: 'LOUNGE',
    clearTitle: 'LOUNGE CLEAR',
    theme: { accent: 0x75ff43, haze: 0x082816, signText: 'INDIAN LOUNGE', signColor: 0x75ff43 },
    playerStart: { x: 430, y: 590 },
    vendor: { id: 'street-food-vendor', x: 1040, y: 575, flipX: true },
    exit: { x: 2040, y: 560 },
    ambientNpcs: [
      { id: 'soi-six-ruby', x: 650, y: 602, flipX: false, action: 'idle' },
      { id: 'soi-six-nina', x: 860, y: 620, flipX: true, action: 'cheer' },
      { id: 'npc-girl-black', x: 550, y: 600, flipX: false, action: 'idle' },
      { id: 'npc-girl-denim', x: 950, y: 605, flipX: true, action: 'idle' }
    ],
    enemyStarts: [
      { id: 'corrupt-bouncer', x: 1160, y: 590, engageDelay: 0 },
      { id: 'street-punk', x: 1390, y: 618, engageDelay: 1.8 },
      { id: 'rival-artist', x: 1620, y: 582, engageDelay: 3.8 },
      { id: 'corrupt-bouncer', x: 1880, y: 612, engageDelay: 6.2 }
    ],
    props: [
      neon(420, 370), sign(610, 666, true), chair(810, 660), plant(990, 666, 0.46),
      cart(1210, 648), bin(1500, 660), scooter(1730, 660, true), ink(1940, 654), plant(2110, 666)
    ]
  },
  {
    id: 'night-market-spillover',
    title: 'Night Market Spillover',
    briefing: 'Food carts, plastic chairs, and market clutter turn every slap into chaos.',
    exitLabel: 'MARKET',
    clearTitle: 'MARKET CLEAR',
    theme: { accent: 0x00dfff, haze: 0x0c2430, signText: 'NIGHT MARKET', signColor: 0x00dfff },
    playerStart: { x: 460, y: 604 },
    vendor: { id: 'street-food-vendor', x: 920, y: 590, flipX: true },
    exit: { x: 2050, y: 560 },
    ambientNpcs: [
      { id: 'soi-six-nina', x: 650, y: 594, flipX: false, action: 'idle' },
      { id: 'soi-six-ruby', x: 790, y: 604, flipX: true, action: 'talk' },
      { id: 'npc-girl-silver', x: 500, y: 600, flipX: false, action: 'idle' },
      { id: 'npc-girl-red', x: 1150, y: 605, flipX: true, action: 'idle' }
    ],
    enemyStarts: [
      { id: 'street-punk', x: 1080, y: 620, engageDelay: 0 },
      { id: 'rival-artist', x: 1300, y: 585, engageDelay: 1.2 },
      { id: 'scooter-punk', x: 1515, y: 615, engageDelay: 2.8 },
      { id: 'corrupt-bouncer', x: 1785, y: 580, engageDelay: 5.0 }
    ],
    props: [
      cart(700, 648), chair(925, 660), chair(1030, 660), cone(1190, 654), bin(1375, 660),
      cart(1570, 648), plant(1800, 666), sign(1985, 666, true), ink(2120, 654)
    ]
  },
  {
    id: 'beach-road-scooter-strip',
    title: 'Beach Road Scooter Strip',
    briefing: 'Beach Road traffic is jammed with scooters. Smash through and reach the strip.',
    exitLabel: 'BEACH',
    clearTitle: 'STRIP CLEAR',
    theme: { accent: 0xa02cff, haze: 0x1c1633, signText: 'BEACH ROAD', signColor: 0xa02cff },
    playerStart: { x: 440, y: 592 },
    vendor: { id: 'weed-vendor', x: 970, y: 584, flipX: true },
    exit: { x: 2035, y: 560 },
    backgroundKey: assetKeys.backgroundBeachRoad,
    ambientNpcs: [
      { id: 'soi-six-ruby', x: 620, y: 606, flipX: true, action: 'cheer' }
    ],
    enemyStarts: [
      { id: 'scooter-punk', x: 1110, y: 588, engageDelay: 0 },
      { id: 'scooter-punk', x: 1340, y: 624, engageDelay: 1.5 },
      { id: 'street-punk', x: 1580, y: 592, engageDelay: 3.2 },
      { id: 'corrupt-bouncer', x: 1850, y: 610, engageDelay: 5.8 }
    ],
    props: [
      scooter(700, 660, false), scooter(910, 660, true, true), cone(1125, 654), scooter(1320, 660, false, true),
      bin(1510, 660), scooter(1700, 660, true), sign(1905, 666), plant(2100, 666, 0.4)
    ]
  }
];

export function getLevelDefinition(id: string | undefined): LevelDefinition {
  return levels.find((level) => level.id === id) ?? levels[0];
}

export function getNextLevelId(id: string): string | undefined {
  const index = levels.findIndex((level) => level.id === id);
  return index >= 0 ? levels[index + 1]?.id : undefined;
}

export function getLevelProgress(id: string) {
  const index = levels.findIndex((level) => level.id === id);
  return {
    index: index >= 0 ? index + 1 : 1,
    total: levels.length
  };
}
