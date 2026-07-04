import mongoose, { Schema, Document } from 'mongoose';

export enum LiturgicalMoment {
  ENTRADA = 'ENTRADA',
  ATO_PENITENCIAL = 'ATO_PENITENCIAL',
  SALMO = 'SALMO',
  ACLAMACAO = 'ACLAMACAO',
  OFERTORIO = 'OFERTORIO',
  SANTO = 'SANTO',
  CORDEIRO = 'CORDEIRO',
  COMUNHAO = 'COMUNHÃO',
  FINAL = 'FINAL'
}

export interface ISong extends Document {
  titulo: string;
  tom: string;
  momentoLiturgico: LiturgicalMoment;
  letra: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SongSchema: Schema = new Schema(
  {
    titulo: { type: String, required: true, trim: true },
    tom: { type: String, trim: true },
    momentoLiturgico: { 
      type: String, 
      enum: Object.values(LiturgicalMoment), 
      required: true 
    },
    letra: { type: [String], required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISong>('Song', SongSchema);