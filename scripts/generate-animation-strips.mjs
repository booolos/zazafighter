import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(repoRoot, 'src/game/content/characterRegistry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const frameSize = 256;
const standingBaseline = 239;
const proneBaseline = 255;
const args = new Set(process.argv.slice(2));
const targetArg = process.argv.find((arg) => arg.startsWith('--targets='));
const targetIds = targetArg
  ? new Set(targetArg.replace('--targets=', '').split(',').map((id) => id.trim()).filter(Boolean))
  : undefined;

const roleTuning = {
  player: {
    targetHeight: 220,
    attack: [244, 92, 64],
    super: [70, 226, 255],
    hurt: [255, 76, 88]
  },
  npc: {
    targetHeight: 208,
    attack: [255, 202, 58],
    super: [184, 87, 255],
    hurt: [255, 92, 96]
  },
  enemy: {
    targetHeight: 214,
    attack: [239, 64, 80],
    super: [255, 202, 58],
    hurt: [255, 74, 92]
  },
  boss: {
    targetHeight: 222,
    attack: [255, 180, 64],
    super: [255, 82, 190],
    hurt: [255, 86, 82]
  }
};

const characterTuning = {
  kiko: {
    targetHeight: 220,
    attack: [238, 92, 44],
    super: [54, 245, 220],
    hurt: [255, 72, 96]
  },
  'big-ink': {
    targetHeight: 220,
    attack: [247, 180, 74],
    super: [255, 90, 190],
    hurt: [255, 86, 82]
  },
  'street-punk': {
    targetHeight: 220,
    attack: [232, 58, 74],
    super: [255, 198, 64],
    hurt: [255, 64, 76]
  }
};

function readPng(file) {
  const buffer = fs.readFileSync(file);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buffer.subarray(0, 8).equals(signature)) {
    throw new Error(`${file} is not a PNG`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    offset += 4;
    const type = buffer.subarray(offset, offset + 4).toString('ascii');
    offset += 4;
    const data = buffer.subarray(offset, offset + length);
    offset += length + 4;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(`${file} must be 8-bit RGBA non-interlaced PNG`);
  }

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const pixels = Buffer.alloc(width * height * 4);
  const previous = Buffer.alloc(stride);
  const current = Buffer.alloc(stride);
  let rawOffset = 0;
  let pixelOffset = 0;

  for (let y = 0; y < height; y++) {
    const filter = raw[rawOffset++];
    raw.copy(current, 0, rawOffset, rawOffset + stride);
    rawOffset += stride;

    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? current[x - 4] : 0;
      const up = previous[x];
      const upLeft = x >= 4 ? previous[x - 4] : 0;
      let value = current[x];

      if (filter === 1) value = (value + left) & 255;
      else if (filter === 2) value = (value + up) & 255;
      else if (filter === 3) value = (value + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) value = (value + paeth(left, up, upLeft)) & 255;
      else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`);

      current[x] = value;
    }

    current.copy(pixels, pixelOffset);
    current.copy(previous);
    pixelOffset += stride;
  }

  return { width, height, pixels };
}

function writePng(file, image) {
  const raw = Buffer.alloc((image.width * 4 + 1) * image.height);
  let rawOffset = 0;
  let pixelOffset = 0;

  for (let y = 0; y < image.height; y++) {
    raw[rawOffset++] = 0;
    image.pixels.copy(raw, rawOffset, pixelOffset, pixelOffset + image.width * 4);
    rawOffset += image.width * 4;
    pixelOffset += image.width * 4;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(image.width, 0);
  ihdr.writeUInt32BE(image.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const chunks = [
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    makeChunk('IEND', Buffer.alloc(0))
  ];

  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    ...chunks
  ]));
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return chunk;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function alphaBounds(image, region = { x: 0, y: 0, width: image.width, height: image.height }, threshold = 8) {
  let minX = region.x + region.width;
  let minY = region.y + region.height;
  let maxX = region.x - 1;
  let maxY = region.y - 1;
  let alphaPixels = 0;

  for (let y = region.y; y < region.y + region.height; y++) {
    for (let x = region.x; x < region.x + region.width; x++) {
      const alpha = image.pixels[(y * image.width + x) * 4 + 3];
      if (alpha > threshold) {
        alphaPixels++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX) return null;
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    maxX,
    maxY,
    alphaPixels
  };
}

function hashRegion(image, region) {
  const hash = crypto.createHash('sha256');
  for (let y = region.y; y < region.y + region.height; y++) {
    for (let x = region.x; x < region.x + region.width; x++) {
      const offset = (y * image.width + x) * 4;
      hash.update(image.pixels.subarray(offset, offset + 4));
    }
  }
  return hash.digest('hex');
}

function createImage(width, height) {
  return { width, height, pixels: Buffer.alloc(width * height * 4) };
}

function copyRegion(source, target, sourceRegion, targetX, targetY) {
  for (let y = 0; y < sourceRegion.height; y++) {
    for (let x = 0; x < sourceRegion.width; x++) {
      const sx = sourceRegion.x + x;
      const sy = sourceRegion.y + y;
      const tx = targetX + x;
      const ty = targetY + y;
      if (tx < 0 || tx >= target.width || ty < 0 || ty >= target.height) continue;
      const sourceOffset = (sy * source.width + sx) * 4;
      const targetOffset = (ty * target.width + tx) * 4;
      source.pixels.copy(target.pixels, targetOffset, sourceOffset, sourceOffset + 4);
    }
  }
}

function sampleBilinear(image, x, y) {
  if (x < 0 || y < 0 || x >= image.width - 1 || y >= image.height - 1) {
    return [0, 0, 0, 0];
  }

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const weights = [
    (1 - tx) * (1 - ty),
    tx * (1 - ty),
    (1 - tx) * ty,
    tx * ty
  ];
  const coords = [
    [x0, y0],
    [x0 + 1, y0],
    [x0, y0 + 1],
    [x0 + 1, y0 + 1]
  ];
  const out = [0, 0, 0, 0];

  for (let i = 0; i < 4; i++) {
    const [px, py] = coords[i];
    const offset = (py * image.width + px) * 4;
    const alpha = image.pixels[offset + 3] / 255;
    out[0] += image.pixels[offset] * alpha * weights[i];
    out[1] += image.pixels[offset + 1] * alpha * weights[i];
    out[2] += image.pixels[offset + 2] * alpha * weights[i];
    out[3] += alpha * weights[i];
  }

  if (out[3] <= 0.0001) return [0, 0, 0, 0];
  return [
    clamp(Math.round(out[0] / out[3])),
    clamp(Math.round(out[1] / out[3])),
    clamp(Math.round(out[2] / out[3])),
    clamp(Math.round(out[3] * 255))
  ];
}

function over(target, offset, rgba) {
  const sourceAlpha = rgba[3] / 255;
  if (sourceAlpha <= 0) return;

  const targetAlpha = target.pixels[offset + 3] / 255;
  const outAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);
  if (outAlpha <= 0) return;

  for (let c = 0; c < 3; c++) {
    const sourcePremul = rgba[c] * sourceAlpha;
    const targetPremul = target.pixels[offset + c] * targetAlpha * (1 - sourceAlpha);
    target.pixels[offset + c] = clamp(Math.round((sourcePremul + targetPremul) / outAlpha));
  }
  target.pixels[offset + 3] = clamp(Math.round(outAlpha * 255));
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function drawSprite(target, source, sprite, pose) {
  const scale = sprite.scale * (pose.scale ?? 1);
  const scaleX = scale * (pose.scaleX ?? 1);
  const scaleY = scale * (pose.scaleY ?? 1);
  const lean = pose.lean ?? 0;
  const rotation = pose.rotation ?? 0;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const a = cos * scaleX;
  const b = cos * (-scaleY * lean) - sin * scaleY;
  const c = sin * scaleX;
  const d = sin * (-scaleY * lean) + cos * scaleY;
  const det = a * d - b * c;
  const invA = d / det;
  const invB = -b / det;
  const invC = -c / det;
  const invD = a / det;
  const anchorX = (pose.anchorX ?? frameSize / 2) + (pose.x ?? 0);
  const anchorY = (pose.anchorY ?? standingBaseline) + (pose.y ?? 0);
  const sourceAnchorX = sprite.bounds.x + sprite.bounds.width / 2;
  const sourceAnchorY = sprite.bounds.maxY;

  for (let y = 0; y < target.height; y++) {
    for (let x = 0; x < target.width; x++) {
      const dx = x + 0.5 - anchorX;
      const dy = y + 0.5 - anchorY;
      const u = invA * dx + invB * dy;
      const v = invC * dx + invD * dy;
      const sx = sourceAnchorX + u;
      const sy = sourceAnchorY + v;
      if (
        sx < sprite.bounds.x ||
        sx >= sprite.bounds.x + sprite.bounds.width - 1 ||
        sy < sprite.bounds.y ||
        sy >= sprite.bounds.y + sprite.bounds.height - 1
      ) {
        continue;
      }
      if (pose.clip && !sourceInClip(pose.clip, sx, sy, sprite.bounds)) continue;

      const rgba = sampleBilinear(source, sx, sy);
      if (rgba[3] === 0) continue;
      if (pose.tint) {
        rgba[0] = Math.round(rgba[0] * (1 - pose.tint.amount) + pose.tint.color[0] * pose.tint.amount);
        rgba[1] = Math.round(rgba[1] * (1 - pose.tint.amount) + pose.tint.color[1] * pose.tint.amount);
        rgba[2] = Math.round(rgba[2] * (1 - pose.tint.amount) + pose.tint.color[2] * pose.tint.amount);
      }
      over(target, (y * target.width + x) * 4, rgba);
    }
  }
}

function sourceInClip(clip, sx, sy, bounds) {
  if (clip.minXRatio != null && sx < bounds.x + bounds.width * clip.minXRatio) return false;
  if (clip.maxXRatio != null && sx > bounds.x + bounds.width * clip.maxXRatio) return false;
  if (clip.minYRatio != null && sy < bounds.y + bounds.height * clip.minYRatio) return false;
  if (clip.maxYRatio != null && sy > bounds.y + bounds.height * clip.maxYRatio) return false;
  return true;
}

function drawWalkSprite(target, source, sprite, pose, frameIndex) {
  const walkCycle = [
    {
      torso: { y: 0, lean: -0.012, scaleX: 1.0, scaleY: 1.0 },
      left: { x: -14, y: 2, lean: -0.12, rotation: -0.035, scaleX: 1.045, scaleY: 0.965 },
      right: { x: 16, y: -5, lean: 0.15, rotation: 0.045, scaleX: 0.975, scaleY: 1.04 },
      front: 'right'
    },
    {
      torso: { y: -2, lean: 0.004, scaleX: 0.995, scaleY: 1.015 },
      left: { x: -5, y: -4, lean: -0.045, rotation: -0.012, scaleX: 0.992, scaleY: 1.035 },
      right: { x: 8, y: 1, lean: 0.06, rotation: 0.014, scaleX: 1.018, scaleY: 0.982 },
      front: 'right'
    },
    {
      torso: { y: 0, lean: 0.014, scaleX: 1.0, scaleY: 1.0 },
      left: { x: 13, y: -5, lean: 0.14, rotation: 0.035, scaleX: 0.976, scaleY: 1.035 },
      right: { x: -13, y: 2, lean: -0.12, rotation: -0.035, scaleX: 1.045, scaleY: 0.965 },
      front: 'left'
    },
    {
      torso: { y: 0, lean: 0.012, scaleX: 1.0, scaleY: 1.0 },
      left: { x: 16, y: -5, lean: 0.15, rotation: 0.045, scaleX: 0.975, scaleY: 1.04 },
      right: { x: -14, y: 2, lean: -0.12, rotation: -0.035, scaleX: 1.045, scaleY: 0.965 },
      front: 'left'
    },
    {
      torso: { y: -2, lean: -0.004, scaleX: 0.995, scaleY: 1.015 },
      left: { x: 8, y: 1, lean: 0.06, rotation: 0.014, scaleX: 1.018, scaleY: 0.982 },
      right: { x: -5, y: -4, lean: -0.045, rotation: -0.012, scaleX: 0.992, scaleY: 1.035 },
      front: 'left'
    },
    {
      torso: { y: 0, lean: -0.014, scaleX: 1.0, scaleY: 1.0 },
      left: { x: -13, y: 2, lean: -0.12, rotation: -0.035, scaleX: 1.045, scaleY: 0.965 },
      right: { x: 13, y: -5, lean: 0.14, rotation: 0.035, scaleX: 0.976, scaleY: 1.035 },
      front: 'right'
    }
  ];
  const step = walkCycle[frameIndex % walkCycle.length];
  const upperClip = { maxYRatio: 0.72 };
  const leftLegClip = { minYRatio: 0.68, maxXRatio: 0.52 };
  const rightLegClip = { minYRatio: 0.68, minXRatio: 0.48 };

  const segmentPose = (segment, clip) => ({
    ...pose,
    x: (pose.x ?? 0) + (segment.x ?? 0),
    y: (pose.y ?? 0) + (segment.y ?? 0),
    scaleX: (pose.scaleX ?? 1) * (segment.scaleX ?? 1),
    scaleY: (pose.scaleY ?? 1) * (segment.scaleY ?? 1),
    lean: (pose.lean ?? 0) + (segment.lean ?? 0),
    rotation: (pose.rotation ?? 0) + (segment.rotation ?? 0),
    clip
  });

  const leftPose = segmentPose(step.left, leftLegClip);
  const rightPose = segmentPose(step.right, rightLegClip);
  const torsoPose = segmentPose(step.torso, upperClip);

  const rearPose = step.front === 'left' ? rightPose : leftPose;
  const frontPose = step.front === 'left' ? leftPose : rightPose;

  drawSprite(target, source, sprite, rearPose);
  drawSprite(target, source, sprite, torsoPose);
  drawSprite(target, source, sprite, frontPose);
}

function normalizeFrame(frame, baseline, centerX = frameSize / 2) {
  const bounds = alphaBounds(frame);
  const shifted = createImage(frameSize, frameSize);
  if (!bounds) return shifted;
  const margin = 1;
  let shiftX = Math.round(centerX - (bounds.x + bounds.width / 2));
  let shiftY = Math.round(baseline - bounds.maxY);

  const targetMinX = bounds.x + shiftX;
  const targetMaxX = bounds.maxX + shiftX;
  if (targetMinX < margin) shiftX += margin - targetMinX;
  if (targetMaxX > frameSize - 1 - margin) shiftX -= targetMaxX - (frameSize - 1 - margin);

  const targetMinY = bounds.y + shiftY;
  const targetMaxY = bounds.maxY + shiftY;
  if (targetMinY < margin) shiftY += margin - targetMinY;
  if (targetMaxY > frameSize - 1) shiftY -= targetMaxY - (frameSize - 1);

  copyRegion(frame, shifted, { x: 0, y: 0, width: frame.width, height: frame.height }, shiftX, shiftY);
  return shifted;
}

function drawEllipse(target, cx, cy, rx, ry, color, alpha) {
  const minX = Math.max(0, Math.floor(cx - rx));
  const maxX = Math.min(target.width - 1, Math.ceil(cx + rx));
  const minY = Math.max(0, Math.floor(cy - ry));
  const maxY = Math.min(target.height - 1, Math.ceil(cy + ry));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const dist = nx * nx + ny * ny;
      if (dist > 1) continue;
      const fade = 1 - Math.pow(dist, 0.65);
      over(target, (y * target.width + x) * 4, [...color, Math.round(alpha * fade)]);
    }
  }
}

function drawSlash(target, cx, cy, length, width, angle, color, alpha) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const halfLength = length / 2;
  const halfWidth = width / 2;

  for (let y = 0; y < target.height; y++) {
    for (let x = 0; x < target.width; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const along = dx * cos + dy * sin;
      const across = -dx * sin + dy * cos;
      if (Math.abs(along) > halfLength || Math.abs(across) > halfWidth) continue;
      const fade = (1 - Math.abs(along) / halfLength) * (1 - Math.abs(across) / halfWidth);
      over(target, (y * target.width + x) * 4, [...color, Math.round(alpha * Math.sqrt(fade))]);
    }
  }
}

function drawArc(target, cx, cy, radius, thickness, start, end, color, alpha) {
  for (let y = 0; y < target.height; y++) {
    for (let x = 0; x < target.width; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const distance = Math.hypot(dx, dy);
      if (Math.abs(distance - radius) > thickness) continue;

      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += Math.PI * 2;
      const normalizedStart = start < 0 ? start + Math.PI * 2 : start;
      const normalizedEnd = end < 0 ? end + Math.PI * 2 : end;
      const inArc = normalizedStart <= normalizedEnd
        ? angle >= normalizedStart && angle <= normalizedEnd
        : angle >= normalizedStart || angle <= normalizedEnd;
      if (!inArc) continue;

      const edgeFade = 1 - Math.abs(distance - radius) / thickness;
      over(target, (y * target.width + x) * 4, [...color, Math.round(alpha * edgeFade)]);
    }
  }
}

function drawSpeedLines(target, color, alpha, direction = 1) {
  for (const [x, y, length, width] of [[70, 70, 36, 3], [84, 102, 42, 4], [72, 135, 30, 3]]) {
    drawSlash(target, direction > 0 ? x : frameSize - x, y, length, width, -0.2 * direction, color, alpha);
  }
}

function prepareSprite(character) {
  const seedPath = path.join(repoRoot, 'public', character.seed.path);
  const seed = readPng(seedPath);
  const bounds = alphaBounds(seed);
  if (!bounds) throw new Error(`${character.id} seed has no alpha content`);

  const tuning = characterTuning[character.id] ?? roleTuning[character.role] ?? roleTuning.enemy;
  return {
    seed,
    bounds,
    scale: tuning.targetHeight / bounds.height,
    tuning
  };
}

function actionPoses(action) {
  if (action === 'idle') {
    return [
      { frameY: 0, scaleX: 1.018, scaleY: 0.985, lean: -0.018 },
      { frameY: -4, scaleX: 0.965, scaleY: 1.055, lean: 0.04, y: -2 },
      { frameY: -2, scaleX: 0.99, scaleY: 1.025, lean: 0.012, y: -1 },
      { frameY: 1, scaleX: 1.035, scaleY: 0.965, lean: -0.04, y: 1 }
    ];
  }
  if (action === 'walk') {
    return [
      { frameY: 0, scaleX: 1.004, scaleY: 0.996, lean: -0.008 },
      { frameY: -2, scaleX: 0.996, scaleY: 1.012, lean: 0.004 },
      { frameY: -1, scaleX: 1, scaleY: 1, lean: 0.01 },
      { frameY: 0, scaleX: 1.004, scaleY: 0.996, lean: 0.008 },
      { frameY: -2, scaleX: 0.996, scaleY: 1.012, lean: -0.004 },
      { frameY: -1, scaleX: 1, scaleY: 1, lean: -0.01 }
    ];
  }
  if (action === 'dodge') {
    return [
      { x: -15, frameX: -16, frameY: 0, scaleX: 0.94, scaleY: 1.065, lean: -0.24, rotation: -0.09 },
      { x: 13, frameX: 13, frameY: -3, scaleX: 1.14, scaleY: 0.89, lean: 0.34, rotation: 0.11 },
      { x: 36, frameX: 36, frameY: -2, scaleX: 1.14, scaleY: 0.87, lean: 0.42, rotation: 0.14, tint: { color: [92, 232, 255], amount: 0.11 } },
      { x: 17, frameX: 17, frameY: 0, scaleX: 1.05, scaleY: 0.965, lean: 0.16, rotation: 0.045 }
    ];
  }
  if (action === 'jump') {
    return [
      { x: -2, frameX: -2, frameY: 2, scaleX: 1.12, scaleY: 0.88, lean: -0.08, rotation: -0.025 },
      { x: 6, frameX: 6, frameY: -16, y: -18, scaleX: 0.9, scaleY: 1.14, lean: 0.08, rotation: 0.03 },
      { x: 15, frameX: 15, frameY: -12, y: -30, scaleX: 0.94, scaleY: 1.08, lean: 0.18, rotation: 0.06, tint: { color: [255, 236, 142], amount: 0.08 } },
      { x: 4, frameX: 4, frameY: 1, scaleX: 1.14, scaleY: 0.88, lean: -0.06, rotation: -0.02 }
    ];
  }
  if (action === 'talk') {
    return [
      { frameX: 0, frameY: 0, scaleX: 1.01, scaleY: 0.99, lean: -0.015 },
      { x: 3, frameX: 3, frameY: -3, scaleX: 0.97, scaleY: 1.045, lean: 0.055, y: -1 },
      { x: -3, frameX: -3, frameY: 0, scaleX: 1.035, scaleY: 0.975, lean: -0.05 },
      { x: 1, frameX: 1, frameY: -2, scaleX: 0.985, scaleY: 1.025, lean: 0.025 }
    ];
  }
  if (action === 'react') {
    return [
      { frameX: 0, frameY: 0, scaleX: 1, scaleY: 1, lean: 0 },
      { x: -16, frameX: -16, frameY: -2, scaleX: 1.06, scaleY: 0.94, lean: -0.26, rotation: -0.075, tint: { color: [255, 228, 160], amount: 0.15 } },
      { x: 11, frameX: 11, frameY: -4, scaleX: 0.96, scaleY: 1.055, lean: 0.18, rotation: 0.048 },
      { x: 2, frameX: 2, frameY: 0, scaleX: 1.02, scaleY: 0.985, lean: 0.035 }
    ];
  }
  if (action === 'cheer') {
    return [
      { frameY: 1, scaleX: 1.05, scaleY: 0.95, lean: 0 },
      { y: -14, frameY: -12, scaleX: 0.93, scaleY: 1.105, lean: -0.09, rotation: -0.035 },
      { y: -3, frameY: -2, scaleX: 1.07, scaleY: 0.94, lean: 0.11, rotation: 0.045 },
      { y: -17, frameY: -14, scaleX: 0.94, scaleY: 1.095, lean: 0.02 }
    ];
  }
  if (action === 'panic') {
    return [
      { x: 0, frameX: 0, frameY: -2, scaleX: 0.98, scaleY: 1.035, lean: 0 },
      { x: -18, frameX: -18, frameY: 1, scaleX: 1.085, scaleY: 0.92, lean: -0.34, rotation: -0.09, tint: { color: [255, 218, 128], amount: 0.12 } },
      { x: 15, frameX: 15, frameY: -3, scaleX: 1.065, scaleY: 0.94, lean: 0.28, rotation: 0.078 },
      { x: -8, frameX: -8, frameY: 0, scaleX: 1.03, scaleY: 0.975, lean: -0.16, rotation: -0.035 }
    ];
  }
  if (action === 'attack') {
    return [
      { x: 0, frameX: 0, frameY: 0, scaleX: 1.02, scaleY: 0.98, lean: 0 },
      { x: -16, frameX: -16, frameY: -3, scaleX: 0.93, scaleY: 1.06, lean: -0.2, rotation: -0.065 },
      { x: 29, frameX: 29, frameY: 1, scaleX: 1.12, scaleY: 0.9, lean: 0.28, rotation: 0.08 },
      { x: 11, frameX: 11, frameY: 0, scaleX: 1.06, scaleY: 0.955, lean: 0.1, rotation: 0.025 }
    ];
  }
  if (action === 'hurt') {
    return [
      { x: -11, frameX: -11, frameY: -2, scaleX: 0.96, scaleY: 1.045, lean: -0.18, rotation: -0.055, tint: { color: [255, 238, 238], amount: 0.14 } },
      { x: -27, frameX: -27, frameY: 2, scaleX: 1.14, scaleY: 0.875, lean: -0.38, rotation: -0.14, tint: { color: [255, 84, 88], amount: 0.22 } }
    ];
  }
  if (action === 'stunned') {
    return [
      { x: -14, frameX: -14, frameY: -2, scaleX: 1.055, scaleY: 0.955, lean: -0.24, rotation: -0.08, tint: { color: [255, 234, 140], amount: 0.14 } },
      { x: 15, frameX: 15, frameY: -5, scaleX: 0.955, scaleY: 1.065, lean: 0.26, rotation: 0.085, tint: { color: [255, 234, 140], amount: 0.18 } },
      { x: -11, frameX: -11, frameY: 0, scaleX: 1.045, scaleY: 0.965, lean: -0.2, rotation: -0.06, tint: { color: [255, 234, 140], amount: 0.13 } },
      { x: 10, frameX: 10, frameY: -3, scaleX: 0.975, scaleY: 1.04, lean: 0.16, rotation: 0.048, tint: { color: [255, 234, 140], amount: 0.12 } }
    ];
  }
  if (action === 'knockdown') {
    return [
      { x: -20, frameX: -20, anchorY: proneBaseline, scaleX: 1.09, scaleY: 0.9, lean: -0.28, rotation: -0.16, tint: { color: [255, 118, 118], amount: 0.14 } },
      { x: 12, frameX: 12, frameY: -7, anchorY: proneBaseline, scaleX: 0.98, scaleY: 0.86, lean: -0.08, rotation: 0.9 },
      { x: 12, frameX: 12, frameY: 1, anchorY: proneBaseline, scaleX: 0.8, scaleY: 0.68, lean: 0.0, rotation: 1.22 },
      { x: 4, frameX: 4, anchorY: proneBaseline, scaleX: 0.86, scaleY: 0.68, lean: 0.0, rotation: 1.57 }
    ];
  }
  if (action === 'get-up') {
    return [
      { x: 3, frameX: 3, anchorY: proneBaseline, scaleX: 0.86, scaleY: 0.68, lean: 0.0, rotation: 1.55 },
      { x: 18, frameX: 18, frameY: -4, anchorY: proneBaseline, scaleX: 0.9, scaleY: 0.76, lean: -0.08, rotation: 0.98 },
      { x: 4, frameX: 4, frameY: -6, anchorY: proneBaseline, scaleX: 0.92, scaleY: 0.98, lean: -0.18, rotation: 0.3 },
      { x: 0, frameX: 0, frameY: 0, scaleX: 1.04, scaleY: 0.965, lean: 0.0, rotation: 0.0 }
    ];
  }
  if (action === 'death') {
    return [
      { x: -18, frameX: -18, anchorY: proneBaseline, scaleX: 1.07, scaleY: 0.91, lean: -0.24, rotation: -0.15, tint: { color: [255, 118, 118], amount: 0.14 } },
      { x: 13, frameX: 13, frameY: -6, anchorY: proneBaseline, scaleX: 0.98, scaleY: 0.84, lean: -0.05, rotation: 0.95 },
      { x: 14, frameX: 14, frameY: 0, anchorY: proneBaseline, scaleX: 0.82, scaleY: 0.69, lean: 0, rotation: 1.27 },
      { x: 0, frameX: 0, anchorY: proneBaseline, scaleX: 0.9, scaleY: 0.68, lean: 0, rotation: 1.6 }
    ];
  }
  if (action === 'super-slap') {
    return [
      { x: 0, frameX: 0, frameY: 0, scaleX: 1.02, scaleY: 0.98, lean: 0 },
      { x: -18, frameX: -18, frameY: -4, scaleX: 0.93, scaleY: 1.06, lean: -0.24, rotation: -0.075 },
      { x: 4, frameX: 4, frameY: -8, scaleX: 0.94, scaleY: 1.055, lean: 0.08, rotation: 0.02 },
      { x: 31, frameX: 31, frameY: 1, scaleX: 1.13, scaleY: 0.89, lean: 0.32, rotation: 0.09 },
      { x: 20, frameX: 20, frameY: -2, scaleX: 1.12, scaleY: 0.93, lean: 0.18, rotation: 0.055 },
      { x: 2, frameX: 2, frameY: 0, scaleX: 1.03, scaleY: 0.98, lean: 0.035 }
    ];
  }
  if (action === 'victory') {
    return [
      { y: 0, frameY: 1, scaleX: 1.045, scaleY: 0.955, lean: 0 },
      { y: -15, frameY: -13, scaleX: 0.925, scaleY: 1.11, lean: -0.1, rotation: -0.04 },
      { y: -2, frameY: -1, scaleX: 1.085, scaleY: 0.93, lean: 0.13, rotation: 0.052 },
      { y: -18, frameY: -15, scaleX: 0.94, scaleY: 1.105, lean: 0.03, tint: { color: [255, 222, 112], amount: 0.1 } }
    ];
  }
  return [];
}

function renderFrame(sprite, action, frameIndex, pose) {
  const usesProneCanvas = action === 'death' || action === 'knockdown' || action === 'get-up';
  const scratchSize = usesProneCanvas ? frameSize * 2 : frameSize;
  const scratchCenter = scratchSize / 2;
  const scratchBaseline = usesProneCanvas ? frameSize + proneBaseline - 34 : standingBaseline;
  let frame = createImage(scratchSize, scratchSize);
  const renderPose = usesProneCanvas
    ? {
        ...pose,
        x: 0,
        y: 0,
        anchorX: scratchCenter + (pose.x ?? 0),
        anchorY: scratchBaseline
      }
    : pose;

  if (action === 'walk') {
    const side = frameIndex % 3 === 0 ? -1 : frameIndex % 3 === 1 ? 0 : 1;
    drawEllipse(frame, 128 + side * 20, standingBaseline + 4, 40, 7, [18, 16, 22], 42);
  } else if (action === 'dodge') {
    drawEllipse(frame, 132 + frameIndex * 10, standingBaseline + 4, 48, 7, [18, 16, 22], 36);
  } else if (action === 'jump') {
    drawEllipse(frame, 128 + frameIndex * 5, standingBaseline + 4, 44 + frameIndex * 3, 7, [18, 16, 22], frameIndex === 2 ? 24 : 38);
  } else if (action === 'death' || action === 'knockdown' || action === 'get-up') {
    drawEllipse(frame, scratchCenter, scratchBaseline + 4, frameIndex > 1 ? 82 : 48, 8, [18, 16, 22], 34);
  }

  if (action === 'walk') {
    drawWalkSprite(frame, sprite.seed, sprite, renderPose, frameIndex);
  } else {
    drawSprite(frame, sprite.seed, sprite, renderPose);
  }

  if (action === 'attack' && frameIndex === 2) {
    drawArc(frame, 151, 96, 59, 8, 5.35, 0.85, sprite.tuning.attack, 168);
    drawSpeedLines(frame, sprite.tuning.attack, 95);
  } else if (action === 'attack' && frameIndex === 1) {
    drawSlash(frame, 87, 92, 45, 4, -0.45, sprite.tuning.attack, 76);
  } else if (action === 'hurt' && frameIndex === 1) {
    drawSlash(frame, 142, 91, 82, 8, -0.75, sprite.tuning.hurt, 135);
    drawSlash(frame, 133, 123, 54, 5, -0.75, sprite.tuning.hurt, 92);
  } else if (action === 'death' && frameIndex === 1) {
    drawSlash(frame, scratchCenter - 28, scratchBaseline - 100, 44, 5, 0.1, [255, 222, 120], 72);
  } else if (action === 'talk' && frameIndex % 2 === 1) {
    drawSlash(frame, 150, 72, 16, 2, 0.08, [244, 244, 242], 72);
    drawSlash(frame, 156, 84, 12, 2, -0.12, [244, 244, 242], 58);
  } else if (action === 'react' && frameIndex === 1) {
    drawSlash(frame, 144, 78, 36, 4, -0.7, sprite.tuning.hurt, 96);
    drawSlash(frame, 158, 104, 28, 3, -0.7, sprite.tuning.hurt, 72);
  } else if (action === 'dodge') {
    if (frameIndex >= 1) drawSpeedLines(frame, [80, 226, 255], 72 + frameIndex * 18, -1);
    if (frameIndex === 2) drawSlash(frame, 96, 132, 82, 5, -0.08, [255, 255, 255], 54);
  } else if (action === 'jump') {
    if (frameIndex === 0) drawEllipse(frame, 128, standingBaseline + 5, 36, 6, [255, 202, 58], 48);
    if (frameIndex === 1) drawSpeedLines(frame, [255, 202, 58], 74, 1);
    if (frameIndex === 2) {
      drawArc(frame, 132, 154, 52, 4, 3.7, 5.7, [92, 232, 255], 72);
      drawSlash(frame, 104, 202, 48, 4, -0.22, [255, 255, 255], 58);
    }
    if (frameIndex === 3) drawEllipse(frame, 128, standingBaseline + 3, 54, 7, [255, 202, 58], 46);
  } else if (action === 'stunned') {
    drawArc(frame, 128, 56, 30 + (frameIndex % 2) * 6, 3, 5.8, 3.65, [255, 224, 96], 96);
    drawSlash(frame, 102 + frameIndex * 13, 55, 18, 3, 0.48, [255, 255, 210], 92);
    drawSlash(frame, 106 + frameIndex * 13, 55, 18, 3, -0.48, [255, 255, 210], 92);
  } else if (action === 'knockdown' && frameIndex === 2) {
    drawSlash(frame, scratchCenter - 38, scratchBaseline - 54, 66, 6, 0.02, sprite.tuning.hurt, 96);
    drawEllipse(frame, scratchCenter - 46, scratchBaseline + 2, 24, 5, [210, 180, 130], 48);
  } else if (action === 'get-up' && frameIndex <= 1) {
    drawEllipse(frame, scratchCenter - 32 + frameIndex * 22, scratchBaseline + 2, 28, 5, [210, 180, 130], 42);
  } else if (action === 'cheer' || action === 'victory') {
    if (frameIndex % 2 === 1) {
      drawSlash(frame, 86, 66, 24, 3, -0.84, [255, 222, 112], 86);
      drawSlash(frame, 176, 66, 24, 3, 0.84, [255, 222, 112], 86);
      drawArc(frame, 132, 86, 52, 3, 3.55, 5.88, [92, 232, 255], 58);
    }
  } else if (action === 'panic') {
    drawSlash(frame, 154, 66, 30, 4, -0.7, [255, 222, 112], 96);
    if (frameIndex === 1) drawSlash(frame, 166, 92, 20, 3, -0.35, sprite.tuning.hurt, 80);
  } else if (action === 'super-slap') {
    if (frameIndex >= 2 && frameIndex <= 4) {
      drawArc(frame, 153 + frameIndex * 4, 92, 52 + frameIndex * 8, 7, 5.3, 1.02, sprite.tuning.super, 120 + frameIndex * 22);
      drawArc(frame, 153 + frameIndex * 4, 92, 68 + frameIndex * 8, 4, 5.55, 0.86, [255, 255, 255], 80);
    }
    if (frameIndex === 3) drawSpeedLines(frame, sprite.tuning.super, 116);
  }

  const baseline = action === 'death' || action === 'knockdown' ? proneBaseline : standingBaseline;
  const outputCenterX = frameSize / 2 + clampRange(pose.frameX ?? pose.x ?? 0, -42, 42);
  const outputBaseline = baseline + clampRange(pose.frameY ?? pose.y ?? 0, -16, 16);
  return normalizeFrame(frame, outputBaseline, outputCenterX);
}

function clampRange(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function makeSheet(character, sprite) {
  const actions = Object.entries(character.animations).filter(([action]) => actionPoses(action).length > 0);

  for (const [action, animation] of actions) {
    const poses = actionPoses(action);
    if (poses.length !== animation.frames) {
      throw new Error(`${character.id}/${action} has ${animation.frames} registry frames but ${poses.length} poses`);
    }

    const sheet = createImage(animation.frames * frameSize, frameSize);
    poses.forEach((pose, index) => {
      const frame = renderFrame(sprite, action, index, pose);
      copyRegion(frame, sheet, { x: 0, y: 0, width: frameSize, height: frameSize }, index * frameSize, 0);
    });

    const outPath = path.join(repoRoot, 'public', animation.file);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    writePng(outPath, sheet);
    console.log(`generated ${path.relative(repoRoot, outPath)} (${sheet.width}x${sheet.height})`);
  }
}

function auditSheet(character, action, animation) {
  const file = path.join(repoRoot, 'public', animation.file);
  const image = readPng(file);
  const expectedWidth = animation.frames * animation.frameWidth;
  const expectedHeight = animation.frameHeight;
  const frameStats = [];

  for (let i = 0; i < animation.frames; i++) {
    const region = { x: i * animation.frameWidth, y: 0, width: animation.frameWidth, height: animation.frameHeight };
    const bounds = alphaBounds(image, region);
    const hash = hashRegion(image, region);
    frameStats.push({
      hash,
      bounds: bounds && {
        x: bounds.x - region.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        maxY: bounds.maxY,
        centerX: bounds.x - region.x + bounds.width / 2
      }
    });
  }

  const diffs = [];
  for (let i = 1; i < frameStats.length; i++) {
    diffs.push(frameDifference(image, i - 1, i, animation.frameWidth, animation.frameHeight));
  }

  const uniqueFrames = new Set(frameStats.map((stat) => stat.hash)).size;
  const dimensionOk = image.width === expectedWidth && image.height === expectedHeight;
  const footYs = frameStats.map((stat) => stat.bounds?.maxY ?? null);
  const centers = frameStats.map((stat) => stat.bounds?.centerX ?? null);
  const maxFrameWidth = Math.max(...frameStats.map((stat) => stat.bounds?.width ?? 0));
  const maxFrameHeight = Math.max(...frameStats.map((stat) => stat.bounds?.height ?? 0));
  const edgePixels = frameStats.map((_, index) => countTopSideEdgeAlpha(image, index, animation.frameWidth, animation.frameHeight));
  const staticish = uniqueFrames === 1 || diffs.every((diff) => diff < 0.004);

  return {
    id: character.id,
    action,
    dimensionOk,
    size: `${image.width}x${image.height}`,
    expected: `${expectedWidth}x${expectedHeight}`,
    uniqueFrames,
    frames: animation.frames,
    staticish,
    footYs,
    centers,
    maxFrameWidth,
    maxFrameHeight,
    edgePixels,
    diffs
  };
}

function countTopSideEdgeAlpha(image, frame, width, height) {
  const ox = frame * width;
  let count = 0;

  for (let y = 0; y < height; y++) {
    for (const x of [0, width - 1]) {
      if (image.pixels[(y * image.width + ox + x) * 4 + 3] > 8) count++;
    }
  }

  for (let x = 0; x < width; x++) {
    if (image.pixels[(ox + x) * 4 + 3] > 8) count++;
  }

  return count;
}

function frameDifference(image, a, b, width, height) {
  let changed = 0;
  const ax = a * width;
  const bx = b * width;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ai = (y * image.width + ax + x) * 4;
      const bi = (y * image.width + bx + x) * 4;
      let delta = 0;
      for (let c = 0; c < 4; c++) delta += Math.abs(image.pixels[ai + c] - image.pixels[bi + c]);
      if (delta > 16) changed++;
    }
  }

  return changed / (width * height);
}

function printAudit() {
  for (const character of selectedCharacters()) {
    console.log(`\n${character.id}`);
    for (const [action, animation] of Object.entries(character.animations)) {
      const audit = auditSheet(character, action, animation);
      const footRange = audit.footYs.every((value) => value == null)
        ? 'empty'
        : `${Math.min(...audit.footYs.filter((value) => value != null))}-${Math.max(...audit.footYs.filter((value) => value != null))}`;
      const centerRange = audit.centers.every((value) => value == null)
        ? 'empty'
        : `${Math.min(...audit.centers.filter((value) => value != null)).toFixed(1)}-${Math.max(...audit.centers.filter((value) => value != null)).toFixed(1)}`;
      const diffs = audit.diffs.map((diff) => `${(diff * 100).toFixed(2)}%`).join(',') || 'n/a';
      const edgePixels = audit.edgePixels.reduce((sum, value) => sum + value, 0);
      const edgeList = audit.edgePixels.join(',');
      const sizeStatus = audit.dimensionOk ? audit.size : `${audit.size} expected ${audit.expected}`;
      console.log(
        `  ${action.padEnd(10)} ${sizeStatus} unique=${audit.uniqueFrames}/${audit.frames} ` +
        `staticish=${audit.staticish} footY=${footRange} centerX=${centerRange} ` +
        `bboxMax=${audit.maxFrameWidth}x${audit.maxFrameHeight} edgeTopSides=${edgePixels}[${edgeList}] diff=${diffs}`
      );
    }
  }
}

if (args.has('--audit')) {
  printAudit();
} else {
  for (const character of selectedCharacters()) {
    const sprite = prepareSprite(character);
    makeSheet(character, sprite);
  }
}

function selectedCharacters() {
  return registry.characters.filter((entry) => !targetIds || targetIds.has(entry.id));
}
