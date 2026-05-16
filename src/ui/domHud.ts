import { clearMomentaryActions, touchState } from '../game/input/actions';
import type { HudSnapshot } from '../game/simulation/state';

type ButtonSpec = {
  className: string;
  label: string;
  ariaLabel: string;
  asset?: string;
  action: keyof Pick<typeof touchState, 'jump' | 'dodge' | 'companionAttack' | 'feetCheck' | 'pause'> | 'attackOrSuper';
};

type FeetCheckDetail = {
  name: string;
  title: string;
  subtitle: string;
  faceImage: string;
  faceFrames?: number;
  faceFrameWidth?: number;
  faceFrameHeight?: number;
  faceFps?: number;
  stripImage: string;
  frames: number;
  frameWidth?: number;
  frameHeight?: number;
  fps: number;
};

const uiAsset = (name: string) => `assets/generated/ui/${name}`;

const buttons: ButtonSpec[] = [
  { className: 'btn-slap', label: 'SLAP', ariaLabel: 'Slap attack', asset: uiAsset('attack-button.png'), action: 'attackOrSuper' },
  { className: 'btn-jump', label: 'JUMP', ariaLabel: 'Jump', asset: uiAsset('jump-button.svg'), action: 'jump' },
  { className: 'btn-dodge', label: 'RUSH', ariaLabel: 'Rush', asset: uiAsset('dodge-button.png'), action: 'dodge' },
  { className: 'btn-dang', label: 'DANG', ariaLabel: 'Dang assist attack', action: 'companionAttack' }
];

let lastHud: HudSnapshot | null = null;
let hudIsActive = false;
let gameplayControlsLocked = false;
let feetCheckRenderToken = 0;
const feetCheckImageCache = new Map<string, Promise<HTMLImageElement>>();
const feetCheckStripAnimators = new WeakMap<HTMLElement, {
  frame: number;
  frames: number;
  fps: number;
  frameWidth: number;
  frameHeight: number;
  rafId?: number;
  lastTime: number;
  image: HTMLImageElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}>();

export function setupDomHud() {
  const root = document.getElementById('hud-root');
  if (!root) return;

  root.innerHTML = `
    <div class="hud hidden" data-hud>
      <div class="hud-top">
        <div class="fighter-card">
          <div class="portrait">
            <img class="portrait-art" data-player-portrait alt="" aria-hidden="true" draggable="false" />
          </div>
          <div class="fighter-info">
            <span class="eyebrow" data-player-handle>GREEN CAP</span>
            <strong data-player-name>Lucas</strong>
            <span class="score-row"><span class="score-icon" aria-hidden="true">★</span><span data-player-score>0</span></span>
          </div>
          <div class="bars">
            <span class="bar hp"><i data-hp-bar></i></span>
            <span class="bar meter"><i data-meter-bar></i></span>
          </div>
        </div>
        <div class="objective-chip">
          <span data-level-kicker>STREET 1/1</span>
          <strong data-objective>Clear the street</strong>
        </div>
        <button class="pause-button" data-action="pause" type="button" aria-label="Pause">
          <img class="pause-art" src="${uiAsset('pause-button.png')}" alt="" aria-hidden="true" draggable="false" />
        </button>
      </div>
      <button class="feet-check-button hidden" data-action="feetCheck" type="button" aria-label="Feet check">
        <span class="feet-check-icon" aria-hidden="true"></span>
        <span class="feet-check-label">
          <span>READY</span>
          <strong>FEET CHECK</strong>
          <small data-feet-check-name></small>
        </span>
      </button>
      <div class="mobile-controls">
        <div class="joystick" data-joystick role="group" aria-label="Movement joystick">
          <img class="joystick-art" src="${uiAsset('joystick-ring.png')}" alt="" aria-hidden="true" draggable="false" />
          <div class="stick" data-stick></div>
        </div>
        <div class="action-pad"></div>
      </div>
      <div class="feet-check-overlay hidden" data-feet-check-overlay aria-hidden="true">
        <div class="feet-check-stage">
          <section class="feet-check-face">
            <div class="feet-check-face-strip" data-feet-check-face alt="" aria-hidden="true"></div>
            <div class="feet-check-copy">
              <span data-feet-check-kicker>SOI 6</span>
              <strong data-feet-check-title>FEET CHECK</strong>
              <small data-feet-check-subtitle></small>
            </div>
          </section>
          <section class="feet-check-foot">
            <div class="feet-check-foot-strip" data-feet-check-strip aria-hidden="true"></div>
          </section>
          <button class="feet-check-exit" data-feet-check-exit type="button">EXIT</button>
        </div>
      </div>
    </div>
  `;

  const pad = root.querySelector('.action-pad');
  for (const spec of buttons) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `action-button ${spec.className}`;
    button.setAttribute('aria-label', spec.ariaLabel);
    button.innerHTML = `
      ${spec.asset || spec.action === 'companionAttack'
        ? `<img class="control-art" ${spec.asset ? `src="${spec.asset}"` : ''} alt="" aria-hidden="true" draggable="false" />`
        : '<span class="control-disc" aria-hidden="true">J</span>'}
      <span class="control-label">${spec.label}</span>
    `;
    button.dataset.action = spec.action;
    pad?.appendChild(button);
  }

  bindButtons(root);
  bindJoystick(root);
  bindFeetCheckOverlay(root);

  window.addEventListener('slap:hud', (event) => {
    const next = (event as CustomEvent<HudSnapshot>).detail;
    lastHud = next;
    renderHud(root, next);
    setHudActive(root, true);
  });

  window.addEventListener('slap:level-state', (event) => {
    const active = (event as CustomEvent<{ active: boolean }>).detail.active;
    setHudActive(root, active);
  });

  window.addEventListener('slap:hud-reset', () => {
    lastHud = null;
    resetHudVisualState(root);
    setHudActive(root, false);
  });

  window.addEventListener('slap:feet-check-open', (event) => {
    void renderFeetCheckOverlay(root, (event as CustomEvent<FeetCheckDetail>).detail);
  });

  window.addEventListener('slap:feet-check-close', () => {
    hideFeetCheckOverlay(root);
  });
}

