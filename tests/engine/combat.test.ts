import { describe, it, expect } from 'vitest';
import {
  calculateDamage,
  hasLineOfSight,
  canAttack,
  resolveAttack,
} from '../../src/engine/combat.js';
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
  plains,
  forest,
  hills,
  urban,
  river,
} from '../../src/models/terrain.js';

// -- Helpers --

function place(bf: ReturnType<typeof createBattlefield>,
  ...units: ReturnType<typeof createInfantry>[]
) {
  let b = bf;
  for (const u of units) {
    const r = placeUnit(b, u);
    if (!r.ok) throw new Error(r.error);
    b = r.value;
  }
  return b;
}

function setT(
  bf: ReturnType<typeof createBattlefield>,
  x: number, y: number,
  terrain: ReturnType<typeof plains>
) {
  const r = setTerrain(bf, x, y, terrain);
  // After engineer fix, returns Result
  if (typeof r === 'object' && 'ok' in r) {
    if (!r.ok) throw new Error(r.error);
    return r.value;
  }
  // Pre-fix: returns Battlefield directly
  return r;
}

// -- Tests --

describe('calculateDamage', () => {
  const inf1 = createInfantry('i1', 'p1', { x: 0, y: 0 });
  const inf2 = createInfantry('i2', 'p2', { x: 1, y: 0 });
  const arm = createArmor('a1', 'p1', { x: 0, y: 0 });
  const art = createArtillery('t1', 'p1', { x: 0, y: 0 });

  it('infantry vs infantry on plains', () => {
    // 4 - 3 - 0 = 1
    expect(calculateDamage(
      inf1, inf2, plains(), 1.0
    )).toBe(1);
  });

  it('armor vs infantry on plains', () => {
    // 6 - 3 - 0 = 3
    expect(calculateDamage(
      arm, inf2, plains(), 1.0
    )).toBe(3);
  });

  it('artillery vs infantry on plains', () => {
    // 8 - 3 - 0 = 5
    expect(calculateDamage(
      art, inf2, plains(), 1.0
    )).toBe(5);
  });

  it('forest defense bonus blocks weak attacks', () => {
    // 4 - 3 - 2 = -1 → max(0, -1) = 0
    expect(calculateDamage(
      inf1, inf2, forest(), 1.0
    )).toBe(0);
  });

  it('hills defense bonus blocks weak attacks', () => {
    // 4 - 3 - 3 = -2 → 0
    expect(calculateDamage(
      inf1, inf2, hills(), 1.0
    )).toBe(0);
  });

  it('river negative bonus increases damage', () => {
    // 4 - 3 - (-1) = 2
    expect(calculateDamage(
      inf1, inf2, river(), 1.0
    )).toBe(2);
  });

  it('randomFactor 0.8 reduces damage', () => {
    // max(0, 1) * 0.8 = 0.8 → round = 1
    expect(calculateDamage(
      inf1, inf2, plains(), 0.8
    )).toBe(1);
  });

  it('randomFactor 1.2 increases damage', () => {
    // 3 * 1.2 = 3.6 → round = 4
    expect(calculateDamage(
      arm, inf2, plains(), 1.2
    )).toBe(4);
  });

  it('clamps randomFactor below 0.8', () => {
    // 0.0 clamped to 0.8 → 1 * 0.8 = round(0.8) = 1
    expect(calculateDamage(
      inf1, inf2, plains(), 0.0
    )).toBe(1);
  });

  it('clamps randomFactor above 1.2', () => {
    // 2.0 clamped to 1.2 → 3 * 1.2 = round(3.6) = 4
    expect(calculateDamage(
      arm, inf2, plains(), 2.0
    )).toBe(4);
  });

  it('negative raw damage floors to 0', () => {
    const armDef = createArmor('a2', 'p2', { x: 1, y: 0 });
    // 4 - 5 - 0 = -1 → max(0, -1) = 0
    expect(calculateDamage(
      inf1, armDef, plains(), 1.0
    )).toBe(0);
  });
});

