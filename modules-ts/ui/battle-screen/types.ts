export interface Army {
  regiments: [];
  distances: [];
  morale: number; // between 0-100, inclusive
  casualties: number;
  power: number;
  phase: Phase;
  die: number;
  x: number;
  y: number;
}

export type Phase =
  | 'nothing'
  | 'skirmish'
  | 'melee'
  | 'pursue'
  | 'retreat'
  | 'boarding'
  | 'shelling'
  | 'chase'
  | 'withdrawal'
  | 'blockade'
  | 'sheltering'
  | 'sortie'
  | 'bombardment'
  | 'storming'
  | 'defense'
  | 'looting'
  | 'surrendering'
  | 'surprise'
  | 'shock'
  | 'landing'
  | 'flee'
  | 'waiting'
  | 'maneuvering'
  | 'dogfight';
