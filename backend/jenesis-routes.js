/**
 * JenesisNow integration routes
 * Authenticates server-side and proxies download/policy-job data
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

const JENESIS_BASE = 'https://ww12.jenesisnow.net';
const LOGIN_URL = `${JENESIS_BASE}/login/login`;

// Cached session cookie + expiry
let sessionCookie = null;
let sessionExpiry = 0;
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

async function getSession() {
    if (sessionCookie && Date.now() < sessionExpiry) {
        return sessionCookie;
    }

    const params = new URLSearchParams();
    params.append('email', process.env.JENESIS_EMAIL);
    params.append('password', process.env.JENESIS_PASSWORD);

    const resp = await axios.post(LOGIN_URL, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        maxRedirects: 5,
        withCredentials: true,
    });

    // Collect Set-Cookie headers
    const raw = resp.headers['set-cookie'];
    if (!raw || raw.length === 0) {
        throw new Error('JenesisNow login did not return any cookies — check credentials');
    }

    // Join all cookie name=value pairs (strip flags like Path, HttpOnly, etc.)
    sessionCookie = raw.map(c => c.split(';')[0]).join('; ');
    sessionExpiry = Date.now() + SESSION_TTL_MS;

    return sessionCookie;
}

async function jenesisPost(path, data = {}) {
    const cookie = await getSession();
    const params = new URLSearchParams(data);
    const resp = await axios.post(`${JENESIS_BASE}${path}`, params.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookie,
            'X-Requested-With': 'XMLHttpRequest',
        },
        maxRedirects: 0,
        validateStatus: s => s < 400,
    });
    return resp.data;
}

// Force re-login on next request
function invalidateSession() {
    sessionCookie = null;
    sessionExpiry = 0;
}

// GET /api/jenesis/downloads
// Query params: status (optional, e.g. "All" or "-1" for hide-processed)
router.get('/downloads', async (req, res) => {
    try {
        const status = req.query.status || '-1';
        const data = await jenesisPost('/download/getDownloadFileAjax', { status });
        res.json(data);
    } catch (err) {
        if (err.response && err.response.status === 401) {
            invalidateSession();
        }
        console.error('[JenesisNow] /downloads error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/jenesis/policy-jobs
router.get('/policy-jobs', async (req, res) => {
    try {
        const data = await jenesisPost('/download/getJobTransactionAjax');
        res.json(data);
    } catch (err) {
        if (err.response && err.response.status === 401) {
            invalidateSession();
        }
        console.error('[JenesisNow] /policy-jobs error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Parse PHP print_r messageArray into an array of { group, contents } segment objects
function parseAl3Segments(printRStr) {
    const segments = [];
    // Each top-level array item looks like:
    //   [N] => Array
    //       ( [group] => XXXX [contents] => Array ( [K] => V ... ) )
    const itemRe = /\[group\]\s*=>\s*(\S+)[\s\S]*?\[contents\]\s*=>\s*Array\s*\(\s*([\s\S]*?)\s*\)\s*\n\s*\)/g;
    let m;
    while ((m = itemRe.exec(printRStr)) !== null) {
        const group = m[1];
        const contents = {};
        const kvRe = /\[(\w+)\]\s*=>\s*(.*?)(?=\r?\n\s+\[|\r?\n\s+\))/g;
        let kv;
        while ((kv = kvRe.exec(m[2])) !== null) {
            contents[kv[1]] = kv[2].trim();
        }
        segments.push({ group, contents });
    }
    return segments;
}

// Convert parsed segments into policy objects the import flow understands
function segmentsToPolicies(segments, jobId) {
    // Helper: parse YYMMDD → MM/DD/YYYY
    function parseDate(d) {
        if (!d || d.length < 6) return '';
        const yy = parseInt(d.substring(0, 2), 10);
        const mm = d.substring(2, 4);
        const dd = d.substring(4, 6);
        const yyyy = (yy >= 50 ? 1900 : 2000) + yy;
        return `${mm}/${dd}/${yyyy}`;
    }
    // Helper: parse fixed-point premium "00000053200+" → "532.00"
    function parsePrem(fprem) {
        if (!fprem) return '';
        const digits = fprem.replace(/[^0-9]/g, '');
        const n = parseInt(digits, 10);
        return isNaN(n) ? '' : String(n / 100);
    }
    // Helper: parse INAME "P  FirstName  LastName" or "C CompanyName"
    function parseName(iname) {
        if (!iname) return '';
        const raw = iname.trim();
        const code = raw[0];
        const rest = raw.substring(1).trim();
        if (!rest) return '';
        if (code === 'C' || code === 'B') return rest; // commercial
        // Personal: "FirstName   LastName" — split on 2+ spaces
        const parts = rest.split(/\s{2,}/).filter(Boolean);
        return parts.join(' ');
    }

    const policies = [];
    // Segments are ordered per-policy: 2TRG, 5BIS, ..., 5BPI, 6COM, ...
    // We process in order, accumulating per-policy context when we hit 2TRG
    let cur = null;

    for (const seg of segments) {
        const c = seg.contents;
        switch (seg.group) {
            case '2TRG':
                if (cur) policies.push(cur);
                cur = {
                    carrier:        c.ITADD1 || '',
                    lob:            c.LOBRC  || '',
                    effectiveDate:  parseDate(c.EFFDT ? c.EFFDT.replace(/[^0-9]/g,'').substring(0,6) : '') || '',
                    policyNumber:   '',
                    insuredName:    '',
                    expirationDate: '',
                    premium:        '',
                    email:          '',
                    phone:          '',
                    address:        '',
                    _jnJobId:       jobId,
                };
                break;
            case '5BIS':
                if (cur) cur.insuredName = parseName(c.INAME) || cur.insuredName;
                break;
            case '5BPI':
                if (cur) {
                    if (c.POLNO) cur.policyNumber   = c.POLNO;
                    if (c.LOBCD) cur.lob             = c.LOBCD || cur.lob;
                    if (c.EFFDT6) cur.effectiveDate  = parseDate(c.EFFDT6);
                    if (c.EXPDT6) cur.expirationDate = parseDate(c.EXPDT6);
                    if (c.FPREM)  cur.premium        = parsePrem(c.FPREM);
                }
                break;
            case '6COM':
                if (cur) {
                    if (c.CIDTC === 'EMAIL' && c.COMID) cur.email = c.COMID;
                    if (c.CIDTC === 'PHONE' && c.COMID) cur.phone = c.COMID;
                }
                break;
        }
    }
    if (cur) policies.push(cur);

    return policies.filter(p => p.policyNumber || p.insuredName);
}

// GET /api/jenesis/file/:jobId  — fetch structured policy data via showAl3
router.get('/file/:jobId', async (req, res) => {
    const { jobId } = req.params;
    try {
        const cookie = await getSession();

        // Call JenesisNow's showAl3 endpoint (same as the "Show Al3" button in the UI)
        const resp = await axios.post(`${JENESIS_BASE}/download/showAl3`,
            new URLSearchParams({ importJobId: jobId }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': cookie,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                validateStatus: s => s < 500,
            }
        );

        const data = resp.data;
        if (!data || data.status !== 'OK') {
            console.warn(`[JenesisNow] showAl3 for job ${jobId}: status=${data && data.status}`);
            return res.status(404).json({ error: `showAl3 returned non-OK status for job ${jobId}` });
        }

        const messageArray = data.messageArray || '';
        if (!messageArray) {
            return res.status(404).json({ error: `No messageArray in showAl3 response for job ${jobId}` });
        }

        const segments = parseAl3Segments(messageArray);
        const policies = segmentsToPolicies(segments, jobId);

        console.log(`[JenesisNow] /file/${jobId}: parsed ${segments.length} segments → ${policies.length} policies`);
        res.json({ policies, filename: `jenesis_${jobId}.al3` });

    } catch (err) {
        if (err.response && err.response.status === 401) invalidateSession();
        console.error(`[JenesisNow] /file/${jobId} error:`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/jenesis/status  — health check / confirm auth works
router.get('/status', async (req, res) => {
    try {
        await getSession();
        res.json({ ok: true, sessionExpiry: new Date(sessionExpiry).toISOString() });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

module.exports = router;
