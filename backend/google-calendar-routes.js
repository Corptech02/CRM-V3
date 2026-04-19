/**
 * Google Calendar Bidirectional Sync
 * Connects each CRM user's Google account and keeps events in sync both ways.
 *
 * Setup (one-time):
 *  1. Go to https://console.cloud.google.com → New project → Enable "Google Calendar API"
 *  2. APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web Application)
 *  3. Add Authorized redirect URI: https://162-220-14-239.nip.io/api/google-calendar/callback
 *  4. Copy Client ID + Secret into .env:
 *       GOOGLE_CLIENT_ID=your_client_id
 *       GOOGLE_CLIENT_SECRET=your_client_secret
 */

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../vanguard.db');
const db = new sqlite3.Database(dbPath);

const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://162-220-14-239.nip.io/api/google-calendar/callback';
const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.email'
];

// ─── DB Table Setup ───────────────────────────────────────────────────────────

db.run(`CREATE TABLE IF NOT EXISTS google_calendar_tokens (
    user_id      TEXT PRIMARY KEY,
    access_token  TEXT,
    refresh_token TEXT,
    token_expiry  TEXT,
    google_email  TEXT,
    sync_token    TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.run(`CREATE TABLE IF NOT EXISTS google_calendar_event_map (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    crm_event_id    TEXT NOT NULL,
    crm_event_type  TEXT NOT NULL,
    google_event_id TEXT NOT NULL,
    user_id         TEXT NOT NULL,
    source          TEXT DEFAULT 'crm',
    last_synced     DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(crm_event_id, crm_event_type, user_id)
)`);

// ─── OAuth Helpers ────────────────────────────────────────────────────────────

function getOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        REDIRECT_URI
    );
}

function getTokenForUser(userId) {
    const uid = (userId || '').toLowerCase();
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM google_calendar_tokens WHERE LOWER(user_id) = ?', [uid], (err, row) => {
            if (err) reject(err); else resolve(row || null);
        });
    });
}

function saveToken(userId, tokens, googleEmail) {
    const uid = (userId || '').toLowerCase();
    return new Promise((resolve, reject) => {
        db.run(`INSERT OR REPLACE INTO google_calendar_tokens
                (user_id, access_token, refresh_token, token_expiry, google_email, updated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [uid, tokens.access_token,
             tokens.refresh_token || null,
             tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
             googleEmail || null],
            (err) => err ? reject(err) : resolve());
    });
}

async function getAuthClientForUser(userId) {
    userId = (userId || '').toLowerCase();
    const row = await getTokenForUser(userId);
    if (!row) throw new Error(`Google Calendar not connected for user "${userId}"`);

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
        access_token:  row.access_token,
        refresh_token: row.refresh_token,
        expiry_date:   row.token_expiry ? new Date(row.token_expiry).getTime() : null
    });

    // Persist refreshed tokens automatically
    oauth2Client.on('tokens', (newTokens) => {
        const merged = { ...newTokens };
        if (!merged.refresh_token) merged.refresh_token = row.refresh_token;
        saveToken(userId, merged, row.google_email)
            .catch(e => console.error('[GCal] token refresh save error:', e.message));
    });

    return oauth2Client;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/google-calendar/auth?userId=xxx
 * Redirect user to Google OAuth consent screen
 */
router.get('/auth', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(503).send(`
            <html><body style="font-family:sans-serif;text-align:center;padding:40px;">
                <h2 style="color:#ef4444;">Google Calendar Not Configured</h2>
                <p>Add <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> to your <code>.env</code> file.</p>
                <p>See setup instructions at the top of <code>backend/google-calendar-routes.js</code></p>
            </body></html>
        `);
    }

    const oauth2Client = getOAuth2Client();
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        state: userId,
        prompt: 'consent'   // force refresh_token on every auth
    });

    res.redirect(authUrl);
});

/**
 * GET /api/google-calendar/callback
 * OAuth callback — exchange code for tokens, save, close popup
 */
