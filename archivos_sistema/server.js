// ============================================
// 📁 server.js - SERVIDOR PRINCIPAL
// ============================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const electoralRoutes = require('./routes/electoral.routes');
const statesRoutes = require('./routes/states.routes');
const delegationsRoutes = require('./routes/delegations.routes');
const coloniesRoutes = require('./routes/colonies.routes');
const familiesRoutes = require('./routes/families.routes');
const personsRoutes = require('./routes/persons.routes');
const usersRoutes = require('./routes/users.routes');
const reportsRoutes = require('./routes/reports.routes');
const { initPool, closePool } = require('./config/database');
const cache = require('./config/cache');

const app = express();
const PORT = process.env.PORT || 3002;

// ==================== MIDDLEWARES DE SEGURIDAD ====================

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression({ level: 6, threshold: 1024 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== CONFIGURACIONES ====================

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.set('etag', 'strong');

// ==================== INICIALIZACIÓN ====================

initPool();

console.log('✅ Sistema inicializado');
console.log(`✅ Ambiente: ${process.env.NODE_ENV || 'development'}`);
console.log(`✅ Base de datos: ${process.env.DB_NAME}`);

// ==================== RUTAS ====================

app.get('/health', (req, res) => {
    const cacheStats = cache.getStatistics();
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        cache: {
            main: cacheStats.main.keys,
            stats: cacheStats.stats.keys,
            session: cacheStats.session.keys,
            search: cacheStats.search.keys
        },
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        }
    });
});

app.get('/', (req, res) => {
    res.json({
        sistema: 'Sistema Electoral Optimizado v2.0',
        features: [
            'Cifrado de 5 capas',
            'Cache inteligente',
            'Pool optimizado para 200+ usuarios',
            'Soporte para 15M+ registros'
        ],
        endpoints: {
            auth: '/api/auth',
            electoral: '/api/electoral',
            states: '/api/states',
            delegations: '/api/delegations',
            colonies: '/api/colonies',
            families: '/api/families',
            persons: '/api/persons',
            users: '/api/users',
            reports: '/api/reports',
            health: '/health'
        }
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/electoral', electoralRoutes);
app.use('/api/states', statesRoutes);
app.use('/api/delegations', delegationsRoutes);
app.use('/api/colonies', coloniesRoutes);
app.use('/api/families', familiesRoutes);
app.use('/api/persons', personsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);

// Cache stats (solo desarrollo)
if (process.env.NODE_ENV !== 'production') {
    app.get('/api/cache/stats', (req, res) => {
        res.json(cache.getStatistics());
    });

    app.post('/api/cache/flush', (req, res) => {
        cache.flush();
        res.json({ success: true, message: 'Cache limpiado' });
    });
}

// ==================== MANEJO DE ERRORES ====================

app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.message?.includes('ya existe')) {
        return res.status(409).json({ success: false, error: err.message });
    }

    if (err.message?.includes('no encontrad')) {
        return res.status(404).json({ success: false, error: err.message });
    }

    if (err.message?.includes('Credenciales')) {
        return res.status(401).json({ success: false, error: err.message });
    }

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

// ==================== INICIO DEL SERVIDOR ====================

const server = app.listen(PORT, () => {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('⚡ Optimizaciones activas:');
    console.log('   • Pool de conexiones: 100 escritura / 150 lectura');
    console.log('   • Cache en memoria con TTL inteligente');
    console.log('   • Compresión gzip habilitada');
    console.log('');
    console.log('🔗 Endpoints:');
    console.log(`   • http://localhost:${PORT}`);
    console.log(`   • http://localhost:${PORT}/health`);
    console.log('');
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// ==================== MANEJO DE CIERRE GRACEFUL ====================

const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} recibido, cerrando servidor...`);

    server.close(async () => {
        console.log('✓ Servidor HTTP cerrado');

        try {
            await closePool();
            console.log('✓ Pools de BD cerrados');

            cache.flush();
            console.log('✓ Cache limpiado');

            console.log('✓ Cierre completo');
            process.exit(0);
        } catch (error) {
            console.error('Error en cierre:', error);
            process.exit(1);
        }
    });

    setTimeout(() => {
        console.error('Forzando cierre...');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
    console.error('Excepción no capturada:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada no manejada:', reason);
    gracefulShutdown('unhandledRejection');
});

module.exports = app;
