import Phaser from 'phaser';
import { playCharacterAnimation } from '../../game/assets/loaders';
import { assetKeys } from '../../game/assets/manifest';
import { getCharacter, getCharactersByRole, getPlayerCharacter, hasAnimation, type CharacterDefinition, type PlayerId } from '../../game/content/characters';
import { getLevelDefinition, getLevelProgress, getNextLevelId, type LevelDefinition, type PickupKind } from '../../game/content/levels';
import { clearMomentaryActions, touchState } from '../../game/input/actions';
import { createSessionState, type GameSessionState, type HudSnapshot } from '../../game/simulation/state';
import { createCharacterSprite, type ArcadeCharacterSprite } from '../factories/characterFactory';
import { HitStopManager } from '../systems/HitStopManager';
import { PlayerController } from '../entities/PlayerController';
import { EnemyController } from '../entities/EnemyController';
import { CompanionController } from '../entities/CompanionController';
import { type HitboxProfile, getHurtboxProfile } from '../../game/content/combatProfiles';
import {
  WORLD_WIDTH, WORLD_HEIGHT, AMBIENT_SIDEWALK_TOP, AMBIENT_SIDEWALK_BOTTOM, LANE_TOP, LANE_BOTTOM, LARGE_PROP_DEPTH, KEY_CAPTURE,
  SOI_DOG_ID, SOI_DOG_BUTTON_PORTRAIT, SOI_DOG_FOLLOW_OFFSET_X, SOI_DOG_FOLLOW_OFFSET_Y,
  SOI_DOG_SPECIAL_COOLDOWN_SECONDS, PICKUP_COLLECT_DISTANCE, PLAYER_DODGE_COOLDOWN_SECONDS, KNOCKBACK_COAST_SECONDS
} from '../../game/constants';

type DestructibleProp = {
  sprite: Phaser.GameObjects.Image;
  hitbox: Phaser.Geom.Rectangle;
  hp: number;
  fxKey: string;
  dropKind: PickupKind;
  active: boolean;
  occludes: boolean;
};

type Pickup = {
  sprite: Phaser.GameObjects.Image;
  kind: PickupKind;
  value: number;
  lifetime: number;
  collected: boolean;
};

type AmbientNpc = {
  sprite: ArcadeCharacterSprite;
  characterId: string;
  action: string;
  idleAction: string;
  personality: AmbientPersonality;
  idleTimeScale: number;
  motionTimeScale: number;
  homeX: number;
  homeY: number;
  runnerState: 'idle' | 'stroll' | 'approach' | 'linger' | 'return';
  motion: 'walk' | 'run';
  returnMotion: 'walk' | 'run';
  runBackAfterTouch: boolean;
  nextActionAt: number;
  nextGestureAt: number;
  gestureUntil: number;
  targetX: number;
  targetY: number;
  speed: number;
  stripBeginTimer?: Phaser.Time.TimerEvent;
  stripHoldTimer?: Phaser.Time.TimerEvent;
};

type AmbientPersonality = {
  idleActions: string[];
  calloutActions: string[];
  runChance: number;
  returnRunChance: number;
  runBackChance: number;
  approachDelayMs: [number, number];
  restDelayMs: [number, number];
  gestureDelayMs: [number, number];
  gestureDurationMs: [number, number];
  lingerMs: [number, number];
  touchLingerMs: [number, number];
  targetOffsetX: [number, number];
  targetOffsetY: [number, number];
  walkSpeed: [number, number];
  runSpeed: [number, number];
  idleTimeScale: [number, number];
  walkTimeScale: [number, number];
  runTimeScale: [number, number];
};

type FeetCheckDetail = {
  name: string;
  title: string;
  subtitle: string;
  faceImage: string;
  faceFrames?: number;
  faceFrameWidth?: number;
  faceFrameHeight?: number;
  faceFps?: number;
  stripImage: string;
  frames: number;
  frameWidth?: number;
  frameHeight?: number;
  fps: number;
};

const AMBIENT_GIRL_MOTION_SCALE = 0.62;
const AMBIENT_GIRL_ANIM_SCALE = 0.56;
const AMBIENT_GIRL_STRIP_TIME_SCALE_MIN = 0.24;
const AMBIENT_GIRL_STRIP_TIME_SCALE_MAX = 0.38;
const AMBIENT_GIRL_TTS_MIN = 0.14;
const AMBIENT_GIRL_VISUAL_SCALE = 1.25;
const SOI_SIX_AMBIENT_MIN = 4;
const SOI_SIX_AMBIENT_MAX = 5;
const SOI_SIX_MAX_ACTIVE_MOVERS = 1;
const SOI_SIX_MAX_ACTIVE_GESTURES = 1;

const DEFAULT_AMBIENT_PERSONALITY: AmbientPersonality = {
  idleActions: ['idle', 'talk'],
  calloutActions: ['talk', 'cheer'],
  runChance: 0.38,
  returnRunChance: 0.48,
  runBackChance: 0.46,
  approachDelayMs: [2800, 7600],
  restDelayMs: [5200, 9800],
  gestureDelayMs: [1200, 2800],
  gestureDurationMs: [900, 1600],
  lingerMs: [720, 1180],
  touchLingerMs: [190, 430],
  targetOffsetX: [56, 82],
  targetOffsetY: [-24, -10],
  walkSpeed: [138, 186],
  runSpeed: [268, 334],
  idleTimeScale: [0.78, 1.0],
  walkTimeScale: [0.88, 1.08],
  runTimeScale: [1.28, 1.56]
};

const AMBIENT_PERSONALITIES: Record<string, AmbientPersonality> = {
  'soi-six-ruby': {
    ...DEFAULT_AMBIENT_PERSONALITY,
    idleActions: ['idle', 'cheer', 'talk'],
    calloutActions: ['cheer', 'talk'],
    runChance: 0.04,
    returnRunChance: 0.05,
    runBackChance: 0.08,
    approachDelayMs: [7600, 13600],
    restDelayMs: [8200, 14800],
    gestureDelayMs: [3200, 7200],
    gestureDurationMs: [1300, 2300],
    lingerMs: [1400, 2500],
    touchLingerMs: [700, 1180],
    targetOffsetX: [54, 80],
    targetOffsetY: [-10, 4],
    walkSpeed: [58, 88],
    runSpeed: [138, 180],
    idleTimeScale: [0.68, 0.88],
    walkTimeScale: [0.58, 0.78],
    runTimeScale: [0.8, 1.0]
  },
  'soi-six-hd-dao': {
    ...DEFAULT_AMBIENT_PERSONALITY,
    idleActions: ['idle', 'talk', 'cheer'],
    calloutActions: ['cheer', 'talk'],
    runChance: 0.05,
    returnRunChance: 0.04,
    runBackChance: 0.06,
    approachDelayMs: [7800, 13800],
    restDelayMs: [8200, 14800],
    gestureDelayMs: [3200, 7200],
    gestureDurationMs: [1300, 2400],
    touchLingerMs: [700, 1200],
    targetOffsetX: [54, 82],
    targetOffsetY: [-10, 4],
    walkSpeed: [62, 92],
    runSpeed: [150, 190],
    idleTimeScale: [0.68, 0.88],
    walkTimeScale: [0.58, 0.78],
    runTimeScale: [0.82, 1.02]
  },
  'soi-six-hd-kanda': {
    ...DEFAULT_AMBIENT_PERSONALITY,
    idleActions: ['idle', 'talk'],
    calloutActions: ['talk', 'cheer'],
    runChance: 0.02,
    returnRunChance: 0.02,
    runBackChance: 0.04,
    approachDelayMs: [9200, 16200],
    restDelayMs: [9600, 16800],
    gestureDelayMs: [4200, 8200],
    gestureDurationMs: [1500, 2800],
    lingerMs: [1800, 3200],
    touchLingerMs: [900, 1400],
    targetOffsetX: [74, 112],
    walkSpeed: [50, 78],
    runSpeed: [130, 172],
    idleTimeScale: [0.58, 0.78],
    walkTimeScale: [0.52, 0.7],
    runTimeScale: [0.74, 0.94]
  },
  'soi-six-hd-mintra': {
    ...DEFAULT_AMBIENT_PERSONALITY,
    idleActions: ['idle', 'cheer', 'talk'],
    calloutActions: ['cheer', 'talk'],
    runChance: 0.04,
    returnRunChance: 0.04,
    runBackChance: 0.06,
    approachDelayMs: [7200, 13200],
    restDelayMs: [7800, 14200],
    gestureDelayMs: [3000, 6800],
    gestureDurationMs: [1300, 2500],
    lingerMs: [1500, 2600],
    touchLingerMs: [720, 1200],
    targetOffsetX: [56, 84],
    walkSpeed: [58, 88],
    runSpeed: [148, 188],
    idleTimeScale: [0.66, 0.86],
    walkTimeScale: [0.56, 0.76],
    runTimeScale: [0.8, 1.0]
  },
  'soi-six-hd-ploy': {
    ...DEFAULT_AMBIENT_PERSONALITY,
    idleActions: ['idle', 'cheer', 'talk'],
    calloutActions: ['cheer', 'talk'],
    runChance: 0.03,
    returnRunChance: 0.03,
    runBackChance: 0.05,
    approachDelayMs: [8200, 14800],
    restDelayMs: [8800, 15400],
    gestureDelayMs: [3400, 7200],
    gestureDurationMs: [1300, 2600],
    lingerMs: [1600, 2800],
    touchLingerMs: [760, 1280],
    targetOffsetX: [60, 90],
    walkSpeed: [56, 84],
    runSpeed: [140, 182],
    idleTimeScale: [0.64, 0.84],
    walkTimeScale: [0.54, 0.74],
    runTimeScale: [0.78, 0.98]
  },
  'soi-six-hd-mew': {
    ...DEFAULT_AMBIENT_PERSONALITY,
    idleActions: ['idle', 'talk', 'cheer'],
    calloutActions: ['cheer', 'talk'],
    runChance: 0.05,
    returnRunChance: 0.04,
    runBackChance: 0.06,
    approachDelayMs: [7600, 13600],
    restDelayMs: [8200, 14600],
    gestureDelayMs: [3000, 6800],
    gestureDurationMs: [1300, 2400],
    touchLingerMs: [700, 1180],
    targetOffsetX: [50, 76],
    targetOffsetY: [-10, 4],
    walkSpeed: [60, 90],
    runSpeed: [150, 190],
    idleTimeScale: [0.66, 0.86],
    walkTimeScale: [0.58, 0.78],
    runTimeScale: [0.82, 1.02]
  },
  'soi-six-thai-lada': {
    ...DEFAULT_AMBIENT_PERSONALITY,
    idleActions: ['idle', 'talk'],
    calloutActions: ['talk', 'cheer'],
    runChance: 0.64,
    returnRunChance: 0.72,
    runBackChance: 0.78,
    approachDelayMs: [1500, 4200],
    restDelayMs: [3600, 6800],
    targetOffsetX: [44, 62],
    targetOffsetY: [-18, -6],
    walkSpeed: [164, 214],
    runSpeed: [320, 392],
    idleTimeScale: [0.96, 1.14],
    runTimeScale: [1.45, 1.82]
  },
  'soi-six-thai-mali': {
    ...DEFAULT_AMBIENT_PERSONALITY,
    idleActions: ['idle', 'cheer'],
    calloutActions: ['cheer', 'talk'],
    runChance: 0.48,
    returnRunChance: 0.62,
    runBackChance: 0.56,
    approachDelayMs: [2400, 6200],
    restDelayMs: [4500, 8800],
    gestureDurationMs: [1150, 1900],
    lingerMs: [860, 1380],
    targetOffsetX: [62, 92],
    walkSpeed: [150, 204],
    runSpeed: [284, 352],
    idleTimeScale: [0.82, 1.02],
    runTimeScale: [1.28, 1.58]
  },
  'soi-six-nina': {
    ...DEFAULT_AMBIENT_PERSONALITY,
    idleActions: ['idle', 'talk'],
    calloutActions: ['talk'],
    runChance: 0.18,
    returnRunChance: 0.28,
    runBackChance: 0.22,
    approachDelayMs: [4400, 9400],
    restDelayMs: [6800, 12000],
    lingerMs: [1000, 1700],
    targetOffsetX: [76, 112],
    walkSpeed: [118, 156],
    runSpeed: [230, 286],
    idleTimeScale: [0.68, 0.88],
    walkTimeScale: [0.74, 0.94]
  },
  'npc-girl-black': {
    ...DEFAULT_AMBIENT_PERSONALITY,
    idleActions: ['idle', 'cheer'],
    calloutActions: ['cheer', 'talk'],
    runChance: 0.52,
    returnRunChance: 0.5,
    runBackChance: 0.44,
    approachDelayMs: [2200, 5800],
    restDelayMs: [4200, 8400],
    lingerMs: [940, 1520],
    targetOffsetX: [58, 84],
    walkSpeed: [148, 198],
    runSpeed: [288, 354],
    idleTimeScale: [0.86, 1.08]
  },
  'npc-girl-denim': {
    ...DEFAULT_AMBIENT_PERSONALITY,
    idleActions: ['talk', 'cheer', 'idle'],
    calloutActions: ['talk', 'cheer'],
    runChance: 0.34,
    returnRunChance: 0.58,
    runBackChance: 0.66,
    approachDelayMs: [3000, 7200],
    restDelayMs: [5200, 9400],
    targetOffsetX: [70, 102],
    walkSpeed: [136, 178],
    runSpeed: [272, 330],
    idleTimeScale: [0.78, 0.98],
    walkTimeScale: [0.8, 1.02]
  },
  'npc-girl-silver': {
    ...DEFAULT_AMBIENT_PERSONALITY,
    idleActions: ['idle', 'talk'],
    calloutActions: ['talk'],
    runChance: 0.22,
    returnRunChance: 0.36,
    runBackChance: 0.3,
    approachDelayMs: [3800, 8800],
    restDelayMs: [6200, 11000],
    gestureDurationMs: [1250, 2100],
    lingerMs: [1100, 1800],
    targetOffsetX: [82, 118],
    walkSpeed: [116, 152],
    runSpeed: [238, 296],
    idleTimeScale: [0.64, 0.86],
    walkTimeScale: [0.72, 0.92]
  }
};

