#!/bin/bash

# 7-Day Agent Performance Report Generator
# Analyzes past 7 days of agent performance

echo "📊 7-DAY AGENT PERFORMANCE REPORT"
echo "=================================================================="

# Calculate 7-day date range
END_DATE="2026-03-03"
START_DATE="2026-02-25"  # 7 days before

echo "📅 Analysis Period: $START_DATE to $END_DATE"
echo "🔍 Analyzing leads data from database..."

# Create Node.js script for 7-day analysis
cat > /tmp/process_7day_leads.js << 'EOF'
const fs = require('fs');

const END_DATE = '2026-03-03';
const START_DATE = '2026-02-25';
const agentStats = {};
const dailyStats = {}; // Track daily performance for trends

console.log(`📊 Processing 7-day leads data from ${START_DATE} to ${END_DATE}`);

function initAgent(name) {
    if (!agentStats[name]) {
        agentStats[name] = {
            totalCallMinutes: 0,
            connectedCalls: 0,
            newLeads: 0,
            appSentWeek: 0,
            redHighlightedLeads: 0,
            newClosedAccounts: 0,
            totalLeads: 0,
            contactedLeads: 0,
            callAttempts: 0,
            dailyBreakdown: {}
        };
    }
    return agentStats[name];
}

function isInDateRange(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const start = new Date(START_DATE);
    const end = new Date(END_DATE);

    return date >= start && date <= end;
}

