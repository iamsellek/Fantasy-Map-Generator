export interface Military {
  i: number;
  a: number;
  cell: number;
  x: number;
  y: number;
  bx: number;
  by: number;
  u: Unit;
  n: number;
  name: string;
  state: number;
  icon: MilitaryIcon;
}

export type MilitaryIcon = '⚔️' | '🌊' | '🏹' | '👑';

export interface Unit {
  archers: number;
  cavalry: number;
  infantry: number;
  artillery: number;
}