function setHudActive(root: HTMLElement, active: boolean) {
  hudIsActive = active;
  root.querySelector('[data-hud]')?.classList.toggle('hidden', !active);
  if (!active) clearTouchState();
}

function resetHudVisualState(root: HTMLElement) {
  gameplayControlsLocked = false;
  root.querySelector('[data-hud]')?.classList.remove('is-paused', 'is-controls-locked');
  root.querySelectorAll<HTMLElement>('.bar i').forEach((bar) => {
    bar.style.width = '100%';
  });
  renderSlapButton(root, false);
  renderRushButton(root, true, 0);
  renderFeetCheckButton(root, null);
  root.querySelectorAll<HTMLButtonElement>('.action-button').forEach((button) => {
    button.disabled = false;
    button.classList.remove('is-cooling');
    button.dataset.cooldown = '';
  });
  clearTouchState();
}

function bindButtons(root: HTMLElement) {
  root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
    const action = button.dataset.action as ButtonSpec['action'];
    const down = (event: PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (gameplayControlsLocked && action !== 'pause') return;
      if (action === 'feetCheck') {
        if (!isFeetCheckAvailable()) return;
        touchState.feetCheck = true;
        button.setPointerCapture?.(event.pointerId);
        return;
      }
      if (action === 'attackOrSuper') {
        if (isSuperReady()) touchState.super = true;
        else touchState.attack = true;
      } else if (action === 'dodge') {
        if (isRushReady()) touchState.dodge = true;
      } else if (action === 'companionAttack') {
        if (isCompanionReady()) touchState.companionAttack = true;
      } else {
        touchState[action] = true;
      }
      button.setPointerCapture?.(event.pointerId);
    };
    const up = (event: PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('touchstart', preventTouchDefault, { passive: false });
    button.addEventListener('touchmove', preventTouchDefault, { passive: false });
    button.addEventListener('touchend', preventTouchDefault, { passive: false });
    button.addEventListener('dblclick', (event) => event.preventDefault());
    button.addEventListener('contextmenu', (event) => event.preventDefault());
  });
}

function bindFeetCheckOverlay(root: HTMLElement) {
  const exit = root.querySelector<HTMLButtonElement>('[data-feet-check-exit]');
  if (!exit) return;
  const fire = (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    window.dispatchEvent(new CustomEvent('slap:feet-check-exit'));
  };
  exit.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  exit.addEventListener('pointerup', fire);
  exit.addEventListener('touchstart', preventTouchDefault, { passive: false });
  exit.addEventListener('touchmove', preventTouchDefault, { passive: false });
  exit.addEventListener('touchend', preventTouchDefault, { passive: false });
}

