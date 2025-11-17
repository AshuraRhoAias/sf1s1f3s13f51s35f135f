#!/bin/bash

# ================================================================
# 🚀 INSTALADOR DEL SISTEMA ELECTORAL V2.0
# ================================================================
# Script autónomo que copia y configura todo el sistema
# ================================================================

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "================================================================"
echo "🚀 INSTALADOR DEL SISTEMA ELECTORAL V2.0"
echo "================================================================"
echo ""

# Verificar que archivos_sistema existe
if [ ! -d "archivos_sistema" ]; then
    echo -e "${RED}✗ Error: No se encuentra el directorio 'archivos_sistema'${NC}"
    echo "Este script debe ejecutarse desde el directorio raíz del repositorio."
    exit 1
fi

# Nombre del nuevo directorio
INSTALL_DIR="sistema_electoral_produccion"

# Preguntar si desea continuar
echo -e "${YELLOW}Se creará el directorio: $INSTALL_DIR${NC}"
echo -n "¿Desea continuar? (s/n): "
read -r respuesta

if [ "$respuesta" != "s" ] && [ "$respuesta" != "S" ]; then
    echo "Instalación cancelada."
    exit 0
fi

echo ""
echo -e "${BLUE}📁 Creando directorio de instalación...${NC}"

# Eliminar si ya existe
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠️  El directorio $INSTALL_DIR ya existe. Se eliminará.${NC}"
    rm -rf "$INSTALL_DIR"
fi

# Copiar todo archivos_sistema
cp -r archivos_sistema "$INSTALL_DIR"

echo -e "${GREEN}✓ Archivos copiados${NC}"

# Entrar al directorio
cd "$INSTALL_DIR"

# Contar archivos
TOTAL_FILES=$(find . -type f | wc -l)

echo ""
echo -e "${BLUE}⚙️  Configurando sistema...${NC}"

# Crear .env si no existe
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Archivo .env creado desde .env.example${NC}"
    fi
fi

# Verificar estructura de directorios
echo -e "${BLUE}🔍 Verificando estructura...${NC}"

REQUIRED_DIRS=("config" "middleware" "routes" "controllers" "services" "services/base")

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        count=$(find "$dir" -name "*.js" 2>/dev/null | wc -l)
        echo -e "${GREEN}✓ $dir/ - $count archivos${NC}"
    else
        echo -e "${RED}✗ Falta directorio: $dir${NC}"
    fi
done

# Verificar archivos críticos
echo ""
echo -e "${BLUE}🔍 Verificando archivos críticos...${NC}"

CRITICAL_FILES=(
    "package.json"
    "server.js"
    "cluster.js"
    "config/database.js"
    "config/cache.js"
    "config/constants.js"
    "middleware/auth.middleware.js"
    "middleware/rateLimiter.middleware.js"
    "services/base/CryptoService.js"
    "services/base/BaseService.js"
)

MISSING_COUNT=0

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ FALTA: $file${NC}"
        ((MISSING_COUNT++))
    fi
done

# Verificar servicios
echo ""
echo -e "${BLUE}📦 Servicios disponibles:${NC}"
find services -name "*.service.js" -type f 2>/dev/null | while read -r service; do
    echo -e "${GREEN}  ✓ $(basename "$service")${NC}"
done

# Verificar controladores
echo ""
echo -e "${BLUE}🎮 Controladores disponibles:${NC}"
find controllers -name "*.controller.js" -type f 2>/dev/null | while read -r controller; do
    echo -e "${GREEN}  ✓ $(basename "$controller")${NC}"
done

# Verificar rutas
echo ""
echo -e "${BLUE}🛣️  Rutas disponibles:${NC}"
find routes -name "*.routes.js" -type f 2>/dev/null | while read -r route; do
    echo -e "${GREEN}  ✓ $(basename "$route")${NC}"
done

# Instrucciones finales
echo ""
echo -e "${GREEN}================================================================"
echo "✓ INSTALACIÓN COMPLETADA"
echo "================================================================"
echo -e "Total de archivos: $TOTAL_FILES"

if [ $MISSING_COUNT -gt 0 ]; then
    echo -e "${RED}Archivos críticos faltantes: $MISSING_COUNT${NC}"
else
    echo -e "${GREEN}✓ Todos los archivos críticos presentes${NC}"
fi

echo ""
echo -e "${YELLOW}📋 SIGUIENTE PASOS:${NC}"
echo ""
echo "1. Entrar al directorio:"
echo -e "   ${BLUE}cd $INSTALL_DIR${NC}"
echo ""
echo "2. Configurar la base de datos:"
echo -e "   ${BLUE}   - Editar archivo .env con tus credenciales MySQL${NC}"
echo -e "   ${BLUE}   - Importar ../dbserver_completo_32_estados.sql a MySQL${NC}"
echo ""
echo "3. Instalar dependencias:"
echo -e "   ${BLUE}npm install${NC}"
echo ""
echo "4. Iniciar el servidor:"
echo -e "   ${BLUE}npm start${NC}          # Modo producción"
echo -e "   ${BLUE}npm run dev${NC}        # Modo desarrollo"
echo -e "   ${BLUE}npm run cluster${NC}    # Modo cluster (todos los CPUs)"
echo ""
echo -e "${GREEN}================================================================${NC}"
echo ""

# Volver al directorio original
cd ..

echo -e "${YELLOW}Sistema instalado en: $(pwd)/$INSTALL_DIR${NC}"
echo ""
