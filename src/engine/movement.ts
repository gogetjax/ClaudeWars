// Movement engine — pure functions, no throws
import {
  Position,
  Result,
  ok,
  err,
} from '../models/types.js';
import { Unit } from '../models/unit.js';
import {
  Battlefield,
  isInBounds,
  getUnitAt,
} from '../models/battlefield.js';

// Cardinal direction offsets (N, S, E, W)
const DIRECTIONS: Position[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
];

/**
 * BFS/Dijkstra shortest path cost from `from` to `to`.
 * Uses terrain movementCost per tile entered.
 * Cardinal directions only (no diagonal).
 */
export function getMovementCost(
  from: Position,
  to: Position,
  battlefield: Battlefield
): Result<number, string> {
  if (!isInBounds(battlefield, from)) {
    return err(
      `Origin (${from.x}, ${from.y}) is out of bounds`
    );
  }
  if (!isInBounds(battlefield, to)) {
    return err(
      `Target (${to.x}, ${to.y}) is out of bounds`
    );
  }

  if (from.x === to.x && from.y === to.y) {
    return ok(0);
  }

  // Dijkstra with simple priority queue
  const w = battlefield.width;
  const h = battlefield.height;
  const costs: number[][] = [];
  for (let y = 0; y < h; y++) {
    costs.push(new Array(w).fill(Infinity));
  }
  costs[from.y][from.x] = 0;

  // Min-heap as sorted array (fine for small grids)
  type Node = { x: number; y: number; cost: number };
  const queue: Node[] = [
    { x: from.x, y: from.y, cost: 0 },
  ];

  while (queue.length > 0) {
    // Pop lowest cost node
    let minIdx = 0;
    for (let i = 1; i < queue.length; i++) {
      if (queue[i].cost < queue[minIdx].cost) {
        minIdx = i;
      }
    }
    const current = queue[minIdx];
    queue.splice(minIdx, 1);

    if (
      current.x === to.x &&
      current.y === to.y
    ) {
      return ok(current.cost);
    }

    if (current.cost > costs[current.y][current.x]) {
      continue;
    }

    for (const dir of DIRECTIONS) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;

      if (
        nx < 0 || nx >= w ||
        ny < 0 || ny >= h
      ) {
        continue;
      }

      const terrain = battlefield.grid[ny][nx];
      const newCost =
        current.cost + terrain.movementCost;

      if (newCost < costs[ny][nx]) {
        costs[ny][nx] = newCost;
        queue.push({ x: nx, y: ny, cost: newCost });
      }
    }
  }

  return err(
    `No path from (${from.x}, ${from.y}) ` +
    `to (${to.x}, ${to.y})`
  );
}

/**
 * Validate whether a unit can move to the target.
 * Checks: alive, in bounds, path cost <= movement,
 * destination not occupied by another unit.
 */
export function canMoveTo(
  unit: Unit,
  target: Position,
  battlefield: Battlefield
): Result<true, string> {
  if (!unit.isAlive) {
    return err('Unit is not alive');
  }

  if (!isInBounds(battlefield, target)) {
    return err(
      `Target (${target.x}, ${target.y}) ` +
      `is out of bounds`
    );
  }

  // Moving to own position is a no-op (wait)
  if (
    unit.position.x === target.x &&
    unit.position.y === target.y
  ) {
    return ok(true);
  }

  // Check destination not occupied
  const occupant = getUnitAt(battlefield, target);
  if (occupant !== null) {
    return err(
      `Tile (${target.x}, ${target.y}) is ` +
      `occupied by unit ${occupant.id}`
    );
  }

  // Check path cost
  const costResult = getMovementCost(
    unit.position, target, battlefield
  );
  if (!costResult.ok) {
    return err(costResult.error);
  }

  if (costResult.value > unit.movement) {
    return err(
      `Path cost ${costResult.value} exceeds ` +
      `movement ${unit.movement}`
    );
  }

  return ok(true);
}

/**
 * Execute a move: returns new battlefield with the
 * unit relocated to the target position. Pure function.
 */
export function executeMove(
  unit: Unit,
  target: Position,
  battlefield: Battlefield
): Result<Battlefield, string> {
  const check = canMoveTo(unit, target, battlefield);
  if (!check.ok) {
    return err(check.error);
  }

  // No-op if already at target
  if (
    unit.position.x === target.x &&
    unit.position.y === target.y
  ) {
    return ok(battlefield);
  }

  // Create updated unit with new position
  const movedUnit: Unit = {
    ...unit,
    position: { ...target },
  } as Unit;

  // Replace unit in the map
  const newUnits = new Map(battlefield.units);
  newUnits.set(unit.id, movedUnit);

  return ok({
    ...battlefield,
    units: newUnits,
  });
}