const REJECTED_AMBIENT_GIRL_IDS = new Set(['soi-six-thai-pim', 'npc-girl-red']);

type KeyboardControls = {
  left: Phaser.Input.Keyboard.Key[];
  right: Phaser.Input.Keyboard.Key[];
  up: Phaser.Input.Keyboard.Key[];
  down: Phaser.Input.Keyboard.Key[];
  attack: Phaser.Input.Keyboard.Key[];
  dodge: Phaser.Input.Keyboard.Key[];
  companionAttack: Phaser.Input.Keyboard.Key[];
  feetCheck: Phaser.Input.Keyboard.Key[];
  jump: Phaser.Input.Keyboard.Key[];
  super: Phaser.Input.Keyboard.Key[];
  pause: Phaser.Input.Keyboard.Key[];
  restart: Phaser.Input.Keyboard.Key[];
  menu: Phaser.Input.Keyboard.Key[];
};

export class Level1Scene extends Phaser.Scene {
  playerController!: PlayerController;
  level!: LevelDefinition;
  state!: GameSessionState;
  enemies: EnemyController[] = [];
  ambientNpcs: AmbientNpc[] = [];
  destructibleProps: DestructibleProp[] = [];
  pickups: Pickup[] = [];
  companion?: CompanionController;
  
  hitStopManager!: HitStopManager;
  winText?: Phaser.GameObjects.Container;
  koText?: Phaser.GameObjects.Container;
  pauseOverlay?: Phaser.GameObjects.Container;
  levelIntro?: Phaser.GameObjects.Container;
  exitGlow?: Phaser.GameObjects.Graphics;
  debugHitboxes = false;
  keyboardControls?: KeyboardControls;
  restartingLevel = false;
  leavingLevel = false;
  feetCheckActive = false;
  feetCheckNpc?: AmbientNpc;
  feetCheckExitHandler?: () => void;
  playerDefeatedPose = false;
  playerVictoryPose = false;
  playerShadow?: Phaser.GameObjects.Image;
  exitPortal?: Phaser.GameObjects.Container;
  exitLabel?: Phaser.GameObjects.Text;

  constructor() {
    super('Level1Scene');
  }

