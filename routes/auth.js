import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Falta configurar JWT_SECRET en el archivo .env');
}

// Autorizar exclusivamente al administrador.
function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'No tienes permisos para realizar esta acción'
    });
  }

  next();
}

// Crear usuarios: solo el administrador autenticado.
router.post(
  '/register',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { username, password } = req.body;

      if (
        typeof username !== 'string' ||
        !username.trim() ||
        typeof password !== 'string' ||
        !password
      ) {
        return res.status(400).json({
          error: 'Usuario y contraseña son obligatorios'
        });
      }

      const nombreUsuario = username.trim();

      const usuarioExistente = await User.findOne({
        username: nombreUsuario
      });

      if (usuarioExistente) {
        return res.status(409).json({
          error: 'Ese nombre de usuario ya existe'
        });
      }

      const user = new User({
        username: nombreUsuario,
        password,
        role: 'usuario'
      });

      await user.save();

      return res.status(201).json({
        message: 'Usuario creado correctamente',
        user: {
          id: user._id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error al registrar usuario:', error);

      if (error.code === 11000) {
        return res.status(409).json({
          error: 'Ese nombre de usuario ya existe'
        });
      }

      return res.status(500).json({
        error: 'No se pudo crear el usuario'
      });
    }
  }
);

// Inicio de sesión.
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !username ||
      !password
    ) {
      return res.status(400).json({
        error: 'Usuario y contraseña son obligatorios'
      });
    }

    const user = await User.findOne({
      username: username.trim()
    });

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

    return res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);

    return res.status(500).json({
      error: 'Error interno al iniciar sesión'
    });
  }
});

export default router;