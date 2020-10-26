export interface Biome {
  biomesMatrix: Uint8Array[];
  color: string[];
  cost: number[];
  habitability: [0, ...number[]];
  i: [0, ...number[]];
  icons: [[], ...BiomeType[]];
  iconsDensity: [0, ...number[]];
  name: BiomeName[];
}

export type BiomeType =
  | 'dune'
  | 'cactus'
  | 'deadTree'
  | 'acacia'
  | 'grass'
  | 'palm'
  | 'deciduous'
  | 'swamp'
  | 'conifer';

export type BiomeName =
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
