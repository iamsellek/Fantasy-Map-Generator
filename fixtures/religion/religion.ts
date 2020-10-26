import { makeFixture } from 'make-fixture';
import { Religion } from '../../types/peoples';

export const makeReligionFixture = (overrides?: Religion): Religion => {
  const defaults: Religion = {
    name: '',
    color: '',
    culture: 0,
    deity: null,
    center: 0,
    origin: 0,
    code: '',
  };

  return makeFixture(defaults, overrides);
};
