import { describe, it, expect } from 'vitest';
import {
  createGameState,
  processActions,
  advanceTurn,
  checkVictory,
} from '../../src/engine/turn.js';
import {
  createBattlefield,
  placeUnit,
} from '../../src/models/battlefield.js';
import {
  createInfantry,
  createArmor,
} from '../../src/models/unit.js';
import { Player } from '../../src/models/types.js';

// Helper: build a 5x5 plains battlefield with
// two players each having one infantry unit.
function setupGame() {
  let bf = createBattlefield(5, 5);

  const inf1 = createInfantry(
    'inf1', 'p1', { x: 0, y: 0 }
  );
  const inf2 = createInfantry(
    'inf2', 'p2', { x: 1, y: 0 }
  );

  const r1 = placeUnit(bf, inf1);
  if (!r1.ok) throw new Error(r1.error);
  bf = r1.value;

  const r2 = placeUnit(bf, inf2);
  if (!r2.ok) throw new Error(r2.error);
  bf = r2.value;

  const players: Player[] = [
    { id: 'p1', name: 'Alice', unitIds: ['inf1'] },
    { id: 'p2', name: 'Bob', unitIds: ['inf2'] },
  ];

  return createGameState(bf, players);
}

// Helper: build game with units far apart
// for move-only tests.
function setupMoveGame() {
  let bf = createBattlefield(5, 5);

  const inf1 = createInfantry(
    'inf1', 'p1', { x: 0, y: 0 }
  );
  const inf2 = createInfantry(
    'inf2', 'p2', { x: 4, y: 4 }
  );

  const r1 = placeUnit(bf, inf1);
  if (!r1.ok) throw new Error(r1.error);
  bf = r1.value;

  const r2 = placeUnit(bf, inf2);
  if (!r2.ok) throw new Error(r2.error);
  bf = r2.value;

  const players: Player[] = [
    { id: 'p1', name: 'Alice', unitIds: ['inf1'] },
    { id: 'p2', name: 'Bob', unitIds: ['inf2'] },
  ];

  return createGameState(bf, players);
}

describe('createGameState', () => {
  it('initializes with correct defaults', () => {
    const state = setupGame();
    expect(state.currentTurn).toBe(1);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.phase).toBe('command');
    expect(state.log).toEqual([]);
    expect(state.winner).toBeNull();
    expect(state.players).toHaveLength(2);
  });
});

describe('processActions', () => {
  it('moves a unit to a new position', () => {
    const state = setupMoveGame();
    const result = processActions(state, [
      { type: 'move', unitId: 'inf1',
        target: { x: 1, y: 0 } },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const bf = result.value.battlefield;
    const moved = bf.units.get('inf1');
    expect(moved).toBeDefined();
    expect(moved!.position).toEqual({ x: 1, y: 0 });
  });

  it('deals damage with attack action', () => {
    const state = setupGame();
    // inf1 at (0,0), inf2 at (1,0) — range 1
    const result = processActions(state, [
      { type: 'attack', unitId: 'inf1',
        targetUnitId: 'inf2' },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const bf = result.value.battlefield;
    const def = bf.units.get('inf2');
    // attack 4 - defense 3 - bonus 0 = 1 damage
    // inf2 starts at 10 hp, should be 9
    expect(def).toBeDefined();
    expect(def!.hp).toBe(9);
  });

  it('removes dead unit and updates player', () => {
    // Use armor vs infantry so damage is higher
    let bf = createBattlefield(5, 5);
    const arm = createArmor(
      'arm1', 'p1', { x: 0, y: 0 }
    );
    // Create a weak infantry with low HP
    const weakInf = {
      ...createInfantry(
        'inf2', 'p2', { x: 1, y: 0 }
      ),
      hp: 1,
    };

    let r = placeUnit(bf, arm);
    if (!r.ok) throw new Error(r.error);
    bf = r.value;
    r = placeUnit(bf, weakInf);
    if (!r.ok) throw new Error(r.error);
    bf = r.value;

    const players: Player[] = [
      { id: 'p1', name: 'Alice',
        unitIds: ['arm1'] },
      { id: 'p2', name: 'Bob',
        unitIds: ['inf2'] },
    ];
    const state = createGameState(bf, players);

    const result = processActions(state, [
      { type: 'attack', unitId: 'arm1',
        targetUnitId: 'inf2' },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.battlefield.units.has('inf2'))
      .toBe(false);
    // Player 2's unitIds should be empty
    const p2 = result.value.players.find(
      p => p.id === 'p2'
    );
    expect(p2!.unitIds).toEqual([]);
  });

  it('handles wait action as no-op', () => {
    const state = setupGame();
    const result = processActions(state, [
      { type: 'wait', unitId: 'inf1' },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.log).toHaveLength(1);
    expect(result.value.log[0].description)
      .toContain('waited');
  });

  it('sets winner on quit', () => {
    const state = setupGame();
    const result = processActions(state, [
      { type: 'quit' },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // p1 quits, p2 should win
    expect(result.value.winner).toBe('p2');
  });

  it('rejects actions for non-owned units', () => {
    const state = setupGame();
    // p1 tries to move p2's unit
    const result = processActions(state, [
      { type: 'move', unitId: 'inf2',
        target: { x: 2, y: 0 } },
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain(
      'does not belong'
    );
  });
});

describe('advanceTurn', () => {
  it('cycles to next player', () => {
    const state = setupGame();
    const next = advanceTurn(state);
    expect(next.currentPlayerIndex).toBe(1);
    expect(next.currentTurn).toBe(1);
    expect(next.phase).toBe('command');
  });

  it('increments turn number on wrap', () => {
    const state = setupGame();
    const afterP2 = advanceTurn(
      advanceTurn(state)
    );
    expect(afterP2.currentPlayerIndex).toBe(0);
    expect(afterP2.currentTurn).toBe(2);
  });
});

describe('checkVictory', () => {
  it('detects winner when one player has ' +
     'no alive units', () => {
    // Remove p2's unit from battlefield
    let bf = createBattlefield(5, 5);
    const inf1 = createInfantry(
      'inf1', 'p1', { x: 0, y: 0 }
    );
    const r = placeUnit(bf, inf1);
    if (!r.ok) throw new Error(r.error);
    bf = r.value;

    const players: Player[] = [
      { id: 'p1', name: 'Alice',
        unitIds: ['inf1'] },
      { id: 'p2', name: 'Bob', unitIds: [] },
    ];
    const state = createGameState(bf, players);
    const checked = checkVictory(state);
    expect(checked.winner).toBe('p1');
  });

  it('detects draw when no players have ' +
     'alive units', () => {
    const bf = createBattlefield(5, 5);
    const players: Player[] = [
      { id: 'p1', name: 'Alice', unitIds: [] },
      { id: 'p2', name: 'Bob', unitIds: [] },
    ];
    const state = createGameState(bf, players);
    const checked = checkVictory(state);
    expect(checked.winner).toBe('draw');
  });

  it('returns state unchanged when game ' +
     'is ongoing', () => {
    const state = setupGame();
    const checked = checkVictory(state);
    expect(checked.winner).toBeNull();
    expect(checked).toBe(state);
  });
});
