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

// ── Date range: current Mon–Fri (the week the report fires) ─────────────────
function getLastWeekRange() {
    const now = new Date();
    const day = now.getDay(); // 0=Sun … 6=Sat
    // Days since this Monday
    const sinceMonday = (day === 0 ? 6 : day - 1);

    const monday = new Date(now);
    monday.setDate(now.getDate() - sinceMonday);
    monday.setHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    return { start: monday, end: friday };
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

function dbGet(db, sql, params) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
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
function computeMetrics(agentName, leads, policies, callbacks, start, end) {
    const startTs = start.getTime();
    const endTs   = end.getTime();
    const agentLc = agentName.toLowerCase();

    // Filter leads assigned to this agent
    const myLeads = leads.filter(l => {
        const assigned = (l.assignedTo || l.agent || l.assignedAgent || '').toLowerCase();
        return assigned === agentLc;
    });

    // Build callback lookup: lead_id → [callbacks]
    const cbByLead = {};
    callbacks.forEach(cb => {
        const lid = String(cb.lead_id);
        if (!cbByLead[lid]) cbByLead[lid] = [];
        cbByLead[lid].push(cb);
    });

    const nowTs = Date.now();

    let leadsInRange = 0;
    let callsInRange = 0;
    let connectedInRange = 0;
    let callSecsInRange  = 0;
    let totalCalls = 0;
    let appsToMarket = 0;
    let callbackLeads = 0;
    let overdueLeads = 0;
    // For goals: scheduled callback % = leadsWithCB / connectedLeads in range
    let connectedLeadsInRange = 0;
    let leadsWithCBInRange = 0;

    myLeads.forEach(lead => {
        // Leads created in range
        const createdTs = lead.created ? new Date(lead.created).getTime()
                        : (lead.id && /^\d{10,}/.test(lead.id) ? parseInt(lead.id) : 0);
        if (createdTs >= startTs && createdTs <= endTs) leadsInRange++;

        // Call logs
        const calls = (lead.reachOut && lead.reachOut.callLogs) ? lead.reachOut.callLogs : [];
        let hadConnectedInRange = false;
        calls.forEach(call => {
            totalCalls++;
            const callTs = call.timestamp ? new Date(call.timestamp).getTime() : 0;
            if (callTs >= startTs && callTs <= endTs) {
                callsInRange++;
                if (call.connected) {
                    connectedInRange++;
                    hadConnectedInRange = true;
                }
                callSecsInRange += parseDuration(call.duration);
            }
        });

        // Apps to market
        const app = lead.appStage || {};
        if (app.app || app.lossRuns || app.iftas || app.saa) appsToMarket++;

        // Callback tracking via scheduled_callbacks table
        const cbs = (cbByLead[String(lead.id)] || []).filter(cb => !cb.completed);
        if (cbs.length > 0) {
            const hasActive  = cbs.some(cb => new Date(cb.date_time).getTime() >= nowTs);
            const hasOverdue = cbs.some(cb => new Date(cb.date_time).getTime() < nowTs);
            if (hasActive)  callbackLeads++;
            if (hasOverdue) overdueLeads++;
        }

        // For goals: connected-call leads that have a callback scheduled
        if (hadConnectedInRange) {
            connectedLeadsInRange++;
            if (cbs.length > 0) leadsWithCBInRange++;
        }
    });

    // Policies / sales in range
    let salesInRange = 0;
    let premiumInRange = 0;

    policies.forEach(policy => {
        const assigned = (policy.assignedTo || policy.agent || policy.assignedAgent || policy.producer || '').toLowerCase();
        if (assigned !== agentLc) return;

        const idMatch = (policy.id || '').match(/POL-(\d+)-/);
        const polTs   = idMatch ? parseInt(idMatch[1]) : 0;

        if (polTs >= startTs && polTs <= endTs) {
            salesInRange++;
            const raw = String(policy.premium || policy.annualPremium || policy.financial?.['Annual Premium'] || 0);
            premiumInRange += parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
        }
    });

    // YTD premium before the report month (for monthly quota calculation)
    let ytdPremiumBeforeMonth = 0;
    const reportYear = start.getFullYear();
    const yearStartTs = new Date(reportYear, 0, 1).getTime();
    policies.forEach(policy => {
        const assigned = (policy.assignedTo || policy.agent || policy.assignedAgent || policy.producer || '').toLowerCase();
        if (assigned !== agentLc) return;
        const idMatch = (policy.id || '').match(/POL-(\d+)-/);
        const polTs   = idMatch ? parseInt(idMatch[1]) : 0;
        if (polTs >= yearStartTs && polTs < startTs) {
            const raw = String(policy.premium || policy.annualPremium || policy.financial?.['Annual Premium'] || 0);
            ytdPremiumBeforeMonth += parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
        }
    });

    const convRate = myLeads.length > 0 ? ((salesInRange / myLeads.length) * 100).toFixed(1) : '—';
    const avgDur   = connectedInRange > 0 ? Math.round(callSecsInRange / connectedInRange) : 0;
    const cbPct    = myLeads.length > 0 ? ((callbackLeads / myLeads.length) * 100).toFixed(1) : '0.0';
    const ovPct    = myLeads.length > 0 ? ((overdueLeads  / myLeads.length) * 100).toFixed(1) : '0.0';
    // Dashboard-style scheduled callback %: connected leads in range that have a callback
    const scheduledCbPct = connectedLeadsInRange > 0
        ? Math.round((leadsWithCBInRange / connectedLeadsInRange) * 100)
        : 0;

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
        scheduledCbPct,
        newLeadsInRange: leadsInRange,
        ytdPremiumBeforeMonth,
    };
}