function bindJoystick(root: HTMLElement) {
  const joystick = root.querySelector<HTMLElement>('[data-joystick]');
  const stick = root.querySelector<HTMLElement>('[data-stick]');
  if (!joystick || !stick) return;

  let activePointer: number | null = null;
  const reset = () => {
    activePointer = null;
    touchState.moveX = 0;
    touchState.moveY = 0;
    joystick.classList.remove('is-dragging');
    stick.style.transform = 'translate(-50%, -50%)';
  };

  const move = (event: PointerEvent) => {
    if (activePointer !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = rect.width * 0.42;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(radius, len);
    const nx = (dx / len) * clamped;
    const ny = (dy / len) * clamped;
    touchState.moveX = Math.abs(nx / radius) > 0.18 ? nx / radius : 0;
    touchState.moveY = Math.abs(ny / radius) > 0.18 ? ny / radius : 0;
    stick.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
  };

  joystick.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (gameplayControlsLocked) return;
    activePointer = event.pointerId;
    joystick.classList.add('is-dragging');
    joystick.setPointerCapture(event.pointerId);
    move(event);
  });
  joystick.addEventListener('pointermove', move);
  joystick.addEventListener('pointerup', (event) => {
    event.preventDefault();
    event.stopPropagation();
    reset();
  });
  joystick.addEventListener('pointercancel', (event) => {
    event.preventDefault();
    event.stopPropagation();
    reset();
  });
  joystick.addEventListener('touchstart', preventTouchDefault, { passive: false });
  joystick.addEventListener('touchmove', preventTouchDefault, { passive: false });
  joystick.addEventListener('touchend', preventTouchDefault, { passive: false });
}

function renderHud(root: HTMLElement, hud: HudSnapshot) {
  const hp = ratio(hud.hp, hud.maxHp);
  const meter = ratio(hud.meter, hud.maxMeter);
  if (!hudIsActive) setHudActive(root, true);
  root.querySelector<HTMLElement>('[data-player-name]')!.textContent = hud.playerName;
  root.querySelector<HTMLElement>('[data-player-handle]')!.textContent = hud.handle;
  root.querySelector<HTMLElement>('[data-level-kicker]')!.textContent = `STREET ${hud.levelIndex}/${hud.levelTotal}`;
  root.querySelector<HTMLElement>('[data-objective]')!.textContent = hud.objective;
  root.querySelector<HTMLElement>('[data-hp-bar]')!.style.width = `${hp * 100}%`;
  root.querySelector<HTMLElement>('[data-meter-bar]')!.style.width = `${meter * 100}%`;
  const hudEl = root.querySelector<HTMLElement>('[data-hud]');
  gameplayControlsLocked = hud.paused || hud.feetCheckActive || hud.hp <= 0 || hud.objective === `${hud.levelTitle} clear`;
  hudEl?.classList.toggle('is-paused', hud.paused);
  hudEl?.classList.toggle('is-controls-locked', gameplayControlsLocked);
  hudEl?.classList.toggle('is-feet-checking', hud.feetCheckActive);
  if (gameplayControlsLocked) clearTouchState();
  const portrait = root.querySelector<HTMLImageElement>('[data-player-portrait]');
  if (portrait && hud.portrait && portrait.dataset.src !== hud.portrait) {
    portrait.src = hud.portrait;
    portrait.dataset.src = hud.portrait;
  }
  const scoreEl = root.querySelector<HTMLElement>('[data-player-score]');
  if (scoreEl) scoreEl.textContent = hud.score.toLocaleString();
  renderSlapButton(root, meter >= 1);
  renderRushButton(root, hud.rushReady, hud.rushCooldownRatio);
  renderCompanionButton(root, hud);
  renderFeetCheckButton(root, hud);
}

function ratio(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, value / max));
}

