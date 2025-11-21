// UNARCHIVE ALL LEADS - Make all leads active for testing
(function() {
    'use strict';

    console.log('🔧 UNARCHIVING ALL LEADS...');

    // Get all leads from all possible sources
    const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const regularLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    const archivedLeads1 = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
    const archivedLeads2 = JSON.parse(localStorage.getItem('archived_leads') || '[]');

    console.log(`Found ${insuranceLeads.length} insurance_leads`);
    console.log(`Found ${regularLeads.length} regular leads`);
    console.log(`Found ${archivedLeads1.length} in archivedLeads`);
    console.log(`Found ${archivedLeads2.length} in archived_leads`);

    // Combine all leads into a single Map to deduplicate
    const allLeadsMap = new Map();

    // Helper to add lead to map
    function addLeadToMap(lead) {
        if (lead && lead.id) {
            // Remove archived flag
            delete lead.archived;

            // Ensure ID is string
            lead.id = String(lead.id);

            // Set stage to 'new' if it's archived or undefined
            if (!lead.stage || lead.stage === 'archived') {
                lead.stage = 'new';
            }

            allLeadsMap.set(lead.id, lead);
        }
    }

    // Add all leads from all sources
    insuranceLeads.forEach(addLeadToMap);
    regularLeads.forEach(addLeadToMap);
    archivedLeads1.forEach(addLeadToMap);
    archivedLeads2.forEach(addLeadToMap);

    // Convert back to array
    const allActiveLeads = Array.from(allLeadsMap.values());

    console.log(`✅ Combined into ${allActiveLeads.length} unique active leads`);

    // Save all leads as active to both main storage keys
    localStorage.setItem('insurance_leads', JSON.stringify(allActiveLeads));
    localStorage.setItem('leads', JSON.stringify(allActiveLeads));

    // Clear archived storage
    localStorage.setItem('archivedLeads', '[]');
    localStorage.setItem('archived_leads', '[]');
    localStorage.removeItem('PERMANENT_ARCHIVED_IDS');

    console.log('🗑️ Cleared all archived storage');

    // Show what we have
    console.log('Active leads now include:');
    allActiveLeads.slice(0, 10).forEach(lead => {
        console.log(`  - ${lead.name} (ID: ${lead.id}, Stage: ${lead.stage})`);
    });

    // Reload the view if available
    if (window.loadLeadsView && typeof window.loadLeadsView === 'function') {
        console.log('🔄 Reloading leads view...');
        window.loadLeadsView();
    }

    console.log('✅ ALL LEADS ARE NOW ACTIVE!');

    // Return count for verification
    return allActiveLeads.length;
})();