@echo off
chcp 65001 >nul
color 0A
title Copiar Archivos Faltantes al Proyecto

echo.
echo ═══════════════════════════════════════════════════════════════
echo    COPIANDO ARCHIVOS FALTANTES AL PROYECTO
echo ═══════════════════════════════════════════════════════════════
echo.
echo Este script copiará los archivos JavaScript necesarios a:
echo %CD%\electoral-system-optimized
echo.
pause

cd electoral-system-optimized

echo.
echo Creando carpetas faltantes...
mkdir services\base 2>nul
mkdir controllers\base 2>nul
mkdir config 2>nul
mkdir middleware 2>nul
mkdir routes 2>nul
echo ✓ Carpetas creadas

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Creando archivos...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM ============================================
REM config/database.js
REM ============================================
echo Creando config/database.js...
(
echo const mysql = require^('mysql2/promise'^);
echo.
echo let pool;
echo let readPool;
echo.
echo const initPool = ^(^) =^> {
echo     pool = mysql.createPool^({
echo         host: process.env.DB_HOST,
echo         user: process.env.DB_USER,
echo         password: process.env.DB_PASSWORD,
echo         database: process.env.DB_NAME,
echo         waitForConnections: true,
echo         connectionLimit: 100,
echo         queueLimit: 0,
echo         enableKeepAlive: true,
echo         keepAliveInitialDelay: 0,
echo         maxIdle: 50,
echo         idleTimeout: 60000,
echo         acquireTimeout: 30000,
echo         multipleStatements: false,
echo         compress: true,
echo         connectTimeout: 20000
echo     }^);
echo.
echo     readPool = mysql.createPool^({
echo         host: process.env.DB_HOST,
echo         user: process.env.DB_USER,
echo         password: process.env.DB_PASSWORD,
echo         database: process.env.DB_NAME,
echo         waitForConnections: true,
echo         connectionLimit: 150,
echo         queueLimit: 0,
echo         enableKeepAlive: true,
echo         maxIdle: 75,
echo         idleTimeout: 60000
echo     }^);
echo.
echo     console.log^('✅ Pools de conexión inicializados'^);
echo     return { pool, readPool };
echo };
echo.
echo const getPool = ^(readonly = false^) =^> {
echo     if ^(!pool ^|^| !readPool^) throw new Error^('Pools no inicializados'^);
echo     return readonly ? readPool : pool;
echo };
echo.
echo const closePool = async ^(^) =^> {
echo     if ^(pool^) await pool.end^(^);
echo     if ^(readPool^) await readPool.end^(^);
echo };
echo.
echo const executeTransaction = async ^(callback^) =^> {
echo     const connection = await pool.getConnection^(^);
echo     try {
echo         await connection.beginTransaction^(^);
echo         const result = await callback^(connection^);
echo         await connection.commit^(^);
echo         return result;
echo     } catch ^(error^) {
echo         await connection.rollback^(^);
echo         throw error;
echo     } finally {
echo         connection.release^(^);
echo     }
echo };
echo.
echo module.exports = { initPool, getPool, closePool, executeTransaction };
) > config\database.js

echo ✓ config/database.js creado

