import { makeFixture } from 'make-fixture';
import { Pack } from '../../types/globals';
import { makeNoReligionFixture } from '../religion/noReligion';
import { makePackCellFixture } from './packCell';

export const makePackFixture = (overrides?: Pack): Pack => {
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