router.get('/callback', async (req, res) => {
    const { code, state: userId, error } = req.query;

    if (error) {
        return res.send(popupMsg(false, null, error));
    }
    if (!code || !userId) {
        return res.status(400).send('Missing code or state');
    }

    try {
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: userInfo } = await oauth2.userinfo.get();
        const googleEmail = userInfo.email;

        await saveToken(userId, tokens, googleEmail);
        console.log(`✅ [GCal] Connected for user ${userId} → ${googleEmail}`);

        // Initial sync in background
        setTimeout(() => syncGoogleToCRM(userId).catch(e => console.error('[GCal] initial sync error:', e.message)), 1500);

        res.send(popupMsg(true, googleEmail, null));
    } catch (err) {
        console.error('[GCal] OAuth callback error:', err.message);
        res.send(popupMsg(false, null, err.message));
    }
});

/**
 * GET /api/google-calendar/status?userId=xxx
 */
router.get('/status', async (req, res) => {
    const userId = (req.query.userId || '').toLowerCase();
    if (!userId) return res.status(400).json({ error: 'userId required' });

    try {
        const row = await getTokenForUser(userId);
        const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
        res.json({ connected: !!row, email: row ? row.google_email : null, configured });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/google-calendar/disconnect?userId=xxx
 */
router.delete('/disconnect', (req, res) => {
    const userId = (req.query.userId || '').toLowerCase();
    if (!userId) return res.status(400).json({ error: 'userId required' });

    db.run('DELETE FROM google_calendar_tokens WHERE user_id = ?', [userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.run('DELETE FROM google_calendar_event_map WHERE user_id = ?', [userId], () => {});
        console.log(`🔌 [GCal] Disconnected for user ${userId}`);
        res.json({ success: true });
    });
});

/**
 * POST /api/google-calendar/sync?userId=xxx  (or body { userId })
 * Full bidirectional sync — call manually or via "Sync Now" button
 */
router.post('/sync', async (req, res) => {
    const userId = (req.query.userId || req.body.userId || '').toLowerCase();
    if (!userId) return res.status(400).json({ error: 'userId required' });

    try {
        // Must run sequentially: pull deletions from Google first so we don't
        // immediately re-push events the user just deleted in Google.
        const fromGoogle = await syncGoogleToCRM(userId);
        const toGoogle   = await syncCRMToGoogle(userId);
        res.json({
            success: true,
            message: `Imported ${fromGoogle} events from Google, pushed ${toGoogle} events to Google`
        });
    } catch (err) {
        console.error('[GCal] sync error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── Core Sync Logic ─────────────────────────────────────────────────────────

/**
 * Push a single CRM calendar_event to Google.
 * Called automatically when a CRM event is created or updated.
 */
async function pushCRMEventToGoogle(userId, crmEvent) {
    userId = (userId || '').toLowerCase();
    try {
        const auth = await getAuthClientForUser(userId);
        const calendar = google.calendar({ version: 'v3', auth });

        const googleEvent = buildGoogleEvent(crmEvent);
        const existing = await getMapping(crmEvent.id, 'calendar_event', userId);

        let googleEventId;
        if (existing) {
            try {
                await calendar.events.update({ calendarId: 'primary', eventId: existing.google_event_id, resource: googleEvent });
                googleEventId = existing.google_event_id;
            } catch (err) {
                if (isNotFound(err)) {
                    // Event was deleted in Google — respect the deletion, remove from CRM too
                    console.log(`[GCal] calendar_event ${crmEvent.id} deleted in Google, removing from CRM`);
                    await new Promise(resolve => db.run(
                        'DELETE FROM calendar_events WHERE id=? AND LOWER(created_by)=?',
                        [crmEvent.id, userId], () => resolve()));
                    await removeMapping(crmEvent.id, 'calendar_event', userId);
                    return null;
                } else throw err;
            }
        } else {
            const r = await calendar.events.insert({ calendarId: 'primary', resource: googleEvent });
            googleEventId = r.data.id;
            await saveMapping(crmEvent.id, 'calendar_event', googleEventId, userId, 'crm');
        }

        return googleEventId;
    } catch (err) {
        if (isNotConnected(err)) return null;
        console.error(`[GCal] pushCRMEvent error (id=${crmEvent.id}):`, err.message);
        return null;
    }
}

/**
 * Push a scheduled callback to Google.
 * Called automatically when a callback is created or rescheduled.
 */
async function pushCallbackToGoogle(userId, callback, leadName) {
    userId = (userId || '').toLowerCase();
    try {
        const auth = await getAuthClientForUser(userId);
        const calendar = google.calendar({ version: 'v3', auth });

        const dt = new Date(callback.date_time);
        const end = new Date(dt.getTime() + 30 * 60 * 1000);

        const googleEvent = {
            summary: `📞 CB: ${leadName || 'Unknown'}`,
            description: callback.notes || '',
            colorId: getGoogleColorId(callback.assigned_agent),
            start: { dateTime: dt.toISOString(), timeZone: 'America/New_York' },
            end:   { dateTime: end.toISOString(), timeZone: 'America/New_York' },
            extendedProperties: { private: { crmSource: 'vanguard', crmEventId: String(callback.id), crmEventType: 'callback' } }
        };

        const existing = await getMapping(callback.id, 'callback', userId);
        let googleEventId;

        if (existing) {
            try {
                await calendar.events.update({ calendarId: 'primary', eventId: existing.google_event_id, resource: googleEvent });
                googleEventId = existing.google_event_id;
            } catch (err) {
                if (isNotFound(err)) {
                    // Callback was deleted in Google — mark completed in CRM, don't re-push
                    console.log(`[GCal] callback ${callback.id} deleted in Google, marking completed`);
                    await new Promise(resolve => db.run(
                        'UPDATE scheduled_callbacks SET completed=1, updated_at=CURRENT_TIMESTAMP WHERE id=?',
                        [callback.id], () => resolve()));
                    await removeMapping(callback.id, 'callback', userId);
                    return null;
                } else throw err;
            }
        } else {
            const r = await calendar.events.insert({ calendarId: 'primary', resource: googleEvent });
            googleEventId = r.data.id;
            await saveMapping(callback.id, 'callback', googleEventId, userId, 'crm');
        }

        return googleEventId;
    } catch (err) {
        if (isNotConnected(err)) return null;
        console.error(`[GCal] pushCallback error (id=${callback.id}):`, err.message);
        return null;
    }
}

/**
 * Remove a CRM event from Google when it's deleted in the CRM.
 */
async function deleteCRMEventFromGoogle(userId, crmEventId, crmEventType) {
    userId = (userId || '').toLowerCase();
    try {
        const mapping = await getMapping(crmEventId, crmEventType, userId);
        if (!mapping) return;

        const auth = await getAuthClientForUser(userId);
        const calendar = google.calendar({ version: 'v3', auth });

        try {
            await calendar.events.delete({ calendarId: 'primary', eventId: mapping.google_event_id });
        } catch (err) {
            if (!isNotFound(err)) console.error('[GCal] delete error:', err.message);
        }

        await removeMapping(crmEventId, crmEventType, userId);
    } catch (err) {
        if (isNotConnected(err)) return;
        console.error(`[GCal] deleteCRMEvent error:`, err.message);
    }
}

/**
 * Pull ALL changes from Google Calendar → CRM (create / update / delete).
 * Uses incremental syncToken so cancellations are always visible.
 * On a full resync (first run or expired token) we reconcile the mapping
 * table against what Google actually returned so deletions still propagate.
 */
async function syncGoogleToCRM(userId) {
    userId = (userId || '').toLowerCase();
    try {
        const auth = await getAuthClientForUser(userId);
        const calendar = google.calendar({ version: 'v3', auth });

        const tokenRow = await getTokenForUser(userId);
        const params = { calendarId: 'primary', maxResults: 250, singleEvents: true };

        let isFullSync = false;
        let windowMin = null, windowMax = null;

        if (tokenRow.sync_token) {
            params.syncToken = tokenRow.sync_token;
        } else {
            isFullSync = true;
            windowMin = new Date(); windowMin.setDate(windowMin.getDate() - 30);
            windowMax = new Date(); windowMax.setFullYear(windowMax.getFullYear() + 1);
            params.timeMin = windowMin.toISOString();
            params.timeMax = windowMax.toISOString();
        }

        let allItems = [];
        let nextPage = null;
        let newSyncToken = null;

        do {
            if (nextPage) params.pageToken = nextPage;
            let resp;
            try {
                resp = await calendar.events.list(params);
            } catch (err) {
                if (err.code === 410) {
                    // syncToken expired — fall back to full resync
                    isFullSync = true;
                    delete params.syncToken;
                    delete params.pageToken;
                    windowMin = new Date(); windowMin.setDate(windowMin.getDate() - 30);
                    windowMax = new Date(); windowMax.setFullYear(windowMax.getFullYear() + 1);
                    params.timeMin = windowMin.toISOString();
                    params.timeMax = windowMax.toISOString();
                    await clearMappingsBySource(userId, 'google_sourced');
                    resp = await calendar.events.list(params);
                } else throw err;
            }

            allItems = allItems.concat(resp.data.items || []);
            nextPage = resp.data.nextPageToken;
            newSyncToken = resp.data.nextSyncToken;
        } while (nextPage);

        // Await the token save so the next sync sees it immediately
        if (newSyncToken) {
            await new Promise(resolve => db.run(
                'UPDATE google_calendar_tokens SET sync_token = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
                [newSyncToken, userId], () => resolve()));
        }

        let imported = 0;
        // Track every active Google event ID returned in this pass
        const seenGoogleIds = new Set();

        for (const gEvent of allItems) {
            const priv = gEvent.extendedProperties && gEvent.extendedProperties.private;
            const isCRMSourced = priv && priv.crmSource === 'vanguard';

            if (gEvent.status === 'cancelled') {
                // Incremental sync: explicit deletion signal — remove from CRM regardless of source
                await deleteGoogleSourcedEventFromCRM(gEvent.id, userId);
                continue;
            }

            // Track active event (CRM-sourced or Google-sourced)
            seenGoogleIds.add(gEvent.id);

            // Don't re-import events that originated in this CRM
            if (isCRMSourced) continue;

            const isAllDay = !gEvent.start.dateTime;
            const eventDate = isAllDay ? gEvent.start.date : gEvent.start.dateTime.substring(0, 10);
            const eventTime = isAllDay ? null : gEvent.start.dateTime.substring(11, 16);
            const title = gEvent.summary || '(No title)';
            const description = gEvent.description || gEvent.location || '';

            const existing = await getMappingByGoogleId(gEvent.id, userId);

            if (existing) {
                await new Promise(resolve => db.run(
                    'UPDATE calendar_events SET title=?, date=?, time=?, description=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND LOWER(created_by)=?',
                    [title, eventDate, eventTime, description, existing.crm_event_id, userId], () => resolve()));
            } else {
                const newId = await createCRMEvent({ title, date: eventDate, time: eventTime, description, userId });
                if (newId) {
                    await saveMapping(newId, 'calendar_event', gEvent.id, userId, 'google_sourced');
                    imported++;
                }
            }
        }

        // ── Full-resync reconciliation ─────────────────────────────────────
        // On a full resync Google only returns ACTIVE events — deleted events
        // are simply absent.  Compare what we got against what's in the mapping
        // table; anything missing was deleted in Google and must be removed from CRM.
        if (isFullSync && windowMin && windowMax) {
            const winMinStr = windowMin.toISOString().substring(0, 10);
            const winMaxStr = windowMax.toISOString().substring(0, 10);

            const mappings = await new Promise(resolve =>
                db.all(`SELECT m.* FROM google_calendar_event_map m
                        LEFT JOIN calendar_events e ON e.id = CAST(m.crm_event_id AS INTEGER)
                        WHERE m.user_id = ?
                          AND m.crm_event_type = 'calendar_event'
                          AND (e.date IS NULL OR (e.date >= ? AND e.date <= ?))`,
                    [userId, winMinStr, winMaxStr], (err, rows) => resolve(rows || [])));

            for (const mapping of mappings) {
                if (!seenGoogleIds.has(mapping.google_event_id)) {
                    console.log(`[GCal] Reconcile: ${mapping.google_event_id} absent from Google, removing CRM event ${mapping.crm_event_id}`);
                    await deleteGoogleSourcedEventFromCRM(mapping.google_event_id, userId);
                }
            }
        }

        console.log(`📥 [GCal] Google→CRM: ${allItems.length} items, ${imported} new for ${userId}`);
        return imported;
    } catch (err) {
        if (isNotConnected(err)) return 0;
        console.error('[GCal] syncGoogleToCRM error:', err.message);
        return 0;
    }
}

/**
 * Push CRM events to Google — SAFETY NET ONLY.
 * Only pushes events that have no Google mapping yet (i.e. the create-hook
 * may have failed).  Events that already have a mapping are NEVER re-pushed
 * here; that would restore events the user intentionally deleted in Google.
 * Real-time CRM→Google sync is handled by the per-event hooks in server.js.
 */
async function syncCRMToGoogle(userId) {
    userId = (userId || '').toLowerCase();
    let pushed = 0, skipped = 0;

    // calendar_events — only those with no existing Google mapping
    await new Promise((resolve) => {
        db.all('SELECT * FROM calendar_events WHERE LOWER(created_by) = ?', [userId], async (err, events) => {
            if (!err) {
                for (const ev of (events || [])) {
                    const existing = await getMapping(ev.id, 'calendar_event', userId);
                    if (existing) { skipped++; continue; }   // already synced or user deleted from Google
                    const r = await pushCRMEventToGoogle(userId, ev);
                    if (r) pushed++;
                }
            }
            resolve();
        });
    });

    // callbacks — only those with no existing Google mapping
    await new Promise((resolve) => {
        db.all(`SELECT sc.*,
                       json_extract(l.data, '$.name') AS lead_name,
                       json_extract(l.data, '$.assignedTo') AS assigned_agent
                FROM scheduled_callbacks sc
                LEFT JOIN leads l ON l.id = sc.lead_id
                WHERE sc.completed = 0
                ORDER BY sc.date_time ASC`, [], async (err, callbacks) => {
            if (!err) {
                for (const cb of (callbacks || [])) {
                    const existing = await getMapping(cb.id, 'callback', userId);
                    if (existing) { skipped++; continue; }
                    const r = await pushCallbackToGoogle(userId, cb, cb.lead_name);
                    if (r) pushed++;
                }
            }
            resolve();
        });
    });

    console.log(`📤 [GCal] CRM→Google: pushed ${pushed} new events (${skipped} already mapped, skipped)`);
    return pushed;
}

// ─── DB Helpers ───────────────────────────────────────────────────────────────

function getMapping(crmEventId, type, userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM google_calendar_event_map WHERE crm_event_id=? AND crm_event_type=? AND user_id=?',
            [String(crmEventId), type, userId], (err, row) => err ? reject(err) : resolve(row || null));
    });
}

function getMappingByGoogleId(googleEventId, userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM google_calendar_event_map WHERE google_event_id=? AND user_id=?',
            [googleEventId, userId], (err, row) => err ? reject(err) : resolve(row || null));
    });
}

function saveMapping(crmEventId, type, googleEventId, userId, source) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT OR REPLACE INTO google_calendar_event_map
                (crm_event_id, crm_event_type, google_event_id, user_id, source, last_synced)
                VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
            [String(crmEventId), type, googleEventId, userId, source || 'crm'],
            (err) => err ? reject(err) : resolve());
    });
}

