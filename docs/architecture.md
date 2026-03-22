# ClaudeWars Architecture

## Game State Model

The game is a pure state machine. Every action produces a new GameState.

```
GameState
├── battlefield: Battlefield (grid + terrain)
├── players: Player[] (each owns units)
├── currentTurn: number
├── phase: 'movement' | 'combat' | 'resolution'
└── log: GameEvent[] (history)
```

## Core Types

```typescript
// Position on the battlefield grid
type Position = {
  x: number;
  y: number;
};

// Player identity
type Player = {
  id: string;
  name: string;
  units: Unit[];
};

// The full game state — immutable, replaced each turn
type GameState = {
  battlefield: Battlefield;
  players: Player[];
  currentTurn: number;
  currentPlayerIndex: number;
  phase: TurnPhase;
  log: GameEvent[];
  winner: string | null;
};

type TurnPhase = 'command' | 'movement' | 'combat' | 'resolution';

type GameEvent = {
  turn: number;
  player: string;
  description: string;
  timestamp: number;
};
```

## Unit System (Discriminated Unions)

Units use discriminated unions — not classes or inheritance. This keeps
the engine functional and pattern-matchable.

```typescript
type UnitType = 'infantry' | 'armor' | 'artillery';

type BaseUnit = {
  id: string;
  owner: string;       // player id
  position: Position;
  hp: number;
  maxHp: number;
  isAlive: boolean;
};

type InfantryUnit = BaseUnit & {
  type: 'infantry';
  attack: 4;
  defense: 3;
  range: 1;
  movement: 2;
};

type ArmorUnit = BaseUnit & {
  type: 'armor';
  attack: 6;
  defense: 5;
  range: 2;
  movement: 3;
};

type ArtilleryUnit = BaseUnit & {
  type: 'artillery';
  attack: 8;
  defense: 1;
  range: 4;
  movement: 1;
};

type Unit = InfantryUnit | ArmorUnit | ArtilleryUnit;
```

### Unit Stat Summary

| Type      | HP | Attack | Defense | Range | Movement |
|-----------|----|--------|---------|-------|----------|
| Infantry  | 10 |   4    |    3    |   1   |    2     |
| Armor     | 15 |   6    |    5    |   2   |    3     |
| Artillery | 8  |   8    |    1    |   4   |    1     |

## Battlefield & Terrain

The battlefield is a 2D grid. Each cell has a terrain type that affects
movement cost, defensive bonuses, and line of sight.

```typescript
type TerrainType = 'plains' | 'forest' | 'hills' | 'river' | 'urban';

type TerrainCell = {
  type: TerrainType;
  movementCost: number;
  defenseBonus: number;
  blocksLineOfSight: boolean | 'partial';
};

type Battlefield = {
  width: number;
  height: number;
  grid: TerrainCell[][];   // grid[y][x]
  units: Map<string, Unit>; // unit id -> unit
};
```

### Terrain Effects Table

| Terrain | Movement Cost | Defense Bonus | Blocks Line of Sight |
|---------|---------------|---------------|----------------------|
| Plains  | 1             | +0            | No                   |
| Forest  | 2             | +2            | Yes                  |
| Hills   | 2             | +3            | Partial              |
| River   | 3             | -1            | No                   |
| Urban   | 1             | +4            | Yes                  |

**Partial line of sight (Hills):** Units on the hill CAN see over it.
Units behind the hill from the attacker's perspective CANNOT be seen
by ground-level units. Artillery ignores partial LOS.

## Combat Resolution

Combat is deterministic with a small random variance band.

```typescript
// Core damage formula
function calculateDamage(
  attacker: Unit,
  defender: Unit,
  defenderTerrain: TerrainCell,
  randomFactor: number  // between 0.8 and 1.2
): number {
  const rawDamage = attacker.attack - defender.defense - defenderTerrain.defenseBonus;
  const finalDamage = Math.max(0, rawDamage) * randomFactor;
  return Math.round(finalDamage);
}
```

### Combat Rules

