const makeNoReligionFixture = (overrides?: NoReligion): NoReligion => {
  const defaults: NoReligion = {
    ...makeReligionFixture(),
    i: 0,
    name: 'No religion',
  };

  return makeFixture(defaults, overrides);
};
