const bcrypt = require('bcrypt');
const { getPool } = require('../config/database');
const jwtService = require('./jwt.service');

class AuthService {
    async register(data) {
        const pool = getPool(false);

        // Verificar si el email ya existe
        const [existing] = await pool.query(
            'SELECT id FROM usuarios WHERE email = ?',
            [data.email]
        );

        if (existing.length > 0) {
            throw new Error('El email ya está registrado');
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Insertar usuario
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
            [data.nombre, data.email, hashedPassword, data.rol || 'CAPTURISTA']
        );

        return result.insertId;
    }

    async login(email, password) {
        const pool = getPool(true);

        // Buscar usuario
        const [users] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
            [email]
        );

        if (users.length === 0) {
            throw new Error('Credenciales inválidas');
        }

        const user = users[0];

        // Verificar password
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            // Incrementar intentos fallidos
            await pool.query(
                'UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE id = ?',
                [user.id]
            );
            throw new Error('Credenciales inválidas');
        }

        // Resetear intentos fallidos
        await pool.query(
            'UPDATE usuarios SET intentos_fallidos = 0, last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Generar tokens
        const token = jwtService.generateToken(user.id);
        const refreshToken = jwtService.generateRefreshToken(user.id);

        // Crear sesión
        await pool.query(
            'INSERT INTO sesiones (usuario_id, token_jti, refresh_token_jti, is_active) VALUES (?, ?, ?, 1)',
            [user.id, token, refreshToken]
        );

        return {
            token,
            refreshToken,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            }
        };
    }

    async logout(userId, token) {
        const pool = getPool(false);
        await pool.query(
            'UPDATE sesiones SET is_active = 0 WHERE usuario_id = ? AND token_jti = ?',
            [userId, token]
        );
        return true;
    }

    async refreshToken(oldRefreshToken) {
        const decoded = await jwtService.verifyRefreshToken(oldRefreshToken);
        const pool = getPool(true);

        // Verificar sesión
        const [sessions] = await pool.query(
            'SELECT * FROM sesiones WHERE usuario_id = ? AND refresh_token_jti = ? AND is_active = 1',
            [decoded.userId, oldRefreshToken]
        );

        if (sessions.length === 0) {
            throw new Error('Sesión inválida');
        }

        // Generar nuevos tokens
        const newToken = jwtService.generateToken(decoded.userId);
        const newRefreshToken = jwtService.generateRefreshToken(decoded.userId);

        // Actualizar sesión
        await pool.query(
            'UPDATE sesiones SET token_jti = ?, refresh_token_jti = ? WHERE id = ?',
            [newToken, newRefreshToken, sessions[0].id]
        );

        return {
            token: newToken,
            refreshToken: newRefreshToken
        };
    }
}

module.exports = new AuthService();
