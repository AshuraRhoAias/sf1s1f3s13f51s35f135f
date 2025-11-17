-- ============================================
-- SISTEMA ELECTORAL OPTIMIZADO v2.0
-- Script de Base de Datos Simplificado
-- ============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS dbserver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dbserver;

-- ==================== TABLA: estados ====================
CREATE TABLE IF NOT EXISTS estados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE COMMENT 'Ej: CDMX, EDOMEX',
    nombre VARCHAR(100) NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_codigo (codigo),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLA: delegaciones ====================
CREATE TABLE IF NOT EXISTS delegaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_estado INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estado) REFERENCES estados(id) ON DELETE CASCADE,
    INDEX idx_estado (id_estado),
    INDEX idx_nombre (nombre),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLA: colonias ====================
CREATE TABLE IF NOT EXISTS colonias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_delegacion INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(10),
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_delegacion) REFERENCES delegaciones(id) ON DELETE CASCADE,
    INDEX idx_delegacion (id_delegacion),
    INDEX idx_nombre (nombre),
    INDEX idx_cp (codigo_postal),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLA: usuarios ====================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password TEXT NOT NULL COMMENT 'Hash bcrypt',
    rol ENUM('ADMIN','COORDINADOR','CAPTURISTA') DEFAULT 'CAPTURISTA',
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    intentos_fallidos INT DEFAULT 0,
    bloqueado_hasta TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_activo (activo),
    INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLA: sesiones ====================
CREATE TABLE IF NOT EXISTS sesiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token_jti VARCHAR(255) NOT NULL UNIQUE,
    refresh_token_jti VARCHAR(255) UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_token_jti (token_jti),
    INDEX idx_refresh_token (refresh_token_jti),
    INDEX idx_is_active (is_active),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLA: familias ====================
CREATE TABLE IF NOT EXISTS familias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_colonia INT NOT NULL,
    nombre_familia VARCHAR(255) NOT NULL COMMENT 'Apellido familiar',
    direccion_encrypted TEXT NOT NULL,
    direccion_iv VARCHAR(32) NOT NULL COMMENT 'IV para AES-256-GCM',
    direccion_tag VARCHAR(32) NOT NULL COMMENT 'Auth tag para AES-256-GCM',
    estado ENUM('ACTIVA','INACTIVA') DEFAULT 'ACTIVA',
    notas TEXT,
    id_registro INT NOT NULL COMMENT 'Usuario que registró',
    id_ultima_modificacion INT COMMENT 'Usuario que modificó',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_colonia) REFERENCES colonias(id),
    FOREIGN KEY (id_registro) REFERENCES usuarios(id),
    FOREIGN KEY (id_ultima_modificacion) REFERENCES usuarios(id),
    INDEX idx_colonia (id_colonia),
    INDEX idx_nombre_familia (nombre_familia),
    INDEX idx_estado (estado),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLA: personas ====================
