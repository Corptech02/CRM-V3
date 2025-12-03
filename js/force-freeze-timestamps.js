// Force freeze timestamps for completed reach outs
console.log('🧊 FORCE FREEZE TIMESTAMPS - Loading...');

(function() {
    'use strict';

    // Function to check if a lead's reach out is completed
    function isReachOutCompleted(lead) {
        const reachOutStages = ['quoted', 'info_requested', 'quote_sent', 'interested'];
        if (!reachOutStages.includes(lead.stage) || !lead.reachOut) {
            return false;
        }

        // Check if reach out is completed (connected call OR text sent)
        return (lead.reachOut.callsConnected > 0) || (lead.reachOut.textCount > 0);
    }

    // Function to force freeze all completed reach out timestamps
    function forceFreeze() {
        console.log('🧊 Starting force freeze of all completed reach out timestamps...');

        try {
            // Get all leads from both storage locations
            let insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            let regularLeads = JSON.parse(localStorage.getItem('leads') || '[]');

            let frozenCount = 0;
            const freezeTimestamp = new Date('2024-11-22T10:00:00.000Z').toISOString(); // Set to Nov 22 as requested

            console.log(`🔍 Scanning ${insuranceLeads.length} insurance leads and ${regularLeads.length} regular leads`);

            // Process insurance leads
            insuranceLeads.forEach((lead, index) => {
                if (isReachOutCompleted(lead)) {
                    if (!lead.reachOut.reachOutCompletedAt) {
                        lead.reachOut.reachOutCompletedAt = freezeTimestamp;
                        frozenCount++;
                        console.log(`🧊 FROZEN: ${lead.name} (insurance) - Set to ${new Date(freezeTimestamp).toLocaleString()}`);
                    } else {
                        // Update existing timestamps to the specific date requested
                        lead.reachOut.reachOutCompletedAt = freezeTimestamp;
                        console.log(`🔄 UPDATED: ${lead.name} (insurance) - Set to ${new Date(freezeTimestamp).toLocaleString()}`);
                    }
                }
            });

            // Process regular leads
            regularLeads.forEach((lead, index) => {
                if (isReachOutCompleted(lead)) {
                    if (!lead.reachOut.reachOutCompletedAt) {
                        lead.reachOut.reachOutCompletedAt = freezeTimestamp;
                        frozenCount++;
                        console.log(`🧊 FROZEN: ${lead.name} (regular) - Set to ${new Date(freezeTimestamp).toLocaleString()}`);
                    } else {
                        // Update existing timestamps to the specific date requested
                        lead.reachOut.reachOutCompletedAt = freezeTimestamp;
                        console.log(`🔄 UPDATED: ${lead.name} (regular) - Set to ${new Date(freezeTimestamp).toLocaleString()}`);
                    }
                }
            });

            // Save the updated data
            localStorage.setItem('insurance_leads', JSON.stringify(insuranceLeads));
            localStorage.setItem('leads', JSON.stringify(regularLeads));

            console.log(`✅ Successfully processed ${frozenCount} completed reach outs`);
            console.log(`🧊 All completed reach outs now frozen at: ${new Date(freezeTimestamp).toLocaleString()}`);

            // Show notification
            if (typeof showNotification === 'function') {
                showNotification(`Frozen ${frozenCount} reach out timestamps to Nov 22, 2024`, 'success');
            }

        } catch (error) {
            console.error('❌ Error during force freeze:', error);
            if (typeof showNotification === 'function') {
                showNotification('Error freezing timestamps: ' + error.message, 'error');
            }
        }
    }

    // Auto-run the freeze function on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceFreeze);
    } else {
        forceFreeze();
    }

    // Also expose it globally for manual triggering
    window.forceFreezeTimestamps = forceFreeze;

    console.log('🧊 FORCE FREEZE TIMESTAMPS - Ready');
})();