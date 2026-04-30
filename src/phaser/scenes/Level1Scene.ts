import Phaser from 'phaser';
import { playCharacterAnimation } from '../../game/assets/loaders';
import { assetKeys } from '../../game/assets/manifest';
import { getCharacter, getPlayerCharacter, hasAnimation, type CharacterDefinition, type PlayerId } from '../../game/content/characters';
import {
  getAiProfile,
  getHitboxProfile,
  getHurtboxProfile,
  type AiProfile,
  type HitboxProfile
} from '../../game/content/combatProfiles';
import { clearMomentaryActions, touchState } from '../../game/input/actions';
import { createSessionState, type GameSessionState, type HudSnapshot } from '../../game/simulation/state';
import { createCharacterSprite, type ArcadeCharacterSprite } from '../factories/characterFactory';

type Enemy = {
  sprite: ArcadeCharacterSprite;
  character: CharacterDefinition;
  hp: number;
  maxHp: number;
  cooldown: number;
  stunned: number;
  knockback: number;
  engageDelay: number;
  bar: Phaser.GameObjects.Graphics;
  active: boolean;
};

type Companion = {
  sprite: ArcadeCharacterSprite;
  character: CharacterDefinition;
  shadow: Phaser.GameObjects.Image;
  specialCooldown: number;
  specialRush: number;
  supportRush: number;
  specialDirection: number;
  hitEnemies: Set<Enemy>;
  actionLockedUntil: number;
};

type DestructibleProp = {
  sprite: Phaser.GameObjects.Image;
  hitbox: Phaser.Geom.Rectangle;
  hp: number;
  fxKey: string;
  dropKind: PickupKind;
  active: boolean;
  occludes: boolean;
};

type PickupKind = 'coin' | 'health' | 'meter';

type Pickup = {
  sprite: Phaser.GameObjects.Image;
  kind: PickupKind;
  value: number;
  lifetime: number;
  collected: boolean;
};

type StoredVelocity = {
  x: number;
  y: number;
};

type KeyboardControls = {
  left: Phaser.Input.Keyboard.Key[];
  right: Phaser.Input.Keyboard.Key[];
  up: Phaser.Input.Keyboard.Key[];
  down: Phaser.Input.Keyboard.Key[];
  attack: Phaser.Input.Keyboard.Key[];
  dodge: Phaser.Input.Keyboard.Key[];
  companionAttack: Phaser.Input.Keyboard.Key[];
  jump: Phaser.Input.Keyboard.Key[];
  super: Phaser.Input.Keyboard.Key[];
  pause: Phaser.Input.Keyboard.Key[];
  restart: Phaser.Input.Keyboard.Key[];
  menu: Phaser.Input.Keyboard.Key[];
};

const WORLD_WIDTH = 2200;
const WORLD_HEIGHT = 720;
const LANE_TOP = 505;
const LANE_BOTTOM = 640;
const LARGE_PROP_DEPTH = LANE_TOP - 10;
const EXIT_X = 315;
const PLAYER_START = { x: 520, y: 584 };
const WEED_VENDOR_START = { x: 1095, y: 570 };
const ENEMY_STARTS = [
  { id: 'street-punk', x: 1325, y: 585, engageDelay: 0 },
  { id: 'rival-artist', x: 1510, y: 612, engageDelay: 2.4 },
  { id: 'corrupt-bouncer', x: 1740, y: 568, engageDelay: 4.8 }
] as const;
const KEY_CAPTURE = 'W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,J,C,I,SHIFT,K,U,O,E,L,P,R,ESC';
const PLAYER_DODGE_SECONDS = 0.48;
const PLAYER_DODGE_COOLDOWN_SECONDS = 5;
const PLAYER_DODGE_INVULN_SECONDS = 0.46;
const PLAYER_DODGE_SPEED = 1160;
const RUSH_DAMAGE = 4;
const RUSH_KNOCKBACK = 620;
const RUSH_STUN_SECONDS = 0.28;
const PLAYER_JUMP_SECONDS = 0.46;
const PLAYER_JUMP_COOLDOWN_SECONDS = 0.58;
const PLAYER_JUMP_HEIGHT = 164;
const PLAYER_JUMP_PEAK_MIN = 0.24;
const PLAYER_JUMP_PEAK_MAX = 0.78;
const KNOCKBACK_COAST_SECONDS = 0.14;
const MAX_ADVANCING_ENEMIES = 2;
const MAX_ATTACKING_ENEMIES = 1;
const SOI_DOG_ID = 'soi-dog';
const SOI_DOG_BUTTON_PORTRAIT = 'assets/generated/ui/dang-portrait-button.png';
const SOI_DOG_FOLLOW_OFFSET_X = 118;
const SOI_DOG_FOLLOW_OFFSET_Y = 24;
const SOI_DOG_SPECIAL_COOLDOWN_SECONDS = 5;
const SOI_DOG_SPECIAL_SECONDS = 0.62;
const SOI_DOG_SPECIAL_SPEED = 980;
const SOI_DOG_SPECIAL_DAMAGE = 10;
const SOI_DOG_SPECIAL_KNOCKBACK = 520;
const SOI_DOG_SPECIAL_STUN_SECONDS = 0.32;
const SOI_DOG_SPECIAL_LOCK_MS = 640;
const SOI_DOG_CATCHUP_DISTANCE = 320;
const PICKUP_COLLECT_DISTANCE = 72;

export class Level1Scene extends Phaser.Scene {
  private player!: ArcadeCharacterSprite;
  private playerDef!: CharacterDefinition;
  private playerId!: PlayerId;
  private state!: GameSessionState;
  private enemies: Enemy[] = [];
  private destructibleProps: DestructibleProp[] = [];
  private pickups: Pickup[] = [];
  private companion?: Companion;
  private facing = 1;
  private attackCooldown = 0;
  private dodgeCooldown = 0;
  private jumpCooldown = 0;
  private superCooldown = 0;
  private playerJump = 0;
  private playerBaseDisplayOriginY = 0;
  private playerDodge = 0;
  private playerStunned = 0;
  private playerKnockback = 0;
  private playerInvuln = 0;
  private playerActionLockedUntil = 0;
  private hitStopUntil = 0;
  private hitStopVelocities = new Map<ArcadeCharacterSprite, StoredVelocity>();
  private winText?: Phaser.GameObjects.Container;
  private koText?: Phaser.GameObjects.Container;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private exitGlow?: Phaser.GameObjects.Graphics;
  private debugHitboxes = false;
  private keyboardControls?: KeyboardControls;
  private restartingLevel = false;
  private leavingLevel = false;
  private playerDefeatedPose = false;
  private playerVictoryPose = false;
  private rushedEnemies = new Set<Enemy>();
  private playerShadow?: Phaser.GameObjects.Image;
  private dustStepDistance = 0;

