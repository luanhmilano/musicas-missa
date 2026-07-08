export type LiturgicalMoment =
  | 'ENTRADA'
  | 'ATO_PENITENCIAL'
  | 'SALMO'
  | 'ACLAMACAO'
  | 'OFERTORIO'
  | 'SANTO'
  | 'CORDEIRO'
  | 'COMUNHAO'
  | 'FINAL';

export interface Song {
  _id: string;
  titulo: string;
  tom: string;
  momentoLiturgico: LiturgicalMoment;
  letra: string[];
}

export interface MissaSongRef {
  _id?: string;
  titulo?: string;
  tom?: string;
}

export interface Missa {
  _id: string;
  nome: string;
  data: string;
  repertorio: Record<string, MissaSongRef | string | null | undefined>;
}