# ClaudeWars Project Audit Report

Date: 2026-03-22

Three-angle audit of the ClaudeWars codebase: code quality, test coverage, and architecture conformance.

---

## 1. Code Review — Key Findings

### Critical

- **`GameState.battlefield` typed with `unknown[][]`** (`src/models/types.ts` lines 32–45) — forces unsafe `as unknown as Battlefield` casts throughout the engine (`turn.ts` lines 71, 190)
- **`parser.ts` applies `toLowerCase()` to entire input** (line 15) — corrupts unit IDs like `Inf1` or `ARM-3`. **Tests lock in this bug**: `parser.test.ts` lines 178–200 assert `unitId: 'inf1'` for input `MOVE INF1 3 5`, treating the corruption as correct behavior. Any fix requires coordinated test updates.
- **`processActions` continues after `quit`** (`turn.ts` lines 78–90) — should `break` immediately after setting winner

### High

- No turn phase enforcement — move and attack resolve in same pass, violating the command → movement → combat → resolution sequence
- `randomFactor` has no range validation in `resolveAttack` or `calculateDamage` (`combat.ts` lines 163–168) — spec requires 0.8–1.2. Values of 0, negative, or >1.2 are silently accepted, producing incorrect damage. Missing tests: `randomFactor=0` → damage always 0, `randomFactor=2.0` → damage doubled (out of spec)
- `setTerrain` silently no-ops on out-of-bounds coordinates (`battlefield.ts` lines 40–57)
- `as Unit` casts in `combat.ts` line 192 and `movement.ts` line 193 due to literal-typed stats on unit types

### Medium

- `Date.now()` side effect in `makeEvent` (`turn.ts` line 57) makes function impure
- `getUnitAt` is O(n) scan (`battlefield.ts` lines 100–113) — no position index
- Moving to own position silently accepted as valid move (`movement.ts` lines 134–139)
- `processActions` is ~130 lines (`turn.ts` lines 66–195) — should extract per-action handlers
- `package.json` has `"type": "commonjs"` but imports use ESM-style `.js` extensions

### Low

- `Player.unitIds` diverges from architecture spec's `Player.units: Unit[]` — doc needs update
- `src/ui/display.ts` missing — listed in architecture dependency map
- Unit not verified to be in `bf.units` at start of `canMoveTo`/`executeMove`
- `as const` casts in parser return values are unnecessary

---

## 2. Test Coverage — Key Findings

### Coverage Summary

| Module | Functions | Directly Tested | Estimated Coverage |
|---|---|---|---|
| types.ts | 3 | 3 | ~90% |
| unit.ts | 4 | 4 | ~85% |
| terrain.ts | 6 | 6 | ~95% |
| battlefield.ts | 6 | 6 | ~85% |
| combat.ts | 4 | 0 | ~10% (indirect only) |
| movement.ts | 3 | 3 | ~70% |
| turn.ts | 4 | 4 | ~55% |
| parser.ts | 5 | 5 | ~80% |

**Overall estimated branch coverage: ~55-60%**

### Critical Gaps

- **`tests/engine/combat.test.ts` does not exist** — `calculateDamage`, `hasLineOfSight`, `canAttack`, `resolveAttack` have zero direct tests
- `hasLineOfSight` with hills vs. non-artillery/artillery untested anywhere
- Damage clamping (rawDamage <= 0 → 0) untested directly

### Architecture Rules Not Tested

- Phase transitions (command → movement → combat → resolution) never tested
- "Move OR attack" ordering rule — no test
- "One attack per turn" rule — no test or enforcement in source
- Simultaneous movement conflict ("neither moves") — no test or enforcement
- Draw via simultaneous last-unit kills — not tested end-to-end

### Missing Edge Cases

- `processActions`: empty action list, unit-not-in-map, failed move/attack propagation, multiple actions per call, `[quit, move]` sequence (would expose the continue-not-break bug)
- `canMoveTo`/`executeMove`: only tested with infantry, not armor/artillery
- `parseMove`: negative y coordinate not tested
- `parseAttack`/`parseWait`: extra arguments not tested
- `checkVictory`: when winner already set, single-player game

---

## 3. Architecture Conformance

### Conformance Matrix

