// Script to calculate and save live stats for all agents based on their actual lead data
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open database
const db = new sqlite3.Database('/var/www/vanguard/vanguard.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        return;
    }
    console.log('Connected to SQLite database');
    calculateAndSaveAllAgentStats();
});

function calculateAndSaveAllAgentStats() {
    console.log('🔄 Calculating live stats for all agents...');

    // Get all leads from database
    db.all('SELECT data FROM leads', (err, rows) => {
        if (err) {
            console.error('Error fetching leads:', err);
            return;
        }

        console.log(`📊 Processing ${rows.length} leads...`);

        // Parse lead data and organize by agent
        const agentData = {
            'Grant': { leads: [], calls: [], callDuration: 0 },
            'Hunter': { leads: [], calls: [], callDuration: 0 },
            'Carson': { leads: [], calls: [], callDuration: 0 }
        };

        rows.forEach(row => {
            try {
                const leadData = JSON.parse(row.data);
                const assignedTo = leadData.assignedTo;

                if (agentData[assignedTo]) {
                    agentData[assignedTo].leads.push(leadData);

                    // Extract call data if available
                    if (leadData.reachOut && leadData.reachOut.callLogs) {
                        leadData.reachOut.callLogs.forEach(call => {
                            agentData[assignedTo].calls.push(call);
                            if (call.connected && call.duration) {
                                // Parse duration (e.g., "5 min" -> 5)
                                const match = call.duration.match(/(\d+)\s*min/);
                                if (match) {
                                    agentData[assignedTo].callDuration += parseInt(match[1]);
                                } else if (call.duration === '< 1 min') {
                                    agentData[assignedTo].callDuration += 0.5;
                                }
                            }
                        });
                    }
                }
            } catch (parseError) {
                console.warn('Error parsing lead data:', parseError);
            }
        });

        // Calculate stats for each agent
        Object.keys(agentData).forEach(agentName => {
            const agent = agentData[agentName];
            const leads = agent.leads;
            const calls = agent.calls;

            // Calculate basic stats
            const totalLeads = leads.length;
            const totalCalls = calls.length;
            const connectedCalls = calls.filter(call => call.connected).length;
            const totalCallDuration = Math.round(agent.callDuration);

            // Calculate high value leads (leads with 60+ min total call time)
            let highValueLeads = 0;
            leads.forEach(lead => {
                let totalMinutes = 0;
                if (lead.reachOut && lead.reachOut.callLogs) {
                    lead.reachOut.callLogs.forEach(call => {
                        if (call.connected && call.duration) {
                            const match = call.duration.match(/(\d+)\s*min/);
                            if (match) {
                                totalMinutes += parseInt(match[1]);
                            } else if (call.duration === '< 1 min') {
                                totalMinutes += 0.5;
                            }
                        }
                    });
                }
                if (totalMinutes >= 60) {
                    highValueLeads++;
                }
            });

            // Calculate low value leads
            const lowValueLeads = totalLeads - highValueLeads;

            // Calculate contact rate
            const contactRate = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;

            // Calculate leads to brokers (leads in certain stages)
            const leadsToBrokers = leads.filter(lead =>
                lead.stage === 'not-interested' || lead.stage === 'quoted'
            ).length;

            // Create stats object
            const stats = {
                totalCalls,
                connectedCalls,
                totalCallDuration,
                totalLeads,
                highValueLeads,
                lowValueLeads,
                contactRate,
                leadsToBrokers,
                lastUpdated: new Date().toISOString()
            };

            console.log(`📈 ${agentName} Stats:`, stats);

            // Save to database
            const key = `live_stats_${agentName}`;
            const value = JSON.stringify(stats);

            db.run(
                'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                [key, value],
                (err) => {
                    if (err) {
                        console.error(`Error saving live stats for ${agentName}:`, err);
                    } else {
                        console.log(`✅ Saved live stats for ${agentName}`);
                    }
                }
            );
        });

        // Close database after all operations
        setTimeout(() => {
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed');
                    console.log('🎉 Live stats calculation complete for all agents!');
                }
            });
        }, 1000);
    });
}