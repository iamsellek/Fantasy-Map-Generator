export interface Data {
  name: string;
  type: DataType;
  cells: Array<number | undefined>;
  fill: string;
}

export type DataType =
  | 'Invasion'
  | 'Rebels'
  | 'Proselytism'
  | 'Crusade'
  | 'Disease'
  | 'Disaster';
