// Generate comprehensive highlight duration status report for all leads
const fs = require('fs');

async function generateHighlightStatusReport() {
    try {
        // Fetch all leads from the API
        const response = await fetch('http://127.0.0.1:3001/api/leads');
        const leads = await response.json();

        console.log(`📊 COMPREHENSIVE HIGHLIGHT DURATION STATUS REPORT`);
        console.log(`================================================`);
        console.log(`Total Leads Found: ${leads.length}`);
        console.log(`Report Generated: ${new Date().toLocaleString()}`);
        console.log(`================================================\n`);

        let activeHighlights = 0;
        let expiredHighlights = 0;
        let noHighlights = 0;
        let completedWithoutHighlight = 0;

        const report = [];

        leads.forEach((lead, index) => {
            const now = new Date();
            let status = {
                id: lead.id,
                name: lead.name,
                stage: lead.stage,
                assignedTo: lead.assignedTo || 'Unassigned',
                reachOutStatus: 'Not Started',
                highlightStatus: 'No Highlight',
                timeRemaining: 'N/A',
                expiresAt: 'N/A',
                durationDays: 'N/A',
                shouldShowTodo: 'No'
            };

            // Check reach-out completion status
            if (lead.reachOut) {
                const reachOut = lead.reachOut;

                // Determine reach-out status
                if (reachOut.completedAt || reachOut.reachOutCompletedAt) {
                    status.reachOutStatus = 'Completed';

                    // Check for highlight duration
                    if (reachOut.greenHighlightUntil) {
                        const expiryDate = new Date(reachOut.greenHighlightUntil);
                        const diffMs = expiryDate - now;

                        status.expiresAt = expiryDate.toLocaleString();
                        status.durationDays = reachOut.greenHighlightDays || 'Unknown';

                        if (diffMs > 0) {
                            // Active highlight
                            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                            if (days > 0) {
                                status.timeRemaining = `${days}d ${hours}h ${minutes}m`;
                            } else if (hours > 0) {
                                status.timeRemaining = `${hours}h ${minutes}m`;
                            } else {
                                status.timeRemaining = `${minutes}m`;
                            }

                            status.highlightStatus = 'ACTIVE (Green)';
                            status.shouldShowTodo = 'No (Green Highlight)';
                            activeHighlights++;
                        } else {
                            // Expired highlight
                            const expiredHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
                            const expiredDays = Math.floor(expiredHours / 24);

                            if (expiredDays > 0) {
                                status.timeRemaining = `EXPIRED ${expiredDays}d ago`;
                            } else {
                                status.timeRemaining = `EXPIRED ${expiredHours}h ago`;
                            }

                            status.highlightStatus = 'EXPIRED';
                            status.shouldShowTodo = 'Yes (Reach out)';
                            expiredHighlights++;
                        }
                    } else {
                        // Completed but no highlight duration set
                        status.reachOutStatus = 'Completed (No Highlight)';
                        status.highlightStatus = 'None Set';
                        status.shouldShowTodo = 'No (Completed)';
                        completedWithoutHighlight++;
                    }
                } else {
                    // Not completed
                    status.reachOutStatus = 'In Progress';
                    status.highlightStatus = 'N/A (Not Completed)';

                    // Determine if should show TO DO based on stage
                    const stagesNeedingReachOut = ['quoted', 'info_requested', 'quote_sent', 'quote-sent-unaware', 'quote-sent-aware', 'interested', 'contact_attempted', 'loss_runs_requested'];

                    if (stagesNeedingReachOut.includes(lead.stage)) {
                        status.shouldShowTodo = 'Yes (Reach out)';
                    } else {
                        status.shouldShowTodo = `No (${lead.stage})`;
                    }

                    noHighlights++;
                }
            } else {
                // No reach-out data
                status.shouldShowTodo = 'Yes (New Lead)';
                noHighlights++;
            }

            report.push(status);
        });

        // Sort by highlight status priority: Expired -> Active -> None
        report.sort((a, b) => {
            const priority = {
                'EXPIRED': 1,
                'ACTIVE (Green)': 2,
                'None Set': 3,
                'No Highlight': 4,
                'N/A (Not Completed)': 5
            };
            return (priority[a.highlightStatus] || 6) - (priority[b.highlightStatus] || 6);
        });

        // Print summary
        console.log(`📈 SUMMARY:`);
        console.log(`  🔴 Expired Highlights: ${expiredHighlights}`);
        console.log(`  🟢 Active Highlights: ${activeHighlights}`);
        console.log(`  ⚫ No Highlights: ${noHighlights}`);
        console.log(`  ✅ Completed (No Highlight): ${completedWithoutHighlight}`);
        console.log(`\n`);

        // Print detailed report
        console.log(`📋 DETAILED REPORT:`);
        console.log(`==================`);

        report.forEach((lead, index) => {
            const statusIcon = lead.highlightStatus === 'ACTIVE (Green)' ? '🟢' :
                             lead.highlightStatus === 'EXPIRED' ? '🔴' :
                             lead.highlightStatus === 'None Set' ? '⚫' : '⚪';

            console.log(`${index + 1}. ${statusIcon} ${lead.name} (ID: ${lead.id})`);
            console.log(`   Stage: ${lead.stage}`);
            console.log(`   Assigned: ${lead.assignedTo}`);
            console.log(`   Reach-Out: ${lead.reachOutStatus}`);
            console.log(`   Highlight: ${lead.highlightStatus}`);
            console.log(`   Time Remaining: ${lead.timeRemaining}`);
            console.log(`   Expires At: ${lead.expiresAt}`);
            console.log(`   Duration Days: ${lead.durationDays}`);
            console.log(`   Should Show TO DO: ${lead.shouldShowTodo}`);
            console.log(`   ---`);
        });

        // Save report to file
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                totalLeads: leads.length,
                activeHighlights,
                expiredHighlights,
                noHighlights,
                completedWithoutHighlight
            },
            details: report
        };

        fs.writeFileSync('/var/www/vanguard/highlight_status_report.json', JSON.stringify(reportData, null, 2));
        console.log(`\n💾 Report saved to: /var/www/vanguard/highlight_status_report.json`);

    } catch (error) {
        console.error('❌ Error generating report:', error);
    }
}

// For Node.js environment, need to use node-fetch
const fetch = require('node-fetch');
generateHighlightStatusReport();