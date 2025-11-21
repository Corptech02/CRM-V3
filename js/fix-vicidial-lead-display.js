// Fix ViciDial lead display after import - fetch from server
(function() {
    'use strict';

    console.log('🔧 Fixing ViciDial lead display after import...');

    // Store original loadLeadsView
    const originalLoadLeadsView = window.loadLeadsView;

    // Enhanced loadLeadsView that fetches from server first
    window.loadLeadsView = async function() {
        console.log('📥 Loading leads view with server sync...');

        // First, try to fetch from server to get latest data
        try {
            const apiUrl = window.VANGUARD_API_URL ||
                          (window.location.hostname === 'localhost'
                            ? 'http://localhost:3001'
                            : `http://${window.location.hostname}:3001`);

            const response = await fetch(`${apiUrl}/api/leads`);

            if (response.ok) {
                const serverLeads = await response.json();
                console.log(`✅ Fetched ${serverLeads.length} leads from server`);

                // Get current localStorage leads
                const localLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

                // Create a map for quick lookup
                const localLeadMap = {};
                localLeads.forEach(lead => {
                    localLeadMap[lead.id] = lead;
                });

                // Merge server leads with local leads (server takes precedence)
                serverLeads.forEach(serverLead => {
                    // Update or add the lead
                    localLeadMap[serverLead.id] = serverLead;
                });

                // Convert map back to array
                const mergedLeads = Object.values(localLeadMap);

                // Save merged leads back to localStorage
                localStorage.setItem('insurance_leads', JSON.stringify(mergedLeads));
                localStorage.setItem('leads', JSON.stringify(mergedLeads));

                console.log(`💾 Synced ${mergedLeads.length} leads to localStorage`);

                // Update the lead store if it exists
                if (window.leadStore) {
                    mergedLeads.forEach(lead => {
                        window.leadStore[lead.id] = lead;
                    });
                }
            }
        } catch (error) {
            console.log('📴 Could not fetch from server, using localStorage:', error);
        }

        // Now call the original function which will use the updated localStorage
        if (originalLoadLeadsView) {
            return originalLoadLeadsView.apply(this, arguments);
        }
    };

    // Also hook into the ViciDial sync completion
    const originalShowTranscriptionComplete = window.showTranscriptionComplete;
    window.showTranscriptionComplete = function(count) {
        console.log(`✅ ViciDial import complete, imported ${count} leads`);

        // Call original if it exists
        if (originalShowTranscriptionComplete) {
            originalShowTranscriptionComplete.apply(this, arguments);
        }

        // Force a server sync after import
        setTimeout(() => {
            console.log('🔄 Refreshing leads after ViciDial import...');
            window.loadLeadsView();
        }, 1000);
    };

    console.log('✅ ViciDial lead display fix loaded!');
})();