// ── Progress bar row for email ────────────────────────────────────────────────
function goalRow(icon, label, actual, goal, displayActual, displayGoal, color, pct) {
    const clampedPct = Math.min(100, Math.round(pct));
    const barColor   = clampedPct >= 100 ? '#10b981' : color;
    const badge      = clampedPct >= 100
        ? `<span style="font-size:11px;font-weight:700;color:#10b981;background:#dcfce7;padding:2px 8px;border-radius:20px">✓ Goal Met</span>`
        : `<span style="font-size:11px;font-weight:700;color:#6b7280;background:#f3f4f6;padding:2px 8px;border-radius:20px">${clampedPct}%</span>`;

    return `
    <tr>
      <td style="padding:10px 14px 10px 0;vertical-align:top;width:38px;text-align:center">
        <div style="background:${color}18;border-radius:8px;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center">
          <i class="${icon}" style="color:${color};font-size:14px"></i>
        </div>
      </td>
      <td style="padding:10px 0;vertical-align:middle">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
          <span style="font-size:12px;font-weight:700;color:#374151">${label}</span>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:12px;color:#6b7280">${displayActual} / ${displayGoal}</span>
            ${badge}
          </div>
        </div>
        <div style="background:#e5e7eb;border-radius:999px;height:8px;overflow:hidden">
          <div style="width:${clampedPct}%;height:100%;background:linear-gradient(90deg,${barColor},${barColor}bb);border-radius:999px;transition:width .5s ease"></div>
        </div>
      </td>
    </tr>`;
}

