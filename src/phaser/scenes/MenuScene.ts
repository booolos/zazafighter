import Phaser from 'phaser';
import { assetKeys } from '../../game/assets/manifest';
import { requestLandscapePlayMode } from '../../ui/device';
import { addCoverImage, fitTextToWidth } from './sceneLayout';

const arcadeRed = 0xef2b2d;

export class MenuScene extends Phaser.Scene {
  private startRequested = false;

  constructor() {
    super('MenuScene');
  }

  create() {
    this.startRequested = false;
    window.dispatchEvent(new CustomEvent('slap:level-state', { detail: { active: false } }));

    const { width, height } = this.scale;
    addCoverImage(this, assetKeys.background, width / 2, height / 2, width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x050506, 0.72);

    const titleY = Phaser.Math.Clamp(height * 0.28, 108, 198);
    const titleMaxW = Math.min(width - 48, 920);
    const title = fitTextToWidth(this.add.text(width / 2, titleY, 'SLAP STREET', {
      color: '#f4f4f2',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: `${Phaser.Math.Clamp(height * 0.15, 68, 116)}px`,
      stroke: '#050506',
      strokeThickness: 12
    }).setOrigin(0.5), titleMaxW, 60);
    title.setShadow(0, 0, '#ef2b2d', 18, true, true);

    this.add.text(width / 2, titleY + Phaser.Math.Clamp(height * 0.11, 58, 90), 'PATTAYA EDITION', {
      color: '#ffca3a',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${Phaser.Math.Clamp(height * 0.045, 22, 34)}px`,
      stroke: '#050506',
      strokeThickness: 6
    }).setOrigin(0.5);

    const buttonW = Phaser.Math.Clamp(width * 0.28, 220, 340);
    const buttonH = Phaser.Math.Clamp(height * 0.095, 56, 72);
    this.makeButton(width / 2, height - Phaser.Math.Clamp(height * 0.22, 104, 150), buttonW, buttonH, 'START', arcadeRed, () => this.startGame());

    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
  }

  private makeButton(x: number, y: number, width: number, height: number, label: string, accent: number, onClick: () => void) {
    const container = this.add.container(x, y).setDepth(20);
    const plate = this.add.rectangle(0, 0, width, height, 0x101018, 0.94)
      .setStrokeStyle(4, accent, 0.92);
    const text = this.add.text(0, -2, label, {
      color: '#ffffff',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: `${Phaser.Math.Clamp(height * 0.5, 30, 42)}px`,
      stroke: '#050506',
      strokeThickness: 6
    }).setOrigin(0.5);
    const hitZone = this.add.rectangle(0, 0, width, height, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    container.add([plate, text, hitZone]);

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
