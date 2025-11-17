// ============================================
// 📁 server.js - ACTUALIZADO CON RUTAS ELECTORALES
// ============================================
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const electoralRoutes = require('./routes/electoral.routes'); // NUEVA LÍNEA
const { initPool } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3002;

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Optimización para muchos usuarios concurrentes
app.set('trust proxy', 1);

// Inicializar pool de conexiones
initPool();

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API segura con cifrado multicapa',
    version: '1.0.0',
    endpoints: [
      'POST /api/auth/register - Registrar usuario',
      'POST /api/auth/login - Iniciar sesión',
      'GET /api/auth/verify - Verificar token',
      'GET /api/electoral/stats - Estadísticas generales',
      'GET /api/electoral/states - Listar estados',
      'GET /api/electoral/families - Listar familias',
      'GET /api/electoral/persons - Listar personas',
      'GET /api/electoral/search?q=termino - Buscar'
    ]
  });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/electoral', electoralRoutes); // NUEVA LÍNEA

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Errores específicos
  if (err.message.includes('ya existe')) {
    return res.status(409).json({
      success: false,
      error: err.message
    });
  }

  if (err.message.includes('no encontrad')) {
    return res.status(404).json({
      success: false,
      error: err.message
    });
  }

  if (err.message.includes('Credenciales')) {
    return res.status(401).json({
      success: false,
      error: err.message
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`✅ Configurado para manejar alta concurrencia`);
  console.log(`✅ Base de datos: ${process.env.DB_NAME}`);
});

// Optimización para alta concurrencia
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

module.exports = app;