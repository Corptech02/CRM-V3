// JWT Authentication & Authorization Middleware for Vanguard CRM
const jwt = require('jsonwebtoken');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET not set in .env — auth will fail');
}

const DB_PATH = path.resolve(__dirname, '../vanguard.db');

// ── JWT Token Verification ──────────────────────────────────────────────────
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { userId, username, role, portal }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// ── Role-Based Access Control ───────────────────────────────────────────────
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}

// ── Audit Logger ────────────────────────────────────────────────────────────
function auditLog(action, resource) {
    return (req, res, next) => {
        // Log after response is sent (non-blocking)
        res.on('finish', () => {
            const db = new sqlite3.Database(DB_PATH);
            const resourceId = req.params.id || req.params.leadId || req.params.policyId || req.params.clientId || null;
            db.run(
                `INSERT INTO audit_log (username, action, resource, resource_id, ip_address, user_agent, details)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    req.user ? req.user.username : 'anonymous',
                    action,
                    resource,
                    resourceId,
                    req.ip || req.connection.remoteAddress,
                    (req.headers['user-agent'] || '').substring(0, 500),
                    JSON.stringify({ method: req.method, path: req.originalUrl, status: res.statusCode })
                ],
                (err) => {
                    if (err) console.error('Audit log write error:', err.message);
                    db.close();
                }
            );
        });
        next();
    };
}

module.exports = { authenticateToken, requireRole, auditLog };
