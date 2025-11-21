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

                // Map API fields to frontend fields
                const mappedData = {
                    id: leadId,
                    name: apiData.company_name || apiData.name,
                    company_name: apiData.company_name,
                    contact: apiData.contact_name || apiData.contact,
                    contact_name: apiData.contact_name,
                    phone: apiData.phone,
                    email: apiData.email,
                    dotNumber: apiData.dot_number || apiData.dotNumber,
                    dot_number: apiData.dot_number,
                    mcNumber: apiData.mc_number || apiData.mcNumber,
                    mc_number: apiData.mc_number,
                    yearsInBusiness: apiData.years_in_business || apiData.yearsInBusiness,
                    years_in_business: apiData.years_in_business,
                    fleetSize: apiData.fleet_size || apiData.fleetSize,
                    fleet_size: apiData.fleet_size,
                    address: apiData.address,
                    city: apiData.city,
                    state: apiData.state,
                    zip: apiData.zip_code || apiData.zip,
                    radiusOfOperation: apiData.radius_of_operation || apiData.radiusOfOperation,
                    radius_of_operation: apiData.radius_of_operation,
                    commodityHauled: apiData.commodity_hauled || apiData.commodityHauled,
                    commodity_hauled: apiData.commodity_hauled,
                    operatingStates: apiData.operating_states || apiData.operatingStates,
                    operating_states: apiData.operating_states,
                    stage: apiData.stage,
                    status: apiData.status,
                    premium: apiData.premium,
                    notes: apiData.notes
                };

                // Update localStorage with mapped data
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
                const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

                if (leadIndex !== -1) {
                    // Merge mapped data into existing lead, preserving any existing fields
                    leads[leadIndex] = { ...leads[leadIndex], ...mappedData };
                } else {
                    // Add new lead from API
                    leads.push(mappedData);
                }

                // Save updated data to localStorage
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                localStorage.setItem('leads', JSON.stringify(leads));

                console.log('Updated localStorage with API data');
            } else {
                console.log('API returned error, falling back to localStorage');
            }
        } catch (error) {
            console.error('Error loading from API:', error);
            console.log('Falling back to localStorage');
        }

        // Call original function with the full lead data from localStorage
        if (originalShowLeadProfile) {
            // Get the updated lead from localStorage
            const updatedLeads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
            const updatedLead = updatedLeads.find(l => String(l.id) === String(leadId));
            if (updatedLead) {
                originalShowLeadProfile.call(this, updatedLead);
            } else {
                // Fallback to just ID if not found
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

                // Map API fields to frontend fields
                const mappedData = {
                    id: leadId,
                    name: apiData.company_name || apiData.name,
                    company_name: apiData.company_name,
                    contact: apiData.contact_name || apiData.contact,
                    contact_name: apiData.contact_name,
                    phone: apiData.phone,
                    email: apiData.email,
                    dotNumber: apiData.dot_number || apiData.dotNumber,
                    dot_number: apiData.dot_number,
                    mcNumber: apiData.mc_number || apiData.mcNumber,
                    mc_number: apiData.mc_number,
                    yearsInBusiness: apiData.years_in_business || apiData.yearsInBusiness,
                    years_in_business: apiData.years_in_business,
                    fleetSize: apiData.fleet_size || apiData.fleetSize,
                    fleet_size: apiData.fleet_size,
                    address: apiData.address,
                    city: apiData.city,
                    state: apiData.state,
                    zip: apiData.zip_code || apiData.zip,
                    radiusOfOperation: apiData.radius_of_operation || apiData.radiusOfOperation,
                    radius_of_operation: apiData.radius_of_operation,
                    commodityHauled: apiData.commodity_hauled || apiData.commodityHauled,
                    commodity_hauled: apiData.commodity_hauled,
                    operatingStates: apiData.operating_states || apiData.operatingStates,
                    operating_states: apiData.operating_states,
                    stage: apiData.stage,
                    status: apiData.status,
                    premium: apiData.premium,
                    notes: apiData.notes
                };

                // Update localStorage with mapped data
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
                const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

                if (leadIndex !== -1) {
                    // Merge mapped data into existing lead, preserving any existing fields
                    leads[leadIndex] = { ...leads[leadIndex], ...mappedData };
                } else {
                    // Add new lead from API
                    leads.push(mappedData);
                }

                // Save updated data to localStorage
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                localStorage.setItem('leads', JSON.stringify(leads));

                console.log('Updated localStorage with API data');
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