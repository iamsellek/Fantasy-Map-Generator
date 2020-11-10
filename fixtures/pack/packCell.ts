const makePackCellFixture = (overrides?: PackCells): PackCells => {
  const defaults: PackCells = {
    area: '',
    haven: '',
    harbor: '',
  };

  return makeFixture(defaults, overrides);
};
