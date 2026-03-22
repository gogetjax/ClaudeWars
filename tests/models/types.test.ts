import { describe, it, expect } from 'vitest';
import {
  ok,
  err,
  distance,
  type Position,
  type Player,
  type GameState,
  type GameEvent,
  type MoveAction,
  type AttackAction,
  type WaitAction,
  type QuitAction,
  type Action,
  type TurnPhase,
} from '../../src/models/types';

describe('ok()', () => {
  it('produces a Result with ok: true', () => {
    const result = ok(42);
    expect(result.ok).toBe(true);
  });

  it('stores the value', () => {
    const result = ok('hello');
    expect(result).toEqual({ ok: true, value: 'hello' });
  });

  it('works with complex objects', () => {
    const obj = { x: 1, y: 2 };
    const result = ok(obj);
    expect(result).toEqual({ ok: true, value: { x: 1, y: 2 } });
  });
});

describe('err()', () => {
  it('produces a Result with ok: false', () => {
    const result = err('bad');
    expect(result.ok).toBe(false);
  });

  it('stores the error', () => {
    const result = err('something went wrong');
    expect(result).toEqual({
      ok: false,
      error: 'something went wrong',
    });
  });
});

describe('distance()', () => {
  it('returns 0 for the same point', () => {
    expect(distance({ x: 3, y: 5 }, { x: 3, y: 5 })).toBe(0);
  });

  it('returns 1 for adjacent points', () => {
    expect(distance({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(1);
    expect(distance({ x: 0, y: 0 }, { x: 0, y: 1 })).toBe(1);
  });

  it('returns 2 for diagonal neighbors', () => {
    expect(distance({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(2);
  });

  it('calculates correctly for distant points', () => {
    expect(
      distance({ x: 0, y: 0 }, { x: 5, y: 7 })
    ).toBe(12);
  });

  it('handles negative coordinates', () => {
    expect(
      distance({ x: -2, y: -3 }, { x: 2, y: 3 })
    ).toBe(10);
  });

  it('is symmetric', () => {
    const a = { x: 1, y: 4 };
    const b = { x: 7, y: 2 };
    expect(distance(a, b)).toBe(distance(b, a));
  });

  it('handles origin to origin', () => {
    expect(
      distance({ x: 0, y: 0 }, { x: 0, y: 0 })
    ).toBe(0);
  });

  it('handles large coordinates', () => {
    expect(
      distance({ x: 0, y: 0 }, { x: 1000, y: 1000 })
    ).toBe(2000);
  });
});

describe('Action types', () => {
  it('constructs a MoveAction', () => {
    const action: MoveAction = {
      type: 'move',
      unitId: 'inf1',
      target: { x: 3, y: 5 },
    };
    expect(action.type).toBe('move');
    expect(action.unitId).toBe('inf1');
    expect(action.target).toEqual({ x: 3, y: 5 });
  });

  it('constructs an AttackAction', () => {
    const action: AttackAction = {
      type: 'attack',
      unitId: 'arm1',
      targetUnitId: 'inf2',
    };
    expect(action.type).toBe('attack');
    expect(action.unitId).toBe('arm1');
    expect(action.targetUnitId).toBe('inf2');
  });

  it('constructs a WaitAction', () => {
    const action: WaitAction = {
      type: 'wait',
      unitId: 'art1',
    };
    expect(action.type).toBe('wait');
    expect(action.unitId).toBe('art1');
  });

  it('constructs a QuitAction', () => {
    const action: QuitAction = {
      type: 'quit',
    };
    expect(action.type).toBe('quit');
  });

  it('discriminates Action union by type', () => {
    const actions: Action[] = [
      { type: 'move', unitId: 'u1', target: { x: 0, y: 0 } },
      { type: 'attack', unitId: 'u2', targetUnitId: 'u3' },
      { type: 'wait', unitId: 'u4' },
      { type: 'quit' },
    ];
    expect(actions[0].type).toBe('move');
    expect(actions[1].type).toBe('attack');
    expect(actions[2].type).toBe('wait');
    expect(actions[3].type).toBe('quit');
  });
});

describe('Player type', () => {
  it('constructs a Player with units', () => {
    const player: Player = {
      id: 'p1',
      name: 'Commander Alpha',
      unitIds: ['inf1', 'arm1', 'art1'],
    };
    expect(player.id).toBe('p1');
    expect(player.name).toBe('Commander Alpha');
    expect(player.unitIds).toHaveLength(3);
  });

  it('constructs a Player with no units', () => {
    const player: Player = {
      id: 'p2',
      name: 'Empty',
      unitIds: [],
    };
    expect(player.unitIds).toHaveLength(0);
  });
});

describe('GameEvent type', () => {
  it('constructs a GameEvent', () => {
    const event: GameEvent = {
      turn: 1,
      player: 'p1',
      description: 'Moved infantry to (3, 5)',
      timestamp: 1700000000,
    };
    expect(event.turn).toBe(1);
    expect(event.player).toBe('p1');
    expect(event.description).toContain('infantry');
    expect(event.timestamp).toBe(1700000000);
  });
});

describe('TurnPhase type', () => {
  it('accepts all valid phases', () => {
    const phases: TurnPhase[] = [
      'command',
      'movement',
      'combat',
      'resolution',
    ];
    expect(phases).toHaveLength(4);
    expect(phases).toContain('command');
    expect(phases).toContain('movement');
    expect(phases).toContain('combat');
    expect(phases).toContain('resolution');
  });
});

describe('GameState type', () => {
  it('constructs a minimal GameState', () => {
    const state: GameState = {
      battlefield: {
        width: 5,
        height: 5,
        grid: [],
        units: new Map(),
      },
      players: [
        { id: 'p1', name: 'Alpha', unitIds: [] },
        { id: 'p2', name: 'Bravo', unitIds: [] },
      ],
      currentTurn: 1,
      currentPlayerIndex: 0,
      phase: 'command',
      log: [],
      winner: null,
    };
    expect(state.currentTurn).toBe(1);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.phase).toBe('command');
    expect(state.winner).toBeNull();
    expect(state.players).toHaveLength(2);
    expect(state.log).toHaveLength(0);
  });

  it('supports a winner', () => {
    const state: GameState = {
      battlefield: {
        width: 1,
        height: 1,
        grid: [],
        units: new Map(),
      },
      players: [],
      currentTurn: 10,
      currentPlayerIndex: 0,
      phase: 'resolution',
      log: [],
      winner: 'p1',
    };
    expect(state.winner).toBe('p1');
  });
});

describe('Result type discrimination', () => {
  it('ok result can be narrowed', () => {
    const result = ok(42);
    if (result.ok) {
      expect(result.value).toBe(42);
    } else {
      throw new Error('Should be ok');
    }
  });

  it('err result can be narrowed', () => {
    const result = err('fail');
    if (!result.ok) {
      expect(result.error).toBe('fail');
    } else {
      throw new Error('Should be err');
    }
  });

  it('ok with null value', () => {
    const result = ok(null);
    expect(result).toEqual({ ok: true, value: null });
  });

  it('ok with undefined value', () => {
    const result = ok(undefined);
    expect(result).toEqual({ ok: true, value: undefined });
  });

  it('err with complex error object', () => {
    const result = err({ code: 404, msg: 'not found' });
    expect(result).toEqual({
      ok: false,
      error: { code: 404, msg: 'not found' },
    });
  });
});
