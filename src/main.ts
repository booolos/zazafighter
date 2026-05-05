import Phaser from 'phaser';
import './styles.css';
import { setupDomHud } from './ui/domHud';
import { BootScene } from './phaser/scenes/BootScene';
import { CharacterSelectScene } from './phaser/scenes/CharacterSelectScene';
import { Level1Scene } from './phaser/scenes/Level1Scene';
import { LevelSelectScene } from './phaser/scenes/LevelSelectScene';
import { MenuScene } from './phaser/scenes/MenuScene';
import { PreloadScene } from './phaser/scenes/PreloadScene';
import { UIScene } from './phaser/scenes/UIScene';

installMobileInputGuards();
setupDomHud();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#07080c',
  width: 1280,
  height: 720,
  scale: {
    mode: Phaser.Scale.EXPAND,
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
  scene: [BootScene, PreloadScene, MenuScene, CharacterSelectScene, LevelSelectScene, Level1Scene, UIScene]
};

new Phaser.Game(config);

function installMobileInputGuards() {
  let lastTouchEnd = 0;
  const preventDefault = (event: Event) => {
    event.preventDefault();
  };

  document.addEventListener('gesturestart', preventDefault, { passive: false });
  document.addEventListener('gesturechange', preventDefault, { passive: false });
  document.addEventListener('dblclick', preventDefault, { passive: false });
  document.addEventListener(
    'touchend',
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd < 340) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );
}