describe('hasLineOfSight', () => {
  it('adjacent units always have LOS', () => {
    const atk = createInfantry('i1', 'p1', { x: 0, y: 0 });
    const def = createInfantry('i2', 'p2', { x: 1, y: 0 });
    const bf = place(createBattlefield(5, 5), atk, def);
    expect(hasLineOfSight(atk, def, bf)).toBe(true);
  });

  it('clear plains path has LOS', () => {
    const atk = createArtillery(
      't1', 'p1', { x: 0, y: 0 }
    );
    const def = createInfantry(
      'i2', 'p2', { x: 4, y: 0 }
    );
    const bf = place(createBattlefield(5, 5), atk, def);
    expect(hasLineOfSight(atk, def, bf)).toBe(true);
  });

  it('forest between blocks LOS', () => {
    const atk = createArtillery(
      't1', 'p1', { x: 0, y: 0 }
    );
    const def = createInfantry(
      'i2', 'p2', { x: 4, y: 0 }
    );
    let bf = place(createBattlefield(5, 5), atk, def);
    bf = setT(bf, 2, 0, forest());
    expect(hasLineOfSight(atk, def, bf)).toBe(false);
  });

  it('urban between blocks LOS', () => {
    const atk = createArtillery(
      't1', 'p1', { x: 0, y: 0 }
    );
    const def = createInfantry(
      'i2', 'p2', { x: 4, y: 0 }
    );
    let bf = place(createBattlefield(5, 5), atk, def);
    bf = setT(bf, 2, 0, urban());
    expect(hasLineOfSight(atk, def, bf)).toBe(false);
  });

  it('hills block LOS for infantry', () => {
    const atk = createInfantry(
      'i1', 'p1', { x: 0, y: 0 }
    );
    const def = createInfantry(
      'i2', 'p2', { x: 4, y: 0 }
    );
    let bf = place(createBattlefield(5, 5), atk, def);
    bf = setT(bf, 2, 0, hills());
    expect(hasLineOfSight(atk, def, bf)).toBe(false);
  });

  it('artillery ignores hills (partial LOS)', () => {
    const atk = createArtillery(
      't1', 'p1', { x: 0, y: 0 }
    );
    const def = createInfantry(
      'i2', 'p2', { x: 4, y: 0 }
    );
    let bf = place(createBattlefield(5, 5), atk, def);
    bf = setT(bf, 2, 0, hills());
    expect(hasLineOfSight(atk, def, bf)).toBe(true);
  });
});

describe('canAttack', () => {
  it('valid adjacent infantry attack', () => {
    const atk = createInfantry(
      'i1', 'p1', { x: 0, y: 0 }
    );
    const def = createInfantry(
      'i2', 'p2', { x: 1, y: 0 }
    );
    const bf = place(createBattlefield(5, 5), atk, def);
    const r = canAttack(atk, def, bf);
    expect(r.ok).toBe(true);
  });

  it('dead attacker returns error', () => {
    const atk = {
      ...createInfantry('i1', 'p1', { x: 0, y: 0 }),
      hp: 0, isAlive: false,
    };
    const def = createInfantry(
      'i2', 'p2', { x: 1, y: 0 }
    );
    const bf = place(createBattlefield(5, 5), def);
    const r = canAttack(atk, def, bf);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain('not alive');
    }
  });

  it('dead defender returns error', () => {
    const atk = createInfantry(
      'i1', 'p1', { x: 0, y: 0 }
    );
    const def = {
      ...createInfantry('i2', 'p2', { x: 1, y: 0 }),
      hp: 0, isAlive: false,
    };
    const bf = place(createBattlefield(5, 5), atk);
    const r = canAttack(atk, def, bf);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain('not alive');
    }
  });

  it('friendly fire returns error', () => {
    const atk = createInfantry(
      'i1', 'p1', { x: 0, y: 0 }
    );
    const def = createInfantry(
      'i2', 'p1', { x: 1, y: 0 }
    );
    const bf = place(createBattlefield(5, 5), atk, def);
    const r = canAttack(atk, def, bf);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain('own units');
    }
  });

  it('out of range returns error', () => {
    const atk = createInfantry(
      'i1', 'p1', { x: 0, y: 0 }
    );
    const def = createInfantry(
      'i2', 'p2', { x: 3, y: 0 }
    );
    const bf = place(createBattlefield(5, 5), atk, def);
    const r = canAttack(atk, def, bf);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain('out of range');
    }
  });

  it('artillery at max range is valid', () => {
    const atk = createArtillery(
      't1', 'p1', { x: 0, y: 0 }
    );
    const def = createInfantry(
      'i2', 'p2', { x: 4, y: 0 }
    );
    const bf = place(createBattlefield(5, 5), atk, def);
    const r = canAttack(atk, def, bf);
    expect(r.ok).toBe(true);
  });

  it('no LOS through forest returns error', () => {
    const atk = createArtillery(
      't1', 'p1', { x: 0, y: 0 }
    );
    const def = createInfantry(
      'i2', 'p2', { x: 4, y: 0 }
    );
    let bf = place(
      createBattlefield(5, 5), atk, def
    );
    bf = setT(bf, 2, 0, forest());
    const r = canAttack(atk, def, bf);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain('line of sight');
    }
  });
});

