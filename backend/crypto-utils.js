// AES-256-GCM encryption for sensitive database fields (Plaid tokens, etc.)
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.PLAID_ENCRYPTION_KEY
    ? Buffer.from(process.env.PLAID_ENCRYPTION_KEY, 'hex')
    : null;

function encryptField(plaintext) {
    if (!KEY) {
        console.warn('⚠️ PLAID_ENCRYPTION_KEY not set — storing plaintext');
        return plaintext;
    }
    if (!plaintext) return plaintext;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');
    return `enc:${iv.toString('base64')}:${authTag}:${encrypted}`;
}

function decryptField(ciphertext) {
    if (!KEY) return ciphertext;
    if (!ciphertext || !ciphertext.startsWith('enc:')) return ciphertext;
    try {
        const parts = ciphertext.split(':');
        if (parts.length !== 4) return ciphertext;
        const iv = Buffer.from(parts[1], 'base64');
        const authTag = Buffer.from(parts[2], 'base64');
        const encrypted = parts[3];
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error('❌ Decryption failed:', err.message);
        return ciphertext; // Return as-is if decryption fails (might be plaintext)
    }
}

module.exports = { encryptField, decryptField };
