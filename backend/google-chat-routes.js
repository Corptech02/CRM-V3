/**
 * Google Chat Bidirectional Sync
 * Links the CRM's built-in team chat to Google Chat spaces.
 *
 * Setup (one-time in GCP console):
 *  1. Enable "Google Chat API" on your existing Google Cloud project
 *  2. APIs & Services → Credentials → edit your existing OAuth 2.0 Client ID
 *  3. Add authorized redirect URI: https://162-220-14-239.nip.io/api/google-chat/callback
 *  4. Save — no new credentials needed (reuses GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)
 *
 * Then in the CRM chat window, click the gear icon to connect each user and link spaces.
 */

const express = require('express');
const router  = express.Router();
const { google } = require('googleapis');
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const dbPath = path.join(__dirname, '../vanguard.db');
const db = new sqlite3.Database(dbPath);

const REDIRECT_URI = 'https://162-220-14-239.nip.io/api/google-chat/callback';
const CRM_USERS    = ['grant', 'hunter', 'carson'];

const SCOPES = [
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/chat.spaces.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
];

// ─── DB Setup ─────────────────────────────────────────────────────────────────

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS google_chat_tokens (
        user_id       TEXT PRIMARY KEY,
        access_token  TEXT,
        refresh_token TEXT,
        token_expiry  TEXT,
        google_email  TEXT,
        google_user_id TEXT,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // channel is a sorted pair key: 'group', 'dm_grant_hunter', 'dm_carson_grant', etc.
    db.run(`CREATE TABLE IF NOT EXISTS google_chat_spaces (
        channel            TEXT PRIMARY KEY,
        space_name         TEXT,
        space_display_name TEXT,
        linked_by          TEXT,
        last_sync_time     TEXT,
        webhook_url        TEXT,
        created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    // Add webhook_url to existing installs
    db.run(`ALTER TABLE google_chat_spaces ADD COLUMN webhook_url TEXT`, () => {});

    // Tracks messages forwarded CRM→GChat so the sync loop doesn't re-import them
    db.run(`CREATE TABLE IF NOT EXISTS google_chat_message_map (
        id                 INTEGER PRIMARY KEY AUTOINCREMENT,
        crm_message_id     INTEGER,
        gchat_message_name TEXT UNIQUE,
        direction          TEXT,
        created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dbGet(sql, params) {
    return new Promise((resolve, reject) =>
        db.get(sql, params, (err, row) => err ? reject(err) : resolve(row || null)));
}
function dbAll(sql, params) {
    return new Promise((resolve, reject) =>
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || [])));
}
function dbRun(sql, params) {
    return new Promise((resolve, reject) =>
        db.run(sql, params, function(err) { err ? reject(err) : resolve(this); }));
}

function getOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        REDIRECT_URI
    );
}

async function getAuthedClient(userId) {
    const uid = (userId || '').toLowerCase();
    const token = await dbGet('SELECT * FROM google_chat_tokens WHERE user_id = ?', [uid]);
    if (!token) return null;
    const oauth2 = getOAuth2Client();
    oauth2.setCredentials({
        access_token:  token.access_token,
        refresh_token: token.refresh_token,
        expiry_date:   token.token_expiry ? new Date(token.token_expiry).getTime() : null
    });
    oauth2.on('tokens', async (t) => {
        await dbRun(
            `UPDATE google_chat_tokens SET access_token=?, token_expiry=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?`,
            [t.access_token, t.expiry_date ? new Date(t.expiry_date).toISOString() : null, uid]
        ).catch(() => {});
    });
    return oauth2;
}

// Get any available authed client (used when sender has no token)
async function getAnyAuthedClient() {
    const rows = await dbAll('SELECT user_id FROM google_chat_tokens ORDER BY updated_at DESC', []);
    for (const row of rows) {
        const auth = await getAuthedClient(row.user_id);
        if (auth) return { auth, user: row.user_id };
    }
    return null;
}

// Canonical channel key for a DM pair (sorted, so grant↔hunter === hunter↔grant)
function dmChannelKey(a, b) {
    return 'dm_' + [a, b].sort().join('_');
}

