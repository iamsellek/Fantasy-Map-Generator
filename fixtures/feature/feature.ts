const makeFeatureFixture = (overrides?: Partial<BaseFeature>): BaseFeature => {
  const defaults: BaseFeature = {
    border: false,
    cells: 0,
    firstCell: 0,
    land: false,
  };

  return makeFixture(defaults, overrides);
};
