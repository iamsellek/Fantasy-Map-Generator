export interface BaseReligion {
  i?: number;
  name: string;
}

export interface Religion extends BaseReligion {
  color: string;
  culture: number;
  type?: ReligionType;
  form?: ReligionForm;
  deity: string | null;
  center: number;
  origin: number;
  code: string;
}
export interface FolkReligionType extends Religion {
  type: 'Folk';
  form: FolkForm;
}
export interface OrganizedReligionType extends Religion {
  type: 'Organized';
  form: OrganizedForm;
}
export interface CultReligionType extends Religion {
  type: 'Cult';
  form: CultForm;
}
export interface HeresyReligionType extends Religion {
  type: 'Heresy';
  form: HeresyForm;
}

export type ReligionWithType<T extends ReligionType> = T extends 'Folk'
  ? FolkReligionType
  : T extends 'Organized'
  ? OrganizedReligionType
  : T extends 'Cult'
  ? CultReligionType
  : T extends 'Heresy'
  ? HeresyReligionType
  : undefined;

export interface NoReligion extends Religion {
  i: 0;
  name: 'No religion';
}

export type ReligionType = 'Folk' | 'Organized' | 'Cult' | 'Heresy';

export type FolkForm =
  | 'Shamanism'
  | 'Animism'
  | 'Ancestor worship'
  | 'Polytheism';
export type OrganizedForm =
  | 'Polytheism'
  | 'Dualism'
  | 'Monotheism'
  | 'Non-theism';
export type CultForm = 'Cult' | 'Dark Cult';
export type HeresyForm = 'Heresy';
export type ReligionForm = FolkForm | OrganizedForm | CultForm | HeresyForm;
