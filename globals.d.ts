import d3 from 'd3';

import { Grid, Pack } from './types/globals';
import { MainOptions } from './types/globals';
import {
  Biome,
  Customization,
  MapCoordinates,
  MapHistory,
  Note,
} from './types/map';

declare global {
  var grid: Grid;
  var graphWidth: number;
  var graphHeight: number;
  var pack: Pack;
  var seed: string;
  var mapId: number | undefined;
  var mapHistory: MapHistory[];
  var elSelected: d3.Selection | undefined;
  var notes: Note[];
  var customization: Customization;
  var biomesData: Biome;
  var options: MainOptions;
  var mapCoordinates: MapCoordinates;
  var mapWidthInput: { value: number };
  var mapHeightInput: { value: number };
}
