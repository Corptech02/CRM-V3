// Simple connector to make sure viewLead calls showLeadProfile
(function() {
    'use strict';

    console.log('🔗 Connecting viewLead to showLeadProfile...');

    // Override viewLead to use showLeadProfile
    window.viewLead = function(leadId) {
        console.log('viewLead called with ID:', leadId);

        // Always use showLeadProfile if available
        if (window.showLeadProfile && typeof window.showLeadProfile === 'function') {
            window.showLeadProfile(leadId);
        } else {
            console.error('showLeadProfile not available!');
        }
    };

    console.log('✅ viewLead connected to showLeadProfile');
})();