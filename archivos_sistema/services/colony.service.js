// ============================================
// 📁 services/colony.service.js
// Servicio para gestión de Colonias
// ============================================
const BaseService = require('./base/BaseService');
const { getPool } = require('../config/database');
const cache = require('../config/cache');
const { TABLES, VIEWS, CACHE_TTL } = require('../config/constants');

class ColonyService extends BaseService {
    constructor() {
        super(TABLES.COLONIES);
    }

    async getAllColonies(filters = {}) {
        const cacheKey = `colonies:all:${JSON.stringify(filters)}`;

        return await cache.remember(cacheKey, CACHE_TTL.LISTS, async () => {
            const pool = getPool(true);

            let query = `SELECT * FROM ${VIEWS.COLONIES_SUMMARY}`;
            const params = [];

            if (filters.id_delegacion) {
                query += ' WHERE id IN (SELECT id FROM ${TABLES.COLONIES} WHERE id_delegacion = ?)';
                params.push(filters.id_delegacion);
            }

            query += ' ORDER BY colonia ASC';

            const [colonies] = await pool.query(query, params);
            return colonies;
        });
    }

    async getColonyById(id) {
        return await cache.remember(`colony:${id}`, CACHE_TTL.LISTS, async () => {
            const pool = getPool(true);

            const [colonies] = await pool.query(`
                SELECT * FROM ${VIEWS.COLONIES_SUMMARY} WHERE id = ?
            `, [id]);

            if (colonies.length === 0) {
                throw new Error('Colonia no encontrada');
            }

            return colonies[0];
        });
    }

    async createColony(data) {
        const pool = getPool(false);

        const [delegation] = await pool.query(
            `SELECT id FROM ${TABLES.DELEGATIONS} WHERE id = ?`,
            [data.id_delegacion]
        );

        if (delegation.length === 0) {
            throw new Error('Delegación no encontrada');
        }

        const [result] = await pool.query(
            `INSERT INTO ${TABLES.COLONIES} (id_delegacion, nombre, codigo_postal) VALUES (?, ?, ?)`,
            [data.id_delegacion, data.nombre, data.codigo_postal || null]
        );

        cache.invalidatePattern('colonies:');
        cache.invalidatePattern('delegations:');

        return {
            id: result.insertId,
            id_delegacion: data.id_delegacion,
            nombre: data.nombre,
            codigo_postal: data.codigo_postal
        };
    }

    async updateColony(id, data) {
        const pool = getPool(false);

        const [existing] = await pool.query(
            `SELECT * FROM ${TABLES.COLONIES} WHERE id = ?`,
            [id]
        );

        if (existing.length === 0) {
            throw new Error('Colonia no encontrada');
        }

        const updateData = {};
        if (data.id_delegacion) updateData.id_delegacion = data.id_delegacion;
        if (data.nombre) updateData.nombre = data.nombre;
        if (data.codigo_postal !== undefined) updateData.codigo_postal = data.codigo_postal;
        if (data.activo !== undefined) updateData.activo = data.activo;

        await pool.query(
            `UPDATE ${TABLES.COLONIES} SET ? WHERE id = ?`,
            [updateData, id]
        );

        cache.invalidatePattern('colonies:');
        cache.invalidatePattern('delegations:');

        return { id, ...updateData };
    }

    async deleteColony(id) {
        const pool = getPool(false);

        await pool.query(
            `UPDATE ${TABLES.COLONIES} SET activo = 0 WHERE id = ?`,
            [id]
        );

        cache.invalidatePattern('colonies:');
        return { id, activo: 0 };
    }

    async getColoniesByDelegation(delegationId) {
        const pool = getPool(true);

        const [colonies] = await pool.query(`
            SELECT c.*, COUNT(f.id) as total_familias
            FROM ${TABLES.COLONIES} c
            LEFT JOIN ${TABLES.FAMILIES} f ON c.id = f.id_colonia AND f.estado = 'ACTIVA'
            WHERE c.id_delegacion = ? AND c.activo = 1
            GROUP BY c.id
            ORDER BY c.nombre ASC
        `, [delegationId]);

        return colonies;
    }
}

module.exports = new ColonyService();
