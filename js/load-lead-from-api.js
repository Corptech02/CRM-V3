// Load Lead from API instead of localStorage
(function() {
    'use strict';

    console.log('Load Lead from API fix loading...');

    // Store the original showLeadProfile function
    const originalShowLeadProfile = window.showLeadProfile;

    // Override showLeadProfile to load from API
    window.showLeadProfile = async function(leadIdOrObject) {
        console.log('Loading lead profile from API for:', leadIdOrObject);

        // Handle both lead ID and lead object
        let leadId, leadData;
        if (typeof leadIdOrObject === 'object' && leadIdOrObject !== null) {
            leadId = leadIdOrObject.id;
            leadData = leadIdOrObject;
        } else {
            leadId = leadIdOrObject;
            leadData = null;
        }

        // Determine API URL
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8897'
            : `http://${window.location.hostname}:8897`;

        try {
            // First try to get from API
            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const apiData = await response.json();
                console.log('Lead data from API:', apiData);

                // Use the full server response — filter out empty/null/undefined values
                // so we never overwrite good localStorage data with blanks
                const cleanApiData = Object.fromEntries(
                    Object.entries(apiData).filter(([_, v]) => v !== undefined && v !== null && v !== '')
                );

                // Update localStorage with full server data
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
                const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

                if (leadIndex !== -1) {
                    // Server data wins for non-empty values; localStorage keeps the rest
                    leads[leadIndex] = { ...leads[leadIndex], ...cleanApiData };
                } else {
                    leads.push(cleanApiData);
                }

                // Save updated data to localStorage
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                localStorage.setItem('leads', JSON.stringify(leads));

                console.log('Updated localStorage with full API data');
            } else {
                console.log('API returned error, falling back to localStorage');
            }
        } catch (error) {
            console.error('Error loading from API:', error);
            console.log('Falling back to localStorage');
        }

        // Call original function with the full lead data from localStorage
        if (originalShowLeadProfile) {
            const updatedLeads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
            const updatedLead = updatedLeads.find(l => String(l.id) === String(leadId));
            if (updatedLead) {
                originalShowLeadProfile.call(this, updatedLead);
            } else {
                originalShowLeadProfile.call(this, leadId);
            }
        }
    };

    // Also override viewLead
    const originalViewLead = window.viewLead;

    window.viewLead = async function(leadId) {
        console.log('ViewLead called, loading from API first for:', leadId);

        // Determine API URL
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8897'
            : `http://${window.location.hostname}:8897`;

        try {
            // First try to get from API
            const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const apiData = await response.json();
                console.log('Lead data from API:', apiData);

                const cleanApiData = Object.fromEntries(
                    Object.entries(apiData).filter(([_, v]) => v !== undefined && v !== null && v !== '')
                );

                const leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
                const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

                if (leadIndex !== -1) {
                    leads[leadIndex] = { ...leads[leadIndex], ...cleanApiData };
                } else {
                    leads.push(cleanApiData);
                }

                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                localStorage.setItem('leads', JSON.stringify(leads));

                console.log('Updated localStorage with full API data');
            }
        } catch (error) {
            console.error('Error loading from API:', error);
        }

        // Call original function
        if (originalViewLead) {
            originalViewLead.call(this, leadId);
        } else if (window.showLeadProfile) {
            window.showLeadProfile(leadId);
        }
    };

    console.log('Load Lead from API fix loaded - lead profiles will now load from server first');
})();