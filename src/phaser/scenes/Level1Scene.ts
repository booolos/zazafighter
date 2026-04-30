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
  WORLD_WIDTH, WORLD_HEIGHT, LANE_TOP, LANE_BOTTOM, LARGE_PROP_DEPTH, KEY_CAPTURE,
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

export class Level1Scene extends Phaser.Scene {
  playerController!: PlayerController;
  level!: LevelDefinition;
  state!: GameSessionState;
  enemies: EnemyController[] = [];
  ambientNpcs: ArcadeCharacterSprite[] = [];
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
  playerDefeatedPose = false;
  playerVictoryPose = false;
  playerShadow?: Phaser.GameObjects.Image;

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

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#07080c');
    this.cameras.main.setRoundPixels(true);
    this.input.setTopOnly(true);
    this.createKeyboardControls();

    this.createWorld();
    this.createActors();

    this.cameras.main.startFollow(this.playerController.sprite, true, 0.09, 0.08, 0, 56);
    this.showLevelIntro();
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
    this.playerDefeatedPose = false;
    this.playerVictoryPose = false;
    this.playerShadow = undefined;
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
    
    const { moveX, moveY } = this.getMoveInput();
    this.playerController.update(dt, moveX, moveY, this.wantsJump(), this.wantsDodge(), this.wantsAttack(), this.wantsSuper());
    
    const pressureOrder = this.getEnemyPressureOrder();
    for (const enemy of this.enemies) {
      enemy.update(dt, this.playerController.sprite.x, this.playerController.sprite.y, pressureOrder.indexOf(enemy));
    }
    
    if (this.companion) {
      this.companion.update(dt, this.wantsCompanionAttack(), this.playerController.sprite.x, this.playerController.sprite.y, this.playerController.facing);
    }

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
    this.addCoveredWorldImage(assetKeys.backgroundFar, 0.2, -20, 0.5)
      .setScrollFactor(0.2)
      .setDepth(-20);

    const bgKey = this.level.backgroundKey ?? assetKeys.background;
    this.addCoveredWorldImage(bgKey, 0.65, -15, 0.58)
      .setDepth(-15)
      .setScrollFactor(0.65);

    this.add.rectangle(WORLD_WIDTH / 2, 610, WORLD_WIDTH, 150, 0x050506, 0.16).setDepth(-5);
    this.add.rectangle(WORLD_WIDTH / 2, 492, WORLD_WIDTH, 4, 0x00dfff, 0.14).setDepth(-4);
    this.createLevelDressing();

