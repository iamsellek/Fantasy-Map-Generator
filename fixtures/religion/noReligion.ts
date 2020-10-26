import { makeFixture } from 'make-fixture';
import { NoReligion } from '../../types/peoples';
import { makeReligionFixture } from './religion';

export const makeNoReligionFixture = (overrides?: NoReligion): NoReligion => {
  const defaults: NoReligion = {
    ...makeReligionFixture(),
    i: 0,
    name: 'No religion',
  };

  return makeFixture(defaults, overrides);
};
