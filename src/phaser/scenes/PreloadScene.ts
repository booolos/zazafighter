import Phaser from 'phaser';
import { loadCharacterAssets, loadCoreAssets, registerGameAnimations } from '../../game/assets/loaders';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.cameras.main.setBackgroundColor('#07080c');
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2, height / 2 + 72, 460, 10, 0x171821);
    const fill = this.add.rectangle(width / 2 - 230, height / 2 + 72, 2, 10, 0xffca3a).setOrigin(0, 0.5);
    this.add.text(width / 2, height / 2 - 28, 'SLAP STREET', {
      color: '#f4f4f2',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '56px',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 24, 'PATTAYA EDITION', {
      color: '#ffca3a',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '22px',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);

    const percent = this.add.text(width / 2, height / 2 + 98, '0%', {
      color: '#9aa0b8',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '14px'
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      fill.width = Math.max(2, 460 * value);
      percent.setText(`${Math.round(value * 100)}%`);
    });

    loadCoreAssets(this);
    loadCharacterAssets(this);
  }

  create() {
    registerGameAnimations(this);
    this.scene.start('MenuScene');
  }
}
