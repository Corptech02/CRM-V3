#!/bin/bash

# Daily Agent Performance Report Generator
# Date: 2026-03-03

echo "📊 DAILY AGENT PERFORMANCE REPORT - $(date +%Y-%m-%d)"
echo "=================================================================="

TODAY="2026-03-03"

echo ""
echo "🔍 Analyzing leads data from database..."

# Create temporary SQL script for analysis
cat > /tmp/agent_analysis.sql << 'EOF'
.mode column
.headers on
.width 15 10 12 10 8 12 8 10

-- First, let's see the raw data structure
SELECT 'Database Summary:' as info;
SELECT COUNT(*) as total_leads FROM leads;
SELECT 'Sample lead data:' as info;
SELECT substr(data, 1, 100) as sample_data FROM leads LIMIT 1;

-- Extract agent performance data
SELECT
    'Agent Performance Summary:' as report_section;

-- We need to parse JSON data from the leads table
-- This requires a more complex approach using JSON functions
EOF

# Run initial analysis
echo "📋 Database Summary:"
sqlite3 /var/www/vanguard/vanguard.db ".mode column" ".headers on" "SELECT COUNT(*) as total_leads FROM leads;"

echo ""
echo "📊 Extracting leads data for analysis..."

# Export leads data to temporary JSON file for processing
sqlite3 /var/www/vanguard/vanguard.db "SELECT data FROM leads;" > /tmp/leads_raw.txt

# Create a Node.js script that doesn't require external dependencies
cat > /tmp/process_leads.js << 'EOF'
const fs = require('fs');

const TODAY = '2026-03-03';
const agentStats = {};

console.log(`📊 Processing leads data for ${TODAY}`);

function initAgent(name) {
    if (!agentStats[name]) {
        agentStats[name] = {
            totalCallMinutes: 0,
            connectedCalls: 0,
            newLeads: 0,
            appSentToday: 0,
            redHighlightedLeads: 0,
            newClosedAccounts: 0,
            totalLeads: 0,
            contactedLeads: 0
        };
    }
    return agentStats[name];
}

function isToday(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date.toISOString().startsWith(TODAY);
}

function parseCallDuration(duration) {
    if (!duration) return 0;

    let totalMinutes = 0;
    const minMatch = duration.match(/(\d+)\s*min/);
    const secMatch = duration.match(/(\d+)\s*sec/);

    if (minMatch) totalMinutes += parseInt(minMatch[1]);
    if (secMatch) totalMinutes += parseInt(secMatch[1]) / 60;

    return totalMinutes;
}

