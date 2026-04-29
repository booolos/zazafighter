import Phaser from 'phaser';
import { assetKeys } from '../../game/assets/manifest';
import { requestLandscapePlayMode } from '../../ui/device';

export class MenuScene extends Phaser.Scene {
  private startRequested = false;

  constructor() {
    super('MenuScene');
  }

  create() {
    this.startRequested = false;
    window.dispatchEvent(new CustomEvent('slap:level-state', { detail: { active: false } }));

    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, assetKeys.backgroundThumb).setDisplaySize(width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x07080c, 0.34);

    this.add.text(54, 42, 'SLAP', {
      color: '#ef2b2d',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '104px',
      stroke: '#050506',
      strokeThickness: 12
    });
    this.add.text(63, 130, 'STREET', {
      color: '#f4f4f2',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '86px',
      stroke: '#050506',
      strokeThickness: 10
    });
    this.add.text(70, 212, 'INK DISTRICT', {
      color: '#b857ff',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '28px',
      backgroundColor: '#15051f',
      padding: { x: 12, y: 5 }
    });

    this.add.text(66, 600, 'TATTOO SHOP VS WEED SHOP', {
      color: '#00dfff',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '20px'
    });

    const start = this.add.container(width - 284, height - 132).setDepth(20);
    const plate = this.add.image(0, 0, assetKeys.uiObjectiveChip)
      .setDisplaySize(382, 118)
      .setTint(0xff4d4d);
    const glow = this.add.rectangle(0, 0, 308, 62, 0xef2b2d, 0.62);
    const label = this.add.text(0, -3, 'START', {
      color: '#ffffff',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '48px',
      stroke: '#07080c',
      strokeThickness: 7
    }).setOrigin(0.5);
    const hitZone = this.add.rectangle(0, 0, 350, 118, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    start.add([plate, glow, label, hitZone]);

    hitZone.on('pointerover', () => start.setScale(1.03));
    hitZone.on('pointerout', () => start.setScale(1));
    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      start.setScale(0.98);
      this.startGame();
    });
    hitZone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
    });

    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
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