function removeMapping(crmEventId, type, userId) {
    return new Promise((resolve) => {
        db.run('DELETE FROM google_calendar_event_map WHERE crm_event_id=? AND crm_event_type=? AND user_id=?',
            [String(crmEventId), type, userId], () => resolve());
    });
}

function clearMappingsBySource(userId, source) {
    return new Promise((resolve) => {
        db.run('DELETE FROM google_calendar_event_map WHERE user_id=? AND source=?', [userId, source], () => resolve());
    });
}

function createCRMEvent({ title, date, time, description, userId }) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO calendar_events (title, date, time, description, created_by) VALUES (?,?,?,?,?)',
            [title, date, time || null, description || null, userId],
            function(err) { if (err) reject(err); else resolve(this.lastID); });
    });
}

async function deleteGoogleSourcedEventFromCRM(googleEventId, userId) {
    const mapping = await getMappingByGoogleId(googleEventId, userId).catch(() => null);
    if (!mapping) return;

    // Fully await all DB writes so syncCRMToGoogle never sees a stale row
    if (mapping.crm_event_type === 'callback') {
        await new Promise(resolve => db.run(
            'UPDATE scheduled_callbacks SET completed=1, updated_at=CURRENT_TIMESTAMP WHERE id=?',
            [mapping.crm_event_id], () => resolve()));
    } else {
        await new Promise(resolve => db.run(
            'DELETE FROM calendar_events WHERE id=? AND LOWER(created_by)=?',
            [mapping.crm_event_id, userId], () => resolve()));
    }

    await new Promise(resolve => db.run(
        'DELETE FROM google_calendar_event_map WHERE google_event_id=? AND user_id=?',
        [googleEventId, userId], () => resolve()));
}

