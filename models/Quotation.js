import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  days: {
    type: Number,
    required: true
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
  description: {
    type: String,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  ivaCLP: {
    type: Number,
    required: true
  },
  localCosts: {
    type: Number,
    default: 0
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