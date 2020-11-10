interface MainOptions {
  era: string;
  eraShort: string;
  military?: OptionsMilitary;
  pinNotes: boolean;
  winds: number[];
  year?: number;
}

interface OptionsMilitary {
  crew: number;
  icon: MilitaryIcon;
  name: OptionsMilitaryName;
  power: number;
  rural: number;
  separate: number;
  type: OptionsMilitaryType;
  urban: number;
}

type OptionsMilitaryName = 'archers' | 'cavalry' | 'artillery' | 'fleet';

type OptionsMilitaryType =
  | 'melee'
  | 'ranged'
  | 'mounted'
  | 'machinery'
  | 'naval';
