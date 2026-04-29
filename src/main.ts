import Phaser from 'phaser';
import './styles.css';
import { setupDomHud } from './ui/domHud';
import { BootScene } from './phaser/scenes/BootScene';
import { CharacterSelectScene } from './phaser/scenes/CharacterSelectScene';
import { Level1Scene } from './phaser/scenes/Level1Scene';
import { MenuScene } from './phaser/scenes/MenuScene';
import { PreloadScene } from './phaser/scenes/PreloadScene';
import { UIScene } from './phaser/scenes/UIScene';

setupDomHud();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#07080c',
  width: 1280,
  height: 720,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 }
    }
  },
  render: {
    antialias: true,
    pixelArt: false,
    powerPreference: 'high-performance'
  },
  input: {
    activePointers: 6
  },
  scene: [BootScene, PreloadScene, MenuScene, CharacterSelectScene, Level1Scene, UIScene]
};

new Phaser.Game(config);
