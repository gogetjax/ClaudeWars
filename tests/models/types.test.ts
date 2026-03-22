import { describe, it, expect } from 'vitest';
import { ok, err, distance } from '../../src/models/types';

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
});
