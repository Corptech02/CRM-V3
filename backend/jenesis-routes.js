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

async function jenesisGet(path, params = {}) {
    const cookie = await getSession();
    const resp = await axios.get(`${JENESIS_BASE}${path}`, {
        params,
        headers: {
            'Cookie': cookie,
            'X-Requested-With': 'XMLHttpRequest',
        },
        maxRedirects: 0,
        validateStatus: s => s < 400,
    });
    return resp.data;
}

// Build the DataTables + yadcf query params that JenesisNow's download table expects.
// Without the full column definitions JenesisNow ignores start/length and always returns
// the same first page.
function buildDownloadTableParams(draw, start, length) {
    return {
        draw, start, length,
        'columns[0][data]': 0, 'columns[0][name]': 'id',
        'columns[0][searchable]': true, 'columns[0][orderable]': false,
        'columns[0][search][value]': '', 'columns[0][search][regex]': false,
        'columns[1][data]': 1, 'columns[1][name]': 'companyNameInFile',
        'columns[1][searchable]': true, 'columns[1][orderable]': true,
        'columns[1][search][value]': '', 'columns[1][search][regex]': false,
        'columns[2][data]': 2, 'columns[2][name]': 'status',
        'columns[2][searchable]': true, 'columns[2][orderable]': true,
        'columns[2][search][value]': 'All', 'columns[2][search][regex]': false,
        'columns[3][data]': 3, 'columns[3][name]': 'method',
        'columns[3][searchable]': true, 'columns[3][orderable]': true,
        'columns[3][search][value]': '', 'columns[3][search][regex]': false,
        'columns[4][data]': 4, 'columns[4][name]': 'fileType',
        'columns[4][searchable]': true, 'columns[4][orderable]': true,
        'columns[4][search][value]': '', 'columns[4][search][regex]': false,
        'columns[5][data]': 5, 'columns[5][name]': 'created_at',
        'columns[5][searchable]': true, 'columns[5][orderable]': true,
        'columns[5][search][value]': '', 'columns[5][search][regex]': false,
        'columns[6][data]': 6, 'columns[6][name]': 'other',
        'columns[6][searchable]': true, 'columns[6][orderable]': false,
        'columns[6][search][value]': '', 'columns[6][search][regex]': false,
        'order[0][column]': 5, 'order[0][dir]': 'desc',
        'search[value]': '', 'search[regex]': false,
        // yadcf status filter: 'All' shows every record (processed + unprocessed)
        'yadcf_filter_downloadDatatable_2': 'All',
        '_': Date.now(),
    };
}

// Extract job ID from the HTML in column 0, e.g. href="/download/view/77010"
function extractJobId(html) {
    const m = (html || '').match(/\/download\/view\/(\d+)/);
    return m ? m[1] : null;
}

// Strip HTML tags and trim
function stripHtml(html) {
    return (html || '').replace(/<[^>]*>/g, '').trim();
}

// Parse the status HTML cell: extract status text and policy list from popover
function parseStatusCell(html) {
    if (!html) return { status: '', policies: [] };
    // Status text is in <span id="ImportJobStatus...">Processed</span>
    const statusM = html.match(/<span[^>]*id="ImportJobStatus\d+"[^>]*>([^<]+)<\/span>/);
    const status = statusM ? statusM[1].trim() : stripHtml(html).replace(/^\(\d+\)\s*/, '').split('\n')[0].trim();
    // Policy list is in the data-content popover HTML table
    const dataContent = html.match(/data-content="([^"]+)"/);
    const policies = [];
    if (dataContent) {
        const tableHtml = dataContent[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"');
        const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
        let rm;
        while ((rm = rowRe.exec(tableHtml)) !== null) {
            const tds = [];
            const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
            let tm;
            while ((tm = tdRe.exec(rm[1])) !== null) {
                tds.push(tm[1].replace(/<[^>]*>/g,'').trim());
            }
            if (tds.length >= 4 && tds[0]) {
                policies.push({ client: tds[0], polType: tds[1], purpose: tds[2], polNo: tds[3] });
            }
        }
    }
    return { status, policies };
}

