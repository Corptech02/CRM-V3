// Authentication Routes for Vanguard CRM
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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

const ADMIN_ROLES = ['master_admin', 'united_admin', 'vanguard_admin'];

// ── GET /api/auth/users — list all CRM users (admin only) ───────────────────
router.get('/users', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!ADMIN_ROLES.includes(decoded.role)) return res.status(403).json({ error: 'Admin only' });
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
        if (!ADMIN_ROLES.includes(decoded.role)) return res.status(403).json({ error: 'Admin only' });
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

// ── Magic Link (Slack → CRM bypass) ─────────────────────────────────────────
// Create the table on startup
{
    const db = new sqlite3.Database(DB_PATH);
    db.run(`CREATE TABLE IF NOT EXISTS magic_link_tokens (
        token      TEXT PRIMARY KEY,
        redirect   TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at    DATETIME
    )`, () => db.close());
}

// GET /api/auth/magic-link?t=TOKEN
// Validates a single-use token and returns a self-authenticating HTML page
router.get('/magic-link', (req, res) => {
    const token = req.query.t;
    if (!token) return res.status(400).send('Missing token');

    const db = new sqlite3.Database(DB_PATH);
    db.get(
        `SELECT * FROM magic_link_tokens WHERE token = ? AND used_at IS NULL AND expires_at > datetime('now')`,
        [token],
        (err, row) => {
            if (err || !row) {
                db.close();
                return res.status(403).send(`
                    <!DOCTYPE html><html><head><title>Link Expired</title>
                    <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f3f4f6}
                    .box{background:white;padding:40px;border-radius:12px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.1)}
                    h2{color:#ef4444;margin:0 0 10px}p{color:#6b7280;margin:0}a{color:#2563eb}</style></head>
                    <body><div class="box"><h2>Link Expired</h2><p>This link has already been used or expired.<br>
                    <a href="/login.html">Log in manually</a></p></div></body></html>
                `);
            }

            // Mark token as used
            db.run(`UPDATE magic_link_tokens SET used_at = datetime('now') WHERE token = ?`, [token], () => db.close());

            // Issue a 4-hour JWT for a Slack viewer session
            const jwtToken = jwt.sign(
                { userId: 5, username: 'csr', role: 'csr', portal: 'vanguard' },
                JWT_SECRET,
                { expiresIn: '4h' }
            );

            const redirect = row.redirect || '/';
            const userJson = JSON.stringify({ username: 'csr', role: 'csr', portal: 'vanguard', loginTime: new Date().toISOString() });

            // Extract policyNumber from redirect (supports both ?policyNumber=X and #policy/X)
            const _rUrl = new URL(redirect, 'https://x');
            let _pendingPolicy = _rUrl.searchParams.get('policyNumber') || '';
            if (!_pendingPolicy) {
                const _hashMatch = redirect.match(/#policy\/([^&?#]+)/);
                if (_hashMatch) _pendingPolicy = decodeURIComponent(_hashMatch[1]);
            }

            // Return a page that sets the session and redirects.
            // Append _t=timestamp to bust the browser's cached index.html so
            // the latest JS version numbers are always picked up.
            res.send(`<!DOCTYPE html>
<html><head><title>Opening Vanguard CRM...</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1e40af}
.msg{color:white;font-size:18px;opacity:.9}</style></head>
<body><div class="msg">Opening policy...</div>
<script>
  sessionStorage.setItem('vanguard_jwt', ${JSON.stringify(jwtToken)});
  sessionStorage.setItem('vanguard_user', ${JSON.stringify(userJson)});
  localStorage.setItem('vanguard_login_portal', 'vanguard');
  // Store pending policy so fix-policy-display-limit.js opens it after render
  if (${JSON.stringify(_pendingPolicy)}) {
    sessionStorage.setItem('vanguard_pending_policy', ${JSON.stringify(_pendingPolicy)});
  }
  // Always redirect to #policies — the pending policy in sessionStorage handles the auto-open
  var dest = ${JSON.stringify(redirect)};
  // If dest has #policy/X format, redirect to #policies instead (sessionStorage handles the open)
  var hashPart = '#policies';
  if (dest.indexOf('#') >= 0 && dest.indexOf('#policy/') === -1) {
    hashPart = dest.slice(dest.indexOf('#'));
  }
  window.location.href = '/?_t=' + Date.now() + hashPart;
</script></body></html>`);
        }
    );
});

module.exports = router;
