// ============================================
// 📁 routes/auth.routes.js - AGREGAR RUTA VERIFY
// ============================================
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rateLimiter = require('../middleware/rateLimiter.middleware');

// Rutas públicas
router.post('/register', rateLimiter(5, 15), authController.register);
router.post('/login', rateLimiter(10, 15), authController.login);

// Rutas protegidas
router.get('/verify', authMiddleware, authController.verify); // NUEVA RUTA
router.post('/logout', authMiddleware, authController.logout);
router.post('/logout-all', authMiddleware, authController.logoutAll);
router.post('/refresh', rateLimiter(20, 15), authController.refreshToken);
router.get('/sessions', authMiddleware, authController.getActiveSessions);
router.post('/decrypt-password', authMiddleware, rateLimiter(3, 60), authController.decryptPassword);

module.exports = router;