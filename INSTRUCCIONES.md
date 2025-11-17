# 🚀 Sistema Electoral Optimizado v2.0 - Instalación Completa

## 📋 Instrucciones de Instalación

### ✅ Requisitos Previos

Antes de ejecutar el instalador, asegúrate de tener:

1. **Node.js 18 o superior**
   - Descargar de: https://nodejs.org/
   - Verificar instalación: `node --version`
   - Debe mostrar: v18.0.0 o superior

2. **MySQL 8.0 o superior**
   - Descargar de: https://dev.mysql.com/downloads/mysql/
   - O usar XAMPP/WAMP que incluye MySQL
   - El servicio MySQL debe estar corriendo

3. **npm (incluido con Node.js)**
   - Verificar instalación: `npm --version`

---

## 🎯 Instalación Rápida (3 Pasos)

### PASO 1: Ejecutar el Instalador Automático

1. Descarga el archivo `GENERAR_SISTEMA.bat`
2. Haz doble clic en `GENERAR_SISTEMA.bat`
3. Espera a que se complete la instalación (3-5 minutos)

El instalador hará automáticamente:
- ✅ Crear estructura de carpetas
- ✅ Generar todos los archivos del proyecto
- ✅ Instalar dependencias de Node.js
- ✅ Configurar el sistema

### PASO 2: Configurar la Base de Datos

#### Opción A: Usando MySQL Workbench

1. Abre MySQL Workbench
2. Conecta a tu servidor local
3. Ejecuta el siguiente SQL:

```sql
CREATE DATABASE dbserver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dbserver;
```

4. Ve a `File > Run SQL Script`
5. Selecciona el archivo `dbserver.sql` (descárgalo del repositorio)
6. Ejecuta el script

#### Opción B: Usando phpMyAdmin (XAMPP/WAMP)

1. Abre phpMyAdmin: http://localhost/phpmyadmin
2. Click en "Nuevo" para crear una base de datos
3. Nombre: `dbserver`
4. Cotejamiento: `utf8mb4_unicode_ci`
5. Click en "Importar"
6. Selecciona `dbserver.sql`
7. Click en "Continuar"

#### Opción C: Línea de Comandos

```bash
mysql -u root -p < dbserver.sql
```

### PASO 3: Configurar Variables de Entorno

1. Abre el archivo `.env` en el editor de texto
2. Configura tus credenciales de MySQL:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_NAME=dbserver
```

3. **⚠️ IMPORTANTE - Seguridad:**

Cambia las siguientes claves en producción:

```env
MASTER_PHRASE=TuFraseMaestraUnicaDe32CaracteresOMas
JWT_SECRET=TuSecretoJWTDe32CaracteresOMasParaProduccion
JWT_REFRESH_SECRET=OtroSecretoJWTDiferenteDe32Caracteres
```

**Generar claves seguras:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚀 Iniciar el Sistema

### Modo Normal (Desarrollo)

```bash
cd electoral-system-optimized
npm start
```

### Modo Desarrollo (Auto-restart)

```bash
npm run dev
```

### Modo Cluster (Producción - Recomendado)

```bash
npm run cluster
```

**Ventajas del modo cluster:**
- Usa todos los núcleos de tu CPU
- Soporta 200+ usuarios por núcleo
- Auto-reinicio si un worker falla
- Load balancing automático

---

## 🌐 Acceder al Sistema

Una vez iniciado, accede a:

- **Página principal:** http://localhost:3002
- **Health check:** http://localhost:3002/health
- **API Auth:** http://localhost:3002/api/auth
- **API Electoral:** http://localhost:3002/api/electoral

---

## 📊 Verificar Instalación

### 1. Health Check

Abre en tu navegador:
```
http://localhost:3002/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "uptime": 10.5,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "cache": {
    "main": 0,
    "stats": 0,
    "session": 0,
    "search": 0
  },
  "memory": {
    "used": "45 MB",
    "total": "128 MB"
  }
}
```

### 2. Registrar Primer Usuario

**Request:**
```bash
POST http://localhost:3002/api/auth/register
Content-Type: application/json

