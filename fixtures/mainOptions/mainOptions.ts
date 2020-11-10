const makeMainOptionsFixture = (
  overrides?: Partial<MainOptions>
): MainOptions => {
  const defaults: MainOptions = {
    era: '',
    eraShort: '',
    pinNotes: false,
    winds: [],
  };

  return makeFixture(defaults, overrides);
};
