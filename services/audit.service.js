// ============================================
// 📁 services/audit.service.js - CORREGIDO
// ============================================
const { getPool } = require('../config/database');

class AuditService {

    async logAccess(data) {
        const pool = getPool();

        try {
            await pool.query(
                `INSERT INTO auditoria_accesos 
                (id_usuario, accion, tabla_afectada, id_registro_afectado, ip_address, user_agent, detalles)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.userId,
                    data.action,
                    data.table || null,
                    data.recordId || null,
                    data.ip || null,
                    data.userAgent || null,
                    data.details ? JSON.stringify(data.details) : null
                ]
            );
        } catch (error) {
            console.error('Error al registrar auditoría:', error);
            // No lanzamos error para no interrumpir el flujo principal
        }
    }

    async getAuditLogs(filters = {}) {
        const pool = getPool();

        let query = `
            SELECT 
                a.*,
                u.nombre as usuario_nombre,
                u.email as usuario_email
            FROM auditoria_accesos a
            LEFT JOIN usuarios u ON a.id_usuario = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.userId) {
            query += ' AND a.id_usuario = ?';
            params.push(filters.userId);
        }

        if (filters.action) {
            query += ' AND a.accion = ?';
            params.push(filters.action);
        }

        if (filters.table) {
            query += ' AND a.tabla_afectada = ?';
            params.push(filters.table);
        }

        if (filters.startDate) {
            query += ' AND a.created_at >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ' AND a.created_at <= ?';
            params.push(filters.endDate);
        }

        query += ' ORDER BY a.created_at DESC LIMIT ?';
        params.push(filters.limit || 100);

        const [logs] = await pool.query(query, params);

        return logs;
    }

    async getAuditStats() {
        const pool = getPool();

        const [stats] = await pool.query(`
            SELECT 
                accion,
                COUNT(*) as total,
                DATE(created_at) as fecha
            FROM auditoria_accesos
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY accion, DATE(created_at)
            ORDER BY fecha DESC, total DESC
        `);

        return stats;
    }

    async getUserActivity(userId, days = 30) {
        const pool = getPool();

        const [activity] = await pool.query(`
            SELECT 
                DATE(created_at) as fecha,
                accion,
                tabla_afectada,
                COUNT(*) as total
            FROM auditoria_accesos
            WHERE id_usuario = ?
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created_at), accion, tabla_afectada
            ORDER BY fecha DESC
        `, [userId, days]);

        return activity;
    }
}

module.exports = new AuditService();