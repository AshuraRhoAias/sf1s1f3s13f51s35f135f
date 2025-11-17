// ============================================
// 📁 services/base/BaseService.js
// Clase base con métodos reutilizables
// ============================================
const { getPool } = require('../../config/database');
const cache = require('../../config/cache');
const { LIMITS, CACHE_TTL } = require('../../config/constants');

class BaseService {
    constructor(tableName) {
        this.tableName = tableName;
        this.cachePrefix = `${tableName}:`;
    }

    // ==================== MÉTODOS CRUD BASE ====================

    async findAll(filters = {}, readonly = true) {
        const cacheKey = `${this.cachePrefix}all:${JSON.stringify(filters)}`;

        return await cache.remember(cacheKey, CACHE_TTL.LISTS, async () => {
            const pool = getPool(readonly);
            const { query, params } = this.buildQuery(filters);
            const [rows] = await pool.query(query, params);
            return rows;
        });
    }

    async findById(id, readonly = true) {
        const cacheKey = `${this.cachePrefix}${id}`;

        return await cache.remember(cacheKey, CACHE_TTL.LISTS, async () => {
            const pool = getPool(readonly);
            const [rows] = await pool.query(
                `SELECT * FROM ${this.tableName} WHERE id = ?`,
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        });
    }

    async create(data) {
        const pool = getPool(false);
        const [result] = await pool.query(
            `INSERT INTO ${this.tableName} SET ?`,
            [data]
        );

        // Invalidar cache
        cache.invalidatePattern(this.cachePrefix);

        return result.insertId;
    }

    async update(id, data) {
        const pool = getPool(false);
        await pool.query(
            `UPDATE ${this.tableName} SET ? WHERE id = ?`,
            [data, id]
        );

        // Invalidar cache
        cache.invalidatePattern(this.cachePrefix);

        return id;
    }

    async delete(id, soft = true) {
        const pool = getPool(false);

        if (soft) {
            await pool.query(
                `UPDATE ${this.tableName} SET activo = 0 WHERE id = ?`,
                [id]
            );
        } else {
            await pool.query(
                `DELETE FROM ${this.tableName} WHERE id = ?`,
                [id]
            );
        }

        // Invalidar cache
        cache.invalidatePattern(this.cachePrefix);
    }

    // ==================== MÉTODOS DE BÚSQUEDA ====================

    async search(searchTerm, fields = [], limit = LIMITS.MAX_SEARCH_RESULTS) {
        const pool = getPool(true);

        const conditions = fields.map(field => `${field} LIKE ?`).join(' OR ');
        const params = fields.map(() => `%${searchTerm}%`);
        params.push(limit);

        const [rows] = await pool.query(
            `SELECT * FROM ${this.tableName}
             WHERE ${conditions}
             LIMIT ?`,
            params
        );

        return rows;
    }

    async count(filters = {}) {
        const cacheKey = `${this.cachePrefix}count:${JSON.stringify(filters)}`;

        return await cache.remember(cacheKey, CACHE_TTL.STATS, async () => {
            const pool = getPool(true);
            const { whereClause, params } = this.buildWhereClause(filters);

            const query = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
            const [rows] = await pool.query(query, params);

            return rows[0].total;
        });
    }

    // ==================== MÉTODOS DE PAGINACIÓN ====================

    async paginate(page = 1, perPage = LIMITS.DEFAULT_PAGE_SIZE, filters = {}) {
        const offset = (page - 1) * perPage;
        const pool = getPool(true);

        const { whereClause, params } = this.buildWhereClause(filters);
        const queryParams = [...params, perPage, offset];

        const [rows] = await pool.query(
            `SELECT * FROM ${this.tableName} ${whereClause}
             LIMIT ? OFFSET ?`,
            queryParams
        );

        const total = await this.count(filters);

        return {
            data: rows,
            pagination: {
                currentPage: page,
                perPage,
                total,
                totalPages: Math.ceil(total / perPage)
            }
        };
    }

    // ==================== MÉTODOS AUXILIARES ====================

    buildQuery(filters = {}) {
        const { whereClause, params } = this.buildWhereClause(filters);
        return {
            query: `SELECT * FROM ${this.tableName} ${whereClause}`,
            params
        };
    }

    buildWhereClause(filters = {}) {
        const conditions = [];
        const params = [];

        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null) {
                conditions.push(`${key} = ?`);
                params.push(filters[key]);
            }
        });

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        return { whereClause, params };
    }

    // ==================== PROCESAMIENTO POR LOTES ====================

    async batchCreate(items, batchSize = LIMITS.MAX_BATCH_SIZE) {
        const pool = getPool(false);
        const results = [];

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);

            for (const item of batch) {
                const [result] = await pool.query(
                    `INSERT INTO ${this.tableName} SET ?`,
                    [item]
                );
                results.push(result.insertId);
            }
        }

        // Invalidar cache
        cache.invalidatePattern(this.cachePrefix);

        return results;
    }

    async batchUpdate(updates, batchSize = LIMITS.MAX_BATCH_SIZE) {
        const pool = getPool(false);
        const results = [];

        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);

            for (const update of batch) {
                const result = await this.update(update.id, update.data);
                results.push(result);
            }
        }

        return results;
    }

    // ==================== ESTADÍSTICAS ====================

    async getStats(groupBy = null) {
        const cacheKey = `${this.cachePrefix}stats:${groupBy}`;

        return await cache.rememberStats(cacheKey, CACHE_TTL.STATS, async () => {
            const pool = getPool(true);

            let query = `SELECT COUNT(*) as total FROM ${this.tableName}`;

            if (groupBy) {
                query = `SELECT ${groupBy}, COUNT(*) as count
                         FROM ${this.tableName}
                         GROUP BY ${groupBy}`;
            }

            const [rows] = await pool.query(query);
            return rows;
        });
    }
}

module.exports = BaseService;
