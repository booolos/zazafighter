import Phaser from 'phaser';
import { playCharacterAnimation } from '../../game/assets/loaders';
import { assetKeys } from '../../game/assets/manifest';
import { playableCharacters, type CharacterDefinition } from '../../game/content/characters';
import { addCoverImage, fitTextToWidth } from './sceneLayout';

type FighterCardData = {
  panel: Phaser.GameObjects.Rectangle;
  callToAction: Phaser.GameObjects.Text;
  accent: number;
  baseScale: number;
};

type CharacterSelectLayout = {
  marginX: number;
  marginY: number;
  headerY: number;
  headerH: number;
  titleSize: number;
  metaSize: number;
  cardY: number;
  cardScale: number;
  spacing: number;
  hintY: number;
  showHint: boolean;
  navY: number;
  backX: number;
  continueX: number;
  buttonW: number;
  buttonH: number;
};

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private selectionLocked = false;
  private inputReadyAt = 0;

  constructor() {
    super('CharacterSelectScene');
  }

  create() {
    this.selectedIndex = 0;
    this.cards = [];
    this.selectionLocked = false;
    this.inputReadyAt = this.time.now + 260;

    const { width, height } = this.scale;
    const layout = this.getLayout(width, height);
    addCoverImage(this, assetKeys.background, width / 2, height / 2, width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x050506, 0.74);

    this.drawRouteHeader(width, layout, 'FIGHTER');

    const startX = width / 2 - ((playableCharacters.length - 1) * layout.spacing) / 2;
    playableCharacters.forEach((character, index) => {
      this.cards.push(this.makeCard(character, startX + index * layout.spacing, layout.cardY, index, layout.cardScale));
    });

    this.makeButton(layout.backX, layout.navY, layout.buttonW, layout.buttonH, 'BACK', 0x00dfff, () => this.scene.start('MenuScene'));
    this.makeButton(layout.continueX, layout.navY, layout.buttonW + 70, layout.buttonH, 'PLAY  ->', 0xef2b2d, () => this.chooseSelected());

    this.updateSelection();

    this.input.keyboard?.on('keydown-LEFT', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-A', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-D', () => this.moveSelection(1));
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MenuScene'));
    this.input.keyboard?.on('keydown-ENTER', () => this.chooseSelected());
    this.input.keyboard?.on('keydown-SPACE', () => this.chooseSelected());
  }

  private getLayout(width: number, height: number): CharacterSelectLayout {
    const marginX = Phaser.Math.Clamp(width * 0.045, 22, 54);
    const marginY = Phaser.Math.Clamp(height * 0.045, 18, 34);
    const headerH = Phaser.Math.Clamp(height * 0.078, 44, 58);
    const headerY = marginY + headerH / 2;
    const buttonH = Phaser.Math.Clamp(height * 0.078, 46, 64);
    const buttonW = Phaser.Math.Clamp(width * 0.17, 148, 220);
    const navY = height - marginY - buttonH / 2;
    const showHint = height >= 520;
    const hintY = navY - buttonH / 2 - 42;
    const cardTop = headerY + headerH / 2 + Phaser.Math.Clamp(height * 0.04, 18, 34);
    const cardBottom = (showHint ? hintY - 22 : navY - buttonH / 2 - 18);
    const cardScaleByHeight = (cardBottom - cardTop) / (404 * 1.045);
    const spacing = Math.min(438, (width - marginX * 2) / Math.max(playableCharacters.length, 1));
    const cardScaleByWidth = (spacing * 0.86) / 320;
    const cardScale = Phaser.Math.Clamp(Math.min(cardScaleByHeight, cardScaleByWidth, 1), 0.42, 1);

    return {
      marginX,
      marginY,
      headerY,
      headerH,
      titleSize: Phaser.Math.Clamp(height * 0.061, 30, 44),
      metaSize: Phaser.Math.Clamp(width * 0.014, 13, 18),
      cardY: (cardTop + cardBottom) / 2,
      cardScale,
      spacing,
      hintY,
      showHint,
      navY,
      backX: marginX + buttonW / 2,
      continueX: width - marginX - (buttonW + 80) / 2,
      buttonW,
      buttonH
    };
  }

  private drawRouteHeader(width: number, layout: CharacterSelectLayout, title: string) {
    fitTextToWidth(this.add.text(width / 2, layout.headerY - layout.headerH / 2 + 2, title, {
      color: '#f4f4f2',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: `${layout.titleSize}px`,
      stroke: '#050506',
      strokeThickness: 7
    }).setOrigin(0.5, 0), width - layout.marginX * 2, 26);
  }

  private makeCard(def: CharacterDefinition, x: number, y: number, index: number, baseScale: number) {
    const container = this.add.container(x, y);
    const bgColor = def.id === 'kiko' ? 0x071b17 : 0x1d1108;
    const accent = def.id === 'kiko' ? 0x75ff43 : 0xffca3a;
    const panel = this.add.rectangle(0, 0, 320, 404, bgColor, 0.52)
      .setStrokeStyle(3, accent, 0.54)
      .setInteractive({ useHandCursor: true });
    const sprite = this.add.sprite(0, 24, def.seed.key).setScale(def.render.scale * 1.78);
    playCharacterAnimation(sprite, def.id, 'idle');
    const name = this.add.text(0, -164, def.displayName.toUpperCase(), {
      color: '#ffffff',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '40px',
      stroke: '#000000',
      strokeThickness: 7
    }).setOrigin(0.5);
    const callToAction = this.add.text(0, 166, 'SELECT', {
      color: '#050506',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '16px',
      backgroundColor: this.hex(accent),
      padding: { x: 18, y: 5 }
    }).setOrigin(0.5);

    container.add([panel, sprite, name, callToAction]);
    container.setData('cardData', { panel, callToAction, accent, baseScale } satisfies FighterCardData);

    panel.on('pointerover', () => {
      if (!this.inputReady()) return;
      this.selectedIndex = index;
      this.updateSelection();
    });
    panel.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      if (!this.inputReady()) return;
      this.selectedIndex = index;
      this.updateSelection();
    });
    panel.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
    });
    return container;
  }

  private makeButton(x: number, y: number, width: number, height: number, label: string, accent: number, onClick: () => void) {
    const button = this.add.container(x, y).setDepth(20);
    const plate = this.add.rectangle(0, 0, width, height, 0x0e1119, 0.94)
      .setStrokeStyle(3, accent, 0.88);
    const text = fitTextToWidth(this.add.text(0, -2, label, {
      color: '#f4f4f2',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '28px',
      stroke: '#050506',
      strokeThickness: 5
    }).setOrigin(0.5), width - 26, 20);
    const hitZone = this.add.rectangle(0, 0, width, height, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    button.add([plate, text, hitZone]);
    hitZone.on('pointerover', () => button.setScale(1.035));
    hitZone.on('pointerout', () => button.setScale(1));
    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      button.setScale(0.98);
      onClick();
    });
    hitZone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
    });
    return button;
  }

  private moveSelection(direction: number) {
    if (!this.inputReady()) return;
    if (this.cards.length === 0) return;
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + direction, 0, this.cards.length);
    this.updateSelection();
  }

  private updateSelection() {
    this.cards.forEach((card, index) => {
      const selected = index === this.selectedIndex;
      const data = card.getData('cardData') as FighterCardData;
      card.setScale(data.baseScale * (selected ? 1.045 : 0.98));
      card.setAlpha(selected ? 1 : 0.78);
      data.panel.setStrokeStyle(selected ? 6 : 3, data.accent, selected ? 1 : 0.68);
      data.callToAction.setText(selected ? 'READY' : 'SELECT');
      data.callToAction.setAlpha(selected ? 1 : 0.72);
    });
  }

  private chooseSelected() {
    if (!this.inputReady()) return;
    if (this.selectionLocked) return;
    const selected = playableCharacters[this.selectedIndex];
    if (!selected) return;
    this.selectionLocked = true;
    this.registry.set('selectedPlayer', selected.id);
    this.scene.start('LevelSelectScene');
  }

  private inputReady() {
    return this.time.now >= this.inputReadyAt;
  }

  private hex(value: number) {
    return `#${value.toString(16).padStart(6, '0')}`;
  }
}
