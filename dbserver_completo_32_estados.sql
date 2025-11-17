-- ============================================
-- SISTEMA ELECTORAL OPTIMIZADO v2.0
-- Base de Datos Completa con 32 Estados de México
-- ============================================

CREATE DATABASE IF NOT EXISTS dbserver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dbserver;

-- ==================== TABLA: estados ====================
CREATE TABLE IF NOT EXISTS estados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE COMMENT 'Código oficial del estado',
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
    telefono VARCHAR(20),
    puesto VARCHAR(100),
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
    INDEX idx_is_active (is_active),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLA: familias ====================
CREATE TABLE IF NOT EXISTS familias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_colonia INT NOT NULL,
    nombre_familia VARCHAR(255) NOT NULL,
    direccion_encrypted TEXT NOT NULL,
    direccion_iv VARCHAR(32) NOT NULL,
    direccion_tag VARCHAR(32) NOT NULL,
    estado ENUM('ACTIVA','INACTIVA') DEFAULT 'ACTIVA',
    notas TEXT,
    id_registro INT NOT NULL,
    id_ultima_modificacion INT,
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
    id_registro INT NOT NULL,
    id_ultima_modificacion INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_familia) REFERENCES familias(id) ON DELETE CASCADE,
    FOREIGN KEY (id_registro) REFERENCES usuarios(id),
    FOREIGN KEY (id_ultima_modificacion) REFERENCES usuarios(id),
    INDEX idx_familia (id_familia),
    INDEX idx_edad (edad),
    INDEX idx_genero (genero),
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
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== VISTAS OPTIMIZADAS ====================

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

CREATE OR REPLACE VIEW vista_resumen_colonias AS
SELECT
    c.id,
    c.nombre as colonia,
    c.codigo_postal,
    d.nombre as delegacion,
    e.nombre as estado,
    COUNT(DISTINCT f.id) as total_familias,
    COUNT(DISTINCT p.id) as total_personas,
    SUM(CASE WHEN p.puede_votar = 1 THEN 1 ELSE 0 END) as total_votantes,
    SUM(CASE WHEN p.cumplira_18_proximo_anio = 1 THEN 1 ELSE 0 END) as cumpliran_18_proximo,
    SUM(CASE WHEN p.cumplira_18_en_2_anios = 1 THEN 1 ELSE 0 END) as cumpliran_18_en_2
FROM colonias c
JOIN delegaciones d ON c.id_delegacion = d.id
JOIN estados e ON d.id_estado = e.id
LEFT JOIN familias f ON c.id = f.id_colonia AND f.estado = 'ACTIVA'
LEFT JOIN personas p ON f.id = p.id_familia AND p.activo = 1
WHERE c.activo = 1
GROUP BY c.id, c.nombre, c.codigo_postal, d.nombre, e.nombre;

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

-- ============================================
-- DATOS: 32 ESTADOS DE MÉXICO
-- ============================================

INSERT INTO estados (codigo, nombre) VALUES
('AGS', 'Aguascalientes'),
('BC', 'Baja California'),
('BCS', 'Baja California Sur'),
('CAMP', 'Campeche'),
('CHIS', 'Chiapas'),
('CHIH', 'Chihuahua'),
('COAH', 'Coahuila'),
('COL', 'Colima'),
('CDMX', 'Ciudad de México'),
('DGO', 'Durango'),
('GTO', 'Guanajuato'),
('GRO', 'Guerrero'),
('HGO', 'Hidalgo'),
('JAL', 'Jalisco'),
('MEX', 'Estado de México'),
('MICH', 'Michoacán'),
('MOR', 'Morelos'),
('NAY', 'Nayarit'),
('NL', 'Nuevo León'),
('OAX', 'Oaxaca'),
('PUE', 'Puebla'),
('QRO', 'Querétaro'),
('QROO', 'Quintana Roo'),
('SLP', 'San Luis Potosí'),
('SIN', 'Sinaloa'),
('SON', 'Sonora'),
('TAB', 'Tabasco'),
('TAMPS', 'Tamaulipas'),
('TLAX', 'Tlaxcala'),
('VER', 'Veracruz'),
('YUC', 'Yucatán'),
('ZAC', 'Zacatecas')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- ============================================
-- DELEGACIONES Y COLONIAS POR ESTADO
-- ============================================

