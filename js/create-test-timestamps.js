(function() {
    console.log('🔧 CREATING TEST TIMESTAMPS');

    window.createTestTimestamps = function() {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        console.log(`Processing ${leads.length} leads...`);

        leads.forEach((lead, idx) => {
            // Make sure stageTimestamps exists
            if (!lead.stageTimestamps) {
                lead.stageTimestamps = {};
            }

            const now = new Date();
            let testDate;

            // Create different aged timestamps for testing
            if (idx % 4 === 0) {
                // Make it 1 day old (YELLOW)
                testDate = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000));
                console.log(`🟡 ${lead.name} - Setting 1 day old timestamp`);
            } else if (idx % 4 === 1) {
                // Make it 3 days old (ORANGE)
                testDate = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
                console.log(`🟠 ${lead.name} - Setting 3 days old timestamp`);
            } else if (idx % 4 === 2) {
                // Make it 10 days old (RED)
                testDate = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));
                console.log(`🔴 ${lead.name} - Setting 10 days old timestamp`);
            } else {
                // Make it today (GREEN/no highlight)
                testDate = now;
                console.log(`🟢 ${lead.name} - Setting today's timestamp`);
            }

            // Set the timestamp for the current stage
            const stage = lead.stage || 'new';
            lead.stageTimestamps[stage] = testDate.toISOString();
            lead.updatedAt = testDate.toISOString();
        });

        // Save back to localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        console.log('✅ Test timestamps created and saved!');

        // Now force highlighting
        if (window.forceAllHighlighting) {
            console.log('Running highlighting...');
            window.forceAllHighlighting();
        }
    };

    // Also create a function to CHECK what we have
    window.checkTimestamps = function() {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        leads.forEach(lead => {
            if (lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
                const timestamp = lead.stageTimestamps[lead.stage];
                const date = new Date(timestamp);
                const now = new Date();
                const days = Math.floor((now - date) / (1000 * 60 * 60 * 24));

                let color = '⚪';
                if (days === 1) color = '🟡';
                else if (days > 1 && days < 7) color = '🟠';
                else if (days >= 7) color = '🔴';
                else if (days === 0) color = '🟢';

                console.log(`${color} ${lead.name}: ${days} days old`);
            }
        });
    };
})();