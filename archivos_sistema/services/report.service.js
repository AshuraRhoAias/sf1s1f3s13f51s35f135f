// ============================================
// 📁 services/report.service.js
// Servicio para generación de reportes y estadísticas
// ============================================
const { getPool } = require('../config/database');
const cache = require('../config/cache');
const { TABLES, VIEWS, CACHE_TTL } = require('../config/constants');

class ReportService {

    // ==================== REPORTES POR ESTADO ====================

    async generateStateReport(stateId) {
        return await cache.rememberStats(`report:state:${stateId}`, CACHE_TTL.REPORTS, async () => {
            const pool = getPool(true);

            const [stateData] = await pool.query(`
                SELECT * FROM ${VIEWS.STATES_SUMMARY} WHERE id = ?
            `, [stateId]);

            if (stateData.length === 0) {
                throw new Error('Estado no encontrado');
            }

            const [delegations] = await pool.query(`
                SELECT * FROM ${VIEWS.DELEGATIONS_SUMMARY}
                WHERE estado_codigo = ?
                ORDER BY total_personas DESC
            `, [stateData[0].codigo]);

            const [ageDistribution] = await pool.query(`
                SELECT
                    CASE
                        WHEN edad < 18 THEN 'Menores de 18'
                        WHEN edad BETWEEN 18 AND 29 THEN '18-29 años'
                        WHEN edad BETWEEN 30 AND 49 THEN '30-49 años'
                        WHEN edad BETWEEN 50 AND 64 THEN '50-64 años'
                        ELSE '65+ años'
                    END as rango_edad,
                    COUNT(*) as total,
                    SUM(CASE WHEN genero = 'MASCULINO' THEN 1 ELSE 0 END) as masculino,
                    SUM(CASE WHEN genero = 'FEMENINO' THEN 1 ELSE 0 END) as femenino
                FROM ${TABLES.PERSONS} p
                JOIN ${TABLES.FAMILIES} f ON p.id_familia = f.id
                JOIN ${TABLES.COLONIES} c ON f.id_colonia = c.id
                JOIN ${TABLES.DELEGATIONS} d ON c.id_delegacion = d.id
                WHERE d.id_estado = ? AND p.activo = 1
                GROUP BY rango_edad
                ORDER BY MIN(p.edad)
            `, [stateId]);

            const [genderStats] = await pool.query(`
                SELECT
                    genero,
                    COUNT(*) as total,
                    SUM(puede_votar) as votantes,
                    AVG(edad) as edad_promedio
                FROM ${TABLES.PERSONS} p
                JOIN ${TABLES.FAMILIES} f ON p.id_familia = f.id
                JOIN ${TABLES.COLONIES} c ON f.id_colonia = c.id
                JOIN ${TABLES.DELEGATIONS} d ON c.id_delegacion = d.id
                WHERE d.id_estado = ? AND p.activo = 1
                GROUP BY genero
            `, [stateId]);

            return {
                estado: stateData[0],
                delegaciones: delegations,
                distribucion_edad: ageDistribution,
                estadisticas_genero: genderStats,
                generado_en: new Date().toISOString()
            };
        });
    }

    // ==================== REPORTES POR DELEGACIÓN ====================

    async generateDelegationReport(delegationId) {
        return await cache.rememberStats(`report:delegation:${delegationId}`, CACHE_TTL.REPORTS, async () => {
            const pool = getPool(true);

            const [delegationData] = await pool.query(`
                SELECT * FROM ${VIEWS.DELEGATIONS_SUMMARY} WHERE id = ?
            `, [delegationId]);

            if (delegationData.length === 0) {
                throw new Error('Delegación no encontrada');
            }

            const [colonies] = await pool.query(`
                SELECT * FROM ${VIEWS.COLONIES_SUMMARY}
                WHERE delegacion = ?
                ORDER BY total_personas DESC
            `, [delegationData[0].delegacion]);

            const [topFamilies] = await pool.query(`
                SELECT
                    f.id,
                    f.nombre_familia,
                    c.nombre as colonia,
                    COUNT(p.id) as total_miembros,
                    SUM(p.puede_votar) as votantes
                FROM ${TABLES.FAMILIES} f
                JOIN ${TABLES.COLONIES} c ON f.id_colonia = c.id
                LEFT JOIN ${TABLES.PERSONS} p ON f.id = p.id_familia AND p.activo = 1
                WHERE c.id_delegacion = ? AND f.estado = 'ACTIVA'
                GROUP BY f.id
                ORDER BY total_miembros DESC
                LIMIT 20
            `, [delegationId]);

            return {
                delegacion: delegationData[0],
                colonias: colonies,
                familias_grandes: topFamilies,
                generado_en: new Date().toISOString()
            };
        });
    }

