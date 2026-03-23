import { describe, it, expect } from 'vitest';
import {
  getMovementCost,
  canMoveTo,
  executeMove,
} from '../../src/engine/movement.js';
import {
  createInfantry,
  createArmor,
  createArtillery,
} from '../../src/models/unit.js';
import {
  createBattlefield,
  setTerrain,
  placeUnit,
} from '../../src/models/battlefield.js';
import {
  forest,
  river,
  hills,
} from '../../src/models/terrain.js';

// Helper: place a unit and assert success
function place(
  bf: ReturnType<typeof createBattlefield>,
  unit: ReturnType<typeof createInfantry>
) {
  const result = placeUnit(bf, unit);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

// Helper: set terrain and assert success
function terrain(
  bf: ReturnType<typeof createBattlefield>,
  x: number, y: number,
  t: ReturnType<typeof forest>
) {
  const result = setTerrain(bf, x, y, t);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe('getMovementCost', () => {
  it('returns 0 for same position', () => {
    const bf = createBattlefield(5, 5);
    const result = getMovementCost(
      { x: 2, y: 2 }, { x: 2, y: 2 }, bf
    );
    expect(result).toEqual({ ok: true, value: 0 });
  });

  it('costs 1 per plains tile', () => {
    const bf = createBattlefield(5, 5);
    const result = getMovementCost(
      { x: 0, y: 0 }, { x: 2, y: 0 }, bf
    );
    expect(result).toEqual({ ok: true, value: 2 });
  });

  it('costs 2 for forest tile', () => {
    let bf = createBattlefield(5, 5);
    bf = terrain(bf, 1, 0, forest());
    const result = getMovementCost(
      { x: 0, y: 0 }, { x: 2, y: 0 }, bf
    );
    // 0,0 -> 1,0 (forest=2) -> 2,0 (plains=1) = 3
    expect(result).toEqual({ ok: true, value: 3 });
  });

  it('costs 3 for river tile', () => {
    let bf = createBattlefield(5, 5);
    bf = terrain(bf, 1, 0, river());
    const result = getMovementCost(
      { x: 0, y: 0 }, { x: 1, y: 0 }, bf
    );
    expect(result).toEqual({ ok: true, value: 3 });
  });

  it('finds cheapest path through mixed terrain', () => {
    // Row 0: plains, forest, plains
    // Row 1: plains, plains, plains
    // Going (0,0) -> (2,0): direct = 1+2=3
    // Via row 1: (0,0)->(0,1)->(1,1)->(2,1)->(2,0) = 4
    // Direct is cheaper
    let bf = createBattlefield(3, 3);
    bf = terrain(bf, 1, 0, forest());
    const result = getMovementCost(
      { x: 0, y: 0 }, { x: 2, y: 0 }, bf
    );
    expect(result).toEqual({ ok: true, value: 3 });
  });

  it('errors for out-of-bounds origin', () => {
    const bf = createBattlefield(5, 5);
    const result = getMovementCost(
      { x: -1, y: 0 }, { x: 0, y: 0 }, bf
    );
    expect(result.ok).toBe(false);
  });

  it('errors for out-of-bounds target', () => {
    const bf = createBattlefield(5, 5);
    const result = getMovementCost(
      { x: 0, y: 0 }, { x: 5, y: 0 }, bf
    );
    expect(result.ok).toBe(false);
  });
});

describe('canMoveTo', () => {
  it('infantry can move 2 plains tiles', () => {
    const inf = createInfantry('i1', 'p1', { x: 0, y: 0 });
    const bf = place(createBattlefield(5, 5), inf);
    const result = canMoveTo(inf, { x: 2, y: 0 }, bf);
    expect(result).toEqual({ ok: true, value: true });
  });

  it('infantry cannot move 3 plains tiles', () => {
    const inf = createInfantry('i1', 'p1', { x: 0, y: 0 });
    const bf = place(createBattlefield(5, 5), inf);
    const result = canMoveTo(inf, { x: 3, y: 0 }, bf);
    expect(result.ok).toBe(false);
  });

  it('armor can move 3 plains tiles', () => {
    const arm = createArmor('a1', 'p1', { x: 0, y: 0 });
    const bf = place(createBattlefield(5, 5), arm);
    const result = canMoveTo(arm, { x: 3, y: 0 }, bf);
    expect(result).toEqual({ ok: true, value: true });
  });

  it('artillery limited to 1 movement', () => {
    const art = createArtillery(
      'art1', 'p1', { x: 0, y: 0 }
    );
    const bf = place(createBattlefield(5, 5), art);
    // 1 tile is ok
    expect(
      canMoveTo(art, { x: 1, y: 0 }, bf)
    ).toEqual({ ok: true, value: true });
    // 2 tiles is too far
    expect(
      canMoveTo(art, { x: 2, y: 0 }, bf).ok
    ).toBe(false);
  });

  it('rejects move to occupied tile', () => {
    const inf1 = createInfantry(
      'i1', 'p1', { x: 0, y: 0 }
    );
    const inf2 = createInfantry(
      'i2', 'p2', { x: 1, y: 0 }
    );
    let bf = place(createBattlefield(5, 5), inf1);
    bf = place(bf, inf2);
    const result = canMoveTo(inf1, { x: 1, y: 0 }, bf);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('occupied');
    }
  });

  it('allows move to own position (no-op)', () => {
    const inf = createInfantry('i1', 'p1', { x: 2, y: 2 });
    const bf = place(createBattlefield(5, 5), inf);
    const result = canMoveTo(inf, { x: 2, y: 2 }, bf);
    expect(result).toEqual({ ok: true, value: true });
  });

  it('infantry cannot cross river (cost 3 > move 2)',
    () => {
      const inf = createInfantry(
        'i1', 'p1', { x: 0, y: 0 }
      );
      let bf = createBattlefield(5, 5);
      bf = terrain(bf, 1, 0, river());
      bf = place(bf, inf);
      const result = canMoveTo(
        inf, { x: 1, y: 0 }, bf
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('exceeds');
      }
    }
  );

  it('armor can cross river (cost 3 = move 3)', () => {
    const arm = createArmor('a1', 'p1', { x: 0, y: 0 });
    let bf = createBattlefield(5, 5);
    bf = terrain(bf, 1, 0, river());
    bf = place(bf, arm);
    const result = canMoveTo(arm, { x: 1, y: 0 }, bf);
    expect(result).toEqual({ ok: true, value: true });
  });

  it('rejects out-of-bounds target', () => {
    const inf = createInfantry('i1', 'p1', { x: 0, y: 0 });
    const bf = place(createBattlefield(5, 5), inf);
    const result = canMoveTo(inf, { x: -1, y: 0 }, bf);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('out of bounds');
    }
  });

  it('dead unit cannot move', () => {
    const inf = createInfantry('i1', 'p1', { x: 0, y: 0 });
    const dead = { ...inf, hp: 0, isAlive: false };
    const bf = createBattlefield(5, 5);
    const result = canMoveTo(
      dead as typeof inf, { x: 1, y: 0 }, bf
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('not alive');
    }
  });

  it('infantry can move through forest (cost 2)',
    () => {
      const inf = createInfantry(
        'i1', 'p1', { x: 0, y: 0 }
      );
      let bf = createBattlefield(5, 5);
      bf = terrain(bf, 1, 0, forest());
      bf = place(bf, inf);
      // Moving to the forest tile costs 2 = movement
      const result = canMoveTo(
        inf, { x: 1, y: 0 }, bf
      );
      expect(result).toEqual(
        { ok: true, value: true }
      );
    }
  );
});

