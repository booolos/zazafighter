import Phaser from 'phaser';
import { assetKeys } from '../../game/assets/manifest';
import { requestLandscapePlayMode } from '../../ui/device';
import { addCoverImage, fitTextToWidth } from './sceneLayout';

const arcadeRed = 0xef2b2d;
const arcadeGold = 0xffca3a;

export class MenuScene extends Phaser.Scene {
  private startRequested = false;

  constructor() {
    super('MenuScene');
  }

  create() {
    this.startRequested = false;
    window.dispatchEvent(new CustomEvent('slap:level-state', { detail: { active: false } }));

    const { width, height } = this.scale;
    addCoverImage(this, assetKeys.backgroundThumb, width / 2, height / 2, width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x050506, 0.72);

    const titleY = Phaser.Math.Clamp(height * 0.25, 100, 190);
    const titleMaxW = Math.min(width - 48, 920);
    const title = fitTextToWidth(this.add.text(width / 2, titleY, 'SLAP STREET', {
      color: '#f4f4f2',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: `${Phaser.Math.Clamp(height * 0.17, 74, 132)}px`,
      stroke: '#050506',
      strokeThickness: 12
    }).setOrigin(0.5), titleMaxW, 60);
    title.setShadow(0, 0, '#ef2b2d', 18, true, true);

    this.add.text(width / 2, titleY + Phaser.Math.Clamp(height * 0.12, 64, 104), 'PATTAYA EDITION', {
      color: '#ffca3a',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${Phaser.Math.Clamp(height * 0.045, 22, 34)}px`,
      stroke: '#050506',
      strokeThickness: 6
    }).setOrigin(0.5);

    const buttonW = Phaser.Math.Clamp(width * 0.34, 250, 430);
    const buttonH = Phaser.Math.Clamp(height * 0.12, 68, 94);
    const start = this.makeButton(width / 2, height - Phaser.Math.Clamp(height * 0.22, 112, 168), buttonW, buttonH, 'START', arcadeRed, () => this.startGame());
    this.add.text(width / 2, start.y + buttonH * 0.78, 'ENTER / SPACE', {
      color: '#d9dae3',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${Phaser.Math.Clamp(height * 0.024, 12, 17)}px`,
      stroke: '#050506',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: start,
      scale: { from: 0.98, to: 1.02 },
      duration: 880,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
  }

  private makeButton(x: number, y: number, width: number, height: number, label: string, accent: number, onClick: () => void) {
    const container = this.add.container(x, y).setDepth(20);
    const glow = this.add.rectangle(0, 0, width + 20, height + 16, accent, 0.18);
    const plate = this.add.rectangle(0, 0, width, height, 0x101018, 0.94)
      .setStrokeStyle(4, accent, 0.92);
    const rail = this.add.rectangle(0, height / 2 - 10, width - 28, 6, arcadeGold, 0.76);
    const text = this.add.text(0, -4, label, {
      color: '#ffffff',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: `${Phaser.Math.Clamp(height * 0.52, 34, 52)}px`,
      stroke: '#050506',
      strokeThickness: 8
    }).setOrigin(0.5);
    const hitZone = this.add.rectangle(0, 0, width, height, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    container.add([glow, plate, rail, text, hitZone]);

    hitZone.on('pointerover', () => container.setScale(1.04));
    hitZone.on('pointerout', () => container.setScale(1));
    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      container.setScale(0.98);
    });
    hitZone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      onClick();
    });
    return container;
  }

  private startGame() {
    if (this.startRequested) return;
    this.startRequested = true;
    void requestLandscapePlayMode();
    this.time.delayedCall(90, () => {
      this.scene.start('CharacterSelectScene');
    });
  }
}