    // ==================== ESTADÍSTICAS GENERALES ====================

    async getGeneralStatistics() {
        return await cache.rememberStats('report:general', CACHE_TTL.STATS, async () => {
            const pool = getPool(true);

            const [general] = await pool.query(`
                SELECT
                    (SELECT COUNT(*) FROM ${TABLES.STATES} WHERE activo = 1) as total_estados,
                    (SELECT COUNT(*) FROM ${TABLES.DELEGATIONS} WHERE activo = 1) as total_delegaciones,
                    (SELECT COUNT(*) FROM ${TABLES.COLONIES} WHERE activo = 1) as total_colonias,
                    (SELECT COUNT(*) FROM ${TABLES.FAMILIES} WHERE estado = 'ACTIVA') as total_familias,
                    (SELECT COUNT(*) FROM ${TABLES.PERSONS} WHERE activo = 1) as total_personas,
                    (SELECT SUM(puede_votar) FROM ${TABLES.PERSONS} WHERE activo = 1) as total_votantes,
                    (SELECT SUM(cumplira_18_proximo_anio) FROM ${TABLES.PERSONS} WHERE activo = 1) as proximos_votantes,
                    (SELECT SUM(cumplira_18_en_2_anios) FROM ${TABLES.PERSONS} WHERE activo = 1) as futuros_votantes,
                    (SELECT COUNT(*) FROM ${TABLES.PERSONS} WHERE activo = 1 AND genero = 'MASCULINO') as masculino,
                    (SELECT COUNT(*) FROM ${TABLES.PERSONS} WHERE activo = 1 AND genero = 'FEMENINO') as femenino,
                    (SELECT AVG(edad) FROM ${TABLES.PERSONS} WHERE activo = 1) as edad_promedio
            `);

            return general[0];
        });
    }

    // ==================== COBERTURA Y CRECIMIENTO ====================

    async getCoverageAnalytics() {
        return await cache.rememberStats('report:coverage', CACHE_TTL.STATS, async () => {
            const pool = getPool(true);

            // Cobertura por estado
            const [coverageByState] = await pool.query(`
                SELECT
                    e.nombre as estado,
                    COUNT(DISTINCT d.id) as delegaciones_cubiertas,
                    COUNT(DISTINCT c.id) as colonias_cubiertas,
                    COUNT(DISTINCT f.id) as familias_registradas,
                    COUNT(DISTINCT p.id) as personas_registradas
                FROM ${TABLES.STATES} e
                LEFT JOIN ${TABLES.DELEGATIONS} d ON e.id = d.id_estado AND d.activo = 1
                LEFT JOIN ${TABLES.COLONIES} c ON d.id = c.id_delegacion AND c.activo = 1
                LEFT JOIN ${TABLES.FAMILIES} f ON c.id = f.id_colonia AND f.estado = 'ACTIVA'
                LEFT JOIN ${TABLES.PERSONS} p ON f.id = p.id_familia AND p.activo = 1
                WHERE e.activo = 1
                GROUP BY e.id, e.nombre
                ORDER BY personas_registradas DESC
            `);

            // Crecimiento mensual
            const [monthlyGrowth] = await pool.query(`
                SELECT
                    DATE_FORMAT(created_at, '%Y-%m') as mes,
                    COUNT(*) as nuevas_familias,
                    (SELECT COUNT(*) FROM ${TABLES.PERSONS} p
                     WHERE DATE_FORMAT(p.created_at, '%Y-%m') = DATE_FORMAT(f.created_at, '%Y-%m')) as nuevas_personas
                FROM ${TABLES.FAMILIES} f
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY mes DESC
            `);

            return {
                cobertura_por_estado: coverageByState,
                crecimiento_mensual: monthlyGrowth,
                generado_en: new Date().toISOString()
            };
        });
    }

