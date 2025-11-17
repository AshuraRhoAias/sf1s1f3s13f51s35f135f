const crypto = require('crypto');
const bcrypt = require('bcrypt');
const argon2 = require('argon2');
const { scrypt } = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

class EncryptionService {

    // ====== NUEVOS MÉTODOS PARA DATOS GENERALES (nombre, email) ======

    /**
     * Encriptar datos generales (nombre, email, etc) con AES-256-GCM
     */
    encrypt(text) {
        if (!text) return null;

        try {
            const masterPhrase = process.env.MASTER_PHRASE || '0AshuraRhoaAias2Tekken3Kaioh';
            // Generar clave de 32 bytes
            const key = crypto.scryptSync(masterPhrase, 'data-encryption-salt', 32);

            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            // Formato: iv:authTag:encrypted
            return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
        } catch (error) {
            throw new Error('Error al encriptar: ' + error.message);
        }
    }

    /**
     * Desencriptar datos generales
     */
    decrypt(encryptedText) {
        if (!encryptedText) return null;

        try {
            const parts = encryptedText.split(':');
            if (parts.length !== 3) {
                throw new Error('Formato de datos encriptados inválido');
            }

            const masterPhrase = process.env.MASTER_PHRASE || '0AshuraRhoaAias2Tekken3Kaioh';
            const key = crypto.scryptSync(masterPhrase, 'data-encryption-salt', 32);

            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];

            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            throw new Error('Error al desencriptar: ' + error.message);
        }
    }

    // ====== MÉTODOS EXISTENTES (sin cambios) ======

    // Validar la frase maestra
    validateMasterPhrase(phrase) {
        const masterPhrase = process.env.MASTER_PHRASE || '0AshuraRhoaAias2Tekken3Kaioh';
        return phrase === masterPhrase;
    }

    // Generar clave derivada de la frase maestra (64 bytes = 128 hex chars)
    async deriveMasterKey(phrase) {
        const salt = process.env.MASTER_SALT || 'master_salt_secure_2024';
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(phrase, salt, 200000, 64, 'sha512', (err, key) => {
                if (err) reject(err);
                resolve(key.toString('hex'));
            });
        });
    }

    // Derivar claves específicas para cada nivel
    async deriveLayerKey(phrase, layer) {
        const salt = `${process.env.MASTER_SALT || 'master_salt'}_layer_${layer}`;
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(phrase, salt, 150000, 64, 'sha512', (err, key) => {
                if (err) reject(err);
                resolve(key.toString('hex'));
            });
        });
    }

    // Nivel 1: ChaCha20-Poly1305 (CIFRADO REVERSIBLE)
    async chacha20Encrypt(text, key) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(
            'chacha20-poly1305',
            Buffer.from(key, 'hex').slice(0, 32),
            iv,
            { authTagLength: 16 }
        );

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }

    async chacha20Decrypt(encrypted, key) {
        const parts = encrypted.split(':');
        if (parts.length !== 3) {
            throw new Error('Formato de cifrado inválido');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = parts[2];

        const decipher = crypto.createDecipheriv(
            'chacha20-poly1305',
            Buffer.from(key, 'hex').slice(0, 32),
            iv,
            { authTagLength: 16 }
        );

        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    // Nivel 2: AES-256-CBC (CIFRADO REVERSIBLE)
    aes256CbcEncrypt(text, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            Buffer.from(key, 'hex').slice(0, 32),
            iv
        );

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return iv.toString('hex') + ':' + encrypted;
    }

    aes256CbcDecrypt(encrypted, key) {
        const parts = encrypted.split(':');
        if (parts.length !== 2) {
            throw new Error('Formato de cifrado AES-CBC inválido');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];

        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            Buffer.from(key, 'hex').slice(0, 32),
            iv
        );

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    // Nivel 3: Camellia-256 (CIFRADO REVERSIBLE)
    camelliaEncrypt(text, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            'camellia-256-cbc',
            Buffer.from(key, 'hex').slice(0, 32),
            iv
        );

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return iv.toString('hex') + ':' + encrypted;
    }

    camelliaDecrypt(encrypted, key) {
        const parts = encrypted.split(':');
        if (parts.length !== 2) {
            throw new Error('Formato de cifrado Camellia inválido');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];

        const decipher = crypto.createDecipheriv(
            'camellia-256-cbc',
            Buffer.from(key, 'hex').slice(0, 32),
            iv
        );

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    // Nivel 4: AES-256-GCM (CIFRADO REVERSIBLE AUTENTICADO)
    aes256GcmEncrypt(text, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            'aes-256-gcm',
            Buffer.from(key, 'hex').slice(0, 32),
            iv
        );

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }

    aes256GcmDecrypt(encrypted, key) {
        const parts = encrypted.split(':');
        if (parts.length !== 3) {
            throw new Error('Formato de cifrado AES-GCM inválido');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = parts[2];

        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(key, 'hex').slice(0, 32),
            iv
        );

        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    // Nivel 5: XOR con clave derivada (CIFRADO REVERSIBLE SIMPLE)
    xorEncrypt(text, key) {
        const keyBuffer = Buffer.from(key, 'hex');
        const textBuffer = Buffer.from(text, 'utf8');
        const result = Buffer.alloc(textBuffer.length);

        for (let i = 0; i < textBuffer.length; i++) {
            result[i] = textBuffer[i] ^ keyBuffer[i % keyBuffer.length];
        }

        return result.toString('hex');
    }

    xorDecrypt(encrypted, key) {
        const keyBuffer = Buffer.from(key, 'hex');
        const encryptedBuffer = Buffer.from(encrypted, 'hex');
        const result = Buffer.alloc(encryptedBuffer.length);

        for (let i = 0; i < encryptedBuffer.length; i++) {
            result[i] = encryptedBuffer[i] ^ keyBuffer[i % keyBuffer.length];
        }

        return result.toString('utf8');
    }

    // SISTEMA COMPLETAMENTE DESCIFRABLE CON FRASE MAESTRA
    async hashPasswordDecryptable(password) {
        try {
            const masterPhrase = process.env.MASTER_PHRASE || '0AshuraRhoaAias2Tekken3Kaioh';
            const masterKey = await this.deriveMasterKey(masterPhrase);

            // Derivar claves únicas para cada nivel
            const key1 = await this.deriveLayerKey(masterPhrase, 1);
            const key2 = await this.deriveLayerKey(masterPhrase, 2);
            const key3 = await this.deriveLayerKey(masterPhrase, 3);
            const key4 = await this.deriveLayerKey(masterPhrase, 4);

            let encrypted = password;

            // Nivel 1: ChaCha20-Poly1305
            encrypted = await this.chacha20Encrypt(encrypted, key1);

            // Nivel 2: AES-256-CBC
            encrypted = this.aes256CbcEncrypt(encrypted, key2);

            // Nivel 3: Camellia-256
            encrypted = this.camelliaEncrypt(encrypted, key3);

            // Nivel 4: AES-256-GCM
            encrypted = this.aes256GcmEncrypt(encrypted, key4);

            // Nivel 5: XOR final con clave maestra
            encrypted = this.xorEncrypt(encrypted, masterKey);

            // Agregar metadatos para identificación
            const result = {
                version: '5-layer-decryptable',
                timestamp: Date.now(),
                data: encrypted
            };

            return JSON.stringify(result);
        } catch (error) {
            throw new Error('Error en cifrado: ' + error.message);
        }
    }

    // DESCIFRADO COMPLETO CON FRASE MAESTRA
    async decryptPasswordManual(encryptedData, masterPhrase) {
        try {
            // Validar frase maestra
            if (!this.validateMasterPhrase(masterPhrase)) {
                throw new Error('Frase maestra incorrecta');
            }

            const data = JSON.parse(encryptedData);
            if (data.version !== '5-layer-decryptable') {
                throw new Error('Versión de cifrado no compatible');
            }

            const masterKey = await this.deriveMasterKey(masterPhrase);

            // Derivar claves únicas para cada nivel
            const key1 = await this.deriveLayerKey(masterPhrase, 1);
            const key2 = await this.deriveLayerKey(masterPhrase, 2);
            const key3 = await this.deriveLayerKey(masterPhrase, 3);
            const key4 = await this.deriveLayerKey(masterPhrase, 4);

            let decrypted = data.data;

            // Nivel 5: Descifrar XOR
            decrypted = this.xorDecrypt(decrypted, masterKey);

            // Nivel 4: Descifrar AES-256-GCM
            decrypted = this.aes256GcmDecrypt(decrypted, key4);

            // Nivel 3: Descifrar Camellia
            decrypted = this.camelliaDecrypt(decrypted, key3);

            // Nivel 2: Descifrar AES-256-CBC
            decrypted = this.aes256CbcDecrypt(decrypted, key2);

            // Nivel 1: Descifrar ChaCha20
            decrypted = await this.chacha20Decrypt(decrypted, key1);

            return decrypted;
        } catch (error) {
            throw new Error('Error en descifrado: ' + error.message);
        }
    }

    // VERIFICACIÓN DE PASSWORD (sin descifrar completamente)
    async verifyPasswordDecryptable(password, encryptedData) {
        try {
            const masterPhrase = process.env.MASTER_PHRASE || '0AshuraRhoaAias2Tekken3Kaioh';

            // Cifrar el password ingresado con el mismo proceso
            const hashedInput = await this.hashPasswordDecryptable(password);

            // Comparar los hashes (nota: incluyen timestamps, así que usamos otro método)
            // Mejor: desciframos y comparamos
            const decryptedStored = await this.decryptPasswordManual(encryptedData, masterPhrase);

            return password === decryptedStored;
        } catch (error) {
            console.error('Error en verificación:', error);
            return false;
        }
    }

    // SISTEMA HÍBRIDO: Hash unidireccional + Cifrado reversible
    async hashPasswordHybrid(password) {
        try {
            const masterPhrase = process.env.MASTER_PHRASE || '0AshuraRhoaAias2Tekken3Kaioh';
            const masterKey = await this.deriveMasterKey(masterPhrase);

            // Derivar claves únicas para cada nivel
            const key1 = await this.deriveLayerKey(masterPhrase, 1);
            const key2 = await this.deriveLayerKey(masterPhrase, 2);
            const key3 = await this.deriveLayerKey(masterPhrase, 3);
            const key4 = await this.deriveLayerKey(masterPhrase, 4);

            // Parte 1: Hash unidireccional para verificación rápida
            const quickHash = crypto.createHash('sha512')
                .update(password + masterKey)
                .digest('hex');

            // Parte 2: Password cifrado completamente descifrable
            let encrypted = password;

            // Nivel 1: ChaCha20
            encrypted = await this.chacha20Encrypt(encrypted, key1);

            // Nivel 2: AES-CBC
            encrypted = this.aes256CbcEncrypt(encrypted, key2);

            // Nivel 3: Camellia
            encrypted = this.camelliaEncrypt(encrypted, key3);

            // Nivel 4: AES-GCM
            encrypted = this.aes256GcmEncrypt(encrypted, key4);

            // Nivel 5: XOR final
            encrypted = this.xorEncrypt(encrypted, masterKey);

            return JSON.stringify({
                version: 'hybrid-v1',
                quickHash: quickHash,
                encrypted: encrypted,
                timestamp: Date.now()
            });
        } catch (error) {
            throw new Error('Error en cifrado híbrido: ' + error.message);
        }
    }

    // VERIFICACIÓN HÍBRIDA (Rápida)
    async verifyPasswordHybrid(password, storedData) {
        try {
            const data = JSON.parse(storedData);
            const masterPhrase = process.env.MASTER_PHRASE || '0AshuraRhoaAias2Tekken3Kaioh';
            const masterKey = await this.deriveMasterKey(masterPhrase);

            // Verificación rápida con hash
            const quickHash = crypto.createHash('sha512')
                .update(password + masterKey)
                .digest('hex');

            return quickHash === data.quickHash;
        } catch (error) {
            console.error('Error en verificación híbrida:', error);
            return false;
        }
    }

    // DESCIFRADO HÍBRIDO MANUAL
    async decryptPasswordHybrid(storedData, masterPhrase) {
        try {
            if (!this.validateMasterPhrase(masterPhrase)) {
                throw new Error('Frase maestra incorrecta');
            }

            const data = JSON.parse(storedData);
            if (data.version !== 'hybrid-v1') {
                throw new Error('Versión no compatible');
            }

            const masterKey = await this.deriveMasterKey(masterPhrase);

            // Derivar claves únicas para cada nivel
            const key1 = await this.deriveLayerKey(masterPhrase, 1);
            const key2 = await this.deriveLayerKey(masterPhrase, 2);
            const key3 = await this.deriveLayerKey(masterPhrase, 3);
            const key4 = await this.deriveLayerKey(masterPhrase, 4);

            let decrypted = data.encrypted;

            // Revertir los 5 niveles en orden inverso
            decrypted = this.xorDecrypt(decrypted, masterKey);
            decrypted = this.aes256GcmDecrypt(decrypted, key4);
            decrypted = this.camelliaDecrypt(decrypted, key3);
            decrypted = this.aes256CbcDecrypt(decrypted, key2);
            decrypted = await this.chacha20Decrypt(decrypted, key1);

            return decrypted;
        } catch (error) {
            throw new Error('Error en descifrado híbrido: ' + error.message);
        }
    }

    // Utilidad: Mostrar información de cifrado
    getEncryptionInfo(encryptedData) {
        try {
            const data = JSON.parse(encryptedData);
            return {
                version: data.version,
                timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : 'N/A',
                encrypted: data.encrypted ? 'Sí' : 'No',
                layers: 5,
                algorithms: ['ChaCha20-Poly1305', 'AES-256-CBC', 'Camellia-256', 'AES-256-GCM', 'XOR-Master']
            };
        } catch (error) {
            return { error: 'Formato inválido' };
        }
    }
}

module.exports = new EncryptionService();