function getDateOnly(dateStr) {
    if (!dateStr) return null;
    return new Date(dateStr).toISOString().split('T')[0];
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

function initDailyStats(agent, date) {
    if (!agent.dailyBreakdown[date]) {
        agent.dailyBreakdown[date] = {
            callMinutes: 0,
            connectedCalls: 0,
            newLeads: 0,
            appSent: 0,
            closedAccounts: 0
        };
    }
    return agent.dailyBreakdown[date];
}

try {
    const rawData = fs.readFileSync('/tmp/leads_raw_7day.txt', 'utf8');
    const lines = rawData.split('\n').filter(line => line.trim());

    console.log(`📊 Found ${lines.length} leads in database for 7-day analysis`);

    lines.forEach((line, index) => {
        try {
            const lead = JSON.parse(line);
            const agentName = lead.assignedTo || lead.agent || 'Unassigned';
            const agent = initAgent(agentName);

            agent.totalLeads++;

            // Check for new leads in the past 7 days
            const createdDate = lead.created_at || lead.createdDate || lead.timestamp;
            if (isInDateRange(createdDate)) {
                agent.newLeads++;
                const dayCreated = getDateOnly(createdDate);
                if (dayCreated) {
                    const daily = initDailyStats(agent, dayCreated);
                    daily.newLeads++;
                }
            }

            // Check for app sent in past 7 days
            if ((lead.stage === 'app_sent' || lead.stage === 'App Sent')) {
                const stageUpdated = lead.stageUpdatedAt || lead.updated_at;
                if (isInDateRange(stageUpdated)) {
                    agent.appSentWeek++;
                    const dayUpdated = getDateOnly(stageUpdated);
                    if (dayUpdated) {
                        const daily = initDailyStats(agent, dayUpdated);
                        daily.appSent++;
                    }
                }
            }

            // Check for closed accounts in past 7 days
            if ((lead.stage === 'sale' || lead.stage === 'closed' || lead.status === 'closed_won')) {
                const closedDate = lead.stageUpdatedAt || lead.closedDate;
                if (isInDateRange(closedDate)) {
                    agent.newClosedAccounts++;
                    const dayClosed = getDateOnly(closedDate);
                    if (dayClosed) {
                        const daily = initDailyStats(agent, dayClosed);
                        daily.closedAccounts++;
                    }
                }
            }

            // Process call data
            if (lead.reachOut) {
                const connected = lead.reachOut.callsConnected || 0;
                const attempts = lead.reachOut.callAttempts || 0;

                agent.connectedCalls += connected;
                agent.callAttempts += attempts;

                if (lead.reachOut.contacted || connected > 0) {
                    agent.contactedLeads++;
                }

                // Process call logs - filter for past 7 days if timestamps available
                if (lead.reachOut.callLogs && Array.isArray(lead.reachOut.callLogs)) {
                    lead.reachOut.callLogs.forEach(call => {
                        const callDate = call.timestamp || call.date;
                        const includeCall = !callDate || isInDateRange(callDate);

                        if (includeCall && call.duration) {
                            const minutes = parseCallDuration(call.duration);
                            agent.totalCallMinutes += minutes;

                            // Add to daily breakdown
                            const dayOfCall = getDateOnly(callDate) || END_DATE; // Default to end date if no timestamp
                            const daily = initDailyStats(agent, dayOfCall);
                            daily.callMinutes += minutes;
                            daily.connectedCalls += 1;
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

    // Generate comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log(`📊 7-DAY AGENT PERFORMANCE REPORT (${START_DATE} to ${END_DATE})`);
    console.log('='.repeat(80));

    const agents = Object.keys(agentStats).map(name => ({
        name,
        ...agentStats[name]
    })).sort((a, b) => b.totalCallMinutes - a.totalCallMinutes);

    if (agents.length === 0) {
        console.log('❌ No agent data found for the past 7 days');
        return;
    }

    console.log('\n📈 7-DAY PERFORMANCE SUMMARY');
    console.log('-'.repeat(130));
    console.log('Agent Name'.padEnd(15) +
                'Call Min'.padEnd(10) +
                'Connected'.padEnd(12) +
                'Attempts'.padEnd(10) +
                'New Leads'.padEnd(12) +
                'App Sent'.padEnd(10) +
                'Red Urgent'.padEnd(12) +
                'Closed'.padEnd(8) +
                'Contact%'.padEnd(10) +
                'Avg/Call'.padEnd(10));
    console.log('-'.repeat(130));

    agents.forEach(agent => {
        const contactRate = agent.totalLeads > 0 ?
            ((agent.contactedLeads / agent.totalLeads) * 100).toFixed(1) : 0;
        const avgCall = agent.connectedCalls > 0 ?
            (agent.totalCallMinutes / agent.connectedCalls).toFixed(1) : 0;

        console.log(
            agent.name.slice(0, 14).padEnd(15) +
            Math.round(agent.totalCallMinutes).toString().padEnd(10) +
            agent.connectedCalls.toString().padEnd(12) +
            agent.callAttempts.toString().padEnd(10) +
            agent.newLeads.toString().padEnd(12) +
            agent.appSentWeek.toString().padEnd(10) +
            agent.redHighlightedLeads.toString().padEnd(12) +
            agent.newClosedAccounts.toString().padEnd(8) +
            (contactRate + '%').padEnd(10) +
            (avgCall + 'm').padEnd(10)
        );
    });

    console.log('-'.repeat(130));

    // Calculate totals
    const totals = agents.reduce((sum, agent) => ({
        totalCallMinutes: sum.totalCallMinutes + agent.totalCallMinutes,
        connectedCalls: sum.connectedCalls + agent.connectedCalls,
        callAttempts: sum.callAttempts + agent.callAttempts,
        newLeads: sum.newLeads + agent.newLeads,
        appSentWeek: sum.appSentWeek + agent.appSentWeek,
        redHighlightedLeads: sum.redHighlightedLeads + agent.redHighlightedLeads,
        newClosedAccounts: sum.newClosedAccounts + agent.newClosedAccounts,
        totalLeads: sum.totalLeads + agent.totalLeads
    }), { totalCallMinutes: 0, connectedCalls: 0, callAttempts: 0, newLeads: 0,
          appSentWeek: 0, redHighlightedLeads: 0, newClosedAccounts: 0, totalLeads: 0 });

    console.log('\n📊 7-DAY TOTALS FOR ALL AGENTS');
    console.log('='.repeat(60));
    console.log(`📞 Total Call Minutes: ${Math.round(totals.totalCallMinutes)} (${(totals.totalCallMinutes/60).toFixed(1)} hours)`);
    console.log(`🔗 Total Connected Calls: ${totals.connectedCalls}`);
    console.log(`📲 Total Call Attempts: ${totals.callAttempts}`);
    console.log(`🆕 New Leads (7 days): ${totals.newLeads}`);
    console.log(`📋 App Sent (7 days): ${totals.appSentWeek}`);
    console.log(`🔴 Red Highlighted Leads: ${totals.redHighlightedLeads}`);
    console.log(`✅ Closed Accounts (7 days): ${totals.newClosedAccounts}`);
    console.log(`👥 Active Agents: ${agents.length}`);
    console.log(`📋 Total Leads Managed: ${totals.totalLeads}`);

    // Calculate conversion rates
    const leadToAppRate = totals.newLeads > 0 ? ((totals.appSentWeek / totals.newLeads) * 100).toFixed(1) : 0;
    const appToCloseRate = totals.appSentWeek > 0 ? ((totals.newClosedAccounts / totals.appSentWeek) * 100).toFixed(1) : 0;
    const connectRate = totals.callAttempts > 0 ? ((totals.connectedCalls / totals.callAttempts) * 100).toFixed(1) : 0;

    console.log(`\n📈 CONVERSION METRICS`);
    console.log(`🔄 Lead to App Rate: ${leadToAppRate}% (${totals.appSentWeek}/${totals.newLeads})`);
    console.log(`🎯 App to Close Rate: ${appToCloseRate}% (${totals.newClosedAccounts}/${totals.appSentWeek})`);
    console.log(`☎️  Call Connect Rate: ${connectRate}% (${totals.connectedCalls}/${totals.callAttempts})`);

    console.log('\n📋 DETAILED 7-DAY BREAKDOWN BY AGENT');
    console.log('='.repeat(60));

    agents.forEach(agent => {
        const contactRate = agent.totalLeads > 0 ?
            ((agent.contactedLeads / agent.totalLeads) * 100).toFixed(1) : 0;
        const avgCall = agent.connectedCalls > 0 ?
            (agent.totalCallMinutes / agent.connectedCalls).toFixed(1) : 0;
        const efficiency = agent.callAttempts > 0 ?
            ((agent.connectedCalls / agent.callAttempts) * 100).toFixed(1) : 0;

        console.log(`\n👤 ${agent.name} - 7 Day Performance`);
        console.log(`   📞 Total Call Minutes: ${Math.round(agent.totalCallMinutes)} minutes`);
        console.log(`   🔗 Connected Calls: ${agent.connectedCalls} (${agent.callAttempts} attempts - ${efficiency}% success)`);
        console.log(`   🆕 New Leads: ${agent.newLeads}`);
        console.log(`   📋 Apps Sent: ${agent.appSentWeek}`);
        console.log(`   🔴 Red Highlighted: ${agent.redHighlightedLeads}`);
        console.log(`   ✅ Closed Accounts: ${agent.newClosedAccounts}`);
        console.log(`   📈 Contact Rate: ${contactRate}% (${agent.contactedLeads}/${agent.totalLeads} total leads)`);
        console.log(`   ⏱️  Avg Call Duration: ${avgCall} minutes`);

        // Show daily breakdown if available
        const dailyKeys = Object.keys(agent.dailyBreakdown).sort();
        if (dailyKeys.length > 0) {
            console.log(`   📅 Daily Activity:`);
            dailyKeys.forEach(date => {
                const daily = agent.dailyBreakdown[date];
                if (daily.callMinutes > 0 || daily.newLeads > 0 || daily.appSent > 0 || daily.closedAccounts > 0) {
                    console.log(`      ${date}: ${Math.round(daily.callMinutes)}min, ${daily.connectedCalls} calls, ${daily.newLeads} leads, ${daily.appSent} apps, ${daily.closedAccounts} closed`);
                }
            });
        }
    });

    // Performance rankings
    console.log('\n🏆 7-DAY PERFORMANCE RANKINGS');
    console.log('='.repeat(50));

    const topCallTime = [...agents].sort((a, b) => b.totalCallMinutes - a.totalCallMinutes);
    const topConnected = [...agents].sort((a, b) => b.connectedCalls - a.connectedCalls);
    const topLeads = [...agents].sort((a, b) => b.newLeads - a.newLeads);
    const topClosed = [...agents].sort((a, b) => b.newClosedAccounts - a.newClosedAccounts);

    console.log(`🥇 Most Call Time: ${topCallTime[0]?.name} (${Math.round(topCallTime[0]?.totalCallMinutes)} min)`);
    console.log(`🥇 Most Connected Calls: ${topConnected[0]?.name} (${topConnected[0]?.connectedCalls} calls)`);
    console.log(`🥇 Most New Leads: ${topLeads[0]?.name} (${topLeads[0]?.newLeads} leads)`);
    console.log(`🥇 Most Closures: ${topClosed[0]?.name} (${topClosed[0]?.newClosedAccounts} sales)`);

    console.log('\n✅ 7-day report generation complete!');

} catch (error) {
    console.error(`❌ Error: ${error.message}`);
}
EOF

# Export leads data for 7-day analysis
echo "📊 Extracting leads data for 7-day analysis..."
sqlite3 /var/www/vanguard/vanguard.db "SELECT data FROM leads;" > /tmp/leads_raw_7day.txt

# Run the 7-day analysis
node /tmp/process_7day_leads.js

# Cleanup
rm -f /tmp/leads_raw_7day.txt /tmp/process_7day_leads.js

echo ""
echo "📊 7-day report completed at $(date)"
echo "=================================================================="