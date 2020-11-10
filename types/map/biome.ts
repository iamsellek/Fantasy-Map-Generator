interface Biome {
  biomesMatrix: Uint8Array[];
  color: BiomeColor[];
  cost: number[]; // biome movement cost
  habitability: [0, ...number[]];
  i: [0, ...number[]];
  icons: BiomeIconArray;
  iconsDensity: [0, ...number[]];
  name: BiomeName[];
}

type BiomeIconArray = [{}, ...BiomeIcon[]];

type BiomeColor =
  | '#466eab'
  | '#fbe79f'
  | '#b5b887'
  | '#d2d082'
  | '#c8d68f'
  | '#b6d95d'
  | '#29bc56'
  | '#7dcb35'
  | '#409c43'
  | '#4b6b32'
  | '#96784b'
  | '#d5e7eb'
  | '#0b9131';

type BiomeType =
  | 'dune'
  | 'cactus'
  | 'deadTree'
  | 'acacia'
  | 'grass'
  | 'palm'
  | 'deciduous'
  | 'swamp'
  | 'conifer';

type BiomeIcon = Partial<Record<BiomeType, number>>;

type BiomeName =
  | 'Marine'
  | 'Hot desert'
  | 'Cold desert'
  | 'Savanna'
  | 'Grassland'
  | 'Tropical seasonal forest'
  | 'Temperate deciduous forest'
  | 'Tropical rainforest'
  | 'Temperate rainforest'
  | 'Taiga'
  | 'Tundra'
  | 'Glacier'
  | 'Wetland';
