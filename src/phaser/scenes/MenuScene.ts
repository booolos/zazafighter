import Phaser from 'phaser';
import { assetKeys } from '../../game/assets/manifest';
import { requestLandscapePlayMode } from '../../ui/device';
import { addCoverImage, fitTextToWidth } from './sceneLayout';

const arcadeRed = 0xef2b2d;
const arcadeGold = 0xffca3a;
const arcadeCyan = 0x00dfff;
const arcadeGreen = 0x75ff43;

type MenuLayout = {
  marginX: number;
  marginY: number;
  titleX: number;
  titleY: number;
  slapSize: number;
  streetSize: number;
  tagSize: number;
  bodyWidth: number;
  routeX: number;
  routeY: number;
  routeW: number;
  routeScale: number;
  startX: number;
  startY: number;
  buttonW: number;
  buttonH: number;
  titleMaxW: number;
};

export class MenuScene extends Phaser.Scene {
  private startRequested = false;

  constructor() {
    super('MenuScene');
  }

  create() {
    this.startRequested = false;
    window.dispatchEvent(new CustomEvent('slap:level-state', { detail: { active: false } }));

    const { width, height } = this.scale;
    const layout = this.getLayout(width, height);
    addCoverImage(this, assetKeys.backgroundThumb, width / 2, height / 2, width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x050506, 0.58);
    this.add.rectangle(width / 2, height / 2, width - layout.marginX * 2, height - layout.marginY * 2, 0x07080c, 0.62)
      .setStrokeStyle(3, arcadeCyan, 0.38);

    this.drawCabinetHeader(width, layout);
    this.drawRoutePreview(width, height, layout);

    fitTextToWidth(this.add.text(layout.titleX, layout.titleY, 'SLAP', {
      color: '#ef2b2d',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: `${layout.slapSize}px`,
      stroke: '#050506',
      strokeThickness: 12
    }), layout.titleMaxW, 56);
    fitTextToWidth(this.add.text(layout.titleX + 8, layout.titleY + layout.slapSize * 0.83, 'STREET', {
      color: '#f4f4f2',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: `${layout.streetSize}px`,
      stroke: '#050506',
      strokeThickness: 10
    }), layout.titleMaxW, 44);
    this.add.text(layout.titleX + 16, layout.titleY + layout.slapSize * 1.6, 'PATTAYA ROUTE', {
      color: '#ffca3a',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${layout.tagSize}px`,
      backgroundColor: '#15051f',
      padding: { x: 14, y: 6 }
    });

    this.add.text(layout.titleX + 8, layout.titleY + layout.slapSize * 2.46, 'ARCADE SLAP CIRCUIT', {
      color: '#00dfff',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${Phaser.Math.Clamp(layout.tagSize * 0.85, 16, 22)}px`
    });
    this.add.text(layout.titleX + 8, layout.titleY + layout.slapSize * 2.82, 'Pick a fighter, punch your route card, then clear every neon stop on the strip.', {
      color: '#d9dae3',
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Phaser.Math.Clamp(layout.tagSize * 0.76, 14, 19)}px`,
      wordWrap: { width: layout.bodyWidth, useAdvancedWrap: true }
    });

    const start = this.makeButton(layout.startX, layout.startY, layout.buttonW, layout.buttonH, 'START ROUTE', arcadeRed, () => this.startGame());
    const label = this.add.text(layout.startX, layout.startY - layout.buttonH * 0.66, 'PRESS ENTER / SPACE', {
      color: '#f4f4f2',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${Phaser.Math.Clamp(layout.buttonH * 0.17, 12, 16)}px`
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [start, label],
      alpha: { from: 0.78, to: 1 },
      duration: 720,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
  }

  private getLayout(width: number, height: number): MenuLayout {
    const marginX = Phaser.Math.Clamp(width * 0.045, 22, 54);
    const marginY = Phaser.Math.Clamp(height * 0.045, 18, 34);
    const routeW = Phaser.Math.Clamp(width * 0.3, 238, 376);
    const routeScale = routeW / 376;
    const routeX = width - marginX - routeW / 2;
    const titleX = marginX + Phaser.Math.Clamp(width * 0.026, 18, 44);
    const titleY = Phaser.Math.Clamp(height * 0.17, 92, 132);
    const buttonW = Phaser.Math.Clamp(width * 0.28, 240, 360);
    const buttonH = Phaser.Math.Clamp(height * 0.13, 68, 96);
    const titleMaxW = Math.max(330, routeX - titleX - routeW / 2 - 26);

    return {
      marginX,
      marginY,
      titleX,
      titleY,
      slapSize: Phaser.Math.Clamp(height * 0.147, 70, 106),
      streetSize: Phaser.Math.Clamp(height * 0.119, 56, 86),
      tagSize: Phaser.Math.Clamp(height * 0.036, 18, 26),
      bodyWidth: Math.max(260, routeX - titleX - routeW / 2 - 34),
      routeX,
      routeY: Phaser.Math.Clamp(height * 0.292, 150, 210),
      routeW,
      routeScale,
      startX: width - marginX - buttonW / 2,
      startY: height - marginY - buttonH / 2 - Phaser.Math.Clamp(height * 0.04, 14, 28),
      buttonW,
      buttonH,
      titleMaxW
    };
  }

  private drawCabinetHeader(width: number, layout: MenuLayout) {
    this.add.rectangle(width / 2, layout.marginY + 30, width - layout.marginX * 2 - 24, 56, 0x100a18, 0.94)
      .setStrokeStyle(2, arcadeRed, 0.62);
    this.add.text(layout.marginX + 28, layout.marginY + 16, 'ROUTE CABINET', {
      color: '#f4f4f2',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px'
    });
    this.add.text(width - layout.marginX - 28, layout.marginY + 16, '1 CREDIT', {
      color: '#75ff43',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px'
    }).setOrigin(1, 0);
    this.add.rectangle(width / 2, layout.marginY + 58, width - layout.marginX * 2 - 44, 4, arcadeGold, 0.86);
  }

  private drawRoutePreview(width: number, height: number, layout: MenuLayout) {
    const board = this.add.container(layout.routeX, layout.routeY).setScale(layout.routeScale);
    const stops = [
      { x: -130, y: -44, color: arcadeCyan, label: '01' },
      { x: -38, y: 22, color: arcadeRed, label: '02' },
      { x: 72, y: -16, color: arcadeGold, label: '03' },
      { x: 144, y: 56, color: arcadeGreen, label: '04' }
    ];

    board.add(this.add.rectangle(0, 30, 376, 214, 0x07080c, 0.72).setStrokeStyle(2, arcadeCyan, 0.48));
    board.add(this.add.text(-164, -54, 'NEXT STOPS', {
      color: '#f4f4f2',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px'
    }));

    for (let i = 0; i < stops.length - 1; i += 1) {
      const from = stops[i];
      const to = stops[i + 1];
      const line = this.add.line(0, 0, from.x, from.y + 26, to.x, to.y + 26, 0xffffff, 0.25)
        .setLineWidth(5);
      board.add(line);
    }

    stops.forEach((stop) => {
      board.add(this.add.circle(stop.x, stop.y + 26, 28, stop.color, 0.9).setStrokeStyle(4, 0x050506, 1));
      board.add(this.add.text(stop.x, stop.y + 12, stop.label, {
        color: '#050506',
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '25px'
      }).setOrigin(0.5));
    });

    if (height >= 430) {
      const workflowY = Math.max(layout.routeY + 154 * layout.routeScale, height - layout.marginY - layout.buttonH - 118);
      this.add.rectangle(layout.routeX, workflowY, layout.routeW, 54 * layout.routeScale, 0x15051f, 0.82)
        .setStrokeStyle(2, arcadeGold, 0.48);
      this.add.text(layout.routeX, workflowY - 6 * layout.routeScale, 'CHARACTER  >  ROUTE  >  FIGHT', {
        color: '#ffca3a',
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: `${Phaser.Math.Clamp(18 * layout.routeScale, 12, 18)}px`
      }).setOrigin(0.5);
    }
  }

  private makeButton(x: number, y: number, width: number, height: number, label: string, accent: number, onClick: () => void) {
    const container = this.add.container(x, y).setDepth(20);
    const plate = this.add.image(0, 0, assetKeys.uiObjectiveChip)
      .setDisplaySize(width + 42, height + 28)
      .setTint(accent);
    const glow = this.add.rectangle(0, 0, width, height - 28, accent, 0.64);
    const text = this.add.text(0, -2, label, {
      color: '#ffffff',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: `${Phaser.Math.Clamp(height * 0.44, 28, 42)}px`,
      stroke: '#07080c',
      strokeThickness: 7
    }).setOrigin(0.5);
    const hitZone = this.add.rectangle(0, 0, width, height, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    container.add([plate, glow, text, hitZone]);

    hitZone.on('pointerover', () => container.setScale(1.03));
    hitZone.on('pointerout', () => container.setScale(1));
    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      container.setScale(0.98);
      onClick();
    });
    hitZone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
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