// ── Build HTML email for one agent ───────────────────────────────────────────
function buildEmailHtml(metrics, start, end, periodLabel, goalsConfig) {
    const m = metrics;
    const dateLabel = `${fmtDate(start)} – ${fmtDate(end)}`;
    const agentLc = m.agent.toLowerCase();

    const stat = (label, value, sub) => `
        <td style="padding:16px 12px;text-align:center;border-right:1px solid #f1f5f9">
            <div style="font-size:22px;font-weight:800;color:#111827">${value}</div>
            <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-top:3px">${label}</div>
            ${sub ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px">${sub}</div>` : ''}
        </td>`;

    // ── Goals section ──────────────────────────────────────────────────────────
    const isMonthly = periodLabel === 'Monthly';
    const periodKey = isMonthly ? 'month' : 'week';

    // Default weekly/monthly goals per agent
    const DEFAULTS = {
        grant:  { week: { totalTalkHours:4.2, newLeads:9.7,  apps:4.8, callbacks:85 }, month: { totalTalkHours:18, newLeads:42, apps:21, callbacks:85 } },
        carson: { week: { totalTalkHours:4.6, newLeads:12.7, apps:6.2, callbacks:85 }, month: { totalTalkHours:20, newLeads:55, apps:27, callbacks:85 } },
        hunter: { week: { totalTalkHours:3.7, newLeads:7.4,  apps:3.5, callbacks:85 }, month: { totalTalkHours:16, newLeads:32, apps:15, callbacks:85 } },
    };

    const agentCfg = (goalsConfig && goalsConfig[agentLc]) || {};
    const defG     = (DEFAULTS[agentLc] || DEFAULTS.hunter)[periodKey];
    const g        = Object.assign({}, defG, agentCfg[periodKey] || {});

    const talkGoalSecs = g.totalTalkHours * 3600;
    const talkPct      = talkGoalSecs > 0 ? (m.callSecsInRange / talkGoalSecs) * 100 : 0;
    const leadsPct     = g.newLeads > 0 ? (m.newLeadsInRange / g.newLeads) * 100 : 0;
    const appsPct      = g.apps > 0 ? (m.appsToMarket / g.apps) * 100 : 0;
    const cbGoalPct    = g.callbacks || 85;
    const cbActualPct  = m.scheduledCbPct;
    const cbBarPct     = cbGoalPct > 0 ? (cbActualPct / cbGoalPct) * 100 : 0;

    const goalsHTML = `
  <div style="padding:0 32px 28px">
    <h3 style="font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin:0 0 12px">
      ${periodLabel} Goal Tracker
    </h3>
    <div style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:8px 16px">
      <table style="width:100%;border-collapse:collapse">
        ${goalRow('fas fa-phone', 'Total Talk Time', m.callSecsInRange, talkGoalSecs, formatTime(m.callSecsInRange), g.totalTalkHours + 'h', '#3b82f6', talkPct)}
        ${goalRow('fas fa-user-plus', 'New Leads', m.newLeadsInRange, g.newLeads, String(m.newLeadsInRange), String(Math.round(g.newLeads)), '#3b82f6', leadsPct)}
        ${goalRow('fas fa-paper-plane', 'Apps Sent', m.appsToMarket, g.apps, String(m.appsToMarket), String(Math.round(g.apps * 10) / 10), '#f59e0b', appsPct)}
        ${goalRow('fas fa-phone-alt', 'Scheduled Callbacks', cbActualPct, cbGoalPct, cbActualPct + '%', cbGoalPct + '%', '#8b5cf6', cbBarPct)}
      </table>
    </div>
  </div>`;

    // ── Monthly Quota % ───────────────────────────────────────────────────────
    let quotaHTML = '';
    if (isMonthly) {
        const ANNUAL_DEFAULTS = { grant: 800000, carson: 1200000, hunter: 1000000 };
        const annualGoal = agentCfg.annualGoal || ANNUAL_DEFAULTS[agentLc] || 1000000;
        const ytdBefore = m.ytdPremiumBeforeMonth || 0;
        const remaining = Math.max(0, annualGoal - ytdBefore);
        const monthsLeft = 12 - start.getMonth(); // includes the report month
        const monthlyQuota = monthsLeft > 0 ? remaining / monthsLeft : 0;
        const annualGoalMet = ytdBefore >= annualGoal;
        const quotaPct = annualGoalMet ? 100 : (monthlyQuota > 0 ? (m.premiumInRange / monthlyQuota) * 100 : 0);
        const quotaDisplay = Math.round(quotaPct);
        const quotaColor = quotaPct >= 100 ? '#10b981' : quotaPct >= 75 ? '#f59e0b' : '#ef4444';
        const ytdTotal = ytdBefore + m.premiumInRange;

        const quotaLabel = annualGoalMet
            ? '<div style="font-size:13px;color:#10b981;font-weight:700;margin-top:6px">Annual Goal Already Met!</div>'
            : '<div style="font-size:13px;color:#78716c;margin-top:6px">' + dollar(m.premiumInRange) + ' written vs ' + dollar(Math.round(monthlyQuota)) + ' quota</div>';

        quotaHTML = `
  <div style="padding:0 32px 28px">
    <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:24px;text-align:center">
      <div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Monthly Quota</div>
      <div style="font-size:48px;font-weight:900;color:${quotaColor};line-height:1">${quotaDisplay}%</div>
      ${quotaLabel}
      <div style="background:#e5e7eb;border-radius:999px;height:10px;overflow:hidden;margin:16px auto 0;max-width:400px">
        <div style="width:${Math.min(100, quotaDisplay)}%;height:100%;background:linear-gradient(90deg,#f59e0b,${quotaColor});border-radius:999px"></div>
      </div>
      <table style="width:100%;max-width:400px;margin:16px auto 0;border-collapse:collapse">
        <tr>
          <td style="padding:6px 8px;font-size:12px;color:#78716c;text-align:left">Annual Goal</td>
          <td style="padding:6px 8px;font-size:12px;font-weight:700;color:#1f2937;text-align:right">${dollar(annualGoal)}</td>
        </tr>
        <tr>
          <td style="padding:6px 8px;font-size:12px;color:#78716c;text-align:left">YTD Premium</td>
          <td style="padding:6px 8px;font-size:12px;font-weight:700;color:#1f2937;text-align:right">${dollar(ytdTotal)}</td>
        </tr>
        <tr>
          <td style="padding:6px 8px;font-size:12px;color:#78716c;text-align:left">Remaining</td>
          <td style="padding:6px 8px;font-size:12px;font-weight:700;color:#1f2937;text-align:right">${dollar(Math.max(0, annualGoal - ytdTotal))}</td>
        </tr>
      </table>
    </div>
  </div>`;
    }

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

  <!-- Goal Tracker -->
  ${goalsHTML}

  <!-- Monthly Quota -->
  ${quotaHTML}

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
    const [leadRows, policyRows, callbackRows, goalsCfgRow] = await Promise.all([
        dbAll(db, 'SELECT id, data FROM leads', []),
        dbAll(db, 'SELECT id, data FROM policies', []),
        dbAll(db, 'SELECT lead_id, date_time, completed FROM scheduled_callbacks WHERE completed = 0', []),
        dbGet(db, "SELECT value FROM settings WHERE key = 'goals_config'", []),
    ]);
    db.close();

    const leads    = leadRows.map(r => { try { return { id: r.id, ...JSON.parse(r.data) }; } catch { return { id: r.id }; } });
    const policies = policyRows.map(r => { try { return { id: r.id, ...JSON.parse(r.data) }; } catch { return { id: r.id }; } });
    const callbacks = callbackRows;

    let goalsConfig = null;
    if (goalsCfgRow && goalsCfgRow.value) {
        try { goalsConfig = JSON.parse(goalsCfgRow.value); } catch { goalsConfig = null; }
    }

    return { leads, policies, callbacks, goalsConfig };
}

// ── Shared: send reports for all agents ──────────────────────────────────────
async function sendReports(leads, policies, callbacks, goalsConfig, start, end, periodLabel, subjectPrefix) {
    const allMetrics = REPORT_AGENTS.map(agent => computeMetrics(agent, leads, policies, callbacks, start, end));

    const transporter = nodemailer.createTransport({
        host: 'smtpout.secureserver.net',
        port: 465,
        secure: true,
        auth: { user: 'contact@vigagency.com', pass: process.env.GODADDY_VIG_PASSWORD },
    });

    for (const m of allMetrics) {
        const toEmail = AGENT_EMAILS[m.agent.toLowerCase()];
        if (!toEmail) { console.warn(`[${periodLabel}] No email for ${m.agent}, skipping`); continue; }

        const html    = buildEmailHtml(m, start, end, periodLabel, goalsConfig);
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
    const { leads, policies, callbacks, goalsConfig } = await loadData();
    console.log(`[WeeklyReport] Loaded ${leads.length} leads, ${policies.length} policies, ${callbacks.length} callbacks`);
    await sendReports(leads, policies, callbacks, goalsConfig, start, end, 'Weekly', 'Your Weekly Report');
    console.log('[WeeklyReport] Done.');
}

// ── Monthly report (previous calendar month) ─────────────────────────────────
async function runMonthlyReport() {
    console.log('[MonthlyReport] Starting...');
    const { start, end } = getLastMonthRange();
    console.log(`[MonthlyReport] Range: ${fmtDate(start)} – ${fmtDate(end)}`);
    const { leads, policies, callbacks, goalsConfig } = await loadData();
    console.log(`[MonthlyReport] Loaded ${leads.length} leads, ${policies.length} policies, ${callbacks.length} callbacks`);
    await sendReports(leads, policies, callbacks, goalsConfig, start, end, 'Monthly', 'Your Monthly Report');
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