1. **Range check:** Attacker must be within weapon range (Manhattan distance).
2. **Line of sight:** Attacker must have LOS to defender. Forest and Urban
   block LOS entirely. Hills block partially (see above).
3. **Artillery exception:** Artillery ignores partial LOS (fires over hills)
   but still cannot fire through Forest or Urban.
4. **Minimum damage:** If rawDamage <= 0, the attack deals 0 damage (blocked).
5. **No friendly fire:** Cannot target own units.
6. **One attack per turn:** Each unit may attack once per turn.

### Distance Calculation

```typescript
// Manhattan distance for range checks
function distance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
```

## Movement Engine

```typescript
// A unit can move up to its movement stat in total terrain cost
// Example: Infantry (movement: 2) can move 2 plains tiles OR 1 forest tile

function canMoveTo(
  unit: Unit,
  from: Position,
  to: Position,
  battlefield: Battlefield
): boolean {
  // 1. Calculate shortest path cost using BFS/Dijkstra
  // 2. Path cost must be <= unit.movement
  // 3. Destination must not be occupied by another unit
  // 4. River tiles cost 3 movement (most units cannot cross in one turn)
  return pathCost <= unit.movement && !isOccupied(to, battlefield);
}
```

### Movement Rules

1. **Movement cost is per-tile, not per-step.** A path through 2 plains = cost 2.
   A path through 1 forest = cost 2.
2. **No diagonal movement.** Units move in cardinal directions only (N/S/E/W).
3. **No stacking.** Only one unit per tile.
4. **Move OR attack.** A unit may move and then attack, or just attack, or just
   move, or wait. It cannot attack and then move.

## Turn Manager

Each turn follows this sequence:

```
1. COMMAND PHASE
   └── Current player enters commands for their units
       Commands: move <unit> <x> <y>
                 attack <unit> <target>
                 wait <unit>
                 quit

2. MOVEMENT PHASE
   └── All movement commands resolve simultaneously
       If two units try to move to the same tile, neither moves

3. COMBAT PHASE
   └── All attack commands resolve simultaneously
       Damage is calculated and applied
       Units at 0 HP are marked dead and removed

4. RESOLUTION PHASE
   └── Check victory conditions (all enemy units destroyed)
       Log events
       Advance to next player's turn
```

## Command Parser

```typescript
type MoveAction = {
  type: 'move';
  unitId: string;
  target: Position;
};

type AttackAction = {
  type: 'attack';
  unitId: string;
  targetUnitId: string;
};

type WaitAction = {
  type: 'wait';
  unitId: string;
};

type QuitAction = {
  type: 'quit';
};

type Action = MoveAction | AttackAction | WaitAction | QuitAction;

// Parser input examples:
// "move inf1 3 5"    → { type: 'move', unitId: 'inf1', target: { x: 3, y: 5 } }
// "attack arm1 inf2" → { type: 'attack', unitId: 'arm1', targetUnitId: 'inf2' }
// "wait art1"        → { type: 'wait', unitId: 'art1' }
// "quit"             → { type: 'quit' }
```

## Victory Conditions

- A player wins when all enemy units are destroyed (hp <= 0).
- If both players lose their last unit in the same combat phase, it's a draw.
- A player can surrender by issuing the `quit` command.

## Module Dependency Map

```
src/index.ts (entry point)
  ├── src/ui/display.ts (renders battlefield, prompts)
  │     └── uses: chalk
  ├── src/commands/parser.ts (parses user input → Action)
  ├── src/engine/turn.ts (TurnManager — sequences phases)
  │     ├── src/engine/movement.ts (validates & executes moves)
  │     └── src/engine/combat.ts (resolves attacks, applies damage)
  └── src/models/ (all type definitions)
        ├── types.ts (GameState, Position, Action, etc.)
        ├── unit.ts (Unit discriminated union, factory functions)
        ├── terrain.ts (TerrainCell, terrain factory)
        └── battlefield.ts (Battlefield, grid creation)
```

No circular dependencies. Data flows down. Models have zero imports
from engine or ui. Engine imports only from models. UI imports from
models and engine.
