import { describe, it, expect } from 'vitest';
import {
  createBattlefield,
  setTerrain,
  placeUnit,
  removeUnit,
  getUnitAt,
  isInBounds,
} from '../../src/models/battlefield';
import { forest } from '../../src/models/terrain';
import { createInfantry, createArmor } from '../../src/models/unit';

describe('createBattlefield()', () => {
  it('creates correct dimensions', () => {
    const bf = createBattlefield(10, 8);
    expect(bf.width).toBe(10);
    expect(bf.height).toBe(8);
  });

  it('fills grid with plains', () => {
    const bf = createBattlefield(3, 2);
    expect(bf.grid.length).toBe(2); // height = rows
    expect(bf.grid[0].length).toBe(3); // width = cols
    for (const row of bf.grid) {
      for (const cell of row) {
        expect(cell.type).toBe('plains');
      }
    }
  });

  it('starts with no units', () => {
    const bf = createBattlefield(5, 5);
    expect(bf.units.size).toBe(0);
  });

  it('handles 1x1 grid', () => {
    const bf = createBattlefield(1, 1);
    expect(bf.grid.length).toBe(1);
    expect(bf.grid[0].length).toBe(1);
    expect(bf.grid[0][0].type).toBe('plains');
  });
});

describe('setTerrain()', () => {
  it('places terrain at the correct position', () => {
    const bf = createBattlefield(5, 5);
    const updated = setTerrain(bf, 2, 3, forest());
    expect(updated.grid[3][2].type).toBe('forest');
  });

  it('does not mutate the original', () => {
    const bf = createBattlefield(5, 5);
    setTerrain(bf, 0, 0, forest());
    expect(bf.grid[0][0].type).toBe('plains');
  });

  it('only changes the target cell', () => {
    const bf = createBattlefield(3, 3);
    const updated = setTerrain(bf, 1, 1, forest());
    // Check corners are still plains
    expect(updated.grid[0][0].type).toBe('plains');
    expect(updated.grid[0][2].type).toBe('plains');
    expect(updated.grid[2][0].type).toBe('plains');
    expect(updated.grid[2][2].type).toBe('plains');
    // Target changed
    expect(updated.grid[1][1].type).toBe('forest');
  });
});

describe('placeUnit()', () => {
  it('succeeds on empty tile', () => {
    const bf = createBattlefield(5, 5);
    const unit = createInfantry('inf1', 'p1', { x: 0, y: 0 });
    const result = placeUnit(bf, unit);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.units.get('inf1')).toEqual(unit);
    }
  });

  it('returns error on occupied tile', () => {
    const bf = createBattlefield(5, 5);
    const u1 = createInfantry('inf1', 'p1', { x: 2, y: 2 });
    const r1 = placeUnit(bf, u1);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    const u2 = createArmor('arm1', 'p2', { x: 2, y: 2 });
    const r2 = placeUnit(r1.value, u2);
    expect(r2.ok).toBe(false);
    if (!r2.ok) {
      expect(r2.error).toContain('occupied');
    }
  });

  it('returns error for out-of-bounds position', () => {
    const bf = createBattlefield(5, 5);
    const unit = createInfantry(
      'inf1', 'p1', { x: 10, y: 10 }
    );
    const result = placeUnit(bf, unit);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('out of bounds');
    }
  });

  it('allows units on different tiles', () => {
    const bf = createBattlefield(5, 5);
    const u1 = createInfantry('inf1', 'p1', { x: 0, y: 0 });
    const u2 = createArmor('arm1', 'p2', { x: 4, y: 4 });
    const r1 = placeUnit(bf, u1);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const r2 = placeUnit(r1.value, u2);
    expect(r2.ok).toBe(true);
    if (r2.ok) {
      expect(r2.value.units.size).toBe(2);
    }
  });

  it('does not mutate the original battlefield', () => {
    const bf = createBattlefield(5, 5);
    const unit = createInfantry('inf1', 'p1', { x: 0, y: 0 });
    placeUnit(bf, unit);
    expect(bf.units.size).toBe(0);
  });
});

describe('removeUnit()', () => {
  it('removes unit by id', () => {
    const bf = createBattlefield(5, 5);
    const unit = createInfantry('inf1', 'p1', { x: 1, y: 1 });
    const r = placeUnit(bf, unit);
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const updated = removeUnit(r.value, 'inf1');
    expect(updated.units.has('inf1')).toBe(false);
    expect(updated.units.size).toBe(0);
  });

  it('does not mutate the original', () => {
    const bf = createBattlefield(5, 5);
    const unit = createInfantry('inf1', 'p1', { x: 1, y: 1 });
    const r = placeUnit(bf, unit);
    if (!r.ok) return;

    removeUnit(r.value, 'inf1');
    expect(r.value.units.has('inf1')).toBe(true);
  });

  it('is a no-op for non-existent id', () => {
    const bf = createBattlefield(5, 5);
    const updated = removeUnit(bf, 'ghost');
    expect(updated.units.size).toBe(0);
  });
});

describe('getUnitAt()', () => {
  it('finds unit at position', () => {
    const bf = createBattlefield(5, 5);
    const unit = createInfantry('inf1', 'p1', { x: 3, y: 2 });
    const r = placeUnit(bf, unit);
    if (!r.ok) return;

    const found = getUnitAt(r.value, { x: 3, y: 2 });
    expect(found).not.toBeNull();
    expect(found?.id).toBe('inf1');
  });

  it('returns null when position is empty', () => {
    const bf = createBattlefield(5, 5);
    expect(getUnitAt(bf, { x: 0, y: 0 })).toBeNull();
  });

  it('returns null for wrong position', () => {
    const bf = createBattlefield(5, 5);
    const unit = createInfantry('inf1', 'p1', { x: 1, y: 1 });
    const r = placeUnit(bf, unit);
    if (!r.ok) return;

    expect(getUnitAt(r.value, { x: 2, y: 2 })).toBeNull();
  });
});

describe('isInBounds()', () => {
  const bf = createBattlefield(5, 5);

  it('returns true for valid positions', () => {
    expect(isInBounds(bf, { x: 0, y: 0 })).toBe(true);
    expect(isInBounds(bf, { x: 4, y: 4 })).toBe(true);
    expect(isInBounds(bf, { x: 2, y: 3 })).toBe(true);
  });

  it('returns true for corners', () => {
    expect(isInBounds(bf, { x: 0, y: 0 })).toBe(true);
    expect(isInBounds(bf, { x: 4, y: 0 })).toBe(true);
    expect(isInBounds(bf, { x: 0, y: 4 })).toBe(true);
    expect(isInBounds(bf, { x: 4, y: 4 })).toBe(true);
  });

  it('returns false for out-of-bounds', () => {
    expect(isInBounds(bf, { x: -1, y: 0 })).toBe(false);
    expect(isInBounds(bf, { x: 0, y: -1 })).toBe(false);
    expect(isInBounds(bf, { x: 5, y: 0 })).toBe(false);
    expect(isInBounds(bf, { x: 0, y: 5 })).toBe(false);
  });

  it('works with 1x1 grid', () => {
    const tiny = createBattlefield(1, 1);
    expect(isInBounds(tiny, { x: 0, y: 0 })).toBe(true);
    expect(isInBounds(tiny, { x: 1, y: 0 })).toBe(false);
    expect(isInBounds(tiny, { x: 0, y: 1 })).toBe(false);
  });
});