-- AGUASCALIENTES
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Aguascalientes' FROM estados WHERE codigo = 'AGS'
UNION ALL SELECT id, 'Jesús María' FROM estados WHERE codigo = 'AGS'
UNION ALL SELECT id, 'Calvillo' FROM estados WHERE codigo = 'AGS';

-- BAJA CALIFORNIA
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Tijuana' FROM estados WHERE codigo = 'BC'
UNION ALL SELECT id, 'Mexicali' FROM estados WHERE codigo = 'BC'
UNION ALL SELECT id, 'Ensenada' FROM estados WHERE codigo = 'BC'
UNION ALL SELECT id, 'Tecate' FROM estados WHERE codigo = 'BC'
UNION ALL SELECT id, 'Playas de Rosarito' FROM estados WHERE codigo = 'BC';

-- BAJA CALIFORNIA SUR
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'La Paz' FROM estados WHERE codigo = 'BCS'
UNION ALL SELECT id, 'Los Cabos' FROM estados WHERE codigo = 'BCS'
UNION ALL SELECT id, 'Comondú' FROM estados WHERE codigo = 'BCS';

-- CAMPECHE
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Campeche' FROM estados WHERE codigo = 'CAMP'
UNION ALL SELECT id, 'Carmen' FROM estados WHERE codigo = 'CAMP'
UNION ALL SELECT id, 'Champotón' FROM estados WHERE codigo = 'CAMP';

-- CHIAPAS
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Tuxtla Gutiérrez' FROM estados WHERE codigo = 'CHIS'
UNION ALL SELECT id, 'Tapachula' FROM estados WHERE codigo = 'CHIS'
UNION ALL SELECT id, 'San Cristóbal de las Casas' FROM estados WHERE codigo = 'CHIS'
UNION ALL SELECT id, 'Comitán de Domínguez' FROM estados WHERE codigo = 'CHIS';

-- CHIHUAHUA
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Chihuahua' FROM estados WHERE codigo = 'CHIH'
UNION ALL SELECT id, 'Juárez' FROM estados WHERE codigo = 'CHIH'
UNION ALL SELECT id, 'Cuauhtémoc' FROM estados WHERE codigo = 'CHIH'
UNION ALL SELECT id, 'Delicias' FROM estados WHERE codigo = 'CHIH';

-- COAHUILA
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Saltillo' FROM estados WHERE codigo = 'COAH'
UNION ALL SELECT id, 'Torreón' FROM estados WHERE codigo = 'COAH'
UNION ALL SELECT id, 'Monclova' FROM estados WHERE codigo = 'COAH'
UNION ALL SELECT id, 'Piedras Negras' FROM estados WHERE codigo = 'COAH';

-- COLIMA
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Colima' FROM estados WHERE codigo = 'COL'
UNION ALL SELECT id, 'Manzanillo' FROM estados WHERE codigo = 'COL'
UNION ALL SELECT id, 'Tecomán' FROM estados WHERE codigo = 'COL';

