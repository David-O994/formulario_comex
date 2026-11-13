import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  origen: {
    type: String,
    required: true
  },
  destino: {
    type: String,
    required: true
  },
  tarifas: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  transito: {
    minDias: { type: Number, required: true },
    maxDias: { type: Number, required: true }
  },
  weight: {
    type: Number,
    required: true,
    min: 0.00001
  },
  contenedores: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  valorCarga: {
    type: Number,
    required: false
  },
  description: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model(
  'Quotation',
  quotationSchema,
  'quotations'
);