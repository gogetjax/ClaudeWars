// Unit discriminated unions — no classes, no inheritance
import { Position } from './types.js';

export type UnitType = 'infantry' | 'armor' | 'artillery';

export type BaseUnit = {
  id: string;
  owner: string;
  position: Position;
  hp: number;
  maxHp: number;
  isAlive: boolean;
};

export type InfantryUnit = BaseUnit & {
  type: 'infantry';
  attack: 4;
  defense: 3;
  range: 1;
  movement: 2;
};

export type ArmorUnit = BaseUnit & {
  type: 'armor';
  attack: 6;
  defense: 5;
  range: 2;
  movement: 3;
};

export type ArtilleryUnit = BaseUnit & {
  type: 'artillery';
  attack: 8;
  defense: 1;
  range: 4;
  movement: 1;
};

export type Unit =
  | InfantryUnit
  | ArmorUnit
  | ArtilleryUnit;

// Factory functions

export function createInfantry(
  id: string,
  owner: string,
  position: Position
): InfantryUnit {
  return {
    id,
    owner,
    position,
    hp: 10,
    maxHp: 10,
    isAlive: true,
    type: 'infantry',
    attack: 4,
    defense: 3,
    range: 1,
    movement: 2,
  };
}

export function createArmor(
  id: string,
  owner: string,
  position: Position
): ArmorUnit {
  return {
    id,
    owner,
    position,
    hp: 15,
    maxHp: 15,
    isAlive: true,
    type: 'armor',
    attack: 6,
    defense: 5,
    range: 2,
    movement: 3,
  };
}

export function createArtillery(
  id: string,
  owner: string,
  position: Position
): ArtilleryUnit {
  return {
    id,
    owner,
    position,
    hp: 8,
    maxHp: 8,
    isAlive: true,
    type: 'artillery',
    attack: 8,
    defense: 1,
    range: 4,
    movement: 1,
  };
}

export function createUnit(
  type: UnitType,
  id: string,
  owner: string,
  position: Position
): Unit {
  switch (type) {
    case 'infantry':
      return createInfantry(id, owner, position);
    case 'armor':
      return createArmor(id, owner, position);
    case 'artillery':
      return createArtillery(id, owner, position);
  }
}
