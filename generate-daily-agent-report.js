/**
 * Daily Agent Performance Report Generator
 * Generates comprehensive reports for all agents for today (2026-03-03)
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Today's date for filtering
const TODAY = '2026-03-03';
const TODAY_START = `${TODAY} 00:00:00`;
const TODAY_END = `${TODAY} 23:59:59`;

console.log(`📊 Generating Daily Agent Report for ${TODAY}`);
console.log(`🕐 Time range: ${TODAY_START} to ${TODAY_END}`);

// Database paths
const VANGUARD_DB = '/var/www/vanguard/vanguard.db';

// Report data structure
const agentReports = {};

/**
 * Initialize agent report structure
 */
function initializeAgent(agentName) {
    if (!agentReports[agentName]) {
        agentReports[agentName] = {
            name: agentName,
            totalCallMinutes: 0,
            connectedCalls: 0,
            callAttempts: 0,
            newLeads: 0,
            appSentToday: 0,
            redHighlightedLeads: 0,
            newClosedAccounts: 0,
            totalLeads: 0,
            contactRate: 0,
            avgCallDuration: 0,
            leadsContacted: 0
        };
    }
    return agentReports[agentName];
}

/**
 * Parse call duration to minutes
 */
function parseCallDuration(durationStr) {
    if (!durationStr) return 0;

    let totalMinutes = 0;

    // Handle formats like "5 min 30 sec", "2 min", "45 sec"
    const minMatch = durationStr.match(/(\d+)\s*min/);
    const secMatch = durationStr.match(/(\d+)\s*sec/);

    if (minMatch) totalMinutes += parseInt(minMatch[1]);
    if (secMatch) totalMinutes += parseInt(secMatch[1]) / 60;

    return totalMinutes;
}

/**
 * Check if a date is today
 */
function isToday(dateStr) {
    if (!dateStr) return false;

    const date = new Date(dateStr);
    const todayDate = new Date(TODAY);

    return date.getFullYear() === todayDate.getFullYear() &&
           date.getMonth() === todayDate.getMonth() &&
           date.getDate() === todayDate.getDate();
}

/**
 * Process leads data
 */
async function processLeadsData() {
    return new Promise((resolve, reject) => {
        console.log('📊 Processing leads data...');

        const db = new sqlite3.Database(VANGUARD_DB, sqlite3.OPEN_READONLY);

        db.all("SELECT * FROM leads", [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            console.log(`📊 Found ${rows.length} total leads in database`);

            rows.forEach(row => {
                try {
                    const lead = JSON.parse(row.data);
                    const agentName = lead.assignedTo || lead.agent || 'Unassigned';
                    const agent = initializeAgent(agentName);

                    // Count total leads for this agent
                    agent.totalLeads++;

                    // Check if lead was created today
                    if (isToday(lead.created_at || lead.createdDate || lead.timestamp || row.created_at)) {
                        agent.newLeads++;
                        console.log(`🆕 New lead today for ${agentName}: ${lead.name || lead.id}`);
                    }

                    // Check if stage was set to 'app_sent' today
                    if (lead.stage === 'app_sent' || lead.stage === 'App Sent') {
                        const stageUpdated = lead.stageUpdatedAt || lead.updated_at || row.updated_at;
                        if (isToday(stageUpdated)) {
                            agent.appSentToday++;
                            console.log(`📋 App sent today for ${agentName}: ${lead.name || lead.id}`);
                        }
                    }

                    // Check if lead is closed today
                    if (lead.stage === 'sale' || lead.stage === 'closed' || lead.status === 'closed_won' || lead.leadStatus === 'SALE') {
                        const closedDate = lead.stageUpdatedAt || lead.closedDate || lead.updated_at || row.updated_at;
                        if (isToday(closedDate)) {
                            agent.newClosedAccounts++;
                            console.log(`✅ Closed account today for ${agentName}: ${lead.name || lead.id}`);
                        }
                    }

                    // Process call data
                    if (lead.reachOut) {
                        const callAttempts = lead.reachOut.callAttempts || 0;
                        const callsConnected = lead.reachOut.callsConnected || 0;

                        agent.callAttempts += callAttempts;
                        agent.connectedCalls += callsConnected;

                        // Check if lead was contacted
                        if (lead.reachOut.contacted || callsConnected > 0) {
                            agent.leadsContacted++;
                        }

                        // Process call logs for duration (filter for today if possible)
                        if (lead.reachOut.callLogs && Array.isArray(lead.reachOut.callLogs)) {
                            lead.reachOut.callLogs.forEach(call => {
                                // If call has timestamp, check if it's today
                                const callDate = call.timestamp || call.date;
                                const includeCall = !callDate || isToday(callDate);

                                if (includeCall && call.duration) {
                                    const minutes = parseCallDuration(call.duration);
                                    agent.totalCallMinutes += minutes;
                                }
                            });
                        }
                    }

                    // Check for red highlighting conditions
                    // Red highlights typically indicate urgent follow-up needed
                    const isRedHighlighted = (
                        lead.priority === 'high' ||
                        lead.urgent === true ||
                        lead.followUpRequired === true ||
                        (lead.reachOut && lead.reachOut.urgentFollowUp) ||
                        (lead.stage && ['contact_attempted', 'info_requested'].includes(lead.stage) &&
                         lead.stageUpdatedAt && isOlderThanDays(lead.stageUpdatedAt, 2))
                    );

                    if (isRedHighlighted) {
                        agent.redHighlightedLeads++;
                    }

                } catch (e) {
                    console.error(`❌ Error processing lead: ${e.message}`);
                }
            });

            db.close();
            resolve();
        });
    });
}

