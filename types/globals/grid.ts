import { Feature } from '../map';
import { VoronoiCells, VoronoiVertices } from '../voronoi';
import { ThreeNumberArray } from './';

export interface Grid {
  spacing: number;
  boundary: number[][];
  points: number[][];
  cellsX: number;
  cellsY: number;
  cells: GridCell;
  vertices: VoronoiVertices;
  features: [0, ...Feature[]];
}

export interface GridCell extends VoronoiCells {
  temps: Int8Array;
  precipitation: Uint8Array | number[][];
  i: Uint16Array | Uint32Array;
  heights: Uint8Array;
  features: Uint16Array;
  types: Int8Array;
  borders: number[];
  gridCellInitial: Uint16Array | Uint32Array;
  rivers: Uint16Array;
  biomes: Uint8Array;
  quadtree: d3.Quadtree<ThreeNumberArray>;
  area: Uint16Array;
}

export type ZeroOrOne = 0 | 1;

export type OneOrNegativeOne = 1 | -1;
