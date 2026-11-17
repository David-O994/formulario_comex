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

// Función auxiliar para obtener el valor actual del dólar desde mindicador.cl
async function obtenerValorDolar() {
  try {
    const respuesta = await fetch('https://mindicador.cl/api/dolar');
    if (!respuesta.ok) throw new Error('No se pudo conectar con mindicador.cl');
    
    const data = await respuesta.json();
    // mindicador.cl retorna un arreglo 'serie' donde el primer elemento [0] es el valor más reciente
    if (data && data.serie && data.serie.length > 0) {
      return data.serie[0].valor;
    }
    return null;
  } catch (error) {
    console.error('Error al obtener la tasa del dólar:', error);
    return null;
  }
}

// Crear cotización: requiere autenticación.
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      origen,
      destino,
      weight,
      valorCarga,
      description,
      contenedores,
      tarifas,
      transito,
      precio
    } = req.body;

    const pesoToneladas = Number(weight);

    if (
      typeof origen !== 'string' ||
      !origen.trim() ||
      typeof destino !== 'string' ||
      !destino.trim() ||
      typeof description !== 'string' ||
      !description.trim() ||
      description.length > 200 ||
      weight === undefined ||
      weight === null ||
      !Number.isFinite(pesoToneladas) ||
      pesoToneladas <= 0 ||
      !contenedores ||
      !tarifas ||
      typeof tarifas.min !== 'number' ||
      typeof tarifas.max !== 'number' ||
      !transito ||
      typeof transito.minDias !== 'number' ||
      typeof transito.maxDias !== 'number'
    ) {
      return res.status(400).json({
        error: 'Los datos de la cotización no son válidos'
      });
    }

    const tieneValorCarga = valorCarga !== undefined && valorCarga !== '' && !isNaN(Number(valorCarga));

    // Obtener la tasa de cambio actual USD -> CLP desde mindicador.cl
    const tasaDolar = await obtenerValorDolar();

    let precioCLPFinal = undefined;
    if (tieneValorCarga && precio && tasaDolar) {
      precioCLPFinal = {
        min: Number(precio.min) * tasaDolar,
        max: Number(precio.max) * tasaDolar
      };
    }

    const quotation = new Quotation({
      userId: req.user.userId,
      origen: origen.trim(),
      destino: destino.trim(),
      weight: pesoToneladas,
      valorCarga: tieneValorCarga ? Number(valorCarga) : undefined,
      precio: tieneValorCarga && precio ? {
        min: Number(precio.min),
        max: Number(precio.max)
      } : undefined,
      precioCLP: precioCLPFinal,
      tasaDolar: tasaDolar || undefined,
      description: description.trim(),
      contenedores: Number(contenedores),
      tarifas: {
        min: Number(tarifas.min),
        max: Number(tarifas.max)
      },
      transito: {
        minDias: Number(transito.minDias),
        maxDias: Number(transito.maxDias)
      }
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
router.get('/mis-cotizaciones', authMiddleware, async (req, res) => {
  try {
    const quotations = await Quotation.find({
      userId: req.user.userId
    }).sort({ createdAt: -1 });

    return res.json(quotations);
  } catch (error) {
    console.error('Error al obtener cotizaciones del usuario:', error);
    return res.status(500).json({
      error: 'Error al obtener el historial'
    });
  }
});

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