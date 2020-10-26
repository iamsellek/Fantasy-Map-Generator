import { makeFixture } from 'make-fixture';
import { GridCell } from '../../types/globals';

export const makeGridCellFixture = (
  overrides?: Partial<GridCell>
): GridCell => {
  const defaults: GridCell = {
    temp: [new Int8Array(0)],
    prec: [new Uint8Array(0)],
  };

  return makeFixture(defaults, overrides);
};
