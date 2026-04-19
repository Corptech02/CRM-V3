// Authentication Routes for Vanguard CRM
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const DB_PATH = path.resolve(__dirname, '../vanguard.db');
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '8h';

// Rate limit: 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const db = new sqlite3.Database(DB_PATH);

    try {
        const user = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND active = 1',
                [username],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!user) {
            // Log failed attempt
            logAudit(db, null, 'login_failed', 'auth', null, req, { username });
            db.close();
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            logAudit(db, user.username, 'login_failed', 'auth', null, req, { reason: 'bad_password' });
            db.close();
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            portal: user.portal
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

        // Update last_login
        db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        // Log success
        logAudit(db, user.username, 'login_success', 'auth', null, req, null);

        db.close();

        res.json({
            token,
            user: {
                username: user.username,
                role: user.role,
                portal: user.portal
            }
        });
    } catch (err) {
        db.close();
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── POST /api/auth/refresh ──────────────────────────────────────────────────
router.post('/refresh', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Only refresh if less than 2 hours remaining
        const timeLeft = decoded.exp - Math.floor(Date.now() / 1000);
        if (timeLeft > 7200) {
            return res.json({ token }); // Return same token if plenty of time left
        }

        const newPayload = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
            portal: decoded.portal
        };
        const newToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
        res.json({ token: newToken });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});

// ── POST /api/auth/logout ───────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const db = new sqlite3.Database(DB_PATH);
            logAudit(db, decoded.username, 'logout', 'auth', null, req, null);
            db.close();
        } catch (e) { /* token might be expired, that's fine */ }
    }

    res.json({ success: true });
});

// ── POST /api/auth/change-password ──────────────────────────────────────────
router.post('/change-password', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const { targetUsername, currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const db = new sqlite3.Database(DB_PATH);

    try {
        // Admin can change anyone's password; agents can only change their own
        const changingOther = targetUsername && targetUsername.toLowerCase() !== decoded.username.toLowerCase();

        if (changingOther && decoded.role !== 'admin') {
            db.close();
            return res.status(403).json({ error: 'Only admins can change other users\' passwords' });
        }

        const targetUser = targetUsername || decoded.username;

        // If changing own password, verify current password
        if (!changingOther) {
            if (!currentPassword) {
                db.close();
                return res.status(400).json({ error: 'Current password required' });
            }
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [targetUser], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
                db.close();
                return res.status(401).json({ error: 'Current password is incorrect' });
            }
        }

        const hash = await bcrypt.hash(newPassword, 12);
        await new Promise((resolve, reject) => {
            db.run('UPDATE users SET password_hash = ? WHERE LOWER(username) = LOWER(?)', [hash, targetUser], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        logAudit(db, decoded.username, 'change_password', 'user', null, req, { target: targetUser });
        db.close();

        res.json({ success: true, message: 'Password updated' });
    } catch (err) {
        db.close();
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ── Audit helper ────────────────────────────────────────────────────────────
function logAudit(db, username, action, resource, resourceId, req, details) {
    db.run(
        `INSERT INTO audit_log (username, action, resource, resource_id, ip_address, user_agent, details)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            username || 'anonymous',
            action,
            resource,
            resourceId,
            req.ip || req.connection.remoteAddress,
            (req.headers['user-agent'] || '').substring(0, 500),
            details ? JSON.stringify(details) : null
        ],
        (err) => {
            if (err) console.error('Audit log error:', err.message);
        }
    );
}

// ── GET /api/auth/users — list all CRM users (admin only) ───────────────────
router.get('/users', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const db = new sqlite3.Database(DB_PATH);
        db.all('SELECT id, username, role, portal, active, created_at, last_login FROM users ORDER BY id', (err, rows) => {
            db.close();
            if (err) return res.status(500).json({ error: 'DB error' });
            res.json({ users: rows });
        });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// ── PUT /api/auth/users/:id/role — update a user's role (admin only) ─────────
router.put('/users/:id/role', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const { role } = req.body;
    const validRoles = ['master_admin', 'united_admin', 'vanguard_admin', 'agent', 'producer', 'csr'];
    if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const db = new sqlite3.Database(DB_PATH);
        db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id], function(err) {
            db.close();
            if (err) return res.status(500).json({ error: 'DB error' });
            if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
            logAudit(db, decoded.username, 'update_role', 'user', req.params.id, req, { role });
            res.json({ success: true });
        });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
