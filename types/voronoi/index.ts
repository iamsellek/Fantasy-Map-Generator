import { ThreeNumberArray, TwoNumberArray } from '../globals';

// cells vertices: p = vertex coordinates, v = neighboring vertices, c = adjacent cells
export interface VoronoiVertices {
  coordinates: TwoNumberArray[] | [];
  neighboringVertices: ThreeNumberArray[] | [];
  adjacentCells: ThreeNumberArray[] | [];
}

// voronoi cells: v = cell vertices, c = adjacent cells, b = near-border cell
export interface VoronoiCells {
  cellVertices: number[][];
  adjacentCells: number[][];
  nearBorderCells: number[];
}

export interface Voronoi {
  cells: VoronoiCells;
  vertices: VoronoiVertices;
}
