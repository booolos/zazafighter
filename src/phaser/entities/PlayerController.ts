import Phaser from 'phaser';
import { playCharacterAnimation } from '../../game/assets/loaders';
import { assetKeys } from '../../game/assets/manifest';
import { getHitboxProfile, getHurtboxProfile } from '../../game/content/combatProfiles';
import { hasAnimation, type CharacterDefinition, type PlayerId } from '../../game/content/characters';
import {
  WORLD_WIDTH,
  PLAYER_DODGE_SECONDS, PLAYER_DODGE_COOLDOWN_SECONDS, PLAYER_DODGE_INVULN_SECONDS, PLAYER_DODGE_SPEED,
  RUSH_DAMAGE, RUSH_KNOCKBACK, RUSH_STUN_SECONDS,
  PLAYER_JUMP_SECONDS, PLAYER_JUMP_COOLDOWN_SECONDS, PLAYER_JUMP_HEIGHT, PLAYER_JUMP_PEAK_MIN, PLAYER_JUMP_PEAK_MAX
} from '../../game/constants';
import type { ArcadeCharacterSprite } from '../factories/characterFactory';
import type { Level1Scene } from '../scenes/Level1Scene';

export class PlayerController {
  scene: Level1Scene;
  sprite: ArcadeCharacterSprite;
  def: CharacterDefinition;
  id: PlayerId;

  facing = 1;
  attackCooldown = 0;
  dodgeCooldown = 0;
  jumpCooldown = 0;
  superCooldown = 0;
  jumpState = 0;
  baseDisplayOriginY = 0;
  dodgeState = 0;
  stunned = 0;
  knockback = 0;
  invuln = 0;
  actionLockedUntil = 0;
  dustStepDistance = 0;
  rushedEnemies = new Set<any>();

  constructor(scene: Level1Scene, sprite: ArcadeCharacterSprite, def: CharacterDefinition, id: PlayerId) {
    this.scene = scene;
    this.sprite = sprite;
    this.def = def;
    this.id = id;
    this.baseDisplayOriginY = sprite.displayOriginY;
  }

  update(dt: number, moveX: number, moveY: number, wantsJump: boolean, wantsDodge: boolean, wantsAttack: boolean, wantsSuper: boolean) {
    const jumping = this.updateJump(dt);

    if (this.knockback <= 0 && this.stunned <= 0 && this.dodgeState <= 0) {
      if (moveX < -0.08) this.facing = -1;
      if (moveX > 0.08) this.facing = 1;
    }
    this.sprite.setFlipX(this.facing < 0);

    if (this.knockback > 0) {
      this.cancelJump();
      this.clampToLane();
      this.updateInvulnAlpha();
      return;
    }

    if (this.stunned > 0) {
      this.cancelJump();
      this.sprite.setVelocity(0, 0);
      if (!this.sprite.anims.isPlaying) {
        this.scene.playOptionalCharacterAnimation(this.sprite, this.id, 'stunned', true, 'hurt');
      }
      this.clampToLane();
      this.updateInvulnAlpha();
      return;
    }

    if (this.dodgeState > 0) {
      this.resolveRushHits();
      this.clampToLane();
      this.updateInvulnAlpha();
      return;
    }

    if (wantsJump && this.jumpCooldown <= 0 && !jumping) {
      this.jump(moveX);
    }

    if (wantsDodge && this.dodgeCooldown <= 0) {
      this.cancelJump();
      this.dodge(moveX, moveY);
      this.clampToLane();
      this.updateInvulnAlpha();
      return;
    }

    this.sprite.setVelocity(moveX * this.def.stats.speed, moveY * this.def.stats.speed * 0.28);
    this.clampToLane();

    if (wantsAttack && this.attackCooldown <= 0) {
      this.basicAttack();
    }

    if (wantsSuper && this.superCooldown <= 0 && this.scene.state.meter >= this.scene.state.maxMeter) {
      this.superSlap();
    }

    // Spawn dust puff
    if (this.jumpState <= 0 && this.knockback <= 0 && this.stunned <= 0) {
      const speedX = Math.abs(this.sprite.body.velocity.x);
      if (speedX > 60) {
        this.dustStepDistance += speedX * dt;
        if (this.dustStepDistance > 80) {
          this.dustStepDistance = 0;
          const dust = this.scene.add.sprite(this.sprite.x - this.facing * 18, this.sprite.y + 4, assetKeys.dustStepFx)
            .setScale(0.55)
            .setAlpha(0.7)
            .setDepth(this.sprite.y - 2);
          dust.play('fx:dust-step:puff');
          dust.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => dust.destroy());
        }
      } else {
        this.dustStepDistance = Math.max(0, this.dustStepDistance - dt * 60);
      }
    }

    const moving = Math.abs(moveX) + Math.abs(moveY) > 0.08;
    if (this.scene.time.now > this.actionLockedUntil) {
      playCharacterAnimation(this.sprite, this.id, moving ? 'walk' : this.getIdleAction());
    }

