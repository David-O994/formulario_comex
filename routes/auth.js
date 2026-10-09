import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Registro
router.post('/register', async (req, res) => {
    console.log('📥 Datos recibidos para registro:', req.body); // 👈 log en consola
  const { username, password, role } = req.body;
  try {
    const user = new User({ username, password, role });
    await user.save();
    console.log('✅ Usuario guardado en MongoDB:', user); // 👈 log en consola
    res.json({ message: 'Usuario creado correctamente' });
  } catch (error) {
    console.error('❌ Error al crear usuario:', error); // 👈 log de error
    res.status(400).json({ error: 'Error al crear usuario' });
  }
});


// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Contraseña incorrecta' });

  res.json({ message: 'Login exitoso', role: user.role });
});

export default router;
