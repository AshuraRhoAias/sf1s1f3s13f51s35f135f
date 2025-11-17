// ============================================
// 📁 services/family.service.js
// Servicio para gestión de Familias (con cifrado)
// ============================================
const BaseService = require('./base/BaseService');
const CryptoService = require('./base/CryptoService');
const { getPool } = require('../config/database');
const cache = require('../config/cache');
const { TABLES, VIEWS, CACHE_TTL, LIMITS } = require('../config/constants');

class FamilyService extends BaseService {
    constructor() {
        super(TABLES.FAMILIES);
        this.crypto = CryptoService;
    }

    async getAllFamilies(filters = {}, page = 1, perPage = LIMITS.DEFAULT_PAGE_SIZE) {
        const offset = (page - 1) * perPage;
        const pool = getPool(true);

        let query = `SELECT * FROM ${VIEWS.FAMILIES_COMPLETE} WHERE 1=1`;
        const params = [];

        if (filters.id_colonia) {
            query += ' AND id IN (SELECT id FROM ${TABLES.FAMILIES} WHERE id_colonia = ?)';
            params.push(filters.id_colonia);
        }

        if (filters.estado) {
            query += ' AND estado = ?';
            params.push(filters.estado);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(perPage, offset);

        const [families] = await pool.query(query, params);

        // Descifrar direcciones
        const decrypted = families.map(family => ({
            ...family,
            direccion: this.crypto.decryptFieldSeparated(
                family.direccion_encrypted,
                family.direccion_iv,
                family.direccion_tag
            )
        }));

        // Obtener total
        let countQuery = `SELECT COUNT(*) as total FROM ${TABLES.FAMILIES} WHERE 1=1`;
        const countParams = [];

        if (filters.id_colonia) {
            countQuery += ' AND id_colonia = ?';
            countParams.push(filters.id_colonia);
        }

        if (filters.estado) {
            countQuery += ' AND estado = ?';
            countParams.push(filters.estado);
        }

        const [countResult] = await pool.query(countQuery, countParams);

        return {
            data: decrypted,
            pagination: {
                currentPage: page,
                perPage,
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / perPage)
            }
        };
    }

    async getFamilyById(id) {
        const pool = getPool(true);

        const [families] = await pool.query(`
            SELECT * FROM ${VIEWS.FAMILIES_COMPLETE} WHERE id = ?
        `, [id]);

        if (families.length === 0) {
            throw new Error('Familia no encontrada');
        }

        const family = families[0];

        // Descifrar dirección
        family.direccion = this.crypto.decryptFieldSeparated(
            family.direccion_encrypted,
            family.direccion_iv,
            family.direccion_tag
        );

        // Obtener miembros de la familia
        const [members] = await pool.query(`
            SELECT * FROM ${TABLES.PERSONS}
            WHERE id_familia = ? AND activo = 1
            ORDER BY rol_familia DESC, edad DESC
        `, [id]);

        // Descifrar datos de cada miembro
        family.miembros = members.map(member => ({
            id: member.id,
            nombre: this.crypto.decryptFieldSeparated(
                member.nombre_encrypted,
                member.nombre_iv,
                member.nombre_tag
            ),
            edad: member.edad,
            genero: member.genero,
            rol_familia: member.rol_familia,
            puede_votar: member.puede_votar
        }));

        return family;
    }

    async createFamily(data, userId) {
        const pool = getPool(false);

        // Verificar que la colonia existe
        const [colony] = await pool.query(
            `SELECT id FROM ${TABLES.COLONIES} WHERE id = ?`,
            [data.id_colonia]
        );

        if (colony.length === 0) {
            throw new Error('Colonia no encontrada');
        }

        // Cifrar dirección
        const addressEncrypted = this.crypto.encryptFieldSeparated(data.direccion);

        const [result] = await pool.query(
            `INSERT INTO ${TABLES.FAMILIES}
            (id_colonia, nombre_familia, direccion_encrypted, direccion_iv, direccion_tag, notas, id_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                data.id_colonia,
                data.nombre_familia,
                addressEncrypted.encrypted,
                addressEncrypted.iv,
                addressEncrypted.tag,
                data.notas || null,
                userId
            ]
        );

        cache.invalidatePattern('families:');
        cache.invalidatePattern('colonies:');
        cache.invalidatePattern('dashboard:');

        return {
            id: result.insertId,
            nombre_familia: data.nombre_familia,
            direccion: data.direccion
        };
    }

    async updateFamily(id, data, userId) {
        const pool = getPool(false);

        const [existing] = await pool.query(
            `SELECT * FROM ${TABLES.FAMILIES} WHERE id = ?`,
            [id]
        );

        if (existing.length === 0) {
            throw new Error('Familia no encontrada');
        }

        const updateData = { id_ultima_modificacion: userId };

        if (data.id_colonia) updateData.id_colonia = data.id_colonia;
        if (data.nombre_familia) updateData.nombre_familia = data.nombre_familia;
        if (data.estado) updateData.estado = data.estado;
        if (data.notas !== undefined) updateData.notas = data.notas;

        // Si se actualiza la dirección, cifrarla
        if (data.direccion) {
            const addressEncrypted = this.crypto.encryptFieldSeparated(data.direccion);
            updateData.direccion_encrypted = addressEncrypted.encrypted;
            updateData.direccion_iv = addressEncrypted.iv;
            updateData.direccion_tag = addressEncrypted.tag;
        }

        await pool.query(
            `UPDATE ${TABLES.FAMILIES} SET ? WHERE id = ?`,
            [updateData, id]
        );

        cache.invalidatePattern('families:');
        cache.invalidatePattern('dashboard:');

        return { id, ...updateData };
    }

    async deleteFamily(id) {
        const pool = getPool(false);

        await pool.query(
            `UPDATE ${TABLES.FAMILIES} SET estado = 'INACTIVA' WHERE id = ?`,
            [id]
        );

        cache.invalidatePattern('families:');
        cache.invalidatePattern('dashboard:');

        return { id, estado: 'INACTIVA' };
    }

    async getFamiliesByColony(colonyId) {
        const pool = getPool(true);

        const [families] = await pool.query(`
            SELECT f.id, f.nombre_familia, f.created_at, COUNT(p.id) as total_miembros
            FROM ${TABLES.FAMILIES} f
            LEFT JOIN ${TABLES.PERSONS} p ON f.id = p.id_familia AND p.activo = 1
            WHERE f.id_colonia = ? AND f.estado = 'ACTIVA'
            GROUP BY f.id
            ORDER BY f.nombre_familia ASC
        `, [colonyId]);

        return families;
    }
}

module.exports = new FamilyService();
