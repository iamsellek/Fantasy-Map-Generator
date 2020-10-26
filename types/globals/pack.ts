import { Vertex } from '../graph';
import { Burg, Feature, Province, River, State } from '../map';
import { Culture, NoReligion, Religion } from '../peoples';

export interface Pack {
  cells: PackCells;
  vertices: Vertex[];
  features: Feature[];
  rivers: River[];
  cultures: Culture[];
  burgs: [{}, ...Burg[]];
  states: State[];
  religions: [NoReligion, ...Religion[]];
  provinces: [0, ...Province[]];
}

// TODO figure out what D3 magic this extends
export interface PackCells {
  area: string;
  haven: string;
  harbor: string;
}
