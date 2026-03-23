// ClaudeWars — Military Simulation Game
// Main entry point: sets up battlefield, runs the
// interactive game loop via readline.
import * as readline from 'readline';
import { Action, Player } from './models/types.js';
import {
  createInfantry,
  createArmor,
  createArtillery,
} from './models/unit.js';
import {
  forest,
  hills,
  river,
  urban,
} from './models/terrain.js';
import {
  createBattlefield,
  setTerrain,
  placeUnit,
} from './models/battlefield.js';
import {
  createGameState,
  processActions,
  advanceTurn,
  checkVictory,
} from './engine/turn.js';
import { parseCommand } from './commands/parser.js';
import {
  renderBattlefield,
  renderUnitStatus,
  renderEventLog,
  renderTurnHeader,
  renderVictory,
} from './ui/display.js';

/**
 * Queue-based line reader. Buffers eagerly-emitted
 * readline 'line' events so no input is lost
 * between async awaits (Node.js readline fires all
 * buffered events synchronously on piped stdin).
 */
function createLineReader() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY ?? false,
  });

  const pending: string[] = [];
  const waiting: ((line: string) => void)[] = [];

  rl.on('line', line => {
    const resolve = waiting.shift();
    if (resolve) {
      resolve(line);
    } else {
      pending.push(line);
    }
  });

  rl.on('close', () => {
    for (const resolve of waiting) {
      resolve('');
    }
    waiting.length = 0;
  });

  function ask(prompt: string): Promise<string> {
    process.stdout.write(prompt);
    const queued = pending.shift();
    if (queued !== undefined) {
      return Promise.resolve(queued);
    }
    return new Promise(resolve => {
      waiting.push(resolve);
    });
  }

  return { ask, close: () => rl.close() };
}

/**
 * Build the initial 10x8 battlefield with terrain
 * variety and units for both players.
 */
function setupBattlefield() {
  let bf = createBattlefield(10, 8);

  // Helper to unwrap setTerrain result
  function applyTerrain(
    b: ReturnType<typeof createBattlefield>,
    x: number, y: number,
    t: ReturnType<typeof forest>
  ) {
    const r = setTerrain(b, x, y, t);
    if (!r.ok) throw new Error(r.error);
    return r.value;
  }

  // Forest patch (left-center)
  for (const [x, y] of [[2, 2], [2, 3], [3, 2]]) {
    bf = applyTerrain(bf, x, y, forest());
  }
  // Hills on the right side
  for (const [x, y] of [[7, 1], [8, 1], [8, 2]]) {
    bf = applyTerrain(bf, x, y, hills());
  }
  // River running through the middle (column 5)
  for (let y = 0; y < 8; y++) {
    bf = applyTerrain(bf, 5, y, river());
  }
  // Urban area (center-south)
  for (const [x, y] of [[4, 5], [4, 6], [3, 6]]) {
    bf = applyTerrain(bf, x, y, urban());
  }

  // Player 1 (Blue Force) — left side
  const blueUnits = [
    createInfantry('inf1', 'p1', { x: 0, y: 1 }),
    createInfantry('inf2', 'p1', { x: 1, y: 3 }),
    createArmor('arm1', 'p1', { x: 0, y: 5 }),
    createArtillery('art1', 'p1', { x: 1, y: 7 }),
  ];
  // Player 2 (Red Force) — right side
  const redUnits = [
    createInfantry('inf3', 'p2', { x: 9, y: 1 }),
    createInfantry('inf4', 'p2', { x: 8, y: 3 }),
    createArmor('arm2', 'p2', { x: 9, y: 5 }),
    createArtillery('art2', 'p2', { x: 8, y: 7 }),
  ];

  for (const unit of [...blueUnits, ...redUnits]) {
    const result = placeUnit(bf, unit);
    if (!result.ok) {
      throw new Error(
        `Setup failed: ${result.error}`
      );
    }
    bf = result.value;
  }

  const players: Player[] = [
    {
      id: 'p1',
      name: 'Blue Force',
      unitIds: blueUnits.map(u => u.id),
    },
    {
      id: 'p2',
      name: 'Red Force',
      unitIds: redUnits.map(u => u.id),
    },
  ];

  return createGameState(bf, players);
}

/**
 * Collect commands from the current player until
 * they type "done". Returns parsed actions and a
 * flag indicating if the player wants to quit.
 */
async function collectActions(
  ask: (prompt: string) => Promise<string>,
  playerName: string
): Promise<{ actions: Action[]; quit: boolean }> {
  const actions: Action[] = [];

  while (true) {
    const input = await ask(
      `[${playerName}] Command (or 'done'): `
    );
    const trimmed = input.trim().toLowerCase();
    if (trimmed === 'done') break;

    const result = parseCommand(input);
    if (!result.ok) {
      console.log(`  Error: ${result.error}`);
      continue;
    }

    const action = result.value;
    if (action.type === 'quit') {
      return { actions: [action], quit: true };
    }
    actions.push(action);
  }

  return { actions, quit: false };
}

/**
 * Main game loop. Alternates turns between players
 * until a winner is determined.
 */
async function main() {
  let state = setupBattlefield();
  const { ask, close } = createLineReader();

  console.log('ClaudeWars — Military Simulation');
  console.log('Commands: move <unit> <x> <y>');
  console.log('          attack <unit> <target>');
  console.log('          wait <unit>');
  console.log('          quit\n');

  while (state.winner === null) {
    const player =
      state.players[state.currentPlayerIndex];

    // Display current game state
    console.log(await renderTurnHeader(state));
    console.log(await renderBattlefield(state));
    console.log(await renderUnitStatus(
      state, player.id
    ));
    console.log(await renderEventLog(state, 3));
    console.log('');

    // Collect commands from the current player
    const { actions, quit } = await collectActions(
      ask, player.name
    );

    // Process all collected actions
    const result = processActions(state, actions);
    if (!result.ok) {
      console.log(`  Action error: ${result.error}`);
      // Let the player retry this turn
      continue;
    }
    state = result.value;

    // Check for victory after processing actions
    state = checkVictory(state);
    if (state.winner !== null) break;

    // Advance to next player
    state = advanceTurn(state);
  }

  // Display final state and victory screen
  console.log(await renderBattlefield(state));
  console.log(await renderVictory(state));

  close();
}

main();
