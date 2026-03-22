// Terrain types and factory functions

export type TerrainType =
  | 'plains'
  | 'forest'
  | 'hills'
  | 'river'
  | 'urban';

export type TerrainCell = {
  type: TerrainType;
  movementCost: number;
  defenseBonus: number;
  blocksLineOfSight: boolean | 'partial';
};

// Individual terrain factories

export function plains(): TerrainCell {
  return {
    type: 'plains',
    movementCost: 1,
    defenseBonus: 0,
    blocksLineOfSight: false,
  };
}

export function forest(): TerrainCell {
  return {
    type: 'forest',
    movementCost: 2,
    defenseBonus: 2,
    blocksLineOfSight: true,
  };
}

export function hills(): TerrainCell {
  return {
    type: 'hills',
    movementCost: 2,
    defenseBonus: 3,
    blocksLineOfSight: 'partial',
  };
}

export function river(): TerrainCell {
  return {
    type: 'river',
    movementCost: 3,
    defenseBonus: -1,
    blocksLineOfSight: false,
  };
}

export function urban(): TerrainCell {
  return {
    type: 'urban',
    movementCost: 1,
    defenseBonus: 4,
    blocksLineOfSight: true,
  };
}

// Generic terrain factory
export function createTerrain(
  type: TerrainType
): TerrainCell {
  switch (type) {
    case 'plains': return plains();
    case 'forest': return forest();
    case 'hills': return hills();
    case 'river': return river();
    case 'urban': return urban();
  }
}