{
  "nombre": "Administrador",
  "email": "admin@example.com",
  "password": "Admin123456!"
}
```

**Response:**
```json
{
  "success": true,
  "userId": 1
}
```

### 3. Login

**Request:**
```bash
POST http://localhost:3002/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin123456!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "nombre": "Administrador",
    "email": "admin@example.com"
  }
}
```

### 4. Obtener Estadísticas

**Request:**
```bash
GET http://localhost:3002/api/electoral/stats
Authorization: Bearer TU_TOKEN_AQUI
```

---

## 🔧 Solución de Problemas

### Error: "Pool no inicializado"

**Causa:** MySQL no está corriendo o credenciales incorrectas

**Solución:**
1. Verifica que MySQL esté corriendo
2. Verifica las credenciales en `.env`
3. Prueba la conexión: `mysql -u root -p`

### Error: "Cannot find module 'express'"

**Causa:** Dependencias no instaladas

**Solución:**
```bash
cd electoral-system-optimized
npm install
```

### Error: "Port 3002 already in use"

**Causa:** Puerto ocupado

**Solución:**
1. Cambia el puerto en `.env`: `PORT=3003`
2. O mata el proceso: `netstat -ano | findstr :3002`

### Error: "Credenciales inválidas" al login

**Causa:** Usuario no existe o password incorrecta

**Solución:**
1. Verifica que el registro fue exitoso
2. Usa exactamente la misma password
3. Revisa la tabla `usuarios` en MySQL

---

## 📁 Estructura del Proyecto

```
electoral-system-optimized/
├── config/
│   ├── database.js          # Configuración de pools MySQL
│   ├── cache.js             # Sistema de cache en memoria
│   └── constants.js         # Constantes del sistema
├── middleware/
│   ├── auth.middleware.js   # Validación de JWT
│   └── rateLimiter.middleware.js  # Rate limiting
├── services/
│   ├── base/
│   │   ├── BaseService.js   # Servicio base reutilizable
│   │   └── CryptoService.js # Cifrado de 5 capas
│   ├── jwt.service.js
│   ├── auth.service.js
│   └── electoral.service.js
├── controllers/
│   ├── auth.controller.js
│   └── electoral.controller.js
├── routes/
│   ├── auth.routes.js
│   └── electoral.routes.js
├── logs/                    # Logs del sistema
├── .env                     # Variables de entorno
├── package.json
├── server.js                # Servidor principal
└── cluster.js               # Modo cluster
```

---

## ⚙️ Configuración Avanzada

### Cache

Ajusta los tiempos de cache en `.env`:

```env
CACHE_TTL_STATS=600      # Estadísticas (10 min)
CACHE_TTL_SEARCH=180     # Búsquedas (3 min)
CACHE_TTL_SESSION=3600   # Sesiones (1 hora)
CACHE_TTL_LISTS=300      # Listas (5 min)
```

### Pool de Conexiones

Para más usuarios concurrentes, ajusta en `config/database.js`:

```javascript
connectionLimit: 150,  // Aumentar para más usuarios
maxIdle: 75,          // Conexiones idle
```

### Rate Limiting

Ajusta límites en `middleware/rateLimiter.middleware.js`:

```javascript
authLimiter: createLimiter(10, 15),    // 10 req cada 15 min
readLimiter: createLimiter(100, 1),    // 100 req por minuto
writeLimiter: createLimiter(20, 1)     // 20 req por minuto
```

---

## 🛡️ Seguridad

### Claves de Cifrado

**NUNCA compartas estas claves:**

```env
MASTER_PHRASE=...    # Frase maestra para cifrado
MASTER_SALT=...      # Salt para derivación
JWT_SECRET=...       # Secret para tokens
```

### Backups

**Backup de base de datos (diario recomendado):**

```bash
mysqldump -u root -p dbserver > backup_$(date +%Y%m%d).sql
```

**Backup de archivos:**

```bash
xcopy electoral-system-optimized backup_proyecto /E /I /H
```

### Usuarios

Crear usuarios con diferentes roles:

```sql
INSERT INTO usuarios (nombre, email, password, rol)
VALUES ('Admin', 'admin@example.com', 'hashed_password', 'ADMIN');
```

Roles disponibles:
- `ADMIN` - Acceso completo
- `COORDINADOR` - Gestión de datos
- `CAPTURISTA` - Solo captura

---

## 📈 Optimización para Producción

### 1. Usar HTTPS

Configurar reverse proxy con nginx:

```nginx
server {
    listen 443 ssl;
    server_name tudominio.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. PM2 para Auto-restart

```bash
npm install -g pm2
pm2 start server.js -i max
pm2 save
pm2 startup
```

### 3. Logs Rotativos

Instalar winston:

```bash
npm install winston winston-daily-rotate-file
```

### 4. Monitoreo

Opciones recomendadas:
- PM2 Monitor
- New Relic
- Datadog
- Prometheus + Grafana

---

## 🧪 Pruebas de Rendimiento

Ejecutar pruebas de carga:

```bash
# Prueba de carga (200 usuarios)
npm run test

# Prueba de estrés
node performance-test.js stress

# Prueba de cifrado
node performance-test.js encryption

# Todas las pruebas
node performance-test.js all
```

---

## 📞 Soporte

Para dudas o problemas:

1. Revisa esta documentación
2. Verifica los logs en `logs/app.log`
3. Revisa la consola del servidor
4. Contacta al desarrollador

---

## 📄 Licencia

Sistema propietario - Todos los derechos reservados

---

## 👨‍💻 Desarrollado por

**Antonio** - Instituto de Investigaciones Sociales, UNAM

---

**⚡ Sistema optimizado para 200+ usuarios concurrentes y 15M+ registros cifrados ⚡**
