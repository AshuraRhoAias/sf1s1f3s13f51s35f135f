module.exports = {
    LIMITS: {
        MAX_SEARCH_RESULTS: 100,
        MAX_BATCH_SIZE: 1000,
        MAX_EXPORT_SIZE: 50000,
        DEFAULT_PAGE_SIZE: 50
    },
    CACHE_TTL: {
        STATS: 600,
        SEARCH: 180,
        SESSION: 3600,
        LISTS: 300,
        REPORTS: 900
    },
    TABLES: {
        USERS: 'usuarios',
        SESSIONS: 'sesiones',
        STATES: 'estados',
        DELEGATIONS: 'delegaciones',
        COLONIES: 'colonias',
        FAMILIES: 'familias',
        PERSONS: 'personas',
        AUDIT: 'auditoria_accesos'
    },
    VIEWS: {
        STATES_SUMMARY: 'vista_resumen_estados',
        DELEGATIONS_SUMMARY: 'vista_resumen_delegaciones',
        COLONIES_SUMMARY: 'vista_resumen_colonias',
        FAMILIES_COMPLETE: 'vista_familias_completa'
    },
    ERRORS: {
        NOT_FOUND: 'Registro no encontrado',
        ALREADY_EXISTS: 'El registro ya existe',
        INVALID_DATA: 'Datos inválidos',
        UNAUTHORIZED: 'No autorizado',
        INTERNAL_ERROR: 'Error interno del servidor'
    }
};
