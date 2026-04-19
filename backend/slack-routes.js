/**
 * Slack Bidirectional Sync
 * CRM team chat ↔ Slack channel, 2-way in real time.
 *
 * After deploying, complete setup in Slack:
 *  1. api.slack.com/apps → your app → Features → Event Subscriptions → Enable
 *  2. Request URL: https://162-220-14-239.nip.io/api/slack/events  (auto-verifies)
 *  3. Subscribe to bot events: add  message.channels  →  Save Changes
 *  4. In your Slack channel, type:  /invite @Vanguard CRM
 */

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const axios   = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const dbPath = path.join(__dirname, '../vanguard.db');
const db     = new sqlite3.Database(dbPath);
const CRM_USERS = ['grant', 'hunter', 'carson'];

// ─── DB Setup ─────────────────────────────────────────────────────────────────

db.serialize(() => {
    // Maps Slack user IDs → CRM usernames
    db.run(`CREATE TABLE IF NOT EXISTS slack_user_map (
        slack_user_id TEXT PRIMARY KEY,
        crm_username  TEXT,
        display_name  TEXT,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tracks forwarded messages to prevent echo loops
    db.run(`CREATE TABLE IF NOT EXISTS slack_message_map (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        crm_message_id INTEGER,
        slack_ts       TEXT UNIQUE,
        slack_channel  TEXT,
        direction      TEXT,
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dbGet(sql, p) {
    return new Promise((res, rej) => db.get(sql, p, (e, r) => e ? rej(e) : res(r || null)));
}
function dbRun(sql, p) {
    return new Promise((res, rej) => db.run(sql, p, function(e) { e ? rej(e) : res(this); }));
}

function verifySlackSignature(rawBody, headers) {
    const secret = process.env.SLACK_SIGNING_SECRET;
    if (!secret) return true; // Skip if not configured
    const ts  = headers['x-slack-request-timestamp'];
    const sig = headers['x-slack-signature'];
    if (!ts || !sig) return false;
    if (Math.abs(Date.now() / 1000 - parseInt(ts)) > 300) return false;
    const base = `v0:${ts}:${rawBody}`;
    const hash = 'v0=' + crypto.createHmac('sha256', secret).update(base).digest('hex');
    try { return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(sig)); } catch { return false; }
}

// Resolve Slack user ID → CRM username (with caching)
async function resolveCrmUser(slackUserId) {
    const cached = await dbGet('SELECT crm_username, display_name FROM slack_user_map WHERE slack_user_id = ?', [slackUserId]);
    if (cached) return { crm: cached.crm_username, display: cached.display_name };

    let displayName = slackUserId;
    try {
        const resp = await axios.get('https://slack.com/api/users.info', {
            params: { user: slackUserId },
            headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
        });
        if (resp.data.ok) {
            const p = resp.data.user.profile;
            displayName = (p.display_name || p.real_name || slackUserId).toLowerCase().trim();
        }
    } catch(e) { /* use fallback */ }

    // Try to match to a known CRM user by name
    const crmMatch = CRM_USERS.find(u => displayName.includes(u)) || null;

    await dbRun(
        `INSERT OR REPLACE INTO slack_user_map (slack_user_id, crm_username, display_name) VALUES (?, ?, ?)`,
        [slackUserId, crmMatch, displayName]
    ).catch(() => {});

    return { crm: crmMatch, display: displayName };
}

// ─── Events Endpoint (Slack → CRM) ───────────────────────────────────────────

router.post('/events', async (req, res) => {
    const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

    if (!verifySlackSignature(rawBody, req.headers)) {
        return res.status(401).send('Unauthorized');
    }

    const payload = req.body;
    if (!payload || typeof payload !== 'object') return res.status(400).send('Bad JSON');

    // URL verification challenge — Slack sends this when you first save the endpoint
    if (payload.type === 'url_verification') {
        return res.json({ challenge: payload.challenge });
    }

    // Acknowledge immediately so Slack doesn't retry
    res.sendStatus(200);

    if (payload.type !== 'event_callback') return;
    const event = payload.event;
    if (!event || event.type !== 'message') return;
    if (event.subtype || event.bot_id) return; // skip edits, deletes, bot posts

    try {
        // Dedupe — already processed?
        const existing = await dbGet('SELECT id FROM slack_message_map WHERE slack_ts = ?', [event.ts]);
        if (existing) return;

        const { crm, display } = await resolveCrmUser(event.user);
        const sender = crm || display || 'slack';

        // Clean up Slack formatting: strip @mentions, links, etc.
        const text = (event.text || '')
            .replace(/<@[A-Z0-9]+>/g, '')
            .replace(/<#[A-Z0-9]+\|([^>]+)>/g, '#$1')
            .replace(/<([^|>]+)\|([^>]+)>/g, '$2')
            .replace(/<([^>]+)>/g, '$1')
            .trim();
        if (!text) return;

        const readBy = JSON.stringify(CRM_USERS.includes(sender) ? [sender] : []);
        const result = await dbRun(
            `INSERT INTO chat_messages (sender, recipient, message, read_by) VALUES (?, NULL, ?, ?)`,
            [sender, text, readBy]
        );

        await dbRun(
            `INSERT OR IGNORE INTO slack_message_map (crm_message_id, slack_ts, slack_channel, direction)
             VALUES (?, ?, ?, 'slack_to_crm')`,
            [result.lastID, event.ts, event.channel]
        ).catch(() => {});

        console.log(`[Slack] ← ${sender}: ${text.substring(0, 60)}`);
    } catch(e) {
        console.error('[Slack] Event error:', e.message);
    }
});

// ─── Status ───────────────────────────────────────────────────────────────────

router.get('/status', async (req, res) => {
    const hasWebhook = !!process.env.SLACK_WEBHOOK_URL;
    const hasToken   = !!process.env.SLACK_BOT_TOKEN;

    // Test the webhook is reachable
    let webhookOk = false;
    if (hasWebhook) {
        try {
            // Send empty payload — Slack returns 'no_text' which means the webhook IS valid
            const r = await axios.post(process.env.SLACK_WEBHOOK_URL, { text: '' });
            webhookOk = true;
        } catch(e) {
            webhookOk = e.response && e.response.data === 'no_text'; // still means webhook is valid
        }
    }

    res.json({ hasWebhook, hasToken, webhookOk });
});

// ─── CRM → Slack Forwarding ───────────────────────────────────────────────────

async function forwardToSlack(channel, sender, message, crmMessageId) {
    if (!process.env.SLACK_WEBHOOK_URL) return;
    if (channel !== 'group') return; // Webhook is channel-specific; DMs need separate setup

    try {
        const displayName = sender.charAt(0).toUpperCase() + sender.slice(1);
        const resp = await axios.post(process.env.SLACK_WEBHOOK_URL, {
            text: `*${displayName}:* ${message}`
        });
        console.log(`[Slack] → ${displayName}: ${message.substring(0, 60)}`);
    } catch(e) {
        console.error('[Slack] Forward error:', e.message);
    }
}

module.exports = { router, forwardToSlack };
