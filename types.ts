export interface Graph {
  width: number;
  height: number;
}

export interface Grid {
  boundary: number[][];
  cells: Cells;
  cellsX: number;
  cellsY: number;
  features: Feature[];
  spacing: number;
  points: number[][];
}

export interface Cells {
  b: number[];
  c: number[];
  f: Uint16Array;
  h: number[];
  i: number[];
  t: Int8Array;
}

export interface Feature {
  type: 'lake';
}

export interface MapCoordinates {
  latT: number;
  latN: number;
  latS: number;
  lonT: number;
  lonW: number;
  lonE: number;
}

export type Customization =
  | 'no'
  | 'heightmap draw'
  | 'states draw'
  | 'add state/burg'
  | 'cultures draw';
