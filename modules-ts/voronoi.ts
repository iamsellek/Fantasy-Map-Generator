function getVoronoi(
  delaunay: Delaunator<ArrayLike<number>>,
  allPoints: number[][],
  pointsLength: number
): Voronoi {
  const cells: VoronoiCells = {
    cellVertices: [],
    adjacentCells: [],
    nearBorderCells: [],
  };
  const vertices: VoronoiVertices = {
    coordinates: [],
    neighboringVertices: [],
    adjacentCells: [],
  };

  for (let e = 0; e < delaunay.triangles.length; e++) {
    const point = delaunay.triangles[nextHalfedge(e)];

    if (point < pointsLength && !cells.adjacentCells[point]) {
      const edges = edgesAroundPoint(e);
      cells.cellVertices[point] = edges.map((edge) => triangleOfEdge(edge)); // cell: adjacent vertex
      cells.adjacentCells[point] = edges
        .map((edge) => delaunay.triangles[edge])
        .filter((cell) => cell < pointsLength); // cell: adjacent valid cells
      cells.nearBorderCells[point] =
        edges.length > cells.adjacentCells[point].length ? 1 : 0; // cell: is border
    }

    const edgeTriangle = triangleOfEdge(e);

    if (!vertices.coordinates[edgeTriangle]) {
      vertices.coordinates[edgeTriangle] = triangleCenter(edgeTriangle); // vertex: coordinates
      vertices.neighboringVertices[edgeTriangle] = trianglesAdjacentToTriangle(
        edgeTriangle
      ); // vertex: adjacent vertices
      vertices.adjacentCells[edgeTriangle] = pointsOfTriangle(edgeTriangle); // vertex: adjacent cells
    }
  }

  function pointsOfTriangle(triangle: number): ThreeNumberArray {
    return edgesOfTriangle(triangle).map(
      (edge) => delaunay.triangles[edge]
    ) as ThreeNumberArray;
  }

  function trianglesAdjacentToTriangle(triangle: number): ThreeNumberArray {
    let triangles: number[] = [];

    for (let edges of edgesOfTriangle(triangle)) {
      let opposite = delaunay.halfedges[edges];
      triangles.push(triangleOfEdge(opposite));
    }

    return triangles as ThreeNumberArray;
  }

  function edgesAroundPoint(start: number): number[] {
    let result = [],
      incoming = start;

    do {
      result.push(incoming);
      const outgoing = nextHalfedge(incoming);
      incoming = delaunay.halfedges[outgoing];
    } while (incoming !== -1 && incoming !== start && result.length < 20);

    return result;
  }

  function triangleCenter(triangle: number): TwoNumberArray {
    let vertices = pointsOfTriangle(triangle).map((point) => allPoints[point]);

    return circumcenter(vertices[0], vertices[1], vertices[2]);
  }

  return { cells, vertices };
}

function edgesOfTriangle(triangle: number): ThreeNumberArray {
  return [3 * triangle, 3 * triangle + 1, 3 * triangle + 2];
}

function triangleOfEdge(edge: number): number {
  return Math.floor(edge / 3);
}

function nextHalfedge(edge: number): number {
  return edge % 3 === 2 ? edge - 2 : edge + 1;
}

function prevHalfedge(edge: number): number {
  return edge % 3 === 0 ? edge + 2 : edge - 1;
}

function circumcenter(a: number[], b: number[], c: number[]): TwoNumberArray {
  let ad = a[0] * a[0] + a[1] * a[1];
  let bd = b[0] * b[0] + b[1] * b[1];
  let cd = c[0] * c[0] + c[1] * c[1];
  let D =
    2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));

  return [
    Math.floor(
      (1 / D) * (ad * (b[1] - c[1]) + bd * (c[1] - a[1]) + cd * (a[1] - b[1]))
    ),
    Math.floor(
      (1 / D) * (ad * (c[0] - b[0]) + bd * (a[0] - c[0]) + cd * (b[0] - a[0]))
    ),
  ];
}
