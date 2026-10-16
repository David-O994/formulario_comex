import express from 'express';
import Quotation from '../models/Quotation.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Autorizar exclusivamente al administrador.
function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'No tienes permisos para consultar todas las cotizaciones'
    });
  }

  next();
}

// Crear cotización: requiere autenticación.
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
      typeof origin !== 'string' ||
      !origin.trim() ||
      typeof destination !== 'string' ||
      !destination.trim() ||
      typeof description !== 'string' ||
      !description.trim() ||
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

    // Convertir kg a toneladas.
    const pesoToneladas = pesoKg / 1000;

    // Un contenedor por cada 25 toneladas, mínimo uno.
    const contenedores = Math.max(
      1,
      Math.ceil(pesoToneladas / 25)
    );

    // Mantener el cálculo actual de costos.
    const baseRateUSD = 1000;
    const totalCostUSD = baseRateUSD + pesoKg * 10;
    const totalCostCLP = totalCostUSD * 950;
    const ivaCLP = totalCostCLP * 0.19;

    const quotation = new Quotation({
      userId: req.user.userId,
      origin: origin.trim(),
      destination: destination.trim(),
      days: Number(days),
      weight: pesoToneladas,
      contenedores,
      description: description.trim(),
      cost: totalCostCLP,
      ivaCLP
    });

    await quotation.save();

    return res.status(201).json({
      message: 'Cotización creada correctamente',
      quotation
    });
  } catch (error) {
    console.error('Error al crear cotización:', error);

    return res.status(500).json({
      error: 'Error al crear cotización'
    });
  }
});

// Historial global: solo administrador.
// Debe declararse antes de la ruta GET '/'.
router.get(
  '/admin/all',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const quotations = await Quotation.find({})
        .populate('userId', 'username')
        .sort({ createdAt: -1 });

      return res.json(quotations);
    } catch (error) {
      console.error('Error al obtener el historial global:', error);

      return res.status(500).json({
        error: 'Error al obtener el historial de cotizaciones'
      });
    }
  }
);

// Listar únicamente las cotizaciones del usuario autenticado.
router.get('/', authMiddleware, async (req, res) => {
  try {
    const quotations = await Quotation.find({
      userId: req.user.userId
    }).sort({ createdAt: -1 });

    return res.json(quotations);
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);

    return res.status(500).json({
      error: 'Error al obtener cotizaciones'
    });
  }
});

export default router;