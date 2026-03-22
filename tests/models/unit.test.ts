import { describe, it, expect } from 'vitest';
import {
  createInfantry,
  createArmor,
  createArtillery,
  createUnit,
} from '../../src/models/unit';

const pos = { x: 3, y: 5 };

describe('createInfantry()', () => {
  it('produces correct stats per spec', () => {
    const unit = createInfantry('inf1', 'p1', pos);
    expect(unit.type).toBe('infantry');
    expect(unit.hp).toBe(10);
    expect(unit.maxHp).toBe(10);
    expect(unit.attack).toBe(4);
    expect(unit.defense).toBe(3);
    expect(unit.range).toBe(1);
    expect(unit.movement).toBe(2);
  });

  it('starts alive with full hp', () => {
    const unit = createInfantry('inf1', 'p1', pos);
    expect(unit.isAlive).toBe(true);
    expect(unit.hp).toBe(unit.maxHp);
  });

  it('sets owner and position', () => {
    const unit = createInfantry('inf1', 'p1', pos);
    expect(unit.id).toBe('inf1');
    expect(unit.owner).toBe('p1');
    expect(unit.position).toEqual(pos);
  });
});

describe('createArmor()', () => {
  it('produces correct stats per spec', () => {
    const unit = createArmor('arm1', 'p2', pos);
    expect(unit.type).toBe('armor');
    expect(unit.hp).toBe(15);
    expect(unit.maxHp).toBe(15);
    expect(unit.attack).toBe(6);
    expect(unit.defense).toBe(5);
    expect(unit.range).toBe(2);
    expect(unit.movement).toBe(3);
  });

  it('starts alive with full hp', () => {
    const unit = createArmor('arm1', 'p2', pos);
    expect(unit.isAlive).toBe(true);
    expect(unit.hp).toBe(unit.maxHp);
  });

  it('sets owner and position', () => {
    const unit = createArmor('arm1', 'p2', { x: 0, y: 0 });
    expect(unit.owner).toBe('p2');
    expect(unit.position).toEqual({ x: 0, y: 0 });
  });
});

describe('createArtillery()', () => {
  it('produces correct stats per spec', () => {
    const unit = createArtillery('art1', 'p1', pos);
    expect(unit.type).toBe('artillery');
    expect(unit.hp).toBe(8);
    expect(unit.maxHp).toBe(8);
    expect(unit.attack).toBe(8);
    expect(unit.defense).toBe(1);
    expect(unit.range).toBe(4);
    expect(unit.movement).toBe(1);
  });

  it('starts alive with full hp', () => {
    const unit = createArtillery('art1', 'p1', pos);
    expect(unit.isAlive).toBe(true);
    expect(unit.hp).toBe(unit.maxHp);
  });
});

describe('createUnit()', () => {
  it('dispatches to createInfantry', () => {
    const unit = createUnit('infantry', 'u1', 'p1', pos);
    expect(unit.type).toBe('infantry');
    expect(unit.attack).toBe(4);
  });

  it('dispatches to createArmor', () => {
    const unit = createUnit('armor', 'u2', 'p1', pos);
    expect(unit.type).toBe('armor');
    expect(unit.attack).toBe(6);
  });

  it('dispatches to createArtillery', () => {
    const unit = createUnit('artillery', 'u3', 'p1', pos);
    expect(unit.type).toBe('artillery');
    expect(unit.attack).toBe(8);
  });

  it('passes owner and position through', () => {
    const unit = createUnit(
      'infantry', 'u1', 'player-x', { x: 9, y: 7 }
    );
    expect(unit.owner).toBe('player-x');
    expect(unit.position).toEqual({ x: 9, y: 7 });
  });

  it('preserves id for all unit types', () => {
    const inf = createUnit('infantry', 'a', 'p1', pos);
    const arm = createUnit('armor', 'b', 'p1', pos);
    const art = createUnit('artillery', 'c', 'p1', pos);
    expect(inf.id).toBe('a');
    expect(arm.id).toBe('b');
    expect(art.id).toBe('c');
  });
});

describe('createArtillery() owner and position', () => {
  it('sets owner and position', () => {
    const unit = createArtillery(
      'art1', 'p2', { x: 7, y: 3 }
    );
    expect(unit.id).toBe('art1');
    expect(unit.owner).toBe('p2');
    expect(unit.position).toEqual({ x: 7, y: 3 });
  });
});

describe('unit position edge cases', () => {
  it('accepts zero coordinates', () => {
    const unit = createInfantry(
      'inf1', 'p1', { x: 0, y: 0 }
    );
    expect(unit.position).toEqual({ x: 0, y: 0 });
  });

  it('accepts negative coordinates', () => {
    const unit = createArmor(
      'arm1', 'p1', { x: -5, y: -3 }
    );
    expect(unit.position).toEqual({ x: -5, y: -3 });
  });

  it('each factory returns independent objects', () => {
    const a = createInfantry('a', 'p1', { x: 1, y: 1 });
    const b = createInfantry('b', 'p1', { x: 1, y: 1 });
    expect(a).not.toBe(b);
    expect(a).toEqual(
      expect.objectContaining({
        type: 'infantry',
        position: { x: 1, y: 1 },
      })
    );
  });
});
