interface MapHistory {
  created: number;
  height: number;
  seed: string;
  template: MapTemplate;
  width: number;
}

type MapTemplate =
  | 'Continents'
  | 'Archipelago'
  | 'High Island'
  | 'Low Island'
  | 'Pangea'
  | 'Shattered'
  | 'Continents'
  | 'Archipelago'
  | 'High Island'
  | 'Low Island'
  | 'Pangea'
  | 'Volcano'
  | 'Mediterranean'
  | 'Peninsula'
  | 'Isthmus'
  | 'Atoll';

type Customization =
  | 0 // no
  | 1 // heightmap draw
  | 2 // states draw
  | 3 // add state/burg
  | 4 // cultures draw
  | 6 // biomes draw
  | 7 // religions manual assignment
  | 8 // add religions
  | 9 // add cultures
  | 10 // zones manual assignment
  | 11 // provinces manual assignment
  | 12 // add provinces
  | 13; // enter customization to avoid unwanted dialog closing

interface MapCoordinates {
  latN?: number;
  latS?: number;
  latT?: number;
  lonE?: number;
  lonT?: number;
  lonW?: number;
}

type Template =
  | 'Pangea'
  | 'Shattered'
  | 'Continents'
  | 'Archipelago'
  | 'High Island'
  | 'Low Island'
  | 'Pangea'
  | 'Volcano'
  | 'Mediterranean'
  | 'Peninsula'
  | 'Isthmus'
  | 'Atoll';
