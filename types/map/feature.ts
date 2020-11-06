export interface Feature {
  border: boolean;
  cells?: number;
  firstCell?: number;
  group?: GroupType;
  i?: number;
  land: boolean;
  type: FeatureType;
  area?: number;
  vertices?: number[];
}

export type FeatureType = 'island' | 'ocean' | 'lake';

export type GroupType =
  | 'continent'
  | 'isle'
  | 'lake_island'
  | 'island'
  | 'dry'
  | 'salt'
  | 'frozen'
  | 'sinkhole'
  | 'lava'
  | 'freshwater'
  | 'ocean'
  | 'sea'
  | 'gulf';
