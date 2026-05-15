import Phaser from 'phaser';
import { assetKeys } from '../../game/assets/manifest';
import { levels, type LevelDefinition } from '../../game/content/levels';
import { addCoverImage, fitTextToWidth } from './sceneLayout';

type LevelCardData = {
  panel: Phaser.GameObjects.Rectangle;
  title: Phaser.GameObjects.Text;
  rail: Phaser.GameObjects.Rectangle;
  status: Phaser.GameObjects.Text;
  accent: number;
  state: 'finished' | 'next' | 'upcoming';
};

type LevelSelectLayout = {
  marginX: number;
  marginY: number;
  headerY: number;
  headerH: number;
  titleSize: number;
  metaSize: number;
  gridTop: number;
  gridBottom: number;
  detailY: number;
  detailW: number;
  detailH: number;
  showDetail: boolean;
  navY: number;
  backX: number;
  startX: number;
  buttonW: number;
  buttonH: number;
  columns: number;
  cardW: number;
  cardH: number;
  gapX: number;
  gapY: number;
  startXGrid: number;
};

export class LevelSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private detailTitle?: Phaser.GameObjects.Text;
  private detailBriefing?: Phaser.GameObjects.Text;
  private detailMeta?: Phaser.GameObjects.Text;
  private detailAccent?: Phaser.GameObjects.Rectangle;
  private clearedIds = new Set<string>();
  private nextPlayableIndex = 0;
  private inputReadyAt = 0;

  constructor() {
    super('LevelSelectScene');
  }

  create() {
    this.selectedIndex = 0;
    this.cards = [];
    this.clearedIds = this.getClearedIds();
    this.nextPlayableIndex = this.getNextPlayableIndex();
    this.selectedIndex = this.nextPlayableIndex;
    this.inputReadyAt = this.time.now + 220;

    const { width, height } = this.scale;
    addCoverImage(this, assetKeys.background, width / 2, height / 2, width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x050506, 0.82);
    const layout = this.getLayout(width, height);

    this.drawRouteHeader(width, layout, 'CITY');

    levels.forEach((level, index) => {
      const col = index % layout.columns;
      const row = Math.floor(index / layout.columns);
      this.cards.push(this.makeCard(
        level,
        layout.startXGrid + col * (layout.cardW + layout.gapX),
        layout.gridTop + layout.cardH / 2 + row * (layout.cardH + layout.gapY),
        index,
        layout.cardW,
        layout.cardH
      ));
    });

    this.makeButton(layout.backX, layout.navY, layout.buttonW, layout.buttonH, 'BACK', 0x00dfff, () => this.scene.start('CharacterSelectScene'));
    this.makeButton(layout.startX, layout.navY, layout.buttonW + 64, layout.buttonH, 'GO  ->', 0xef2b2d, () => this.chooseSelected());

    this.updateSelection();
    this.input.keyboard?.on('keydown-LEFT', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-A', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-D', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-UP', () => this.moveSelection(-layout.columns));
    this.input.keyboard?.on('keydown-W', () => this.moveSelection(-layout.columns));
    this.input.keyboard?.on('keydown-DOWN', () => this.moveSelection(layout.columns));
    this.input.keyboard?.on('keydown-S', () => this.moveSelection(layout.columns));
    this.input.keyboard?.on('keydown-ENTER', () => this.chooseSelected());
    this.input.keyboard?.on('keydown-SPACE', () => this.chooseSelected());
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('CharacterSelectScene'));
  }

  private getLayout(width: number, height: number): LevelSelectLayout {
    const marginX = Phaser.Math.Clamp(width * 0.045, 22, 54);
    const marginY = Phaser.Math.Clamp(height * 0.045, 18, 34);
    const headerH = Phaser.Math.Clamp(height * 0.078, 44, 58);
    const headerY = marginY + headerH / 2;
    const showDetail = false;
    const detailH = showDetail ? Phaser.Math.Clamp(height * 0.125, 70, 96) : 0;
    const buttonH = Phaser.Math.Clamp(height * 0.078, 46, 62);
    const navY = height - marginY - buttonH / 2;
    const detailY = showDetail ? navY - buttonH / 2 - 10 - detailH / 2 : navY;
    const gridTop = headerY + headerH / 2 + Phaser.Math.Clamp(height * 0.038, 18, 30);
    const gridBottom = showDetail
      ? detailY - detailH / 2 - Phaser.Math.Clamp(height * 0.022, 10, 18)
      : navY - buttonH / 2 - Phaser.Math.Clamp(height * 0.026, 10, 16);
    const gapX = Phaser.Math.Clamp(width * 0.018, 12, 24);
    const gapY = Phaser.Math.Clamp(height * 0.012, 6, 10);
    const columns = height < 520 || width < 760 ? 2 : 1;
    const rowCount = Math.ceil(levels.length / columns);
    const availableW = width - marginX * 2 - gapX * (columns - 1);
    const availableH = Math.max(1, gridBottom - gridTop - gapY * (rowCount - 1));
    const cardW = Math.floor(Phaser.Math.Clamp(availableW / columns, columns === 1 ? 420 : 170, columns === 1 ? 620 : 334));
    const cardH = Math.floor(Phaser.Math.Clamp(availableH / rowCount, 38, 58));
    const gridW = cardW * columns + gapX * (columns - 1);
    const startXGrid = width / 2 - gridW / 2 + cardW / 2;
    const buttonW = Phaser.Math.Clamp(width * 0.17, 148, 220);

    return {
      marginX,
      marginY,
      headerY,
      headerH,
      titleSize: Phaser.Math.Clamp(height * 0.061, 30, 44),
      metaSize: Phaser.Math.Clamp(width * 0.014, 13, 18),
      gridTop,
      gridBottom,
      detailY,
      detailW: Phaser.Math.Clamp(width - marginX * 2 - 430, 440, 690),
      detailH,
      showDetail,
      navY,
      backX: marginX + buttonW / 2,
      startX: width - marginX - (buttonW + 70) / 2,
      buttonW,
      buttonH,
      columns,
      cardW,
      cardH,
      gapX,
      gapY,
      startXGrid
    };
  }

  private drawRouteHeader(width: number, layout: LevelSelectLayout, title: string) {
    fitTextToWidth(this.add.text(width / 2, layout.headerY - layout.headerH / 2 + 2, title, {
      color: '#f4f4f2',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: `${layout.titleSize}px`,
      stroke: '#050506',
      strokeThickness: 7
    }).setOrigin(0.5, 0), width - layout.marginX * 2, 26);
  }

  private drawTrackLines(layout: LevelSelectLayout) {
    const rowCount = Math.ceil(levels.length / layout.columns);
    const left = layout.startXGrid;
    const top = layout.gridTop + layout.cardH / 2;
    const colStep = layout.cardW + layout.gapX;
    const rowStep = layout.cardH + layout.gapY;
    for (let row = 0; row < rowCount; row += 1) {
      this.add.line(0, 0, left, top + row * rowStep, left + colStep * (layout.columns - 1), top + row * rowStep, 0xffffff, 0.16)
        .setOrigin(0, 0)
        .setLineWidth(5);
    }
    for (let col = 0; col < layout.columns; col += 1) {
      this.add.line(0, 0, left + col * colStep, top - 14, left + col * colStep, top + rowStep * (rowCount - 1) + 14, 0x00dfff, 0.1)
        .setOrigin(0, 0)
        .setLineWidth(5);
    }
  }

  private makeCard(level: LevelDefinition, x: number, y: number, index: number, width: number, height: number) {
    const card = this.add.container(x, y);
    const accent = level.theme.accent;
    const state = this.getLevelState(index);
    const panel = this.add.rectangle(0, 0, width, height, 0x0d1018, 0.72)
      .setStrokeStyle(2, accent, 0.4)
      .setInteractive({ useHandCursor: true });
    const titleSize = Phaser.Math.Clamp(height * 0.34, 12, 16);
    const title = this.add.text(-width / 2 + 22, 0, level.title.toUpperCase(), {
      color: '#ffffff',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${titleSize}px`,
      wordWrap: { width: width - 150, useAdvancedWrap: true }
    }).setOrigin(0, 0.5);
    const statusLabel = state === 'finished' ? 'FINISHED' : state === 'next' ? 'NEXT  ->' : 'LOCKED';
    const statusColor = state === 'finished' ? '#75ff43' : state === 'next' ? '#ffca3a' : '#7f8696';
    const status = this.add.text(width / 2 - 18, 0, statusLabel, {
      color: statusColor,
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${Phaser.Math.Clamp(height * 0.28, 10, 13)}px`
    }).setOrigin(1, 0.5);
    const rail = this.add.rectangle(-width / 2 + 5, 0, 6, height - 12, accent, 0.72);
    card.add([panel, rail, title, status]);
    card.setData('cardData', { panel, title, rail, status, accent, state } satisfies LevelCardData);
    panel.on('pointerover', () => {
      if (!this.inputReady()) return;
      if (this.getLevelState(index) === 'upcoming') return;
      this.selectedIndex = index;
      this.updateSelection();
    });
    panel.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      if (!this.inputReady()) return;
      if (this.getLevelState(index) === 'upcoming') return;
      this.selectedIndex = index;
      this.updateSelection();
    });
    panel.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
    });
    return card;
  }

  private drawDetailPanel(width: number, layout: LevelSelectLayout) {
    const y = layout.detailY;
    const x = width / 2;
    this.add.rectangle(x, y, layout.detailW, layout.detailH, 0x100a18, 0.9)
      .setStrokeStyle(2, 0xffca3a, 0.5);
    this.detailAccent = this.add.rectangle(x - layout.detailW / 2 + 16, y, 8, layout.detailH - 24, 0xffca3a, 0.9);
    this.detailTitle = this.add.text(x - layout.detailW / 2 + 34, y - layout.detailH / 2 + 12, '', {
      color: '#ffffff',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: `${Phaser.Math.Clamp(layout.detailH * 0.29, 19, 28)}px`,
      stroke: '#050506',
      strokeThickness: 5
    });
    this.detailBriefing = this.add.text(x - layout.detailW / 2 + 34, y + 4, '', {
      color: '#d9dae3',
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Phaser.Math.Clamp(layout.detailH * 0.16, 12, 15)}px`,
      wordWrap: { width: layout.detailW - 210, useAdvancedWrap: true }
    });
    this.detailMeta = this.add.text(x + layout.detailW / 2 - 24, y - 14, '', {
      color: '#ffca3a',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${Phaser.Math.Clamp(layout.detailH * 0.16, 12, 16)}px`,
      align: 'right'
    }).setOrigin(1, 0);
  }

  private makeButton(x: number, y: number, width: number, height: number, label: string, accent: number, onClick: () => void) {
    const button = this.add.container(x, y).setDepth(20);
    const plate = this.add.rectangle(0, 0, width, height, 0x0e1119, 0.94)
      .setStrokeStyle(3, accent, 0.88);
    const text = fitTextToWidth(this.add.text(0, -2, label, {
      color: '#f4f4f2',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '27px',
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

  private moveSelection(delta: number) {
    if (!this.inputReady()) return;
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + delta, 0, levels.length);
    this.updateSelection();
  }

  private updateSelection() {
    this.cards.forEach((card, index) => {
      const selected = index === this.selectedIndex;
      const data = card.getData('cardData') as LevelCardData;
      const locked = data.state === 'upcoming';
      card.setScale(selected ? 1.02 : 1);
      card.setAlpha(locked ? 0.42 : selected ? 1 : 0.76);
      data.panel.setFillStyle(selected ? 0x171a24 : 0x0d1018, selected ? 0.9 : 0.66);
      data.panel.setStrokeStyle(selected ? 4 : 2, data.accent, selected ? 1 : 0.36);
      data.title.setColor(selected ? '#ffffff' : '#cfd4df');
      data.status.setAlpha(selected ? 1 : 0.82);
      data.rail.setAlpha(selected ? 0.95 : 0.42);
    });

    const level = levels[this.selectedIndex];
    if (!level) return;
    this.detailTitle?.setText(`${this.selectedIndex + 1}. ${level.title.toUpperCase()}`);
    this.detailBriefing?.setText(level.briefing);
    const state = this.getLevelState(this.selectedIndex);
    const routeState = state === 'finished' ? 'FINISHED' : state === 'next' ? 'NEXT FIGHT ->' : 'UPCOMING';
    this.detailMeta?.setText(`${routeState}\n${level.enemyStarts.length} CHALLENGERS\nEXIT: ${level.exitLabel.toUpperCase()}`);
    this.detailMeta?.setColor(this.hex(level.theme.accent));
    this.detailAccent?.setFillStyle(level.theme.accent, 0.95);
  }

  private chooseSelected() {
    if (!this.inputReady()) return;
    if (this.getLevelState(this.selectedIndex) === 'upcoming') {
      this.selectedIndex = this.nextPlayableIndex;
      this.updateSelection();
      return;
    }
    this.registry.set('selectedLevel', levels[this.selectedIndex].id);
    this.scene.start('Level1Scene');
  }

  private getLevelState(index: number) {
    if (index < this.nextPlayableIndex || this.clearedIds.has(levels[index]?.id)) return 'finished' as const;
    if (index === this.nextPlayableIndex) return 'next' as const;
    return 'upcoming' as const;
  }

  private getNextPlayableIndex() {
    const firstUncleared = levels.findIndex((level) => !this.clearedIds.has(level.id));
    return firstUncleared >= 0 ? firstUncleared : levels.length - 1;
  }

  private getClearedIds() {
    const ids = this.registry.get('clearedLevels');
    return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []);
  }

  private inputReady() {
    return this.time.now >= this.inputReadyAt;
  }

  private hex(value: number) {
    return `#${value.toString(16).padStart(6, '0')}`;
  }
}