function preventTouchDefault(event: TouchEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function renderSlapButton(root: HTMLElement, superReady: boolean) {
  const button = root.querySelector<HTMLButtonElement>('.btn-slap');
  if (!button) return;
  const label = button.querySelector<HTMLElement>('.control-label');
  const art = button.querySelector<HTMLImageElement>('.control-art');
  button.classList.toggle('charged', superReady);
  button.setAttribute('aria-label', superReady ? 'Super Slap' : 'Slap attack');
  if (label) label.textContent = superReady ? 'SUPER SLAP' : 'SLAP';
  if (art) art.src = uiAsset(superReady ? 'super-button.png' : 'attack-button.png');
}

function isSuperReady() {
  return Boolean(lastHud && lastHud.meter >= lastHud.maxMeter);
}

function renderRushButton(root: HTMLElement, ready: boolean, cooldownRatio: number) {
  const button = root.querySelector<HTMLButtonElement>('.btn-dodge');
  if (!button) return;
  const seconds = Math.ceil(Math.max(0, cooldownRatio) * 5);
  button.disabled = !ready;
  button.classList.toggle('is-cooling', !ready);
  button.dataset.cooldown = ready ? '' : String(seconds);
  button.setAttribute('aria-label', ready ? 'Rush' : `Rush cooling down, ${seconds} seconds`);
}

function isRushReady() {
  return lastHud?.rushReady ?? true;
}

function renderCompanionButton(root: HTMLElement, hud: HudSnapshot) {
  const button = root.querySelector<HTMLButtonElement>('.btn-dang');
  if (!button) return;
  const label = button.querySelector<HTMLElement>('.control-label');
  const art = button.querySelector<HTMLImageElement>('.control-art');
  const seconds = Math.ceil(Math.max(0, hud.companionCooldownRatio) * 5);
  button.disabled = !hud.companionReady;
  button.classList.toggle('is-cooling', !hud.companionReady);
  button.dataset.cooldown = hud.companionReady ? '' : String(seconds);
  button.setAttribute(
    'aria-label',
    hud.companionReady ? `${hud.companionName} assist attack` : `${hud.companionName} cooling down, ${seconds} seconds`
  );
  if (label) label.textContent = hud.companionName.toUpperCase();
  if (art && hud.companionPortrait && art.dataset.src !== hud.companionPortrait) {
    art.src = hud.companionPortrait;
    art.dataset.src = hud.companionPortrait;
  }
}

function isCompanionReady() {
  return lastHud?.companionReady ?? true;
}

function renderFeetCheckButton(root: HTMLElement, hud: HudSnapshot | null) {
  const button = root.querySelector<HTMLButtonElement>('.feet-check-button');
  if (!button) return;
  const visible = Boolean(hud?.feetCheckAvailable && !hud.feetCheckActive && !hud.paused && hud.hp > 0);
  button.classList.toggle('hidden', !visible);
  button.disabled = !visible;
  const name = button.querySelector<HTMLElement>('[data-feet-check-name]');
  if (name) name.textContent = hud?.feetCheckName ?? '';
  button.setAttribute('aria-label', hud?.feetCheckName ? `Feet check with ${hud.feetCheckName}` : 'Feet check');
}

function isFeetCheckAvailable() {
  return Boolean(lastHud?.feetCheckAvailable && !lastHud.feetCheckActive);
}

async function renderFeetCheckOverlay(root: HTMLElement, detail: FeetCheckDetail) {
  const overlay = root.querySelector<HTMLElement>('[data-feet-check-overlay]');
  if (!overlay) return;
  const renderToken = ++feetCheckRenderToken;
  const [faceImage, stripImage] = await Promise.all([preloadFeetCheckImage(detail.faceImage), preloadFeetCheckImage(detail.stripImage)]);
  if (renderToken !== feetCheckRenderToken) return;
  const face = overlay.querySelector<HTMLElement>('[data-feet-check-face]');
  const strip = overlay.querySelector<HTMLElement>('[data-feet-check-strip]');
  const title = overlay.querySelector<HTMLElement>('[data-feet-check-title]');
  const subtitle = overlay.querySelector<HTMLElement>('[data-feet-check-subtitle]');
  const kicker = overlay.querySelector<HTMLElement>('[data-feet-check-kicker]');
  if (face) {
    const faceFrames = Math.max(1, detail.faceFrames ?? 1);
    const faceFps = Math.max(1, detail.faceFps ?? 10);
    configureFeetCheckStrip(face, faceImage, faceFrames, faceFps, detail.faceFrameWidth, detail.faceFrameHeight);
  }
  if (title) title.textContent = detail.title;
  if (subtitle) subtitle.textContent = detail.subtitle;
  if (kicker) kicker.textContent = detail.name.toUpperCase();
  if (strip) {
    const frames = Math.max(1, detail.frames);
    const fps = Math.max(1, detail.fps ?? 12);
    configureFeetCheckStrip(strip, stripImage, frames, fps, detail.frameWidth, detail.frameHeight);
  }
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}

function preloadFeetCheckImage(src: string) {
  const cached = feetCheckImageCache.get(src);
  if (cached) return cached;
  const load = new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(image);
    image.src = src;
  });
  feetCheckImageCache.set(src, load);
  return load;
}

