import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  cargoType: { type: String, required: true },
  weight: { type: Number, required: true },
  description: { type: String, required: true },
  fullName: { type: String, required: true },
  company: { type: String },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  contactPreference: { type: String, required: true },
  // Campos calculados
  totalCostUSD: { type: Number },
  totalCostCLP: { type: Number },
  ivaCLP: { type: Number },
  localCosts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Quotation', quotationSchema, 'quotations');
