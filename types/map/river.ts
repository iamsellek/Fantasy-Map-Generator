interface River {
  i: number;
  parent: number;
  length: number;
  source: number;
  mouth: number;
  basin: number;
  name: string;
  type: RiverType;
}

type RiverType = 'River' | 'Fork' | 'Branch';
