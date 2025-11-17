const jwt = require('jsonwebtoken');

class JWTService {

    generateToken(payload) {
        return jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRATION || '24h',
                algorithm: 'HS512' // Algoritmo más seguro
            }
        );
    }

    generateRefreshToken(payload) {
        return jwt.sign(
            payload,
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
                algorithm: 'HS512'
            }
        );
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS512']
            });
        } catch (error) {
            throw new Error('Token inválido');
        }
    }

    verifyRefreshToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
                algorithms: ['HS512']
            });
        } catch (error) {
            throw new Error('Refresh token inválido');
        }
    }
}

module.exports = new JWTService();