// Derive channel key from sender/recipient
function getChannelKey(sender, recipient) {
    if (!recipient) return 'group';
    return dmChannelKey(sender.toLowerCase(), recipient.toLowerCase());
}

// ─── OAuth Routes ─────────────────────────────────────────────────────────────

// GET /api/google-chat/auth?user=grant
router.get('/auth', (req, res) => {
    const user = (req.query.user || '').toLowerCase();
    if (!CRM_USERS.includes(user)) return res.status(400).json({ error: 'Invalid user' });
    const oauth2 = getOAuth2Client();
    const url = oauth2.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        state: user,
        prompt: 'consent'
    });
    res.redirect(url);
});

// GET /api/google-chat/callback?code=...&state=grant
router.get('/callback', async (req, res) => {
    const { code, state: userId, error } = req.query;
    if (error) return res.status(400).send(`OAuth error: ${error}`);
    if (!code || !userId) return res.status(400).send('Missing code or state');
    try {
        const oauth2 = getOAuth2Client();
        const { tokens } = await oauth2.getToken(code);
        oauth2.setCredentials(tokens);

        const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 });
        const { data: info } = await oauth2Api.userinfo.get();

        const uid = (userId || '').toLowerCase();
        await dbRun(
            `INSERT OR REPLACE INTO google_chat_tokens
             (user_id, access_token, refresh_token, token_expiry, google_email, google_user_id, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [uid, tokens.access_token, tokens.refresh_token || null,
             tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
             info.email, info.id]
        );
        res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px;">
            <h2 style="color:#16a34a;">&#10003; Google Chat connected!</h2>
            <p><strong>${uid.charAt(0).toUpperCase() + uid.slice(1)}</strong> is now linked as <strong>${info.email}</strong>.</p>
            <p style="color:#6b7280;">You can close this tab and return to the CRM.</p>
            <script>setTimeout(() => window.close(), 3000);</script>
        </body></html>`);
    } catch (err) {
        console.error('[GChat] OAuth callback error:', err.message);
        res.status(500).send('OAuth failed: ' + err.message);
    }
});

// ─── Status & Space Management ────────────────────────────────────────────────