/**
 * Check if date is older than specified days
 */
function isOlderThanDays(dateStr, days) {
    if (!dateStr) return false;

    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > days;
}

/**
 * Calculate performance metrics
 */
function calculateMetrics() {
    console.log('📊 Calculating performance metrics...');

    Object.keys(agentReports).forEach(agentName => {
        const agent = agentReports[agentName];

        // Calculate contact rate
        agent.contactRate = agent.totalLeads > 0 ?
            ((agent.leadsContacted / agent.totalLeads) * 100).toFixed(1) : 0;

        // Calculate average call duration
        agent.avgCallDuration = agent.connectedCalls > 0 ?
            (agent.totalCallMinutes / agent.connectedCalls).toFixed(1) : 0;
    });
}

/**
 * Generate and display report
 */
function generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log(`📊 DAILY AGENT PERFORMANCE REPORT - ${TODAY}`);
    console.log('='.repeat(80));

    const agents = Object.values(agentReports).sort((a, b) => b.totalCallMinutes - a.totalCallMinutes);

    if (agents.length === 0) {
        console.log('❌ No agent data found');
        return;
    }

    // Summary table
    console.log('\n📈 AGENT PERFORMANCE SUMMARY');
    console.log('-'.repeat(120));
    console.log('Agent Name'.padEnd(15) +
                'Call Min'.padEnd(10) +
                'Connected'.padEnd(12) +
                'New Leads'.padEnd(12) +
                'App Sent'.padEnd(10) +
                'Red Urgent'.padEnd(12) +
                'Closed'.padEnd(8) +
                'Contact%'.padEnd(10) +
                'Avg Call'.padEnd(10));
    console.log('-'.repeat(120));

    agents.forEach(agent => {
        console.log(
            agent.name.slice(0, 14).padEnd(15) +
            Math.round(agent.totalCallMinutes).toString().padEnd(10) +
            agent.connectedCalls.toString().padEnd(12) +
            agent.newLeads.toString().padEnd(12) +
            agent.appSentToday.toString().padEnd(10) +
            agent.redHighlightedLeads.toString().padEnd(12) +
            agent.newClosedAccounts.toString().padEnd(8) +
            (agent.contactRate + '%').padEnd(10) +
            (agent.avgCallDuration + ' min').padEnd(10)
        );
    });

    console.log('-'.repeat(120));

    // Detailed breakdown
    console.log('\n📋 DETAILED BREAKDOWN BY AGENT');
    console.log('='.repeat(50));

    agents.forEach(agent => {
        console.log(`\n👤 ${agent.name}`);
        console.log(`   📞 Total Call Minutes Today: ${Math.round(agent.totalCallMinutes)} minutes`);
        console.log(`   🔗 Connected Calls: ${agent.connectedCalls} (${agent.callAttempts} total attempts)`);
        console.log(`   🆕 New Leads Today: ${agent.newLeads}`);
        console.log(`   📋 App Sent Today: ${agent.appSentToday}`);
        console.log(`   🔴 Red Highlighted Leads: ${agent.redHighlightedLeads}`);
        console.log(`   ✅ New Closed Accounts Today: ${agent.newClosedAccounts}`);
        console.log(`   📈 Contact Rate: ${agent.contactRate}% (${agent.leadsContacted}/${agent.totalLeads})`);
        console.log(`   ⏱️  Avg Call Duration: ${agent.avgCallDuration} minutes`);
    });

    // Totals summary
    const totals = agents.reduce((sum, agent) => ({
        totalCallMinutes: sum.totalCallMinutes + agent.totalCallMinutes,
        connectedCalls: sum.connectedCalls + agent.connectedCalls,
        newLeads: sum.newLeads + agent.newLeads,
        appSentToday: sum.appSentToday + agent.appSentToday,
        redHighlightedLeads: sum.redHighlightedLeads + agent.redHighlightedLeads,
        newClosedAccounts: sum.newClosedAccounts + agent.newClosedAccounts
    }), { totalCallMinutes: 0, connectedCalls: 0, newLeads: 0, appSentToday: 0, redHighlightedLeads: 0, newClosedAccounts: 0 });

    console.log('\n' + '='.repeat(50));
    console.log('📊 TOTALS FOR ALL AGENTS');
    console.log('='.repeat(50));
    console.log(`📞 Total Call Minutes: ${Math.round(totals.totalCallMinutes)} minutes (${Math.round(totals.totalCallMinutes/60)} hours)`);
    console.log(`🔗 Total Connected Calls: ${totals.connectedCalls}`);
    console.log(`🆕 Total New Leads: ${totals.newLeads}`);
    console.log(`📋 Total App Sent: ${totals.appSentToday}`);
    console.log(`🔴 Total Red Highlighted: ${totals.redHighlightedLeads}`);
    console.log(`✅ Total Closed Accounts: ${totals.newClosedAccounts}`);
    console.log(`👥 Active Agents: ${agents.length}`);

    // Save report to file
    const reportContent = generateHTMLReport(agents, totals);
    const reportPath = `/var/www/vanguard/reports/daily_agent_report_${TODAY}.html`;

    try {
        // Create reports directory if it doesn't exist
        const reportsDir = path.dirname(reportPath);
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(reportPath, reportContent);
        console.log(`\n💾 Report saved to: ${reportPath}`);
        console.log(`🌐 View in browser: http://162.220.14.239:8081/reports/daily_agent_report_${TODAY}.html`);
    } catch (error) {
        console.error(`❌ Error saving report: ${error.message}`);
    }
}

