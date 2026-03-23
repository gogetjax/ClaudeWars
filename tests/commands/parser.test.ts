import { describe, it, expect } from 'vitest';
import { parseCommand } from '../../src/commands/parser.js';

describe('parseCommand', () => {
  describe('move command', () => {
    it('parses a valid move command', () => {
      const result = parseCommand('move inf1 3 5');
      expect(result).toEqual({
        ok: true,
        value: {
          type: 'move',
          unitId: 'inf1',
          target: { x: 3, y: 5 },
        },
      });
    });

    it('rejects non-numeric coordinates', () => {
      const result = parseCommand('move inf1 abc 5');
      expect(result).toEqual({
        ok: false,
        error: 'Move coordinates must be integers',
      });
    });

    it('rejects negative coordinates', () => {
      const result = parseCommand('move inf1 -1 5');
      expect(result).toEqual({
        ok: false,
        error: 'Move coordinates must be non-negative',
      });
    });

    it('rejects missing arguments', () => {
      const result = parseCommand('move inf1 3');
      expect(result).toEqual({
        ok: false,
        error:
          'Move requires 3 arguments: move <unitId> <x> <y>',
      });
    });

    it('rejects extra arguments', () => {
      const result = parseCommand('move inf1 3 5 extra');
      expect(result).toEqual({
        ok: false,
        error:
          'Move requires 3 arguments: move <unitId> <x> <y>',
      });
    });

    it('parses zero coordinates', () => {
      const result = parseCommand('move inf1 0 0');
      expect(result).toEqual({
        ok: true,
        value: {
          type: 'move',
          unitId: 'inf1',
          target: { x: 0, y: 0 },
        },
      });
    });

    it('rejects float coordinates', () => {
      const result = parseCommand('move inf1 3.5 5');
      expect(result).toEqual({
        ok: false,
        error: 'Move coordinates must be integers',
      });
    });
  });

  describe('attack command', () => {
    it('parses a valid attack command', () => {
      const result = parseCommand('attack arm1 inf2');
      expect(result).toEqual({
        ok: true,
        value: {
          type: 'attack',
          unitId: 'arm1',
          targetUnitId: 'inf2',
        },
      });
    });

    it('rejects missing target', () => {
      const result = parseCommand('attack arm1');
      expect(result).toEqual({
        ok: false,
        error:
          'Attack requires 2 arguments:'
          + ' attack <unitId> <targetUnitId>',
      });
    });
  });

  describe('wait command', () => {
    it('parses a valid wait command', () => {
      const result = parseCommand('wait art1');
      expect(result).toEqual({
        ok: true,
        value: {
          type: 'wait',
          unitId: 'art1',
        },
      });
    });

    it('rejects missing unit', () => {
      const result = parseCommand('wait');
      expect(result).toEqual({
        ok: false,
        error:
          'Wait requires 1 argument: wait <unitId>',
      });
    });
  });

  describe('quit command', () => {
    it('parses a valid quit command', () => {
      const result = parseCommand('quit');
      expect(result).toEqual({
        ok: true,
        value: { type: 'quit' },
      });
    });

    it('rejects quit with arguments', () => {
      const result = parseCommand('quit now');
      expect(result).toEqual({
        ok: false,
        error: 'Quit takes no arguments',
      });
    });
  });

  describe('error handling', () => {
    it('returns error for empty input', () => {
      const result = parseCommand('');
      expect(result).toEqual({
        ok: false,
        error: 'Empty command',
      });
    });

    it('returns error for whitespace-only input', () => {
      const result = parseCommand('   ');
      expect(result).toEqual({
        ok: false,
        error: 'Empty command',
      });
    });

    it('returns error for unknown command', () => {
      const result = parseCommand('fire inf1');
      expect(result).toEqual({
        ok: false,
        error: 'Unknown command: fire',
      });
    });
  });

  describe('input normalization', () => {
    it('handles extra whitespace', () => {
      const result = parseCommand(
        '  move   inf1   3   5  '
      );
      expect(result).toEqual({
        ok: true,
        value: {
          type: 'move',
          unitId: 'inf1',
          target: { x: 3, y: 5 },
        },
      });
    });

    it('is case insensitive for command keyword', () => {
      const result = parseCommand('MOVE INF1 3 5');
      expect(result).toEqual({
        ok: true,
        value: {
          type: 'move',
          unitId: 'INF1',
          target: { x: 3, y: 5 },
        },
      });
    });

    it('preserves unit ID case', () => {
      const result = parseCommand('Attack ARM1 inf2');
      expect(result).toEqual({
        ok: true,
        value: {
          type: 'attack',
          unitId: 'ARM1',
          targetUnitId: 'inf2',
        },
      });
    });
  });
});
