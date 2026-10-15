import express from 'express';
import Quotation from '../models/Quotation.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Crear cotización: requiere autenticación
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      origin,
      destination,
      days,
      weight,
      description
    } = req.body;

    const pesoKg = Number(weight);

    if (
      !origin ||
      !destination ||
      !description?.trim() ||
      weight === undefined ||
      weight === null ||
      weight === '' ||
      !Number.isFinite(pesoKg) ||
      pesoKg <= 0 ||
      days === undefined ||
      days === null ||
      days === '' ||
      !Number.isInteger(Number(days)) ||
      Number(days) < 0
    ) {
      return res.status(400).json({
        error: 'Los datos de la cotización no son válidos'
      });
    }

    // Convertir el peso ingresado de kg a toneladas.
    const pesoToneladas = pesoKg / 1000;

    // Calcular los contenedores: máximo 25 toneladas por contenedor.
    // Siempre se utiliza al menos un contenedor.
    const contenedores = Math.max(
      1,
      Math.ceil(pesoToneladas / 25)
    );

    // Mantener el cálculo de costos actual basado en el peso en kg.
    const baseRateUSD = 1000;
    const totalCostUSD = baseRateUSD + pesoKg * 10;
    const totalCostCLP = totalCostUSD * 950;
    const ivaCLP = totalCostCLP * 0.19;

    const quotation = new Quotation({
      userId: req.user.userId,
      origin,
      destination,
      days: Number(days),
      weight: pesoToneladas,
      contenedores,
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