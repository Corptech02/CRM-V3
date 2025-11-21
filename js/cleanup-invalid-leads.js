/**
 * Cleanup Invalid Leads - Remove test data and problematic entries
 */
(function() {
    'use strict';

    console.log('🧹 CLEANUP: Starting invalid lead cleanup...');

    // Function to remove invalid leads from server
    async function cleanupInvalidLeads() {
        try {
            const response = await fetch('/api/leads');
            const leads = await response.json();

            console.log(`🧹 CLEANUP: Found ${leads.length} leads in database`);

            leads.forEach(lead => {
                console.log(`🧹 CLEANUP: Lead - ID: ${lead.id || 'NO_ID'}, Name: ${lead.name}`);

                // Remove test leads
                if (lead.name === 'TEST DELETION COMPANY' ||
                    lead.source === 'Test' ||
                    !lead.id) {
                    console.log(`🗑️ CLEANUP: Removing invalid lead: ${lead.name}`);

                    if (lead.id) {
                        fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
                            .then(result => result.json())
                            .then(data => console.log(`✅ CLEANUP: Removed lead ${lead.id}`, data))
                            .catch(error => console.error(`❌ CLEANUP: Error removing lead ${lead.id}:`, error));
                    } else {
                        console.log(`⚠️ CLEANUP: Lead has no ID, cannot delete via API`);
                    }
                }
            });

        } catch (error) {
            console.error('❌ CLEANUP: Error during cleanup:', error);
        }
    }

    // Run cleanup
    cleanupInvalidLeads();

    // Expose cleanup function for manual use
    window.cleanupInvalidLeads = cleanupInvalidLeads;

    console.log('✅ CLEANUP: Invalid lead cleanup script loaded');

})();