interface BaseReligion {
  i?: number;
  name: string;
}

interface Religion extends BaseReligion {
  color: string;
  culture: number;
  type?: ReligionType;
  form?: ReligionForm;
  deity: string | null;
  center: number;
  origin: number;
  code: string;
}
interface FolkReligionType extends Religion {
  type: 'Folk';
  form: FolkForm;
}
interface OrganizedReligionType extends Religion {
  type: 'Organized';
  form: OrganizedForm;
}
interface CultReligionType extends Religion {
  type: 'Cult';
  form: CultForm;
}
interface HeresyReligionType extends Religion {
  type: 'Heresy';
  form: HeresyForm;
}

type ReligionWithType<T extends ReligionType> = T extends 'Folk'
  ? FolkReligionType
  : T extends 'Organized'
  ? OrganizedReligionType
  : T extends 'Cult'
  ? CultReligionType
  : T extends 'Heresy'
  ? HeresyReligionType
  : undefined;

interface NoReligion extends Religion {
  i: 0;
  name: 'No religion';
}

type ReligionType = 'Folk' | 'Organized' | 'Cult' | 'Heresy';

type FolkForm = 'Shamanism' | 'Animism' | 'Ancestor worship' | 'Polytheism';
type OrganizedForm = 'Polytheism' | 'Dualism' | 'Monotheism' | 'Non-theism';
type CultForm = 'Cult' | 'Dark Cult';
type HeresyForm = 'Heresy';
type ReligionForm = FolkForm | OrganizedForm | CultForm | HeresyForm;
