// models/TarifaCotizador.js
import mongoose from 'mongoose';

const tarifaCotizadorSchema = new mongoose.Schema(
  {
    origen: { type: String, required: true },
    destino: { type: String, required: true },
    tarifas: {
      "20": {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
      },
      "40": {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
      }
    },
    transito: {
      minDias: { type: Number, required: true },
      maxDias: { type: Number, required: true }
    }
  },
  { 
    timestamps: true, // Esto gestiona automáticamente createdAt y updatedAt con ISODate
    collection: 'tarifascotizador' // Nombre explícito para la colección en MongoDB
  }
);

export default mongoose.model('TarifaCotizador', tarifaCotizadorSchema);