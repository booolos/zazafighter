import Phaser from 'phaser';
import { playCharacterAnimation } from '../../game/assets/loaders';
import { type CharacterDefinition } from '../../game/content/characters';
import { 
  WORLD_WIDTH, LANE_TOP, LANE_BOTTOM,
  SOI_DOG_FOLLOW_OFFSET_X, SOI_DOG_FOLLOW_OFFSET_Y, SOI_DOG_SPECIAL_COOLDOWN_SECONDS, 
  SOI_DOG_SPECIAL_SECONDS, SOI_DOG_SPECIAL_SPEED, SOI_DOG_SPECIAL_DAMAGE,
  SOI_DOG_SPECIAL_KNOCKBACK, SOI_DOG_SPECIAL_STUN_SECONDS, SOI_DOG_SPECIAL_LOCK_MS,
  SOI_DOG_CATCHUP_DISTANCE, PLAYER_DODGE_SECONDS, PLAYER_DODGE_SPEED
} from '../../game/constants';
import type { ArcadeCharacterSprite } from '../factories/characterFactory';
import type { Level1Scene } from '../scenes/Level1Scene';

export class CompanionController {
  scene: Level1Scene;
  sprite: ArcadeCharacterSprite;
  character: CharacterDefinition;
  shadow: Phaser.GameObjects.Image;
  
  specialCooldown = 0;
  specialRush = 0;
  supportRush = 0;
  specialDirection = 1;
  hitEnemies = new Set<any>();
  actionLockedUntil = 0;
  lastFollowDistance = 0;
  followMoving = false;
  parkedUntil = 0;
  private followEscapeDistance = 128;
  private followSettleDistance = 46;
  private readonly baseScaleX: number;
  private readonly baseScaleY: number;

  constructor(scene: Level1Scene, sprite: ArcadeCharacterSprite, character: CharacterDefinition, shadow: Phaser.GameObjects.Image) {
    this.scene = scene;
    this.sprite = sprite;
    this.character = character;
    this.shadow = shadow;
    this.baseScaleX = Math.abs(sprite.scaleX);
    this.baseScaleY = Math.abs(sprite.scaleY);
    this.lockVisuals();
  }

