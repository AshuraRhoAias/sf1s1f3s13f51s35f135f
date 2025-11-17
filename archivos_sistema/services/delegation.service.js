// ============================================
// 📁 services/delegation.service.js
// Servicio para gestión de Delegaciones/Municipios
// ============================================
const BaseService = require('./base/BaseService');
const { getPool } = require('../config/database');
const cache = require('../config/cache');
const { TABLES, VIEWS, CACHE_TTL } = require('../config/constants');

class DelegationService extends BaseService {
    constructor() {
        super(TABLES.DELEGATIONS);
    }

    async getAllDelegations(filters = {}) {
        const cacheKey = `delegations:all:${JSON.stringify(filters)}`;

        return await cache.remember(cacheKey, CACHE_TTL.LISTS, async () => {
            const pool = getPool(true);

            let query = `SELECT * FROM ${VIEWS.DELEGATIONS_SUMMARY}`;
            const params = [];

            if (filters.id_estado) {
                query += ' WHERE estado_codigo = (SELECT codigo FROM ${TABLES.STATES} WHERE id = ?)';
                params.push(filters.id_estado);
            }

            query += ' ORDER BY delegacion ASC';

            const [delegations] = await pool.query(query, params);
            return delegations;
        });
    }

    async getDelegationById(id) {
        return await cache.remember(`delegation:${id}`, CACHE_TTL.LISTS, async () => {
            const pool = getPool(true);

            const [delegations] = await pool.query(`
                SELECT * FROM ${VIEWS.DELEGATIONS_SUMMARY} WHERE id = ?
            `, [id]);

            if (delegations.length === 0) {
                throw new Error('Delegación no encontrada');
            }

            // Obtener colonias
            const [colonies] = await pool.query(`
                SELECT * FROM ${VIEWS.COLONIES_SUMMARY}
                WHERE delegacion = ?
                ORDER BY colonia ASC
            `, [delegations[0].delegacion]);

            return {
                ...delegations[0],
                colonias: colonies
            };
        });
    }

    async createDelegation(data) {
        const pool = getPool(false);

        // Verificar que el estado existe
        const [state] = await pool.query(
            `SELECT id FROM ${TABLES.STATES} WHERE id = ?`,
            [data.id_estado]
        );

        if (state.length === 0) {
            throw new Error('Estado no encontrado');
        }

        // Insertar delegación
        const [result] = await pool.query(
            `INSERT INTO ${TABLES.DELEGATIONS} (id_estado, nombre) VALUES (?, ?)`,
            [data.id_estado, data.nombre]
        );

        cache.invalidatePattern('delegations:');
        cache.invalidatePattern('states:');
        cache.invalidatePattern('dashboard:');

        return {
            id: result.insertId,
            id_estado: data.id_estado,
            nombre: data.nombre
        };
    }

    async updateDelegation(id, data) {
        const pool = getPool(false);

        const [existing] = await pool.query(
            `SELECT * FROM ${TABLES.DELEGATIONS} WHERE id = ?`,
            [id]
        );

        if (existing.length === 0) {
            throw new Error('Delegación no encontrada');
        }

        const updateData = {};
        if (data.id_estado) updateData.id_estado = data.id_estado;
        if (data.nombre) updateData.nombre = data.nombre;
        if (data.activo !== undefined) updateData.activo = data.activo;

        await pool.query(
            `UPDATE ${TABLES.DELEGATIONS} SET ? WHERE id = ?`,
            [updateData, id]
        );

        cache.invalidatePattern('delegations:');
        cache.invalidatePattern('states:');
        cache.invalidatePattern('dashboard:');

        return { id, ...updateData };
    }

    async deleteDelegation(id) {
        const pool = getPool(false);

        await pool.query(
            `UPDATE ${TABLES.DELEGATIONS} SET activo = 0 WHERE id = ?`,
            [id]
        );

        cache.invalidatePattern('delegations:');
        cache.invalidatePattern('states:');
        cache.invalidatePattern('dashboard:');

        return { id, activo: 0 };
    }

    async getDelegationsByState(stateId) {
        const pool = getPool(true);

        const [delegations] = await pool.query(`
            SELECT d.*, COUNT(c.id) as total_colonias
            FROM ${TABLES.DELEGATIONS} d
            LEFT JOIN ${TABLES.COLONIES} c ON d.id = c.id_delegacion AND c.activo = 1
            WHERE d.id_estado = ? AND d.activo = 1
            GROUP BY d.id
            ORDER BY d.nombre ASC
        `, [stateId]);

        return delegations;
    }
}

module.exports = new DelegationService();