describe('executeMove', () => {
  it('returns updated battlefield with unit moved',
    () => {
      const inf = createInfantry(
        'i1', 'p1', { x: 0, y: 0 }
      );
      const bf = place(createBattlefield(5, 5), inf);
      const result = executeMove(
        inf, { x: 1, y: 1 }, bf
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        const moved = result.value.units.get('i1');
        expect(moved?.position).toEqual(
          { x: 1, y: 1 }
        );
      }
    }
  );

  it('does not mutate original battlefield', () => {
    const inf = createInfantry(
      'i1', 'p1', { x: 0, y: 0 }
    );
    const bf = place(createBattlefield(5, 5), inf);
    executeMove(inf, { x: 1, y: 0 }, bf);
    // Original unit unchanged
    const original = bf.units.get('i1');
    expect(original?.position).toEqual({ x: 0, y: 0 });
  });

  it('no-op returns same battlefield for same pos',
    () => {
      const inf = createInfantry(
        'i1', 'p1', { x: 2, y: 2 }
      );
      const bf = place(createBattlefield(5, 5), inf);
      const result = executeMove(
        inf, { x: 2, y: 2 }, bf
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(bf);
      }
    }
  );

  it('errors for invalid move', () => {
    const inf = createInfantry(
      'i1', 'p1', { x: 0, y: 0 }
    );
    const bf = place(createBattlefield(5, 5), inf);
    const result = executeMove(
      inf, { x: 4, y: 4 }, bf
    );
    expect(result.ok).toBe(false);
  });
});
