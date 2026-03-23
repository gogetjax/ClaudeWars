import {
  Action,
  Result,
  ok,
  err,
} from '../models/types.js';

/**
 * Parse a raw command string into a typed Action.
 * Returns Result<Action, string> — never throws.
 */
export function parseCommand(
  input: string
): Result<Action, string> {
  const trimmed = input.trim();
  if (trimmed === '') {
    return err('Empty command');
  }

  const parts = trimmed.split(/\s+/);
  const command = parts[0].toLowerCase();

  switch (command) {
    case 'move':
      return parseMove(parts);
    case 'attack':
      return parseAttack(parts);
    case 'wait':
      return parseWait(parts);
    case 'quit':
      return parseQuit(parts);
    default:
      return err(`Unknown command: ${command}`);
  }
}

function parseMove(
  parts: string[]
): Result<Action, string> {
  if (parts.length !== 4) {
    return err(
      'Move requires 3 arguments: move <unitId> <x> <y>'
    );
  }

  const unitId = parts[1];
  const x = Number(parts[2]);
  const y = Number(parts[3]);

  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    return err(
      'Move coordinates must be integers'
    );
  }

  if (x < 0 || y < 0) {
    return err(
      'Move coordinates must be non-negative'
    );
  }

  return ok({
    type: 'move' as const,
    unitId,
    target: { x, y },
  });
}

function parseAttack(
  parts: string[]
): Result<Action, string> {
  if (parts.length !== 3) {
    return err(
      'Attack requires 2 arguments:'
      + ' attack <unitId> <targetUnitId>'
    );
  }

  return ok({
    type: 'attack' as const,
    unitId: parts[1],
    targetUnitId: parts[2],
  });
}

function parseWait(
  parts: string[]
): Result<Action, string> {
  if (parts.length !== 2) {
    return err(
      'Wait requires 1 argument: wait <unitId>'
    );
  }

  return ok({
    type: 'wait' as const,
    unitId: parts[1],
  });
}

function parseQuit(
  parts: string[]
): Result<Action, string> {
  if (parts.length !== 1) {
    return err('Quit takes no arguments');
  }

  return ok({ type: 'quit' as const });
}
