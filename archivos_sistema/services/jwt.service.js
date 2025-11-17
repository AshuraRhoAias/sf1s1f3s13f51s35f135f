const jwt = require('jsonwebtoken');
const { getPool } = require('../config/database');

class JWTService {
    generateToken(userId) {
        return jwt.sign({ userId }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION || '24h'
        });
    }

    generateRefreshToken(userId) {
        return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d'
        });
    }

    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const pool = getPool(true);
            const [sessions] = await pool.query(
                'SELECT * FROM sesiones WHERE usuario_id = ? AND is_active = 1',
                [decoded.userId]
            );
            if (sessions.length === 0) {
                throw new Error('Sesión inválida');
            }
            return decoded;
        } catch (error) {
            throw new Error('Token inválido o expirado');
        }
    }

    async verifyRefreshToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            throw new Error('Refresh token inválido');
        }
    }
}

module.exports = new JWTService();
