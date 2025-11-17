const jwtService = require('../services/jwt.service');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, error: 'Token no proporcionado' });
        }

        const decoded = await jwtService.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
    }
};

module.exports = authMiddleware;
