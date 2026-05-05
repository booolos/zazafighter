import Phaser from 'phaser';
import { playCharacterAnimation } from '../../game/assets/loaders';
import { assetKeys } from '../../game/assets/manifest';
import { playableCharacters, type CharacterDefinition } from '../../game/content/characters';
import { addCoverImage, fitTextToWidth } from './sceneLayout';

type FighterCardData = {
  panel: Phaser.GameObjects.Rectangle;
  badge: Phaser.GameObjects.Rectangle;
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
    addCoverImage(this, assetKeys.backgroundThumb, width / 2, height / 2, width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x050506, 0.68);
    this.add.rectangle(width / 2, height / 2, width - layout.marginX * 2, height - layout.marginY * 2, 0x07080c, 0.5)
      .setStrokeStyle(3, 0x00dfff, 0.36);

    this.drawRouteHeader(width, layout, '01  FIGHTER PASS', 'CHOOSE YOUR MAIN');

    const startX = width / 2 - ((playableCharacters.length - 1) * layout.spacing) / 2;
    playableCharacters.forEach((character, index) => {
      this.cards.push(this.makeCard(character, startX + index * layout.spacing, layout.cardY, index, layout.cardScale));
    });

    if (layout.showHint) {
      this.add.text(width / 2, layout.hintY, 'LEFT / RIGHT TO PICK', {
        color: '#d9dae3',
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '15px'
      }).setOrigin(0.5);
    }
    this.makeButton(layout.backX, layout.navY, layout.buttonW, layout.buttonH, 'BACK', 0x00dfff, () => this.scene.start('MenuScene'));
    this.makeButton(layout.continueX, layout.navY, layout.buttonW + 80, layout.buttonH, 'CONTINUE', 0xef2b2d, () => this.chooseSelected());

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
    const cardScaleByHeight = (cardBottom - cardTop) / (464 * 1.045);
    const spacing = Math.min(438, (width - marginX * 2) / Math.max(playableCharacters.length, 1));
    const cardScaleByWidth = (spacing * 0.88) / 388;
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

  private drawRouteHeader(width: number, layout: CharacterSelectLayout, step: string, title: string) {
    this.add.rectangle(width / 2, layout.headerY, width - layout.marginX * 2 - 60, layout.headerH, 0x100a18, 0.94)
      .setStrokeStyle(2, 0xef2b2d, 0.62);
    this.add.text(layout.marginX + 28, layout.headerY - layout.metaSize / 2, step, {
      color: '#ffca3a',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${layout.metaSize}px`
    });
    fitTextToWidth(this.add.text(width / 2, layout.headerY - layout.headerH / 2 + 2, title, {
      color: '#f4f4f2',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: `${layout.titleSize}px`,
      stroke: '#050506',
      strokeThickness: 7
    }).setOrigin(0.5, 0), width - layout.marginX * 2 - 210, 26);
    this.add.text(width - layout.marginX - 28, layout.headerY - layout.metaSize / 2, 'ESC BACK', {
      color: '#00dfff',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${layout.metaSize}px`
    }).setOrigin(1, 0);
    this.add.rectangle(width / 2, layout.headerY + layout.headerH / 2, width - layout.marginX * 2 - 80, 4, 0xffca3a, 0.86);
  }

  private makeCard(def: CharacterDefinition, x: number, y: number, index: number, baseScale: number) {
    const container = this.add.container(x, y);
    const bgColor = def.id === 'kiko' ? 0x071b17 : 0x1d1108;
    const accent = def.id === 'kiko' ? 0x75ff43 : 0xffca3a;
    const panel = this.add.rectangle(0, 0, 388, 464, bgColor, 0.88)
      .setStrokeStyle(3, accent, 0.74)
      .setInteractive({ useHandCursor: true });
    const topFrame = this.add.image(0, -205, assetKeys.uiCharacterPanel)
      .setDisplaySize(408, 128)
      .setAlpha(0.44);
    const badge = this.add.rectangle(0, -220, 210, 38, accent, 0.88);
    const routeNumber = this.add.text(0, -238, `FIGHTER ${index + 1}`, {
      color: '#050506',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '17px'
    }).setOrigin(0.5);
    const sprite = this.add.sprite(0, 26, def.seed.key).setScale(def.render.scale * 1.54);
    playCharacterAnimation(sprite, def.id, 'idle');
    const name = this.add.text(0, -184, def.displayName.toUpperCase(), {
      color: '#ffffff',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '42px',
      stroke: '#000000',
      strokeThickness: 7
    }).setOrigin(0.5);
    const handle = this.add.text(0, -143, def.handle.toUpperCase(), {
      color: this.hex(accent),
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px'
    }).setOrigin(0.5);
    const statPanel = this.add.image(0, 184, assetKeys.uiDialogueFrame)
      .setDisplaySize(342, 98)
      .setAlpha(0.64);
    const stats = this.add.text(0, 158, `HP ${def.stats.maxHp}     DMG ${def.stats.attackDamage}`, {
      color: '#f4f4f2',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px'
    }).setOrigin(0.5);
    const speed = this.add.text(0, 188, `SPEED ${def.stats.speed}     SUPER ${def.stats.superDamage}`, {
      color: '#d9dae3',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '15px'
    }).setOrigin(0.5);
    const callToAction = this.add.text(0, 226, 'SELECT', {
      color: '#050506',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '16px',
      backgroundColor: this.hex(accent),
      padding: { x: 18, y: 5 }
    }).setOrigin(0.5);

    container.add([panel, topFrame, badge, routeNumber, sprite, name, handle, statPanel, stats, speed, callToAction]);
    container.setData('cardData', { panel, badge, callToAction, accent, baseScale } satisfies FighterCardData);

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
    const rail = this.add.rectangle(0, height / 2 - 7, width - 22, 6, accent, 0.72);
    const text = fitTextToWidth(this.add.text(0, -3, label, {
      color: '#f4f4f2',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '30px',
      stroke: '#050506',
      strokeThickness: 5
    }).setOrigin(0.5), width - 26, 20);
    const hitZone = this.add.rectangle(0, 0, width, height, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    button.add([plate, rail, text, hitZone]);
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
      data.badge.setAlpha(selected ? 1 : 0.56);
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
