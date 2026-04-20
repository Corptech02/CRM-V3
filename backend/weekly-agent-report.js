#!/usr/bin/env node
/**
 * Weekly Agent Performance Report
 * Runs every Friday at 5pm EST — sends each agent their weekly stats
 * via contact@vigagency.com → agent email
 */

'use strict';

const path    = require('path');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const DB_PATH = path.resolve(__dirname, '../vanguard.db');

// ── Agent email roster ────────────────────────────────────────────────────────
const AGENT_EMAILS = {
    grant:   'grant@vigagency.com',
    hunter:  'hunter@vigagency.com',
    carson:  'carson@vigagency.com',
    maureen: 'maureen@uigagency.com',
};

// Agents to include in the report (case-insensitive match on assignedTo)
const REPORT_AGENTS = ['Grant', 'Hunter', 'Carson'];

// ── Date range: previous Mon–Sun ─────────────────────────────────────────────
function getLastWeekRange() {
    const now   = new Date();
    const day   = now.getDay(); // 0=Sun … 6=Sat
    // Days since last Monday
    const sinceMonday = (day === 0 ? 6 : day - 1);
    const lastSun = new Date(now);
    lastSun.setDate(now.getDate() - sinceMonday - 1);
    lastSun.setHours(23, 59, 59, 999);

    const lastMon = new Date(lastSun);
    lastMon.setDate(lastSun.getDate() - 6);
    lastMon.setHours(0, 0, 0, 0);

    return { start: lastMon, end: lastSun };
}

function fmtDate(d) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── DB helpers ────────────────────────────────────────────────────────────────
function dbAll(db, sql, params) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
}

// ── Duration string → seconds ─────────────────────────────────────────────────
function parseDuration(str) {
    if (!str) return 0;
    str = String(str);
    let secs = 0;
    const h = str.match(/(\d+)\s*h/i);
    const m = str.match(/(\d+)\s*m(?:in)?/i);
    const s = str.match(/(\d+)\s*s(?:ec)?/i);
    if (h) secs += parseInt(h[1]) * 3600;
    if (m) secs += parseInt(m[1]) * 60;
    if (s) secs += parseInt(s[1]);
    if (!h && !m && !s && /^\d+$/.test(str.trim())) secs = parseInt(str);
    return secs;
}

