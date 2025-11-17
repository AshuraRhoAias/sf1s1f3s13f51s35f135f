@echo off
chcp 65001 >nul
color 0A
title Sistema Electoral Optimizado v2.0 - Menú Principal

:MENU
cls
echo.
echo ═══════════════════════════════════════════════════════════════
echo    SISTEMA ELECTORAL OPTIMIZADO v2.0 - MENÚ PRINCIPAL
echo ═══════════════════════════════════════════════════════════════
echo.
echo  📁 Ubicación: %CD%\electoral-system-optimized
echo  🚀 Node.js requerido: v18.0.0+
echo  💾 MySQL requerido: v8.0.0+
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo  OPCIONES DISPONIBLES:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo  1. 🔧 Verificar Requisitos del Sistema
echo  2. 🚀 Iniciar Servidor (Modo Normal)
echo  3. 🔄 Iniciar Servidor (Modo Desarrollo - Auto-restart)
echo  4. ⚡ Iniciar Servidor (Modo Cluster - Producción)
echo  5. 🧪 Ejecutar Pruebas de Rendimiento
echo  6. 📊 Ver Estado del Sistema (Health Check)
echo  7. 💾 Crear Backup de Base de Datos
echo  8. 🔄 Actualizar Dependencias
echo  9. 🧹 Limpiar Cache y Logs
echo  10. 📖 Ver Documentación
echo  0. ❌ Salir
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
set /p opcion="Selecciona una opción [0-10]: "

if "%opcion%"=="1" goto VERIFICAR
if "%opcion%"=="2" goto START_NORMAL
if "%opcion%"=="3" goto START_DEV
if "%opcion%"=="4" goto START_CLUSTER
if "%opcion%"=="5" goto RUN_TESTS
if "%opcion%"=="6" goto HEALTH_CHECK
if "%opcion%"=="7" goto BACKUP
if "%opcion%"=="8" goto UPDATE_DEPS
if "%opcion%"=="9" goto CLEAN
if "%opcion%"=="10" goto DOCS
if "%opcion%"=="0" goto EXIT

echo.
echo ❌ Opción inválida
timeout /t 2 >nul
goto MENU

:VERIFICAR
cls
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🔧 VERIFICANDO REQUISITOS DEL SISTEMA
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js NO instalado
    echo    Descarga desde: https://nodejs.org/
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js instalado: %NODE_VERSION%
)

echo.
echo Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm NO instalado
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm instalado: v%NPM_VERSION%
)

echo.
echo Verificando MySQL...
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  MySQL no encontrado en PATH
    echo    Si usas XAMPP/WAMP, asegúrate que esté corriendo
) else (
    for /f "tokens=*" %%i in ('mysql --version') do set MYSQL_VERSION=%%i
    echo ✅ MySQL instalado: %MYSQL_VERSION%
)

echo.
echo Verificando proyecto...
if exist "electoral-system-optimized\package.json" (
    echo ✅ Proyecto generado correctamente
) else (
    echo ❌ Proyecto NO generado
    echo    Ejecuta primero GENERAR_SISTEMA.bat
)

echo.
echo Verificando dependencias...
if exist "electoral-system-optimized\node_modules" (
    echo ✅ Dependencias instaladas
) else (
    echo ❌ Dependencias NO instaladas
    echo    Ejecuta: npm install
)

