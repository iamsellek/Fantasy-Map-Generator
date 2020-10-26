import { MilitaryIcon } from '../military';

export interface MainOptions {
  era: string;
  eraShort: string;
  military?: OptionsMilitary;
  pinNotes: boolean;
  winds: number[];
  year?: number;
}

export interface OptionsMilitary {
  crew: number;
  icon: MilitaryIcon;
  name: OptionsMilitaryName;
  power: number;
  rural: number;
  separate: number;
  type: OptionsMilitaryType;
  urban: number;
}

export type OptionsMilitaryName = 'archers' | 'cavalry' | 'artillery' | 'fleet';

export type OptionsMilitaryType =
  | 'melee'
  | 'ranged'
  | 'mounted'
  | 'machinery'
  | 'naval';
