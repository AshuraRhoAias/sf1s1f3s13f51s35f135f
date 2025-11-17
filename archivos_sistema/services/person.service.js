// ============================================
// 📁 services/person.service.js
// Servicio para gestión de Personas (con cifrado)
// ============================================
const BaseService = require('./base/BaseService');
const CryptoService = require('./base/CryptoService');
const { getPool, executeTransaction } = require('../config/database');
const cache = require('../config/cache');
const { TABLES, CACHE_TTL, LIMITS } = require('../config/constants');

class PersonService extends BaseService {
    constructor() {
        super(TABLES.PERSONS);
        this.crypto = CryptoService;
    }

    async getAllPersons(filters = {}, page = 1, perPage = LIMITS.DEFAULT_PAGE_SIZE) {
        const offset = (page - 1) * perPage;
        const pool = getPool(true);

        let query = `SELECT p.*, f.nombre_familia FROM ${TABLES.PERSONS} p
                     JOIN ${TABLES.FAMILIES} f ON p.id_familia = f.id
                     WHERE p.activo = 1`;
        const params = [];

        if (filters.id_familia) {
            query += ' AND p.id_familia = ?';
            params.push(filters.id_familia);
        }

        if (filters.puede_votar !== undefined) {
            query += ' AND p.puede_votar = ?';
            params.push(filters.puede_votar);
        }

        if (filters.genero) {
            query += ' AND p.genero = ?';
            params.push(filters.genero);
        }

        query += ' ORDER BY p.id_familia, p.rol_familia DESC, p.edad DESC LIMIT ? OFFSET ?';
        params.push(perPage, offset);

        const [persons] = await pool.query(query, params);

        // Descifrar datos
        const decrypted = persons.map(person => ({
            id: person.id,
            id_familia: person.id_familia,
            nombre_familia: person.nombre_familia,
            nombre: this.crypto.decryptFieldSeparated(
                person.nombre_encrypted,
                person.nombre_iv,
                person.nombre_tag
            ),
            curp: this.crypto.decryptFieldSeparated(
                person.curp_encrypted,
                person.curp_iv,
                person.curp_tag
            ),
            telefono: person.telefono_encrypted ? this.crypto.decryptFieldSeparated(
                person.telefono_encrypted,
                person.telefono_iv,
                person.telefono_tag
            ) : null,
            edad: person.edad,
            genero: person.genero,
            fecha_nacimiento: person.fecha_nacimiento,
            rol_familia: person.rol_familia,
            puede_votar: person.puede_votar,
            created_at: person.created_at
        }));

        // Obtener total
        let countQuery = `SELECT COUNT(*) as total FROM ${TABLES.PERSONS} WHERE activo = 1`;
        const countParams = [];

        if (filters.id_familia) {
            countQuery += ' AND id_familia = ?';
            countParams.push(filters.id_familia);
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

    async getPersonById(id) {
        const pool = getPool(true);

        const [persons] = await pool.query(`
            SELECT p.*, f.nombre_familia, f.direccion_encrypted, f.direccion_iv, f.direccion_tag,
                   c.nombre as colonia, d.nombre as delegacion, e.nombre as estado
            FROM ${TABLES.PERSONS} p
            JOIN ${TABLES.FAMILIES} f ON p.id_familia = f.id
            JOIN ${TABLES.COLONIES} c ON f.id_colonia = c.id
            JOIN ${TABLES.DELEGATIONS} d ON c.id_delegacion = d.id
            JOIN ${TABLES.STATES} e ON d.id_estado = e.id
            WHERE p.id = ? AND p.activo = 1
        `, [id]);

        if (persons.length === 0) {
            throw new Error('Persona no encontrada');
        }

        const person = persons[0];

        return {
            id: person.id,
            id_familia: person.id_familia,
            nombre_familia: person.nombre_familia,
            nombre: this.crypto.decryptFieldSeparated(
                person.nombre_encrypted,
                person.nombre_iv,
                person.nombre_tag
            ),
            curp: this.crypto.decryptFieldSeparated(
                person.curp_encrypted,
                person.curp_iv,
                person.curp_tag
            ),
            telefono: person.telefono_encrypted ? this.crypto.decryptFieldSeparated(
                person.telefono_encrypted,
                person.telefono_iv,
                person.telefono_tag
            ) : null,
            edad: person.edad,
            genero: person.genero,
            fecha_nacimiento: person.fecha_nacimiento,
            rol_familia: person.rol_familia,
            puede_votar: person.puede_votar,
            direccion: this.crypto.decryptFieldSeparated(
                person.direccion_encrypted,
                person.direccion_iv,
                person.direccion_tag
            ),
            colonia: person.colonia,
            delegacion: person.delegacion,
            estado: person.estado,
            created_at: person.created_at
        };
    }

    async createPerson(data, userId) {
        const pool = getPool(false);

        // Verificar que la familia existe
        const [family] = await pool.query(
            `SELECT id FROM ${TABLES.FAMILIES} WHERE id = ?`,
            [data.id_familia]
        );

        if (family.length === 0) {
            throw new Error('Familia no encontrada');
        }

        // Cifrar datos sensibles
        const nombreEnc = this.crypto.encryptFieldSeparated(data.nombre);
        const curpEnc = this.crypto.encryptFieldSeparated(data.curp.toUpperCase());
        const telefonoEnc = data.telefono ?
            this.crypto.encryptFieldSeparated(data.telefono) :
            { encrypted: null, iv: null, tag: null };

        const [result] = await pool.query(
            `INSERT INTO ${TABLES.PERSONS}
            (id_familia, nombre_encrypted, nombre_iv, nombre_tag,
             curp_encrypted, curp_iv, curp_tag,
             telefono_encrypted, telefono_iv, telefono_tag,
             edad, genero, fecha_nacimiento, rol_familia, notas, id_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.id_familia,
                nombreEnc.encrypted, nombreEnc.iv, nombreEnc.tag,
                curpEnc.encrypted, curpEnc.iv, curpEnc.tag,
                telefonoEnc.encrypted, telefonoEnc.iv, telefonoEnc.tag,
                data.edad,
                data.genero,
                data.fecha_nacimiento || null,
                data.rol_familia || 'MIEMBRO',
                data.notas || null,
                userId
            ]
        );

        cache.invalidatePattern('persons:');
        cache.invalidatePattern('families:');
        cache.invalidatePattern('dashboard:');

        return {
            id: result.insertId,
            nombre: data.nombre,
            curp: data.curp
        };
    }

    async updatePerson(id, data, userId) {
        const pool = getPool(false);

        const [existing] = await pool.query(
            `SELECT * FROM ${TABLES.PERSONS} WHERE id = ?`,
            [id]
        );

        if (existing.length === 0) {
            throw new Error('Persona no encontrada');
        }

        const updateData = { id_ultima_modificacion: userId };

        if (data.id_familia) updateData.id_familia = data.id_familia;
        if (data.edad) updateData.edad = data.edad;
        if (data.genero) updateData.genero = data.genero;
        if (data.fecha_nacimiento) updateData.fecha_nacimiento = data.fecha_nacimiento;
        if (data.rol_familia) updateData.rol_familia = data.rol_familia;
        if (data.notas !== undefined) updateData.notas = data.notas;

        // Cifrar datos si se actualizan
        if (data.nombre) {
            const nombreEnc = this.crypto.encryptFieldSeparated(data.nombre);
            updateData.nombre_encrypted = nombreEnc.encrypted;
            updateData.nombre_iv = nombreEnc.iv;
            updateData.nombre_tag = nombreEnc.tag;
        }

        if (data.curp) {
            const curpEnc = this.crypto.encryptFieldSeparated(data.curp.toUpperCase());
            updateData.curp_encrypted = curpEnc.encrypted;
            updateData.curp_iv = curpEnc.iv;
            updateData.curp_tag = curpEnc.tag;
        }

        if (data.telefono) {
            const telefonoEnc = this.crypto.encryptFieldSeparated(data.telefono);
            updateData.telefono_encrypted = telefonoEnc.encrypted;
            updateData.telefono_iv = telefonoEnc.iv;
            updateData.telefono_tag = telefonoEnc.tag;
        }

        await pool.query(
            `UPDATE ${TABLES.PERSONS} SET ? WHERE id = ?`,
            [updateData, id]
        );

        cache.invalidatePattern('persons:');
        cache.invalidatePattern('families:');
        cache.invalidatePattern('dashboard:');

        return { id, ...updateData };
    }

    async deletePerson(id) {
        const pool = getPool(false);

        await pool.query(
            `UPDATE ${TABLES.PERSONS} SET activo = 0 WHERE id = ?`,
            [id]
        );

        cache.invalidatePattern('persons:');
        cache.invalidatePattern('families:');
        cache.invalidatePattern('dashboard:');

        return { id, activo: 0 };
    }

    async getPersonsByFamily(familyId) {
        const pool = getPool(true);

        const [persons] = await pool.query(`
            SELECT * FROM ${TABLES.PERSONS}
            WHERE id_familia = ? AND activo = 1
            ORDER BY rol_familia DESC, edad DESC
        `, [familyId]);

        return persons.map(person => ({
            id: person.id,
            nombre: this.crypto.decryptFieldSeparated(
                person.nombre_encrypted,
                person.nombre_iv,
                person.nombre_tag
            ),
            edad: person.edad,
            genero: person.genero,
            rol_familia: person.rol_familia,
            puede_votar: person.puede_votar
        }));
    }

    async searchPersons(term, limit = LIMITS.MAX_SEARCH_RESULTS) {
        const cacheKey = `search:persons:${term}:${limit}`;

        return await cache.getSearch(cacheKey) || await (async () => {
            const pool = getPool(true);

            const [allPersons] = await pool.query(`
                SELECT p.*, f.nombre_familia, c.nombre as colonia, d.nombre as delegacion, e.nombre as estado
                FROM ${TABLES.PERSONS} p
                JOIN ${TABLES.FAMILIES} f ON p.id_familia = f.id
                JOIN ${TABLES.COLONIES} c ON f.id_colonia = c.id
                JOIN ${TABLES.DELEGATIONS} d ON c.id_delegacion = d.id
                JOIN ${TABLES.STATES} e ON d.id_estado = e.id
                WHERE p.activo = 1
                LIMIT 1000
            `);

            const searchTerm = term.toLowerCase();
            const matches = [];

            for (const person of allPersons) {
                if (matches.length >= limit) break;

                const nombre = this.crypto.decryptFieldSeparated(
                    person.nombre_encrypted,
                    person.nombre_iv,
                    person.nombre_tag
                );

                const curp = this.crypto.decryptFieldSeparated(
                    person.curp_encrypted,
                    person.curp_iv,
                    person.curp_tag
                );

                if (nombre?.toLowerCase().includes(searchTerm) ||
                    curp?.toLowerCase().includes(searchTerm)) {

                    matches.push({
                        id: person.id,
                        nombre,
                        curp,
                        edad: person.edad,
                        genero: person.genero,
                        puede_votar: person.puede_votar,
                        familia: person.nombre_familia,
                        colonia: person.colonia,
                        delegacion: person.delegacion,
                        estado: person.estado
                    });
                }
            }

            cache.setSearch(cacheKey, matches);
            return matches;
        })();
    }

    async batchCreatePersons(persons, userId) {
        return await executeTransaction(async (connection) => {
            const results = [];

            for (let i = 0; i < persons.length; i += 100) {
                const batch = persons.slice(i, i + 100);

                for (const person of batch) {
                    const nombreEnc = this.crypto.encryptFieldSeparated(person.nombre);
                    const curpEnc = this.crypto.encryptFieldSeparated(person.curp.toUpperCase());

                    const [result] = await connection.query(
                        `INSERT INTO ${TABLES.PERSONS}
                        (id_familia, nombre_encrypted, nombre_iv, nombre_tag,
                         curp_encrypted, curp_iv, curp_tag, edad, genero, id_registro)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            person.id_familia,
                            nombreEnc.encrypted, nombreEnc.iv, nombreEnc.tag,
                            curpEnc.encrypted, curpEnc.iv, curpEnc.tag,
                            person.edad, person.genero, userId
                        ]
                    );

                    results.push(result.insertId);
                }
            }

            cache.invalidatePattern('persons:');
            cache.invalidatePattern('dashboard:');

            return results;
        });
    }
}

module.exports = new PersonService();
