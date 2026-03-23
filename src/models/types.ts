// Shared types for ClaudeWars
import type { Battlefield } from './battlefield.js';

export type Position = {
  x: number;
  y: number;
};

export type TurnPhase =
  | 'command'
  | 'movement'
  | 'combat'
  | 'resolution';

export type GameEvent = {
  turn: number;
  player: string;
  description: string;
  timestamp: number;
};

// Player references units by ID to avoid circular deps
export type Player = {
  id: string;
  name: string;
  unitIds: string[];
};

export type GameState = {
  battlefield: Battlefield;
  players: Player[];
  currentTurn: number;
  currentPlayerIndex: number;
  phase: TurnPhase;
  log: GameEvent[];
  winner: string | null;
};

// Action types (command parser output)
export type MoveAction = {
  type: 'move';
  unitId: string;
  target: Position;
};

export type AttackAction = {
  type: 'attack';
  unitId: string;
  targetUnitId: string;
};

export type WaitAction = {
  type: 'wait';
  unitId: string;
};

export type QuitAction = {
  type: 'quit';
};

export type Action =
  | MoveAction
  | AttackAction
  | WaitAction
  | QuitAction;

// Result type — never throw in engine code
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Manhattan distance for range checks
export function distance(
  a: Position,
  b: Position
): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
