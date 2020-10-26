export interface River {
  i: number;
  parent: number;
  length: number;
  source: number;
  mouth: number;
  basin: number;
  name: string;
  type: RiverType;
}

export type RiverType = 'River' | 'Fork' | 'Branch';
