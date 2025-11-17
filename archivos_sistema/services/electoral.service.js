const BaseService = require('./base/BaseService');
const CryptoService = require('./base/CryptoService');
const { getPool } = require('../config/database');
const cache = require('../config/cache');
const { TABLES, CACHE_TTL } = require('../config/constants');

class ElectoralService extends BaseService {
    constructor() {
        super(TABLES.PERSONS);
        this.crypto = CryptoService;
    }

    async getGeneralStats() {
        return await cache.rememberStats('dashboard:general', CACHE_TTL.STATS, async () => {
            const pool = getPool(true);
            const [stats] = await pool.query(`
                SELECT
                    (SELECT COUNT(*) FROM ${TABLES.STATES} WHERE activo = 1) as estados,
                    (SELECT COUNT(*) FROM ${TABLES.DELEGATIONS} WHERE activo = 1) as delegaciones,
                    (SELECT COUNT(*) FROM ${TABLES.COLONIES} WHERE activo = 1) as colonias,
                    (SELECT COUNT(*) FROM ${TABLES.FAMILIES}) as familias,
                    (SELECT COUNT(*) FROM ${TABLES.PERSONS}) as personas,
                    (SELECT SUM(puede_votar) FROM ${TABLES.PERSONS}) as votantes
            `);
            return stats[0];
        });
    }

    async getAllStates() {
        return await cache.remember('states:all', CACHE_TTL.LISTS, async () => {
            const pool = getPool(true);
            const [states] = await pool.query('SELECT * FROM vista_resumen_estados ORDER BY nombre');
            return states;
        });
    }

    async search(term, limit = 100) {
        const pool = getPool(true);
        const [persons] = await pool.query(`
            SELECT p.*, f.nombre_familia
            FROM ${TABLES.PERSONS} p
            JOIN ${TABLES.FAMILIES} f ON p.id_familia = f.id
            WHERE p.activo = 1
            LIMIT 1000
        `);

        const matches = [];
        for (const person of persons) {
            if (matches.length >= limit) break;

            const nombre = this.crypto.decryptFieldSeparated(
                person.nombre_encrypted,
                person.nombre_iv,
                person.nombre_tag
            );

            if (nombre?.toLowerCase().includes(term.toLowerCase())) {
                matches.push({
                    id: person.id,
                    nombre,
                    edad: person.edad,
                    genero: person.genero,
                    familia: person.nombre_familia
                });
            }
        }

        return matches;
    }
}

module.exports = new ElectoralService();