CREATE TABLE IF NOT EXISTS personas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_familia INT NOT NULL,
    nombre_encrypted TEXT NOT NULL,
    nombre_iv VARCHAR(32) NOT NULL,
    nombre_tag VARCHAR(32) NOT NULL,
    curp_encrypted TEXT NOT NULL,
    curp_iv VARCHAR(32) NOT NULL,
    curp_tag VARCHAR(32) NOT NULL,
    telefono_encrypted TEXT,
    telefono_iv VARCHAR(32),
    telefono_tag VARCHAR(32),
    edad INT NOT NULL,
    genero ENUM('MASCULINO','FEMENINO','OTRO') NOT NULL,
    fecha_nacimiento DATE,
    rol_familia ENUM('JEFE DE FAMILIA','MIEMBRO') DEFAULT 'MIEMBRO',
    puede_votar TINYINT(1) GENERATED ALWAYS AS (edad >= 18) STORED,
    cumplira_18_proximo_anio TINYINT(1) GENERATED ALWAYS AS (edad = 17) STORED,
    cumplira_18_en_2_anios TINYINT(1) GENERATED ALWAYS AS (edad = 16) STORED,
    activo TINYINT(1) DEFAULT 1,
    notas TEXT,
    id_registro INT NOT NULL COMMENT 'Usuario que registró',
    id_ultima_modificacion INT COMMENT 'Usuario que modificó',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_familia) REFERENCES familias(id) ON DELETE CASCADE,
    FOREIGN KEY (id_registro) REFERENCES usuarios(id),
    FOREIGN KEY (id_ultima_modificacion) REFERENCES usuarios(id),
    INDEX idx_familia (id_familia),
    INDEX idx_edad (edad),
    INDEX idx_genero (genero),
    INDEX idx_rol (rol_familia),
    INDEX idx_puede_votar (puede_votar),
    INDEX idx_activo (activo),
    INDEX idx_familia_activo (id_familia, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLA: auditoria_accesos ====================
CREATE TABLE IF NOT EXISTS auditoria_accesos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    accion ENUM('LOGIN','LOGOUT','LOGIN_FALLIDO','CREAR','EDITAR','ELIMINAR','CONSULTAR','EXPORTAR') NOT NULL,
    tabla_afectada VARCHAR(50),
    id_registro_afectado INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    detalles JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
    INDEX idx_usuario (id_usuario),
    INDEX idx_accion (accion),
    INDEX idx_tabla (tabla_afectada),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== VISTAS OPTIMIZADAS ====================

-- Vista: Resumen de Estados
CREATE OR REPLACE VIEW vista_resumen_estados AS
SELECT
    e.id,
    e.codigo,
    e.nombre,
    COUNT(DISTINCT d.id) as total_delegaciones,
    COUNT(DISTINCT c.id) as total_colonias,
    COUNT(DISTINCT f.id) as total_familias,
    COUNT(DISTINCT p.id) as total_personas,
    SUM(CASE WHEN p.puede_votar = 1 THEN 1 ELSE 0 END) as total_votantes,
    SUM(CASE WHEN p.genero = 'MASCULINO' AND p.activo = 1 THEN 1 ELSE 0 END) as total_masculino,
    SUM(CASE WHEN p.genero = 'FEMENINO' AND p.activo = 1 THEN 1 ELSE 0 END) as total_femenino
FROM estados e
LEFT JOIN delegaciones d ON e.id = d.id_estado AND d.activo = 1
LEFT JOIN colonias c ON d.id = c.id_delegacion AND c.activo = 1
LEFT JOIN familias f ON c.id = f.id_colonia AND f.estado = 'ACTIVA'
LEFT JOIN personas p ON f.id = p.id_familia AND p.activo = 1
WHERE e.activo = 1
GROUP BY e.id, e.codigo, e.nombre;

-- Vista: Resumen de Delegaciones
CREATE OR REPLACE VIEW vista_resumen_delegaciones AS
SELECT
    d.id,
    d.nombre as delegacion,
    e.nombre as estado,
    e.codigo as estado_codigo,
    COUNT(DISTINCT c.id) as total_colonias,
    COUNT(DISTINCT f.id) as total_familias,
    COUNT(DISTINCT p.id) as total_personas,
    SUM(CASE WHEN p.puede_votar = 1 THEN 1 ELSE 0 END) as total_votantes
FROM delegaciones d
JOIN estados e ON d.id_estado = e.id
LEFT JOIN colonias c ON d.id = c.id_delegacion AND c.activo = 1
LEFT JOIN familias f ON c.id = f.id_colonia AND f.estado = 'ACTIVA'
LEFT JOIN personas p ON f.id = p.id_familia AND p.activo = 1
WHERE d.activo = 1
GROUP BY d.id, d.nombre, e.nombre, e.codigo;

-- Vista: Familias Completas
CREATE OR REPLACE VIEW vista_familias_completa AS
SELECT
    f.id,
    f.nombre_familia,
    f.direccion_encrypted,
    f.direccion_iv,
    f.direccion_tag,
    f.estado,
    f.created_at,
    c.nombre as colonia,
    c.codigo_postal,
    d.nombre as delegacion,
    e.nombre as estado_nombre,
    e.codigo as estado_codigo,
    u.nombre as registrado_por,
    COUNT(p.id) as total_miembros,
    SUM(CASE WHEN p.puede_votar = 1 THEN 1 ELSE 0 END) as total_votantes
FROM familias f
JOIN colonias c ON f.id_colonia = c.id
JOIN delegaciones d ON c.id_delegacion = d.id
JOIN estados e ON d.id_estado = e.id
LEFT JOIN usuarios u ON f.id_registro = u.id
LEFT JOIN personas p ON f.id = p.id_familia AND p.activo = 1
GROUP BY f.id, f.nombre_familia, f.direccion_encrypted, f.direccion_iv,
         f.direccion_tag, f.estado, f.created_at, c.nombre, c.codigo_postal,
         d.nombre, e.nombre, e.codigo, u.nombre;

-- ==================== DATOS DE EJEMPLO ====================

-- Estados de ejemplo (México)
INSERT IGNORE INTO estados (codigo, nombre) VALUES
('CDMX', 'Ciudad de México'),
('MEX', 'Estado de México'),
('JAL', 'Jalisco'),
('NL', 'Nuevo León');

-- Delegaciones de ejemplo (CDMX)
INSERT IGNORE INTO delegaciones (id_estado, nombre)
SELECT id, 'Iztapalapa' FROM estados WHERE codigo = 'CDMX' LIMIT 1;

INSERT IGNORE INTO delegaciones (id_estado, nombre)
SELECT id, 'Gustavo A. Madero' FROM estados WHERE codigo = 'CDMX' LIMIT 1;

-- Colonias de ejemplo
INSERT IGNORE INTO colonias (id_delegacion, nombre, codigo_postal)
SELECT id, 'Santa Cruz Meyehualco', '09290' FROM delegaciones WHERE nombre = 'Iztapalapa' LIMIT 1;

INSERT IGNORE INTO colonias (id_delegacion, nombre, codigo_postal)
SELECT id, 'Lindavista', '07300' FROM delegaciones WHERE nombre = 'Gustavo A. Madero' LIMIT 1;

-- ==================== CONFIGURACIONES FINALES ====================

-- Configurar variables del servidor
SET GLOBAL max_connections = 500;
SET GLOBAL max_allowed_packet = 67108864; -- 64MB
SET GLOBAL innodb_buffer_pool_size = 2147483648; -- 2GB

-- Optimizar tablas
OPTIMIZE TABLE personas;
OPTIMIZE TABLE familias;
OPTIMIZE TABLE colonias;

-- Analizar tablas
ANALYZE TABLE personas;
ANALYZE TABLE familias;
ANALYZE TABLE usuarios;
ANALYZE TABLE sesiones;

-- ==================== VERIFICACIÓN ====================

SELECT
    'Base de datos creada exitosamente' as resultado,
    (SELECT COUNT(*) FROM estados) as estados_insertados,
    (SELECT COUNT(*) FROM delegaciones) as delegaciones_insertadas,
    (SELECT COUNT(*) FROM colonias) as colonias_insertadas;

-- ==================== FIN ====================
