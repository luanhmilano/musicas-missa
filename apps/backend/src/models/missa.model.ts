import mongoose, { Schema, Document } from 'mongoose';
import type { ISong } from './song.model.js';

export interface IMissa extends Document {
  nome: string;
  data: Date;
  repertorio: {
    entrada?: mongoose.Types.ObjectId | ISong;
    atoPenitencial?: mongoose.Types.ObjectId | ISong;
    salmo?: mongoose.Types.ObjectId | ISong;
    aclamacao?: mongoose.Types.ObjectId | ISong;
    ofertorio?: mongoose.Types.ObjectId | ISong;
    santo?: mongoose.Types.ObjectId | ISong;
    cordeiro?: mongoose.Types.ObjectId | ISong;
    comunhao?: mongoose.Types.ObjectId | ISong;
    final?: mongoose.Types.ObjectId | ISong;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MissaSchema: Schema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    data: { type: Date, required: true },
    repertorio: {
      entrada: { type: Schema.Types.ObjectId, ref: 'Song' },
      atoPenitencial: { type: Schema.Types.ObjectId, ref: 'Song' },
      salmo: { type: Schema.Types.ObjectId, ref: 'Song' },
      aclamacao: { type: Schema.Types.ObjectId, ref: 'Song' },
      ofertorio: { type: Schema.Types.ObjectId, ref: 'Song' },
      santo: { type: Schema.Types.ObjectId, ref: 'Song' },
      cordeiro: { type: Schema.Types.ObjectId, ref: 'Song' },
      comunhao: { type: Schema.Types.ObjectId, ref: 'Song' },
      final: { type: Schema.Types.ObjectId, ref: 'Song' }
    }
  },
  { timestamps: true }
);

export default mongoose.model<IMissa>('Missa', MissaSchema);