import Phaser from 'phaser';

type StoredVelocity = { x: number; y: number };

export class HitStopManager {
  private scene: Phaser.Scene;
  private hitStopUntil = 0;
  private hitStopVelocities = new Map<Phaser.Physics.Arcade.Sprite, StoredVelocity>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(): boolean {
    if (this.hitStopUntil <= 0) return false;
    if (this.scene.time.now < this.hitStopUntil) {
      this.freezeHitStopActors();
      return true;
    }
    this.restoreHitStopVelocities();
    this.hitStopUntil = 0;
    return false;
  }

  startHitStop(durationMs: number, actors: Phaser.Physics.Arcade.Sprite[]) {
    const duration = Phaser.Math.Clamp(durationMs, 0, 150);
    if (duration <= 0) return;
    
    if (this.hitStopUntil <= this.scene.time.now) {
      this.captureHitStopVelocities(actors);
    }
    this.hitStopUntil = Math.max(this.hitStopUntil, this.scene.time.now + duration);
    this.freezeHitStopActors();
  }

  private captureHitStopVelocities(actors: Phaser.Physics.Arcade.Sprite[]) {
    this.hitStopVelocities.clear();
    for (const actor of actors) {
      if (actor && actor.body && actor.body.enable) {
        this.hitStopVelocities.set(actor, {
          x: actor.body.velocity.x,
          y: actor.body.velocity.y
        });
      }
    }
  }

  private freezeHitStopActors() {
    for (const sprite of this.hitStopVelocities.keys()) {
      if (sprite.body && sprite.body.enable) {
        sprite.setVelocity(0, 0);
      }
    }
  }

  private restoreHitStopVelocities() {
    for (const [sprite, velocity] of this.hitStopVelocities) {
      if (sprite.body && sprite.body.enable) {
        sprite.setVelocity(velocity.x, velocity.y);
      }
    }
    this.hitStopVelocities.clear();
  }

  reset() {
    this.hitStopUntil = 0;
    this.hitStopVelocities.clear();
  }
}
