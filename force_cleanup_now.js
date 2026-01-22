// Force immediate cleanup of all leads to fix the highlight issue
const fetch = require('node-fetch');

async function forceCleanupNow() {
    try {
        console.log('🚀 FORCING IMMEDIATE CLEANUP OF ALL LEADS...');

        // Get all leads from API
        const response = await fetch('http://127.0.0.1:3001/api/leads');
        const leads = await response.json();

        let updatedCount = 0;
        const now = new Date();

        console.log(`📋 Processing ${leads.length} leads...`);

        // Find leads that were previously completed but are now showing as green without proper TO DO
        for (let lead of leads) {
            if (lead.reachOut &&
                (lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt) &&
                !lead.reachOut.greenHighlightUntil &&
                !lead.reachOut.highlightExpired) {

                // These are leads that were cleaned up but not properly marked as expired
                console.log(`🔄 MARKING AS EXPIRED: ${lead.name} (ID: ${lead.id})`);

                lead.reachOut.highlightExpired = true;
                lead.reachOut.expiredAt = now.toISOString();
                lead.reachOut.callsConnected = 0;
                lead.reachOut.textCount = 0;
                lead.reachOut.emailSent = false;
                lead.reachOut.textSent = false;
                lead.reachOut.callMade = false;

                // Save to server
                try {
                    const updateResponse = await fetch(`http://127.0.0.1:3001/api/leads/${lead.id}`, {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({reachOut: lead.reachOut})
                    });

                    if (updateResponse.ok) {
                        console.log(`✅ Saved expired lead ${lead.id} to server`);
                        updatedCount++;
                    } else {
                        console.error(`❌ Failed to save lead ${lead.id}:`, updateResponse.statusText);
                    }
                } catch (error) {
                    console.error(`❌ Server error for lead ${lead.id}:`, error.message);
                }
            }
        }

        console.log(`\n🎯 CLEANUP COMPLETE:`);
        console.log(`   Updated ${updatedCount} leads`);
        console.log(`   These leads should now show red "Reach out" TO DO text`);

    } catch (error) {
        console.error('❌ Force cleanup failed:', error);
    }
}

forceCleanupNow();