// Turn manager — sequences game phases, processes
// player actions, checks victory. Pure functions only.
import {
  GameState,
  Player,
  Action,
  GameEvent,
  Result,
  ok,
  err,
} from '../models/types.js';
import type { Battlefield } from '../models/battlefield.js';
import { removeUnit } from '../models/battlefield.js';
import { resolveAttack } from './combat.js';
import { executeMove } from './movement.js';

/**
 * Create initial game state from a battlefield
 * and list of players.
 */
export function createGameState(
  battlefield: Battlefield,
  players: Player[]
): GameState {
  return {
    battlefield,
    players,
    currentTurn: 1,
    currentPlayerIndex: 0,
    phase: 'command',
    log: [],
    winner: null,
  };
}

/**
 * Get the current player from game state.
 */
function currentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

/**
 * Create a game event for the current state.
 */
function makeEvent(
  state: GameState,
  description: string
): GameEvent {
  return {
    turn: state.currentTurn,
    player: currentPlayer(state).id,
    description,
    timestamp: Date.now(),
  };
}

/**
 * Process a list of actions for the current player.
 * Validates ownership, executes each action, returns
 * updated state or error.
 */
export function processActions(
  state: GameState,
  actions: Action[]
): Result<GameState, string> {
  const player = currentPlayer(state);
  let bf = state.battlefield;
  let players = state.players;
  let log = [...state.log];
  let winner = state.winner;

  let hasAttacked = false;

  for (const action of actions) {
    // Quit needs no unit validation
    if (action.type === 'quit') {
      const otherPlayer = state.players.find(
        p => p.id !== player.id
      );
      winner = otherPlayer
        ? otherPlayer.id
        : 'draw';
      log.push(makeEvent(
        state,
        `${player.name} surrendered`
      ));
      break;
    }

    // Enforce move-before-attack ordering
    if (action.type === 'move' && hasAttacked) {
      return err('Cannot move after attacking');
    }
    if (action.type === 'attack') {
      hasAttacked = true;
    }

    // Validate unit belongs to current player
    if (!player.unitIds.includes(action.unitId)) {
      return err(
        `Unit ${action.unitId} does not belong ` +
        `to player ${player.id}`
      );
    }

    switch (action.type) {
      case 'move': {
        const unit = bf.units.get(action.unitId);
        if (!unit) {
          return err(
            `Unit ${action.unitId} not found`
          );
        }
        const moveResult = executeMove(
          unit, action.target, bf
        );
        if (!moveResult.ok) {
          return err(moveResult.error);
        }
        bf = moveResult.value;
        log.push(makeEvent(
          state,
          `${action.unitId} moved to ` +
          `(${action.target.x}, ${action.target.y})`
        ));
        break;
      }

      case 'attack': {
        const attacker = bf.units.get(action.unitId);
        if (!attacker) {
          return err(
            `Attacker ${action.unitId} not found`
          );
        }
        const defender = bf.units.get(
          action.targetUnitId
        );
        if (!defender) {
          return err(
            `Defender ${action.targetUnitId} ` +
            `not found`
          );
        }
        const atkResult = resolveAttack(
          attacker, defender, bf
        );
        if (!atkResult.ok) {
          return err(atkResult.error);
        }
        const { defender: updated, damage } =
          atkResult.value;
        // Update the defender in the battlefield
        const newUnits = new Map(bf.units);
        if (!updated.isAlive) {
          newUnits.delete(updated.id);
          // Remove from owning player's unitIds
          players = players.map(p =>
            p.unitIds.includes(updated.id)
              ? {
                  ...p,
                  unitIds: p.unitIds.filter(
                    uid => uid !== updated.id
                  ),
                }
              : p
          );
        } else {
          newUnits.set(updated.id, updated);
        }
        bf = { ...bf, units: newUnits };
        log.push(makeEvent(
          state,
          `${action.unitId} attacked ` +
          `${action.targetUnitId} for ` +
          `${damage} damage` +
          (updated.isAlive
            ? ''
            : ` (${action.targetUnitId} destroyed)`)
        ));
        break;
      }

      case 'wait': {
        log.push(makeEvent(
          state,
          `${action.unitId} waited`
        ));
        break;
      }
    }
  }

  return ok({
    ...state,
    battlefield: bf,
    players,
    log,
    winner,
  });
}

/**
 * Advance to the next player's turn. Increments
 * currentTurn when wrapping back to player 0.
 */
export function advanceTurn(
  state: GameState
): GameState {
  const nextIndex =
    (state.currentPlayerIndex + 1)
    % state.players.length;
  const nextTurn = nextIndex === 0
    ? state.currentTurn + 1
    : state.currentTurn;
  return {
    ...state,
    currentPlayerIndex: nextIndex,
    currentTurn: nextTurn,
    phase: 'command',
  };
}

/**
 * Check victory conditions. Sets winner when only
 * one player (or none) has alive units remaining.
 */
export function checkVictory(
  state: GameState
): GameState {
  const bf = state.battlefield;

  const playersWithAlive = state.players.filter(
    p => p.unitIds.some(uid => {
      const unit = bf.units.get(uid);
      return unit !== undefined && unit.isAlive;
    })
  );

  if (playersWithAlive.length === 1) {
    return {
      ...state,
      winner: playersWithAlive[0].id,
    };
  }

  if (playersWithAlive.length === 0) {
    return {
      ...state,
      winner: 'draw',
    };
  }

  return state;
}
