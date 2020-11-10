const makePackFixture = (overrides?: Pack): Pack => {
  const defaults: Pack = {
    cells: makePackCellFixture(),
    vertices: [],
    features: [],
    rivers: [],
    cultures: [],
    burgs: [{}],
    states: [],
    religions: [makeNoReligionFixture()],
    provinces: [0],
  };

  return makeFixture(defaults, overrides);
};
