// routes/tarifaCotizador.js
import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import TarifaCotizador from '../models/TarifaCotizador.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function parsearTarifas(worksheet) {
  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
  const tarifasPorRuta = new Map();

  for (const [index, row] of rawData.entries()) {
    const clave = typeof row.Clave === 'string' ? row.Clave.trim() : '';
    const partesClave = clave.split('|').map((parte) => parte.trim());
    // La clave canónica evita clasificar mal filas con Puerto Origen inconsistente.
    const origen = partesClave.length === 2 && partesClave.every(Boolean)
      ? partesClave[0]
      : String(row['Puerto Origen'] || '').trim();
    const destino = partesClave.length === 2 && partesClave.every(Boolean)
      ? partesClave[1]
      : String(row['Puerto Destino'] || '').trim();

    if (!origen || !destino) {
      return { error: `La fila ${index + 2} no tiene una ruta de origen y destino válida.` };
    }

    const valoresRaw = [
      row["Tarifa 20' Min (US$)"],
      row["Tarifa 20' Max (US$)"],
      row["Tarifa 40' Min (US$)"],
      row["Tarifa 40' Max (US$)"],
      row['Transito Min (dias)'],
      row['Transito Max (dias)']
    ];
    if (valoresRaw.some((valor) => valor === null || valor === undefined || valor === '')) {
      return { error: `La fila ${index + 2} tiene tarifas o tiempos de tránsito incompletos.` };
    }

    const valores = valoresRaw.map(Number);

    if (
      valores.some((valor) => !Number.isFinite(valor) || valor < 0) ||
      valores[0] > valores[1] ||
      valores[2] > valores[3] ||
      valores[4] > valores[5]
    ) {
      return { error: `La fila ${index + 2} contiene tarifas o tiempos de tránsito inválidos.` };
    }

    const registro = {
      origen,
      destino,
      tarifas: {
        "20": { min: valores[0], max: valores[1] },
        "40": { min: valores[2], max: valores[3] }
      },
      transito: { minDias: valores[4], maxDias: valores[5] }
    };
    const rutaKey = `${origen.toLowerCase()}|${destino.toLowerCase()}`;
    const existente = tarifasPorRuta.get(rutaKey);

    if (
      existente &&
      (
        JSON.stringify(existente.tarifas) !== JSON.stringify(registro.tarifas) ||
        JSON.stringify(existente.transito) !== JSON.stringify(registro.transito)
      )
    ) {
      return {
        error: `La ruta ${origen} → ${destino} tiene tarifas diferentes en más de una fila.`
      };
    }

    tarifasPorRuta.set(rutaKey, registro);
  }

  return { tarifas: Array.from(tarifasPorRuta.values()) };
}

// Reemplazar la tabla con las tarifas de referencia del archivo cargado.
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames.includes('Tarifas Referencia') 
      ? 'Tarifas Referencia' 
      : workbook.SheetNames[0];
      
    const { tarifas, error } = parsearTarifas(workbook.Sheets[sheetName]);
    if (error) {
      return res.status(400).json({ message: error });
    }
    if (!tarifas.length) {
      return res.status(400).json({ message: 'El archivo no contiene tarifas válidas.' });
    }

    await TarifaCotizador.deleteMany({});
    const inserted = await TarifaCotizador.insertMany(tarifas);

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
    const tarifas = await TarifaCotizador.find().sort({ origen: 1, destino: 1 });
    res.json(tarifas);
  } catch (error) {
    console.error('Error al obtener las tarifas:', error);
    res.status(500).json({ message: 'Error al obtener las tarifas' });
  }
});

export default router;