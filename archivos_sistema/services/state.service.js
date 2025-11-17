// ============================================
// 📁 services/state.service.js
// Servicio para gestión de Estados
// ============================================
const BaseService = require('./base/BaseService');
const { getPool } = require('../config/database');
const cache = require('../config/cache');
const { TABLES, VIEWS, CACHE_TTL } = require('../config/constants');

class StateService extends BaseService {
    constructor() {
        super(TABLES.STATES);
    }

    // ==================== CRUD COMPLETO ====================

    async getAllStates() {
        return await cache.remember('states:all', CACHE_TTL.LISTS, async () => {
            const pool = getPool(true);
            const [states] = await pool.query(`
                SELECT * FROM ${VIEWS.STATES_SUMMARY}
                ORDER BY nombre ASC
            `);
            return states;
        });
    }

    async getStateById(id) {
        return await cache.remember(`state:${id}`, CACHE_TTL.LISTS, async () => {
            const pool = getPool(true);

            // Obtener estado con estadísticas
            const [states] = await pool.query(`
                SELECT * FROM ${VIEWS.STATES_SUMMARY} WHERE id = ?
            `, [id]);

            if (states.length === 0) {
                throw new Error('Estado no encontrado');
            }

            // Obtener delegaciones del estado
            const [delegations] = await pool.query(`
                SELECT * FROM ${VIEWS.DELEGATIONS_SUMMARY}
                WHERE estado_codigo = ?
                ORDER BY delegacion ASC
            `, [states[0].codigo]);

            return {
                ...states[0],
                delegaciones: delegations
            };
        });
    }

    async createState(data) {
        const pool = getPool(false);

        // Verificar si ya existe el código
        const [existing] = await pool.query(
            `SELECT id FROM ${TABLES.STATES} WHERE codigo = ?`,
            [data.codigo]
        );

        if (existing.length > 0) {
            throw new Error('El código de estado ya existe');
        }

        // Insertar estado
        const [result] = await pool.query(
            `INSERT INTO ${TABLES.STATES} (codigo, nombre) VALUES (?, ?)`,
            [data.codigo, data.nombre]
        );

        // Invalidar cache
        cache.invalidatePattern('states:');
        cache.invalidatePattern('dashboard:');

        return {
            id: result.insertId,
            codigo: data.codigo,
            nombre: data.nombre
        };
    }

    async updateState(id, data) {
        const pool = getPool(false);

        // Verificar que existe
        const [existing] = await pool.query(
            `SELECT * FROM ${TABLES.STATES} WHERE id = ?`,
            [id]
        );

        if (existing.length === 0) {
            throw new Error('Estado no encontrado');
        }

        // Si cambia el código, verificar que no exista
        if (data.codigo && data.codigo !== existing[0].codigo) {
            const [duplicate] = await pool.query(
                `SELECT id FROM ${TABLES.STATES} WHERE codigo = ? AND id != ?`,
                [data.codigo, id]
            );

            if (duplicate.length > 0) {
                throw new Error('El código de estado ya existe');
            }
        }

        // Actualizar
        const updateData = {};
        if (data.codigo) updateData.codigo = data.codigo;
        if (data.nombre) updateData.nombre = data.nombre;
        if (data.activo !== undefined) updateData.activo = data.activo;

        await pool.query(
            `UPDATE ${TABLES.STATES} SET ? WHERE id = ?`,
            [updateData, id]
        );

        // Invalidar cache
        cache.invalidatePattern('states:');
        cache.invalidatePattern('dashboard:');

        return { id, ...updateData };
    }

    async deleteState(id) {
        const pool = getPool(false);

        // Verificar que existe
        const [existing] = await pool.query(
            `SELECT * FROM ${TABLES.STATES} WHERE id = ?`,
            [id]
        );

        if (existing.length === 0) {
            throw new Error('Estado no encontrado');
        }

        // Soft delete
        await pool.query(
            `UPDATE ${TABLES.STATES} SET activo = 0 WHERE id = ?`,
            [id]
        );

        // Invalidar cache
        cache.invalidatePattern('states:');
        cache.invalidatePattern('dashboard:');

        return { id, activo: 0 };
    }

    // ==================== BÚSQUEDA ====================

    async searchStates(term) {
        const pool = getPool(true);
        const [states] = await pool.query(`
            SELECT * FROM ${VIEWS.STATES_SUMMARY}
            WHERE nombre LIKE ? OR codigo LIKE ?
            ORDER BY nombre ASC
        `, [`%${term}%`, `%${term}%`]);

        return states;
    }

    // ==================== ESTADÍSTICAS ====================

    async getStateStats(id) {
        return await cache.rememberStats(`state:stats:${id}`, CACHE_TTL.STATS, async () => {
            const pool = getPool(true);

            const [stats] = await pool.query(`
                SELECT
                    e.id,
                    e.nombre,
                    e.codigo,
                    COUNT(DISTINCT d.id) as total_delegaciones,
                    COUNT(DISTINCT c.id) as total_colonias,
                    COUNT(DISTINCT f.id) as total_familias,
                    COUNT(DISTINCT p.id) as total_personas,
                    SUM(CASE WHEN p.puede_votar = 1 THEN 1 ELSE 0 END) as total_votantes,
                    SUM(CASE WHEN p.genero = 'MASCULINO' THEN 1 ELSE 0 END) as masculino,
                    SUM(CASE WHEN p.genero = 'FEMENINO' THEN 1 ELSE 0 END) as femenino,
                    SUM(CASE WHEN p.cumplira_18_proximo_anio = 1 THEN 1 ELSE 0 END) as proximos_votantes,
                    SUM(CASE WHEN p.cumplira_18_en_2_anios = 1 THEN 1 ELSE 0 END) as futuros_votantes
                FROM ${TABLES.STATES} e
                LEFT JOIN ${TABLES.DELEGATIONS} d ON e.id = d.id_estado AND d.activo = 1
                LEFT JOIN ${TABLES.COLONIES} c ON d.id = c.id_delegacion AND c.activo = 1
                LEFT JOIN ${TABLES.FAMILIES} f ON c.id = f.id_colonia AND f.estado = 'ACTIVA'
                LEFT JOIN ${TABLES.PERSONS} p ON f.id = p.id_familia AND p.activo = 1
                WHERE e.id = ?
                GROUP BY e.id, e.nombre, e.codigo
            `, [id]);

            return stats[0] || null;
        });
    }
}

module.exports = new StateService();