  update(dt: number, wantsAttack: boolean, playerX: number, playerY: number, playerFacing: number, playerMoving: boolean) {
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    this.specialRush = Math.max(0, this.specialRush - dt);
    this.supportRush = Math.max(0, this.supportRush - dt);

    if (wantsAttack && this.specialCooldown <= 0) {
      this.startCompanionSpecial(playerFacing);
    }

    if (this.specialRush > 0) {
      const direction = this.specialDirection || playerFacing || 1;
      this.sprite.setFlipX(direction < 0);
      this.sprite.setVelocity(direction * SOI_DOG_SPECIAL_SPEED, 0);
      this.resolveCompanionSpecialHits();
      this.updateCompanionShadow();
      return;
    }

    if (this.supportRush > 0) {
      const direction = playerFacing || 1;
      const targetY = Phaser.Math.Clamp(playerY + SOI_DOG_FOLLOW_OFFSET_Y, LANE_TOP, LANE_BOTTOM);
      this.sprite.setFlipX(direction < 0);
      this.sprite.setVelocity(direction * PLAYER_DODGE_SPEED * 0.96, (targetY - this.sprite.y) * 8);
      playCharacterAnimation(this.sprite, this.character.id, 'walk');
      this.updateCompanionShadow();
      return;
    }

    if (this.scene.time.now < this.actionLockedUntil) {
      this.followMoving = false;
      this.sprite.setVelocity(0, 0);
      playCharacterAnimation(this.sprite, this.character.id, playerMoving ? 'walk' : 'idle');
      this.updateCompanionShadow();
      return;
    }

    const targetX = Phaser.Math.Clamp(playerX - playerFacing * SOI_DOG_FOLLOW_OFFSET_X, 120, WORLD_WIDTH - 120);
    const targetY = Phaser.Math.Clamp(playerY + SOI_DOG_FOLLOW_OFFSET_Y, LANE_TOP, LANE_BOTTOM);
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    const distance = Math.hypot(dx, dy);
    this.lastFollowDistance = distance;
    const escapeDistance = playerMoving ? 74 : this.followEscapeDistance;

    if (!playerMoving && distance <= this.followEscapeDistance) {
      this.followMoving = false;
      this.parkedUntil = this.scene.time.now + 900;
      this.sprite.setVelocity(0, 0);
      this.sprite.y = Phaser.Math.Clamp(this.sprite.y, LANE_TOP, LANE_BOTTOM);
      this.sprite.setFlipX(playerFacing < 0);
      playCharacterAnimation(this.sprite, this.character.id, 'idle');
      this.updateCompanionShadow();
      return;
    }

    if (distance <= this.followSettleDistance) {
      this.followMoving = false;
      this.parkedUntil = this.scene.time.now + 700;
      this.sprite.setVelocity(0, 0);
    } else if (this.scene.time.now < this.parkedUntil && distance < escapeDistance) {
      this.followMoving = false;
      this.sprite.setVelocity(0, 0);
    } else if (distance > escapeDistance && dt > 0) {
      this.followMoving = true;
      const speed = distance > SOI_DOG_CATCHUP_DISTANCE
        ? this.character.stats.speed * 1.55
        : this.character.stats.speed;
      this.sprite.setVelocity((dx / distance) * speed, (dy / distance) * speed * 0.65);
    } else {
      this.sprite.setVelocity(0, 0);
      this.followMoving = false;
    }

    const moving = playerMoving || this.followMoving || Math.abs(this.sprite.body.velocity.x) > 24 || Math.abs(this.sprite.body.velocity.y) > 18;
    const facing = moving && Math.abs(dx) > 4 ? Math.sign(dx) : playerFacing;
    this.sprite.setFlipX(facing < 0);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, LANE_TOP, LANE_BOTTOM);
    playCharacterAnimation(this.sprite, this.character.id, moving ? 'walk' : 'idle');
    this.updateCompanionShadow();
  }

  private startCompanionSpecial(playerFacing: number) {
    const direction = playerFacing || 1;
    this.specialCooldown = SOI_DOG_SPECIAL_COOLDOWN_SECONDS;
    this.specialRush = SOI_DOG_SPECIAL_SECONDS;
    this.supportRush = 0;
    this.specialDirection = direction;
    this.hitEnemies.clear();
    this.actionLockedUntil = this.scene.time.now + SOI_DOG_SPECIAL_LOCK_MS;
    this.sprite.setFlipX(direction < 0);
    this.scene.playOptionalCharacterAnimation(this.sprite, this.character.id, 'special-attack', false, 'idle');
    this.sprite.setVelocity(direction * SOI_DOG_SPECIAL_SPEED, 0);
    this.scene.flashHit(this.sprite.x + direction * 42, this.sprite.y - 44, 0xffca3a, 16);
  }

  startSupportRush(direction: number, playerX: number, playerY: number) {
    if (this.specialRush > 0) return;
    if (Math.abs(this.sprite.x - playerX) > 260) {
      this.sprite.setPosition(playerX - direction * SOI_DOG_FOLLOW_OFFSET_X, playerY + SOI_DOG_FOLLOW_OFFSET_Y);
    }
    this.supportRush = PLAYER_DODGE_SECONDS;
    this.actionLockedUntil = Math.max(this.actionLockedUntil, this.scene.time.now + PLAYER_DODGE_SECONDS * 1000);
    this.sprite.setFlipX(direction < 0);
    playCharacterAnimation(this.sprite, this.character.id, 'walk');
  }

  private resolveCompanionSpecialHits() {
    const direction = this.specialDirection || 1;
    const biteRect = new Phaser.Geom.Rectangle(
      this.sprite.x + direction * 72 - 84,
      this.sprite.y - 82,
      168,
      82
    );
    this.scene.drawAttackDebug(biteRect, 0xffca3a);

    for (const enemy of this.scene.enemies) {
      if (!enemy.active || this.hitEnemies.has(enemy)) continue;
      if (Math.abs(enemy.sprite.y - this.sprite.y) > 64) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(biteRect, this.scene.getHurtboxRect(enemy.sprite, enemy.character))) continue;
      this.hitEnemies.add(enemy);
      enemy.damage(SOI_DOG_SPECIAL_DAMAGE, SOI_DOG_SPECIAL_KNOCKBACK, SOI_DOG_SPECIAL_STUN_SECONDS, direction);
      this.scene.flashHit(enemy.sprite.x, enemy.sprite.y - 86, 0xffca3a, 24);
      this.scene.cameras.main.shake(80, 0.004);
      this.scene.startHitStop(55);
    }
    this.scene.hitDestructibleProps(biteRect, 2, direction);
  }

  private updateCompanionShadow() {
    this.lockVisuals();
    this.shadow.setPosition(this.sprite.x, this.sprite.y + 3);
    this.shadow.setDepth(this.sprite.y - 2);
  }

  private lockVisuals() {
    this.sprite.setAlpha(1);
    this.sprite.setScale(this.baseScaleX, this.baseScaleY);
  }
}
