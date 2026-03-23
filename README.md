# ClaudeWars

Turn-based military simulation CLI game. Command infantry, armor, and artillery units on a grid battlefield with terrain effects, line-of-sight mechanics, and deterministic combat resolution.

## Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript (strict mode)
- **Testing:** Vitest
- **Build:** tsx (dev), tsc (production)
- **UI:** chalk (terminal rendering)

## Setup

```bash
npm install
```

## Playing the Game

```bash
npm run dev
```

This launches a two-player hot-seat game on a 10x8 battlefield. Blue Force and Red Force each command 4 units: 2 infantry, 1 armor, and 1 artillery.

### How a Turn Works

Each turn, the current player enters commands one at a time, then types `done` to end their turn:

```
[Blue Force] Command (or 'done'): move inf1 3 2
[Blue Force] Command (or 'done'): attack art1 inf3
[Blue Force] Command (or 'done'): wait inf2
[Blue Force] Command (or 'done'): done
```

### Commands

| Command | Format | Example |
|---------|--------|---------|
| Move | `move <unit> <x> <y>` | `move inf1 3 2` |
| Attack | `attack <unit> <target>` | `attack arm1 inf3` |
| Wait | `wait <unit>` | `wait art1` |
| Quit | `quit` | Surrender the game |

### Unit Types

| Unit | ID Prefix | HP | Attack | Defense | Range | Movement |
|------|-----------|-----|--------|---------|-------|----------|
| Infantry | inf | 10 | 4 | 3 | 1 | 2 |
| Armor | arm | 15 | 6 | 5 | 2 | 3 |
| Artillery | art | 8 | 8 | 1 | 4 | 1 |

### Terrain

The battlefield has varied terrain that affects movement and combat:

| Symbol | Terrain | Move Cost | Defense | Blocks Sight |
|--------|---------|-----------|---------|--------------|
| `.` | Plains | 1 | +0 | No |
| `T` | Forest | 2 | +2 | Yes |
| `^` | Hills | 2 | +3 | Partial |
| `~` | River | 3 | -1 | No |
| `#` | Urban | 1 | +4 | Yes |

### Rules

- **Movement:** Units spend movement points equal to terrain cost per tile. No diagonal movement. No stacking (one unit per tile).
- **Combat:** Damage = max(0, attack - defense - terrain bonus). Units must be within range (Manhattan distance) and have line of sight.
- **Turn order:** Moves must come before attacks in the same turn.
- **Victory:** Destroy all enemy units, or the opponent surrenders with `quit`.

### Reading the Map

Units appear as colored letters on the grid: **I** (infantry), **A** (armor), **R** (artillery). Blue Force units are blue, Red Force units are red.

```
    0 1 2 3 4 5 6 7 8 9
 0  . . . . . ~ . . . .
 1  I . . . . ~ . ^ ^ I
 2  . . T T . ~ . . ^ .
 3  . I T . . ~ . . I .
 4  . . . . . ~ . . . .
 5  A . . . # ~ . . . A
 6  . . . # # ~ . . . .
 7  . R . . . ~ . . R .
```

## Development

```bash
# Run the game
npm run dev

# Production build
npm run build

# Run tests
npm test

# Run a single test file
npx vitest run tests/engine/combat.test.ts
```

## Project Structure

```
src/
├── models/      # Data types: Unit, Terrain, Battlefield, Player
├── engine/      # Core logic: CombatResolver, TurnManager, MovementEngine
├── commands/    # CLI command parser and handler
└── ui/          # Terminal display
tests/           # Mirrors src/ structure with .test.ts files
docs/            # Architecture and design documentation
```

See [docs/architecture.md](docs/architecture.md) for detailed game design and mechanics.

## License

ISC
