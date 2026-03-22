// Battlefield grid and unit placement
import {
  Position,
  Result,
  ok,
  err,
} from './types.js';
import { Unit } from './unit.js';
import { TerrainCell, plains } from './terrain.js';

export type Battlefield = {
  width: number;
  height: number;
  grid: TerrainCell[][];   // grid[y][x]
  units: Map<string, Unit>; // unit id -> unit
};

// Create an all-plains battlefield
export function createBattlefield(
  width: number,
  height: number
): Battlefield {
  const grid: TerrainCell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: TerrainCell[] = [];
    for (let x = 0; x < width; x++) {
      row.push(plains());
    }
    grid.push(row);
  }
  return {
    width,
    height,
    grid,
    units: new Map(),
  };
}

// Return new battlefield with terrain at (x, y)
export function setTerrain(
  bf: Battlefield,
  x: number,
  y: number,
  terrain: TerrainCell
): Battlefield {
  const newGrid = bf.grid.map(
    (row, ry) => ry === y
      ? row.map(
          (cell, rx) => rx === x ? terrain : cell
        )
      : row
  );
  return {
    ...bf,
    grid: newGrid,
  };
}

// Place a unit; error if tile is occupied
export function placeUnit(
  bf: Battlefield,
  unit: Unit
): Result<Battlefield, string> {
  if (!isInBounds(bf, unit.position)) {
    return err(
      `Position (${unit.position.x}, ` +
      `${unit.position.y}) is out of bounds`
    );
  }
  const existing = getUnitAt(bf, unit.position);
  if (existing !== null) {
    return err(
      `Tile (${unit.position.x}, ` +
      `${unit.position.y}) is already occupied ` +
      `by unit ${existing.id}`
    );
  }
  const newUnits = new Map(bf.units);
  newUnits.set(unit.id, unit);
  return ok({
    ...bf,
    units: newUnits,
  });
}

// Remove a unit by id
export function removeUnit(
  bf: Battlefield,
  unitId: string
): Battlefield {
  const newUnits = new Map(bf.units);
  newUnits.delete(unitId);
  return {
    ...bf,
    units: newUnits,
  };
}

// Find unit at a given position
export function getUnitAt(
  bf: Battlefield,
  position: Position
): Unit | null {
  for (const unit of bf.units.values()) {
    if (
      unit.position.x === position.x &&
      unit.position.y === position.y
    ) {
      return unit;
    }
  }
  return null;
}

// Check if position is within grid bounds
export function isInBounds(
  bf: Battlefield,
  position: Position
): boolean {
  return (
    position.x >= 0 &&
    position.x < bf.width &&
    position.y >= 0 &&
    position.y < bf.height
  );
}