describe('resolveAttack', () => {
  it('infantry vs infantry deals 1 damage', () => {
    const atk = createInfantry(
      'i1', 'p1', { x: 0, y: 0 }
    );
    const def = createInfantry(
      'i2', 'p2', { x: 1, y: 0 }
    );
    const bf = place(createBattlefield(5, 5), atk, def);
    const r = resolveAttack(atk, def, bf);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.damage).toBe(1);
    expect(r.value.defender.hp).toBe(9);
    expect(r.value.defender.isAlive).toBe(true);
  });

  it('armor vs infantry deals 3 damage', () => {
    const atk = createArmor(
      'a1', 'p1', { x: 0, y: 0 }
    );
    const def = createInfantry(
      'i2', 'p2', { x: 1, y: 0 }
    );
    const bf = place(createBattlefield(5, 5), atk, def);
    const r = resolveAttack(atk, def, bf);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.damage).toBe(3);
    expect(r.value.defender.hp).toBe(7);
  });

  it('attack that kills sets isAlive false', () => {
    const atk = createArmor(
      'a1', 'p1', { x: 0, y: 0 }
    );
    const def = {
      ...createInfantry('i2', 'p2', { x: 1, y: 0 }),
      hp: 1,
    };
    const bf = place(createBattlefield(5, 5), atk, def);
    const r = resolveAttack(atk, def, bf);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.defender.hp).toBe(0);
    expect(r.value.defender.isAlive).toBe(false);
  });

  it('default randomFactor is 1.0', () => {
    const atk = createArmor(
      'a1', 'p1', { x: 0, y: 0 }
    );
    const def = createInfantry(
      'i2', 'p2', { x: 1, y: 0 }
    );
    const bf = place(createBattlefield(5, 5), atk, def);
    const r1 = resolveAttack(atk, def, bf);
    const r2 = resolveAttack(atk, def, bf, 1.0);
    expect(r1.ok && r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;
    expect(r1.value.damage).toBe(r2.value.damage);
  });

  it('out of range attack returns error', () => {
    const atk = createInfantry(
      'i1', 'p1', { x: 0, y: 0 }
    );
    const def = createInfantry(
      'i2', 'p2', { x: 3, y: 0 }
    );
    const bf = place(createBattlefield(5, 5), atk, def);
    const r = resolveAttack(atk, def, bf);
    expect(r.ok).toBe(false);
  });

  it('friendly fire returns error', () => {
    const atk = createInfantry(
      'i1', 'p1', { x: 0, y: 0 }
    );
    const def = createInfantry(
      'i2', 'p1', { x: 1, y: 0 }
    );
    const bf = place(createBattlefield(5, 5), atk, def);
    const r = resolveAttack(atk, def, bf);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain('own units');
    }
  });
});