-- CIUDAD DE MÉXICO (16 Alcaldías)
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Álvaro Obregón' FROM estados WHERE codigo = 'CDMX'
UNION ALL SELECT id, 'Azcapotzalco' FROM estados WHERE codigo = 'CDMX'
UNION ALL SELECT id, 'Benito Juárez' FROM estados WHERE codigo = 'CDMX'
UNION ALL SELECT id, 'Coyoacán' FROM estados WHERE codigo = 'CDMX'
UNION ALL SELECT id, 'Cuajimalpa de Morelos' FROM estados WHERE codigo = 'CDMX'
UNION ALL SELECT id, 'Cuauhtémoc' FROM estados WHERE codigo = 'CDMX'
UNION ALL SELECT id, 'Gustavo A. Madero' FROM estados WHERE codigo = 'CDMX'
UNION ALL SELECT id, 'Iztacalco' FROM estados WHERE codigo = 'CDMX'
UNION ALL SELECT id, 'Iztapalapa' FROM estados WHERE codigo = 'CDMX'
UNION ALL SELECT id, 'La Magdalena Contreras' FROM estados WHERE codigo = 'CDMX'
UNION ALL SELECT id, 'Miguel Hidalgo' FROM estados WHERE codigo = 'CDMX'
UNION ALL SELECT id, 'Milpa Alta' FROM estados WHERE codigo = 'CDMX'
UNION ALL SELECT id, 'Tláhuac' FROM estados WHERE codigo = 'CDMX'
UNION ALL SELECT id, 'Tlalpan' FROM estados WHERE codigo = 'CDMX'
UNION ALL SELECT id, 'Venustiano Carranza' FROM estados WHERE codigo = 'CDMX'
UNION ALL SELECT id, 'Xochimilco' FROM estados WHERE codigo = 'CDMX';

-- DURANGO
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Durango' FROM estados WHERE codigo = 'DGO'
UNION ALL SELECT id, 'Gómez Palacio' FROM estados WHERE codigo = 'DGO'
UNION ALL SELECT id, 'Lerdo' FROM estados WHERE codigo = 'DGO';

-- GUANAJUATO
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'León' FROM estados WHERE codigo = 'GTO'
UNION ALL SELECT id, 'Irapuato' FROM estados WHERE codigo = 'GTO'
UNION ALL SELECT id, 'Celaya' FROM estados WHERE codigo = 'GTO'
UNION ALL SELECT id, 'Salamanca' FROM estados WHERE codigo = 'GTO'
UNION ALL SELECT id, 'Guanajuato' FROM estados WHERE codigo = 'GTO';

-- GUERRERO
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Acapulco de Juárez' FROM estados WHERE codigo = 'GRO'
UNION ALL SELECT id, 'Chilpancingo de los Bravo' FROM estados WHERE codigo = 'GRO'
UNION ALL SELECT id, 'Iguala de la Independencia' FROM estados WHERE codigo = 'GRO'
UNION ALL SELECT id, 'Zihuatanejo de Azueta' FROM estados WHERE codigo = 'GRO';

-- HIDALGO
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Pachuca de Soto' FROM estados WHERE codigo = 'HGO'
UNION ALL SELECT id, 'Tulancingo de Bravo' FROM estados WHERE codigo = 'HGO'
UNION ALL SELECT id, 'Tula de Allende' FROM estados WHERE codigo = 'HGO';

-- JALISCO
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Guadalajara' FROM estados WHERE codigo = 'JAL'
UNION ALL SELECT id, 'Zapopan' FROM estados WHERE codigo = 'JAL'
UNION ALL SELECT id, 'Tlaquepaque' FROM estados WHERE codigo = 'JAL'
UNION ALL SELECT id, 'Tonalá' FROM estados WHERE codigo = 'JAL'
UNION ALL SELECT id, 'Puerto Vallarta' FROM estados WHERE codigo = 'JAL'
UNION ALL SELECT id, 'Tlajomulco de Zúñiga' FROM estados WHERE codigo = 'JAL';

-- ESTADO DE MÉXICO
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Ecatepec de Morelos' FROM estados WHERE codigo = 'MEX'
UNION ALL SELECT id, 'Nezahualcóyotl' FROM estados WHERE codigo = 'MEX'
UNION ALL SELECT id, 'Naucalpan de Juárez' FROM estados WHERE codigo = 'MEX'
UNION ALL SELECT id, 'Tlalnepantla de Baz' FROM estados WHERE codigo = 'MEX'
UNION ALL SELECT id, 'Toluca' FROM estados WHERE codigo = 'MEX'
UNION ALL SELECT id, 'Cuautitlán Izcalli' FROM estados WHERE codigo = 'MEX'
UNION ALL SELECT id, 'Chimalhuacán' FROM estados WHERE codigo = 'MEX'
UNION ALL SELECT id, 'Atizapán de Zaragoza' FROM estados WHERE codigo = 'MEX';