/**
 * Generate HTML report
 */
function generateHTMLReport(agents, totals) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Agent Report - ${TODAY}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #1f2937; text-align: center; margin-bottom: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0; font-size: 2rem; }
        .summary-card p { margin: 5px 0 0; opacity: 0.9; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f8f9fa; font-weight: 600; color: #374151; }
        tr:hover { background: #f8f9fa; }
        .metric-high { color: #059669; font-weight: bold; }
        .metric-medium { color: #f59e0b; font-weight: bold; }
        .metric-low { color: #dc2626; font-weight: bold; }
        .timestamp { text-align: center; color: #6b7280; margin-top: 30px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Daily Agent Performance Report - ${TODAY}</h1>

        <div class="summary-grid">
            <div class="summary-card">
                <h3>${Math.round(totals.totalCallMinutes)}</h3>
                <p>Total Call Minutes</p>
            </div>
            <div class="summary-card">
                <h3>${totals.connectedCalls}</h3>
                <p>Connected Calls</p>
            </div>
            <div class="summary-card">
                <h3>${totals.newLeads}</h3>
                <p>New Leads</p>
            </div>
            <div class="summary-card">
                <h3>${totals.appSentToday}</h3>
                <p>Apps Sent</p>
            </div>
            <div class="summary-card">
                <h3>${totals.redHighlightedLeads}</h3>
                <p>Urgent Leads</p>
            </div>
            <div class="summary-card">
                <h3>${totals.newClosedAccounts}</h3>
                <p>Closed Accounts</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Agent Name</th>
                    <th>Call Minutes</th>
                    <th>Connected Calls</th>
                    <th>New Leads</th>
                    <th>App Sent</th>
                    <th>Red Urgent</th>
                    <th>Closed</th>
                    <th>Contact Rate</th>
                    <th>Avg Call (min)</th>
                </tr>
            </thead>
            <tbody>
                ${agents.map(agent => `
                <tr>
                    <td><strong>${agent.name}</strong></td>
                    <td class="${agent.totalCallMinutes > 60 ? 'metric-high' : agent.totalCallMinutes > 30 ? 'metric-medium' : 'metric-low'}">${Math.round(agent.totalCallMinutes)}</td>
                    <td class="${agent.connectedCalls > 10 ? 'metric-high' : agent.connectedCalls > 5 ? 'metric-medium' : 'metric-low'}">${agent.connectedCalls}</td>
                    <td class="${agent.newLeads > 5 ? 'metric-high' : agent.newLeads > 2 ? 'metric-medium' : 'metric-low'}">${agent.newLeads}</td>
                    <td class="${agent.appSentToday > 3 ? 'metric-high' : agent.appSentToday > 1 ? 'metric-medium' : 'metric-low'}">${agent.appSentToday}</td>
                    <td class="${agent.redHighlightedLeads > 5 ? 'metric-high' : agent.redHighlightedLeads > 2 ? 'metric-medium' : 'metric-low'}">${agent.redHighlightedLeads}</td>
                    <td class="${agent.newClosedAccounts > 2 ? 'metric-high' : agent.newClosedAccounts > 0 ? 'metric-medium' : 'metric-low'}">${agent.newClosedAccounts}</td>
                    <td class="${agent.contactRate > 70 ? 'metric-high' : agent.contactRate > 50 ? 'metric-medium' : 'metric-low'}">${agent.contactRate}%</td>
                    <td>${agent.avgCallDuration}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="timestamp">
            Report generated on ${new Date().toLocaleString()} by Vanguard Agent Performance System
        </div>
    </div>
</body>
</html>`;
}

// Main execution
async function main() {
    try {
        await processLeadsData();
        calculateMetrics();
        generateReport();

        console.log('\n✅ Daily agent report generation complete!');
        console.log('📊 Report includes: call minutes, new leads, app sent, red highlighted leads, closed accounts');

    } catch (error) {
        console.error(`❌ Error generating report: ${error.message}`);
        console.error(error.stack);
    }
}

main();