function formatTime(secs) {
    if (!secs) return '0s';
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.floor(secs/60)}m ${secs%60}s`;
    const h = Math.floor(secs/3600);
    const m = Math.floor((secs%3600)/60);
    return `${h}h ${m}m`;
}

function dollar(v) {
    return '$' + Math.round(v || 0).toLocaleString();
}

// ── Compute metrics for an agent over a date range ────────────────────────────
function computeMetrics(agentName, leads, policies, start, end) {
    const startTs = start.getTime();
    const endTs   = end.getTime();
    const agentLc = agentName.toLowerCase();

    // Filter leads assigned to this agent
    const myLeads = leads.filter(l => {
        const assigned = (l.assignedTo || l.agent || l.assignedAgent || '').toLowerCase();
        return assigned === agentLc;
    });

    let leadsInRange = 0;
    let callsInRange = 0;
    let connectedInRange = 0;
    let callSecsInRange  = 0;
    let totalCalls = 0;
    let appsToMarket = 0;
    let callbackLeads = 0;
    let overdueLeads = 0;

    myLeads.forEach(lead => {
        // Leads created in range (use lead.id timestamp or lead.created)
        const createdTs = lead.created ? new Date(lead.created).getTime()
                        : (lead.id && /^\d{10,}/.test(lead.id) ? parseInt(lead.id) : 0);
        if (createdTs >= startTs && createdTs <= endTs) leadsInRange++;

        // Call logs
        const calls = (lead.reachOut && lead.reachOut.callLogs) ? lead.reachOut.callLogs : [];
        calls.forEach(call => {
            totalCalls++;
            const callTs = call.timestamp ? new Date(call.timestamp).getTime() : 0;
            if (callTs >= startTs && callTs <= endTs) {
                callsInRange++;
                if (call.connected) connectedInRange++;
                callSecsInRange += parseDuration(call.duration);
            }
        });

        // Apps to market
        const app = lead.appStage || {};
        if (app.app || app.lossRuns || app.iftas || app.saa) appsToMarket++;

        // Callback tracking
        if (lead.reachOut && lead.reachOut.callbackDate) {
            callbackLeads++;
            const cbTs = new Date(lead.reachOut.callbackDate).getTime();
            if (cbTs < Date.now()) overdueLeads++;
        }
    });

    // Policies / sales in range
    let salesInRange = 0;
    let premiumInRange = 0;

    policies.forEach(policy => {
        const assigned = (policy.assignedTo || policy.agent || policy.assignedAgent || policy.producer || '').toLowerCase();
        if (assigned !== agentLc) return;

        // Policy creation timestamp from ID: POL-{timestamp}-{random}
        const idMatch = (policy.id || '').match(/POL-(\d+)-/);
        const polTs   = idMatch ? parseInt(idMatch[1]) : 0;

        if (polTs >= startTs && polTs <= endTs) {
            salesInRange++;
            const raw = String(policy.premium || policy.annualPremium || policy.financial?.['Annual Premium'] || 0);
            premiumInRange += parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
        }
    });

    const convRate = myLeads.length > 0 ? ((salesInRange / myLeads.length) * 100).toFixed(1) : '—';
    const avgDur   = connectedInRange > 0 ? Math.round(callSecsInRange / connectedInRange) : 0;
    const cbPct    = myLeads.length > 0 ? ((callbackLeads / myLeads.length) * 100).toFixed(1) : '—';
    const ovPct    = myLeads.length > 0 ? ((overdueLeads  / myLeads.length) * 100).toFixed(1) : '—';

    return {
        agent: agentName,
        totalLeads: myLeads.length,
        leadsInRange,
        callsInRange,
        connectedInRange,
        callSecsInRange,
        avgDurSecs: avgDur,
        totalCalls,
        appsToMarket,
        salesInRange,
        premiumInRange,
        convRate,
        cbPct,
        ovPct,
    };
}

// ── Build HTML email for one agent ───────────────────────────────────────────
function buildEmailHtml(metrics, start, end, periodLabel) {
    const m = metrics;
    const dateLabel = `${fmtDate(start)} – ${fmtDate(end)}`;

    const stat = (label, value, sub) => `
        <td style="padding:16px 12px;text-align:center;border-right:1px solid #f1f5f9">
            <div style="font-size:22px;font-weight:800;color:#111827">${value}</div>
            <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-top:3px">${label}</div>
            ${sub ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px">${sub}</div>` : ''}
        </td>`;

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:680px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:28px 32px">
    <div style="display:flex;align-items:center;gap:14px">
      <div style="background:rgba(255,255,255,.18);border-radius:12px;padding:10px 13px;display:inline-block">
        <span style="font-size:22px">📊</span>
      </div>
      <div>
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800">${periodLabel} Performance Report</h1>
        <p style="margin:4px 0 0;color:rgba(255,255,255,.7);font-size:13px">${m.agent} · ${dateLabel}</p>
      </div>
    </div>
  </div>

  <!-- Greeting -->
  <div style="padding:24px 32px 0">
    <p style="font-size:15px;color:#374151;margin:0">Hi ${m.agent},</p>
    <p style="font-size:14px;color:#6b7280;margin:8px 0 0">Here's your performance summary for ${dateLabel}.</p>
  </div>

  <!-- Key Stats Row -->
  <div style="padding:20px 32px">
    <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <tr>
        ${stat('Leads', m.leadsInRange)}
        ${stat('Calls', m.callsInRange, `${m.connectedInRange} connected`)}
        ${stat('Sales', m.salesInRange, `${m.convRate}% conv.`)}
        ${stat('Premium', dollar(m.premiumInRange))}
      </tr>
    </table>
  </div>

  <!-- Detailed Stats -->
  <div style="padding:0 32px 28px">
    <h3 style="font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin:0 0 12px">Activity Detail</h3>
    <table style="width:100%;border-collapse:collapse">
      <tr style="background:#f8fafc">
        <td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #f1f5f9;font-weight:600">Talk Time</td>
        <td style="padding:10px 14px;font-size:13px;color:#111827;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:700">${formatTime(m.callSecsInRange)}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #f1f5f9">Avg Call Duration</td>
        <td style="padding:10px 14px;font-size:13px;color:#111827;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:700">${m.avgDurSecs > 0 ? formatTime(m.avgDurSecs) : '—'}</td>
      </tr>
      <tr style="background:#f8fafc">
        <td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #f1f5f9;font-weight:600">Total Call Attempts</td>
        <td style="padding:10px 14px;font-size:13px;color:#111827;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:700">${m.totalCalls}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #f1f5f9">Apps to Market</td>
        <td style="padding:10px 14px;font-size:13px;color:#111827;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:700">${m.appsToMarket}</td>
      </tr>
      <tr style="background:#f8fafc">
        <td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #f1f5f9;font-weight:600">Lead Callback %</td>
        <td style="padding:10px 14px;font-size:13px;color:#111827;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:700">${m.cbPct}%</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:13px;color:#374151">Overdue Callback %</td>
        <td style="padding:10px 14px;font-size:13px;color:${parseFloat(m.ovPct) > 10 ? '#dc2626' : '#111827'};text-align:right;font-weight:700">${m.ovPct}%</td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center">
    <p style="font-size:12px;color:#94a3b8;margin:0">Vanguard Insurance Group · Automated ${periodLabel} Report · ${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
  </div>
</div>
</body>
</html>`;
}

