import { makeFixture } from 'make-fixture';
import { PackCells } from '../../types/globals';

export const makePackCellFixture = (overrides?: PackCells): PackCells => {
  const defaults: PackCells = {
    area: '',
    haven: '',
    harbor: '',
  };

  return makeFixture(defaults, overrides);
};