    for (const p of this.level.props) {
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

    const exit = this.level.exit;
    this.exitGlow = this.add.graphics().setDepth(3);
    this.exitGlow.lineStyle(3, 0xef2b2d, 0.9);
    this.exitGlow.strokeRoundedRect(exit.x - 72, exit.y - 130, 144, 160, 8);
    this.exitGlow.lineStyle(1, 0xffca3a, 0.8);
    this.exitGlow.strokeRoundedRect(exit.x - 82, exit.y - 140, 164, 180, 8);

    this.add.text(exit.x, exit.y - 156, this.level.exitLabel, {
      color: '#ffca3a',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '28px',
      stroke: '#07080c',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(4);
  }

  private addCoveredWorldImage(key: string, scrollFactor: number, depth: number, focusY: number) {
    const texture = this.textures.get(key);
    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    const sourceWidth = source?.width || WORLD_WIDTH;
    const sourceHeight = source?.height || WORLD_HEIGHT;
    const scale = Math.max(WORLD_WIDTH / sourceWidth, WORLD_HEIGHT / sourceHeight);
    return this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT * focusY, key)
      .setOrigin(0.5)
      .setScale(scale)
      .setScrollFactor(scrollFactor)
      .setDepth(depth);
  }

  private createLevelDressing() {
    const { accent, haze, signText, signColor } = this.level.theme;
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, haze, 0.2)
      .setDepth(-14)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.add.rectangle(WORLD_WIDTH / 2, 490, WORLD_WIDTH, 3, accent, 0.32)
      .setDepth(-3)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.add.rectangle(WORLD_WIDTH / 2, 635, WORLD_WIDTH, 2, accent, 0.18)
      .setDepth(-3)
      .setBlendMode(Phaser.BlendModes.ADD);

    const sign = this.add.text(WORLD_WIDTH / 2, 118, signText, {
      color: Phaser.Display.Color.IntegerToColor(signColor).rgba,
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '42px',
      stroke: '#050506',
      strokeThickness: 9
    }).setOrigin(0.5).setDepth(-2).setAlpha(0.9);
    sign.setShadow(0, 0, Phaser.Display.Color.IntegerToColor(signColor).rgba, 18, true, true);

    this.tweens.add({
      targets: sign,
      alpha: 0.62,
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }

  private createActors() {
    const playerDef = getPlayerCharacter(this.registry.get('selectedPlayer'));
    const playerId = playerDef.id as PlayerId;
    this.state = createSessionState(playerId, playerDef.stats.maxHp);

    const vendorDef = getCharacter(this.level.vendor.id);
    const vendor = createCharacterSprite(this, vendorDef, this.level.vendor.x, this.level.vendor.y, {
      action: 'idle',
      immovable: true,
      flipX: this.level.vendor.flipX ?? true
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

    this.createAmbientNpcs();

    const playerSprite = createCharacterSprite(this, playerDef, this.level.playerStart.x, this.level.playerStart.y, {
      action: 'idle',
      collideWorldBounds: true,
      drag: 1200
    });
    this.playerController = new PlayerController(this, playerSprite, playerDef, playerId);

    this.playerShadow = this.add.image(playerSprite.x, this.level.playerStart.y + 6, assetKeys.propPuddleDecal)
      .setOrigin(0.5, 0.5)
      .setScale(0.42)
      .setAlpha(0.55)
      .setDepth(playerSprite.y - 1);

    this.createCompanion();
    this.enemies = this.level.enemyStarts.map((spawn) => this.makeEnemy(spawn.id, spawn.x, spawn.y, spawn.engageDelay));
  }

  private createAmbientNpcs() {
    const configuredNpcs = this.level.ambientNpcs ?? [];
    const girlPool = getCharactersByRole('npc')
      .filter((character) => character.id.startsWith('soi-six-') || character.id.startsWith('npc-girl-'));
    const randomGirlCount = Phaser.Math.Between(4, 8);
    const randomGirlNpcs = this.pickAmbientGirls(girlPool, randomGirlCount);
    const ambientNpcs = [...configuredNpcs.filter((ambient) => !this.isAmbientGirlId(ambient.id)), ...randomGirlNpcs];

    for (const ambient of ambientNpcs) {
      const character = getCharacter(ambient.id);
      const action = ambient.action ?? 'idle';
      const sprite = createCharacterSprite(this, character, ambient.x, ambient.y, {
        action: hasAnimation(character.id, action) ? action : 'idle',
        immovable: true,
        flipX: ambient.flipX
      });
      sprite.body.enable = false;
      sprite.setAlpha(0.92);
      sprite.setDepth(sprite.y - 16);
      this.ambientNpcs.push(sprite);
      
      if (this.isAmbientGirlId(ambient.id)) {
        this.scheduleAmbientGirlIdle(sprite, character.id, action);
      }
    }
  }

  private scheduleAmbientGirlIdle(sprite: ArcadeCharacterSprite, characterId: string, action: string) {
    const animAction = hasAnimation(characterId, action) ? action : 'idle';
    const movingMs = Phaser.Math.Between(900, 1500);
    const idleMs = Phaser.Math.Between(3000, 4000);
    playCharacterAnimation(sprite, characterId, animAction);
    sprite.anims.timeScale = Phaser.Math.FloatBetween(0.78, 0.98);
    this.time.delayedCall(movingMs, () => {
      if (!sprite.active) return;
      const frameCount = sprite.anims.currentAnim?.frames.length ?? 1;
      sprite.anims.pause();
      sprite.setFrame(Phaser.Math.Between(0, Math.max(0, frameCount - 1)));
      this.time.delayedCall(idleMs, () => {
        if (!sprite.active) return;
        this.scheduleAmbientGirlIdle(sprite, characterId, animAction);
      });
    });
  }

  private pickAmbientGirls(girlPool: CharacterDefinition[], count: number) {
    if (girlPool.length === 0) return [];
    const actions = ['idle', 'talk', 'cheer'];
    const chosen: Array<{ id: string; x: number; y: number; flipX: boolean; action: string }> = [];
    const xMin = Math.max(290, this.level.playerStart.x - 230);
    const xMax = Math.min(WORLD_WIDTH - 260, this.level.exit.x - 170);
    const laneYs = [590, 598, 606, 614];
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
        y: Phaser.Utils.Array.GetRandom(laneYs),
        flipX: Phaser.Math.Between(0, 1) === 1,
        action: hasAnimation(character.id, action) ? action : 'idle'
      });
    }

    return Phaser.Utils.Array.Shuffle(chosen);
  }

  private isAmbientGirlId(id: string) {
    return id.startsWith('soi-six-') || id.startsWith('npc-girl-');
  }

  private createCompanion() {
    const character = getCharacter(SOI_DOG_ID);
    const x = this.level.playerStart.x - this.playerController.facing * SOI_DOG_FOLLOW_OFFSET_X;
    const y = Phaser.Math.Clamp(this.level.playerStart.y + SOI_DOG_FOLLOW_OFFSET_Y, LANE_TOP, LANE_BOTTOM);
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
    const sprite = createCharacterSprite(this, character, x, y, {
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
      npc.setDepth(npc.y - 16);
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
    const exit = this.level.exit;
    if (enemiesLeft > 0) return;
    if (Math.abs(this.playerController.sprite.x - exit.x) < 112 && Math.abs(this.playerController.sprite.y - exit.y) < 105) {
      this.state.won = true;
      this.state.paused = false;
      this.playerController.sprite.setVelocity(0, 0);
      this.playPlayerVictoryPose();
      this.showOutcome(this.level.clearTitle, this.getWinSubtitle(), 0x75ff43);
    }
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
    const panel = this.add.image(0, 0, assetKeys.uiObjectiveChip)
      .setDisplaySize(panelWidth, 118)
      .setTint(this.level.theme.signColor)
      .setAlpha(0.88);
    const fill = this.add.rectangle(0, 0, panelWidth - 54, 76, 0x050506, 0.58);
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
    let fired = false;
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
      companionCooldownRatio: Phaser.Math.Clamp((this.companion?.specialCooldown ?? 0) / SOI_DOG_SPECIAL_COOLDOWN_SECONDS, 0, 1)
    };
    window.dispatchEvent(new CustomEvent('slap:hud', { detail: snapshot }));
  }
}