  create() {
    this.hitStopManager = new HitStopManager(this);
    this.resetRuntimeFields();
    this.restartingLevel = false;
    this.leavingLevel = false;
    this.debugHitboxes = new URLSearchParams(window.location.search).has('debugHitboxes');
    this.level = getLevelDefinition(this.registry.get('selectedLevel'));
    this.registry.set('selectedLevel', this.level.id);
    window.dispatchEvent(new CustomEvent('slap:hud-reset'));

    const worldWidth = this.getResponsiveWorldWidth();
    const worldHeight = this.getResponsiveWorldHeight();
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setZoom(this.getResponsiveCameraZoom());
    this.cameras.main.setBackgroundColor('#07080c');
    this.cameras.main.setRoundPixels(true);
    this.input.setTopOnly(true);
    this.createKeyboardControls();
    this.feetCheckExitHandler = () => this.closeFeetCheck();
    window.addEventListener('slap:feet-check-exit', this.feetCheckExitHandler);

    this.createWorld();
    this.createActors();

    this.cameras.main.startFollow(this.playerController.sprite, true, 0.09, 0.08, 0, 56);
    this.showLevelIntro();
    this.sendHud();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.feetCheckExitHandler) {
        window.removeEventListener('slap:feet-check-exit', this.feetCheckExitHandler);
        this.feetCheckExitHandler = undefined;
      }
      window.dispatchEvent(new CustomEvent('slap:feet-check-close'));
      if (this.restartingLevel) {
        this.input.keyboard?.resetKeys();
        clearMomentaryActions();
        return;
      }
      window.dispatchEvent(new CustomEvent('slap:level-state', { detail: { active: false } }));
      this.input.keyboard?.resetKeys();
      clearMomentaryActions();
    });
  }

  private resetRuntimeFields() {
    this.enemies = [];
    this.ambientNpcs = [];
    this.destructibleProps = [];
    this.pickups = [];
    this.hitStopManager?.reset();
    this.winText = undefined;
    this.koText = undefined;
    this.pauseOverlay = undefined;
    this.levelIntro = undefined;
    this.exitGlow = undefined;
    this.keyboardControls = undefined;
    this.leavingLevel = false;
    this.feetCheckActive = false;
    this.feetCheckNpc = undefined;
    this.feetCheckExitHandler = undefined;
    this.playerDefeatedPose = false;
    this.playerVictoryPose = false;
    this.playerShadow = undefined;
    this.exitPortal = undefined;
    this.exitLabel = undefined;
    this.companion = undefined;
    clearMomentaryActions();
  }

  update(_: number, deltaMs: number) {
    const dt = Math.min(0.035, deltaMs / 1000);

    if (this.handleGlobalActions()) {
      clearMomentaryActions();
      return;
    }

    if (this.hitStopManager.update()) {
      this.sendHud();
      clearMomentaryActions();
      return;
    }

    this.playerController.updateCooldowns(dt);

    if (this.feetCheckActive) {
      if (this.wantsFeetCheck()) {
        this.closeFeetCheck();
        this.sendHud();
        clearMomentaryActions();
        return;
      }
      this.playerController.invuln = Math.max(this.playerController.invuln, 0.25);
      this.freezeActors();
      this.sendHud();
      clearMomentaryActions();
      return;
    }

    if (this.state.hp <= 0) {
      this.state.paused = false;
      this.hidePauseOverlay();
      this.playPlayerDefeatedPose();
      this.showOutcome('KO', 'Press R to restart or Esc for menu', 0xef2b2d);
      this.freezeActors();
      this.sendHud();
      clearMomentaryActions();
      return;
    }

    if (this.state.won) {
      this.state.paused = false;
      this.hidePauseOverlay();
      if (this.leavingLevel) {
        this.freezeActors();
        this.sendHud();
        clearMomentaryActions();
        return;
      }
      this.playPlayerVictoryPose();
      this.showOutcome(this.level.clearTitle, this.getWinSubtitle(), 0x75ff43);
      this.freezeActors();
      this.sendHud();
      clearMomentaryActions();
      return;
    }

    if (this.state.paused) {
      this.showPauseOverlay();
      this.freezeActors();
      this.sendHud();
      clearMomentaryActions();
      return;
    }

    this.hidePauseOverlay();

    if (this.wantsFeetCheck()) {
      const npc = this.getNearbyFeetCheckNpc();
      if (npc) {
        this.openFeetCheck(npc);
        this.sendHud();
        clearMomentaryActions();
        return;
      }
    }
    
    const { moveX, moveY } = this.getMoveInput();
    this.playerController.update(dt, moveX, moveY, this.wantsJump(), this.wantsDodge(), this.wantsAttack(), this.wantsSuper());
    
    const pressureOrder = this.getEnemyPressureOrder();
    for (const enemy of this.enemies) {
      enemy.update(dt, this.playerController.sprite.x, this.playerController.sprite.y, pressureOrder.indexOf(enemy));
    }
    
    if (this.companion) {
      const playerMoving = Math.abs(moveX) + Math.abs(moveY) > 0.08
        || this.playerController.dodgeState > 0
        || this.playerController.jumpState > 0;
      this.companion.update(
        dt,
        this.wantsCompanionAttack(),
        this.playerController.sprite.x,
        this.playerController.sprite.y,
        this.playerController.facing,
        playerMoving
      );
    }

    this.updateAmbientNpcs(dt);
    this.updatePickups(dt);
    this.updateDepths();
    this.checkWin();
    this.sendHud();
    clearMomentaryActions();
  }

  startHitStop(durationMs: number) {
    const actors = [this.playerController.sprite];
    if (this.companion) actors.push(this.companion.sprite);
    for (const enemy of this.enemies) {
      if (enemy.active) actors.push(enemy.sprite);
    }
    this.hitStopManager.startHitStop(durationMs, actors);
  }

  private createWorld() {
    const worldWidth = this.getResponsiveWorldWidth();
    const worldHeight = this.getResponsiveWorldHeight();
    const laneTop = this.getLaneTop();
    const laneBottom = this.getLaneBottom();
    this.addCoveredWorldImage(assetKeys.backgroundFar, 0.2, -20, 0.5)
      .setScrollFactor(0.2)
      .setDepth(-20);

    const bgKey = this.level.backgroundKey ?? assetKeys.background;
    this.addStageWorldImage(bgKey, -15)
      .setDepth(-15)
      .setScrollFactor(1);

    this.add.rectangle(worldWidth / 2, (laneTop + laneBottom) / 2, worldWidth, laneBottom - laneTop + this.scaleWorldYDelta(36), 0x050506, 0.08).setDepth(-5);
    this.createLevelDressing();

    for (const p of this.level.props) {
      const propY = this.scaleWorldY(p.y);
      const propDepth = p.depth === undefined || p.depth < 0 ? p.depth : this.scaleWorldY(p.depth);
      const img = this.add.image(p.x, propY, p.key).setOrigin(0.5, 1).setScale(p.scale);
      const occludes = Boolean(p.occludes);
      img.setDepth(propDepth ?? (occludes ? propY + 4 : this.scaleWorldY(LARGE_PROP_DEPTH)));
      if (p.flipX) img.setFlipX(true);
      if (p.destructible && p.fxKey && p.dropKind && p.hitbox) {
        this.destructibleProps.push({
          sprite: img,
          hitbox: new Phaser.Geom.Rectangle(
            p.x - p.hitbox.width / 2,
            propY + (p.hitbox.offsetY ?? -p.hitbox.height / 2) - p.hitbox.height / 2,
            p.hitbox.width,
            p.hitbox.height
          ),
          hp: p.hp ?? 1,
          fxKey: p.fxKey,
          dropKind: p.dropKind,
          active: true,
          occludes
        });
      }
    }

    const exit = this.level.exit;
    const exitY = this.scaleWorldY(exit.y);
    const portalBack = this.add.rectangle(0, 0, 168, 58, 0x050506, 0.56)
      .setStrokeStyle(3, this.level.theme.accent, 0.86);
    const portalText = this.add.text(0, -3, 'NEXT  ->', {
      color: '#f4f4f2',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '32px',
      stroke: '#050506',
      strokeThickness: 6
    }).setOrigin(0.5);
    const portalRail = this.add.rectangle(0, 25, 132, 4, this.level.theme.accent, 0.82);
    this.exitPortal = this.add.container(exit.x, exitY - this.scaleWorldYDelta(78), [portalBack, portalText, portalRail])
      .setDepth(4)
      .setAlpha(0.88);
    this.tweens.add({
      targets: this.exitPortal,
      x: exit.x + 12,
      alpha: 1,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
    this.exitGlow = this.add.graphics().setDepth(3);
    this.exitGlow.lineStyle(5, this.level.theme.accent, 0.5);
    this.exitGlow.lineBetween(exit.x, exitY - this.scaleWorldYDelta(142), exit.x, exitY + this.scaleWorldYDelta(16));
    this.exitGlow.lineStyle(2, 0xf4f4f2, 0.32);
    this.exitGlow.lineBetween(exit.x + 12, exitY - this.scaleWorldYDelta(128), exit.x + 12, exitY + this.scaleWorldYDelta(6));

    this.exitLabel = this.add.text(exit.x, exitY - this.scaleWorldYDelta(156), `NEXT -> ${this.level.exitLabel}`, {
      color: '#ffca3a',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '28px',
      stroke: '#07080c',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(4);
  }

  private addCoveredWorldImage(key: string, scrollFactor: number, depth: number, focusY: number) {
    const worldWidth = this.getResponsiveWorldWidth();
    const worldHeight = this.getResponsiveWorldHeight();
    const texture = this.textures.get(key);
    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    const sourceWidth = source?.width || worldWidth;
    const sourceHeight = source?.height || worldHeight;
    const scale = Math.max(worldWidth / sourceWidth, worldHeight / sourceHeight);
    return this.add.image(worldWidth / 2, worldHeight * focusY, key)
      .setOrigin(0.5)
      .setScale(scale)
      .setScrollFactor(scrollFactor)
      .setDepth(depth);
  }

  private addStageWorldImage(key: string, depth: number) {
    const worldWidth = this.getResponsiveWorldWidth();
    const worldHeight = this.getResponsiveWorldHeight();
    const texture = this.textures.get(key);
    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    const sourceWidth = source?.width || worldWidth;
    const sourceHeight = source?.height || worldHeight;
    const scale = Math.max(worldWidth / sourceWidth, worldHeight / sourceHeight);
    return this.add.image(worldWidth / 2, worldHeight, key)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setScrollFactor(1)
      .setDepth(depth);
  }

  private createLevelDressing() {
    const { accent, haze, signText, signColor } = this.level.theme;
    const worldWidth = this.getResponsiveWorldWidth();
    const worldHeight = this.getResponsiveWorldHeight();
    this.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, haze, 0.2)
      .setDepth(-14)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    const sign = this.add.text(WORLD_WIDTH / 2, 118, signText, {
      color: Phaser.Display.Color.IntegerToColor(signColor).rgba,
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '42px',
      stroke: '#050506',
      strokeThickness: 9
    }).setOrigin(0.5).setDepth(-2).setAlpha(0.44);
    sign.setShadow(0, 0, Phaser.Display.Color.IntegerToColor(signColor).rgba, 18, true, true);

    this.tweens.add({
      targets: sign,
      alpha: 0.28,
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }

  private getResponsiveWorldWidth() {
    return Math.max(WORLD_WIDTH, Math.ceil(this.scale.width / this.getResponsiveCameraZoom()));
  }

  private getResponsiveWorldHeight() {
    return Math.max(WORLD_HEIGHT, Math.ceil(this.scale.height / this.getResponsiveCameraZoom()));
  }

  private getWorldYScale() {
    return this.getResponsiveWorldHeight() / WORLD_HEIGHT;
  }

  scaleWorldY(y: number) {
    return y * this.getWorldYScale();
  }

  scaleWorldYDelta(y: number) {
    return y * this.getWorldYScale();
  }

  getLaneTop() {
    return this.scaleWorldY(LANE_TOP);
  }

  getLaneBottom() {
    return this.scaleWorldY(LANE_BOTTOM);
  }

  private getAmbientSidewalkTop() {
    return this.scaleWorldY(AMBIENT_SIDEWALK_TOP);
  }

  private getAmbientSidewalkBottom() {
    return this.scaleWorldY(AMBIENT_SIDEWALK_BOTTOM);
  }

  private getAmbientSidewalkLeft() {
    return 180;
  }

  private getAmbientSidewalkRight() {
    return WORLD_WIDTH - 180;
  }

  private getResponsiveCameraZoom() {
    const viewportWidth = window.innerWidth || this.scale.width;
    const viewportHeight = window.innerHeight || this.scale.height;
    if (viewportWidth > viewportHeight && viewportHeight <= 430) {
      return Phaser.Math.Clamp(viewportHeight / 470, 0.84, 0.92);
    }
    return 1;
  }

  private createActors() {
    const playerDef = getPlayerCharacter(this.registry.get('selectedPlayer'));
    const playerId = playerDef.id as PlayerId;
    this.state = createSessionState(playerId, playerDef.stats.maxHp);

    this.createAmbientNpcs();

    const playerStartY = Phaser.Math.Clamp(this.scaleWorldY(this.level.playerStart.y), this.getLaneTop(), this.getLaneBottom());
    const playerSprite = createCharacterSprite(this, playerDef, this.level.playerStart.x, playerStartY, {
      action: 'idle',
      collideWorldBounds: true,
      drag: 1200
    });
    this.playerController = new PlayerController(this, playerSprite, playerDef, playerId);

    this.playerShadow = this.add.image(playerSprite.x, playerStartY + 6, assetKeys.propPuddleDecal)
      .setOrigin(0.5, 0.5)
      .setScale(0.42)
      .setAlpha(0.55)
      .setDepth(playerSprite.y - 1);

    this.createCompanion();
    this.enemies = this.level.enemyStarts.map((spawn) => this.makeEnemy(spawn.id, spawn.x, spawn.y, spawn.engageDelay));
  }

  private createAmbientNpcs() {
    const girlPool = getCharactersByRole('npc')
      .filter((character) => this.isAmbientGirlId(character.id));
    const usesRunnerBehavior = this.level.ambientBehavior === 'soi-six-runner';
    const randomGirlCount = usesRunnerBehavior
      ? Phaser.Math.Between(SOI_SIX_AMBIENT_MIN, SOI_SIX_AMBIENT_MAX)
      : Phaser.Math.Between(4, 7);
    const runnerCandidateIds = new Set((this.level.ambientNpcs ?? []).map((ambient) => ambient.id));
    const runnerPool = usesRunnerBehavior && runnerCandidateIds.size > 0
      ? girlPool.filter((character) => runnerCandidateIds.has(character.id))
      : girlPool;
    const ambientNpcs = usesRunnerBehavior
      ? this.pickAmbientGirls(runnerPool, randomGirlCount)
      : this.level.ambientNpcs?.length
        ? this.level.ambientNpcs.filter((ambient) => this.isAmbientGirlId(ambient.id))
        : this.pickAmbientGirls(girlPool, randomGirlCount);

    for (const ambient of ambientNpcs) {
      const character = getCharacter(ambient.id);
      const personality = this.getAmbientPersonality(character.id);
      const action = usesRunnerBehavior
        ? 'idle'
        : hasAnimation(character.id, ambient.action ?? '')
          ? ambient.action ?? 'idle'
          : this.pickAmbientAction(character.id, personality.idleActions, 'idle');
      const startY = Phaser.Math.Clamp(this.scaleWorldY(ambient.y), this.getAmbientSidewalkTop(), this.getAmbientSidewalkBottom());
      const sprite = createCharacterSprite(this, character, ambient.x, startY, {
        action,
        immovable: true,
        flipX: ambient.flipX
      });
      sprite.body.enable = false;
      if (this.isAmbientGirlId(ambient.id)) {
        sprite.setScale(sprite.scaleX * AMBIENT_GIRL_VISUAL_SCALE, sprite.scaleY * AMBIENT_GIRL_VISUAL_SCALE);
      }
      sprite.setAlpha(1);
      sprite.y = startY;
      sprite.setDepth(this.getAmbientSidewalkBottom() - 2);
      const npc: AmbientNpc = {
        sprite,
        characterId: character.id,
        action,
        idleAction: action,
        personality,
        idleTimeScale: this.applyAmbientNpcIdleScale(this.pickAmbientFloatRange(personality.idleTimeScale), character.id),
        motionTimeScale: 1,
        homeX: ambient.x,
        homeY: startY,
        runnerState: 'idle',
        motion: this.pickAmbientMotion(personality.runChance),
        returnMotion: this.pickAmbientMotion(personality.returnRunChance),
        runBackAfterTouch: Phaser.Math.FloatBetween(0, 1) < personality.runBackChance,
        nextActionAt: this.time.now + this.pickAmbientRange(personality.approachDelayMs) + Phaser.Math.Between(0, usesRunnerBehavior ? 7200 : 1600),
        nextGestureAt: this.time.now + this.pickAmbientRange(personality.gestureDelayMs) + Phaser.Math.Between(0, usesRunnerBehavior ? 5200 : 1200),
        gestureUntil: 0,
        targetX: ambient.x,
        targetY: startY,
        speed: 0
      };
      this.ambientNpcs.push(npc);
      
      if (this.isAmbientGirlId(ambient.id) && !usesRunnerBehavior) {
        this.startAmbientGirlStrip(npc, character.id, action, Phaser.Math.Between(0, 2200));
      } else if (this.isAmbientGirlId(ambient.id)) {
        playCharacterAnimation(sprite, character.id, npc.action, true);
        sprite.anims.timeScale = npc.idleTimeScale;
      }
    }
  }

  private startAmbientGirlStrip(npc: AmbientNpc, characterId: string, action: string, startDelayMs = 0) {
    const sprite = npc.sprite;
    const animAction = hasAnimation(characterId, action) ? action : 'idle';
    this.clearAmbientGirlStripTimers(npc);

    const begin = () => {
      if (!sprite.active) return;
      if (this.feetCheckActive || this.state.paused) {
        this.clearAmbientGirlStripTimers(npc);
        return;
      }
      playCharacterAnimation(sprite, characterId, animAction, false);
      sprite.anims.timeScale = Phaser.Math.FloatBetween(AMBIENT_GIRL_STRIP_TIME_SCALE_MIN, AMBIENT_GIRL_STRIP_TIME_SCALE_MAX);
      npc.stripHoldTimer = this.time.delayedCall(Phaser.Math.Between(1200, 1850), holdStill);
    };

    const holdStill = () => {
      if (!sprite.active) return;
      if (this.feetCheckActive || this.state.paused) {
        this.clearAmbientGirlStripTimers(npc);
        return;
      }
      this.playOptionalCharacterAnimation(sprite, characterId, 'idle', true, 'idle');
      sprite.anims.timeScale = npc.idleTimeScale;
      npc.stripHoldTimer = this.time.delayedCall(Phaser.Math.Between(2600, 4200), begin);
    };

    if (startDelayMs > 0) {
      sprite.anims.pause();
      npc.stripBeginTimer = this.time.delayedCall(startDelayMs, begin);
    } else {
      begin();
    }
  }

  private clearAmbientGirlStripTimers(npc: AmbientNpc) {
    if (npc.stripBeginTimer) {
      npc.stripBeginTimer.remove(false);
      npc.stripBeginTimer = undefined;
    }
    if (npc.stripHoldTimer) {
      npc.stripHoldTimer.remove(false);
      npc.stripHoldTimer = undefined;
    }
  }

  private updateAmbientNpcs(dt: number) {
    if (this.level.ambientBehavior !== 'soi-six-runner') return;
    const now = this.time.now;
    const player = this.playerController.sprite;
    let activeMovers = this.ambientNpcs.filter((npc) => npc.runnerState === 'stroll' || npc.runnerState === 'approach' || npc.runnerState === 'return').length;
    let activeGestures = this.ambientNpcs.filter((npc) => npc.runnerState === 'idle' && npc.gestureUntil > now).length;

    for (const npc of this.ambientNpcs) {
      const { sprite, characterId } = npc;
      if (!sprite.active) continue;

      if (npc.runnerState === 'idle') {
        sprite.x = Phaser.Math.Linear(sprite.x, npc.homeX, Math.min(1, dt * 2.2));
        sprite.y = Phaser.Math.Linear(sprite.y, npc.homeY, Math.min(1, dt * 2.2));
        sprite.setFlipX(player.x < sprite.x);
        const startedGesture = this.updateAmbientIdlePose(npc, now, activeGestures < SOI_SIX_MAX_ACTIVE_GESTURES);
        if (startedGesture) activeGestures += 1;
        if (now < npc.nextActionAt) continue;
        if (activeMovers >= SOI_SIX_MAX_ACTIVE_MOVERS) {
          npc.nextActionAt = now + this.pickAmbientRange(npc.personality.restDelayMs);
          continue;
        }

        const shouldApproachCasey = Phaser.Math.FloatBetween(0, 1) < 0.64;
        npc.runnerState = shouldApproachCasey ? 'approach' : 'stroll';
        activeMovers += 1;
        npc.motion = shouldApproachCasey ? 'run' : 'walk';
        npc.returnMotion = this.pickAmbientMotion(npc.personality.returnRunChance);
        npc.runBackAfterTouch = Phaser.Math.FloatBetween(0, 1) < npc.personality.runBackChance;
        if (shouldApproachCasey) {
          const side = sprite.x < player.x ? -1 : 1;
          npc.targetX = Phaser.Math.Clamp(
            player.x + side * this.pickAmbientRange(npc.personality.targetOffsetX),
            npc.homeX - 360,
            npc.homeX + 360
          );
          npc.targetX = Phaser.Math.Clamp(npc.targetX, this.getAmbientSidewalkLeft(), this.getAmbientSidewalkRight());
          npc.targetY = Phaser.Math.Clamp(
            npc.homeY + this.scaleWorldYDelta(this.pickAmbientRange(npc.personality.targetOffsetY)),
            this.getAmbientSidewalkTop(),
            this.getAmbientSidewalkBottom()
          );
        } else {
          npc.targetX = Phaser.Math.Clamp(
            npc.homeX + Phaser.Math.Between(-180, 180),
            this.getAmbientSidewalkLeft(),
            this.getAmbientSidewalkRight()
          );
          npc.targetY = Phaser.Math.Clamp(
            npc.homeY + this.scaleWorldYDelta(Phaser.Math.Between(-10, 12)),
            this.getAmbientSidewalkTop(),
            this.getAmbientSidewalkBottom()
          );
          npc.returnMotion = 'walk';
        }
        this.setAmbientLocomotion(npc, true);
        continue;
      }

      if (npc.runnerState === 'stroll') {
        if (this.moveAmbientNpcToward(npc, npc.targetX, npc.targetY, dt)) {
          npc.runnerState = 'linger';
          npc.nextActionAt = now + this.pickAmbientRange(npc.personality.lingerMs);
          const callout = this.pickAmbientAction(characterId, npc.personality.calloutActions, 'talk');
          this.playOptionalCharacterAnimation(sprite, characterId, callout, false, 'idle');
          sprite.anims.timeScale = this.getAmbientNpcTimeScale(characterId);
        }
        continue;
      }

      if (npc.runnerState === 'approach') {
        const side = sprite.x < player.x ? -1 : 1;
        npc.targetX = Phaser.Math.Clamp(
          player.x + side * this.pickAmbientRange(npc.personality.targetOffsetX),
          npc.homeX - 360,
          npc.homeX + 360
        );
        npc.targetX = Phaser.Math.Clamp(npc.targetX, this.getAmbientSidewalkLeft(), this.getAmbientSidewalkRight());
        npc.targetY = Phaser.Math.Clamp(
          npc.homeY + this.scaleWorldYDelta(this.pickAmbientRange(npc.personality.targetOffsetY)),
          this.getAmbientSidewalkTop(),
          this.getAmbientSidewalkBottom()
        );
        const touchedCasey = Math.abs(sprite.x - player.x) < 78 && Math.abs(sprite.y - player.y) < 70;
        if (touchedCasey) {
          npc.runnerState = 'linger';
          npc.nextActionAt = now + this.pickAmbientRange(npc.runBackAfterTouch ? npc.personality.touchLingerMs : npc.personality.lingerMs);
          const callout = this.pickAmbientAction(characterId, npc.personality.calloutActions, 'talk');
          this.playOptionalCharacterAnimation(sprite, characterId, callout, false, 'idle');
          sprite.anims.timeScale = this.getAmbientNpcTimeScale(characterId);
          continue;
        }
        if (this.moveAmbientNpcToward(npc, npc.targetX, npc.targetY, dt)) {
          npc.runnerState = 'linger';
          npc.nextActionAt = now + this.pickAmbientRange(npc.runBackAfterTouch ? npc.personality.touchLingerMs : npc.personality.lingerMs);
          const callout = this.pickAmbientAction(characterId, npc.personality.calloutActions, 'talk');
          this.playOptionalCharacterAnimation(sprite, characterId, callout, false, 'idle');
          sprite.anims.timeScale = this.getAmbientNpcTimeScale(characterId);
        }
        continue;
      }

      if (npc.runnerState === 'linger') {
        sprite.setFlipX(player.x < sprite.x);
        if (now >= npc.nextActionAt) {
          npc.runnerState = 'return';
          npc.targetX = npc.homeX;
          npc.targetY = npc.homeY;
          if (npc.runBackAfterTouch) npc.returnMotion = 'run';
          npc.motion = npc.returnMotion;
          this.setAmbientLocomotion(npc, true);
        }
        continue;
      }

      if (this.moveAmbientNpcToward(npc, npc.homeX, npc.homeY, dt)) {
        npc.runnerState = 'idle';
        sprite.setPosition(npc.homeX, npc.homeY);
        npc.nextActionAt = now + this.pickAmbientRange(npc.personality.restDelayMs);
        npc.idleAction = this.pickAmbientAction(characterId, npc.personality.idleActions, 'idle');
        npc.idleTimeScale = this.applyAmbientNpcIdleScale(this.pickAmbientFloatRange(npc.personality.idleTimeScale), characterId);
        npc.gestureUntil = 0;
        npc.nextGestureAt = now + this.pickAmbientRange(npc.personality.gestureDelayMs);
        this.playOptionalCharacterAnimation(sprite, characterId, npc.idleAction, false, 'idle');
      }
    }
  }

  private updateAmbientIdlePose(npc: AmbientNpc, now: number, canStartGesture = true) {
    const { sprite, characterId, personality } = npc;
    let startedGesture = false;

    if (npc.gestureUntil > 0 && now >= npc.gestureUntil) {
      npc.gestureUntil = 0;
      npc.idleAction = this.pickAmbientAction(characterId, personality.idleActions, 'idle');
      npc.idleTimeScale = this.applyAmbientNpcIdleScale(this.pickAmbientFloatRange(personality.idleTimeScale), characterId);
      npc.nextGestureAt = now + this.pickAmbientRange(personality.gestureDelayMs);
      this.playOptionalCharacterAnimation(sprite, characterId, npc.idleAction, false, 'idle');
    }

    if (canStartGesture && npc.gestureUntil === 0 && now >= npc.nextGestureAt && now + 900 < npc.nextActionAt) {
      npc.idleAction = this.pickAmbientAction(characterId, personality.calloutActions, 'talk');
      npc.idleTimeScale = this.applyAmbientNpcIdleScale(this.pickAmbientFloatRange(personality.idleTimeScale), characterId);
      npc.gestureUntil = now + this.pickAmbientRange(personality.gestureDurationMs);
      this.playOptionalCharacterAnimation(sprite, characterId, npc.idleAction, false, 'idle');
      startedGesture = true;
    } else {
      this.playOptionalCharacterAnimation(sprite, characterId, npc.idleAction, true, 'idle');
    }

    sprite.anims.timeScale = npc.idleTimeScale;
    return startedGesture;
  }

  private moveAmbientNpcToward(npc: AmbientNpc, targetX: number, targetY: number, dt: number) {
    const dx = targetX - npc.sprite.x;
    const dy = targetY - npc.sprite.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= Math.max(5, npc.speed * dt)) {
      npc.sprite.setPosition(targetX, targetY);
      return true;
    }
    this.setAmbientLocomotion(npc);
    npc.sprite.x += (dx / distance) * npc.speed * dt;
    npc.sprite.y += (dy / distance) * npc.speed * dt;
    npc.sprite.setFlipX(dx < 0);
    return false;
  }

  private setAmbientLocomotion(npc: AmbientNpc, refreshSpeed = false) {
    const action = npc.motion === 'run' && hasAnimation(npc.characterId, 'run') ? 'run' : 'walk';
    if (refreshSpeed || npc.speed <= 0) {
      const speedRange = npc.motion === 'run' ? npc.personality.runSpeed : npc.personality.walkSpeed;
      const timeScale = npc.motion === 'run' ? npc.personality.runTimeScale : npc.personality.walkTimeScale;
      const ambientScale = this.getAmbientNpcMotionScale(npc.characterId);
      const timeScaleScale = this.getAmbientNpcTimeScale(npc.characterId);
      npc.speed = Math.round(this.pickAmbientRange(speedRange) * ambientScale);
      npc.motionTimeScale = Math.max(0.15, this.pickAmbientFloatRange(timeScale) * timeScaleScale);
    }
    playCharacterAnimation(npc.sprite, npc.characterId, action, true);
    npc.sprite.anims.timeScale = npc.motionTimeScale;
  }

  private pauseAmbientGirlStrips() {
    for (const npc of this.ambientNpcs) {
      this.clearAmbientGirlStripTimers(npc);
      if (npc.sprite.anims.currentAnim && npc.sprite.anims.isPlaying) {
        npc.sprite.anims.pause();
      }
    }
  }

  private resumeAmbientGirlStrips() {
    if (this.level.ambientBehavior === 'soi-six-runner') {
      for (const npc of this.ambientNpcs) {
        if (npc.sprite.anims.currentAnim) {
          npc.sprite.anims.resume();
        }
      }
      return;
    }
    for (const npc of this.ambientNpcs) {
      if (!this.isAmbientGirlId(npc.characterId) || !npc.sprite.active) continue;
      this.startAmbientGirlStrip(npc, npc.characterId, npc.action, Phaser.Math.Between(180, 700));
    }
  }

  private getAmbientPersonality(characterId: string) {
    return AMBIENT_PERSONALITIES[characterId] ?? DEFAULT_AMBIENT_PERSONALITY;
  }

  private pickAmbientMotion(runChance: number): 'walk' | 'run' {
    return Phaser.Math.FloatBetween(0, 1) < runChance ? 'run' : 'walk';
  }

  private getAmbientNpcMotionScale(characterId: string) {
    return this.isAmbientGirlId(characterId) ? AMBIENT_GIRL_MOTION_SCALE : 1;
  }

  private getAmbientNpcTimeScale(characterId: string) {
    return this.isAmbientGirlId(characterId) ? AMBIENT_GIRL_ANIM_SCALE : 1;
  }

  private applyAmbientNpcIdleScale(value: number, characterId: string) {
    return Math.max(AMBIENT_GIRL_TTS_MIN, value * this.getAmbientNpcTimeScale(characterId));
  }

  private pickAmbientRange(range: [number, number]) {
    return Phaser.Math.Between(range[0], range[1]);
  }

  private pickAmbientFloatRange(range: [number, number]) {
    return Phaser.Math.FloatBetween(range[0], range[1]);
  }

  private pickAmbientAction(characterId: string, actions: string[], fallback: string) {
    const available = actions.filter((action) => hasAnimation(characterId, action));
    if (available.length === 0) return fallback;
    return Phaser.Utils.Array.GetRandom(available);
  }

  private pickAmbientGirls(girlPool: CharacterDefinition[], count: number) {
    if (girlPool.length === 0) return [];
    const actions = ['idle', 'talk', 'cheer'];
    const chosen: Array<{ id: string; x: number; y: number; flipX: boolean; action: string }> = [];
    const xMin = Math.max(290, this.level.playerStart.x - 230);
    const xMax = Math.min(WORLD_WIDTH - 260, this.level.exit.x - 170);
    const shuffled = Phaser.Utils.Array.Shuffle([...girlPool]);

    for (let i = 0; i < count; i++) {
      const character = shuffled[i % shuffled.length];
      const spacing = (xMax - xMin) / Math.max(count - 1, 1);
      const baseX = count === 1 ? (xMin + xMax) / 2 : xMin + spacing * i;
      const x = Phaser.Math.Clamp(baseX + Phaser.Math.Between(-92, 92), xMin, xMax);
      const action = Phaser.Utils.Array.GetRandom(actions);
      chosen.push({
        id: character.id,
        x,
        y: this.pickAmbientGirlY(),
        flipX: Phaser.Math.Between(0, 1) === 1,
        action: hasAnimation(character.id, action) ? action : 'idle'
      });
    }

    return Phaser.Utils.Array.Shuffle(chosen);
  }

  private isAmbientGirlId(id: string) {
    return (id.startsWith('soi-six-') || id.startsWith('npc-girl-')) && !REJECTED_AMBIENT_GIRL_IDS.has(id);
  }

  private getNearbyFeetCheckNpc() {
    if (this.feetCheckActive || !this.playerController || this.state?.won || this.state?.paused || this.state?.hp <= 0) {
      return undefined;
    }
    const player = this.playerController.sprite;
    let best: AmbientNpc | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const npc of this.ambientNpcs) {
      if (!npc.sprite.active || !this.isAmbientGirlId(npc.characterId)) continue;
      const character = getCharacter(npc.characterId);
      if (!character.feetCheck) continue;
      const dx = Math.abs(npc.sprite.x - player.x);
      const dy = Math.abs(npc.sprite.y - player.y);
      if (dx > 104 || dy > 74) continue;
      const distance = Math.hypot(dx, dy);
      if (distance < bestDistance) {
        best = npc;
        bestDistance = distance;
      }
    }
    return best;
  }

  private openFeetCheck(npc: AmbientNpc) {
    const character = getCharacter(npc.characterId);
    if (!character.feetCheck) return;
    this.feetCheckActive = true;
    this.feetCheckNpc = npc;
    this.state.paused = false;
    this.hidePauseOverlay();
    clearMomentaryActions();
    this.freezeActors();
    this.playerController.invuln = Math.max(this.playerController.invuln, 1.2);
    this.playerController.sprite.setVelocity(0, 0);
    this.playOptionalCharacterAnimation(npc.sprite, npc.characterId, 'talk', false, 'idle');
    npc.sprite.anims.timeScale = 0.92;
    this.pauseAmbientGirlStrips();
    window.dispatchEvent(new CustomEvent<FeetCheckDetail>('slap:feet-check-open', {
      detail: this.getFeetCheckDetail(character)
    }));
  }

  private closeFeetCheck() {
    if (!this.feetCheckActive) return;
    this.feetCheckActive = false;
    this.playerController.invuln = Math.max(this.playerController.invuln, 0.8);
    if (this.feetCheckNpc) {
      this.feetCheckNpc.nextActionAt = this.time.now + this.pickAmbientRange(this.feetCheckNpc.personality.restDelayMs);
      this.feetCheckNpc.runnerState = 'return';
      this.feetCheckNpc.motion = this.feetCheckNpc.returnMotion;
      this.setAmbientLocomotion(this.feetCheckNpc, true);
    }
    this.feetCheckNpc = undefined;
    this.resumeAmbientGirlStrips();
    window.dispatchEvent(new CustomEvent('slap:feet-check-close'));
  }

  private getFeetCheckDetail(character: CharacterDefinition): FeetCheckDetail {
    const feetCheck = character.feetCheck;
    if (!feetCheck) {
      return {
        name: character.displayName,
        title: 'FEET CHECK',
        subtitle: 'No custom check loaded yet',
        faceImage: character.seed.path,
        faceFrames: 1,
        faceFrameWidth: undefined,
        faceFrameHeight: undefined,
        faceFps: 1,
        stripImage: character.seed.path,
        frames: 1,
        frameWidth: undefined,
        frameHeight: undefined,
        fps: 1
      };
    }
    return {
      name: character.displayName,
      title: feetCheck.title,
      subtitle: feetCheck.subtitle,
      faceImage: feetCheck.faceImage,
      faceFrames: feetCheck.faceFrames,
      faceFrameWidth: feetCheck.faceFrameWidth,
      faceFrameHeight: feetCheck.faceFrameHeight,
      faceFps: feetCheck.faceFps,
      stripImage: feetCheck.stripImage,
      frames: feetCheck.frames,
      frameWidth: feetCheck.frameWidth,
      frameHeight: feetCheck.frameHeight,
      fps: feetCheck.fps
    };
  }

  private pickAmbientGirlY() {
    const upperHalf = Phaser.Math.FloatBetween(0, 1) < 0.72;
    const min = upperHalf ? AMBIENT_SIDEWALK_TOP : Math.round((AMBIENT_SIDEWALK_TOP + AMBIENT_SIDEWALK_BOTTOM) / 2);
    return Phaser.Math.Between(min, AMBIENT_SIDEWALK_BOTTOM);
  }

  private createCompanion() {
    const character = getCharacter(SOI_DOG_ID);
    const x = this.level.playerStart.x - this.playerController.facing * SOI_DOG_FOLLOW_OFFSET_X;
    const y = Phaser.Math.Clamp(this.playerController.sprite.y + this.scaleWorldYDelta(SOI_DOG_FOLLOW_OFFSET_Y), this.getLaneTop(), this.getLaneBottom());
    const sprite = createCharacterSprite(this, character, x, y, {
      action: 'idle',
      collideWorldBounds: true,
      drag: 900
    });
    const shadow = this.add.image(sprite.x, sprite.y + 3, assetKeys.propPuddleDecal)
      .setOrigin(0.5, 0.5)
      .setScale(0.2)
      .setAlpha(0.38)
      .setDepth(sprite.y - 2);

    this.companion = new CompanionController(this, sprite, character, shadow);
  }

  private makeEnemy(characterId: string, x: number, y: number, engageDelay: number): EnemyController {
    const character = getCharacter(characterId);
    const sprite = createCharacterSprite(this, character, x, Phaser.Math.Clamp(this.scaleWorldY(y), this.getLaneTop(), this.getLaneBottom()), {
      action: 'idle',
      collideWorldBounds: true,
      drag: 900,
      flipX: true
    });
    const bar = this.add.graphics().setDepth(20);
    return new EnemyController(this, sprite, character, engageDelay, bar);
  }

  private getEnemyPressureOrder() {
    return this.enemies
      .filter((enemy) => enemy.active && enemy.engageDelay <= 0)
      .sort((a, b) => {
        const aDistance = Phaser.Math.Distance.Between(this.playerController.sprite.x, this.playerController.sprite.y, a.sprite.x, a.sprite.y);
        const bDistance = Phaser.Math.Distance.Between(this.playerController.sprite.x, this.playerController.sprite.y, b.sprite.x, b.sprite.y);
        return aDistance - bDistance;
      });
  }

  applyDamageToPlayer(amount: number, profile: HitboxProfile, direction: number) {
    if (this.feetCheckActive) return;
    const hurtbox = getHurtboxProfile(this.playerController.def.combat.hurtboxProfile);
    const damage = amount * profile.damageMultiplier * hurtbox.damageTakenMultiplier;
    this.state.hp = Math.max(0, this.state.hp - damage);
    this.playerController.invuln = 0.42;
    this.playerController.dodgeState = 0;
    this.playerController.knockback = Math.max(this.playerController.knockback, Math.min(Math.max(profile.stun, 0.12), KNOCKBACK_COAST_SECONDS));
    this.playerController.stunned = Math.max(this.playerController.stunned, Math.max(profile.stun, 0.14));
    this.playerController.actionLockedUntil = Math.max(this.playerController.actionLockedUntil, this.time.now + Math.max(profile.stun * 1000, 180));
    this.playerController.sprite.setVelocity(direction * profile.knockback * hurtbox.knockbackMultiplier, -12);
    playCharacterAnimation(this.playerController.sprite, this.playerController.id, 'hurt', false);
    this.cameras.main.shake(90, 0.006);
    this.playImpact(profile, this.playerController.sprite.x, this.playerController.sprite.y - 130, 0xffca3a, 26);
    this.startHitStop(profile.hitStopMs);

    if (this.state.hp <= 0) {
      this.showOutcome('KO', 'Press R to restart or Esc for menu', 0xef2b2d);
    }
  }

  damageEnemy(enemy: EnemyController, amount: number, knockback: number, stun: number, direction: number) {
      enemy.damage(amount, knockback, stun, direction);
  }

  startCompanionSupportRush(direction: number) {
      if(this.companion) {
          this.companion.startSupportRush(direction, this.playerController.sprite.x, this.playerController.sprite.y);
      }
  }

  hitDestructibleProps(rect: Phaser.Geom.Rectangle, damage: number, direction: number) {
    let hits = 0;
    for (const prop of this.destructibleProps) {
      if (!prop.active) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(rect, prop.hitbox)) continue;
      hits += 1;
      prop.hp -= damage;
      prop.sprite.setTintFill(0xffffff);
      this.time.delayedCall(54, () => prop.sprite.clearTint());
      this.flashHit(prop.sprite.x + direction * 18, prop.sprite.y - 60, 0xffca3a, 18);
      if (prop.hp <= 0) {
        this.breakDestructibleProp(prop, direction);
      }
    }
    return hits;
  }

  private breakDestructibleProp(prop: DestructibleProp, direction: number) {
    if (!prop.active) return;
    prop.active = false;
    prop.sprite.setVisible(false);
    const fx = this.add.sprite(prop.sprite.x, prop.sprite.y - 70, assetKeys.destructibleStreetClutterFx)
      .setScale(0.72)
      .setDepth(Math.max(60, prop.sprite.depth + 6))
      .setFlipX(direction < 0);
    fx.play(prop.fxKey);
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
    this.spawnPickup(prop.dropKind, prop.sprite.x + direction * 18, prop.sprite.y - 24);
    this.state.score += 75;
    this.cameras.main.shake(70, 0.003);
    this.startHitStop(35);
  }

  private spawnPickup(kind: PickupKind, x: number, y: number) {
    const config = this.getPickupConfig(kind);
    const sprite = this.add.image(x, y, config.key)
      .setOrigin(0.5, 0.5)
      .setScale(config.scale)
      .setDepth(y + 24);
    const pickup: Pickup = {
      sprite,
      kind,
      value: config.value,
      lifetime: 8,
      collected: false
    };
    this.pickups.push(pickup);
    this.tweens.add({
      targets: sprite,
      y: y - 20,
      duration: 220,
      ease: 'Back.out',
      yoyo: true
    });
    this.tweens.add({
      targets: sprite,
      scale: config.scale * 1.12,
      duration: 420,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1
    });
  }

  private getPickupConfig(kind: PickupKind) {
    if (kind === 'health') {
      return { key: assetKeys.propEnergySoda, value: 22, scale: 0.18, color: 0x75ff43 };
    }
    if (kind === 'meter') {
      return { key: assetKeys.propInkBottle, value: 28, scale: 0.2, color: 0x00dfff };
    }
    return { key: assetKeys.propBahtCoin, value: 1, scale: 0.16, color: 0xffca3a };
  }

  private updatePickups(dt: number) {
    for (const pickup of this.pickups) {
      if (pickup.collected) continue;
      pickup.lifetime -= dt;
      pickup.sprite.setDepth(pickup.sprite.y + 24);
      const closeEnough = Phaser.Math.Distance.Between(
        this.playerController.sprite.x,
        this.playerController.sprite.y - 42,
        pickup.sprite.x,
        pickup.sprite.y
      ) <= PICKUP_COLLECT_DISTANCE;
      if (closeEnough) {
        this.collectPickup(pickup);
      } else if (pickup.lifetime <= 0) {
        pickup.collected = true;
        this.tweens.killTweensOf(pickup.sprite);
        this.tweens.add({
          targets: pickup.sprite,
          alpha: 0,
          duration: 220,
          onComplete: () => pickup.sprite.destroy()
        });
      }
    }
    this.pickups = this.pickups.filter((pickup) => !pickup.collected || pickup.sprite.active);
  }

  private collectPickup(pickup: Pickup) {
    if (pickup.collected) return;
    pickup.collected = true;
    const config = this.getPickupConfig(pickup.kind);
    if (pickup.kind === 'health') {
      this.state.hp = Math.min(this.state.maxHp, this.state.hp + pickup.value);
    } else if (pickup.kind === 'meter') {
      this.state.meter = Math.min(this.state.maxMeter, this.state.meter + pickup.value);
    } else {
      this.state.coins += pickup.value;
      this.state.score += 50 * pickup.value;
    }
    this.flashHit(pickup.sprite.x, pickup.sprite.y, config.color, 20);
    this.tweens.killTweensOf(pickup.sprite);
    this.tweens.add({
      targets: pickup.sprite,
      y: pickup.sprite.y - 34,
      alpha: 0,
      scale: pickup.sprite.scale * 1.35,
      duration: 180,
      ease: 'Quad.out',
      onComplete: () => pickup.sprite.destroy()
    });
  }

  getForwardTargets(profile: HitboxProfile, attackerX: number, attackerY: number, direction: number) {
    const attackRect = this.getAttackRect(attackerX, attackerY, profile, direction);
    return this.enemies.filter((enemy) => {
      if (!enemy.active) return false;
      if (!this.isInProfileLane(attackerY, enemy.sprite.y, profile)) return false;
      if (!this.isInProfileRange(attackerX, enemy.sprite.x, profile, direction)) return false;
      return Phaser.Geom.Intersects.RectangleToRectangle(
        attackRect,
        this.getHurtboxRect(enemy.sprite, enemy.character)
      );
    });
  }

  profileHitsPlayer(enemy: EnemyController, profile: HitboxProfile) {
    const direction = Math.sign(this.playerController.sprite.x - enemy.sprite.x) || 1;
    const attackRect = this.getAttackRect(enemy.sprite.x, enemy.sprite.y, profile, direction);
    if (!this.isInProfileLane(enemy.sprite.y, this.playerController.sprite.y, profile)) return false;
    if (!this.isInProfileRange(enemy.sprite.x, this.playerController.sprite.x, profile, direction)) return false;
    return Phaser.Geom.Intersects.RectangleToRectangle(
      attackRect,
      this.getHurtboxRect(this.playerController.sprite, this.playerController.def)
    );
  }

  getAttackRect(x: number, y: number, profile: HitboxProfile, direction: number) {
    const width = Math.max(profile.width, profile.range);
    const height = Math.max(profile.height, profile.laneHeight);
    const centerX = x + profile.offsetX * direction;
    const centerY = y + profile.offsetY;
    return new Phaser.Geom.Rectangle(
      centerX - width / 2,
      centerY - height / 2,
      width,
      height
    );
  }

  private isInProfileLane(attackerY: number, targetY: number, profile: HitboxProfile) {
    return profile.laneHeight <= 0 || Math.abs(attackerY - targetY) <= profile.laneHeight;
  }

  private isInProfileRange(attackerX: number, targetX: number, profile: HitboxProfile, direction: number) {
    if (profile.range <= 0) return false;
    const forwardDistance = (targetX - attackerX) * direction;
    return forwardDistance >= -profile.width * 0.25 && forwardDistance <= profile.range;
  }

  getHurtboxRect(sprite: ArcadeCharacterSprite, character: CharacterDefinition) {
    const profile = getHurtboxProfile(character.combat.hurtboxProfile);
    return new Phaser.Geom.Rectangle(
      sprite.x - profile.width / 2,
      sprite.y + profile.offsetY - profile.height / 2,
      profile.width,
      profile.height
    );
  }

  drawAttackDebug(rect: Phaser.Geom.Rectangle, color: number) {
    if (!this.debugHitboxes || rect.width <= 0 || rect.height <= 0) return;
    const outline = this.add.graphics().setDepth(300);
    outline.lineStyle(2, color, 0.95);
    outline.strokeRect(rect.x, rect.y, rect.width, rect.height);
    this.tweens.add({
      targets: outline,
      alpha: 0,
      duration: 180,
      ease: 'Quad.out',
      onComplete: () => outline.destroy()
    });
  }

  playImpact(profile: HitboxProfile, x: number, y: number, color: number, radius = 30) {
    if (profile.vfx === 'fx:hit-impact:burst') {
      const fx = this.add.sprite(x, y, assetKeys.hitImpactFx)
        .setScale(0.8)
        .setDepth(70)
        .setBlendMode(Phaser.BlendModes.ADD);
      fx.play(profile.vfx);
      fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
      return;
    }
    this.flashHit(x, y, color, radius);
  }

  flashHit(x: number, y: number, color: number, radius = 30) {
    const burst = this.add.circle(x, y, radius, color, 0.9).setDepth(70).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: burst,
      scale: 2.1,
      alpha: 0,
      duration: 180,
      ease: 'Quad.out',
      onComplete: () => burst.destroy()
    });
  }

  private updateDepths() {
    this.playerController.sprite.setDepth(this.playerController.sprite.y);
    if (this.companion) {
      this.companion.sprite.setDepth(this.companion.sprite.y);
      this.companion.shadow.setDepth(this.companion.sprite.y - 2);
    }
    for (const npc of this.ambientNpcs) {
      const ambientSidewalkBottom = this.getAmbientSidewalkBottom();
      const onSidewalk = npc.sprite.y <= ambientSidewalkBottom + 4;
      npc.sprite.setDepth(onSidewalk ? ambientSidewalkBottom - 2 : npc.sprite.y - 12);
    }
    for (const prop of this.destructibleProps) {
      if (!prop.active) continue;
      prop.sprite.setDepth(prop.occludes ? prop.sprite.y + 4 : this.scaleWorldY(LARGE_PROP_DEPTH));
      prop.sprite.setAlpha(1);
    }
    for (const pickup of this.pickups) {
      if (!pickup.collected) pickup.sprite.setDepth(pickup.sprite.y + 24);
    }
    for (const enemy of this.enemies) {
      enemy.sprite.setDepth(enemy.sprite.y);
      enemy.bar.setDepth(enemy.sprite.y + 2);
    }
  }

  private checkWin() {
    const enemiesLeft = this.enemies.filter((enemy) => enemy.active).length;
    const exit = this.level.exit;
    const exitY = this.scaleWorldY(exit.y);
    if (enemiesLeft > 0) return;
    if (Math.abs(this.playerController.sprite.x - exit.x) < 112 && Math.abs(this.playerController.sprite.y - exitY) < 105) {
      this.completeRouteStop();
    }
  }

  private isActorBehindProp(prop: DestructibleProp) {
    const actors = [this.playerController.sprite, this.companion?.sprite, ...this.enemies.filter((enemy) => enemy.active).map((enemy) => enemy.sprite)]
      .filter((sprite): sprite is ArcadeCharacterSprite => Boolean(sprite));
    return actors.some((sprite) => {
      const closeX = Math.abs(sprite.x - prop.sprite.x) < Math.max(72, prop.hitbox.width * 0.72);
      const sameLane = sprite.y > prop.sprite.y - Math.max(90, prop.hitbox.height * 1.4) && sprite.y <= prop.sprite.y + 18;
      return closeX && sameLane;
    });
  }

  private completeRouteStop() {
    if (this.state.won || this.leavingLevel) return;
    this.state.won = true;
    this.state.paused = false;
    this.playerController.sprite.setVelocity(0, 0);
    this.markLevelCleared(this.level.id);
    const nextLevelId = getNextLevelId(this.level.id);
    if (nextLevelId) {
      this.flashRouteAdvance(nextLevelId);
      return;
    }
    this.playPlayerVictoryPose();
    this.showOutcome(this.level.clearTitle, 'Thailand route finished', 0x75ff43);
  }

  private flashRouteAdvance(nextLevelId: string) {
    this.leavingLevel = true;
    this.restartingLevel = true;
    this.freezeActors();
    const { width, height } = this.scale;
    const banner = this.add.container(width / 2, height * 0.42).setDepth(1200).setScrollFactor(0).setAlpha(0);
    const bg = this.add.rectangle(0, 0, Math.min(620, width - 56), 118, 0x050506, 0.82)
      .setStrokeStyle(3, this.level.theme.accent, 0.95);
    const title = this.add.text(0, -22, 'FINISHED', {
      color: '#75ff43',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '48px',
      stroke: '#000000',
      strokeThickness: 7
    }).setOrigin(0.5);
    const next = this.add.text(0, 28, 'NEXT FIGHT  ->', {
      color: '#ffca3a',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '20px'
    }).setOrigin(0.5);
    banner.add([bg, title, next]);
    this.tweens.add({
      targets: banner,
      alpha: 1,
      y: banner.y - 10,
      duration: 220,
      ease: 'Quad.out',
      onComplete: () => {
        this.time.delayedCall(520, () => {
          this.leavingLevel = false;
          this.openNextLevel(nextLevelId);
        });
      }
    });
  }

  private markLevelCleared(levelId: string) {
    const current = this.registry.get('clearedLevels');
    const cleared = Array.isArray(current) ? current.filter((id): id is string => typeof id === 'string') : [];
    if (!cleared.includes(levelId)) cleared.push(levelId);
    this.registry.set('clearedLevels', cleared);
  }

  playOptionalCharacterAnimation(
    sprite: Phaser.GameObjects.Sprite,
    characterId: string,
    action: string,
    ignoreIfPlaying = true,
    fallback?: string
  ) {
    const targetAction = hasAnimation(characterId, action)
      ? action
      : fallback && hasAnimation(characterId, fallback)
        ? fallback
        : undefined;
    if (!targetAction) return;
    playCharacterAnimation(sprite, characterId, targetAction, ignoreIfPlaying);
  }

  private playPlayerDefeatedPose() {
    if (this.playerDefeatedPose) return;
    this.playerDefeatedPose = true;
    this.playerController.actionLockedUntil = Number.POSITIVE_INFINITY;
    this.playOptionalCharacterAnimation(this.playerController.sprite, this.playerController.id, 'knockdown', false, 'death');
  }

  private playPlayerVictoryPose() {
    if (this.playerVictoryPose) return;
    this.playerVictoryPose = true;
    this.playerController.actionLockedUntil = Number.POSITIVE_INFINITY;
    this.playOptionalCharacterAnimation(this.playerController.sprite, this.playerController.id, 'victory', false, 'idle');
  }

  private showOutcome(title: string, subtitle: string, color: number) {
    if (this.winText || this.koText) return;
    const nextLevelId = title === 'KO' ? undefined : getNextLevelId(this.level.id);
    const actions = [
      ...(nextLevelId ? [{ label: 'NEXT', action: () => this.openNextLevel(nextLevelId) }] : []),
      { label: 'RESTART', action: () => this.restartLevel() },
      { label: 'MENU', action: () => this.openMenu() }
    ];
    const container = this.createScreenOverlay(title, subtitle, color, actions);
    if (title === 'KO') this.koText = container;
    else this.winText = container;
  }

  private getWinSubtitle() {
    return getNextLevelId(this.level.id)
      ? 'Next street unlocked'
      : 'All streets clear';
  }

  private showLevelIntro() {
    if (this.levelIntro) return;
    const progress = getLevelProgress(this.level.id);
    const { width, height } = this.scale;
    const panelWidth = Math.min(660, width - 44);
    const container = this.add.container(width / 2, Math.max(122, height * 0.2))
      .setDepth(950)
      .setScrollFactor(0)
      .setAlpha(0);
    const glow = this.add.rectangle(0, 0, panelWidth + 32, 142, this.level.theme.accent, 0.14)
      .setBlendMode(Phaser.BlendModes.ADD);
    const panel = this.add.rectangle(0, 0, panelWidth, 118, 0x07080c, 0.86)
      .setStrokeStyle(3, this.level.theme.signColor, 0.78);
    const fill = this.add.rectangle(0, 0, panelWidth - 54, 76, 0x050506, 0.36);
    const kicker = this.add.text(0, -38, `STREET ${progress.index}/${progress.total}`, {
      color: '#ffca3a',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '15px'
    }).setOrigin(0.5);
    const title = this.add.text(0, -9, this.level.title, {
      color: Phaser.Display.Color.IntegerToColor(this.level.theme.signColor).rgba,
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: this.level.title.length > 22 ? '34px' : '40px',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    const briefing = this.add.text(0, 34, this.level.briefing, {
      color: '#f4f4f2',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '14px',
      align: 'center',
      wordWrap: { width: panelWidth - 110, useAdvancedWrap: true }
    }).setOrigin(0.5);
    container.add([glow, panel, fill, kicker, title, briefing]);
    this.levelIntro = container;
    this.tweens.add({
      targets: container,
      alpha: 1,
      y: container.y + 10,
      duration: 220,
      ease: 'Quad.out',
      hold: 980,
      yoyo: true,
      onComplete: () => {
        container.destroy();
        if (this.levelIntro === container) this.levelIntro = undefined;
      }
    });
  }

  private showPauseOverlay() {
    if (this.pauseOverlay) return;
    this.pauseOverlay = this.createScreenOverlay('PAUSED', 'Press P to resume', 0xffca3a, [
      {
        label: 'RESUME',
        action: () => {
          this.state.paused = false;
          this.hidePauseOverlay();
          this.sendHud();
        }
      },
      { label: 'RESTART', action: () => this.restartLevel() },
      { label: 'MENU', action: () => this.openMenu() }
    ]);
  }

  private hidePauseOverlay() {
    this.pauseOverlay?.destroy();
    this.pauseOverlay = undefined;
  }

  private createScreenOverlay(
    title: string,
    subtitle: string,
    color: number,
    actions: Array<{ label: string; action: () => void }>
  ) {
    const { width, height } = this.scale;
    const container = this.add.container(width / 2, height / 2).setDepth(1000).setScrollFactor(0);
    const shade = this.add.rectangle(0, 0, width, height, 0x050506, 0.42);
    const panelShadow = this.add.rectangle(0, 7, 620, 238, 0x050506, 0.56);
    const panel = this.add.rectangle(0, 0, 650, 248, 0x0c0d13, 0.94)
      .setStrokeStyle(4, color, 0.82);
    const panelFill = this.add.rectangle(0, 0, 566, 168, 0x07080c, 0.64);
    const text = this.add.text(0, -72, title, {
      color: Phaser.Display.Color.IntegerToColor(color).rgba,
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: title.length > 8 ? '48px' : '58px',
      stroke: '#000000',
      strokeThickness: 7
    }).setOrigin(0.5);
    const sub = this.add.text(0, -10, subtitle, {
      color: '#f4f4f2',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px'
    }).setOrigin(0.5);
    const buttonSpacing = 176;
    const firstX = -((actions.length - 1) * buttonSpacing) / 2;
    const buttons = actions.map((action, index) => (
      this.createOverlayButton(action.label, firstX + index * buttonSpacing, 66, color, action.action)
    ));
    container.add([shade, panelShadow, panel, panelFill, text, sub, ...buttons]);
    return container;
  }

  private createOverlayButton(label: string, x: number, y: number, color: number, action: () => void) {
    const button = this.add.container(x, y);
    let fired = false;
    const hitArea = new Phaser.Geom.Rectangle(-92, -34, 184, 68);
    button.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    const plate = this.add.rectangle(0, 0, 158, 58, 0x11131b, 0.92)
      .setStrokeStyle(3, color, 0.86);
    const bg = this.add.rectangle(0, 0, 124, 33, 0x050506, 0.58);
    const text = this.add.text(0, 0, label, {
      color: '#ffffff',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    button.add([plate, bg, text]);
    button.on('pointerover', () => button.setScale(1.04));
    button.on('pointerout', () => button.setScale(1));
    const fire = (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      if (fired) return;
      fired = true;
      button.disableInteractive();
      button.setScale(1);
      action();
    };
    button.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      button.setScale(0.97);
    });
    button.on('pointerup', fire);
    button.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      button.setScale(1);
    });
    return button;
  }

  private createKeyboardControls() {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    keyboard.enabled = true;
    keyboard.resetKeys();
    const codes = Phaser.Input.Keyboard.KeyCodes;
    this.keyboardControls = {
      left: [keyboard.addKey(codes.A), keyboard.addKey(codes.LEFT)],
      right: [keyboard.addKey(codes.D), keyboard.addKey(codes.RIGHT)],
      up: [keyboard.addKey(codes.W), keyboard.addKey(codes.UP)],
      down: [keyboard.addKey(codes.S), keyboard.addKey(codes.DOWN)],
      attack: [keyboard.addKey(codes.SPACE), keyboard.addKey(codes.J)],
      jump: [keyboard.addKey(codes.C), keyboard.addKey(codes.I)],
      dodge: [keyboard.addKey(codes.SHIFT), keyboard.addKey(codes.K)],
      companionAttack: [keyboard.addKey(codes.U), keyboard.addKey(codes.O)],
      feetCheck: [keyboard.addKey(codes.F)],
      super: [keyboard.addKey(codes.E), keyboard.addKey(codes.L)],
      pause: [keyboard.addKey(codes.P)],
      restart: [keyboard.addKey(codes.R)],
      menu: [keyboard.addKey(codes.ESC)]
    };
    keyboard.addCapture(KEY_CAPTURE);
  }

  private handleGlobalActions() {
    if (this.wasAnyKeyJustDown(this.keyboardControls?.restart)) {
      this.restartLevel();
      return true;
    }
    if (this.wasAnyKeyJustDown(this.keyboardControls?.menu)) {
      this.openMenu();
      return true;
    }
    if (this.feetCheckActive) return false;
    if (touchState.pause || this.wasAnyKeyJustDown(this.keyboardControls?.pause)) {
      if (!this.state.won && this.state.hp > 0) {
        this.state.paused = !this.state.paused;
        if (!this.state.paused) this.hidePauseOverlay();
      }
    }
    return false;
  }

  private restartLevel() {
    if (this.leavingLevel) return;
    this.leavingLevel = true;
    this.restartingLevel = true;
    clearMomentaryActions();
    this.scene.restart();
  }

  private openNextLevel(levelId: string) {
    if (this.leavingLevel) return;
    this.leavingLevel = true;
    this.restartingLevel = true;
    this.registry.set('selectedLevel', levelId);
    clearMomentaryActions();
    this.scene.restart();
  }

  private openMenu() {
    if (this.leavingLevel) return;
    this.leavingLevel = true;
    clearMomentaryActions();
    this.input.keyboard?.resetKeys();
    window.dispatchEvent(new CustomEvent('slap:level-state', { detail: { active: false } }));
    this.scene.start('MenuScene');
  }

  private freezeActors() {
    this.playerController.sprite.setVelocity(0, 0);
    this.companion?.sprite.setVelocity(0, 0);
    this.enemies.forEach((enemy) => enemy.sprite.setVelocity(0, 0));
  }

  private getMoveInput() {
    const keyboardX = this.getKeyAxis(this.keyboardControls?.left, this.keyboardControls?.right);
    const keyboardY = this.getKeyAxis(this.keyboardControls?.up, this.keyboardControls?.down);
    return {
      moveX: Phaser.Math.Clamp(touchState.moveX + keyboardX, -1, 1),
      moveY: Phaser.Math.Clamp(touchState.moveY + keyboardY, -1, 1)
    };
  }

  private getKeyAxis(negative?: Phaser.Input.Keyboard.Key[], positive?: Phaser.Input.Keyboard.Key[]) {
    return (this.isAnyKeyDown(positive) ? 1 : 0) - (this.isAnyKeyDown(negative) ? 1 : 0);
  }

  private wantsAttack() {
    return touchState.attack || this.wasAnyKeyJustDown(this.keyboardControls?.attack);
  }

  private wantsDodge() {
    return touchState.dodge || this.wasAnyKeyJustDown(this.keyboardControls?.dodge);
  }

  private wantsCompanionAttack() {
    return touchState.companionAttack || this.wasAnyKeyJustDown(this.keyboardControls?.companionAttack);
  }

  private wantsFeetCheck() {
    return touchState.feetCheck || this.wasAnyKeyJustDown(this.keyboardControls?.feetCheck);
  }

  private wantsJump() {
    return touchState.jump || this.wasAnyKeyJustDown(this.keyboardControls?.jump);
  }

  private wantsSuper() {
    return touchState.super || this.wasAnyKeyJustDown(this.keyboardControls?.super);
  }

  private isAnyKeyDown(keys?: Phaser.Input.Keyboard.Key[]) {
    return Boolean(keys?.some((key) => key.isDown));
  }

  private wasAnyKeyJustDown(keys?: Phaser.Input.Keyboard.Key[]) {
    return Boolean(keys?.some((key) => Phaser.Input.Keyboard.JustDown(key)));
  }

  private sendHud() {
    if (!this.state) return;
    const progress = getLevelProgress(this.level.id);
    const enemiesLeft = this.enemies.filter((enemy) => enemy.active).length;
    const objective = this.state.won
      ? `${this.level.title} clear`
      : enemiesLeft > 0
        ? `${this.level.title}: ${enemiesLeft} rival${enemiesLeft === 1 ? '' : 's'}`
        : `Reach ${this.level.exitLabel}`;
    const nearbyFeetCheckNpc = this.getNearbyFeetCheckNpc();
    const feetCheckCharacter = this.feetCheckNpc
      ? getCharacter(this.feetCheckNpc.characterId)
      : nearbyFeetCheckNpc
        ? getCharacter(nearbyFeetCheckNpc.characterId)
        : undefined;
    const snapshot: HudSnapshot = {
      playerName: this.playerController.def.displayName,
      handle: this.playerController.def.handle,
      portrait: this.playerController.def.seed.path,
      hp: this.state.hp,
      maxHp: this.state.maxHp,
      meter: this.state.meter,
      maxMeter: this.state.maxMeter,
      score: this.state.score,
      enemiesLeft,
      levelTitle: this.level.title,
      levelIndex: progress.index,
      levelTotal: progress.total,
      objective,
      paused: this.state.paused,
      rushReady: this.playerController.dodgeCooldown <= 0,
      rushCooldownRatio: Phaser.Math.Clamp(this.playerController.dodgeCooldown / PLAYER_DODGE_COOLDOWN_SECONDS, 0, 1),
      companionName: this.companion?.character.displayName ?? 'Dang',
      companionPortrait: SOI_DOG_BUTTON_PORTRAIT,
      companionReady: (this.companion?.specialCooldown ?? 0) <= 0,
      companionCooldownRatio: Phaser.Math.Clamp((this.companion?.specialCooldown ?? 0) / SOI_DOG_SPECIAL_COOLDOWN_SECONDS, 0, 1),
      feetCheckAvailable: Boolean(nearbyFeetCheckNpc),
      feetCheckActive: this.feetCheckActive,
      feetCheckName: feetCheckCharacter?.displayName
    };
    window.dispatchEvent(new CustomEvent('slap:hud', { detail: snapshot }));
  }
}