try {
    const rawData = fs.readFileSync('/tmp/leads_raw.txt', 'utf8');
    const lines = rawData.split('\n').filter(line => line.trim());

    console.log(`📊 Found ${lines.length} leads in database`);

    lines.forEach((line, index) => {
        try {
            const lead = JSON.parse(line);
            const agentName = lead.assignedTo || lead.agent || 'Unassigned';
            const agent = initAgent(agentName);

            agent.totalLeads++;

            // Check for new leads today
            if (isToday(lead.created_at || lead.createdDate || lead.timestamp)) {
                agent.newLeads++;
            }

            // Check for app sent today
            if ((lead.stage === 'app_sent' || lead.stage === 'App Sent') &&
                isToday(lead.stageUpdatedAt || lead.updated_at)) {
                agent.appSentToday++;
            }

            // Check for closed accounts today
            if ((lead.stage === 'sale' || lead.stage === 'closed' || lead.status === 'closed_won') &&
                isToday(lead.stageUpdatedAt || lead.closedDate)) {
                agent.newClosedAccounts++;
            }

            // Process call data
            if (lead.reachOut) {
                const connected = lead.reachOut.callsConnected || 0;
                agent.connectedCalls += connected;

                if (lead.reachOut.contacted || connected > 0) {
                    agent.contactedLeads++;
                }

                // Process call logs
                if (lead.reachOut.callLogs && Array.isArray(lead.reachOut.callLogs)) {
                    lead.reachOut.callLogs.forEach(call => {
                        if (call.duration && (!call.timestamp || isToday(call.timestamp))) {
                            agent.totalCallMinutes += parseCallDuration(call.duration);
                        }
                    });
                }
            }

            // Check for red highlighted leads (urgent follow-up needed)
            const isUrgent = lead.priority === 'high' || lead.urgent ||
                           lead.followUpRequired ||
                           (lead.stage && ['contact_attempted', 'info_requested'].includes(lead.stage));

            if (isUrgent) {
                agent.redHighlightedLeads++;
            }

        } catch (e) {
            console.error(`Error processing lead ${index}: ${e.message}`);
        }
    });

    // Generate report
    console.log('\n' + '='.repeat(80));
    console.log(`📊 DAILY AGENT PERFORMANCE REPORT - ${TODAY}`);
    console.log('='.repeat(80));

    const agents = Object.keys(agentStats).map(name => ({
        name,
        ...agentStats[name]
    })).sort((a, b) => b.totalCallMinutes - a.totalCallMinutes);

    if (agents.length === 0) {
        console.log('❌ No agent data found');
        return;
    }

    console.log('\n📈 AGENT PERFORMANCE SUMMARY');
    console.log('-'.repeat(120));
    console.log('Agent Name'.padEnd(15) +
                'Call Min'.padEnd(10) +
                'Connected'.padEnd(12) +
                'New Leads'.padEnd(12) +
                'App Sent'.padEnd(10) +
                'Red Urgent'.padEnd(12) +
                'Closed'.padEnd(8) +
                'Contact%'.padEnd(10));
    console.log('-'.repeat(120));

    agents.forEach(agent => {
        const contactRate = agent.totalLeads > 0 ?
            ((agent.contactedLeads / agent.totalLeads) * 100).toFixed(1) : 0;

        console.log(
            agent.name.slice(0, 14).padEnd(15) +
            Math.round(agent.totalCallMinutes).toString().padEnd(10) +
            agent.connectedCalls.toString().padEnd(12) +
            agent.newLeads.toString().padEnd(12) +
            agent.appSentToday.toString().padEnd(10) +
            agent.redHighlightedLeads.toString().padEnd(12) +
            agent.newClosedAccounts.toString().padEnd(8) +
            (contactRate + '%').padEnd(10)
        );
    });

    console.log('-'.repeat(120));

    // Calculate totals
    const totals = agents.reduce((sum, agent) => ({
        totalCallMinutes: sum.totalCallMinutes + agent.totalCallMinutes,
        connectedCalls: sum.connectedCalls + agent.connectedCalls,
        newLeads: sum.newLeads + agent.newLeads,
        appSentToday: sum.appSentToday + agent.appSentToday,
        redHighlightedLeads: sum.redHighlightedLeads + agent.redHighlightedLeads,
        newClosedAccounts: sum.newClosedAccounts + agent.newClosedAccounts,
        totalLeads: sum.totalLeads + agent.totalLeads
    }), { totalCallMinutes: 0, connectedCalls: 0, newLeads: 0, appSentToday: 0,
          redHighlightedLeads: 0, newClosedAccounts: 0, totalLeads: 0 });

    console.log('\n📊 TOTALS FOR ALL AGENTS');
    console.log('='.repeat(50));
    console.log(`📞 Total Call Minutes: ${Math.round(totals.totalCallMinutes)} (${(totals.totalCallMinutes/60).toFixed(1)} hours)`);
    console.log(`🔗 Total Connected Calls: ${totals.connectedCalls}`);
    console.log(`🆕 Total New Leads Today: ${totals.newLeads}`);
    console.log(`📋 Total App Sent Today: ${totals.appSentToday}`);
    console.log(`🔴 Total Red Highlighted: ${totals.redHighlightedLeads}`);
    console.log(`✅ Total Closed Today: ${totals.newClosedAccounts}`);
    console.log(`👥 Active Agents: ${agents.length}`);
    console.log(`📋 Total Leads: ${totals.totalLeads}`);

    console.log('\n📋 DETAILED BREAKDOWN BY AGENT');
    console.log('='.repeat(50));

    agents.forEach(agent => {
        const contactRate = agent.totalLeads > 0 ?
            ((agent.contactedLeads / agent.totalLeads) * 100).toFixed(1) : 0;
        const avgCall = agent.connectedCalls > 0 ?
            (agent.totalCallMinutes / agent.connectedCalls).toFixed(1) : 0;

        console.log(`\n👤 ${agent.name}`);
        console.log(`   📞 Total Call Minutes Today: ${Math.round(agent.totalCallMinutes)} minutes`);
        console.log(`   🔗 Connected Calls: ${agent.connectedCalls}`);
        console.log(`   🆕 New Leads Today: ${agent.newLeads}`);
        console.log(`   📋 App Sent Today: ${agent.appSentToday}`);
        console.log(`   🔴 Red Highlighted Leads: ${agent.redHighlightedLeads}`);
        console.log(`   ✅ New Closed Accounts Today: ${agent.newClosedAccounts}`);
        console.log(`   📈 Contact Rate: ${contactRate}% (${agent.contactedLeads}/${agent.totalLeads})`);
        console.log(`   ⏱️  Avg Call Duration: ${avgCall} minutes`);
    });

    console.log('\n✅ Report generation complete!');

} catch (error) {
    console.error(`❌ Error: ${error.message}`);
}
EOF

# Run the analysis
node /tmp/process_leads.js

# Cleanup
rm -f /tmp/leads_raw.txt /tmp/process_leads.js /tmp/agent_analysis.sql

echo ""
echo "📊 Report completed at $(date)"
echo "=================================================================="