// ============================================
// 📁 services/base/CryptoService.js
// Servicio de cifrado de 5 capas OPTIMIZADO
// ============================================
const crypto = require('crypto');

class CryptoService {
    constructor() {
        this.masterPhrase = process.env.MASTER_PHRASE || '0AshuraRhoaAias2Tekken3Kaioh';

        // Pre-computar claves para mejor rendimiento
        this.keysCache = new Map();
        this.initializeKeys();
    }

    // ==================== INICIALIZACIÓN DE CLAVES ====================

    initializeKeys() {
        // Pre-computar todas las claves al iniciar
        const layers = [1, 2, 3, 4, 5];
        layers.forEach(layer => {
            const key = this.deriveLayerKeySync(layer);
            this.keysCache.set(`layer_${layer}`, key);
        });

        // Clave maestra
        const masterKey = this.deriveMasterKeySync();
        this.keysCache.set('master', masterKey);

        console.log('✅ Claves de cifrado pre-computadas');
    }

    getLayerKey(layer) {
        return this.keysCache.get(`layer_${layer}`);
    }

    getMasterKey() {
        return this.keysCache.get('master');
    }

    // ==================== DERIVACIÓN DE CLAVES (SYNC) ====================

    deriveMasterKeySync() {
        const salt = process.env.MASTER_SALT || 'master_salt_secure_2024';
        return crypto.pbkdf2Sync(this.masterPhrase, salt, 200000, 64, 'sha512');
    }

    deriveLayerKeySync(layer) {
        const salt = `${process.env.MASTER_SALT || 'master_salt'}_layer_${layer}`;
        return crypto.pbkdf2Sync(this.masterPhrase, salt, 150000, 64, 'sha512');
    }

    // ==================== CIFRADO POR CAPAS (OPTIMIZADO) ====================

    // Capa 1: ChaCha20-Poly1305
    chacha20Encrypt(text, key) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(
            'chacha20-poly1305',
            key.slice(0, 32),
            iv,
            { authTagLength: 16 }
        );

        const encrypted = Buffer.concat([
            cipher.update(text, 'utf8'),
            cipher.final()
        ]);

        const authTag = cipher.getAuthTag();