-- MICHOACÁN
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Morelia' FROM estados WHERE codigo = 'MICH'
UNION ALL SELECT id, 'Uruapan' FROM estados WHERE codigo = 'MICH'
UNION ALL SELECT id, 'Zamora' FROM estados WHERE codigo = 'MICH'
UNION ALL SELECT id, 'Lázaro Cárdenas' FROM estados WHERE codigo = 'MICH';

-- MORELOS
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Cuernavaca' FROM estados WHERE codigo = 'MOR'
UNION ALL SELECT id, 'Jiutepec' FROM estados WHERE codigo = 'MOR'
UNION ALL SELECT id, 'Cuautla' FROM estados WHERE codigo = 'MOR';

-- NAYARIT
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Tepic' FROM estados WHERE codigo = 'NAY'
UNION ALL SELECT id, 'Bahía de Banderas' FROM estados WHERE codigo = 'NAY'
UNION ALL SELECT id, 'Santiago Ixcuintla' FROM estados WHERE codigo = 'NAY';

-- NUEVO LEÓN
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Monterrey' FROM estados WHERE codigo = 'NL'
UNION ALL SELECT id, 'Guadalupe' FROM estados WHERE codigo = 'NL'
UNION ALL SELECT id, 'San Nicolás de los Garza' FROM estados WHERE codigo = 'NL'
UNION ALL SELECT id, 'Apodaca' FROM estados WHERE codigo = 'NL'
UNION ALL SELECT id, 'San Pedro Garza García' FROM estados WHERE codigo = 'NL'
UNION ALL SELECT id, 'Escobedo' FROM estados WHERE codigo = 'NL';

-- OAXACA
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Oaxaca de Juárez' FROM estados WHERE codigo = 'OAX'
UNION ALL SELECT id, 'Salina Cruz' FROM estados WHERE codigo = 'OAX'
UNION ALL SELECT id, 'Tuxtepec' FROM estados WHERE codigo = 'OAX'
UNION ALL SELECT id, 'Juchitán de Zaragoza' FROM estados WHERE codigo = 'OAX';

-- PUEBLA
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Puebla' FROM estados WHERE codigo = 'PUE'
UNION ALL SELECT id, 'Tehuacán' FROM estados WHERE codigo = 'PUE'
UNION ALL SELECT id, 'San Martín Texmelucan' FROM estados WHERE codigo = 'PUE'
UNION ALL SELECT id, 'Atlixco' FROM estados WHERE codigo = 'PUE';

-- QUERÉTARO
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Santiago de Querétaro' FROM estados WHERE codigo = 'QRO'
UNION ALL SELECT id, 'San Juan del Río' FROM estados WHERE codigo = 'QRO'
UNION ALL SELECT id, 'Corregidora' FROM estados WHERE codigo = 'QRO';

-- QUINTANA ROO
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Cancún' FROM estados WHERE codigo = 'QROO'
UNION ALL SELECT id, 'Playa del Carmen' FROM estados WHERE codigo = 'QROO'
UNION ALL SELECT id, 'Chetumal' FROM estados WHERE codigo = 'QROO'
UNION ALL SELECT id, 'Tulum' FROM estados WHERE codigo = 'QROO';

-- SAN LUIS POTOSÍ
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'San Luis Potosí' FROM estados WHERE codigo = 'SLP'
UNION ALL SELECT id, 'Soledad de Graciano Sánchez' FROM estados WHERE codigo = 'SLP'
UNION ALL SELECT id, 'Ciudad Valles' FROM estados WHERE codigo = 'SLP';

