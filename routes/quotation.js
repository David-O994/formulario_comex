import express from 'express';
import Quotation from '../models/Quotation.js';

const router = express.Router();

// Crear cotización
router.post('/', async (req, res) => {
  try {
    const data = req.body;

    // Ejemplo de cálculo simple (puedes ajustar según reglas de negocio)
    const baseRateUSD = 1000; // tarifa base ficticia
    const totalCostUSD = baseRateUSD + Number(data.weight) * 10;
    const totalCostCLP = totalCostUSD * 950; // conversión ficticia
    const ivaCLP = totalCostCLP * 0.19;

    const quotation = new Quotation({
      ...data,
      totalCostUSD,
      totalCostCLP,
      ivaCLP
    });

    await quotation.save();
    console.log('✅ Cotización guardada:', quotation);

    res.json({ message: 'Cotización creada correctamente', quotation });
  } catch (error) {
    console.error('❌ Error al crear cotización:', error);
    res.status(400).json({ error: 'Error al crear cotización' });
  }
});

// Listar todas las cotizaciones
router.get('/', async (req, res) => {
  try {
    const quotations = await Quotation.find().sort({ createdAt: -1 });
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cotizaciones' });
  }
});

export default router;