    this.updateInvulnAlpha();
    this.updateShadow();

    if (dt > 0) {
      this.clampToLane();
    }
  }

  updateCooldowns(dt: number) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
    this.superCooldown = Math.max(0, this.superCooldown - dt);
    this.dodgeState = Math.max(0, this.dodgeState - dt);
    this.stunned = Math.max(0, this.stunned - dt);
    this.knockback = Math.max(0, this.knockback - dt);
    this.invuln = Math.max(0, this.invuln - dt);
  }

  private getIdleAction() {
    return this.id === 'big-ink' && hasAnimation(this.id, 'smoking-idle')
      ? 'smoking-idle'
      : 'idle';
  }

  private clampToLane() {
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 120, WORLD_WIDTH - 120);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, this.scene.getLaneTop(), this.scene.getLaneBottom());
  }

  private updateInvulnAlpha() {
    this.sprite.setAlpha(1);
  }

  private updateShadow() {
    if (!this.scene.playerShadow) return;
    this.scene.playerShadow.setPosition(this.sprite.x, this.sprite.y + 6);
    this.scene.playerShadow.setDepth(this.sprite.y - 1);
    const lift = this.jumpState > 0 ? 1 - (this.jumpState / PLAYER_JUMP_SECONDS) : 0;
    const liftCurve = Math.sin(lift * Math.PI);
    this.scene.playerShadow.setScale(0.42 * (1 - liftCurve * 0.45));
    this.scene.playerShadow.setAlpha(0.55 * (1 - liftCurve * 0.5));
  }

  private jump(moveX: number) {
    this.jumpCooldown = PLAYER_JUMP_COOLDOWN_SECONDS;
    this.jumpState = PLAYER_JUMP_SECONDS;
    this.actionLockedUntil = Math.max(this.actionLockedUntil, this.scene.time.now + PLAYER_JUMP_SECONDS * 1000);
    if (Math.abs(moveX) > 0.2) {
      this.facing = Math.sign(moveX);
      this.sprite.setFlipX(this.facing < 0);
    }
    this.playJumpAnimation();
    this.scene.flashHit(this.sprite.x, this.sprite.y - 22, 0xffca3a, 18);
    this.applyJumpVisual();
  }

  private updateJump(dt: number) {
    if (this.jumpState <= 0) {
      this.resetJumpVisual();
      return false;
    }
    this.jumpState = Math.max(0, this.jumpState - dt);
    this.applyJumpVisual();
    return this.jumpState > 0;
  }

  private applyJumpVisual() {
    if (this.jumpState <= 0) {
      this.resetJumpVisual();
      return;
    }
    const progress = 1 - this.jumpState / PLAYER_JUMP_SECONDS;
    const lift = Math.sin(progress * Math.PI) * PLAYER_JUMP_HEIGHT;
    const scaleY = Math.max(Math.abs(this.sprite.scaleY), 0.001);
    this.sprite.setDisplayOrigin(this.sprite.displayOriginX, this.baseDisplayOriginY + lift / scaleY);
  }

  private cancelJump() {
    this.jumpState = 0;
    this.resetJumpVisual();
  }

  private resetJumpVisual() {
    if (!this.sprite || this.baseDisplayOriginY <= 0) return;
    this.sprite.setDisplayOrigin(this.sprite.displayOriginX, this.baseDisplayOriginY);
  }

  private playJumpAnimation() {
    const fallback = hasAnimation(this.id, 'dodge')
      ? 'dodge'
      : hasAnimation(this.id, 'walk')
        ? 'walk'
        : 'idle';
    this.scene.playOptionalCharacterAnimation(this.sprite, this.id, 'jump', false, fallback);
  }

  isJumpEvadingGroundHit() {
    if (this.jumpState <= 0) return false;
    const progress = 1 - this.jumpState / PLAYER_JUMP_SECONDS;
    return progress >= PLAYER_JUMP_PEAK_MIN && progress <= PLAYER_JUMP_PEAK_MAX;
  }

  private dodge(moveX: number, moveY: number) {
    this.dodgeCooldown = PLAYER_DODGE_COOLDOWN_SECONDS;
    this.dodgeState = PLAYER_DODGE_SECONDS;
    this.rushedEnemies.clear();
    this.invuln = Math.max(this.invuln, PLAYER_DODGE_INVULN_SECONDS);
    this.actionLockedUntil = Math.max(this.actionLockedUntil, this.scene.time.now + PLAYER_DODGE_SECONDS * 1000);
    const dir = Math.abs(moveX) > 0.2 ? Math.sign(moveX) : this.facing || 1;
    this.facing = dir;
    this.sprite.setFlipX(this.facing < 0);
    this.sprite.setVelocity(dir * PLAYER_DODGE_SPEED, Phaser.Math.Clamp(moveY, -1, 1) * 175);
    this.scene.playOptionalCharacterAnimation(this.sprite, this.id, 'dodge', false, 'walk');
    this.scene.startCompanionSupportRush(dir);
    this.scene.cameras.main.shake(70, 0.003);
    this.scene.flashHit(this.sprite.x - dir * 22, this.sprite.y - 92, 0x00dfff);
    this.resolveRushHits();
  }

  private resolveRushHits() {
    const rushRect = new Phaser.Geom.Rectangle(
      this.sprite.x + this.facing * 92 - 132,
      this.sprite.y - 164,
      264,
      138
    );
    this.scene.drawAttackDebug(rushRect, 0x00dfff);

    for (const enemy of this.scene.enemies) {
      if (!enemy.active || this.rushedEnemies.has(enemy)) continue;
      if (Math.abs(enemy.sprite.y - this.sprite.y) > 58) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(rushRect, this.scene.getHurtboxRect(enemy.sprite, enemy.character))) continue;
      this.rushedEnemies.add(enemy);
      this.scene.damageEnemy(enemy, RUSH_DAMAGE, RUSH_KNOCKBACK, RUSH_STUN_SECONDS, this.facing);
      this.scene.flashHit(enemy.sprite.x, enemy.sprite.y - 110, 0x00dfff, 28);
      this.scene.cameras.main.shake(90, 0.006);
      this.scene.startHitStop(55);
      this.scene.state.meter = Math.min(this.scene.state.maxMeter, this.scene.state.meter + 4);
    }
    this.scene.hitDestructibleProps(rushRect, 2, this.facing);
  }

  private basicAttack() {
    const profile = getHitboxProfile(this.def.combat.hitboxProfile);

    this.attackCooldown = profile.cooldownMs / 1000;
    this.actionLockedUntil = this.scene.time.now + 260;
    playCharacterAnimation(this.sprite, this.id, 'attack', false);

    const attackRect = this.scene.getAttackRect(this.sprite.x, this.sprite.y, profile, this.facing);
    this.scene.drawAttackDebug(attackRect, 0xef2b2d);
    const propHits = this.scene.hitDestructibleProps(attackRect, 1, this.facing);

    const targets = this.scene.getForwardTargets(profile, this.sprite.x, this.sprite.y, this.facing);
    if (targets.length === 0 && propHits === 0) {
      this.scene.state.meter = Math.min(this.scene.state.maxMeter, this.scene.state.meter + profile.meterGainOnWhiff);
      return;
    }

    for (const enemy of targets) {
      const hurtbox = getHurtboxProfile(enemy.character.combat.hurtboxProfile);
      const damage = this.def.stats.attackDamage * profile.damageMultiplier * hurtbox.damageTakenMultiplier;
      const knockback = profile.knockback * hurtbox.knockbackMultiplier;
      this.scene.damageEnemy(enemy, damage, knockback, profile.stun, this.facing);
      this.scene.playImpact(profile, enemy.sprite.x, enemy.sprite.y - 118, 0xef2b2d);
      this.scene.state.score += 125;
      this.scene.state.meter = Math.min(this.scene.state.maxMeter, this.scene.state.meter + profile.meterGain);
    }
    this.scene.startHitStop(profile.hitStopMs);
  }

  private superSlap() {
    if (!this.def.combat.canUseSuperSlap) return;
    const profile = getHitboxProfile('super-slap-wave');

    this.superCooldown = profile.cooldownMs / 1000;
    this.scene.state.meter = 0;
    this.actionLockedUntil = this.scene.time.now + 430;
    playCharacterAnimation(this.sprite, this.id, 'super-slap', false);
    this.scene.cameras.main.shake(230, 0.012);
    this.scene.cameras.main.flash(85, 20, 210, 255, false);

    const fx = this.scene.add.sprite(this.sprite.x + this.facing * 170, this.sprite.y - 132, assetKeys.superSlapFx)
      .setScale(1.35)
      .setFlipX(this.facing < 0)
      .setDepth(60);
    fx.play('fx:super-slap:burst');
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());

    this.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + this.facing * 42,
      duration: 90,
      yoyo: true,
      ease: 'Cubic.out'
    });

    const attackRect = this.scene.getAttackRect(this.sprite.x, this.sprite.y, profile, this.facing);
    this.scene.drawAttackDebug(attackRect, 0x00dfff);
    this.scene.hitDestructibleProps(attackRect, 3, this.facing);

    const targets = this.scene.getForwardTargets(profile, this.sprite.x, this.sprite.y, this.facing);
    for (const enemy of targets) {
      const hurtbox = getHurtboxProfile(enemy.character.combat.hurtboxProfile);
      const damage = this.def.stats.superDamage * profile.damageMultiplier * hurtbox.damageTakenMultiplier;
      const knockback = profile.knockback * hurtbox.knockbackMultiplier;
      this.scene.damageEnemy(enemy, damage, knockback, profile.stun, this.facing);
      this.scene.flashHit(enemy.sprite.x, enemy.sprite.y - 120, 0x00dfff, 44);
      this.scene.state.score += 400;
    }
    if (targets.length > 0) this.scene.startHitStop(profile.hitStopMs);
  }
}