// GET /api/google-chat/status
router.get('/status', async (req, res) => {
    try {
        const tokens = await dbAll(
            'SELECT user_id, google_email, updated_at FROM google_chat_tokens', []);
        const spaces = await dbAll('SELECT * FROM google_chat_spaces', []);
        const connected = {};
        tokens.forEach(t => { connected[t.user_id] = { email: t.google_email, connectedAt: t.updated_at }; });
        res.json({ connected, spaces });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/google-chat/spaces?user=grant  — list GChat spaces visible to user
router.get('/spaces', async (req, res) => {
    const user = (req.query.user || '').toLowerCase();
    const auth = await getAuthedClient(user);
    if (!auth) return res.status(401).json({ error: 'User not connected to Google Chat' });
    try {
        const chat = google.chat({ version: 'v1', auth });
        const { data } = await chat.spaces.list({ pageSize: 100 });
        res.json({ spaces: (data.spaces || []).map(s => ({ name: s.name, displayName: s.displayName, type: s.type })) });
    } catch (err) {
        console.error('[GChat] List spaces error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/google-chat/link-space
// { channel: 'group'|'dm_grant_hunter'|..., spaceName: 'spaces/XXXX', displayName: 'optional', user: 'grant' }
router.post('/link-space', async (req, res) => {
    const { channel, spaceName, displayName: providedName, user } = req.body || {};
    if (!channel || !spaceName) return res.status(400).json({ error: 'Missing channel or spaceName' });

    // Normalize the space name — accept bare IDs, full names, or chat.google.com URLs
    let normalizedName = spaceName.trim();
    // Strip URL down to the ID portion
    const urlMatch = normalizedName.match(/\/([A-Za-z0-9_-]+)\/?$/);
    if (!normalizedName.startsWith('spaces/') && urlMatch) {
        normalizedName = 'spaces/' + urlMatch[1];
    }

    // Try to verify and get display name via API — but don't fail if API isn't configured yet
    let resolvedDisplayName = providedName || normalizedName;
    try {
        const auth = await getAuthedClient(user || 'grant');
        if (auth) {
            const chat = google.chat({ version: 'v1', auth });
            const { data: space } = await chat.spaces.get({ name: normalizedName });
            if (space.displayName) resolvedDisplayName = space.displayName;
        }
    } catch (err) {
        console.warn('[GChat] Could not verify space (will save anyway):', err.message);
    }

    try {
        await dbRun(
            `INSERT OR REPLACE INTO google_chat_spaces
             (channel, space_name, space_display_name, linked_by, last_sync_time)
             VALUES (?, ?, ?, ?, ?)`,
            [channel, normalizedName, resolvedDisplayName, (user || 'grant'), new Date().toISOString()]
        );
        res.json({ ok: true, displayName: resolvedDisplayName });
    } catch (err) {
        console.error('[GChat] Link space DB error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/google-chat/link-webhook  { channel, webhookUrl, displayName }
// Simplest setup — no API or Workspace needed, just an incoming webhook URL from Google Chat
router.post('/link-webhook', async (req, res) => {
    const { channel, webhookUrl, displayName } = req.body || {};
    if (!channel || !webhookUrl) return res.status(400).json({ error: 'Missing channel or webhookUrl' });
    if (!webhookUrl.startsWith('https://chat.googleapis.com/')) {
        return res.status(400).json({ error: 'Invalid webhook URL — must start with https://chat.googleapis.com/' });
    }
    try {
        await dbRun(
            `INSERT OR REPLACE INTO google_chat_spaces
             (channel, space_name, space_display_name, linked_by, webhook_url, last_sync_time)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [channel, 'webhook', displayName || channel, 'webhook', webhookUrl, new Date().toISOString()]
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/google-chat/unlink-space  { channel: 'group' }
router.post('/unlink-space', async (req, res) => {
    const { channel } = req.body || {};
    if (!channel) return res.status(400).json({ error: 'Missing channel' });
    await dbRun('DELETE FROM google_chat_spaces WHERE channel = ?', [channel]);
    res.json({ ok: true });
});

// POST /api/google-chat/sync  (manual trigger)
router.post('/sync', async (req, res) => {
    try {
        await syncFromGChat();
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── CRM → GChat Forwarding ───────────────────────────────────────────────────

const axios = require('axios');

async function forwardToGChat(channel, sender, message, crmMessageId) {
    try {
        const space = await dbGet('SELECT * FROM google_chat_spaces WHERE channel = ?', [channel]);
        if (!space) return;

        const displayName = sender.charAt(0).toUpperCase() + sender.slice(1);
        const text = `*${displayName}:* ${message}`;

        // ── Webhook path (no API/Workspace needed) ──────────────────────────────
        if (space.webhook_url) {
            await axios.post(space.webhook_url, { text });
            return;
        }

        // ── API path (requires Workspace + configured Chat app) ──────────────────
        let auth = await getAuthedClient(sender);
        if (!auth) {
            const fallback = await getAnyAuthedClient();
            if (!fallback) return;
            auth = fallback.auth;
        }
        const chat = google.chat({ version: 'v1', auth });
        const { data: msg } = await chat.spaces.messages.create({
            parent: space.space_name,
            requestBody: { text }
        });
        if (crmMessageId && msg.name) {
            await dbRun(
                `INSERT OR IGNORE INTO google_chat_message_map (crm_message_id, gchat_message_name, direction)
                 VALUES (?, ?, 'crm_to_gchat')`,
                [crmMessageId, msg.name]
            ).catch(() => {});
        }
    } catch (err) {
        console.error('[GChat] forwardToGChat error:', err.message);
    }
}

// ─── GChat → CRM Sync ─────────────────────────────────────────────────────────

async function syncFromGChat() {
    const spaces = await dbAll('SELECT * FROM google_chat_spaces', []);
    if (!spaces.length) return;

    for (const space of spaces) {
        const auth = await getAuthedClient(space.linked_by);
        if (!auth) continue;

        const chat = google.chat({ version: 'v1', auth });

        // Build filter: only messages newer than last sync
        let filter;
        if (space.last_sync_time) {
            // RFC 3339 with quotes as required by Chat API filter syntax
            filter = `createTime > "${space.last_sync_time}"`;
        }

        let messages = [];
        try {
            const params = { parent: space.space_name, pageSize: 50, orderBy: 'createTime asc' };
            if (filter) params.filter = filter;
            const { data } = await chat.spaces.messages.list(params);
            messages = data.messages || [];
        } catch (err) {
            console.error(`[GChat] List messages error for ${space.channel}:`, err.message);
            continue;
        }

        if (!messages.length) continue;

        let latestTime = space.last_sync_time;

        for (const msg of messages) {
            // Skip already-processed messages (handles both crm_to_gchat echoes and prior syncs)
            const existing = await dbGet(
                'SELECT id FROM google_chat_message_map WHERE gchat_message_name = ?', [msg.name]);
            if (existing) {
                if (msg.createTime > (latestTime || '')) latestTime = msg.createTime;
                continue;
            }

            // Skip bot messages
            if (msg.sender && msg.sender.type === 'BOT') continue;

            // Identify which CRM user sent this GChat message
            let crmSender = null;
            if (msg.sender && msg.sender.name) {
                // sender.name = 'users/{googleUserId}'
                const googleUserId = msg.sender.name.split('/').pop();
                const tokenRow = await dbGet(
                    'SELECT user_id FROM google_chat_tokens WHERE google_user_id = ?', [googleUserId]);
                if (tokenRow) crmSender = tokenRow.user_id;
            }

            // Fallback: use display name lowercased (e.g. "Hunter" → "hunter")
            if (!crmSender && msg.sender && msg.sender.displayName) {
                const dn = msg.sender.displayName.toLowerCase();
                if (CRM_USERS.includes(dn)) crmSender = dn;
            }

            // Still no match — attribute to display name or 'external'
            if (!crmSender) {
                crmSender = (msg.sender && msg.sender.displayName
                    ? msg.sender.displayName.toLowerCase() : 'external');
            }

            // Extract plain text
            const msgText = (msg.text || msg.formattedText || '').replace(/<[^>]+>/g, '').trim();
            if (!msgText) continue;

            // Determine recipient for DM channels
            let recipient = null;
            if (space.channel !== 'group') {
                // channel = 'dm_X_Y' — recipient is the other party (not the sender)
                const parts = space.channel.replace(/^dm_/, '').split('_');
                const other = parts.find(u => u !== crmSender && CRM_USERS.includes(u));
                if (other) recipient = other;
            }

            const readBy = JSON.stringify(CRM_USERS.includes(crmSender) ? [crmSender] : []);

            const result = await dbRun(
                `INSERT INTO chat_messages (sender, recipient, message, read_by) VALUES (?, ?, ?, ?)`,
                [crmSender, recipient || null, msgText, readBy]
            );

            await dbRun(
                `INSERT OR IGNORE INTO google_chat_message_map
                 (crm_message_id, gchat_message_name, direction) VALUES (?, ?, 'gchat_to_crm')`,
                [result.lastID, msg.name]
            ).catch(() => {});

            if (!latestTime || msg.createTime > latestTime) latestTime = msg.createTime;
        }

        // Advance the cursor so next poll only fetches newer messages
        if (latestTime && latestTime !== space.last_sync_time) {
            await dbRun('UPDATE google_chat_spaces SET last_sync_time = ? WHERE channel = ?',
                [latestTime, space.channel]).catch(() => {});
        }
    }
}

// ─── Background Sync ──────────────────────────────────────────────────────────

let _syncInterval = null;

function startSync(intervalMs = 5000) {
    if (_syncInterval) return;
    _syncInterval = setInterval(async () => {
        try { await syncFromGChat(); } catch (e) { console.error('[GChat] Sync tick error:', e.message); }
    }, intervalMs);
    console.log(`[GChat] Background sync started (every ${intervalMs / 1000}s)`);
}

module.exports = { router, startSync, forwardToGChat };
