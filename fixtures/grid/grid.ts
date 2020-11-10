const makeGridFixture = (overrides?: Partial<Grid>): Grid => {
  const defaults: Grid = {
    spacing: 0,
    boundary: [],
    points: [],
    cellsX: 0,
    cellsY: 0,
    cells: makeGridCellFixture(),
    vertices: [],
    features: [0],
  };

  return makeFixture(defaults, overrides);
};
