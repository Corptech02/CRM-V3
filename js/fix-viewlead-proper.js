// Fix viewLead to Use createEnhancedProfile Properly
(function() {
    'use strict';

    console.log('🔧 Fixing viewLead to use proper profile creation...');

    // Store references to avoid conflicts
    const originals = {
        viewLead: window.viewLead,
        showLeadProfile: window.showLeadProfile,
        createEnhancedProfile: window.createEnhancedProfile
    };

    // Main viewLead function that matches the working version
    window.viewLead = function(leadId) {
        console.log('👁️ viewLead called with ID:', leadId);

        // Extract ID if leadId is an object
        if (typeof leadId === 'object' && leadId && leadId.id) {
            leadId = leadId.id;
        }

        // Ensure leadId is a string
        leadId = String(leadId);

        // Show loading overlay if available
        if (window.showLeadLoadingOverlay) {
            window.showLeadLoadingOverlay('Loading Lead Profile...');
        }

        // Get lead data
        let lead = null;
        const sources = ['insurance_leads', 'leads', 'clients'];

        for (const source of sources) {
            const data = JSON.parse(localStorage.getItem(source) || '[]');
            lead = data.find(item => String(item.id) === leadId);
            if (lead) {
                console.log(`Found lead in ${source}:`, lead.name || lead.id);
                break;
            }
        }

        if (!lead) {
            console.log('Lead not found in localStorage, fetching from API...');
            // Fetch from API
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001'
                : `http://${window.location.hostname}:3001`;

            fetch(`${apiUrl}/api/leads/${leadId}`)
                .then(response => response.json())
                .then(leadData => {
                    console.log('Lead fetched from API:', leadData.name || leadData.id);

                    // Update localStorage
                    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                    const index = leads.findIndex(l => String(l.id) === leadId);
                    if (index >= 0) {
                        leads[index] = leadData;
                    } else {
                        leads.push(leadData);
                    }
                    localStorage.setItem('insurance_leads', JSON.stringify(leads));

                    // Open profile with fetched data
                    openProfile(leadData);
                })
                .catch(error => {
                    console.error('Failed to fetch lead:', error);
                    if (window.hideLeadLoadingOverlay) {
                        window.hideLeadLoadingOverlay();
                    }
                    alert('Unable to load lead profile. Please try again.');
                });
        } else {
            // Open profile with existing data
            openProfile(lead);
        }

        function openProfile(leadData) {
            console.log('Opening profile for:', leadData.name || leadData.id);

            // Use createEnhancedProfile from final-profile-fix.js
            if (window.createEnhancedProfile && typeof window.createEnhancedProfile === 'function') {
                console.log('✅ Using createEnhancedProfile');
                window.createEnhancedProfile(leadData);

                // Hide loading overlay after profile is created
                setTimeout(() => {
                    if (window.hideLeadLoadingOverlay) {
                        window.hideLeadLoadingOverlay();
                    }
                }, 500);
            } else {
                console.error('❌ createEnhancedProfile not found!');
                // Fallback: hide loading and show error
                if (window.hideLeadLoadingOverlay) {
                    window.hideLeadLoadingOverlay();
                }
                alert('Profile system not loaded properly. Please refresh the page.');
            }

            // Trigger quote loading if available
            if (window.loadQuotesForLead) {
                window.loadQuotesForLead(leadData);
            }
        }

        return false; // Prevent default action
    };

    // Make showLeadProfile an alias to viewLead
    window.showLeadProfile = window.viewLead;

    // Log the fix status
    console.log('✅ viewLead fixed to use createEnhancedProfile');
    console.log('Functions available:', {
        viewLead: !!window.viewLead,
        showLeadProfile: !!window.showLeadProfile,
        createEnhancedProfile: !!window.createEnhancedProfile
    });

})();