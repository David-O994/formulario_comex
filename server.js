import 'dotenv/config';
import express from 'express';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import quotationRoutes from './routes/quotation.js';
import tarifaCotizadorRoutes from './routes/tarifacotizador.js';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const projectRoot = dirname(fileURLToPath(import.meta.url));
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/tarifa-cotizador', tarifaCotizadorRoutes);

app.get('/ping', (req, res) => {
  res.send('pong');
});

if (process.env.NODE_ENV === 'production') {
  const distPath = resolve(projectRoot, 'dist');
  app.use(express.static(distPath));
  app.get('/{*path}', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    res.sendFile(resolve(distPath, 'index.html'));
  });
} else {
  const vite = await createViteServer({
    configFile: resolve(projectRoot, 'vite.config.js'),
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);
}

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});