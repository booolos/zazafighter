import Phaser from 'phaser';
import { assetKeys } from '../../game/assets/manifest';
import { levels, type LevelDefinition } from '../../game/content/levels';

export class LevelSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private inputReadyAt = 0;

  constructor() {
    super('LevelSelectScene');
  }

  create() {
    this.selectedIndex = 0;
    this.cards = [];
    this.inputReadyAt = this.time.now + 220;

    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, assetKeys.backgroundThumb).setDisplaySize(width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x050506, 0.7);

    this.add.text(width / 2, 58, 'CHOOSE STREET', {
      color: '#f4f4f2',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '48px',
      stroke: '#000000',
      strokeThickness: 7
    }).setOrigin(0.5);

    const columns = 3;
    const cardW = 330;
    const cardH = 138;
    const startX = width / 2 - cardW - 18;
    const startY = 180;
    levels.forEach((level, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      this.cards.push(this.makeCard(level, startX + col * (cardW + 18), startY + row * (cardH + 18), index, cardW, cardH));
    });

    this.updateSelection();
    this.input.keyboard?.on('keydown-LEFT', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-A', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-D', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-UP', () => this.moveSelection(-columns));
    this.input.keyboard?.on('keydown-W', () => this.moveSelection(-columns));
    this.input.keyboard?.on('keydown-DOWN', () => this.moveSelection(columns));
    this.input.keyboard?.on('keydown-S', () => this.moveSelection(columns));
    this.input.keyboard?.on('keydown-ENTER', () => this.chooseSelected());
    this.input.keyboard?.on('keydown-SPACE', () => this.chooseSelected());
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('CharacterSelectScene'));
  }

  private makeCard(level: LevelDefinition, x: number, y: number, index: number, width: number, height: number) {
    const card = this.add.container(x, y);
    const panel = this.add.rectangle(0, 0, width, height, 0x07080c, 0.78)
      .setStrokeStyle(3, level.theme.accent, 0.72)
      .setInteractive({ useHandCursor: true });
    const number = this.add.text(-width / 2 + 22, -height / 2 + 14, `${index + 1}`, {
      color: '#ffca3a',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '28px',
      stroke: '#000000',
      strokeThickness: 5
    });
    const title = this.add.text(-width / 2 + 62, -height / 2 + 18, level.title.toUpperCase(), {
      color: '#ffffff',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      wordWrap: { width: width - 84 }
    });
    const briefing = this.add.text(-width / 2 + 22, -8, level.briefing, {
      color: '#cfd4df',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      wordWrap: { width: width - 44, useAdvancedWrap: true }
    });
    const exit = this.add.text(width / 2 - 22, height / 2 - 28, level.exitLabel, {
      color: Phaser.Display.Color.IntegerToColor(level.theme.accent).rgba,
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '14px'
    }).setOrigin(1, 0.5);
    card.add([panel, number, title, briefing, exit]);
    card.setData('panel', panel);
    card.setData('accent', level.theme.accent);
    panel.on('pointerover', () => {
      if (!this.inputReady()) return;
      this.selectedIndex = index;
      this.updateSelection();
    });
    panel.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      if (!this.inputReady()) return;
      this.selectedIndex = index;
      this.chooseSelected();
    });
    return card;
  }

  private moveSelection(delta: number) {
    if (!this.inputReady()) return;
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + delta, 0, levels.length);
    this.updateSelection();
  }

  private updateSelection() {
    this.cards.forEach((card, index) => {
      const selected = index === this.selectedIndex;
      const panel = card.getData('panel') as Phaser.GameObjects.Rectangle;
      const accent = card.getData('accent') as number;
      card.setScale(selected ? 1.035 : 1);
      panel.setStrokeStyle(selected ? 5 : 3, accent, selected ? 1 : 0.72);
    });
  }

  private chooseSelected() {
    if (!this.inputReady()) return;
    this.registry.set('selectedLevel', levels[this.selectedIndex].id);
    this.scene.start('Level1Scene');
  }

  private inputReady() {
    return this.time.now >= this.inputReadyAt;
  }
}