echo.
echo Verificando configuración...
if exist "electoral-system-optimized\.env" (
    echo ✅ Archivo .env existe
) else (
    echo ❌ Archivo .env NO existe
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
pause
goto MENU

:START_NORMAL
cls
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🚀 INICIANDO SERVIDOR - MODO NORMAL
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
cd electoral-system-optimized
npm start
pause
goto MENU

:START_DEV
cls
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🔄 INICIANDO SERVIDOR - MODO DESARROLLO
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo ⚡ Auto-restart habilitado (nodemon)
echo.
cd electoral-system-optimized
npm run dev
pause
goto MENU

:START_CLUSTER
cls
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ⚡ INICIANDO SERVIDOR - MODO CLUSTER (PRODUCCIÓN)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 💪 Usando todos los núcleos CPU disponibles
echo.
cd electoral-system-optimized
npm run cluster
pause
goto MENU

:RUN_TESTS
cls
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🧪 PRUEBAS DE RENDIMIENTO
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Selecciona el tipo de prueba:
echo.
echo  1. Prueba de Carga (200 usuarios)
echo  2. Prueba de Estrés (incremental)
echo  3. Prueba de Cifrado
echo  4. Todas las pruebas
echo  0. Volver al menú
echo.
set /p test_option="Opción: "

cd electoral-system-optimized

if "%test_option%"=="1" (
    npm run test
) else if "%test_option%"=="2" (
    node performance-test.js stress
) else if "%test_option%"=="3" (
    node performance-test.js encryption
) else if "%test_option%"=="4" (
    node performance-test.js all
) else if "%test_option%"=="0" (
    goto MENU
)

pause
goto MENU

:HEALTH_CHECK
cls
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 📊 VERIFICANDO ESTADO DEL SISTEMA
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Consultando http://localhost:3002/health...
echo.
curl -s http://localhost:3002/health 2>nul
if errorlevel 1 (
    echo.
    echo ❌ Servidor no está corriendo o no responde
    echo    Inicia el servidor primero (opciones 2, 3 o 4)
) else (
    echo.
    echo ✅ Servidor respondiendo correctamente
)
echo.
pause
goto MENU

:BACKUP
cls
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 💾 CREAR BACKUP DE BASE DE DATOS
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
set BACKUP_FILE=backup_dbserver_%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%
echo Creando backup en: %BACKUP_FILE%
echo.
mysqldump -u root -p dbserver > %BACKUP_FILE%
if errorlevel 1 (
    echo ❌ Error al crear backup
) else (
    echo ✅ Backup creado exitosamente: %BACKUP_FILE%
)
echo.
pause
goto MENU

:UPDATE_DEPS
cls
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🔄 ACTUALIZANDO DEPENDENCIAS
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
cd electoral-system-optimized
echo Actualizando paquetes...
npm update
echo.
echo ✅ Dependencias actualizadas
echo.
pause
goto MENU

:CLEAN
cls
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🧹 LIMPIANDO CACHE Y LOGS
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
cd electoral-system-optimized

echo Limpiando logs...
if exist logs\*.log (
    del /q logs\*.log
    echo ✅ Logs eliminados
) else (
    echo ℹ️  No hay logs para limpiar
)

echo.
echo Limpiando cache del servidor...
curl -X POST http://localhost:3002/api/cache/flush 2>nul
if errorlevel 1 (
    echo ℹ️  Servidor no está corriendo (cache se limpiará al reiniciar)
) else (
    echo ✅ Cache limpiado
)

echo.
echo ✅ Limpieza completada
echo.
pause
goto MENU

:DOCS
cls
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 📖 DOCUMENTACIÓN DISPONIBLE
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo  1. README.md - Guía rápida
echo  2. INSTRUCCIONES.md - Manual completo
echo  3. CHANGELOG.md - Historial de cambios
echo  0. Volver al menú
echo.
set /p doc_option="Selecciona documento a ver [0-3]: "

if "%doc_option%"=="1" (
    type README.md | more
) else if "%doc_option%"=="2" (
    type INSTRUCCIONES.md | more
) else if "%doc_option%"=="3" (
    type CHANGELOG.md | more
) else if "%doc_option%"=="0" (
    goto MENU
)

pause
goto MENU

:EXIT
cls
echo.
echo ═══════════════════════════════════════════════════════════════
echo    Gracias por usar Sistema Electoral Optimizado v2.0
echo ═══════════════════════════════════════════════════════════════
echo.
echo 👋 ¡Hasta pronto!
echo.
timeout /t 2 >nul
exit

REM ============================================
REM FIN DEL SCRIPT
REM ============================================
