export interface BaseFeature {
  border: boolean;
  cells: number;
  firstCell: number;
  group?: GroupType;
  i?: number;
  land: boolean;
  type?: FeatureType;
}

export interface IslandFeature extends BaseFeature {
  area: number;
  group: IslandGroupType;
  type: 'island';
  vertices: number;
}

export interface OceanFeature extends BaseFeature {
  group: OceanGroupType;
  type: 'ocean';
}

export interface LakeFeature extends BaseFeature {
  area: number;
  group: LakeGroupType;
  type: 'lake';
  vertices: number[];
}

export type FeatureWithType<T extends FeatureType> = T extends 'island'
  ? IslandFeature
  : T extends 'ocean'
  ? OceanFeature
  : T extends 'lake'
  ? LakeFeature
  : undefined;
export type Feature = IslandFeature | OceanFeature | LakeFeature;

export type IslandFeatureType = 'island';
export type WaterFeatureType = 'ocean' | 'lake';
export type FeatureType = IslandFeatureType | WaterFeatureType;

export type IslandGroupType = 'continent' | 'isle' | 'lake_island' | 'island';
export type LakeGroupType =
  | 'dry'
  | 'salt'
  | 'frozen'
  | 'sinkhole'
  | 'lava'
  | 'freshwater';
export type OceanGroupType = 'ocean' | 'sea' | 'gulf';
export type WaterGroupType = OceanGroupType | LakeGroupType;
export type GroupType = IslandGroupType | WaterGroupType;