// ─── Misc Helpers ─────────────────────────────────────────────────────────────

function getGoogleColorId(agent) {
    const a = (agent || '').toLowerCase();
    if (a.includes('carson'))  return '7';  // Peacock (blue)
    if (a.includes('grant'))   return '2';  // Sage (green)
    if (a.includes('maureen')) return '3';  // Grape (purple)
    if (a.includes('hunter'))  return '5';  // Banana (yellow)
    return '6'; // Tangerine (orange) fallback
}

function buildGoogleEvent(crmEvent) {
    const isAllDay = !crmEvent.time;
    let start, end;
    if (!isAllDay) {
        const startDt = new Date(`${crmEvent.date}T${crmEvent.time}:00`);
        const endDt   = new Date(startDt.getTime() + 60 * 60 * 1000);
        start = { dateTime: startDt.toISOString(), timeZone: 'America/New_York' };
        end   = { dateTime: endDt.toISOString(),   timeZone: 'America/New_York' };
    } else {
        start = { date: crmEvent.date };
        end   = { date: crmEvent.date };
    }
    return {
        summary:     crmEvent.title,
        description: crmEvent.description || '',
        start, end,
        extendedProperties: { private: {
            crmSource:    'vanguard',
            crmEventId:   String(crmEvent.id),
            crmEventType: 'calendar_event'
        }}
    };
}

