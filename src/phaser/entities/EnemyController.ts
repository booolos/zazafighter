import Phaser from 'phaser';
import { playCharacterAnimation } from '../../game/assets/loaders';
import { getAiProfile, getHitboxProfile, type HitboxProfile, type AiProfile } from '../../game/content/combatProfiles';
import { type CharacterDefinition } from '../../game/content/characters';
import { MAX_ADVANCING_ENEMIES, MAX_ATTACKING_ENEMIES, KNOCKBACK_COAST_SECONDS } from '../../game/constants';
import type { ArcadeCharacterSprite } from '../factories/characterFactory';
import type { Level1Scene } from '../scenes/Level1Scene';

export class EnemyController {
  scene: Level1Scene;
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

  constructor(scene: Level1Scene, sprite: ArcadeCharacterSprite, character: CharacterDefinition, engageDelay: number, bar: Phaser.GameObjects.Graphics) {
    this.scene = scene;
    this.sprite = sprite;
    this.character = character;
    this.hp = character.stats.maxHp;
    this.maxHp = character.stats.maxHp;
    this.cooldown = Phaser.Math.FloatBetween(1.1, 1.8) + engageDelay * 0.25;
    this.stunned = 0;
    this.knockback = 0;
    this.engageDelay = engageDelay;
    this.bar = bar;
    this.active = true;
    this.drawEnemyBar();
  }

  update(dt: number, playerX: number, playerY: number, pressureRank: number) {
    if (!this.active) return;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.stunned = Math.max(0, this.stunned - dt);
    this.knockback = Math.max(0, this.knockback - dt);

    const dx = playerX - this.sprite.x;
    const dy = playerY - this.sprite.y;
    const distance = Math.hypot(dx, dy);
    const ai = getAiProfile(this.character.combat.aiProfile);
    const attack = getHitboxProfile(this.character.combat.hitboxProfile);

    this.sprite.setFlipX(dx < 0);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, this.scene.getLaneTop(), this.scene.getLaneBottom());

    if (this.engageDelay > 0) {
      this.engageDelay = Math.max(0, this.engageDelay - dt);
      this.sprite.setVelocity(0, 0);
      playCharacterAnimation(this.sprite, this.character.id, 'idle');
      this.drawEnemyBar();
      return;
    }

    if (this.knockback > 0) {
      this.drawEnemyBar();
      return;
    }

    if (this.stunned > 0) {
      this.sprite.setVelocity(0, 0);
      if (!this.sprite.anims.isPlaying) {
        this.scene.playOptionalCharacterAnimation(this.sprite, this.character.id, 'stunned', true, 'hurt');
      }
      this.drawEnemyBar();
      return;
    }

    const canAdvance = pressureRank >= 0 && pressureRank < MAX_ADVANCING_ENEMIES;
    const canAttack = pressureRank >= 0 && pressureRank < MAX_ATTACKING_ENEMIES;

    if (distance < ai.aggroRange) {
      const direction = Math.sign(dx) || 1;
      const supportRange = pressureRank > 0 ? 64 * pressureRank : 0;
      const preferredRange = ai.preferredRange + supportRange;
      const shouldAdvance = canAdvance && Math.abs(dx) > preferredRange;
      const shouldBackOff = pressureRank > 0 && Math.abs(dx) < preferredRange - 26;
      const xSpeed = shouldAdvance
        ? direction * this.character.stats.speed * (pressureRank === 0 ? 1 : 0.72)
        : shouldBackOff
          ? -direction * this.character.stats.speed * 0.45
          : 0;
      const ySpeed = Phaser.Math.Clamp(dy * 3.2 * ai.laneSpeedMultiplier, -85, 85);
      this.sprite.setVelocity(xSpeed, canAdvance ? ySpeed : 0);
      playCharacterAnimation(this.sprite, this.character.id, shouldAdvance ? 'walk' : 'idle');
    } else {
      this.sprite.setVelocity(0, 0);
      playCharacterAnimation(this.sprite, this.character.id, 'idle');
    }

    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, this.scene.getLaneTop(), this.scene.getLaneBottom());

    if (canAttack && attack.range > 0 && this.cooldown <= 0 && this.scene.profileHitsPlayer(this, attack)) {
      this.enemyAttack(attack, ai, playerX);
    }

    this.drawEnemyBar();
  }

  private drawEnemyBar() {
    this.bar.clear();
    if (!this.active) return;
    const x = this.sprite.x - 46;
    const y = this.sprite.y - 208;
    this.bar.fillStyle(0x050506, 0.74);
    this.bar.fillRoundedRect(x, y, 92, 10, 3);
    this.bar.fillStyle(0xef2b2d, 0.92);
    this.bar.fillRoundedRect(x + 2, y + 2, 88 * (this.hp / this.maxHp), 6, 2);
  }

  private enemyAttack(profile: HitboxProfile, ai: AiProfile, playerX: number) {
    this.cooldown = Phaser.Math.FloatBetween(ai.attackCooldownMin, ai.attackCooldownMax);
    this.stunned = 0.08;
    const direction = Math.sign(playerX - this.sprite.x) || 1;

    playCharacterAnimation(this.sprite, this.character.id, 'attack', false);
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + direction * 18,
      duration: 70,
      yoyo: true
    });

    this.scene.drawAttackDebug(this.scene.getAttackRect(this.sprite.x, this.sprite.y, profile, direction), 0xffca3a);
    if (this.scene.playerController.isJumpEvadingGroundHit()) return;
    if (this.scene.playerController.invuln > 0) return;
    if (!this.scene.profileHitsPlayer(this, profile)) return;

    this.scene.applyDamageToPlayer(this.character.stats.attackDamage, profile, direction);
  }

  damage(amount: number, knockback: number, stun: number, direction: number) {
    this.hp = Math.max(0, this.hp - amount);
    const stunDuration = Math.max(stun, 0.12);
    this.engageDelay = 0;
    this.cooldown = Math.max(this.cooldown, 0.28);
    this.stunned = Math.max(this.stunned, stunDuration);
    this.knockback = Math.max(this.knockback, Math.min(stunDuration, KNOCKBACK_COAST_SECONDS));
    this.sprite.setVelocity(direction * knockback, -12);
    this.sprite.setTintFill(0xffffff);
    playCharacterAnimation(this.sprite, this.character.id, this.hp <= 0 ? 'death' : 'hurt', false);
    this.scene.time.delayedCall(64, () => this.sprite.clearTint());

    if (this.hp <= 0 && this.active) {
      this.active = false;
      this.sprite.disableBody();
      this.bar.clear();
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        y: this.sprite.y + 24,
        angle: direction * -14,
        duration: 260,
        ease: 'Quad.out',
        onComplete: () => {
          this.sprite.setVisible(false);
        }
      });
    }
  }
}