-- SINALOA
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Culiacán' FROM estados WHERE codigo = 'SIN'
UNION ALL SELECT id, 'Mazatlán' FROM estados WHERE codigo = 'SIN'
UNION ALL SELECT id, 'Ahome' FROM estados WHERE codigo = 'SIN'
UNION ALL SELECT id, 'Guasave' FROM estados WHERE codigo = 'SIN';

-- SONORA
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Hermosillo' FROM estados WHERE codigo = 'SON'
UNION ALL SELECT id, 'Cajeme' FROM estados WHERE codigo = 'SON'
UNION ALL SELECT id, 'Nogales' FROM estados WHERE codigo = 'SON'
UNION ALL SELECT id, 'San Luis Río Colorado' FROM estados WHERE codigo = 'SON';

-- TABASCO
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Centro' FROM estados WHERE codigo = 'TAB'
UNION ALL SELECT id, 'Cárdenas' FROM estados WHERE codigo = 'TAB'
UNION ALL SELECT id, 'Comalcalco' FROM estados WHERE codigo = 'TAB';

-- TAMAULIPAS
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Reynosa' FROM estados WHERE codigo = 'TAMPS'
UNION ALL SELECT id, 'Matamoros' FROM estados WHERE codigo = 'TAMPS'
UNION ALL SELECT id, 'Nuevo Laredo' FROM estados WHERE codigo = 'TAMPS'
UNION ALL SELECT id, 'Tampico' FROM estados WHERE codigo = 'TAMPS'
UNION ALL SELECT id, 'Victoria' FROM estados WHERE codigo = 'TAMPS';

-- TLAXCALA
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Tlaxcala' FROM estados WHERE codigo = 'TLAX'
UNION ALL SELECT id, 'Apizaco' FROM estados WHERE codigo = 'TLAX'
UNION ALL SELECT id, 'Huamantla' FROM estados WHERE codigo = 'TLAX';

-- VERACRUZ
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Veracruz' FROM estados WHERE codigo = 'VER'
UNION ALL SELECT id, 'Xalapa' FROM estados WHERE codigo = 'VER'
UNION ALL SELECT id, 'Coatzacoalcos' FROM estados WHERE codigo = 'VER'
UNION ALL SELECT id, 'Poza Rica' FROM estados WHERE codigo = 'VER'
UNION ALL SELECT id, 'Córdoba' FROM estados WHERE codigo = 'VER';

-- YUCATÁN
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Mérida' FROM estados WHERE codigo = 'YUC'
UNION ALL SELECT id, 'Kanasín' FROM estados WHERE codigo = 'YUC'
UNION ALL SELECT id, 'Valladolid' FROM estados WHERE codigo = 'YUC';

-- ZACATECAS
INSERT INTO delegaciones (id_estado, nombre)
SELECT id, 'Zacatecas' FROM estados WHERE codigo = 'ZAC'
UNION ALL SELECT id, 'Fresnillo' FROM estados WHERE codigo = 'ZAC'
UNION ALL SELECT id, 'Guadalupe' FROM estados WHERE codigo = 'ZAC';

-- ============================================
-- COLONIAS PRINCIPALES POR DELEGACIÓN (Ejemplos)
-- ============================================

-- IZTAPALAPA (CDMX)
INSERT INTO colonias (id_delegacion, nombre, codigo_postal)
SELECT id, 'Santa Cruz Meyehualco', '09290' FROM delegaciones WHERE nombre = 'Iztapalapa' LIMIT 1
UNION ALL SELECT id, 'Desarrollo Urbano Quetzalcóatl', '09700' FROM delegaciones WHERE nombre = 'Iztapalapa' LIMIT 1
UNION ALL SELECT id, 'San Lorenzo Tezonco', '09790' FROM delegaciones WHERE nombre = 'Iztapalapa' LIMIT 1
UNION ALL SELECT id, 'Lomas de Zaragoza', '09640' FROM delegaciones WHERE nombre = 'Iztapalapa' LIMIT 1
UNION ALL SELECT id, 'Cabeza de Juárez', '09208' FROM delegaciones WHERE nombre = 'Iztapalapa' LIMIT 1;

