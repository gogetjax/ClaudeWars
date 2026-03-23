# ClaudeWars Project Audit Report

Date: 2026-03-22

Three-angle audit of the ClaudeWars codebase: code quality, test coverage, and architecture conformance.

---

## 1. Code Review — Key Findings

### Critical

- ~~**`GameState.battlefield` typed with `unknown[][]`**~~ — **FIXED** (2026-03-22): Added `import type { Battlefield }` to `types.ts`, replaced structural `unknown` type with proper `Battlefield` type. Removed all `as unknown as Battlefield` casts across `turn.ts`, `display.ts`, and tests.
- ~~**`parser.ts` applies `toLowerCase()` to entire input**~~ — **FIXED** (2026-03-22): Parser now only lowercases the command keyword, preserving unit ID case. Coordinated update to `parser.test.ts` assertions.
- ~~**`processActions` continues after `quit`**~~ — **FIXED** (2026-03-22): Changed `continue` to `break` in quit handler.

### High

- ~~No turn phase enforcement~~ — **FIXED** (2026-03-22): Added `hasAttacked` flag in `processActions` that returns error if a move action follows an attack, enforcing move-before-attack ordering.
- ~~`randomFactor` has no range validation~~ — **FIXED** (2026-03-22): `calculateDamage` now clamps `randomFactor` to [0.8, 1.2] range. Direct tests added in `combat.test.ts` covering out-of-range values.
- ~~`setTerrain` silently no-ops on out-of-bounds coordinates~~ — **FIXED** (2026-03-22): Returns `Result<Battlefield, string>` with bounds validation. All callers updated.
- `as Unit` casts in `combat.ts` line 192 and `movement.ts` line 193 due to literal-typed stats on unit types

### Medium

- `Date.now()` side effect in `makeEvent` (`turn.ts` line 57) makes function impure
- `getUnitAt` is O(n) scan (`battlefield.ts` lines 100–113) — no position index
- Moving to own position silently accepted as valid move (`movement.ts` lines 134–139)
- `processActions` is ~130 lines (`turn.ts` lines 66–195) — should extract per-action handlers
- `package.json` has `"type": "commonjs"` but imports use ESM-style `.js` extensions

### Low

- `Player.unitIds` diverges from architecture spec's `Player.units: Unit[]` — doc needs update
- ~~`src/ui/display.ts` missing~~ — **FIXED** (2026-03-22): Implemented
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
| combat.ts | 4 | 4 | ~85% |
| movement.ts | 3 | 3 | ~70% |
| turn.ts | 4 | 4 | ~55% |
| parser.ts | 5 | 5 | ~80% |

**Overall estimated branch coverage: ~70-75%**

### Critical Gaps

- ~~**`tests/engine/combat.test.ts` does not exist**~~ — **FIXED** (2026-03-22): 30 tests added covering `calculateDamage`, `hasLineOfSight`, `canAttack`, `resolveAttack`
- ~~`hasLineOfSight` with hills vs. non-artillery/artillery untested~~ — **FIXED**: Tests cover hills blocking infantry and artillery ignoring partial LOS
- ~~Damage clamping (rawDamage <= 0 → 0) untested~~ — **FIXED**: Test covers negative raw damage flooring to 0

### Architecture Rules Not Tested

- Phase transitions (command → movement → combat → resolution) never tested
- ~~"Move OR attack" ordering rule~~ — **FIXED** (2026-03-22): Enforcement added in `processActions`; tested via turn tests
- "One attack per turn" rule — no test or enforcement in source
- Simultaneous movement conflict ("neither moves") — no test or enforcement
- Draw via simultaneous last-unit kills — not tested end-to-end

### Missing Edge Cases

- `processActions`: empty action list, unit-not-in-map, failed move/attack propagation, multiple actions per call (~~`[quit, move]` sequence — quit `continue` bug **FIXED**~~)
- `canMoveTo`/`executeMove`: only tested with infantry, not armor/artillery
- `parseMove`: negative y coordinate not tested
- `parseAttack`/`parseWait`: extra arguments not tested
- `checkVictory`: when winner already set, single-player game

