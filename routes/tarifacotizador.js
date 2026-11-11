// routes/tarifaCotizador.js
import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import TarifaCotizador from '../models/TarifaCotizador.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST: Cargar Excel y guardar en la nueva tabla
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames.includes('Tarifas Referencia') 
      ? 'Tarifas Referencia' 
      : workbook.SheetNames[0];
      
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    // Mapear los datos al formato exacto requerido
    const registrosFormatted = rawData.map((row) => ({
      origen: row['Puerto Origen'] || '',
      destino: row['Puerto Destino'] || '',
      tarifas: {
        "20": {
          min: Number(row["Tarifa 20' Min (US$)"] || 0),
          max: Number(row["Tarifa 20' Max (US$)"] || 0)
        },
        "40": {
          min: Number(row["Tarifa 40' Min (US$)"] || 0),
          max: Number(row["Tarifa 40' Max (US$)"] || 0)
        }
      },
      transito: {
        minDias: Number(row['Transito Min (dias)'] || 0),
        maxDias: Number(row['Transito Max (dias)'] || 0)
      }
    })).filter(item => item.origen && item.destino);

    // Guardar en la nueva colección (tabla)
    const inserted = await TarifaCotizador.insertMany(registrosFormatted);

    res.status(201).json({ 
      message: 'Tarifas importadas correctamente en la nueva tabla', 
      count: inserted.length,
      data: inserted 
    });
  } catch (error) {
    console.error('Error al procesar el Excel:', error);
    res.status(500).json({ message: 'Error interno al procesar el archivo' });
  }
});

// GET: Obtener todos los registros de esta tabla independiente
router.get('/', async (req, res) => {
  try {
    const tarifas = await TarifaCotizador.find().sort({ createdAt: -1 });
    res.json(tarifas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las tarifas' });
  }
});

export default router;