REM ============================================
REM config/cache.js
REM ============================================
echo Creando config/cache.js...
(
echo const NodeCache = require^('node-cache'^);
echo.
echo const mainCache = new NodeCache^({ stdTTL: 300, checkperiod: 60, useClones: false, maxKeys: 10000 }^);
echo const statsCache = new NodeCache^({ stdTTL: 600, checkperiod: 120, useClones: false, maxKeys: 1000 }^);
echo const sessionCache = new NodeCache^({ stdTTL: 3600, checkperiod: 300, useClones: false, maxKeys: 5000 }^);
echo const searchCache = new NodeCache^({ stdTTL: 180, checkperiod: 60, useClones: false, maxKeys: 2000 }^);
echo.
echo class CacheManager {
echo     get^(key^) { return mainCache.get^(key^); }
echo     set^(key, value, ttl^) { return ttl ? mainCache.set^(key, value, ttl^) : mainCache.set^(key, value^); }
echo     getStats^(key^) { return statsCache.get^(key^); }
echo     setStats^(key, value, ttl^) { return ttl ? statsCache.set^(key, value, ttl^) : statsCache.set^(key, value^); }
echo     getSession^(key^) { return sessionCache.get^(key^); }
echo     setSession^(key, value^) { return sessionCache.set^(key, value^); }
echo     getSearch^(key^) { return searchCache.get^(key^); }
echo     setSearch^(key, value^) { return searchCache.set^(key, value^); }
echo     invalidatePattern^(pattern^) {
echo         const keys = mainCache.keys^(^);
echo         keys.forEach^(key =^> { if ^(key.includes^(pattern^)^) mainCache.del^(key^); }^);
echo     }
echo     flush^(^) {
echo         mainCache.flushAll^(^);
echo         statsCache.flushAll^(^);
echo         sessionCache.flushAll^(^);
echo         searchCache.flushAll^(^);
echo     }
echo     getStatistics^(^) {
echo         return {
echo             main: mainCache.getStats^(^),
echo             stats: statsCache.getStats^(^),
echo             session: sessionCache.getStats^(^),
echo             search: searchCache.getStats^(^)
echo         };
echo     }
echo     async remember^(key, ttl, callback^) {
echo         const cached = this.get^(key^);
echo         if ^(cached !== undefined^) return cached;
echo         const value = await callback^(^);
echo         this.set^(key, value, ttl^);
echo         return value;
echo     }
echo     async rememberStats^(key, ttl, callback^) {
echo         const cached = this.getStats^(key^);
echo         if ^(cached !== undefined^) return cached;
echo         const value = await callback^(^);
echo         this.setStats^(key, value, ttl^);
echo         return value;
echo     }
echo }
echo.
echo module.exports = new CacheManager^(^);
) > config\cache.js

echo ✓ config/cache.js creado

REM ============================================
REM config/constants.js
REM ============================================
echo Creando config/constants.js...
(
echo module.exports = {
echo     LIMITS: {
echo         MAX_SEARCH_RESULTS: 100,
echo         MAX_BATCH_SIZE: 1000,
echo         MAX_EXPORT_SIZE: 50000,
echo         DEFAULT_PAGE_SIZE: 50
echo     },
echo     CACHE_TTL: {
echo         STATS: 600,
echo         SEARCH: 180,
echo         SESSION: 3600,
echo         LISTS: 300,
echo         REPORTS: 900
echo     },
echo     TABLES: {
echo         USERS: 'usuarios',
echo         SESSIONS: 'sesiones',
echo         STATES: 'estados',
echo         DELEGATIONS: 'delegaciones',
echo         COLONIES: 'colonias',
echo         FAMILIES: 'familias',
echo         PERSONS: 'personas',
echo         AUDIT: 'auditoria_accesos'
echo     },
echo     VIEWS: {
echo         STATES_SUMMARY: 'vista_resumen_estados',
echo         DELEGATIONS_SUMMARY: 'vista_resumen_delegaciones',
echo         COLONIES_SUMMARY: 'vista_resumen_colonias',
echo         FAMILIES_COMPLETE: 'vista_familias_completa'
echo     },
echo     ERRORS: {
echo         NOT_FOUND: 'Registro no encontrado',
echo         ALREADY_EXISTS: 'El registro ya existe',
echo         INVALID_DATA: 'Datos inválidos',
echo         UNAUTHORIZED: 'No autorizado',
echo         INTERNAL_ERROR: 'Error interno del servidor'
echo     }
echo };
) > config\constants.js

echo ✓ config/constants.js creado

echo.
echo ✅ Todos los archivos de configuración creados
echo.
echo Presiona cualquier tecla para continuar con los archivos faltantes...
pause >nul

echo.
echo Descarga los archivos CryptoService.js y BaseService.js desde:
echo https://github.com/AshuraRhoAias/sf1s1f3s13f51s35f135f
echo.
echo Y cópialos manualmente a:
echo %CD%\services\base\
echo.
pause

exit /b 0
