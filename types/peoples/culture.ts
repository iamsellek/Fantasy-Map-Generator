export interface BaseCulture {
  base: number;
  i: number;
  name: string;
  origin: number | null;
}

export interface Culture extends BaseCulture {
  center: number;
  color: string;
  type: CultureType;
  expansionism: number;
  code: string;
}

export type CultureType =
  | 'Nomadic'
  | 'Highland'
  | 'Lake'
  | 'Naval'
  | 'River'
  | 'Hunting'
  | 'Generic';