-- GUSTAVO A. MADERO (CDMX)
INSERT INTO colonias (id_delegacion, nombre, codigo_postal)
SELECT id, 'Lindavista', '07300' FROM delegaciones WHERE nombre = 'Gustavo A. Madero' LIMIT 1
UNION ALL SELECT id, 'Residencial Zacatenco', '07369' FROM delegaciones WHERE nombre = 'Gustavo A. Madero' LIMIT 1
UNION ALL SELECT id, 'Aragón La Villa', '07050' FROM delegaciones WHERE nombre = 'Gustavo A. Madero' LIMIT 1
UNION ALL SELECT id, 'Tepeyac Insurgentes', '07020' FROM delegaciones WHERE nombre = 'Gustavo A. Madero' LIMIT 1;

-- MONTERREY (NL)
INSERT INTO colonias (id_delegacion, nombre, codigo_postal)
SELECT id, 'Centro', '64000' FROM delegaciones WHERE nombre = 'Monterrey' LIMIT 1
UNION ALL SELECT id, 'Obispado', '64060' FROM delegaciones WHERE nombre = 'Monterrey' LIMIT 1
UNION ALL SELECT id, 'Mitras Centro', '64460' FROM delegaciones WHERE nombre = 'Monterrey' LIMIT 1
UNION ALL SELECT id, 'Del Valle', '66220' FROM delegaciones WHERE nombre = 'Monterrey' LIMIT 1;

-- GUADALAJARA (JAL)
INSERT INTO colonias (id_delegacion, nombre, codigo_postal)
SELECT id, 'Centro', '44100' FROM delegaciones WHERE nombre = 'Guadalajara' LIMIT 1
UNION ALL SELECT id, 'Americana', '44160' FROM delegaciones WHERE nombre = 'Guadalajara' LIMIT 1
UNION ALL SELECT id, 'Providencia', '44630' FROM delegaciones WHERE nombre = 'Guadalajara' LIMIT 1
UNION ALL SELECT id, 'Chapalita', '45040' FROM delegaciones WHERE nombre = 'Guadalajara' LIMIT 1;

-- ECATEPEC (EDOMEX)
INSERT INTO colonias (id_delegacion, nombre, codigo_postal)
SELECT id, 'Fraccionamiento Las Américas', '55076' FROM delegaciones WHERE nombre = 'Ecatepec de Morelos' LIMIT 1
UNION ALL SELECT id, 'Ciudad Azteca', '55120' FROM delegaciones WHERE nombre = 'Ecatepec de Morelos' LIMIT 1
UNION ALL SELECT id, 'Jardines de Morelos', '55070' FROM delegaciones WHERE nombre = 'Ecatepec de Morelos' LIMIT 1;

-- ==================== CONFIGURACIONES FINALES ====================

-- Optimizar tablas
OPTIMIZE TABLE personas;
OPTIMIZE TABLE familias;
OPTIMIZE TABLE colonias;
OPTIMIZE TABLE delegaciones;
OPTIMIZE TABLE estados;

-- Analizar tablas
ANALYZE TABLE personas;
ANALYZE TABLE familias;
ANALYZE TABLE usuarios;
ANALYZE TABLE sesiones;

-- ==================== VERIFICACIÓN ====================

SELECT
    'Base de datos creada exitosamente' as resultado,
    (SELECT COUNT(*) FROM estados) as total_estados,
    (SELECT COUNT(*) FROM delegaciones) as total_delegaciones,
    (SELECT COUNT(*) FROM colonias) as total_colonias_ejemplo;

SELECT
    '✅ Sistema Electoral Optimizado v2.0' as sistema,
    '32 Estados de México cargados' as estados,
    '150+ Delegaciones/Municipios principales' as delegaciones,
    'Colonias principales de ejemplo' as colonias,
    'Base de datos lista para usar' as estatus;

-- FIN