  constructor() {
    super('Level1Scene');
  }

  create() {
    this.resetRuntimeFields();
    this.restartingLevel = false;
    this.leavingLevel = false;
    this.debugHitboxes = new URLSearchParams(window.location.search).has('debugHitboxes');
    window.dispatchEvent(new CustomEvent('slap:hud-reset'));

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#07080c');
    this.cameras.main.setRoundPixels(true);
    this.input.setTopOnly(true);
    this.createKeyboardControls();

    this.createWorld();
    this.createActors();

    this.cameras.main.startFollow(this.player, true, 0.09, 0.08, 0, 56);
    this.sendHud();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
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
    this.destructibleProps = [];
    this.pickups = [];
    this.facing = 1;
    this.attackCooldown = 0;
    this.dodgeCooldown = 0;
    this.jumpCooldown = 0;
    this.superCooldown = 0;
    this.playerJump = 0;
    this.playerBaseDisplayOriginY = 0;
    this.playerDodge = 0;
    this.playerStunned = 0;
    this.playerKnockback = 0;
    this.playerInvuln = 0;
    this.playerActionLockedUntil = 0;
    this.hitStopUntil = 0;
    this.hitStopVelocities.clear();
    this.winText = undefined;
    this.koText = undefined;
    this.pauseOverlay = undefined;
    this.exitGlow = undefined;
    this.keyboardControls = undefined;
    this.leavingLevel = false;
    this.playerDefeatedPose = false;
    this.playerVictoryPose = false;
    this.rushedEnemies.clear();
    this.playerShadow = undefined;
    this.companion = undefined;
    this.dustStepDistance = 0;
    clearMomentaryActions();
  }

  update(_: number, deltaMs: number) {
    const dt = Math.min(0.035, deltaMs / 1000);

    if (this.handleGlobalActions()) {
      clearMomentaryActions();
      return;
    }

    if (this.updateHitStop()) {
      this.sendHud();
      clearMomentaryActions();
      return;
    }

    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
    this.superCooldown = Math.max(0, this.superCooldown - dt);
    this.playerDodge = Math.max(0, this.playerDodge - dt);
    this.playerStunned = Math.max(0, this.playerStunned - dt);
    this.playerKnockback = Math.max(0, this.playerKnockback - dt);
    this.playerInvuln = Math.max(0, this.playerInvuln - dt);

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
      this.playPlayerVictoryPose();
      this.showOutcome('SHOP CLEAR', 'Press R to restart or Esc for menu', 0x75ff43);
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
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateCompanion(dt);
    this.updatePickups(dt);
    this.updateDepths();
    this.checkWin();
    this.sendHud();
    clearMomentaryActions();
  }

  private updateHitStop() {
    if (this.hitStopUntil <= 0) return false;
    if (this.time.now < this.hitStopUntil) {
      this.freezeHitStopActors();
      return true;
    }
    this.restoreHitStopVelocities();
    this.hitStopUntil = 0;
    return false;
  }

  private startHitStop(durationMs: number) {
    const duration = Phaser.Math.Clamp(durationMs, 0, 150);
    if (duration <= 0) return;
    if (this.hitStopUntil <= this.time.now) {
      this.captureHitStopVelocities();
    }
    this.hitStopUntil = Math.max(this.hitStopUntil, this.time.now + duration);
    this.freezeHitStopActors();
  }

  private captureHitStopVelocities() {
    this.hitStopVelocities.clear();
    this.captureSpriteVelocity(this.player);
    if (this.companion) this.captureSpriteVelocity(this.companion.sprite);
    for (const enemy of this.enemies) {
      if (enemy.active) this.captureSpriteVelocity(enemy.sprite);
    }
  }

  private captureSpriteVelocity(sprite: ArcadeCharacterSprite) {
    if (!sprite.body.enable) return;
    this.hitStopVelocities.set(sprite, {
      x: sprite.body.velocity.x,
      y: sprite.body.velocity.y
    });
  }

  private freezeHitStopActors() {
    for (const sprite of this.hitStopVelocities.keys()) {
      if (sprite.body.enable) sprite.setVelocity(0, 0);
    }
  }

  private restoreHitStopVelocities() {
    for (const [sprite, velocity] of this.hitStopVelocities) {
      if (sprite.body.enable) sprite.setVelocity(velocity.x, velocity.y);
    }
    this.hitStopVelocities.clear();
  }