    // ==================== REPORTES DE USUARIOS ====================

    async getUsersReport() {
        const pool = getPool(true);

        const [users] = await pool.query(`
            SELECT
                u.id,
                u.nombre,
                u.email,
                u.rol,
                u.created_at,
                u.last_login,
                (SELECT COUNT(*) FROM ${TABLES.FAMILIES} WHERE id_registro = u.id) as familias_creadas,
                (SELECT COUNT(*) FROM ${TABLES.PERSONS} WHERE id_registro = u.id) as personas_creadas,
                (SELECT COUNT(*) FROM ${TABLES.AUDIT} WHERE id_usuario = u.id) as total_acciones
            FROM ${TABLES.USERS} u
            WHERE u.activo = 1
            ORDER BY total_acciones DESC
        `);

        return users;
    }

    // ==================== ANÁLISIS DE VOTANTES ====================

    async getVoterAnalytics() {
        return await cache.rememberStats('report:voters', CACHE_TTL.STATS, async () => {
            const pool = getPool(true);

            const [voterStats] = await pool.query(`
                SELECT
                    e.nombre as estado,
                    COUNT(DISTINCT CASE WHEN p.puede_votar = 1 THEN p.id END) as votantes_actuales,
                    COUNT(DISTINCT CASE WHEN p.cumplira_18_proximo_anio = 1 THEN p.id END) as votantes_2026,
                    COUNT(DISTINCT CASE WHEN p.cumplira_18_en_2_anios = 1 THEN p.id END) as votantes_2027,
                    COUNT(DISTINCT CASE WHEN p.puede_votar = 1 AND p.genero = 'MASCULINO' THEN p.id END) as votantes_masculino,
                    COUNT(DISTINCT CASE WHEN p.puede_votar = 1 AND p.genero = 'FEMENINO' THEN p.id END) as votantes_femenino
                FROM ${TABLES.STATES} e
                LEFT JOIN ${TABLES.DELEGATIONS} d ON e.id = d.id_estado
                LEFT JOIN ${TABLES.COLONIES} c ON d.id = c.id_delegacion
                LEFT JOIN ${TABLES.FAMILIES} f ON c.id = f.id_colonia AND f.estado = 'ACTIVA'
                LEFT JOIN ${TABLES.PERSONS} p ON f.id = p.id_familia AND p.activo = 1
                WHERE e.activo = 1
                GROUP BY e.id, e.nombre
                ORDER BY votantes_actuales DESC
            `);

            return voterStats;
        });
    }

    // ==================== EXPORTAR DATOS ====================

    async exportData(filters = {}) {
        const pool = getPool(true);

        let query = `
            SELECT
                e.nombre as estado,
                d.nombre as delegacion,
                c.nombre as colonia,
                c.codigo_postal,
                f.nombre_familia,
                p.edad,
                p.genero,
                p.rol_familia,
                p.puede_votar,
                f.created_at as fecha_registro
            FROM ${TABLES.PERSONS} p
            JOIN ${TABLES.FAMILIES} f ON p.id_familia = f.id
            JOIN ${TABLES.COLONIES} c ON f.id_colonia = c.id
            JOIN ${TABLES.DELEGATIONS} d ON c.id_delegacion = d.id
            JOIN ${TABLES.STATES} e ON d.id_estado = e.id
            WHERE p.activo = 1
        `;

        const params = [];

        if (filters.id_estado) {
            query += ' AND e.id = ?';
            params.push(filters.id_estado);
        }

        if (filters.puede_votar !== undefined) {
            query += ' AND p.puede_votar = ?';
            params.push(filters.puede_votar);
        }

        query += ' ORDER BY e.nombre, d.nombre, c.nombre, f.nombre_familia, p.edad DESC';
        query += ' LIMIT 50000'; // Límite de seguridad

        const [data] = await pool.query(query, params);

        return data;
    }
}

module.exports = new ReportService();