function configureFeetCheckStrip(element: HTMLElement, image: HTMLImageElement, frames: number, fps: number, frameWidth?: number, frameHeight?: number) {
  stopFeetCheckStrip(element);
  element.style.animation = 'none';
  element.style.transform = '';
  element.style.width = '100%';
  element.style.backgroundPosition = '0 50%';
  element.style.setProperty('--feet-strip-end', `${((frames - 1) / frames) * -100}%`);
  element.style.backgroundImage = 'none';
  element.style.backgroundSize = '100% 100%';
  element.replaceChildren();

  if (!image.naturalWidth || !image.naturalHeight) {
    element.style.backgroundImage = `url("${image.src}")`;
    return;
  }

  const sourceWidth = image.naturalWidth || (frameWidth ? frameWidth * frames : frames);
  const sourceHeight = image.naturalHeight || frameHeight || 1;
  const resolvedFrameWidth = Math.max(1, Math.round(frameWidth ?? sourceWidth / frames));
  const resolvedFrameHeight = Math.max(1, Math.round(frameHeight ?? sourceHeight));
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(resolvedFrameWidth * dpr);
  canvas.height = Math.round(resolvedFrameHeight * dpr);
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  if (!context) return;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  element.appendChild(canvas);

  const state = {
    frame: 0,
    frames,
    fps: Math.max(1, Math.round(fps)),
    frameWidth: resolvedFrameWidth,
    frameHeight: resolvedFrameHeight,
    lastTime: performance.now(),
    rafId: undefined as number | undefined,
    image,
    canvas,
    context
  };
  drawFeetCheckFrame(state);
  if (frames <= 1) {
    feetCheckStripAnimators.set(element, state);
    return;
  }

  const step = (now: number) => {
    const frameDurationMs = 1000 / state.fps;
    const elapsedMs = now - state.lastTime;
    const skip = Math.max(1, Math.floor(elapsedMs / frameDurationMs));
    if (elapsedMs >= frameDurationMs) {
      state.frame = (state.frame + skip) % state.frames;
      state.lastTime += skip * frameDurationMs;
      drawFeetCheckFrame(state);
    }
    state.rafId = requestAnimationFrame(step);
  };
  state.rafId = requestAnimationFrame(step);
  feetCheckStripAnimators.set(element, state);
}

function drawFeetCheckFrame(state: NonNullable<ReturnType<typeof feetCheckStripAnimators.get>>) {
  const { canvas, context, frame, frames, frameWidth, frameHeight, image } = state;
  const sourceWidth = image.naturalWidth || frames * frameWidth;
  const sourceHeight = image.naturalHeight || frameHeight;
  const sourceFrameWidth = sourceWidth / frames;
  const sx = Math.min(sourceWidth - sourceFrameWidth, frame * sourceFrameWidth);
  context.clearRect(0, 0, frameWidth, frameHeight);
  context.drawImage(
    image,
    sx,
    0,
    sourceFrameWidth,
    sourceHeight,
    0,
    0,
    frameWidth,
    frameHeight
  );
}

function hideFeetCheckOverlay(root: HTMLElement) {
  feetCheckRenderToken += 1;
  const overlay = root.querySelector<HTMLElement>('[data-feet-check-overlay]');
  if (!overlay) return;
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
  const strip = overlay.querySelector<HTMLElement>('[data-feet-check-strip]');
  if (strip) resetFeetCheckStrip(strip);
  const face = overlay.querySelector<HTMLElement>('[data-feet-check-face]');
  if (face) resetFeetCheckStrip(face);
}

function resetFeetCheckStrip(element: HTMLElement) {
  stopFeetCheckStrip(element);
  element.replaceChildren();
  element.style.animation = '';
  element.style.transform = '';
  element.style.setProperty('--feet-strip-end', '0%');
  element.style.backgroundPosition = '0 50%';
  element.style.backgroundImage = '';
}

function stopFeetCheckStrip(element: HTMLElement) {
  const state = feetCheckStripAnimators.get(element);
  if (!state) return;
  if (state.rafId !== undefined) cancelAnimationFrame(state.rafId);
  feetCheckStripAnimators.delete(element);
}

function clearTouchState() {
  touchState.moveX = 0;
  touchState.moveY = 0;
  clearMomentaryActions();
}

export function getLastHud() {
  return lastHud;
}
