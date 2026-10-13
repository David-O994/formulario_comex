import express from 'express';
import Quotation from '../models/Quotation.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Crear cotización: requiere autenticación
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { origin, destination, weight, description } = req.body;

    if (
      !origin ||
      !destination ||
      !description?.trim() ||
      !Number.isFinite(Number(weight)) ||
      Number(weight) <= 0
    ) {
      return res.status(400).json({
        error: 'Los datos de la cotización no son válidos'
      });
    }

    const baseRateUSD = 1000;
    const totalCostUSD = baseRateUSD + Number(weight) * 10;
    const totalCostCLP = totalCostUSD * 950;
    const ivaCLP = totalCostCLP * 0.19;

    const quotation = new Quotation({
      userId: req.user.userId,
      origin,
      destination,
      weight: Number(weight),
      description: description.trim(),
      cost: totalCostCLP,
      ivaCLP
    });

    await quotation.save();

    res.status(201).json({
      message: 'Cotización creada correctamente',
      quotation
    });
  } catch (error) {
    console.error('Error al crear cotización:', error);

    res.status(500).json({
      error: 'Error al crear cotización'
    });
  }
});

// Listar cotizaciones del usuario autenticado
router.get('/', authMiddleware, async (req, res) => {
  try {
    const quotations = await Quotation.find({
      userId: req.user.userId
    }).sort({ createdAt: -1 });

    res.json(quotations);
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);

    res.status(500).json({
      error: 'Error al obtener cotizaciones'
    });
  }
});

export default router;