  private createWorld() {
    this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, assetKeys.backgroundFar)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(-20)
      .setScrollFactor(0.25);
    const bg = this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, assetKeys.background)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(-15)
      .setScrollFactor(0.65);
    bg.y = 360;

    this.add.rectangle(WORLD_WIDTH / 2, 610, WORLD_WIDTH, 150, 0x050506, 0.16).setDepth(-5);
    this.add.rectangle(WORLD_WIDTH / 2, 492, WORLD_WIDTH, 4, 0x00dfff, 0.14).setDepth(-4);

    const props: Array<{
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
    }> = [
      { key: assetKeys.propRollingShutter, x: 200, y: 488, scale: 0.62, depth: -8 },
      { key: assetKeys.propBeerNeonSign, x: 405, y: 372, scale: 0.42, depth: -7 },
      {
        key: assetKeys.propPottedPlant,
        x: 460,
        y: 660,
        scale: 0.4,
        destructible: true,
        fxKey: 'fx:destructible:plant-chair:break',
        dropKind: 'health',
        hitbox: { width: 74, height: 92, offsetY: -44 },
        occludes: true
      },
      {
        key: assetKeys.propTrafficCone,
        x: 690,
        y: 654,
        scale: 0.32,
        destructible: true,
        fxKey: 'fx:destructible:street-clutter:break',
        dropKind: 'coin',
        hitbox: { width: 64, height: 84, offsetY: -38 },
        occludes: true
      },
      {
        key: assetKeys.propStreetFoodCart,
        x: 870,
        y: 648,
        scale: 0.55,
        depth: LARGE_PROP_DEPTH,
        destructible: true,
        fxKey: 'fx:destructible:street-clutter:break',
        hp: 2,
        dropKind: 'health',
        hitbox: { width: 168, height: 104, offsetY: -54 }
      },
      {
        key: assetKeys.propGreenScooter,
        x: 1180,
        y: 660,
        scale: 0.46,
        flipX: true,
        depth: LARGE_PROP_DEPTH,
        destructible: true,
        fxKey: 'fx:destructible:scooter:break',
        hp: 2,
        dropKind: 'meter',
        hitbox: { width: 164, height: 88, offsetY: -42 }
      },
      {
        key: assetKeys.propTattooSandwichBoard,
        x: 360,
        y: 666,
        scale: 0.42,
        depth: LARGE_PROP_DEPTH,
        destructible: true,
        fxKey: 'fx:destructible:street-clutter:break',
        dropKind: 'coin',
        hitbox: { width: 88, height: 116, offsetY: -58 }
      },
      {
        key: assetKeys.propTrashBin,
        x: 1390,
        y: 658,
        scale: 0.36,
        depth: LARGE_PROP_DEPTH,
        destructible: true,
        fxKey: 'fx:destructible:street-clutter:break',
        dropKind: 'coin',
        hitbox: { width: 82, height: 96, offsetY: -46 }
      },
      { key: assetKeys.propCableBundle, x: 1570, y: 472, scale: 0.55, depth: -6 },
      {
        key: assetKeys.propRedScooter,
        x: 1660,
        y: 658,
        scale: 0.46,
        depth: LARGE_PROP_DEPTH,
        destructible: true,
        fxKey: 'fx:destructible:scooter:break',
        hp: 2,
        dropKind: 'meter',
        hitbox: { width: 164, height: 88, offsetY: -42 }
      },
      {
        key: assetKeys.propWeedSandwichBoard,
        x: 1820,
        y: 666,
        scale: 0.42,
        depth: LARGE_PROP_DEPTH,
        destructible: true,
        fxKey: 'fx:destructible:street-clutter:break',
        dropKind: 'coin',
        hitbox: { width: 88, height: 116, offsetY: -58 }
      },
      {
        key: assetKeys.propInkBottle,
        x: 1980,
        y: 654,
        scale: 0.28,
        destructible: true,
        fxKey: 'fx:destructible:plant-chair:break',
        dropKind: 'meter',
        hitbox: { width: 62, height: 82, offsetY: -36 },
        occludes: true
      },
      {
        key: assetKeys.propPottedPlant,
        x: 2080,
        y: 666,
        scale: 0.42,
        destructible: true,
        fxKey: 'fx:destructible:plant-chair:break',
        dropKind: 'health',
        hitbox: { width: 76, height: 94, offsetY: -44 },
        occludes: true
      },
      {
        key: assetKeys.propStickerChair,
        x: 1305,
        y: 660,
        scale: 0.4,
        destructible: true,
        fxKey: 'fx:destructible:plant-chair:break',
        dropKind: 'coin',
        hitbox: { width: 92, height: 82, offsetY: -38 },
        occludes: true
      }
    ];
    for (const p of props) {
      const img = this.add.image(p.x, p.y, p.key).setOrigin(0.5, 1).setScale(p.scale);
      const occludes = Boolean(p.occludes);
      img.setDepth(p.depth ?? (occludes ? p.y + 4 : LARGE_PROP_DEPTH));
      if (p.flipX) img.setFlipX(true);
      if (p.destructible && p.fxKey && p.dropKind && p.hitbox) {
        this.destructibleProps.push({
          sprite: img,
          hitbox: new Phaser.Geom.Rectangle(
            p.x - p.hitbox.width / 2,
            p.y + (p.hitbox.offsetY ?? -p.hitbox.height / 2) - p.hitbox.height / 2,
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

    this.exitGlow = this.add.graphics().setDepth(3);
    this.exitGlow.lineStyle(3, 0xef2b2d, 0.9);
    this.exitGlow.strokeRoundedRect(EXIT_X - 72, 430, 144, 160, 8);
    this.exitGlow.lineStyle(1, 0xffca3a, 0.8);
    this.exitGlow.strokeRoundedRect(EXIT_X - 82, 420, 164, 180, 8);

    this.add.text(EXIT_X, 404, 'TATTOO', {
      color: '#ff4d4d',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '28px',
      stroke: '#07080c',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(4);
  }

  private createActors() {
    this.playerDef = getPlayerCharacter(this.registry.get('selectedPlayer'));
    this.playerId = this.playerDef.id as PlayerId;
    this.state = createSessionState(this.playerId, this.playerDef.stats.maxHp);

    const vendorDef = getCharacter('weed-vendor');
    const vendor = createCharacterSprite(this, vendorDef, WEED_VENDOR_START.x, WEED_VENDOR_START.y, {
      action: 'idle',
      immovable: true,
      flipX: true
    });
    vendor.body.enable = false;
    this.tweens.add({
      targets: vendor,
      y: vendor.y - 5,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    this.player = createCharacterSprite(this, this.playerDef, PLAYER_START.x, PLAYER_START.y, {
      action: 'idle',
      collideWorldBounds: true,
      drag: 1200
    });
    this.playerBaseDisplayOriginY = this.player.displayOriginY;

    this.playerShadow = this.add.image(this.player.x, PLAYER_START.y + 6, assetKeys.propPuddleDecal)
      .setOrigin(0.5, 0.5)
      .setScale(0.42)
      .setAlpha(0.55)
      .setDepth(this.player.y - 1);

    this.createCompanion();
    this.enemies = ENEMY_STARTS.map((spawn) => this.makeEnemy(spawn.id, spawn.x, spawn.y, spawn.engageDelay));
  }

  private createCompanion() {
    const character = getCharacter(SOI_DOG_ID);
    const x = PLAYER_START.x - this.facing * SOI_DOG_FOLLOW_OFFSET_X;
    const y = Phaser.Math.Clamp(PLAYER_START.y + SOI_DOG_FOLLOW_OFFSET_Y, LANE_TOP, LANE_BOTTOM);
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

    this.companion = {
      sprite,
      character,
      shadow,
      specialCooldown: 0,
      specialRush: 0,
      supportRush: 0,
      specialDirection: 1,
      hitEnemies: new Set<Enemy>(),
      actionLockedUntil: 0
    };
  }

  private makeEnemy(characterId: string, x: number, y: number, engageDelay: number): Enemy {
    const character = getCharacter(characterId);
    const enemy = createCharacterSprite(this, character, x, y, {
      action: 'idle',
      collideWorldBounds: true,
      drag: 900,
      flipX: true
    });
    const bar = this.add.graphics().setDepth(20);
    const wrapped: Enemy = {
      sprite: enemy,
      character,
      hp: character.stats.maxHp,
      maxHp: character.stats.maxHp,
      cooldown: Phaser.Math.FloatBetween(1.1, 1.8) + engageDelay * 0.25,
      stunned: 0,
      knockback: 0,
      engageDelay,
      bar,
      active: true
    };
    this.drawEnemyBar(wrapped);
    return wrapped;
  }

  private updatePlayer(dt: number) {
    const { moveX, moveY } = this.getMoveInput();
    const jumping = this.updatePlayerJump(dt);

    if (this.playerKnockback <= 0 && this.playerStunned <= 0 && this.playerDodge <= 0) {
      if (moveX < -0.08) this.facing = -1;
      if (moveX > 0.08) this.facing = 1;
    }
    this.player.setFlipX(this.facing < 0);

    if (this.playerKnockback > 0) {
      this.cancelPlayerJump();
      this.clampPlayerToLane();
      this.updatePlayerInvulnAlpha();
      return;
    }

    if (this.playerStunned > 0) {
      this.cancelPlayerJump();
      this.player.setVelocity(0, 0);
      if (!this.player.anims.isPlaying) {
        this.playOptionalCharacterAnimation(this.player, this.playerId, 'stunned', true, 'hurt');
      }
      this.clampPlayerToLane();
      this.updatePlayerInvulnAlpha();
      return;
    }

    if (this.playerDodge > 0) {
      this.resolveRushHits();
      this.clampPlayerToLane();
      this.updatePlayerInvulnAlpha();
      return;
    }

    if (this.wantsJump() && this.jumpCooldown <= 0 && !jumping) {
      this.jump(moveX);
    }

    if (this.wantsDodge() && this.dodgeCooldown <= 0) {
      this.cancelPlayerJump();
      this.dodge(moveX, moveY);
      this.clampPlayerToLane();
      this.updatePlayerInvulnAlpha();
      return;
    }

    this.player.setVelocity(moveX * this.playerDef.stats.speed, moveY * this.playerDef.stats.speed * 0.42);
    this.clampPlayerToLane();

    if (this.wantsAttack() && this.attackCooldown <= 0) {
      this.basicAttack();
    }

    if (this.wantsSuper() && this.superCooldown <= 0 && this.state.meter >= this.state.maxMeter) {
      this.superSlap();
    }

    // Spawn dust puff every ~80px of horizontal travel while grounded
    if (this.playerJump <= 0 && this.playerKnockback <= 0 && this.playerStunned <= 0) {
      const speedX = Math.abs(this.player.body.velocity.x);
      if (speedX > 60) {
        this.dustStepDistance += speedX * dt;
        if (this.dustStepDistance > 80) {
          this.dustStepDistance = 0;
          const dust = this.add.sprite(this.player.x - this.facing * 18, this.player.y + 4, assetKeys.dustStepFx)
            .setScale(0.55)
            .setAlpha(0.7)
            .setDepth(this.player.y - 2);
          dust.play('fx:dust-step:puff');
          dust.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => dust.destroy());
        }
      } else {
        this.dustStepDistance = Math.max(0, this.dustStepDistance - dt * 60);
      }
    }

    const moving = Math.abs(moveX) + Math.abs(moveY) > 0.08;
    if (this.time.now > this.playerActionLockedUntil) {
      playCharacterAnimation(this.player, this.playerId, moving ? 'walk' : 'idle');
    }

    this.updatePlayerInvulnAlpha();
    this.updatePlayerShadow();

    if (dt > 0) {
      this.clampPlayerToLane();
    }
  }

  private updatePlayerShadow() {
    if (!this.playerShadow) return;
    this.playerShadow.setPosition(this.player.x, this.player.y + 6);
    this.playerShadow.setDepth(this.player.y - 1);
    const lift = this.playerJump > 0 ? 1 - (this.playerJump / PLAYER_JUMP_SECONDS) : 0;
    const liftCurve = Math.sin(lift * Math.PI);
    this.playerShadow.setScale(0.42 * (1 - liftCurve * 0.45));
    this.playerShadow.setAlpha(0.55 * (1 - liftCurve * 0.5));
  }

  private updateCompanion(dt: number) {
    if (!this.companion) return;
    const { sprite, character } = this.companion;

    this.companion.specialCooldown = Math.max(0, this.companion.specialCooldown - dt);
    this.companion.specialRush = Math.max(0, this.companion.specialRush - dt);
    this.companion.supportRush = Math.max(0, this.companion.supportRush - dt);

    if (this.wantsCompanionAttack() && this.companion.specialCooldown <= 0) {
      this.startCompanionSpecial();
    }

    if (this.companion.specialRush > 0) {
      const direction = this.companion.specialDirection || this.facing || 1;
      sprite.setFlipX(direction < 0);
      sprite.setVelocity(direction * SOI_DOG_SPECIAL_SPEED, 0);
      this.resolveCompanionSpecialHits();
      this.updateCompanionShadow();
      return;
    }

    if (this.companion.supportRush > 0) {
      const direction = this.facing || 1;
      const targetY = Phaser.Math.Clamp(this.player.y + SOI_DOG_FOLLOW_OFFSET_Y, LANE_TOP, LANE_BOTTOM);
      sprite.setFlipX(direction < 0);
      sprite.setVelocity(direction * PLAYER_DODGE_SPEED * 0.96, (targetY - sprite.y) * 8);
      playCharacterAnimation(sprite, character.id, 'walk');
      this.updateCompanionShadow();
      return;
    }

    if (this.time.now < this.companion.actionLockedUntil) {
      sprite.setVelocity(0, 0);
      this.updateCompanionShadow();
      return;
    }

    const targetX = Phaser.Math.Clamp(this.player.x - this.facing * SOI_DOG_FOLLOW_OFFSET_X, 120, WORLD_WIDTH - 120);
    const targetY = Phaser.Math.Clamp(this.player.y + SOI_DOG_FOLLOW_OFFSET_Y, LANE_TOP, LANE_BOTTOM);
    const dx = targetX - sprite.x;
    const dy = targetY - sprite.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 8 && dt > 0) {
      const speed = distance > SOI_DOG_CATCHUP_DISTANCE
        ? character.stats.speed * 1.55
        : character.stats.speed;
      sprite.setVelocity((dx / distance) * speed, (dy / distance) * speed * 0.65);
    } else {
      sprite.setVelocity(0, 0);
      sprite.setPosition(targetX, targetY);
    }

    const moving = distance > 18 || Math.abs(sprite.body.velocity.x) > 24 || Math.abs(sprite.body.velocity.y) > 18;
    const facing = moving && Math.abs(dx) > 4 ? Math.sign(dx) : this.facing;
    sprite.setFlipX(facing < 0);
    sprite.y = Phaser.Math.Clamp(sprite.y, LANE_TOP, LANE_BOTTOM);
    playCharacterAnimation(sprite, character.id, moving ? 'walk' : 'idle');
    this.updateCompanionShadow();
  }

  private startCompanionSpecial() {
    if (!this.companion) return;
    const { sprite, character } = this.companion;
    const direction = this.facing || 1;
    this.companion.specialCooldown = SOI_DOG_SPECIAL_COOLDOWN_SECONDS;
    this.companion.specialRush = SOI_DOG_SPECIAL_SECONDS;
    this.companion.supportRush = 0;
    this.companion.specialDirection = direction;
    this.companion.hitEnemies.clear();
    this.companion.actionLockedUntil = this.time.now + SOI_DOG_SPECIAL_LOCK_MS;
    sprite.setFlipX(direction < 0);
    this.playOptionalCharacterAnimation(sprite, character.id, 'special-attack', false, 'idle');
    sprite.setVelocity(direction * SOI_DOG_SPECIAL_SPEED, 0);
    this.flashHit(sprite.x + direction * 42, sprite.y - 44, 0xffca3a, 16);
  }

  private startCompanionSupportRush(direction: number) {
    if (!this.companion || this.companion.specialRush > 0) return;
    const { sprite, character } = this.companion;
    if (Math.abs(sprite.x - this.player.x) > 260) {
      sprite.setPosition(this.player.x - direction * SOI_DOG_FOLLOW_OFFSET_X, this.player.y + SOI_DOG_FOLLOW_OFFSET_Y);
    }
    this.companion.supportRush = PLAYER_DODGE_SECONDS;
    this.companion.actionLockedUntil = Math.max(this.companion.actionLockedUntil, this.time.now + PLAYER_DODGE_SECONDS * 1000);
    sprite.setFlipX(direction < 0);
    playCharacterAnimation(sprite, character.id, 'walk');
  }

  private resolveCompanionSpecialHits() {
    if (!this.companion) return;
    const { sprite } = this.companion;
    const direction = this.companion.specialDirection || 1;
    const biteRect = new Phaser.Geom.Rectangle(
      sprite.x + direction * 72 - 84,
      sprite.y - 82,
      168,
      82
    );
    this.drawAttackDebug(biteRect, 0xffca3a);

    for (const enemy of this.enemies) {
      if (!enemy.active || this.companion.hitEnemies.has(enemy)) continue;
      if (Math.abs(enemy.sprite.y - sprite.y) > 64) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(biteRect, this.getHurtboxRect(enemy.sprite, enemy.character))) continue;
      this.companion.hitEnemies.add(enemy);
      this.damageEnemy(enemy, SOI_DOG_SPECIAL_DAMAGE, SOI_DOG_SPECIAL_KNOCKBACK, SOI_DOG_SPECIAL_STUN_SECONDS, direction);
      this.flashHit(enemy.sprite.x, enemy.sprite.y - 86, 0xffca3a, 24);
      this.cameras.main.shake(80, 0.004);
      this.startHitStop(55);
    }
    this.hitDestructibleProps(biteRect, 2, direction);
  }

  private updateCompanionShadow() {
    if (!this.companion) return;
    const { sprite, shadow } = this.companion;
    shadow.setPosition(sprite.x, sprite.y + 3);
    shadow.setDepth(sprite.y - 2);
  }

  private clampPlayerToLane() {
    this.player.x = Phaser.Math.Clamp(this.player.x, 120, WORLD_WIDTH - 120);
    this.player.y = Phaser.Math.Clamp(this.player.y, LANE_TOP, LANE_BOTTOM);
  }

  private updatePlayerInvulnAlpha() {
    if (this.playerInvuln > 0) {
      this.player.setAlpha(this.time.now % 120 < 60 ? 0.58 : 1);
    } else {
      this.player.setAlpha(1);
    }
  }

  private updateEnemies(dt: number) {
    const pressureOrder = this.getEnemyPressureOrder();

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      enemy.stunned = Math.max(0, enemy.stunned - dt);
      enemy.knockback = Math.max(0, enemy.knockback - dt);

      const dx = this.player.x - enemy.sprite.x;
      const dy = this.player.y - enemy.sprite.y;
      const distance = Math.hypot(dx, dy);
      const ai = getAiProfile(enemy.character.combat.aiProfile);
      const attack = getHitboxProfile(enemy.character.combat.hitboxProfile);

      enemy.sprite.setFlipX(dx < 0);
      enemy.sprite.y = Phaser.Math.Clamp(enemy.sprite.y, LANE_TOP, LANE_BOTTOM);

      if (enemy.engageDelay > 0) {
        enemy.engageDelay = Math.max(0, enemy.engageDelay - dt);
        enemy.sprite.setVelocity(0, 0);
        playCharacterAnimation(enemy.sprite, enemy.character.id, 'idle');
        this.drawEnemyBar(enemy);
        continue;
      }

      if (enemy.knockback > 0) {
        this.drawEnemyBar(enemy);
        continue;
      }

      if (enemy.stunned > 0) {
        enemy.sprite.setVelocity(0, 0);
        if (!enemy.sprite.anims.isPlaying) {
          this.playOptionalCharacterAnimation(enemy.sprite, enemy.character.id, 'stunned', true, 'hurt');
        }
        this.drawEnemyBar(enemy);
        continue;
      }

      const pressureRank = pressureOrder.indexOf(enemy);
      const canAdvance = pressureRank >= 0 && pressureRank < MAX_ADVANCING_ENEMIES;
      const canAttack = pressureRank >= 0 && pressureRank < MAX_ATTACKING_ENEMIES;

      if (distance < ai.aggroRange) {
        const direction = Math.sign(dx) || 1;
        const supportRange = pressureRank > 0 ? 64 * pressureRank : 0;
        const preferredRange = ai.preferredRange + supportRange;
        const shouldAdvance = canAdvance && Math.abs(dx) > preferredRange;
        const shouldBackOff = pressureRank > 0 && Math.abs(dx) < preferredRange - 26;
        const xSpeed = shouldAdvance
          ? direction * enemy.character.stats.speed * (pressureRank === 0 ? 1 : 0.72)
          : shouldBackOff
            ? -direction * enemy.character.stats.speed * 0.45
            : 0;
        const ySpeed = Phaser.Math.Clamp(dy * 3.2 * ai.laneSpeedMultiplier, -85, 85);
        enemy.sprite.setVelocity(xSpeed, canAdvance ? ySpeed : 0);
        playCharacterAnimation(enemy.sprite, enemy.character.id, shouldAdvance ? 'walk' : 'idle');
      } else {
        enemy.sprite.setVelocity(0, 0);
        playCharacterAnimation(enemy.sprite, enemy.character.id, 'idle');
      }

      enemy.sprite.y = Phaser.Math.Clamp(enemy.sprite.y, LANE_TOP, LANE_BOTTOM);

      if (canAttack && attack.range > 0 && enemy.cooldown <= 0 && this.profileHitsPlayer(enemy, attack)) {
        this.enemyAttack(enemy, attack, ai);
      }

      this.drawEnemyBar(enemy);
    }
  }

  private getEnemyPressureOrder() {
    return this.enemies
      .filter((enemy) => enemy.active && enemy.engageDelay <= 0)
      .sort((a, b) => {
        const aDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, a.sprite.x, a.sprite.y);
        const bDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, b.sprite.x, b.sprite.y);
        return aDistance - bDistance;
      });
  }

  private basicAttack() {
    const profile = getHitboxProfile(this.playerDef.combat.hitboxProfile);

    this.attackCooldown = profile.cooldownMs / 1000;
    this.playerActionLockedUntil = this.time.now + 260;
    playCharacterAnimation(this.player, this.playerId, 'attack', false);

    const attackRect = this.getAttackRect(this.player.x, this.player.y, profile, this.facing);
    this.drawAttackDebug(attackRect, 0xef2b2d);
    const propHits = this.hitDestructibleProps(attackRect, 1, this.facing);

    const targets = this.getForwardTargets(profile);
    if (targets.length === 0 && propHits === 0) {
      this.state.meter = Math.min(this.state.maxMeter, this.state.meter + profile.meterGainOnWhiff);
      return;
    }

    for (const enemy of targets) {
      const hurtbox = getHurtboxProfile(enemy.character.combat.hurtboxProfile);
      const damage = this.playerDef.stats.attackDamage * profile.damageMultiplier * hurtbox.damageTakenMultiplier;
      const knockback = profile.knockback * hurtbox.knockbackMultiplier;
      this.damageEnemy(enemy, damage, knockback, profile.stun, this.facing);
      this.playImpact(profile, enemy.sprite.x, enemy.sprite.y - 118, 0xef2b2d);
      this.state.score += 125;
      this.state.meter = Math.min(this.state.maxMeter, this.state.meter + profile.meterGain);
    }
    this.startHitStop(profile.hitStopMs);
  }

  private dodge(moveX: number, moveY: number) {
    this.dodgeCooldown = PLAYER_DODGE_COOLDOWN_SECONDS;
    this.playerDodge = PLAYER_DODGE_SECONDS;
    this.rushedEnemies.clear();
    this.playerInvuln = Math.max(this.playerInvuln, PLAYER_DODGE_INVULN_SECONDS);
    this.playerActionLockedUntil = Math.max(this.playerActionLockedUntil, this.time.now + PLAYER_DODGE_SECONDS * 1000);
    const dir = Math.abs(moveX) > 0.2 ? Math.sign(moveX) : this.facing || 1;
    this.facing = dir;
    this.player.setFlipX(this.facing < 0);
    this.player.setVelocity(dir * PLAYER_DODGE_SPEED, Phaser.Math.Clamp(moveY, -1, 1) * 175);
    this.playOptionalCharacterAnimation(this.player, this.playerId, 'dodge', false, 'walk');
    this.startCompanionSupportRush(dir);
    this.cameras.main.shake(70, 0.003);
    this.flashHit(this.player.x - dir * 22, this.player.y - 92, 0x00dfff);
    this.resolveRushHits();
  }

  private resolveRushHits() {
    const rushRect = new Phaser.Geom.Rectangle(
      this.player.x + this.facing * 92 - 132,
      this.player.y - 164,
      264,
      138
    );
    this.drawAttackDebug(rushRect, 0x00dfff);

    for (const enemy of this.enemies) {
      if (!enemy.active || this.rushedEnemies.has(enemy)) continue;
      if (Math.abs(enemy.sprite.y - this.player.y) > 58) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(rushRect, this.getHurtboxRect(enemy.sprite, enemy.character))) continue;
      this.rushedEnemies.add(enemy);
      this.damageEnemy(enemy, RUSH_DAMAGE, RUSH_KNOCKBACK, RUSH_STUN_SECONDS, this.facing);
      this.flashHit(enemy.sprite.x, enemy.sprite.y - 110, 0x00dfff, 28);
      this.cameras.main.shake(90, 0.006);
      this.startHitStop(55);
      this.state.meter = Math.min(this.state.maxMeter, this.state.meter + 4);
    }
    this.hitDestructibleProps(rushRect, 2, this.facing);
  }

  private jump(moveX: number) {
    this.jumpCooldown = PLAYER_JUMP_COOLDOWN_SECONDS;
    this.playerJump = PLAYER_JUMP_SECONDS;
    this.playerActionLockedUntil = Math.max(this.playerActionLockedUntil, this.time.now + PLAYER_JUMP_SECONDS * 1000);
    if (Math.abs(moveX) > 0.2) {
      this.facing = Math.sign(moveX);
      this.player.setFlipX(this.facing < 0);
    }
    this.playJumpAnimation();
    this.flashHit(this.player.x, this.player.y - 22, 0xffca3a, 18);
    this.applyPlayerJumpVisual();
  }

  private updatePlayerJump(dt: number) {
    if (this.playerJump <= 0) {
      this.resetPlayerJumpVisual();
      return false;
    }
    this.playerJump = Math.max(0, this.playerJump - dt);
    this.applyPlayerJumpVisual();
    return this.playerJump > 0;
  }

  private applyPlayerJumpVisual() {
    if (this.playerJump <= 0) {
      this.resetPlayerJumpVisual();
      return;
    }
    const progress = 1 - this.playerJump / PLAYER_JUMP_SECONDS;
    const lift = Math.sin(progress * Math.PI) * PLAYER_JUMP_HEIGHT;
    const scaleY = Math.max(Math.abs(this.player.scaleY), 0.001);
    this.player.setDisplayOrigin(this.player.displayOriginX, this.playerBaseDisplayOriginY + lift / scaleY);
  }

  private cancelPlayerJump() {
    this.playerJump = 0;
    this.resetPlayerJumpVisual();
  }

  private resetPlayerJumpVisual() {
    if (!this.player || this.playerBaseDisplayOriginY <= 0) return;
    this.player.setDisplayOrigin(this.player.displayOriginX, this.playerBaseDisplayOriginY);
  }

  private playJumpAnimation() {
    const fallback = hasAnimation(this.playerId, 'dodge')
      ? 'dodge'
      : hasAnimation(this.playerId, 'walk')
        ? 'walk'
        : 'idle';
    this.playOptionalCharacterAnimation(this.player, this.playerId, 'jump', false, fallback);
  }

  private isPlayerJumpEvadingGroundHit() {
    if (this.playerJump <= 0) return false;
    const progress = 1 - this.playerJump / PLAYER_JUMP_SECONDS;
    return progress >= PLAYER_JUMP_PEAK_MIN && progress <= PLAYER_JUMP_PEAK_MAX;
  }

  private superSlap() {
    if (!this.playerDef.combat.canUseSuperSlap) return;
    const profile = getHitboxProfile('super-slap-wave');

    this.superCooldown = profile.cooldownMs / 1000;
    this.state.meter = 0;
    this.playerActionLockedUntil = this.time.now + 430;
    playCharacterAnimation(this.player, this.playerId, 'super-slap', false);
    this.cameras.main.shake(230, 0.012);
    this.cameras.main.flash(85, 20, 210, 255, false);

    const fx = this.add.sprite(this.player.x + this.facing * 170, this.player.y - 132, assetKeys.superSlapFx)
      .setScale(1.35)
      .setFlipX(this.facing < 0)
      .setDepth(60);
    fx.play('fx:super-slap:burst');
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());

    this.tweens.add({
      targets: this.player,
      x: this.player.x + this.facing * 42,
      duration: 90,
      yoyo: true,
      ease: 'Cubic.out'
    });

    const attackRect = this.getAttackRect(this.player.x, this.player.y, profile, this.facing);
    this.drawAttackDebug(attackRect, 0x00dfff);
    this.hitDestructibleProps(attackRect, 3, this.facing);

    const targets = this.getForwardTargets(profile);
    for (const enemy of targets) {
      const hurtbox = getHurtboxProfile(enemy.character.combat.hurtboxProfile);
      const damage = this.playerDef.stats.superDamage * profile.damageMultiplier * hurtbox.damageTakenMultiplier;
      const knockback = profile.knockback * hurtbox.knockbackMultiplier;
      this.damageEnemy(enemy, damage, knockback, profile.stun, this.facing);
      this.flashHit(enemy.sprite.x, enemy.sprite.y - 120, 0x00dfff, 44);
      this.state.score += 400;
    }
    if (targets.length > 0) this.startHitStop(profile.hitStopMs);
  }

  private enemyAttack(enemy: Enemy, profile: HitboxProfile, ai: AiProfile) {
    enemy.cooldown = Phaser.Math.FloatBetween(ai.attackCooldownMin, ai.attackCooldownMax);
    enemy.stunned = 0.08;
    const direction = Math.sign(this.player.x - enemy.sprite.x) || 1;

    playCharacterAnimation(enemy.sprite, enemy.character.id, 'attack', false);
    this.tweens.add({
      targets: enemy.sprite,
      x: enemy.sprite.x + direction * 18,
      duration: 70,
      yoyo: true
    });

    this.drawAttackDebug(this.getAttackRect(enemy.sprite.x, enemy.sprite.y, profile, direction), 0xffca3a);
    if (this.isPlayerJumpEvadingGroundHit()) return;
    if (this.playerInvuln > 0) return;
    if (!this.profileHitsPlayer(enemy, profile)) return;

    const hurtbox = getHurtboxProfile(this.playerDef.combat.hurtboxProfile);
    const damage = enemy.character.stats.attackDamage * profile.damageMultiplier * hurtbox.damageTakenMultiplier;
    this.state.hp = Math.max(0, this.state.hp - damage);
    this.playerInvuln = 0.42;
    this.playerDodge = 0;
    this.playerKnockback = Math.max(this.playerKnockback, Math.min(Math.max(profile.stun, 0.12), KNOCKBACK_COAST_SECONDS));
    this.playerStunned = Math.max(this.playerStunned, Math.max(profile.stun, 0.14));
    this.playerActionLockedUntil = Math.max(this.playerActionLockedUntil, this.time.now + Math.max(profile.stun * 1000, 180));
    this.player.setVelocity(direction * profile.knockback * hurtbox.knockbackMultiplier, -12);
    playCharacterAnimation(this.player, this.playerId, 'hurt', false);
    this.cameras.main.shake(90, 0.006);
    this.playImpact(profile, this.player.x, this.player.y - 130, 0xffca3a, 26);
    this.startHitStop(profile.hitStopMs);

    if (this.state.hp <= 0) {
      this.showOutcome('KO', 'Press R to restart or Esc for menu', 0xef2b2d);
    }
  }

  private damageEnemy(enemy: Enemy, amount: number, knockback: number, stun: number, direction: number) {
    enemy.hp = Math.max(0, enemy.hp - amount);
    const stunDuration = Math.max(stun, 0.12);
    enemy.engageDelay = 0;
    enemy.cooldown = Math.max(enemy.cooldown, 0.28);
    enemy.stunned = Math.max(enemy.stunned, stunDuration);
    enemy.knockback = Math.max(enemy.knockback, Math.min(stunDuration, KNOCKBACK_COAST_SECONDS));
    enemy.sprite.setVelocity(direction * knockback, -12);
    enemy.sprite.setTintFill(0xffffff);
    playCharacterAnimation(enemy.sprite, enemy.character.id, enemy.hp <= 0 ? 'death' : 'hurt', false);
    this.time.delayedCall(64, () => enemy.sprite.clearTint());

    if (enemy.hp <= 0 && enemy.active) {
      enemy.active = false;
      enemy.sprite.disableBody();
      enemy.bar.clear();
      this.tweens.add({
        targets: enemy.sprite,
        alpha: 0.22,
        y: enemy.sprite.y + 24,
        angle: this.facing * -14,
        duration: 320,
        ease: 'Back.out'
      });
    }
  }

  private hitDestructibleProps(rect: Phaser.Geom.Rectangle, damage: number, direction: number) {
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
        this.player.x,
        this.player.y - 42,
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

  private getForwardTargets(profile: HitboxProfile) {
    const attackRect = this.getAttackRect(this.player.x, this.player.y, profile, this.facing);
    return this.enemies.filter((enemy) => {
      if (!enemy.active) return false;
      if (!this.isInProfileLane(this.player.y, enemy.sprite.y, profile)) return false;
      if (!this.isInProfileRange(this.player.x, enemy.sprite.x, profile, this.facing)) return false;
      return Phaser.Geom.Intersects.RectangleToRectangle(
        attackRect,
        this.getHurtboxRect(enemy.sprite, enemy.character)
      );
    });
  }

  private profileHitsPlayer(enemy: Enemy, profile: HitboxProfile) {
    const direction = Math.sign(this.player.x - enemy.sprite.x) || 1;
    const attackRect = this.getAttackRect(enemy.sprite.x, enemy.sprite.y, profile, direction);
    if (!this.isInProfileLane(enemy.sprite.y, this.player.y, profile)) return false;
    if (!this.isInProfileRange(enemy.sprite.x, this.player.x, profile, direction)) return false;
    return Phaser.Geom.Intersects.RectangleToRectangle(
      attackRect,
      this.getHurtboxRect(this.player, this.playerDef)
    );
  }

  private getAttackRect(x: number, y: number, profile: HitboxProfile, direction: number) {
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

  private getHurtboxRect(sprite: ArcadeCharacterSprite, character: CharacterDefinition) {
    const profile = getHurtboxProfile(character.combat.hurtboxProfile);
    return new Phaser.Geom.Rectangle(
      sprite.x - profile.width / 2,
      sprite.y + profile.offsetY - profile.height / 2,
      profile.width,
      profile.height
    );
  }

  private drawAttackDebug(rect: Phaser.Geom.Rectangle, color: number) {
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

  private playImpact(profile: HitboxProfile, x: number, y: number, color: number, radius = 30) {
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

  private flashHit(x: number, y: number, color: number, radius = 30) {
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

  private drawEnemyBar(enemy: Enemy) {
    enemy.bar.clear();
    if (!enemy.active) return;
    const x = enemy.sprite.x - 46;
    const y = enemy.sprite.y - 208;
    enemy.bar.fillStyle(0x050506, 0.74);
    enemy.bar.fillRoundedRect(x, y, 92, 10, 3);
    enemy.bar.fillStyle(0xef2b2d, 0.92);
    enemy.bar.fillRoundedRect(x + 2, y + 2, 88 * (enemy.hp / enemy.maxHp), 6, 2);
  }

  private updateDepths() {
    this.player.setDepth(this.player.y);
    if (this.companion) {
      this.companion.sprite.setDepth(this.companion.sprite.y);
      this.companion.shadow.setDepth(this.companion.sprite.y - 2);
    }
    for (const prop of this.destructibleProps) {
      if (!prop.active) continue;
      prop.sprite.setDepth(prop.occludes ? prop.sprite.y + 4 : LARGE_PROP_DEPTH);
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
    if (enemiesLeft > 0) return;
    if (Math.abs(this.player.x - EXIT_X) < 112 && Math.abs(this.player.y - 560) < 105) {
      this.state.won = true;
      this.state.paused = false;
      this.player.setVelocity(0, 0);
      this.playPlayerVictoryPose();
      this.showOutcome('SHOP CLEAR', 'Press R to restart or Esc for menu', 0x75ff43);
    }
  }

  private playOptionalCharacterAnimation(
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
    this.playerActionLockedUntil = Number.POSITIVE_INFINITY;
    this.playOptionalCharacterAnimation(this.player, this.playerId, 'knockdown', false, 'death');
  }

  private playPlayerVictoryPose() {
    if (this.playerVictoryPose) return;
    this.playerVictoryPose = true;
    this.playerActionLockedUntil = Number.POSITIVE_INFINITY;
    this.playOptionalCharacterAnimation(this.player, this.playerId, 'victory', false, 'idle');
  }

  private showOutcome(title: string, subtitle: string, color: number) {
    if (this.winText || this.koText) return;
    const container = this.createScreenOverlay(title, subtitle, color, [
      { label: 'RESTART', action: () => this.restartLevel() },
      { label: 'MENU', action: () => this.openMenu() }
    ]);
    if (title === 'KO') this.koText = container;
    else this.winText = container;
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
    const panel = this.add.image(0, 0, assetKeys.uiDialogueFrame)
      .setDisplaySize(650, 248)
      .setTint(color)
      .setAlpha(0.94);
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
    container.add([shade, panelShadow, panelFill, panel, text, sub, ...buttons]);
    return container;
  }

  private createOverlayButton(label: string, x: number, y: number, color: number, action: () => void) {
    const button = this.add.container(x, y);
    let armed = false;
    const hitArea = new Phaser.Geom.Rectangle(-92, -34, 184, 68);
    button.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    const plate = this.add.image(0, 0, assetKeys.uiObjectiveChip)
      .setDisplaySize(158, 58)
      .setTint(color)
      .setAlpha(0.86);
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
    button.on('pointerout', () => {
      armed = false;
      button.setScale(1);
    });
    button.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      armed = true;
      button.setScale(0.97);
    });
    button.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      if (!armed) return;
      armed = false;
      button.setScale(1);
      action();
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

  private openMenu() {
    if (this.leavingLevel) return;
    this.leavingLevel = true;
    clearMomentaryActions();
    this.scene.start('MenuScene');
  }

  private freezeActors() {
    this.player.setVelocity(0, 0);
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
    const enemiesLeft = this.enemies.filter((enemy) => enemy.active).length;
    const objective = this.state.won
      ? 'Shop clear'
      : enemiesLeft > 0
        ? `${enemiesLeft} rival${enemiesLeft === 1 ? '' : 's'} in the street`
        : 'Enter the tattoo shop';
    const snapshot: HudSnapshot = {
      playerName: this.playerDef.displayName,
      handle: this.playerDef.handle,
      portrait: this.playerDef.seed.path,
      hp: this.state.hp,
      maxHp: this.state.maxHp,
      meter: this.state.meter,
      maxMeter: this.state.maxMeter,
      score: this.state.score,
      enemiesLeft,
      objective,
      paused: this.state.paused,
      rushReady: this.dodgeCooldown <= 0,
      rushCooldownRatio: Phaser.Math.Clamp(this.dodgeCooldown / PLAYER_DODGE_COOLDOWN_SECONDS, 0, 1),
      companionName: this.companion?.character.displayName ?? 'Dang',
      companionPortrait: SOI_DOG_BUTTON_PORTRAIT,
      companionReady: (this.companion?.specialCooldown ?? 0) <= 0,
      companionCooldownRatio: Phaser.Math.Clamp((this.companion?.specialCooldown ?? 0) / SOI_DOG_SPECIAL_COOLDOWN_SECONDS, 0, 1)
    };
    window.dispatchEvent(new CustomEvent('slap:hud', { detail: snapshot }));
  }
}