// Force re-login on next request
function invalidateSession() {
    sessionCookie = null;
    sessionExpiry = 0;
}

// GET /api/jenesis/downloads
// Returns all 500 download history records from JenesisNow, paginated 50 at a time.
// Each row is normalized to: { id, company, status, method, fileType, createdAt }
// Previously this used POST without column defs — JenesisNow ignored start/length and
// always returned the same first 10 records.  The fix is GET + full DataTables column
// definitions + yadcf_filter_downloadDatatable_2=All.
router.get('/downloads', async (req, res) => {
    try {
        const PAGE = 50;
        let allRows = [];
        let start = 0;
        let recordsTotal = null;
        let draw = 1;

        do {
            const page = await jenesisGet('/download/getDownloadFileAjax',
                buildDownloadTableParams(draw++, start, PAGE));
            const rows = page.data || [];
            if (rows.length === 0) break;
            for (const r of rows) {
                const id = extractJobId(r[0]);
                if (!id) continue;
                const { status, policies } = parseStatusCell(r[2]);
                allRows.push({
                    id,
                    company:   stripHtml(r[1]),
                    status,
                    policies,
                    method:    stripHtml(r[3]),
                    fileType:  stripHtml(r[4]),
                    createdAt: stripHtml(r[5]),
                });
            }
            if (recordsTotal === null) recordsTotal = page.recordsTotal || rows.length;
            start += rows.length;
        } while (start < recordsTotal);

        res.json({ total: recordsTotal, count: allRows.length, rows: allRows });
    } catch (err) {
        if (err.response && err.response.status === 401) invalidateSession();
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
        // $ in lookahead catches the last key whose trailing newline was consumed by itemRe's \s*
        const kvRe = /\[(\w+)\]\s*=>\s*(.*?)(?=\r?\n\s+\[|\r?\n\s+\)|$)/g;
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
    // Helper: parse YYMMDD or YYYYMMDD → MM/DD/YYYY
    function parseDate(d) {
        if (!d) return '';
        const digits = d.replace(/[^0-9]/g, '');
        if (digits.length >= 8) {
            return `${digits.substring(4,6)}/${digits.substring(6,8)}/${digits.substring(0,4)}`;
        }
        if (digits.length >= 6) {
            const yy = parseInt(digits.substring(0, 2), 10);
            const yyyy = (yy >= 50 ? 1900 : 2000) + yy;
            return `${digits.substring(2,4)}/${digits.substring(4,6)}/${yyyy}`;
        }
        return '';
    }
    // Helper: parse fixed-point premium "00000053200+" → "532.00"
    function parsePrem(fprem) {
        if (!fprem) return '';
        const digits = fprem.replace(/[^0-9]/g, '');
        const n = parseInt(digits, 10);
        return isNaN(n) ? '' : (n / 100).toFixed(2);
    }
    // Helper: parse INAME "P  FirstName  LastName" or "C CompanyName"
    // Returns { entityType, displayName, firstName, lastName, companyName }
    function parseNameFull(iname) {
        if (!iname) return { entityType: 'P', displayName: '', firstName: '', lastName: '', companyName: '' };
        const raw  = iname.trim();
        const code = raw[0].toUpperCase();
        const rest = raw.substring(1).trim();
        if (code === 'C' || code === 'B') {
            return { entityType: code, displayName: rest, firstName: '', lastName: '', companyName: rest };
        }
        const parts = rest.split(/\s{2,}/).filter(Boolean);
        const firstName = parts[0] || '';
        const lastName  = parts[1] || '';
        return { entityType: 'P', displayName: parts.join(' '), firstName, lastName, companyName: '' };
    }
    function parseName(iname) { return parseNameFull(iname).displayName; }

    // JenesisNow packs multiple fields into one value: "realValue [NEXTKEY] => nextValue [KEY2] => val2"
    // This helper unpacks ALL embedded [KEY] => value pairs and returns a flat object
    function unpackJnFields(c) {
        const out = {};
        for (const [key, rawVal] of Object.entries(c)) {
            if (!rawVal) { out[key] = ''; continue; }
            const str = String(rawVal);
            // Check if value contains embedded [KEY] => ... patterns
            const parts = str.split(/\s*\[(\w+)\]\s*=>\s*/);
            // parts[0] = the real value of the original key
            out[key] = (parts[0] || '').trim();
            // parts[1]=embeddedKey, parts[2]=embeddedVal, parts[3]=key2, parts[4]=val2, ...
            for (let i = 1; i < parts.length - 1; i += 2) {
                const ek = parts[i];
                const ev = (parts[i + 1] || '').trim();
                out[ek] = ev;
            }
        }
        return out;
    }

    // Extract remark text — tries multiple field name conventions used by different IVANS vendors
    function extractRemarks(c) {
        const tryKeys = [
            ['REMARK1','REMARK2','REMARK3','REMARK4'],
            ['REM1','REM2','REM3','REM4'],
            ['REMK1','REMK2','REMK3','REMK4'],
            ['LINE1','LINE2','LINE3','LINE4'],
            ['TEXT1','TEXT2','TEXT3','TEXT4'],
        ];
        for (const keys of tryKeys) {
            const parts = keys.map(k => c[k]).filter(s => s && String(s).trim());
            if (parts.length) return parts.map(s => String(s).trim()).join(' ');
        }
        // Fallback: collect all non-numeric values from the segment
        const vals = Object.entries(c)
            .filter(([, v]) => v && String(v).trim() && !/^\d+$/.test(String(v).trim()))
            .map(([, v]) => String(v).trim());
        return vals.slice(0, 4).join(' ');
    }

    // Log all unique segment groups for debugging / discovery
    const seenGroups = {};
    for (const seg of segments) seenGroups[seg.group] = (seenGroups[seg.group] || 0) + 1;
    console.log(`[AL3] job ${jobId} segment groups: ${Object.keys(seenGroups).sort().join(', ')}`);
    // Log first instance of any unhandled groups with their contents
    const knownGroups = new Set(['1HDR','9TRL','1SND','2TRG','5BIS','5BPI','5BVO','5BVE','5BDR',
        '5BCO','6COV','6DBC','6DBD','5BFE','6FEE','5BFC','5BPA','6PAY','5BLH','5BLN','5BLD','6LOS','5REM','6REM','6COM',
        '1MHG','2TCG','3MTG', // PROGRESSIVE commission download format
        '5VEH','5CAR','5DRV','6SDV','5RMK','9BIS','5CVG','5SSG','5LAG','5PPH','5FOR',
        '6BVS','6CAS','6CPO','6VIO','6CVA','6LUR','6PDA','6PDR','6PDS','6PVH','2GCG']); // JenesisNow/Progressive policy format
    const loggedUnknown = new Set();
    for (const seg of segments) {
        if (!knownGroups.has(seg.group) && !loggedUnknown.has(seg.group)) {
            console.log(`[AL3] Unhandled segment ${seg.group}:`, JSON.stringify(seg.contents));
            loggedUnknown.add(seg.group);
        }
    }

    const policies = [];
    let cur = null;
    let lastCarrier = ''; // tracks carrier name across segments in commission format

    for (const seg of segments) {
        const c = seg.contents;
        switch (seg.group) {

            case '2TRG': {
                if (cur) policies.push(cur);
                // Carrier name: direct field or embedded in FTADD1 as "[ITADD1] => Name"
                const _itadd1m = (c.FTADD1 || '').match(/\[ITADD1\]\s*=>\s*(.+)/);
                lastCarrier = c.ITADD1 || c.CONAME || (_itadd1m ? _itadd1m[1].trim() : '');
                cur = {
                    carrier:         lastCarrier,
                    carrierCode:     c.ICODE  || c.COCODE || '',
                    carrierAddress:  [c.ITADD1, c.ITADD2, c.ITADD3].filter(Boolean).join(', '),
                    lob:             c.LOBRC  || '',
                    effectiveDate:   parseDate(c.EFFDT  || ''),
                    policyNumber:    '',
                    insuredName:     '',
                    expirationDate:  '',
                    premium:         '',
                    email:           '',
                    phone:           '',
                    cell:            '',
                    address:         '',
                    city:            '',
                    state:           '',
                    zip:             '',
                    entityType:      '',
                    firstName:       '',
                    lastName:        '',
                    companyName:     '',
                    _jnJobId:        jobId,
                    transactionCode: c.TRTC   || '',
                    downloadDate:    parseDate(c.DLDT   || c.DOWNDT || ''),
                    downloadPurpose: c.DLPURP || c.DLPUR || c.PURPOSE || '',
                    remarks:         '',
                    coverages:       [],
                    vehicles:        [],
                    drivers:         [],
                    fees:            [],
                };
                break;
            }

            case '5BIS': { // Insured
                if (!cur) break;
                const nm = parseNameFull(c.INAME || '');
                if (nm.displayName) cur.insuredName  = nm.displayName;
                if (nm.entityType)  cur.entityType   = nm.entityType;
                if (nm.firstName)   cur.firstName    = nm.firstName;
                if (nm.lastName)    cur.lastName     = nm.lastName;
                if (nm.companyName) cur.companyName  = nm.companyName;
                if (c.IADRS  || c.IADDR)  cur.address  = c.IADRS  || c.IADDR;
                if (c.IADRS2 || c.IADDR2) cur.address2 = c.IADRS2 || c.IADDR2;
                if (c.ICTY   || c.ICITY)  cur.city     = c.ICTY   || c.ICITY;
                if (c.IST    || c.ISTATE) cur.state    = c.IST    || c.ISTATE;
                if (c.IZIP   || c.IZIPC)  cur.zip      = c.IZIP   || c.IZIPC;
                if (c.IDOB)   cur.dateOfBirth  = parseDate(c.IDOB);
                if (c.ISEX)   cur.sex           = c.ISEX;
                if (c.IMAR)   cur.maritalStatus = c.IMAR;
                if (c.IOCCUP) cur.occupation    = c.IOCCUP;
                break;
            }

            case '5BPI': // Policy Info
                if (cur) {
                    if (c.POLNO)   cur.policyNumber   = c.POLNO;
                    if (c.LOBCD)   cur.lob             = c.LOBCD || cur.lob;
                    if (c.EFFDT6)  cur.effectiveDate   = parseDate(c.EFFDT6);
                    if (c.EXPDT6)  cur.expirationDate  = parseDate(c.EXPDT6);
                    if (c.FPREM)   cur.premium         = parsePrem(c.FPREM);
                    if (c.ANNPREM) cur.annualPremium   = parsePrem(c.ANNPREM);
                    if (c.PCPREM)  cur.periodPremium   = parsePrem(c.PCPREM);
                    if (c.PRODCD || c.AGNTCD) cur._producer = c.PRODCD || c.AGNTCD;
                    if (c.BILLPLN) cur.billingPlan     = c.BILLPLN;
                    if (c.PAYPLAN) cur.paymentPlan     = c.PAYPLAN;
                }
                break;

            case '5BVO': { // Vehicle — Personal Auto
                if (!cur) break;
                cur.vehicles.push({
                    vehicleNumber: c.VEHNO    || '',
                    year:          c.YEAR     || '',
                    make:          c.MAKE     || '',
                    model:         c.MODEL    || '',
                    vin:           c.VIN      || c.VINNO || '',
                    bodyType:      c.BODYTYPE || c.BDYTP || '',
                    usage:         c.USAGE    || c.VEHUSE || '',
                    garageState:   c.GARST    || c.GRGST || '',
                    garageZip:     c.GARZIP   || c.GRGZIP || '',
                    addDate:       parseDate(c.ADDDT || ''),
                    deleteDate:    parseDate(c.DELDT || ''),
                    annualMiles:   c.ANMILE   || c.ANNMILE || '',
                    symbol:        c.SYMBOL   || '',
                    cost:          parsePrem(c.COST || c.VEHCOST || ''),
                });
                break;
            }

            case '5BVE': { // Vehicle Equipment
                if (!cur) break;
                const vehNo = c.VEHNO || '';
                const tv = vehNo
                    ? cur.vehicles.find(v => v.vehicleNumber === vehNo)
                    : cur.vehicles[cur.vehicles.length - 1];
                if (tv) {
                    if (c.ANTILOCK) tv.antilock       = c.ANTILOCK;
                    if (c.AIRBAG)   tv.airbag         = c.AIRBAG;
                    if (c.ANTITHFT) tv.antitheft      = c.ANTITHFT;
                    if (c.PASSRST)  tv.passRestraint  = c.PASSRST;
                }
                break;
            }

            case '5BDR': { // Driver
                if (!cur) break;
                const drvNm = parseNameFull(c.DRVNM || c.DRVNAME || '');
                cur.drivers.push({
                    driverNumber:     c.DRVNO   || '',
                    name:             drvNm.displayName || '',
                    firstName:        drvNm.firstName   || '',
                    lastName:         drvNm.lastName    || '',
                    dateOfBirth:      parseDate(c.DRVDOB || c.DOB || ''),
                    license:          c.LIC     || c.LICNO || '',
                    licenseState:     c.LICST   || c.LICSTATE || '',
                    yearsLicensed:    c.DLICYR  || '',
                    gender:           c.GENDR   || c.SEX || '',
                    maritalStatus:    c.MARSTS  || c.MAR || '',
                    addDate:          parseDate(c.ADDDT || ''),
                    deleteDate:       parseDate(c.DELDT || ''),
                    trainingDiscount: c.TRNDISC || '',
                    goodStudent:      c.GSTUD   || '',
                    vehicleNumber:    c.VEHNO   || '',
                });
                break;
            }

            case '5BCO': { // Coverage — Personal Lines
                if (!cur) break;
                cur.coverages.push({
                    coverageCode:  c.COVCD || c.COVRC || '',
                    description:   c.COVDESC || c.COVNAM || '',
                    vehicleNumber: c.VEHNO  || '',
                    driverNumber:  c.DRVNO  || '',
                    limit1:        c.LMT1   || c.LIMIT1 || c.BODILY1 || '',
                    limit2:        c.LMT2   || c.LIMIT2 || c.BODILY2 || '',
                    deductible:    c.DED    || c.DEDUCT || c.DED1 || '',
                    premium:       parsePrem(c.PREM || c.COVPREM || ''),
                    covType:       c.COVTYPE || '',
                });
                break;
            }

            case '6COV': { // Coverage — Commercial Lines
                if (!cur) break;
                cur.coverages.push({
                    coverageCode:  c.COVCD  || c.COVRC  || '',
                    description:   c.COVDESC || c.COVNAM || '',
                    vehicleNumber: c.VEHNO  || c.UNITNO || '',
                    limit1:        c.LMT1   || c.LIMIT1 || c.LIMIT  || '',
                    limit2:        c.LMT2   || c.LIMIT2 || '',
                    deductible:    c.DED    || c.DEDUCT || '',
                    premium:       parsePrem(c.PREM || c.COVPREM || ''),
                    covType:       c.COVTYPE || '',
                });
                break;
            }

            case '6DBD': { // Commercial Lines Bill Download — one billing record per policy (commission statement)
                if (cur) policies.push(cur);
                // Insured name embedded in ITEM as "[INAM] => Name"
                const _inamM = (c.ITEM || '').match(/\[INAM\]\s*=>\s*(.+)/);
                const _insName = _inamM ? _inamM[1].trim() : (c.ITEM || '').replace(/^\[.*?\]\s*=>\s*/, '').trim();
                cur = {
                    carrier:         lastCarrier || 'PROGRESSIVE',
                    carrierCode:     c.COCD || '',
                    lob:             c.LOBCD || '',
                    effectiveDate:   parseDate(c.PFDT8 || c.EFDT8 || ''),
                    expirationDate:  parseDate(c.PXDT8 || ''),
                    policyNumber:    c.POBNO || '',
                    insuredName:     _insName,
                    companyName:     _insName,
                    entityType:      'C',
                    firstName:       '',
                    lastName:        '',
                    premium:         parsePrem(c.GRAMT || ''),
                    transactionCode: c.TRAN || '',
                    downloadDate:    parseDate(c.EFDT8 || ''),
                    _jnJobId:        jobId,
                    remarks:         '',
                    coverages:       [],
                    vehicles:        [],
                    drivers:         [],
                    fees:            [],
                };
                break;
            }

            case '6DBC': // Commercial Lines Bill Summary — batch total, not a policy
                break;

            case '5BFE': // Fees — Personal Lines
            case '6FEE': // Fees — Commercial Lines
            case '5BFC': { // Finance charges
                if (!cur) break;
                cur.fees.push({
                    feeCode:  c.FEETYPE || c.FECD || c.FECODE || seg.group,
                    feeDesc:  c.FEEDESC || c.FENAM || c.FEDESC || '',
                    amount:   parsePrem(c.FEEAMT || c.AMOUNT || c.AMT || ''),
                });
                break;
            }

            case '5BPA': // Premium amounts
            case '6PAY': { // Payment / billing
                if (!cur) break;
                if (c.TOTPREM || c.TOTAL)  cur.totalPremium  = parsePrem(c.TOTPREM || c.TOTAL);
                if (c.GTOTPREM)             cur.grandTotal    = parsePrem(c.GTOTPREM);
                if (c.COMPFEE)              cur.companyFee    = parsePrem(c.COMPFEE);
                if (c.TAXAMT)               cur.taxAmount     = parsePrem(c.TAXAMT);
                if (c.INSPFEE)              cur.inspectionFee = parsePrem(c.INSPFEE);
                if (c.SRCHG)                cur.srCharge      = parsePrem(c.SRCHG);
                break;
            }

            case '5BLH': // Loss history
            case '5BLN': { // Lienholder / additional interest
                if (!cur) break;
                if (!cur.lienholders) cur.lienholders = [];
                cur.lienholders.push({
                    name:    c.INTNAME || c.LINAME || c.NAME || '',
                    address: c.INTADDR || c.LIADR  || c.ADDR || '',
                    type:    c.INTTC   || c.LTYPE  || '',
                    loanNo:  c.LOANNBR || c.LOANNO || '',
                });
                break;
            }

            case '5BLD': // Loss detail
            case '6LOS': {
                if (!cur) break;
                if (!cur.lossHistory) cur.lossHistory = [];
                cur.lossHistory.push({
                    date:        parseDate(c.LOSSDT || c.LOSDT || ''),
                    type:        c.LOSSTYPE || c.LOSTYPE || '',
                    amount:      parsePrem(c.LOSSAMT || c.LOSAMT || ''),
                    description: c.LOSSDESC || c.LOSDESC || '',
                });
                break;
            }

            case '5REM':
            case '6REM': {
                if (!cur) break;
                const remText = extractRemarks(c);
                if (remText) {
                    cur.remarks = cur.remarks ? cur.remarks + '\n' + remText : remText;
                }
                break;
            }

            case '6COM':
                if (cur) {
                    const cidtc = (c.CIDTC || '').toUpperCase();
                    if (cidtc === 'EMAIL'                      && c.COMID) cur.email = c.COMID;
                    if ((cidtc === 'PHONE' || cidtc === 'TEL') && c.COMID) cur.phone = c.COMID;
                    if ((cidtc === 'CELL'  || cidtc === 'MOBL')&& c.COMID) cur.cell  = c.COMID;
                    if (cidtc === 'FAX'                        && c.COMID) cur.fax   = c.COMID;
                }
                break;

            // ── JenesisNow / Progressive packed-format segments ─────────────

            case '9BIS': { // Insured address/phone (packed JenesisNow format)
                if (!cur) break;
                const u = unpackJnFields(c);
                if (u.ADLN1 && !cur.address) cur.address = u.ADLN1;
                if (u.CITY  && !cur.city)    cur.city    = u.CITY;
                if (u.STATE && !cur.state)   cur.state   = u.STATE;
                if (u.ZIPCD && !cur.zip)     cur.zip     = u.ZIPCD;
                if (u.PHONE && !cur.phone)   cur.phone   = u.PHONE;
                break;
            }

            case '5VEH':   // Personal-lines vehicle (JenesisNow packed format)
            case '5CAR': { // Commercial vehicle (JenesisNow packed format)
                if (!cur) break;
                const u = unpackJnFields(c);
                const veh = {
                    vehicleNumber: u.VEHNO || u.VEHNO1 || '',
                    year:          u.VEHYR || '',
                    make:          u.VEHMK || '',
                    model:         u.VEHMD || '',
                    vin:           u.VIN   || '',
                    bodyType:      u.CBDCD || u.BODCD || '',
                    usage:         u.VEHUS || '',
                    state:         u.STATE || '',
                    garageZip:     u.ZIPCD || '',
                    gvw:           u.GVGCW || '',
                };
                // Only add if we got meaningful data (year or VIN)
                if (veh.year || veh.vin) cur.vehicles.push(veh);
                break;
            }

            case '5DRV':   // Personal-lines driver (JenesisNow packed format)
            case '6SDV': { // Commercial driver (JenesisNow packed format)
                if (!cur) break;
                const u = unpackJnFields(c);
                const drvNm = parseNameFull(u.DRVNM || '');
                cur.drivers.push({
                    driverNumber:  u.DRVNO || '',
                    name:          drvNm.displayName || '',
                    firstName:     drvNm.firstName   || '',
                    lastName:      drvNm.lastName    || '',
                    dateOfBirth:   parseDate(u.BIRDT || ''),
                    license:       u.LICNO || '',
                    licenseState:  u.STATE || '',
                    gender:        u.SEXCD || '',
                    vehicleNumber: u.DRVEH || '',
                });
                break;
            }

            case '5CVG': { // Coverage (JenesisNow packed format — commercial & personal)
                if (!cur) break;
                const u = unpackJnFields(c);
                cur.coverages.push({
                    coverageCode:  u.COVCD  || '',
                    description:   u.DESC1  || u.COVSB || '',
                    limit1:        u.CLIMT1 || u.LIMBA1 || '',
                    limit2:        u.LIMVA1 || u.CLIMT2 || '',
                    deductible:    u.CDEDC1 || u.CDEDT1 || '',
                    premium:       parsePrem(u.FPREM || u.CPREM || ''),
                    covType:       u.SOTCD  || '',
                });
                break;
            }

            case '5RMK': { // Remarks (JenesisNow packed format — notes, email, vehicle changes)
                if (!cur) break;
                const u = unpackJnFields(c);
                const rmk = u.RMKTX || '';
                if (rmk) {
                    // Extract email if present: "Insured Email: user@example.com ..."
                    const emailMatch = rmk.match(/Insured Email:\s*(\S+@\S+)/i);
                    if (emailMatch && !cur.email) cur.email = emailMatch[1];
                    // Append to remarks
                    cur.remarks = cur.remarks ? cur.remarks + '\n' + rmk : rmk;
                }
                break;
            }

            case '6VIO': { // Violation / MVR record
                if (!cur) break;
                const u = unpackJnFields(c);
                if (!cur.violations) cur.violations = [];
                cur.violations.push({
                    code:        u.AVCD  || u.ZZDEL || '',
                    description: u.ACDES || '',
                    date:        parseDate(u.ACVDT || ''),
                    points:      u.POINT || '',
                });
                break;
            }

            case '6CPO': { // Commercial policy operations info
                if (!cur) break;
                const u = unpackJnFields(c);
                if (u.OPDES) cur.operationDesc = u.OPDES;
                if (u.SICCD) cur.sicCode       = u.SICCD;
                break;
            }

            // Segments we acknowledge but don't need to extract data from
            case '5SSG': case '5LAG': case '5PPH': case '5FOR':
            case '6BVS': case '6CAS': case '2GCG':
            case '6CVA': case '6LUR': case '6PDA': case '6PDR': case '6PDS': case '6PVH':
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

        // Build segment group counts for diagnostics
        const segmentGroups = {};
        for (const s of segments) segmentGroups[s.group] = (segmentGroups[s.group] || 0) + 1;

        console.log(`[JenesisNow] /file/${jobId}: parsed ${segments.length} segments → ${policies.length} policies`);
        res.json({ policies, filename: `jenesis_${jobId}.al3`, segmentGroups });

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
