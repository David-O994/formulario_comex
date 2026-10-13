import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Falta configurar JWT_SECRET en el archivo .env');
}

// Registro
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({
        error: 'Usuario y contraseña son obligatorios'
      });
    }

    // Los usuarios registrados públicamente no pueden asignarse
    // privilegios de administrador.
    const user = new User({
      username,
      password,
      role: 'usuario'
    });

    await user.save();

    res.status(201).json({
      message: 'Usuario creado correctamente'
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error.message);

    res.status(400).json({
      error: 'No se pudo crear el usuario'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales incorrectas'
      });
    }

    const coincide = await bcrypt.compare(password, user.password);

    if (!coincide) {
      return res.status(401).json({
        error: 'Credenciales incorrectas'
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error.message);

    res.status(500).json({
      error: 'Error interno al iniciar sesión'
    });
  }
});

export default router;