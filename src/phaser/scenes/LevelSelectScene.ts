import Phaser from 'phaser';
import { assetKeys } from '../../game/assets/manifest';
import { levels, type LevelDefinition } from '../../game/content/levels';
import { addCoverImage, fitTextToWidth } from './sceneLayout';

type LevelCardData = {
  panel: Phaser.GameObjects.Rectangle;
  indexLabel: Phaser.GameObjects.Text;
  title: Phaser.GameObjects.Text;
  rail: Phaser.GameObjects.Rectangle;
  status: Phaser.GameObjects.Text;
  accent: number;
  state: 'cleared' | 'open';
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
  private inputReadyAt = 0;

  constructor() {
    super('LevelSelectScene');
  }

  create() {
    this.selectedIndex = 0;
    this.cards = [];
    this.clearedIds = this.getClearedIds();
    const selectedLevelId = this.registry.get('selectedLevel');
    const selectedFromRegistry = levels.findIndex((level) => level.id === selectedLevelId);
    this.selectedIndex = selectedFromRegistry >= 0 ? selectedFromRegistry : 0;
    this.inputReadyAt = this.time.now + 220;

    const { width, height } = this.scale;
    addCoverImage(this, assetKeys.background, width / 2, height / 2, width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x050506, 0.88);
    const layout = this.getLayout(width, height);

    this.drawRouteHeader(width, layout, 'SELECT CITY');

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
    const marginY = Phaser.Math.Clamp(height * 0.04, 14, 34);
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
      : navY - buttonH / 2 - Phaser.Math.Clamp(height * 0.02, 8, 16);
    const gapX = Phaser.Math.Clamp(width * 0.018, 12, 22);
    const gapY = Phaser.Math.Clamp(height * 0.014, 6, 12);
    const columns = width < 720 && height >= width ? 1 : 2;
    const rowCount = Math.ceil(levels.length / columns);
    const availableW = width - marginX * 2 - gapX * (columns - 1);
    const availableH = Math.max(1, gridBottom - gridTop - gapY * (rowCount - 1));
    const cardW = Math.floor(Phaser.Math.Clamp(availableW / columns, columns === 1 ? 300 : 260, columns === 1 ? 680 : 560));
    const cardH = Math.floor(Phaser.Math.Clamp(availableH / rowCount, 46, height < 500 ? 64 : 86));
    const gridW = cardW * columns + gapX * (columns - 1);
    const startXGrid = width / 2 - gridW / 2 + cardW / 2;
    const buttonW = Phaser.Math.Clamp(width * 0.19, 150, 232);

    return {
      marginX,
      marginY,
      headerY,
      headerH,
      titleSize: Phaser.Math.Clamp(height * 0.058, 28, 44),
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
    const panel = this.add.rectangle(0, 0, width, height, 0x0d1018, 0.78)
      .setStrokeStyle(2, accent, 0.52)
      .setInteractive({ useHandCursor: true });
    const indexBack = this.add.rectangle(-width / 2 + 37, 0, 50, height - 14, accent, 0.2)
      .setStrokeStyle(1, accent, 0.7);
    const indexLabel = this.add.text(-width / 2 + 37, -1, `${index + 1}`, {
      color: '#ffca3a',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: `${Phaser.Math.Clamp(height * 0.46, 17, 24)}px`,
      stroke: '#050506',
      strokeThickness: 4
    }).setOrigin(0.5);
    const titleSize = Phaser.Math.Clamp(height * 0.32, 13, 20);
    const title = fitTextToWidth(this.add.text(-width / 2 + 76, 0, level.title.toUpperCase(), {
      color: '#ffffff',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${titleSize}px`,
      wordWrap: { width: width - 186, useAdvancedWrap: true }
    }).setOrigin(0, 0.5), width - 188, 12);
    const statusLabel = state === 'cleared' ? 'CLEARED' : 'OPEN';
    const statusColor = state === 'cleared' ? '#75ff43' : '#ffca3a';
    const status = fitTextToWidth(this.add.text(width / 2 - 18, 0, statusLabel, {
      color: statusColor,
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: `${Phaser.Math.Clamp(height * 0.23, 11, 14)}px`
    }).setOrigin(1, 0.5), 80, 10);
    const rail = this.add.rectangle(-width / 2 + 5, 0, 6, height - 12, accent, 0.72);
    card.add([panel, rail, indexBack, indexLabel, title, status]);
    card.setData('cardData', { panel, indexLabel, title, rail, status, accent, state } satisfies LevelCardData);
    panel.on('pointerover', () => {
      if (!this.inputReady()) return;
      this.selectedIndex = index;
      this.updateSelection();
    });
    panel.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      if (!this.inputReady()) return;
      this.selectedIndex = index;
      card.setData('pressed', true);
      this.updateSelection();
    });
    panel.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      if (!this.inputReady() || !card.getData('pressed')) return;
      card.setData('pressed', false);
      this.selectedIndex = index;
      this.chooseSelected();
    });
    panel.on('pointerout', () => {
      card.setData('pressed', false);
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
      card.setScale(selected ? 1.02 : 1);
      card.setAlpha(selected ? 1 : 0.86);
      data.panel.setFillStyle(selected ? 0x171a24 : 0x0d1018, selected ? 0.94 : 0.74);
      data.panel.setStrokeStyle(selected ? 4 : 2, data.accent, selected ? 1 : 0.46);
      data.indexLabel.setColor(selected ? '#ffffff' : '#ffca3a');
      data.title.setColor(selected ? '#ffffff' : '#cfd4df');
      data.status.setAlpha(selected ? 1 : 0.9);
      data.rail.setAlpha(selected ? 0.95 : 0.42);
    });

    const level = levels[this.selectedIndex];
    if (!level) return;
    this.detailTitle?.setText(`${this.selectedIndex + 1}. ${level.title.toUpperCase()}`);
    this.detailBriefing?.setText(level.briefing);
    const state = this.getLevelState(this.selectedIndex);
    const routeState = state === 'cleared' ? 'CLEARED' : 'OPEN';
    this.detailMeta?.setText(`${routeState}\n${level.enemyStarts.length} CHALLENGERS\nEXIT: ${level.exitLabel.toUpperCase()}`);
    this.detailMeta?.setColor(this.hex(level.theme.accent));
    this.detailAccent?.setFillStyle(level.theme.accent, 0.95);
  }

  private chooseSelected() {
    if (!this.inputReady()) return;
    this.registry.set('selectedLevel', levels[this.selectedIndex].id);
    this.scene.start('Level1Scene');
  }

  private getLevelState(index: number) {
    return this.clearedIds.has(levels[index]?.id) ? 'cleared' as const : 'open' as const;
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
