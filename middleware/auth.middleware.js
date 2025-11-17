// ============================================
// 📁 middleware/auth.middleware.js - VERIFICAR
// ============================================
const jwtService = require('../services/jwt.service');
const authService = require('../services/auth.service');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token no proporcionado'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verificar token JWT
        const decoded = jwtService.verifyToken(token);

        // Validar que la sesión existe y está activa
        const isValidSession = await authService.validateSession(decoded.jti);

        if (!isValidSession) {
            return res.status(401).json({
                success: false,
                error: 'Sesión inválida o expirada'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Token inválido'
        });
    }
};

module.exports = authMiddleware;