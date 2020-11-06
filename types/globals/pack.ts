import { Burg, Feature, Province, River, State } from '../map';
import { Culture, NoReligion, Religion } from '../peoples';
import { GridCell } from './grid';
import { VoronoiVertices } from '../voronoi';

export interface Pack {
  cells: PackCell;
  boundary: number[][];
  vertices: VoronoiVertices;
  features: [0, ...Feature[]];
  rivers: River[];
  cultures: Culture[];
  burgs: [{}, ...Burg[]];
  states: State[];
  religions: [NoReligion, ...Religion[]];
  provinces: [0, ...Province[]];
}

interface PackCell extends GridCell {
  havens: Uint16Array | Uint32Array;
  harbors: Uint8Array;
  burgs: number[];
  flux: number[];
  suitability: Int16Array;
  population: Float32Array;
  confluences: number[];
  cultures: number[];
  roads: number[];
  crossroads: number[];
  states: number[];
  religions: number[];
}