function popupMsg(success, email, error) {
    if (success) {
        return `<html><body style="font-family:sans-serif;text-align:center;padding:40px;">
            <h2 style="color:#22c55e;">✅ Google Calendar Connected!</h2>
            <p>Connected as <strong>${email}</strong></p>
            <p>This window will close...</p>
            <script>
                if (window.opener) window.opener.postMessage({type:'google-calendar-auth',success:true,email:'${email}'},'*');
                setTimeout(() => window.close(), 1800);
            </script></body></html>`;
    } else {
        return `<html><body style="font-family:sans-serif;text-align:center;padding:40px;">
            <h2 style="color:#ef4444;">Connection Failed</h2>
            <p>${error || 'Unknown error'}</p>
            <script>
                if (window.opener) window.opener.postMessage({type:'google-calendar-auth',success:false,error:'${(error||'').replace(/'/g,"\\'")}'},'*');
                setTimeout(() => window.close(), 3000);
            </script></body></html>`;
    }
}

function isNotFound(err) {
    return err && (err.code === 404 || err.status === 404 ||
        (err.errors && err.errors[0] && err.errors[0].reason === 'notFound'));
}

function isNotConnected(err) {
    return err && err.message && err.message.startsWith('Google Calendar not connected');
}

// ─── Server-side Auto Sync ────────────────────────────────────────────────────

