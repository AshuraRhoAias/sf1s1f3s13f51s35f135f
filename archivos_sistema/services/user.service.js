// ============================================
// 📁 services/user.service.js
// Servicio para gestión de Usuarios
// ============================================
const BaseService = require('./base/BaseService');
const bcrypt = require('bcrypt');
const { getPool } = require('../config/database');
const cache = require('../config/cache');
const { TABLES } = require('../config/constants');

class UserService extends BaseService {
    constructor() {
        super(TABLES.USERS);
    }

    async getAllUsers() {
        const pool = getPool(true);

        const [users] = await pool.query(`
            SELECT id, nombre, email, rol, activo, created_at, last_login
            FROM ${TABLES.USERS}
            WHERE activo = 1
            ORDER BY created_at DESC
        `);

        return users;
    }

    async getUserById(id) {
        const pool = getPool(true);

        const [users] = await pool.query(`
            SELECT id, nombre, email, rol, activo, created_at, last_login, telefono, puesto
            FROM ${TABLES.USERS}
            WHERE id = ?
        `, [id]);

        if (users.length === 0) {
            throw new Error('Usuario no encontrado');
        }

        return users[0];
    }

    async createUser(data) {
        const pool = getPool(false);

        // Verificar si el email ya existe
        const [existing] = await pool.query(
            `SELECT id FROM ${TABLES.USERS} WHERE email = ?`,
            [data.email]
        );

        if (existing.length > 0) {
            throw new Error('El email ya está registrado');
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(data.password, 12);

        const [result] = await pool.query(
            `INSERT INTO ${TABLES.USERS} (nombre, email, password, rol, telefono, puesto)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                data.nombre,
                data.email,
                hashedPassword,
                data.rol || 'CAPTURISTA',
                data.telefono || null,
                data.puesto || null
            ]
        );

        cache.invalidatePattern('users:');

        return {
            id: result.insertId,
            nombre: data.nombre,
            email: data.email,
            rol: data.rol || 'CAPTURISTA'
        };
    }

    async updateUser(id, data) {
        const pool = getPool(false);

        const [existing] = await pool.query(
            `SELECT * FROM ${TABLES.USERS} WHERE id = ?`,
            [id]
        );

        if (existing.length === 0) {
            throw new Error('Usuario no encontrado');
        }

        const updateData = {};

        if (data.nombre) updateData.nombre = data.nombre;
        if (data.email) {
            // Verificar que el email no exista
            const [duplicate] = await pool.query(
                `SELECT id FROM ${TABLES.USERS} WHERE email = ? AND id != ?`,
                [data.email, id]
            );

            if (duplicate.length > 0) {
                throw new Error('El email ya está registrado');
            }

            updateData.email = data.email;
        }
        if (data.rol) updateData.rol = data.rol;
        if (data.telefono !== undefined) updateData.telefono = data.telefono;
        if (data.puesto !== undefined) updateData.puesto = data.puesto;
        if (data.activo !== undefined) updateData.activo = data.activo;

        // Si se actualiza la contraseña
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 12);
        }

        await pool.query(
            `UPDATE ${TABLES.USERS} SET ? WHERE id = ?`,
            [updateData, id]
        );

        cache.invalidatePattern('users:');

        return { id, ...updateData };
    }

    async deleteUser(id) {
        const pool = getPool(false);

        // No permitir eliminar el último admin
        const [admins] = await pool.query(
            `SELECT COUNT(*) as total FROM ${TABLES.USERS}
             WHERE rol = 'ADMIN' AND activo = 1`
        );

        const [user] = await pool.query(
            `SELECT rol FROM ${TABLES.USERS} WHERE id = ?`,
            [id]
        );

        if (user.length > 0 && user[0].rol === 'ADMIN' && admins[0].total <= 1) {
            throw new Error('No se puede eliminar el último administrador');
        }

        await pool.query(
            `UPDATE ${TABLES.USERS} SET activo = 0 WHERE id = ?`,
            [id]
        );

        cache.invalidatePattern('users:');

        return { id, activo: 0 };
    }

    async changePassword(id, oldPassword, newPassword) {
        const pool = getPool(false);

        const [users] = await pool.query(
            `SELECT password FROM ${TABLES.USERS} WHERE id = ?`,
            [id]
        );

        if (users.length === 0) {
            throw new Error('Usuario no encontrado');
        }

        // Verificar contraseña actual
        const valid = await bcrypt.compare(oldPassword, users[0].password);
        if (!valid) {
            throw new Error('Contraseña actual incorrecta');
        }

        // Actualizar contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await pool.query(
            `UPDATE ${TABLES.USERS} SET password = ? WHERE id = ?`,
            [hashedPassword, id]
        );

        return { success: true };
    }

    async getUserActivity(id) {
        const pool = getPool(true);

        const [activity] = await pool.query(`
            SELECT accion, tabla_afectada, id_registro_afectado, created_at, detalles
            FROM ${TABLES.AUDIT}
            WHERE id_usuario = ?
            ORDER BY created_at DESC
            LIMIT 100
        `, [id]);

        return activity;
    }

    async getUserStats(id) {
        const pool = getPool(true);

        const [stats] = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM ${TABLES.FAMILIES} WHERE id_registro = ?) as familias_creadas,
                (SELECT COUNT(*) FROM ${TABLES.PERSONS} WHERE id_registro = ?) as personas_creadas,
                (SELECT COUNT(*) FROM ${TABLES.AUDIT} WHERE id_usuario = ? AND accion = 'CREAR') as total_creaciones,
                (SELECT COUNT(*) FROM ${TABLES.AUDIT} WHERE id_usuario = ? AND accion = 'EDITAR') as total_ediciones,
                (SELECT MAX(created_at) FROM ${TABLES.AUDIT} WHERE id_usuario = ?) as ultima_actividad
        `, [id, id, id, id, id]);

        return stats[0];
    }
}

module.exports = new UserService();
