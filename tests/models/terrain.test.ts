import { describe, it, expect } from 'vitest';
import {
  plains,
  forest,
  hills,
  river,
  urban,
  createTerrain,
} from '../../src/models/terrain';

describe('plains()', () => {
  it('produces correct terrain stats', () => {
    const t = plains();
    expect(t.type).toBe('plains');
    expect(t.movementCost).toBe(1);
    expect(t.defenseBonus).toBe(0);
    expect(t.blocksLineOfSight).toBe(false);
  });
});

describe('forest()', () => {
  it('produces correct terrain stats', () => {
    const t = forest();
    expect(t.type).toBe('forest');
    expect(t.movementCost).toBe(2);
    expect(t.defenseBonus).toBe(2);
    expect(t.blocksLineOfSight).toBe(true);
  });
});

describe('hills()', () => {
  it('produces correct terrain stats', () => {
    const t = hills();
    expect(t.type).toBe('hills');
    expect(t.movementCost).toBe(2);
    expect(t.defenseBonus).toBe(3);
    expect(t.blocksLineOfSight).toBe('partial');
  });
});

describe('river()', () => {
  it('produces correct terrain stats', () => {
    const t = river();
    expect(t.type).toBe('river');
    expect(t.movementCost).toBe(3);
    expect(t.defenseBonus).toBe(-1);
    expect(t.blocksLineOfSight).toBe(false);
  });
});

describe('urban()', () => {
  it('produces correct terrain stats', () => {
    const t = urban();
    expect(t.type).toBe('urban');
    expect(t.movementCost).toBe(1);
    expect(t.defenseBonus).toBe(4);
    expect(t.blocksLineOfSight).toBe(true);
  });
});

describe('createTerrain()', () => {
  it('dispatches correctly for each type', () => {
    const types = [
      'plains', 'forest', 'hills', 'river', 'urban',
    ] as const;
    for (const type of types) {
      const t = createTerrain(type);
      expect(t.type).toBe(type);
    }
  });

  it('matches individual factory output', () => {
    expect(createTerrain('plains')).toEqual(plains());
    expect(createTerrain('forest')).toEqual(forest());
    expect(createTerrain('hills')).toEqual(hills());
    expect(createTerrain('river')).toEqual(river());
    expect(createTerrain('urban')).toEqual(urban());
  });
});

describe('terrain factory independence', () => {
  it('returns fresh objects each call', () => {
    const a = plains();
    const b = plains();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it('forest returns independent objects', () => {
    const a = forest();
    const b = forest();
    expect(a).not.toBe(b);
  });

  it('createTerrain returns independent objects', () => {
    const a = createTerrain('hills');
    const b = createTerrain('hills');
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});

describe('terrain defensive values', () => {
  it('river has negative defense bonus', () => {
    const t = river();
    expect(t.defenseBonus).toBeLessThan(0);
  });

  it('urban has highest defense bonus', () => {
    const all = [
      plains(), forest(), hills(), river(), urban(),
    ];
    const maxBonus = Math.max(
      ...all.map((t) => t.defenseBonus)
    );
    expect(urban().defenseBonus).toBe(maxBonus);
  });

  it('river has highest movement cost', () => {
    const all = [
      plains(), forest(), hills(), river(), urban(),
    ];
    const maxCost = Math.max(
      ...all.map((t) => t.movementCost)
    );
    expect(river().movementCost).toBe(maxCost);
  });
});
