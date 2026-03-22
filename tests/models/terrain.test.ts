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
