import type { PlayerId } from '../content/characters';

export type HudSnapshot = {
  playerName: string;
  handle: string;
  portrait?: string;
  hp: number;
  maxHp: number;
  meter: number;
  maxMeter: number;
  score: number;
  enemiesLeft: number;
  levelTitle: string;
  levelIndex: number;
  levelTotal: number;
  objective: string;
  paused: boolean;
  rushReady: boolean;
  rushCooldownRatio: number;
  companionName: string;
  companionPortrait: string;
  companionReady: boolean;
  companionCooldownRatio: number;
  feetCheckAvailable: boolean;
  feetCheckActive: boolean;
  feetCheckName?: string;
};

export type GameSessionState = {
  selectedPlayer: PlayerId;
  hp: number;
  maxHp: number;
  meter: number;
  maxMeter: number;
  score: number;
  coins: number;
  paused: boolean;
  won: boolean;
};

export function createSessionState(selectedPlayer: PlayerId, maxHp: number): GameSessionState {
  return {
    selectedPlayer,
    hp: maxHp,
    maxHp,
    meter: 40,
    maxMeter: 100,
    score: 0,
    coins: 0,
    paused: false,
    won: false
  };
}
