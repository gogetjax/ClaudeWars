# ClaudeWars — Military Simulation Game

## Project Overview
Turn-based military simulation CLI game built with Node.js and TypeScript.
Players command units (infantry, armor, artillery) on a grid battlefield.

## Tech Stack
- Runtime: Node.js 20+
- Language: TypeScript (strict mode)
- Testing: Vitest
- Build: tsx for development, tsc for production

## Architecture
- `src/models/` — Data types: Unit, Terrain, Battlefield, Player
- `src/engine/` — Core logic: CombatResolver, TurnManager, MovementEngine
- `src/commands/` — CLI command parser and handler
- `src/ui/` — Terminal display using chalk
- `tests/` — Mirror src/ structure with .test.ts files
- See @docs/architecture.md for detailed design
- See @docs/audit-report.md for detailed project audit findings

## Code Conventions
- Pure functions preferred; no classes unless modeling game entities
- All game state is immutable; return new state from engine functions
- Use discriminated unions for unit types, not inheritance
- Error handling: use Result<T, E> pattern, never throw in engine code
- 80 character line width

## Git Conventions
- Commit after completing each logical unit of work
- Format: `type(scope): description` (e.g., `feat(combat): add terrain modifiers`)
- Types: feat, fix, refactor, test, docs, chore
- Always push to origin after every commit

## Agent Delegation Rules
- Use scout agent for all file reading, codebase exploration, and research
- Use engineer agent for all code writing, editing, and implementation
- Use quartermaster agent for all testing, validation, and quality checks
- For tasks spanning 3+ independent files, use parallel subagents
- Log all significant progress to progress.md

## Testing
- Run tests: `npx vitest run`
- Run single: `npx vitest run tests/engine/combat.test.ts`
- Always write tests before marking a feature complete

## Current Mission
Phase 1: Core data models and battlefield grid
