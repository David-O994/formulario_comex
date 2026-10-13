import 'dotenv/config';
import express from 'express';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import quotationRoutes from './routes/quotation.js';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());



connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/quotations', quotationRoutes);

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});


app.get('/ping', (req, res) => {
  res.send('pong');
});
