const { getPool } = require('../config/database');
const encryptionService = require('./encryption.service');
const jwtService = require('./jwt.service');
const crypto = require('crypto');

class AuthService {

    async register(email, password, nombre, ipAddress = null, userAgent = null) {
        const pool = getPool();

        // Encriptar email antes de verificar
        const encryptedEmail = encryptionService.encrypt(email.toLowerCase().trim());

        // Verificar si existe (necesitamos buscar desencriptando)
        const [allUsers] = await pool.query('SELECT id, email FROM usuarios');

        const existingUser = allUsers.find(u => {
            try {
                const decryptedEmail = encryptionService.decrypt(u.email);
                return decryptedEmail === email.toLowerCase().trim();
            } catch {
                return false;
            }
        });

        if (existingUser) {
            throw new Error('El usuario ya existe');
        }

        // Encriptar datos sensibles
        const encryptedNombre = encryptionService.encrypt(nombre);
        const hashedPassword = await encryptionService.hashPasswordHybrid(password);

        // Insertar usuario con datos encriptados
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, created_at) VALUES (?, ?, ?, NOW())',
            [encryptedNombre, encryptedEmail, hashedPassword]
        );

        const userId = result.insertId;

        // Generar JTI únicos para los tokens
        const tokenJti = crypto.randomBytes(32).toString('hex');
        const refreshTokenJti = crypto.randomBytes(32).toString('hex');

        // Generar tokens con JTI
        const payload = {
            id: userId,
            email: email, // En payload va sin encriptar para uso interno
            jti: tokenJti
        };
        const token = jwtService.generateToken(payload);
        const refreshToken = jwtService.generateRefreshToken({
            ...payload,
            jti: refreshTokenJti
        });

        // Registrar sesión
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
        await pool.query(
            `INSERT INTO sesiones 
            (usuario_id, token_jti, refresh_token_jti, ip_address, user_agent, expires_at) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, tokenJti, refreshTokenJti, ipAddress, userAgent, expiresAt]
        );

        return {
            mensaje: 'Usuario registrado exitosamente',
            token,
            refreshToken,
            usuario: {
                id: userId,
                nombre: nombre, // Retornamos sin encriptar
                email: email
            }
        };
    }

    async login(email, password, ipAddress = null, userAgent = null) {
        const pool = getPool();

        // Buscar usuario (necesitamos desencriptar emails)
        const [users] = await pool.query('SELECT id, nombre, email, password FROM usuarios');

        const user = users.find(u => {
            try {
                const decryptedEmail = encryptionService.decrypt(u.email);
                return decryptedEmail === email.toLowerCase().trim();
            } catch {
                return false;
            }
        });

        if (!user) {
            throw new Error('Credenciales inválidas');
        }

        // Verificar password
        const isValid = await encryptionService.verifyPasswordHybrid(
            password,
            user.password
        );

        if (!isValid) {
            throw new Error('Credenciales inválidas');
        }

        // Desencriptar datos para respuesta
        const nombreDesencriptado = encryptionService.decrypt(user.nombre);

        // Generar JTI únicos
        const tokenJti = crypto.randomBytes(32).toString('hex');
        const refreshTokenJti = crypto.randomBytes(32).toString('hex');

        // Generar tokens
        const payload = {
            id: user.id,
            email: email,
            jti: tokenJti
        };
        const token = jwtService.generateToken(payload);
        const refreshToken = jwtService.generateRefreshToken({
            ...payload,
            jti: refreshTokenJti
        });

        // Registrar nueva sesión
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await pool.query(
            `INSERT INTO sesiones 
            (usuario_id, token_jti, refresh_token_jti, ip_address, user_agent, expires_at) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [user.id, tokenJti, refreshTokenJti, ipAddress, userAgent, expiresAt]
        );

        // Actualizar último login
        await pool.query(
            'UPDATE usuarios SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        return {
            mensaje: 'Login exitoso',
            token,
            refreshToken,
            usuario: {
                id: user.id,
                nombre: nombreDesencriptado,
                email: email
            }
        };
    }

    async logout(tokenJti) {
        const pool = getPool();

        // Marcar sesión como inactiva
        await pool.query(
            'UPDATE sesiones SET is_active = FALSE WHERE token_jti = ?',
            [tokenJti]
        );

        return { mensaje: 'Sesión cerrada exitosamente' };
    }

    async logoutAll(userId) {
        const pool = getPool();

        // Cerrar todas las sesiones del usuario
        await pool.query(
            'UPDATE sesiones SET is_active = FALSE WHERE usuario_id = ?',
            [userId]
        );

        return { mensaje: 'Todas las sesiones cerradas' };
    }

    async validateSession(tokenJti) {
        const pool = getPool();

        const [sessions] = await pool.query(
            `SELECT * FROM sesiones 
            WHERE token_jti = ? 
            AND is_active = TRUE 
            AND expires_at > NOW()`,
            [tokenJti]
        );

        return sessions.length > 0;
    }

    async getActiveSessions(userId) {
        const pool = getPool();

        const [sessions] = await pool.query(
            `SELECT id, ip_address, user_agent, created_at, last_activity 
            FROM sesiones 
            WHERE usuario_id = ? 
            AND is_active = TRUE 
            AND expires_at > NOW()
            ORDER BY last_activity DESC`,
            [userId]
        );

        return sessions;
    }

    async refreshToken(oldRefreshToken) {
        const pool = getPool();

        // Verificar y decodificar el refresh token
        const decoded = jwtService.verifyRefreshToken(oldRefreshToken);

        // Validar que la sesión existe y está activa
        const [sessions] = await pool.query(
            `SELECT * FROM sesiones 
            WHERE refresh_token_jti = ? 
            AND is_active = TRUE 
            AND expires_at > NOW()`,
            [decoded.jti]
        );

        if (sessions.length === 0) {
            throw new Error('Sesión inválida o expirada');
        }

        const session = sessions[0];

        // Generar nuevos JTI
        const newTokenJti = crypto.randomBytes(32).toString('hex');
        const newRefreshTokenJti = crypto.randomBytes(32).toString('hex');

        // Generar nuevos tokens
        const payload = {
            id: decoded.id,
            email: decoded.email,
            jti: newTokenJti
        };
        const newToken = jwtService.generateToken(payload);
        const newRefreshToken = jwtService.generateRefreshToken({
            ...payload,
            jti: newRefreshTokenJti
        });

        // Actualizar sesión con nuevos JTI
        await pool.query(
            `UPDATE sesiones 
            SET token_jti = ?, refresh_token_jti = ?, last_activity = NOW()
            WHERE id = ?`,
            [newTokenJti, newRefreshTokenJti, session.id]
        );

        return {
            token: newToken,
            refreshToken: newRefreshToken
        };
    }

    // Limpiar sesiones expiradas (ejecutar periódicamente con cron)
    async cleanExpiredSessions() {
        const pool = getPool();

        const [result] = await pool.query(
            'DELETE FROM sesiones WHERE expires_at < NOW() OR is_active = FALSE'
        );

        return { deletedCount: result.affectedRows };
    }

    // Descifrar datos de usuario (solo para admin con frase maestra)
    async decryptUserData(userId, masterPhrase) {
        const pool = getPool();

        const [users] = await pool.query(
            'SELECT id, nombre, email, password FROM usuarios WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            throw new Error('Usuario no encontrado');
        }

        const user = users[0];

        return {
            userId: user.id,
            nombre: encryptionService.decrypt(user.nombre),
            email: encryptionService.decrypt(user.email),
            decryptedPassword: await encryptionService.decryptPasswordHybrid(
                user.password,
                masterPhrase
            )
        };
    }
}

module.exports = new AuthService();