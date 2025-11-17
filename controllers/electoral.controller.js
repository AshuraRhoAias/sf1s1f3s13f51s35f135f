// ============================================
// 📁 electoral.controller.js
// ============================================
const electoralService = require('../services/electoral.service');
const auditService = require('../services/audit.service');

class ElectoralController {

    // ==================== DASHBOARD ====================
    async getGeneralStats(req, res, next) {
        try {
            const stats = await electoralService.getGeneralStats();
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    async getMonthlySummary(req, res, next) {
        try {
            const summary = await electoralService.getMonthlySummary();
            res.json({ success: true, data: summary });
        } catch (error) {
            next(error);
        }
    }

    async getRecentActivity(req, res, next) {
        try {
            const activity = await electoralService.getRecentActivity(10);
            res.json({ success: true, data: activity });
        } catch (error) {
            next(error);
        }
    }

    // ==================== ESTADOS ====================
    async getAllStates(req, res, next) {
        try {
            const states = await electoralService.getAllStates();
            
            await auditService.logAccess({
                userId: req.user.id,
                action: 'CONSULTAR',
                table: 'estados',
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.json({ success: true, data: states });
        } catch (error) {
            next(error);
        }
    }

    async getStateById(req, res, next) {
        try {
            const { id } = req.params;
            const state = await electoralService.getStateById(id);
            
            if (!state) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Estado no encontrado' 
                });
            }

            res.json({ success: true, data: state });
        } catch (error) {
            next(error);
        }
    }

    async createState(req, res, next) {
        try {
            const { codigo, nombre } = req.body;

            if (!codigo || !nombre) {
                return res.status(400).json({
                    success: false,
                    error: 'Código y nombre son requeridos'
                });
            }

            const state = await electoralService.createState({
                codigo: codigo.toUpperCase(),
                nombre
            });

            await auditService.logAccess({
                userId: req.user.id,
                action: 'CREAR',
                table: 'estados',
                recordId: state.id,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                details: { codigo, nombre }
            });

            res.status(201).json({ 
                success: true, 
                data: state,
                message: 'Estado creado exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    async updateState(req, res, next) {
        try {
            const { id } = req.params;
            const { codigo, nombre, activo } = req.body;

            const state = await electoralService.updateState(id, {
                codigo,
                nombre,
                activo
            });

            await auditService.logAccess({
                userId: req.user.id,
                action: 'EDITAR',
                table: 'estados',
                recordId: id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.json({ 
                success: true, 
                data: state,
                message: 'Estado actualizado exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteState(req, res, next) {
        try {
            const { id } = req.params;

            await electoralService.deleteState(id);

            await auditService.logAccess({
                userId: req.user.id,
                action: 'ELIMINAR',
                table: 'estados',
                recordId: id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.json({ 
                success: true, 
                message: 'Estado eliminado exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    // ==================== DELEGACIONES ====================
    async getDelegationsByState(req, res, next) {
        try {
            const { stateId } = req.params;
            const delegations = await electoralService.getDelegationsByState(stateId);
            res.json({ success: true, data: delegations });
        } catch (error) {
            next(error);
        }
    }

    async getDelegationById(req, res, next) {
        try {
            const { id } = req.params;
            const delegation = await electoralService.getDelegationById(id);
            
            if (!delegation) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Delegación no encontrada' 
                });
            }

            res.json({ success: true, data: delegation });
        } catch (error) {
            next(error);
        }
    }

    async createDelegation(req, res, next) {
        try {
            const { id_estado, nombre } = req.body;

            if (!id_estado || !nombre) {
                return res.status(400).json({
                    success: false,
                    error: 'Estado y nombre son requeridos'
                });
            }

            const delegation = await electoralService.createDelegation({
                id_estado,
                nombre
            });

            await auditService.logAccess({
                userId: req.user.id,
                action: 'CREAR',
                table: 'delegaciones',
                recordId: delegation.id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.status(201).json({ 
                success: true, 
                data: delegation,
                message: 'Delegación creada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    async updateDelegation(req, res, next) {
        try {
            const { id } = req.params;
            const { nombre, activo } = req.body;

            const delegation = await electoralService.updateDelegation(id, {
                nombre,
                activo
            });

            await auditService.logAccess({
                userId: req.user.id,
                action: 'EDITAR',
                table: 'delegaciones',
                recordId: id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.json({ 
                success: true, 
                data: delegation,
                message: 'Delegación actualizada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteDelegation(req, res, next) {
        try {
            const { id } = req.params;

            await electoralService.deleteDelegation(id);

            await auditService.logAccess({
                userId: req.user.id,
                action: 'ELIMINAR',
                table: 'delegaciones',
                recordId: id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.json({ 
                success: true, 
                message: 'Delegación eliminada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    // ==================== COLONIAS ====================
    async getColoniesByDelegation(req, res, next) {
        try {
            const { delegationId } = req.params;
            const colonies = await electoralService.getColoniesByDelegation(delegationId);
            res.json({ success: true, data: colonies });
        } catch (error) {
            next(error);
        }
    }

    async createColony(req, res, next) {
        try {
            const { id_delegacion, nombre, codigo_postal } = req.body;

            if (!id_delegacion || !nombre) {
                return res.status(400).json({
                    success: false,
                    error: 'Delegación y nombre son requeridos'
                });
            }

            const colony = await electoralService.createColony({
                id_delegacion,
                nombre,
                codigo_postal
            });

            await auditService.logAccess({
                userId: req.user.id,
                action: 'CREAR',
                table: 'colonias',
                recordId: colony.id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.status(201).json({ 
                success: true, 
                data: colony,
                message: 'Colonia creada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    async updateColony(req, res, next) {
        try {
            const { id } = req.params;
            const { nombre, codigo_postal, activo } = req.body;

            const colony = await electoralService.updateColony(id, {
                nombre,
                codigo_postal,
                activo
            });

            await auditService.logAccess({
                userId: req.user.id,
                action: 'EDITAR',
                table: 'colonias',
                recordId: id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.json({ 
                success: true, 
                data: colony,
                message: 'Colonia actualizada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteColony(req, res, next) {
        try {
            const { id } = req.params;

            await electoralService.deleteColony(id);

            await auditService.logAccess({
                userId: req.user.id,
                action: 'ELIMINAR',
                table: 'colonias',
                recordId: id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.json({ 
                success: true, 
                message: 'Colonia eliminada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    // ==================== FAMILIAS ====================
    async getAllFamilies(req, res, next) {
        try {
            const { id_colonia, estado } = req.query;
            const families = await electoralService.getAllFamilies({ 
                id_colonia, 
                estado 
            });

            // Descifrar direcciones para respuesta
            const decryptedFamilies = families.map(family => ({
                ...family,
                direccion: electoralService.decryptAddress(
                    family.direccion_encrypted,
                    family.direccion_iv,
                    family.direccion_tag
                )
            }));

            res.json({ success: true, data: decryptedFamilies });
        } catch (error) {
            next(error);
        }
    }

    async getFamilyById(req, res, next) {
        try {
            const { id } = req.params;
            const family = await electoralService.getFamilyById(id);
            
            if (!family) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Familia no encontrada' 
                });
            }

            // Descifrar dirección
            family.direccion = electoralService.decryptAddress(
                family.direccion_encrypted,
                family.direccion_iv,
                family.direccion_tag
            );

            res.json({ success: true, data: family });
        } catch (error) {
            next(error);
        }
    }

    async createFamily(req, res, next) {
        try {
            const { id_colonia, nombre_familia, direccion, notas } = req.body;

            if (!id_colonia || !nombre_familia || !direccion) {
                return res.status(400).json({
                    success: false,
                    error: 'Colonia, nombre de familia y dirección son requeridos'
                });
            }

            const family = await electoralService.createFamily({
                id_colonia,
                nombre_familia,
                direccion,
                notas,
                id_registro: req.user.id
            });

            await auditService.logAccess({
                userId: req.user.id,
                action: 'CREAR',
                table: 'familias',
                recordId: family.id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.status(201).json({ 
                success: true, 
                data: family,
                message: 'Familia creada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    async updateFamily(req, res, next) {
        try {
            const { id } = req.params;
            const { nombre_familia, direccion, estado, notas } = req.body;

            const family = await electoralService.updateFamily(id, {
                nombre_familia,
                direccion,
                estado,
                notas,
                id_ultima_modificacion: req.user.id
            });

            await auditService.logAccess({
                userId: req.user.id,
                action: 'EDITAR',
                table: 'familias',
                recordId: id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.json({ 
                success: true, 
                data: family,
                message: 'Familia actualizada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteFamily(req, res, next) {
        try {
            const { id } = req.params;

            await electoralService.deleteFamily(id);

            await auditService.logAccess({
                userId: req.user.id,
                action: 'ELIMINAR',
                table: 'familias',
                recordId: id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.json({ 
                success: true, 
                message: 'Familia eliminada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    // ==================== PERSONAS ====================
    async getAllPersons(req, res, next) {
        try {
            const { id_familia, puede_votar } = req.query;
            const persons = await electoralService.getAllPersons({ 
                id_familia, 
                puede_votar 
            });

            // Descifrar datos sensibles
            const decryptedPersons = persons.map(person => ({
                ...person,
                nombre: electoralService.decryptField(
                    person.nombre_encrypted,
                    person.nombre_iv,
                    person.nombre_tag
                ),
                curp: electoralService.decryptField(
                    person.curp_encrypted,
                    person.curp_iv,
                    person.curp_tag
                ),
                telefono: person.telefono_encrypted ? electoralService.decryptField(
                    person.telefono_encrypted,
                    person.telefono_iv,
                    person.telefono_tag
                ) : null
            }));

            res.json({ success: true, data: decryptedPersons });
        } catch (error) {
            next(error);
        }
    }

    async getPersonById(req, res, next) {
        try {
            const { id } = req.params;
            const person = await electoralService.getPersonById(id);
            
            if (!person) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Persona no encontrada' 
                });
            }

            // Descifrar datos
            person.nombre = electoralService.decryptField(
                person.nombre_encrypted,
                person.nombre_iv,
                person.nombre_tag
            );
            person.curp = electoralService.decryptField(
                person.curp_encrypted,
                person.curp_iv,
                person.curp_tag
            );
            if (person.telefono_encrypted) {
                person.telefono = electoralService.decryptField(
                    person.telefono_encrypted,
                    person.telefono_iv,
                    person.telefono_tag
                );
            }

            res.json({ success: true, data: person });
        } catch (error) {
            next(error);
        }
    }

    async createPerson(req, res, next) {
        try {
            const { 
                id_familia, nombre, curp, telefono, edad, genero, 
                fecha_nacimiento, rol_familia, notas 
            } = req.body;

            if (!id_familia || !nombre || !curp || !edad || !genero) {
                return res.status(400).json({
                    success: false,
                    error: 'Familia, nombre, CURP, edad y género son requeridos'
                });
            }

            const person = await electoralService.createPerson({
                id_familia,
                nombre,
                curp,
                telefono,
                edad,
                genero,
                fecha_nacimiento,
                rol_familia: rol_familia || 'MIEMBRO',
                notas,
                id_registro: req.user.id
            });

            await auditService.logAccess({
                userId: req.user.id,
                action: 'CREAR',
                table: 'personas',
                recordId: person.id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.status(201).json({ 
                success: true, 
                data: person,
                message: 'Persona creada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    async updatePerson(req, res, next) {
        try {
            const { id } = req.params;
            const { 
                nombre, curp, telefono, edad, genero, 
                fecha_nacimiento, rol_familia, activo, notas 
            } = req.body;

            const person = await electoralService.updatePerson(id, {
                nombre,
                curp,
                telefono,
                edad,
                genero,
                fecha_nacimiento,
                rol_familia,
                activo,
                notas,
                id_ultima_modificacion: req.user.id
            });

            await auditService.logAccess({
                userId: req.user.id,
                action: 'EDITAR',
                table: 'personas',
                recordId: id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.json({ 
                success: true, 
                data: person,
                message: 'Persona actualizada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    async deletePerson(req, res, next) {
        try {
            const { id } = req.params;

            await electoralService.deletePerson(id);

            await auditService.logAccess({
                userId: req.user.id,
                action: 'ELIMINAR',
                table: 'personas',
                recordId: id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.json({ 
                success: true, 
                message: 'Persona eliminada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    // ==================== BÚSQUEDA ====================
    async search(req, res, next) {
        try {
            const { q } = req.query;

            if (!q || q.trim().length < 3) {
                return res.status(400).json({
                    success: false,
                    error: 'El término de búsqueda debe tener al menos 3 caracteres'
                });
            }

            const results = await electoralService.search(q);

            await auditService.logAccess({
                userId: req.user.id,
                action: 'CONSULTAR',
                table: 'busqueda',
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                details: { searchTerm: q }
            });

            res.json({ success: true, data: results });
        } catch (error) {
            next(error);
        }
    }

    async searchByCurp(req, res, next) {
        try {
            const { curp } = req.params;

            if (!curp || curp.length !== 18) {
                return res.status(400).json({
                    success: false,
                    error: 'CURP inválido'
                });
            }

            const person = await electoralService.searchByCurp(curp.toUpperCase());

            res.json({ success: true, data: person });
        } catch (error) {
            next(error);
        }
    }

    // ==================== REPORTES ====================
    async generateStateReport(req, res, next) {
        try {
            const { stateId } = req.params;
            const report = await electoralService.generateStateReport(stateId);

            await auditService.logAccess({
                userId: req.user.id,
                action: 'EXPORTAR',
                table: 'reportes',
                recordId: stateId,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                details: { type: 'state_report' }
            });

            res.json({ success: true, data: report });
        } catch (error) {
            next(error);
        }
    }

    async generateDelegationReport(req, res, next) {
        try {
            const { delegationId } = req.params;
            const report = await electoralService.generateDelegationReport(delegationId);

            await auditService.logAccess({
                userId: req.user.id,
                action: 'EXPORTAR',
                table: 'reportes',
                recordId: delegationId,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                details: { type: 'delegation_report' }
            });

            res.json({ success: true, data: report });
        } catch (error) {
            next(error);
        }
    }

    async exportToCSV(req, res, next) {
        try {
            const { type, id } = req.query;
            const csv = await electoralService.exportToCSV(type, id);

            await auditService.logAccess({
                userId: req.user.id,
                action: 'EXPORTAR',
                table: 'export_csv',
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                details: { type, id }
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${type}_${id}.csv"`);
            res.send(csv);
        } catch (error) {
            next(error);
        }
    }

    // ==================== ANALYTICS ====================
    async getCoverageAnalytics(req, res, next) {
        try {
            const analytics = await electoralService.getCoverageAnalytics();
            res.json({ success: true, data: analytics });
        } catch (error) {
            next(error);
        }
    }

    async getGrowthTrends(req, res, next) {
        try {
            const { period = 'monthly' } = req.query;
            const trends = await electoralService.getGrowthTrends(period);
            res.json({ success: true, data: trends });
        } catch (error) {
            next(error);
        }
    }

    // ==================== REPORTES ====================
    
    async generateStateReport(stateId) {
        const pool = getPool();
        
        const [stateData] = await pool.query(`
            SELECT * FROM vista_resumen_estados WHERE id = ?
        `, [stateId]);

        if (stateData.length === 0) {
            throw new Error('Estado no encontrado');
        }

        const [delegations] = await pool.query(`
            SELECT * FROM vista_resumen_delegaciones
            WHERE estado_codigo = ?
            ORDER BY delegacion ASC
        `, [stateData[0].codigo]);

        const [ageDistribution] = await pool.query(`
            SELECT 
                CASE 
                    WHEN edad < 18 THEN 'Menores'
                    WHEN edad BETWEEN 18 AND 29 THEN '18-29'
                    WHEN edad BETWEEN 30 AND 49 THEN '30-49'
                    WHEN edad BETWEEN 50 AND 64 THEN '50-64'
                    ELSE '65+'
                END as rango,
                COUNT(*) as total
            FROM personas p
            JOIN familias f ON p.id_familia = f.id
            JOIN colonias c ON f.id_colonia = c.id
            JOIN delegaciones d ON c.id_delegacion = d.id
            WHERE d.id_estado = ? AND p.activo = 1
            GROUP BY rango
        `, [stateId]);

        return {
            estado: stateData[0],
            delegaciones: delegations,
            distribucion_edad: ageDistribution,
            generado: new Date().toISOString()
        };
    }

    async generateDelegationReport(delegationId) {
        const pool = getPool();
        
        const [delegationData] = await pool.query(`
            SELECT * FROM vista_resumen_delegaciones WHERE id = ?
        `, [delegationId]);

        if (delegationData.length === 0) {
            throw new Error('Delegación no encontrada');
        }

        const [colonies] = await pool.query(`
            SELECT * FROM vista_resumen_colonias
            WHERE delegacion = ?
            ORDER BY colonia ASC
        `, [delegationData[0].delegacion]);

        const [topFamilies] = await pool.query(`
            SELECT 
                f.nombre_familia,
                COUNT(p.id) as total_miembros,
                SUM(p.puede_votar) as total_votantes
            FROM familias f
            JOIN colonias c ON f.id_colonia = c.id
            LEFT JOIN personas p ON f.id_familia = p.id AND p.activo = 1
            WHERE c.id_delegacion = ? AND f.estado = 'ACTIVA'
            GROUP BY f.id, f.nombre_familia
            ORDER BY total_miembros DESC
            LIMIT 10
        `, [delegationId]);

        return {
            delegacion: delegationData[0],
            colonias: colonies,
            familias_destacadas: topFamilies,
            generado: new Date().toISOString()
        };
    }

    async exportToCSV(type, id) {
        const pool = getPool();
        let data = [];
        let headers = [];

        switch (type) {
            case 'state':
                const [statePersons] = await pool.query(`
                    SELECT p.*, f.nombre_familia, c.nombre as colonia, d.nombre as delegacion
                    FROM personas p
                    JOIN familias f ON p.id_familia = f.id
                    JOIN colonias c ON f.id_colonia = c.id
                    JOIN delegaciones d ON c.id_delegacion = d.id
                    WHERE d.id_estado = ? AND p.activo = 1
                `, [id]);
                
                headers = ['Nombre', 'CURP', 'Edad', 'Genero', 'Puede Votar', 'Familia', 'Colonia', 'Delegacion'];
                data = statePersons.map(p => [
                    this.decryptField(p.nombre_encrypted, p.nombre_iv, p.nombre_tag),
                    this.decryptField(p.curp_encrypted, p.curp_iv, p.curp_tag),
                    p.edad,
                    p.genero,
                    p.puede_votar ? 'Si' : 'No',
                    p.nombre_familia,
                    p.colonia,
                    p.delegacion
                ]);
                break;

            case 'delegation':
                const [delegationPersons] = await pool.query(`
                    SELECT p.*, f.nombre_familia, c.nombre as colonia
                    FROM personas p
                    JOIN familias f ON p.id_familia = f.id
                    JOIN colonias c ON f.id_colonia = c.id
                    WHERE c.id_delegacion = ? AND p.activo = 1
                `, [id]);
                
                headers = ['Nombre', 'CURP', 'Telefono', 'Edad', 'Genero', 'Familia', 'Colonia'];
                data = delegationPersons.map(p => [
                    this.decryptField(p.nombre_encrypted, p.nombre_iv, p.nombre_tag),
                    this.decryptField(p.curp_encrypted, p.curp_iv, p.curp_tag),
                    p.telefono_encrypted ? this.decryptField(p.telefono_encrypted, p.telefono_iv, p.telefono_tag) : '',
                    p.edad,
                    p.genero,
                    p.nombre_familia,
                    p.colonia
                ]);
                break;

            case 'colony':
                const [colonyPersons] = await pool.query(`
                    SELECT p.*, f.nombre_familia
                    FROM personas p
                    JOIN familias f ON p.id_familia = f.id
                    WHERE f.id_colonia = ? AND p.activo = 1
                `, [id]);
                
                headers = ['Nombre', 'CURP', 'Telefono', 'Edad', 'Genero', 'Familia'];
                data = colonyPersons.map(p => [
                    this.decryptField(p.nombre_encrypted, p.nombre_iv, p.nombre_tag),
                    this.decryptField(p.curp_encrypted, p.curp_iv, p.curp_tag),
                    p.telefono_encrypted ? this.decryptField(p.telefono_encrypted, p.telefono_iv, p.telefono_tag) : '',
                    p.edad,
                    p.genero,
                    p.nombre_familia
                ]);
                break;

            default:
                throw new Error('Tipo de exportación no válido');
        }

        // Generar CSV
        const csv = [
            headers.join(','),
            ...data.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csv;
    }

    // ==================== ANALYTICS ====================
    
    async getCoverageAnalytics() {
        const pool = getPool();
        
        const [statesAnalytics] = await pool.query(`
            SELECT 
                e.nombre as estado,
                COUNT(DISTINCT d.id) as delegaciones,
                COUNT(DISTINCT c.id) as colonias,
                COUNT(DISTINCT f.id) as familias,
                COUNT(DISTINCT p.id) as personas,
                SUM(p.puede_votar) as votantes
            FROM estados e
            LEFT JOIN delegaciones d ON e.id = d.id_estado AND d.activo = 1
            LEFT JOIN colonias c ON d.id = c.id_delegacion AND c.activo = 1
            LEFT JOIN familias f ON c.id = f.id_colonia AND f.estado = 'ACTIVA'
            LEFT JOIN personas p ON f.id = p.id_familia AND p.activo = 1
            WHERE e.activo = 1
            GROUP BY e.id, e.nombre
            ORDER BY votantes DESC
        `);

        const [coverage] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM estados WHERE activo = 1) as total_estados,
                (SELECT COUNT(*) FROM delegaciones WHERE activo = 1) as total_delegaciones,
                (SELECT COUNT(*) FROM colonias WHERE activo = 1) as total_colonias,
                (SELECT COUNT(DISTINCT c.id) 
                 FROM colonias c 
                 JOIN familias f ON c.id = f.id_colonia 
                 WHERE c.activo = 1 AND f.estado = 'ACTIVA') as colonias_con_datos
        `);

        const coveragePercent = coverage[0].total_colonias > 0 
            ? (coverage[0].colonias_con_datos / coverage[0].total_colonias * 100).toFixed(2)
            : 0;

        return {
            por_estado: statesAnalytics,
            cobertura_general: {
                ...coverage[0],
                porcentaje_cobertura: coveragePercent
            }
        };
    }

    async getGrowthTrends(period = 'monthly') {
        const pool = getPool();
        
        let dateFormat = '%Y-%m';
        let interval = 'MONTH';
        let limit = 12;

        if (period === 'weekly') {
            dateFormat = '%Y-%u';
            interval = 'WEEK';
            limit = 12;
        } else if (period === 'yearly') {
            dateFormat = '%Y';
            interval = 'YEAR';
            limit = 5;
        }

        const [familyGrowth] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, ?) as periodo,
                COUNT(*) as nuevas_familias
            FROM familias
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? ${interval})
            GROUP BY DATE_FORMAT(created_at, ?)
            ORDER BY periodo ASC
        `, [dateFormat, limit, dateFormat]);

        const [personGrowth] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, ?) as periodo,
                COUNT(*) as nuevas_personas,
                SUM(puede_votar) as nuevos_votantes
            FROM personas
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? ${interval})
            GROUP BY DATE_FORMAT(created_at, ?)
            ORDER BY periodo ASC
        `, [dateFormat, limit, dateFormat]);

        // Combinar datos
        const trends = {};
        
        familyGrowth.forEach(item => {
            if (!trends[item.periodo]) {
                trends[item.periodo] = { periodo: item.periodo };
            }
            trends[item.periodo].nuevas_familias = item.nuevas_familias;
        });

        personGrowth.forEach(item => {
            if (!trends[item.periodo]) {
                trends[item.periodo] = { periodo: item.periodo };
            }
            trends[item.periodo].nuevas_personas = item.nuevas_personas;
            trends[item.periodo].nuevos_votantes = item.nuevos_votantes || 0;
        });

        return Object.values(trends);
    }
}

module.exports = new ElectoralController();