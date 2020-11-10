type StateName = 'Neutrals' | string;

interface BaseState {
  i: number;
  name: StateName;
  urban: number;
  rural: number;
  burgs: number;
  area: number;
  cells: number;
  neighbors: number[];
  diplomacy: string[] | string[][];
  provinces: number[];
}

interface NeutralState extends BaseState {
  name: 'Neutrals';
  diplomacy: string[][];
}

interface FullState extends BaseState {
  color: string;
  expansionism: number;
  capital: number;
  type: StateType;
  center: number;
  culture: number;
  urban: number;
  rural: number;
  burgs: number;
  area: number;
  cells: number;
  neighbors: number[];
  campaigns: Campaign[];
  diplomacy: string[];
  form: StateForm;
  formName: StateFormName;
  fullName: string;
  provinces: number[];
  pole: TwoNumberArray;
  alert: number;
  military: Military[];
}

type State = BaseState | FullState;
type StateWithName<T extends StateName> = T extends 'Neutral'
  ? BaseState
  : FullState;

type StateType =
  | 'Generic'
  | 'River'
  | 'Lake'
  | 'Naval'
  | 'Nomadic'
  | 'Hunting'
  | 'Highland';

type StateForm =
  | 'Monarchy'
  | 'Republic'
  | 'Theocracy'
  | 'Union'
  | 'Wild'
  | 'Horde';

// TODO tighten these up (like Features) once it's clearer which StateForm
// each one corresponds to.
type StateFormName =
  // Monarchy?
  | 'Protectorate'
  | 'Sultanate'
  | 'Tsardom'
  | 'Khaganate'
  | 'Shogunate'
  | 'Caliphate'
  | 'Emirate'
  | 'Despotate'
  | 'Ulus'
  | 'Beylik'
  | 'Satrapy'
  | 'Marches'
  | 'Protectorate'
  // Republic
  | 'Free City'
  | 'City-state'
  // Theocracy
  | 'Diocese'
  | 'Eparchy'
  | 'Imamah'
  | 'Caliphate'
  | 'Thearchy'
  | 'See'
  | 'Theocracy';
