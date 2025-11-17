// ============================================
// 📁 electoral.service.js - PARTE 1
// ============================================
const { getPool } = require('../config/database');
const encryptionService = require('./encryption.service');
const crypto = require('crypto');

class ElectoralService {

    // ==================== CIFRADO/DESCIFRADO ====================
    
    encryptField(text) {
        const key = crypto.scryptSync(
            process.env.MASTER_PHRASE || '0AshuraRhoaAias2Tekken3Kaioh',
            'electoral-salt',
            32
        );
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: authTag.toString('hex')
        };
    }

    decryptField(encrypted, iv, tag) {
        if (!encrypted || !iv || !tag) return null;

        try {
            const key = crypto.scryptSync(
                process.env.MASTER_PHRASE || '0AshuraRhoaAias2Tekken3Kaioh',
                'electoral-salt',
                32
            );
            
            const decipher = crypto.createDecipheriv(
                'aes-256-gcm',
                key,
                Buffer.from(iv, 'hex')
            );
            
            decipher.setAuthTag(Buffer.from(tag, 'hex'));
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Error al descifrar:', error);
            return null;
        }
    }

    encryptAddress(address) {
        return this.encryptField(address);
    }

    decryptAddress(encrypted, iv, tag) {
        return this.decryptField(encrypted, iv, tag);
    }

    // ==================== DASHBOARD ====================
    
    async getGeneralStats() {
        const pool = getPool();
        
        const [states] = await pool.query(
            'SELECT COUNT(*) as total FROM estados WHERE activo = 1'
        );
        
        const [delegations] = await pool.query(
            'SELECT COUNT(*) as total FROM delegaciones WHERE activo = 1'
        );
        
        const [colonies] = await pool.query(
            'SELECT COUNT(*) as total FROM colonias WHERE activo = 1'
        );
        
        const [families] = await pool.query(
            'SELECT COUNT(*) as total FROM familias WHERE estado = "ACTIVA"'
        );
        
        const [persons] = await pool.query(
            'SELECT COUNT(*) as total, SUM(puede_votar) as voters FROM personas WHERE activo = 1'
        );

        const [gender] = await pool.query(
            `SELECT 
                SUM(CASE WHEN genero = 'MASCULINO' THEN 1 ELSE 0 END) as masculino,
                SUM(CASE WHEN genero = 'FEMENINO' THEN 1 ELSE 0 END) as femenino
            FROM personas WHERE activo = 1`
        );

        return {
            estados: states[0].total,
            delegaciones: delegations[0].total,
            colonias: colonies[0].total,
            familias: families[0].total,
            personas: persons[0].total,
            votantes: persons[0].voters || 0,
            masculino: gender[0].masculino || 0,
            femenino: gender[0].femenino || 0
        };
    }

    async getMonthlySummary() {
        const pool = getPool();
        
        const [summary] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as mes,
                COUNT(*) as total
            FROM familias
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY mes ASC
        `);

        return summary;
    }

    async getRecentActivity(limit = 10) {
        const pool = getPool();
        
        const [activity] = await pool.query(`
            SELECT 
                a.accion,
                a.tabla_afectada,
                a.created_at,
                u.nombre as usuario
            FROM auditoria_accesos a
            LEFT JOIN usuarios u ON a.id_usuario = u.id
            WHERE a.accion IN ('CREAR', 'EDITAR', 'ELIMINAR')
            ORDER BY a.created_at DESC
            LIMIT ?
        `, [limit]);

        return activity;
    }

    // ==================== ESTADOS ====================
    
    async getAllStates() {
        const pool = getPool();
        
        const [states] = await pool.query(`
            SELECT * FROM vista_resumen_estados
            ORDER BY nombre ASC
        `);

        return states;
    }

    async getStateById(id) {
        const pool = getPool();
        
        const [states] = await pool.query(`
            SELECT * FROM vista_resumen_estados
            WHERE id = ?
        `, [id]);

        if (states.length === 0) return null;

        // Obtener delegaciones del estado
        const [delegations] = await pool.query(`
            SELECT * FROM vista_resumen_delegaciones
            WHERE estado_codigo = (SELECT codigo FROM estados WHERE id = ?)
            ORDER BY delegacion ASC
        `, [id]);

        return {
            ...states[0],
            delegaciones: delegations
        };
    }

    async createState(data) {
        const pool = getPool();
        
        // Verificar si ya existe
        const [existing] = await pool.query(
            'SELECT id FROM estados WHERE codigo = ?',
            [data.codigo]
        );

        if (existing.length > 0) {
            throw new Error('El código de estado ya existe');
        }

        const [result] = await pool.query(
            'INSERT INTO estados (codigo, nombre) VALUES (?, ?)',
            [data.codigo, data.nombre]
        );

        return {
            id: result.insertId,
            ...data
        };
    }

    async updateState(id, data) {
        const pool = getPool();
        
        const updates = [];
        const values = [];

        if (data.codigo) {
            updates.push('codigo = ?');
            values.push(data.codigo);
        }
        if (data.nombre) {
            updates.push('nombre = ?');
            values.push(data.nombre);
        }
        if (data.activo !== undefined) {
            updates.push('activo = ?');
            values.push(data.activo);
        }

        if (updates.length === 0) {
            throw new Error('No hay datos para actualizar');
        }

        values.push(id);

        await pool.query(
            `UPDATE estados SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const [updated] = await pool.query(
            'SELECT * FROM estados WHERE id = ?',
            [id]
        );

        return updated[0];
    }

    async deleteState(id) {
        const pool = getPool();
        
        // Soft delete
        await pool.query(
            'UPDATE estados SET activo = 0 WHERE id = ?',
            [id]
        );
    }

    // ==================== DELEGACIONES ====================
    
    async getDelegationsByState(stateId) {
        const pool = getPool();
        
        const [delegations] = await pool.query(`
            SELECT * FROM vista_resumen_delegaciones
            WHERE id IN (
                SELECT d.id FROM delegaciones d
                WHERE d.id_estado = ? AND d.activo = 1
            )
            ORDER BY delegacion ASC
        `, [stateId]);

        return delegations;
    }

    async getDelegationById(id) {
        const pool = getPool();
        
        const [delegations] = await pool.query(`
            SELECT * FROM vista_resumen_delegaciones
            WHERE id = ?
        `, [id]);

        if (delegations.length === 0) return null;

        // Obtener colonias de la delegación
        const [colonies] = await pool.query(`
            SELECT * FROM vista_resumen_colonias
            WHERE delegacion = (SELECT nombre FROM delegaciones WHERE id = ?)
            ORDER BY colonia ASC
        `, [id]);

        return {
            ...delegations[0],
            colonias: colonies
        };
    }

    async createDelegation(data) {
        const pool = getPool();
        
        const [result] = await pool.query(
            'INSERT INTO delegaciones (id_estado, nombre) VALUES (?, ?)',
            [data.id_estado, data.nombre]
        );

        return {
            id: result.insertId,
            ...data
        };
    }

    async updateDelegation(id, data) {
        const pool = getPool();
        
        const updates = [];
        const values = [];

        if (data.nombre) {
            updates.push('nombre = ?');
            values.push(data.nombre);
        }
        if (data.activo !== undefined) {
            updates.push('activo = ?');
            values.push(data.activo);
        }

        if (updates.length === 0) {
            throw new Error('No hay datos para actualizar');
        }

        values.push(id);

        await pool.query(
            `UPDATE delegaciones SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const [updated] = await pool.query(
            'SELECT * FROM delegaciones WHERE id = ?',
            [id]
        );

        return updated[0];
    }

    async deleteDelegation(id) {
        const pool = getPool();
        
        await pool.query(
            'UPDATE delegaciones SET activo = 0 WHERE id = ?',
            [id]
        );
    }

    // ==================== COLONIAS ====================
    
    async getColoniesByDelegation(delegationId) {
        const pool = getPool();
        
        const [colonies] = await pool.query(`
            SELECT * FROM vista_resumen_colonias
            WHERE id IN (
                SELECT c.id FROM colonias c
                WHERE c.id_delegacion = ? AND c.activo = 1
            )
            ORDER BY colonia ASC
        `, [delegationId]);

        return colonies;
    }

    async createColony(data) {
        const pool = getPool();
        
        const [result] = await pool.query(
            'INSERT INTO colonias (id_delegacion, nombre, codigo_postal) VALUES (?, ?, ?)',
            [data.id_delegacion, data.nombre, data.codigo_postal]
        );

        return {
            id: result.insertId,
            ...data
        };
    }

    async updateColony(id, data) {
        const pool = getPool();
        
        const updates = [];
        const values = [];

        if (data.nombre) {
            updates.push('nombre = ?');
            values.push(data.nombre);
        }
        if (data.codigo_postal) {
            updates.push('codigo_postal = ?');
            values.push(data.codigo_postal);
        }
        if (data.activo !== undefined) {
            updates.push('activo = ?');
            values.push(data.activo);
        }

        if (updates.length === 0) {
            throw new Error('No hay datos para actualizar');
        }

        values.push(id);

        await pool.query(
            `UPDATE colonias SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const [updated] = await pool.query(
            'SELECT * FROM colonias WHERE id = ?',
            [id]
        );

        return updated[0];
    }

    async deleteColony(id) {
        const pool = getPool();
        
        await pool.query(
            'UPDATE colonias SET activo = 0 WHERE id = ?',
            [id]
        );
    }

    // ==================== FAMILIAS ====================
    
    async getAllFamilies(filters = {}) {
        const pool = getPool();
        
        let query = 'SELECT * FROM vista_familias_completa WHERE 1=1';
        const params = [];

        if (filters.id_colonia) {
            query += ' AND id IN (SELECT id FROM familias WHERE id_colonia = ?)';
            params.push(filters.id_colonia);
        }

        if (filters.estado) {
            query += ' AND estado = ?';
            params.push(filters.estado);
        }

        query += ' ORDER BY created_at DESC';

        const [families] = await pool.query(query, params);

        return families;
    }

    async getFamilyById(id) {
        const pool = getPool();
        
        const [families] = await pool.query(`
            SELECT * FROM vista_familias_completa WHERE id = ?
        `, [id]);

        if (families.length === 0) return null;

        // Obtener miembros de la familia
        const [members] = await pool.query(`
            SELECT * FROM personas WHERE id_familia = ? AND activo = 1
            ORDER BY rol_familia DESC, edad DESC
        `, [id]);

        return {
            ...families[0],
            miembros: members
        };
    }

    async createFamily(data) {
        const pool = getPool();
        
        // Cifrar dirección
        const addressEncrypted = this.encryptAddress(data.direccion);

        const [result] = await pool.query(
            `INSERT INTO familias 
            (id_colonia, nombre_familia, direccion_encrypted, direccion_iv, direccion_tag, notas, id_registro) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                data.id_colonia,
                data.nombre_familia,
                addressEncrypted.encrypted,
                addressEncrypted.iv,
                addressEncrypted.tag,
                data.notas,
                data.id_registro
            ]
        );

        return {
            id: result.insertId,
            nombre_familia: data.nombre_familia,
            direccion: data.direccion
        };
    }

    async updateFamily(id, data) {
        const pool = getPool();
        
        const updates = [];
        const values = [];

        if (data.nombre_familia) {
            updates.push('nombre_familia = ?');
            values.push(data.nombre_familia);
        }

        if (data.direccion) {
            const addressEncrypted = this.encryptAddress(data.direccion);
            updates.push('direccion_encrypted = ?', 'direccion_iv = ?', 'direccion_tag = ?');
            values.push(addressEncrypted.encrypted, addressEncrypted.iv, addressEncrypted.tag);
        }

        if (data.estado) {
            updates.push('estado = ?');
            values.push(data.estado);
        }

        if (data.notas !== undefined) {
            updates.push('notas = ?');
            values.push(data.notas);
        }

        if (data.id_ultima_modificacion) {
            updates.push('id_ultima_modificacion = ?');
            values.push(data.id_ultima_modificacion);
        }

        if (updates.length === 0) {
            throw new Error('No hay datos para actualizar');
        }

        values.push(id);

        await pool.query(
            `UPDATE familias SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return await this.getFamilyById(id);
    }

    async deleteFamily(id) {
        const pool = getPool();
        
        await pool.query(
            'UPDATE familias SET estado = "INACTIVA" WHERE id = ?',
            [id]
        );
    }

    // ==================== PERSONAS ====================
    
    async getAllPersons(filters = {}) {
        const pool = getPool();
        
        let query = 'SELECT * FROM personas WHERE activo = 1';
        const params = [];

        if (filters.id_familia) {
            query += ' AND id_familia = ?';
            params.push(filters.id_familia);
        }

        if (filters.puede_votar !== undefined) {
            query += ' AND puede_votar = ?';
            params.push(filters.puede_votar);
        }

        query += ' ORDER BY id_familia, rol_familia DESC, edad DESC';

        const [persons] = await pool.query(query, params);

        return persons;
    }

    async getPersonById(id) {
        const pool = getPool();
        
        const [persons] = await pool.query(
            'SELECT * FROM personas WHERE id = ? AND activo = 1',
            [id]
        );

        return persons.length > 0 ? persons[0] : null;
    }

    async createPerson(data) {
        const pool = getPool();
        
        // Cifrar datos sensibles
        const nombreEncrypted = this.encryptField(data.nombre);
        const curpEncrypted = this.encryptField(data.curp.toUpperCase());
        const telefonoEncrypted = data.telefono ? this.encryptField(data.telefono) : null;

        const [result] = await pool.query(
            `INSERT INTO personas 
            (id_familia, nombre_encrypted, nombre_iv, nombre_tag, 
             curp_encrypted, curp_iv, curp_tag,
             telefono_encrypted, telefono_iv, telefono_tag,
             edad, genero, fecha_nacimiento, rol_familia, notas, id_registro) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.id_familia,
                nombreEncrypted.encrypted, nombreEncrypted.iv, nombreEncrypted.tag,
                curpEncrypted.encrypted, curpEncrypted.iv, curpEncrypted.tag,
                telefonoEncrypted?.encrypted, telefonoEncrypted?.iv, telefonoEncrypted?.tag,
                data.edad,
                data.genero,
                data.fecha_nacimiento,
                data.rol_familia,
                data.notas,
                data.id_registro
            ]
        );

        return {
            id: result.insertId,
            nombre: data.nombre,
            curp: data.curp,
            telefono: data.telefono
        };
    }

    async updatePerson(id, data) {
        const pool = getPool();
        
        const updates = [];
        const values = [];

        if (data.nombre) {
            const nombreEncrypted = this.encryptField(data.nombre);
            updates.push('nombre_encrypted = ?', 'nombre_iv = ?', 'nombre_tag = ?');
            values.push(nombreEncrypted.encrypted, nombreEncrypted.iv, nombreEncrypted.tag);
        }

        if (data.curp) {
            const curpEncrypted = this.encryptField(data.curp.toUpperCase());
            updates.push('curp_encrypted = ?', 'curp_iv = ?', 'curp_tag = ?');
            values.push(curpEncrypted.encrypted, curpEncrypted.iv, curpEncrypted.tag);
        }

        if (data.telefono !== undefined) {
            if (data.telefono) {
                const telefonoEncrypted = this.encryptField(data.telefono);
                updates.push('telefono_encrypted = ?', 'telefono_iv = ?', 'telefono_tag = ?');
                values.push(telefonoEncrypted.encrypted, telefonoEncrypted.iv, telefonoEncrypted.tag);
            } else {
                updates.push('telefono_encrypted = NULL', 'telefono_iv = NULL', 'telefono_tag = NULL');
            }
        }

        if (data.edad) {
            updates.push('edad = ?');
            values.push(data.edad);
        }

        if (data.genero) {
            updates.push('genero = ?');
            values.push(data.genero);
        }

        if (data.fecha_nacimiento) {
            updates.push('fecha_nacimiento = ?');
            values.push(data.fecha_nacimiento);
        }

        if (data.rol_familia) {
            updates.push('rol_familia = ?');
            values.push(data.rol_familia);
        }

        if (data.activo !== undefined) {
            updates.push('activo = ?');
            values.push(data.activo);
        }

        if (data.notas !== undefined) {
            updates.push('notas = ?');
            values.push(data.notas);
        }

        if (data.id_ultima_modificacion) {
            updates.push('id_ultima_modificacion = ?');
            values.push(data.id_ultima_modificacion);
        }

        if (updates.length === 0) {
            throw new Error('No hay datos para actualizar');
        }

        values.push(id);

        await pool.query(
            `UPDATE personas SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return await this.getPersonById(id);
    }

    async deletePerson(id) {
        const pool = getPool();
        
        await pool.query(
            'UPDATE personas SET activo = 0 WHERE id = ?',
            [id]
        );
    }

    // ==================== BÚSQUEDA ====================
    
    async search(term) {
        const pool = getPool();
        
        // Buscar en personas (necesitamos descifrar para comparar)
        const [allPersons] = await pool.query(
            'SELECT * FROM personas WHERE activo = 1'
        );

        const matchedPersons = allPersons.filter(person => {
            const nombre = this.decryptField(person.nombre_encrypted, person.nombre_iv, person.nombre_tag);
            const curp = this.decryptField(person.curp_encrypted, person.curp_iv, person.curp_tag);
            const telefono = person.telefono_encrypted ?
                this.decryptField(person.telefono_encrypted, person.telefono_iv, person.telefono_tag) : '';

            const searchTerm = term.toLowerCase();
            
            return (
                nombre?.toLowerCase().includes(searchTerm) ||
                curp?.toLowerCase().includes(searchTerm) ||
                telefono?.includes(term)
            );
        });

        // Obtener información completa de las personas encontradas
        const results = await Promise.all(
            matchedPersons.slice(0, 50).map(async (person) => {
                const [familyInfo] = await pool.query(`
                    SELECT f.*, c.nombre as colonia, d.nombre as delegacion, e.nombre as estado
                    FROM familias f
                    JOIN colonias c ON f.id_colonia = c.id
                    JOIN delegaciones d ON c.id_delegacion = d.id
                    JOIN estados e ON d.id_estado = e.id
                    WHERE f.id = ?
                `, [person.id_familia]);

                return {
                    id: person.id,
                    nombre: this.decryptField(person.nombre_encrypted, person.nombre_iv, person.nombre_tag),
                    curp: this.decryptField(person.curp_encrypted, person.curp_iv, person.curp_tag),
                    telefono: person.telefono_encrypted ?
                        this.decryptField(person.telefono_encrypted, person.telefono_iv, person.telefono_tag) : null,
                    edad: person.edad,
                    genero: person.genero,
                    puede_votar: person.puede_votar,
                    familia: familyInfo[0] ? {
                        nombre: familyInfo[0].nombre_familia,
                        direccion: this.decryptAddress(
                            familyInfo[0].direccion_encrypted,
                            familyInfo[0].direccion_iv,
                            familyInfo[0].direccion_tag
                        ),
                        colonia: familyInfo[0].colonia,
                        delegacion: familyInfo[0].delegacion,
                        estado: familyInfo[0].estado
                    } : null
                };
            })
        );

        return results;
    }

    async searchByCurp(curp) {
        const pool = getPool();
        
        const [allPersons] = await pool.query(
            'SELECT * FROM personas WHERE activo = 1'
        );

        const person = allPersons.find(p => {
            const decryptedCurp = this.decryptField(p.curp_encrypted, p.curp_iv, p.curp_tag);
            return decryptedCurp === curp;
        });

        if (!person) return null;

        const [familyInfo] = await pool.query(`
            SELECT f.*, c.nombre as colonia, d.nombre as delegacion, e.nombre as estado
            FROM familias f
            JOIN colonias c ON f.id_colonia = c.id
            JOIN delegaciones d ON c.id_delegacion = d.id
            JOIN estados e ON d.id_estado = e.id
            WHERE f.id = ?
        `, [person.id_familia]);

        return {
            id: person.id,
            nombre: this.decryptField(person.nombre_encrypted, person.nombre_iv, person.nombre_tag),
            curp: this.decryptField(person.curp_encrypted, person.curp_iv, person.curp_tag),
            telefono: person.telefono_encrypted ?
                this.decryptField(person.telefono_encrypted, person.telefono_iv, person.telefono_tag) : null,
            edad: person.edad,
            genero: person.genero,
            puede_votar: person.puede_votar,
            familia: familyInfo[0] ? {
                id: familyInfo[0].id,
                nombre: familyInfo[0].nombre_familia,
                direccion: this.decryptAddress(
                    familyInfo[0].direccion_encrypted,
                    familyInfo[0].direccion_iv,
                    familyInfo[0].direccion_tag
                ),
                colonia: familyInfo[0].colonia,
                delegacion: familyInfo[0].delegacion,
                estado: familyInfo[0].estado
            } : null
        };
    }
};

module.exports = new ElectoralService();