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
  ambientBehavior?: 'sidewalk-idle' | 'soi-six-runner';
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
    id: 'pattaya-walking-street',
    title: 'Pattaya Walking Street',
    briefing: 'Start under the Walking Street sign, clear the neon strip, and push toward Beach Road.',
    exitLabel: 'PATTAYA',
    clearTitle: 'WALKING STREET CLEAR',
    theme: { accent: 0x00dfff, haze: 0x1b0f2d, signText: 'PATTAYA WALKING STREET', signColor: 0xef2b2d },
    playerStart: { x: 520, y: 634 },
    vendor: { id: 'weed-vendor', x: 1095, y: 570, flipX: true },
    exit: { x: 2075, y: 628 },
    ambientNpcs: [
      { id: 'soi-six-nina', x: 285, y: 598, flipX: false, action: 'idle' },
      { id: 'soi-six-ruby', x: 785, y: 606, flipX: true, action: 'talk' },
      { id: 'npc-girl-red', x: 450, y: 595, flipX: false, action: 'idle' },
      { id: 'npc-girl-black', x: 950, y: 600, flipX: true, action: 'idle' }
    ],
    enemyStarts: [
      { id: 'indian-fighter-maroon', x: 1325, y: 626, engageDelay: 0 },
      { id: 'indian-fighter-maroon', x: 1510, y: 654, engageDelay: 2.4 },
      { id: 'indian-fighter-maroon', x: 1740, y: 618, engageDelay: 4.8 }
    ],
    props: [
      plant(460, 660), cone(690, 654), cart(870, 648),
      scooter(1180, 660, false, true), sign(360, 666), bin(1390, 658),
      scooter(1660, 658, true), sign(1820, 666, true), ink(1980, 654), plant(2080, 666, 0.42), chair(1305, 660)
    ]
  },
  {
    id: 'pattaya-soi-six',
    title: 'Pattaya Soi Six',
    briefing: 'Neon barfronts press close on the lane. Keep moving while the sidewalk girls dart in and back.',
    exitLabel: 'SOI 6',
    clearTitle: 'SOI SIX CLEAR',
    theme: { accent: 0xff2e9a, haze: 0x281026, signText: 'PATTAYA SOI 6', signColor: 0xff2e9a },
    playerStart: { x: 455, y: 634 },
    vendor: { id: 'bar-promoter', x: 920, y: 586, flipX: true },
    exit: { x: 2050, y: 628 },
    backgroundKey: assetKeys.backgroundSoiBuakhao,
    ambientBehavior: 'soi-six-runner',
    ambientNpcs: [
      { id: 'soi-six-ruby', x: 350, y: 586, flipX: false, action: 'idle' },
      { id: 'soi-six-nina', x: 620, y: 580, flipX: true, action: 'talk' },
      { id: 'npc-girl-red', x: 920, y: 588, flipX: false, action: 'idle' },
      { id: 'npc-girl-black', x: 1220, y: 574, flipX: true, action: 'cheer' },
      { id: 'npc-girl-denim', x: 1530, y: 592, flipX: false, action: 'idle' },
      { id: 'npc-girl-silver', x: 1810, y: 578, flipX: true, action: 'talk' }
    ],
    enemyStarts: [
      { id: 'indian-fighter-maroon', x: 1110, y: 620, engageDelay: 0 },
      { id: 'indian-fighter-maroon', x: 1375, y: 652, engageDelay: 1.4 },
      { id: 'indian-fighter-maroon', x: 1640, y: 624, engageDelay: 3.0 },
      { id: 'indian-fighter-maroon', x: 1885, y: 648, engageDelay: 4.8 }
    ],
    props: [
      sign(585, 666), chair(735, 662), plant(850, 666, 0.36), cone(1035, 654),
      scooter(1260, 660, true, true), bin(1460, 660), cart(1660, 648), ink(1905, 654), sign(2090, 666, true)
    ]
  },
  {
    id: 'bangkok-sukhumvit',
    title: 'Bangkok Sukhumvit',
    briefing: 'Sukhumvit glows under the rail line. Break through the rush before midnight.',
    exitLabel: 'BANGKOK',
    clearTitle: 'SUKHUMVIT CLEAR',
    theme: { accent: 0xff2e9a, haze: 0x241035, signText: 'BANGKOK SUKHUMVIT', signColor: 0xff2e9a },
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
      { id: 'indian-fighter-maroon', x: 1150, y: 590, engageDelay: 0 },
      { id: 'indian-fighter-maroon', x: 1370, y: 624, engageDelay: 1.4 },
      { id: 'indian-fighter-maroon', x: 1640, y: 580, engageDelay: 3.1 },
      { id: 'indian-fighter-maroon', x: 1870, y: 606, engageDelay: 5.2 }
    ],
    props: [
      sign(700, 664, true), scooter(980, 660, false),
      cone(1215, 654), bin(1430, 660), scooter(1560, 658, true, true), chair(1760, 662), plant(2050, 666, 0.38)
    ]
  },
  {
    id: 'phuket-bangla-road',
    title: 'Phuket Bangla Road',
    briefing: 'Bangla Road is packed shoulder to shoulder. Cut a path toward Patong lights.',
    exitLabel: 'PHUKET',
    clearTitle: 'BANGLA CLEAR',
    theme: { accent: 0xffca3a, haze: 0x2b1907, signText: 'PHUKET BANGLA', signColor: 0xffca3a },
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
      { id: 'indian-fighter-maroon', x: 1175, y: 588, engageDelay: 0 },
      { id: 'indian-fighter-maroon', x: 1395, y: 625, engageDelay: 1.6 },
      { id: 'indian-fighter-maroon', x: 1610, y: 602, engageDelay: 3.2 },
      { id: 'indian-fighter-maroon', x: 1860, y: 575, engageDelay: 5.4 }
    ],
    props: [
      cone(540, 654), bin(760, 660), scooter(920, 660, true), scooter(1230, 660, false, true),
      chair(1460, 660), plant(1680, 666), sign(1870, 666), ink(2020, 654)
    ]
  },
  {
    id: 'chiang-mai-nimman',
    title: 'Chiang Mai Nimman',
    briefing: 'Nimman after dark mixes scooter rows, cafe signs, and crews guarding the lane.',
    exitLabel: 'CHIANG MAI',
    clearTitle: 'NIMMAN CLEAR',
    theme: { accent: 0x75ff43, haze: 0x082816, signText: 'CHIANG MAI NIMMAN', signColor: 0x75ff43 },
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
      { id: 'indian-fighter-maroon', x: 1160, y: 590, engageDelay: 0 },
      { id: 'indian-fighter-maroon', x: 1390, y: 618, engageDelay: 1.8 },
      { id: 'indian-fighter-maroon', x: 1620, y: 582, engageDelay: 3.8 },
      { id: 'indian-fighter-maroon', x: 1880, y: 612, engageDelay: 6.2 }
    ],
    props: [
      sign(610, 666, true), chair(810, 660), plant(990, 666, 0.46),
      cart(1210, 648), bin(1500, 660), scooter(1730, 660, true), ink(1940, 654), plant(2110, 666)
    ]
  },
  {
    id: 'krabi-ao-nang',
    title: 'Krabi Ao Nang',
    briefing: 'Ao Nang market spillover blocks the beach road. Clear the carts and keep moving.',
    exitLabel: 'KRABI',
    clearTitle: 'AO NANG CLEAR',
    theme: { accent: 0x00dfff, haze: 0x0c2430, signText: 'KRABI AO NANG', signColor: 0x00dfff },
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
      { id: 'indian-fighter-maroon', x: 1080, y: 620, engageDelay: 0 },
      { id: 'indian-fighter-maroon', x: 1300, y: 585, engageDelay: 1.2 },
      { id: 'indian-fighter-maroon', x: 1515, y: 615, engageDelay: 2.8 },
      { id: 'indian-fighter-maroon', x: 1785, y: 580, engageDelay: 5.0 }
    ],
    props: [
      cart(700, 648), chair(925, 660), chair(1030, 660), cone(1190, 654), bin(1375, 660),
      cart(1570, 648), plant(1800, 666), sign(1985, 666, true), ink(2120, 654)
    ]
  },
  {
    id: 'koh-samui-chaweng',
    title: 'Koh Samui Chaweng',
    briefing: 'Chaweng Beach Road is jammed with scooters. Smash through and reach the strip.',
    exitLabel: 'SAMUI',
    clearTitle: 'CHAWENG CLEAR',
    theme: { accent: 0xa02cff, haze: 0x1c1633, signText: 'KOH SAMUI CHAWENG', signColor: 0xa02cff },
    playerStart: { x: 440, y: 592 },
    vendor: { id: 'weed-vendor', x: 970, y: 584, flipX: true },
    exit: { x: 2035, y: 560 },
    backgroundKey: assetKeys.backgroundBeachRoad,
    ambientNpcs: [
      { id: 'soi-six-ruby', x: 620, y: 606, flipX: true, action: 'cheer' }
    ],
    enemyStarts: [
      { id: 'indian-fighter-maroon', x: 1110, y: 588, engageDelay: 0 },
      { id: 'indian-fighter-maroon', x: 1340, y: 624, engageDelay: 1.5 },
      { id: 'indian-fighter-maroon', x: 1580, y: 592, engageDelay: 3.2 },
      { id: 'indian-fighter-maroon', x: 1850, y: 610, engageDelay: 5.8 }
    ],
    props: [
      scooter(700, 660, false), scooter(910, 660, true, true), cone(1125, 654), scooter(1320, 660, false, true),
      bin(1510, 660), scooter(1700, 660, true), sign(1905, 666), plant(2100, 666, 0.4)
    ]
  },
  {
    id: 'hua-hin-night-market',
    title: 'Hua Hin Night Market',
    briefing: 'Hua Hin night stalls leave no room to dodge. Knock the trouble out past the carts.',
    exitLabel: 'HUA HIN',
    clearTitle: 'HUA HIN CLEAR',
    theme: { accent: 0xff7a2f, haze: 0x2a1208, signText: 'HUA HIN NIGHT MARKET', signColor: 0xff7a2f },
    playerStart: { x: 455, y: 602 },
    vendor: { id: 'street-food-vendor', x: 990, y: 590, flipX: true },
    exit: { x: 2045, y: 560 },
    backgroundKey: assetKeys.backgroundSoiBuakhao,
    ambientNpcs: [
      { id: 'npc-girl-denim', x: 610, y: 600, flipX: false, action: 'idle' },
      { id: 'soi-six-ruby', x: 830, y: 604, flipX: true, action: 'talk' },
      { id: 'npc-girl-black', x: 1180, y: 600, flipX: true, action: 'idle' }
    ],
    enemyStarts: [
      { id: 'indian-fighter-maroon', x: 1120, y: 590, engageDelay: 0 },
      { id: 'indian-fighter-maroon', x: 1365, y: 618, engageDelay: 1.7 },
      { id: 'indian-fighter-maroon', x: 1595, y: 586, engageDelay: 3.5 },
      { id: 'indian-fighter-maroon', x: 1840, y: 612, engageDelay: 5.7 }
    ],
    props: [
      cart(650, 648), cone(880, 654), chair(1050, 660), bin(1260, 660),
      cart(1460, 648), plant(1690, 666, 0.44), sign(1885, 666, true), ink(2070, 654)
    ]
  },
  {
    id: 'ayutthaya-riverside',
    title: 'Ayutthaya Riverside',
    briefing: 'Riverside lanes tighten near the old city. Hold the line and reach the pier.',
    exitLabel: 'AYUTTHAYA',
    clearTitle: 'RIVERSIDE CLEAR',
    theme: { accent: 0x8cf0ff, haze: 0x0b2332, signText: 'AYUTTHAYA RIVERSIDE', signColor: 0x8cf0ff },
    playerStart: { x: 435, y: 592 },
    vendor: { id: 'thai-tattoo-artist', x: 1010, y: 584, flipX: true },
    exit: { x: 2030, y: 560 },
    backgroundKey: assetKeys.backgroundBeachRoad,
    ambientNpcs: [
      { id: 'npc-girl-silver', x: 590, y: 600, flipX: true, action: 'idle' },
      { id: 'soi-six-nina', x: 790, y: 604, flipX: false, action: 'talk' },
      { id: 'npc-girl-red', x: 1110, y: 596, flipX: true, action: 'idle' }
    ],
    enemyStarts: [
      { id: 'indian-fighter-maroon', x: 1100, y: 588, engageDelay: 0 },
      { id: 'indian-fighter-maroon', x: 1340, y: 624, engageDelay: 1.4 },
      { id: 'indian-fighter-maroon', x: 1580, y: 592, engageDelay: 3.4 },
      { id: 'indian-fighter-maroon', x: 1835, y: 610, engageDelay: 5.6 }
    ],
    props: [
      plant(610, 666, 0.42), sign(780, 666), scooter(960, 660, false, true), cone(1190, 654),
      bin(1390, 660), scooter(1620, 660, true), chair(1840, 660), plant(2060, 666)
    ]
  },
  {
    id: 'koh-phangan-haad-rin',
    title: 'Koh Phangan Haad Rin',
    briefing: 'Haad Rin is all bass, beach dust, and last-wave challengers under the signs.',
    exitLabel: 'PHANGAN',
    clearTitle: 'HAAD RIN CLEAR',
    theme: { accent: 0xd7ff4a, haze: 0x17260a, signText: 'KOH PHANGAN HAAD RIN', signColor: 0xd7ff4a },
    playerStart: { x: 450, y: 596 },
    vendor: { id: 'bar-promoter', x: 940, y: 586, flipX: true },
    exit: { x: 2050, y: 560 },
    backgroundKey: assetKeys.backgroundWalkingStreet,
    ambientNpcs: [
      { id: 'soi-six-ruby', x: 620, y: 604, flipX: false, action: 'cheer' },
      { id: 'soi-six-nina', x: 820, y: 606, flipX: true, action: 'cheer' },
      { id: 'npc-girl-black', x: 1080, y: 600, flipX: false, action: 'idle' }
    ],
    enemyStarts: [
      { id: 'indian-fighter-maroon', x: 1125, y: 590, engageDelay: 0 },
      { id: 'indian-fighter-maroon', x: 1360, y: 624, engageDelay: 1.5 },
      { id: 'indian-fighter-maroon', x: 1610, y: 580, engageDelay: 3.3 },
      { id: 'indian-fighter-maroon', x: 1880, y: 606, engageDelay: 5.4 }
    ],
    props: [
      sign(690, 664, true), scooter(930, 660, false), cone(1160, 654), bin(1360, 660),
      scooter(1585, 658, true, true), chair(1780, 662), plant(1970, 666, 0.38), ink(2120, 654)
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
