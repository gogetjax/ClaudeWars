// Combat resolution engine — pure functions, no throws
import {
  Position,
  Result,
  ok,
  err,
  distance,
} from '../models/types.js';
import { Unit } from '../models/unit.js';
import { TerrainCell } from '../models/terrain.js';
import { Battlefield } from '../models/battlefield.js';

/**
 * Core damage formula.
 * rawDamage = attack - defense - defenseBonus
 * finalDamage = max(0, rawDamage) * randomFactor
 * randomFactor must be between 0.8 and 1.2
 */
export function calculateDamage(
  attacker: Unit,
  defender: Unit,
  defenderTerrain: TerrainCell,
  randomFactor: number
): number {
  const rawDamage =
    attacker.attack
    - defender.defense
    - defenderTerrain.defenseBonus;
  const finalDamage =
    Math.max(0, rawDamage) * randomFactor;
  return Math.round(finalDamage);
}

/**
 * Get cells along the line between two positions.
 * Uses Bresenham-style interpolation to find
 * intermediate grid cells. Excludes start and end.
 */
function getCellsBetween(
  from: Position,
  to: Position
): Position[] {
  const cells: Position[] = [];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const steps = Math.max(
    Math.abs(dx),
    Math.abs(dy)
  );

  if (steps <= 1) {
    return cells;
  }

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = Math.round(from.x + dx * t);
    const y = Math.round(from.y + dy * t);
    // Avoid duplicates
    const last = cells[cells.length - 1];
    if (!last || last.x !== x || last.y !== y) {
      cells.push({ x, y });
    }
  }

  return cells;
}

/**
 * Check line of sight between attacker and defender.
 *
 * - Forest/Urban (blocksLineOfSight === true) blocks
 *   LOS entirely for all unit types.
 * - Hills (blocksLineOfSight === 'partial') block
 *   LOS for ground units but not for artillery.
 *   Units ON the hill can see over it. Units BEHIND
 *   a hill from the attacker's perspective cannot be
 *   seen by ground-level attackers.
 */
export function hasLineOfSight(
  attacker: Unit,
  defender: Unit,
  battlefield: Battlefield
): boolean {
  const between = getCellsBetween(
    attacker.position,
    defender.position
  );

  for (const pos of between) {
    const cell = battlefield.grid[pos.y]?.[pos.x];
    if (!cell) continue;

    // Forest and Urban block all LOS
    if (cell.blocksLineOfSight === true) {
      return false;
    }

    // Partial LOS (hills):
    // Artillery ignores partial blocking
    if (cell.blocksLineOfSight === 'partial') {
      if (attacker.type === 'artillery') {
        continue;
      }
      // Ground unit: hill blocks LOS
      return false;
    }
  }

  return true;
}

/**
 * Validate whether an attack is legal.
 * Returns ok(true) or err(reason).
 */
export function canAttack(
  attacker: Unit,
  defender: Unit,
  battlefield: Battlefield
): Result<true, string> {
  if (!attacker.isAlive) {
    return err('Attacker is not alive');
  }

  if (!defender.isAlive) {
    return err('Defender is not alive');
  }

  if (attacker.owner === defender.owner) {
    return err('Cannot target own units');
  }

  const dist = distance(
    attacker.position,
    defender.position
  );
  if (dist > attacker.range) {
    return err(
      `Target out of range: distance ${dist}, ` +
      `range ${attacker.range}`
    );
  }

  if (
    !hasLineOfSight(attacker, defender, battlefield)
  ) {
    return err(
      'No line of sight to target'
    );
  }

  return ok(true);
}

/**
 * Resolve an attack: validate, calculate damage,
 * return updated defender. Pure function — returns
 * a new Unit, never mutates.
 *
 * randomFactor defaults to 1.0 (deterministic).
 */
export function resolveAttack(
  attacker: Unit,
  defender: Unit,
  battlefield: Battlefield,
  randomFactor: number = 1.0
): Result<{ defender: Unit; damage: number }, string> {
  const check = canAttack(
    attacker, defender, battlefield
  );
  if (!check.ok) {
    return err(check.error);
  }

  const defenderTerrain =
    battlefield.grid[defender.position.y]
      [defender.position.x];

  const damage = calculateDamage(
    attacker,
    defender,
    defenderTerrain,
    randomFactor
  );

  const newHp = Math.max(0, defender.hp - damage);
  const updatedDefender: Unit = {
    ...defender,
    hp: newHp,
    isAlive: newHp > 0,
  } as Unit;

  return ok({ defender: updatedDefender, damage });
}