| Category | MATCH | DEVIATION | MISSING |
|----------|-------|-----------|---------|
| Type definitions (9 types) | 7 | 2 | 0 |
| Unit stats | 3/3 | 0 | 0 |
| Terrain effects | 5/5 | 0 | 0 |
| Combat rules | 5/6 | 0 | 1 |
| Movement rules | 3/5 | 1 | 1 |
| Turn sequence | 0/2 | 1 | 1 |
| Victory conditions | 3/3 | 0 | 0 |
| Module structure | 4/6 | 0 | 2 |
| Function signatures | 2/3 | 1 | 0 |

### Deviations

- **`Player.unitIds` vs `Player.units`** — code uses string IDs, spec says `Unit[]`. Deliberate; all engine code and tests use `unitIds`
- **`GameState.battlefield` uses structural `unknown` type** — avoids circular dep but breaks type safety
- **`canMoveTo` signature** — drops `from` parameter (reads `unit.position`), returns `Result<true, string>` not `boolean`
- **Turn phase state machine** — `phase` field exists in state but no function cycles through phases; `processActions` handles all action types in one pass

### Missing Implementations

- **One attack per turn** — no per-unit attack tracking; same unit can attack multiple times in one `processActions` call
- **Move-or-attack order** — no prevention of attack-then-move within same action list
- **Simultaneous movement resolution** — spec says "neither moves" when two units target same tile; code errors on the second move sequentially
- **`src/ui/display.ts`** — file does not exist
- **`src/index.ts` wiring** — stub only; imports nothing

### Full Item Checklist

| # | Item | Status |
|---|------|--------|
| 1.1 | `Position` type | MATCH |
| 1.2 | `TurnPhase` type | MATCH |
| 1.3 | `GameEvent` type | MATCH |
| 1.4 | `Player` type | DEVIATION |
| 1.5 | `GameState` type | DEVIATION |
| 1.6 | Unit discriminated unions | MATCH |
| 1.7 | `TerrainType`, `TerrainCell` | MATCH |
| 1.8 | `Battlefield` type | MATCH |
| 1.9 | All Action types | MATCH |
| 2 | Unit stats table | MATCH |
| 3 | Terrain effects table | MATCH |
| 4.1 | Damage formula | MATCH |
| 4.2 | Range check (Manhattan) | MATCH |
| 4.3 | LOS rules | MATCH |
| 4.4 | Minimum damage = 0 | MATCH |
| 4.5 | No friendly fire | MATCH |
| 4.6 | One attack per turn | MISSING |
| 5.1 | Cost-based movement | MATCH |
| 5.2 | No diagonal movement | MATCH |
| 5.3 | No stacking | MATCH |
| 5.4 | Move-or-attack order | MISSING |
| 5.5 | `canMoveTo` signature | DEVIATION |
| 6.1 | Turn phase cycling | DEVIATION |
| 6.2 | Simultaneous movement | MISSING |
| 7.1 | Win condition | MATCH |
| 7.2 | Draw condition | MATCH |
| 7.3 | Quit/surrender | MATCH |
| 8.1 | `src/ui/display.ts` | MISSING |
| 8.2 | `src/index.ts` wiring | MISSING |
| 8.3 | No circular dependencies | MATCH |
| 8.4 | Dependency direction | MATCH |
| 9.1 | `calculateDamage` signature | MATCH |
| 9.2 | `distance` signature | MATCH |
| 9.3 | `canMoveTo` signature | DEVIATION |

---

## Cross-Cutting Issues

These issues were independently identified by multiple audit angles:

1. **Missing combat tests** — flagged by all three auditors as the #1 gap
2. **Turn phase machine not implemented** — architecture defines 4 phases but code doesn't cycle through them
3. **`GameState.battlefield` typing** — causes cascading `unknown` casts and weakens type safety project-wide
4. **`Player.unitIds` vs `Player.units`** — deliberate deviation, but architecture doc needs updating
5. **Parser tests lock in `toLowerCase` bug** — `parser.test.ts` asserts downcased unit IDs as correct, so any fix to `parseCommand` requires simultaneous test updates
6. **`randomFactor` validation gap spans both functions** — neither `calculateDamage` nor `resolveAttack` validates the 0.8–1.2 range; no tests cover out-of-range values
