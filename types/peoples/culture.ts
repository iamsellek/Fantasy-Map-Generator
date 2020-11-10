interface BaseCulture {
  base: number;
  i: number;
  name: string;
  origin: number | null;
}

interface Culture extends BaseCulture {
  center: number;
  color: string;
  type: CultureType;
  expansionism: number;
  code: string;
}

type CultureType =
  | 'Nomadic'
  | 'Highland'
  | 'Lake'
  | 'Naval'
  | 'River'
  | 'Hunting'
  | 'Generic';
