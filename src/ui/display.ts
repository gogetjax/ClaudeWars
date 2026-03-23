// Terminal display for ClaudeWars battlefield
// Uses chalk 5.x (ESM-only) via dynamic import.
// All functions are async because chalk must be
// imported dynamically in a CommonJS project.
import { GameState } from '../models/types.js';
import {
  Battlefield,
} from '../models/battlefield.js';
import { Unit } from '../models/unit.js';
import { TerrainCell } from '../models/terrain.js';

/** Dynamically import chalk (ESM module). */
async function getChalk() {
  const { default: chalk } = await import('chalk');
  return chalk;
}

/** Single-char symbol for terrain type. */
function terrainChar(cell: TerrainCell): string {
  switch (cell.type) {
    case 'plains':  return '.';
    case 'forest':  return 'T';
    case 'hills':   return '^';
    case 'river':   return '~';
    case 'urban':   return '#';
  }
}

/** Single-char symbol for unit type. */
function unitChar(unit: Unit): string {
  switch (unit.type) {
    case 'infantry':  return 'I';
    case 'armor':     return 'A';
    case 'artillery': return 'R';
  }
}

/**
 * Render the battlefield grid as a string.
 * Units are shown with colored letters overlaid
 * on the terrain grid.
 */
export async function renderBattlefield(
  state: GameState
): Promise<string> {
  const chalk = await getChalk();
  const bf =
    state.battlefield as unknown as Battlefield;
  const lines: string[] = [];

  // Column header
  const header = '   '
    + Array.from(
        { length: bf.width },
        (_, i) => i.toString().padStart(2)
      ).join('');
  lines.push(header);

  for (let y = 0; y < bf.height; y++) {
    let row = y.toString().padStart(2) + ' ';
    for (let x = 0; x < bf.width; x++) {
      const cell = bf.grid[y][x];
      // Check for a unit at this position
      let found: Unit | null = null;
      for (const u of bf.units.values()) {
        if (
          u.position.x === x
          && u.position.y === y
        ) {
          found = u;
          break;
        }
      }
      if (found) {
        const ch = unitChar(found);
        const colored = found.owner === 'p1'
          ? chalk.blue.bold(ch)
          : chalk.red.bold(ch);
        row += ' ' + colored;
      } else {
        const ch = terrainChar(cell);
        const colored =
          cell.type === 'forest'
            ? chalk.green(ch)
          : cell.type === 'river'
            ? chalk.cyan(ch)
          : cell.type === 'hills'
            ? chalk.yellow(ch)
          : cell.type === 'urban'
            ? chalk.white(ch)
          : chalk.gray(ch);
        row += ' ' + colored;
      }
    }
    lines.push(row);
  }
  return lines.join('\n');
}

/**
 * Render unit status for a given player.
 */
export async function renderUnitStatus(
  state: GameState,
  playerId: string
): Promise<string> {
  const chalk = await getChalk();
  const bf =
    state.battlefield as unknown as Battlefield;
  const player = state.players.find(
    p => p.id === playerId
  );
  if (!player) return 'Player not found';

  const lines: string[] = [
    chalk.bold(`-- ${player.name} Units --`),
  ];

  for (const uid of player.unitIds) {
    const unit = bf.units.get(uid);
    if (!unit) {
      lines.push(`  ${uid}: destroyed`);
      continue;
    }
    const hpBar = `${unit.hp}/${unit.maxHp}`;
    const pos =
      `(${unit.position.x},${unit.position.y})`;
    lines.push(
      `  ${uid} [${unit.type}] ` +
      `HP:${hpBar} ${pos}`
    );
  }
  return lines.join('\n');
}

/**
 * Render the last N game events.
 */
export async function renderEventLog(
  state: GameState,
  count: number = 3
): Promise<string> {
  const chalk = await getChalk();
  if (state.log.length === 0) {
    return chalk.dim('No events yet.');
  }
  const recent = state.log.slice(-count);
  const lines = recent.map(
    e => chalk.dim(`[T${e.turn}] ${e.description}`)
  );
  return lines.join('\n');
}

/**
 * Render the turn header showing whose turn it is.
 */
export async function renderTurnHeader(
  state: GameState
): Promise<string> {
  const chalk = await getChalk();
  const player = state.players[
    state.currentPlayerIndex
  ];
  return chalk.bold.underline(
    `=== Turn ${state.currentTurn} ` +
    `| ${player.name} ===`
  );
}

/**
 * Render the victory/draw screen.
 */
export async function renderVictory(
  state: GameState
): Promise<string> {
  const chalk = await getChalk();
  if (state.winner === 'draw') {
    return chalk.yellow.bold(
      'DRAW! Both sides fell.'
    );
  }
  const winner = state.players.find(
    p => p.id === state.winner
  );
  const name = winner ? winner.name : state.winner;
  return chalk.green.bold(
    `VICTORY! ${name} wins!`
  );
}
