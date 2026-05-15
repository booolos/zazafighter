import { clearMomentaryActions, touchState } from '../game/input/actions';
import type { HudSnapshot } from '../game/simulation/state';

type ButtonSpec = {
  className: string;
  label: string;
  ariaLabel: string;
  asset?: string;
  action: keyof Pick<typeof touchState, 'jump' | 'dodge' | 'companionAttack' | 'pause'> | 'attackOrSuper';
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
            <strong data-player-name>Kiko</strong>
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
      <div class="mobile-controls">
        <div class="joystick" data-joystick role="group" aria-label="Movement joystick">
          <img class="joystick-art" src="${uiAsset('joystick-ring.png')}" alt="" aria-hidden="true" draggable="false" />
          <div class="stick" data-stick></div>
        </div>
        <div class="action-pad"></div>
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
  gameplayControlsLocked = hud.paused || hud.hp <= 0 || hud.objective === `${hud.levelTitle} clear`;
  hudEl?.classList.toggle('is-paused', hud.paused);
  hudEl?.classList.toggle('is-controls-locked', gameplayControlsLocked);
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

function clearTouchState() {
  touchState.moveX = 0;
  touchState.moveY = 0;
  clearMomentaryActions();
}

export function getLastHud() {
  return lastHud;
}
