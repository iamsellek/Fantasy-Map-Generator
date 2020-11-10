interface VoronoiVertices {
  coordinates: TwoNumberArray[] | [];
  neighboringVertices: ThreeNumberArray[] | [];
  adjacentCells: ThreeNumberArray[] | [];
}

// voronoi cells: v = cell vertices, c = adjacent cells, b = near-border cell
interface VoronoiCells {
  cellVertices: number[][];
  adjacentCells: number[][];
  nearBorderCells: number[];
}

interface Voronoi {
  cells: VoronoiCells;
  vertices: VoronoiVertices;
}
