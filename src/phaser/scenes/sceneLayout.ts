import Phaser from 'phaser';

export function addCoverImage(
  scene: Phaser.Scene,
  key: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const image = scene.add.image(x, y, key).setOrigin(0.5);
  const texture = scene.textures.get(key);
  const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
  const sourceWidth = source?.width || width;
  const sourceHeight = source?.height || height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  image.setScale(scale);
  return image;
}

export function fitTextToWidth(text: Phaser.GameObjects.Text, maxWidth: number, minSize: number) {
  const style = text.style;
  const currentSize = Number.parseFloat(String(style.fontSize));
  let size = Number.isFinite(currentSize) ? currentSize : minSize;

  while (text.width > maxWidth && size > minSize) {
    size -= 1;
    text.setFontSize(size);
  }

  return text;
}