// ── Last calendar month range ─────────────────────────────────────────────────
function getLastMonthRange() {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end };
}

// ── Shared: load DB data ──────────────────────────────────────────────────────
async function loadData() {
    const db = new sqlite3.Database(DB_PATH);
    const leadRows   = await dbAll(db, 'SELECT id, data FROM leads', []);
    const policyRows = await dbAll(db, 'SELECT id, data FROM policies', []);
    db.close();
    const leads    = leadRows.map(r => { try { return { id: r.id, ...JSON.parse(r.data) }; } catch { return { id: r.id }; } });
    const policies = policyRows.map(r => { try { return { id: r.id, ...JSON.parse(r.data) }; } catch { return { id: r.id }; } });
    return { leads, policies };
}

// ── Shared: send reports for all agents ──────────────────────────────────────
async function sendReports(leads, policies, start, end, periodLabel, subjectPrefix) {
    const allMetrics = REPORT_AGENTS.map(agent => computeMetrics(agent, leads, policies, start, end));

    const transporter = nodemailer.createTransport({
        host: 'smtpout.secureserver.net',
        port: 465,
        secure: true,
        auth: { user: 'contact@vigagency.com', pass: process.env.GODADDY_VIG_PASSWORD },
    });

    for (const m of allMetrics) {
        const toEmail = AGENT_EMAILS[m.agent.toLowerCase()];
        if (!toEmail) { console.warn(`[${periodLabel}] No email for ${m.agent}, skipping`); continue; }

        const html    = buildEmailHtml(m, start, end, periodLabel);
        const subject = `📊 ${subjectPrefix}: ${fmtDate(start)} – ${fmtDate(end)}`;

        try {
            await transporter.sendMail({ from: '"Vanguard CRM" <contact@vigagency.com>', to: toEmail, subject, html });
            console.log(`[${periodLabel}] ✅ Sent to ${m.agent} (${toEmail})`);
        } catch (err) {
            console.error(`[${periodLabel}] ❌ Failed to send to ${m.agent}: ${err.message}`);
        }
    }
}

// ── Weekly report (previous Mon–Sun) ─────────────────────────────────────────
async function runWeeklyReport() {
    console.log('[WeeklyReport] Starting...');
    const { start, end } = getLastWeekRange();
    console.log(`[WeeklyReport] Range: ${fmtDate(start)} – ${fmtDate(end)}`);
    const { leads, policies } = await loadData();
    console.log(`[WeeklyReport] Loaded ${leads.length} leads, ${policies.length} policies`);
    await sendReports(leads, policies, start, end, 'Weekly', 'Your Weekly Report');
    console.log('[WeeklyReport] Done.');
}

// ── Monthly report (previous calendar month) ─────────────────────────────────
async function runMonthlyReport() {
    console.log('[MonthlyReport] Starting...');
    const { start, end } = getLastMonthRange();
    console.log(`[MonthlyReport] Range: ${fmtDate(start)} – ${fmtDate(end)}`);
    const { leads, policies } = await loadData();
    console.log(`[MonthlyReport] Loaded ${leads.length} leads, ${policies.length} policies`);
    await sendReports(leads, policies, start, end, 'Monthly', 'Your Monthly Report');
    console.log('[MonthlyReport] Done.');
}

// ── Entry point ───────────────────────────────────────────────────────────────
// node weekly-agent-report.js         → weekly
// node weekly-agent-report.js monthly → monthly
if (require.main === module) {
    const mode = process.argv[2] || 'weekly';
    const fn   = mode === 'monthly' ? runMonthlyReport : runWeeklyReport;
    fn().catch(err => { console.error('Fatal error:', err); process.exit(1); });
} else {
    module.exports = { runWeeklyReport, runMonthlyReport };
}
