// ============================================
// 📁 controllers/auth.controller.js - AGREGAR MÉTODOS
// ============================================
const authService = require('../services/auth.service');

class AuthController {

    async register(req, res, next) {
        try {
            const { email, password, nombre } = req.body;

            if (!email || !password || !nombre) {
                return res.status(400).json({
                    error: 'Todos los campos son requeridos'
                });
            }

            const result = await authService.register(
                email,
                password,
                nombre,
                req.ip,
                req.headers['user-agent']
            );

            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    error: 'Email y contraseña requeridos'
                });
            }

            const result = await authService.login(
                email,
                password,
                req.ip,
                req.headers['user-agent']
            );

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    // NUEVO: Verificar token actual
    async verify(req, res, next) {
        try {
            // Si llegó aquí, el middleware ya validó el token
            const { getPool } = require('../config/database');
            const pool = getPool();
            const encryptionService = require('../services/encryption.service');

            const [users] = await pool.query(
                'SELECT id, nombre, email, rol FROM usuarios WHERE id = ?',
                [req.user.id]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuario no encontrado'
                });
            }

            const user = users[0];

            // Descifrar datos
            const nombreDescifrado = encryptionService.decrypt(user.nombre);
            const emailDescifrado = encryptionService.decrypt(user.email);

            res.json({
                success: true,
                data: {
                    id: user.id,
                    nombre: nombreDescifrado,
                    email: emailDescifrado,
                    rol: user.rol
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // NUEVO: Logout
    async logout(req, res, next) {
        try {
            await authService.logout(req.user.jti);
            res.json({
                success: true,
                mensaje: 'Sesión cerrada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    // NUEVO: Logout de todas las sesiones
    async logoutAll(req, res, next) {
        try {
            await authService.logoutAll(req.user.id);
            res.json({
                success: true,
                mensaje: 'Todas las sesiones cerradas'
            });
        } catch (error) {
            next(error);
        }
    }

    // NUEVO: Refrescar token
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    error: 'Refresh token requerido'
                });
            }

            const result = await authService.refreshToken(refreshToken);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    // NUEVO: Obtener sesiones activas
    async getActiveSessions(req, res, next) {
        try {
            const sessions = await authService.getActiveSessions(req.user.id);
            res.json({
                success: true,
                data: sessions
            });
        } catch (error) {
            next(error);
        }
    }

    // Descifrar password con frase maestra
    async decryptPassword(req, res, next) {
        try {
            const { userId, masterPhrase } = req.body;

            if (!userId || !masterPhrase) {
                return res.status(400).json({
                    error: 'Usuario ID y frase maestra requeridos'
                });
            }

            // Verificar que el usuario autenticado tiene permisos (opcional)
            // Solo administradores o el mismo usuario
            if (req.user.id !== parseInt(userId) && req.user.rol !== 'admin') {
                return res.status(403).json({
                    error: 'No tienes permisos para descifrar este password'
                });
            }

            const result = await authService.decryptUserPassword(userId, masterPhrase);

            res.json(result);
        } catch (error) {
            if (error.message === 'Frase maestra incorrecta') {
                return res.status(401).json({ error: error.message });
            }
            next(error);
        }
    }
}

module.exports = new AuthController();