        // Formato optimizado: iv + authTag + encrypted
        return Buffer.concat([iv, authTag, encrypted]).toString('base64');
    }

    chacha20Decrypt(encryptedBase64, key) {
        const buffer = Buffer.from(encryptedBase64, 'base64');

        const iv = buffer.slice(0, 12);
        const authTag = buffer.slice(12, 28);
        const encrypted = buffer.slice(28);

        const decipher = crypto.createDecipheriv(
            'chacha20-poly1305',
            key.slice(0, 32),
            iv,
            { authTagLength: 16 }
        );

        decipher.setAuthTag(authTag);

        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]).toString('utf8');
    }

    // Capa 2: AES-256-CBC
    aes256CbcEncrypt(text, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key.slice(0, 32), iv);

        const encrypted = Buffer.concat([
            cipher.update(text, 'utf8'),
            cipher.final()
        ]);

        return Buffer.concat([iv, encrypted]).toString('base64');
    }

    aes256CbcDecrypt(encryptedBase64, key) {
        const buffer = Buffer.from(encryptedBase64, 'base64');

        const iv = buffer.slice(0, 16);
        const encrypted = buffer.slice(16);

        const decipher = crypto.createDecipheriv('aes-256-cbc', key.slice(0, 32), iv);

        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]).toString('utf8');
    }

    // Capa 3: Camellia-256
    camelliaEncrypt(text, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('camellia-256-cbc', key.slice(0, 32), iv);

        const encrypted = Buffer.concat([
            cipher.update(text, 'utf8'),
            cipher.final()
        ]);

        return Buffer.concat([iv, encrypted]).toString('base64');
    }

    camelliaDecrypt(encryptedBase64, key) {
        const buffer = Buffer.from(encryptedBase64, 'base64');

        const iv = buffer.slice(0, 16);
        const encrypted = buffer.slice(16);

        const decipher = crypto.createDecipheriv('camellia-256-cbc', key.slice(0, 32), iv);

        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]).toString('utf8');
    }

    // Capa 4: AES-256-GCM
    aes256GcmEncrypt(text, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key.slice(0, 32), iv);

        const encrypted = Buffer.concat([
            cipher.update(text, 'utf8'),
            cipher.final()
        ]);

        const authTag = cipher.getAuthTag();

        return Buffer.concat([iv, authTag, encrypted]).toString('base64');
    }

    aes256GcmDecrypt(encryptedBase64, key) {
        const buffer = Buffer.from(encryptedBase64, 'base64');

        const iv = buffer.slice(0, 16);
        const authTag = buffer.slice(16, 32);
        const encrypted = buffer.slice(32);

        const decipher = crypto.createDecipheriv('aes-256-gcm', key.slice(0, 32), iv);
        decipher.setAuthTag(authTag);

        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]).toString('utf8');
    }

    // Capa 5: XOR con clave maestra
    xorEncrypt(text, key) {
        const textBuffer = Buffer.from(text, 'utf8');
        const result = Buffer.alloc(textBuffer.length);

        for (let i = 0; i < textBuffer.length; i++) {
            result[i] = textBuffer[i] ^ key[i % key.length];
        }

        return result.toString('base64');
    }

    xorDecrypt(encryptedBase64, key) {
        const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');
        const result = Buffer.alloc(encryptedBuffer.length);

        for (let i = 0; i < encryptedBuffer.length; i++) {
            result[i] = encryptedBuffer[i] ^ key[i % key.length];
        }

        return result.toString('utf8');
    }

    // ==================== CIFRADO COMPLETO DE 5 CAPAS ====================

    encrypt5Layers(text) {
        try {
            if (!text) return null;

            let encrypted = text;

            // Capa 1: ChaCha20
            encrypted = this.chacha20Encrypt(encrypted, this.getLayerKey(1));

            // Capa 2: AES-CBC
            encrypted = this.aes256CbcEncrypt(encrypted, this.getLayerKey(2));

            // Capa 3: Camellia
            encrypted = this.camelliaEncrypt(encrypted, this.getLayerKey(3));

            // Capa 4: AES-GCM
            encrypted = this.aes256GcmEncrypt(encrypted, this.getLayerKey(4));

            // Capa 5: XOR
            encrypted = this.xorEncrypt(encrypted, this.getMasterKey());

            // Formato final con versión
            return JSON.stringify({
                v: '5L',
                d: encrypted,
                t: Date.now()
            });
        } catch (error) {
            console.error('Error en encrypt5Layers:', error);
            throw new Error('Error de cifrado');
        }
    }

    decrypt5Layers(encryptedData) {
        try {
            if (!encryptedData) return null;

            const data = JSON.parse(encryptedData);
            if (data.v !== '5L') {
                throw new Error('Versión de cifrado no compatible');
            }

            let decrypted = data.d;

            // Descifrar en orden inverso
            decrypted = this.xorDecrypt(decrypted, this.getMasterKey());
            decrypted = this.aes256GcmDecrypt(decrypted, this.getLayerKey(4));
            decrypted = this.camelliaDecrypt(decrypted, this.getLayerKey(3));
            decrypted = this.aes256CbcDecrypt(decrypted, this.getLayerKey(2));
            decrypted = this.chacha20Decrypt(decrypted, this.getLayerKey(1));

            return decrypted;
        } catch (error) {
            console.error('Error en decrypt5Layers:', error);
            throw new Error('Error de descifrado');
        }
    }

    // ==================== CIFRADO PARA PASSWORDS (HÍBRIDO) ====================

    hashPasswordHybrid(password) {
        try {
            // Hash rápido para verificación
            const quickHash = crypto
                .createHash('sha512')
                .update(password + this.getMasterKey().toString('hex'))
                .digest('hex');

            // Password cifrado con 5 capas
            const encrypted = this.encrypt5Layers(password);

            return JSON.stringify({
                v: 'hybrid-v2',
                qh: quickHash,
                e: encrypted,
                t: Date.now()
            });
        } catch (error) {
            throw new Error('Error de cifrado de password');
        }
    }

    verifyPasswordHybrid(password, storedData) {
        try {
            const data = JSON.parse(storedData);
            if (data.v !== 'hybrid-v2') {
                throw new Error('Versión no compatible');
            }

            // Verificación rápida con hash
            const quickHash = crypto
                .createHash('sha512')
                .update(password + this.getMasterKey().toString('hex'))
                .digest('hex');

            return quickHash === data.qh;
        } catch (error) {
            console.error('Error en verificación:', error);
            return false;
        }
    }

    decryptPasswordHybrid(storedData, masterPhrase) {
        try {
            if (masterPhrase !== this.masterPhrase) {
                throw new Error('Frase maestra incorrecta');
            }

            const data = JSON.parse(storedData);
            if (data.v !== 'hybrid-v2') {
                throw new Error('Versión no compatible');
            }

            return this.decrypt5Layers(data.e);
        } catch (error) {
            throw new Error('Error en descifrado: ' + error.message);
        }
    }

    // ==================== CIFRADO PARA CAMPOS SEPARADOS (GCM) ====================

    encryptFieldSeparated(text) {
        if (!text) return { encrypted: null, iv: null, tag: null };

        try {
            const key = this.getLayerKey(4); // Usar capa 4 (GCM)
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-gcm', key.slice(0, 32), iv);

            const encrypted = Buffer.concat([
                cipher.update(text, 'utf8'),
                cipher.final()
            ]);

            const authTag = cipher.getAuthTag();

            return {
                encrypted: encrypted.toString('hex'),
                iv: iv.toString('hex'),
                tag: authTag.toString('hex')
            };
        } catch (error) {
            throw new Error('Error de cifrado de campo');
        }
    }

    decryptFieldSeparated(encrypted, iv, tag) {
        if (!encrypted || !iv || !tag) return null;

        try {
            const key = this.getLayerKey(4);

            const decipher = crypto.createDecipheriv(
                'aes-256-gcm',
                key.slice(0, 32),
                Buffer.from(iv, 'hex')
            );

            decipher.setAuthTag(Buffer.from(tag, 'hex'));

            const decrypted = Buffer.concat([
                decipher.update(Buffer.from(encrypted, 'hex')),
                decipher.final()
            ]);

            return decrypted.toString('utf8');
        } catch (error) {
            console.error('Error en decryptFieldSeparated:', error);
            return null;
        }
    }
}

module.exports = new CryptoService();
