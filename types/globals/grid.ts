import { Vertex } from '../graph';
import { Feature } from '../map';

export interface Grid {
  spacing: number;
  boundary: number[][];
  points: number[][];
  cellsX: number;
  cellsY: number;
  cells: GridCell;
  vertices: Vertex[];
  features: [0, ...Feature[]];
}

// TODO figure out what D3 magic this needs to extend
export interface GridCell {
  temp: Int8Array[];
  prec: Uint8Array[];
}

export type ZeroOrOne = 0 | 1;
