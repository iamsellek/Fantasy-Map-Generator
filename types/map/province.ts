interface Province {
  i: number;
  state: number;
  center: number;
  burg: number;
  name: string;
  formName: ProvinceFormName;
  fullName: string;
  color: string;
}

// TODO figure out how to maybe tie these to state types?
type ProvinceFormName =
  // Monarchy
  | 'County'
  | 'Earldom'
  | 'Shire'
  | 'Landgrave'
  | 'Margrave'
  | 'Barony'
  // Republic
  | 'Province'
  | 'Department'
  | 'Governorate'
  | 'State'
  | 'Canton'
  | 'Prefecture'
  // Theocracy
  | 'Parish'
  | 'Deanery'
  | 'Province'
  | 'Council'
  | 'District'
  // Union
  | 'Province'
  | 'State'
  | 'Canton'
  | 'Republic'
  | 'County'
  // Wild
  | 'Territory'
  | 'Land'
  | 'Province'
  | 'Region'
  | 'Tribe'
  | 'Clan'
  // Horde
  | 'Horde';
