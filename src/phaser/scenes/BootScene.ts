import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.scale.lockOrientation?.('landscape');
    this.scene.start('PreloadScene');
  }
}
