export type TouchAction =
  | 'moveLeft'
  | 'moveRight'
  | 'laneUp'
  | 'laneDown'
  | 'attack'
  | 'jump'
  | 'dodge'
  | 'companionAttack'
  | 'super'
  | 'pause';

export type TouchState = {
  moveX: number;
  moveY: number;
  attack: boolean;
  jump: boolean;
  dodge: boolean;
  companionAttack: boolean;
  super: boolean;
  pause: boolean;
};

export const touchState: TouchState = {
  moveX: 0,
  moveY: 0,
  attack: false,
  jump: false,
  dodge: false,
  companionAttack: false,
  super: false,
  pause: false
};

export function clearMomentaryActions() {
  touchState.attack = false;
  touchState.jump = false;
  touchState.dodge = false;
  touchState.companionAttack = false;
  touchState.super = false;
  touchState.pause = false;
}
