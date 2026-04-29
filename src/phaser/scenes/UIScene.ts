import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.dispatchEvent(new CustomEvent('slap:level-state', { detail: { active: false } }));
    });
  }
}
