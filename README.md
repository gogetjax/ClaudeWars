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

## Usage

```bash
# Development
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