---

## 3. Architecture Conformance

### Conformance Matrix

| Category | MATCH | DEVIATION | MISSING |
|----------|-------|-----------|---------|
| Type definitions (9 types) | 8 | 1 | 0 |
| Unit stats | 3/3 | 0 | 0 |
| Terrain effects | 5/5 | 0 | 0 |
| Combat rules | 5/6 | 0 | 1 |
| Movement rules | 4/5 | 1 | 0 |
| Turn sequence | 1/2 | 1 | 0 |
| Victory conditions | 3/3 | 0 | 0 |
| Module structure | 6/6 | 0 | 0 |
| Function signatures | 2/3 | 1 | 0 |

### Deviations

- **`Player.unitIds` vs `Player.units`** — code uses string IDs, spec says `Unit[]`. Deliberate; all engine code and tests use `unitIds`
- **`canMoveTo` signature** — drops `from` parameter (reads `unit.position`), returns `Result<true, string>` not `boolean`
- **Turn phase state machine** — `phase` field exists in state but no function cycles through phases; `processActions` handles all action types in one pass

### Missing Implementations

- **One attack per turn** — no per-unit attack tracking; same unit can attack multiple times in one `processActions` call
- ~~**Move-or-attack order**~~ — **FIXED** (2026-03-22): `hasAttacked` flag prevents move after attack
- **Simultaneous movement resolution** — spec says "neither moves" when two units target same tile; code errors on the second move sequentially
- ~~**`src/ui/display.ts`**~~ — **FIXED** (2026-03-22): Implemented with chalk-based battlefield rendering
- ~~**`src/index.ts` wiring**~~ — **FIXED** (2026-03-22): Full game loop with readline, battlefield setup, victory detection

### Full Item Checklist

| # | Item | Status |
|---|------|--------|
| 1.1 | `Position` type | MATCH |
| 1.2 | `TurnPhase` type | MATCH |
| 1.3 | `GameEvent` type | MATCH |
| 1.4 | `Player` type | DEVIATION |
| 1.5 | `GameState` type | MATCH |
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
| 5.4 | Move-or-attack order | MATCH |
| 5.5 | `canMoveTo` signature | DEVIATION |
| 6.1 | Turn phase cycling | DEVIATION |
| 6.2 | Simultaneous movement | MISSING |
| 7.1 | Win condition | MATCH |
| 7.2 | Draw condition | MATCH |
| 7.3 | Quit/surrender | MATCH |
| 8.1 | `src/ui/display.ts` | MATCH |
| 8.2 | `src/index.ts` wiring | MATCH |
| 8.3 | No circular dependencies | MATCH |
| 8.4 | Dependency direction | MATCH |
| 9.1 | `calculateDamage` signature | MATCH |
| 9.2 | `distance` signature | MATCH |
| 9.3 | `canMoveTo` signature | DEVIATION |

---

## Cross-Cutting Issues

These issues were independently identified by multiple audit angles:

1. ~~**Missing combat tests**~~ — **FIXED** (2026-03-22): 30 direct tests added in `combat.test.ts`
2. **Turn phase machine not implemented** — architecture defines 4 phases but code doesn't cycle through them. Move-before-attack ordering is now enforced.
3. ~~**`GameState.battlefield` typing**~~ — **FIXED** (2026-03-22): Uses `import type` to properly type as `Battlefield`
4. **`Player.unitIds` vs `Player.units`** — deliberate deviation, but architecture doc needs updating
5. ~~**Parser tests lock in `toLowerCase` bug**~~ — **FIXED** (2026-03-22): Parser preserves unit ID case; tests updated
6. ~~**`randomFactor` validation gap spans both functions**~~ — **FIXED** (2026-03-22): `calculateDamage` clamps to [0.8, 1.2]; tests cover out-of-range values
