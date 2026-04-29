import Phaser from 'phaser';
import { playCharacterAnimation } from '../../game/assets/loaders';
import { assetKeys } from '../../game/assets/manifest';
import { playableCharacters, type CharacterDefinition } from '../../game/content/characters';

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
    this.add.image(width / 2, height / 2, assetKeys.backgroundThumb).setDisplaySize(width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x07080c, 0.64);

    this.add.text(width / 2, 62, 'CHOOSE YOUR MAIN', {
      color: '#f4f4f2',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '48px',
      stroke: '#000000',
      strokeThickness: 7
    }).setOrigin(0.5);

    const spacing = Math.min(430, width / Math.max(playableCharacters.length, 1));
    const startX = width / 2 - ((playableCharacters.length - 1) * spacing) / 2;
    playableCharacters.forEach((character, index) => {
      this.cards.push(this.makeCard(character, startX + index * spacing, height * 0.55, index));
    });
    this.updateSelection();

    this.input.keyboard?.on('keydown-LEFT', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-A', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-D', () => this.moveSelection(1));
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MenuScene'));
    this.input.keyboard?.on('keydown-ENTER', () => this.chooseSelected());
    this.input.keyboard?.on('keydown-SPACE', () => this.chooseSelected());
  }

  private makeCard(def: CharacterDefinition, x: number, y: number, index: number) {
    const container = this.add.container(x, y);
    const bgColor = def.id === 'kiko' ? 0x0a2a1f : 0x211706;
    const accent = def.id === 'kiko' ? 0x75ff43 : 0xffca3a;
    const panel = this.add.rectangle(0, 0, 360, 500, bgColor, 0.76)
      .setStrokeStyle(3, accent, 0.76)
      .setInteractive({ useHandCursor: true });
    const artFrame = this.add.image(0, -234, assetKeys.uiCharacterPanel)
      .setDisplaySize(386, 150)
      .setAlpha(0.38);
    const footerFrame = this.add.image(0, 220, assetKeys.uiDialogueFrame)
      .setDisplaySize(320, 84)
      .setAlpha(0.58);
    const sprite = this.add.sprite(0, 54, def.seed.key).setScale(def.render.scale * 1.58);
    playCharacterAnimation(sprite, def.id, 'idle');
    const name = this.add.text(0, -214, def.displayName.toUpperCase(), {
      color: '#ffffff',
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '42px',
      stroke: '#000000',
      strokeThickness: 7
    }).setOrigin(0.5);
    const handle = this.add.text(0, -172, def.handle, {
      color: def.id === 'kiko' ? '#75ff43' : '#ffca3a',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px'
    }).setOrigin(0.5);
    const stat = this.add.text(0, 220, `${def.handle}  HP ${def.stats.maxHp}  DMG ${def.stats.attackDamage}`, {
      color: '#d9dae3',
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '16px'
    }).setOrigin(0.5);
    container.add([panel, artFrame, footerFrame, sprite, name, handle, stat]);
    container.setData('characterId', def.id);
    container.setData('accent', accent);
    container.setData('panel', panel);

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
    panel.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
    });
    return container;
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
      const panel = card.getData('panel') as Phaser.GameObjects.Rectangle | undefined;
      const accent = card.getData('accent') as number | undefined;
      card.setScale(selected ? 1.045 : 1);
      panel?.setStrokeStyle(selected ? 5 : 3, accent ?? 0xffffff, selected ? 0.98 : 0.76);
    });
  }

  private chooseSelected() {
    if (!this.inputReady()) return;
    if (this.selectionLocked) return;
    const selected = playableCharacters[this.selectedIndex];
    if (!selected) return;
    this.selectionLocked = true;
    this.registry.set('selectedPlayer', selected.id);
    this.scene.start('Level1Scene');
  }

  private inputReady() {
    return this.time.now >= this.inputReadyAt;
  }
}