async function runAutoSync() {
    db.all('SELECT user_id FROM google_calendar_tokens', [], async (err, rows) => {
        if (err || !rows || rows.length === 0) return;
        for (const row of rows) {
            try {
                await syncGoogleToCRM(row.user_id);
                await syncCRMToGoogle(row.user_id);
            } catch (e) {
                console.error(`[GCal] Auto-sync error for ${row.user_id}:`, e.message);
            }
        }
    });
}

function startAutoSync() {
    function scheduleNext() {
        const now = new Date();
        // Current hour in EST (UTC-5 standard, UTC-4 daylight — use fixed offset approach)
        const estHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getHours();
        const isBusinessHours = estHour >= 9 && estHour < 18; // 9am–6pm EST
        const intervalMs = isBusinessHours ? 5 * 60 * 1000 : 10 * 60 * 1000;
        console.log(`[GCal] Next auto-sync in ${isBusinessHours ? 5 : 10} min (EST hour: ${estHour})`);
        setTimeout(async () => {
            await runAutoSync();
            scheduleNext();
        }, intervalMs);
    }
    runAutoSync(); // run once immediately on startup
    scheduleNext();
    console.log('[GCal] Auto-sync started — 5min (9am-6pm EST), 10min (6pm-9am EST)');
}

// Export router + functions needed by server.js hooks
module.exports = {
    router,
    pushCRMEventToGoogle,
    pushCallbackToGoogle,
    deleteCRMEventFromGoogle,
    syncGoogleToCRM,
    startAutoSync
};
