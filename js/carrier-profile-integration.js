// Carrier Profile Integration
// This file integrates the carrier profile modal with the main application

// Function to view lead/carrier details
window.viewLeadDetails = function(dotNumber) {
    console.log('Viewing carrier profile for USDOT:', dotNumber);

    // Check if modal is loaded
    if (window.carrierProfileModal) {
        window.carrierProfileModal.show(dotNumber);
    } else {
        console.error('Carrier profile modal not loaded');
        // Try to load it
        const script = document.createElement('script');
        script.src = 'js/carrier-profile-modal.js?v=' + Date.now();
        script.onload = function() {
            if (window.carrierProfileModal) {
                window.carrierProfileModal.show(dotNumber);
            }
        };
        document.head.appendChild(script);
    }
};

// Alias for compatibility
window.viewCarrierProfile = window.viewLeadDetails;

// Function to view carrier from search results
window.viewCarrier = function(dotNumber) {
    window.viewLeadDetails(dotNumber);
};

// Function to create a lead from carrier data
window.createLeadFromCarrierData = async function(dotNumber) {
    try {
        // Get API base URL - use the same logic as api-service.js
        let apiBase = 'https://api.vigagency.com';

        // Check if we have a custom API URL in localStorage
        const customAPI = localStorage.getItem('VANGUARD_API_URL');
        if (customAPI) {
            apiBase = customAPI;
        } else if (window.location.hostname === 'vanguard.vigagency.com') {
            apiBase = 'https://api.vigagency.com';
        } else if (window.location.hostname === 'localhost') {
            apiBase = 'http://localhost:8897';
        } else if (window.location.hostname.includes('github.io')) {
            apiBase = 'https://api.vigagency.com';
        } else if (window.location.protocol === 'https:') {
            apiBase = 'https://api.vigagency.com';
        } else {
            apiBase = 'http://162.220.14.239:8897';
        }

        // Fetch carrier data
        const response = await fetch(`${apiBase}/api/carrier/profile/${dotNumber}`, {
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch carrier data');
        }

        const carrier = await response.json();

        // Create lead data
        const leadData = {
            dot_number: carrier.dot_number,
            mc_number: carrier.mc_number || '',
            company_name: carrier.legal_name,
            contact_name: '', // Will need to be filled manually
            phone: carrier.phone || '',
            email: carrier.email_address || '',
            address: carrier.street || '',
            city: carrier.city || '',
            state: carrier.state || '',
            zip_code: carrier.zip_code || '',
            current_insurance: carrier.insurance_carrier || '',
            coverage_amount: carrier.bipd_insurance_on_file_amount || 0,
            notes: `Power Units: ${carrier.power_units || 0}, Drivers: ${carrier.drivers || 0}`,
            status: 'new',
            priority: 'normal',
            source: 'carrier_lookup'
        };

        // Create the lead
        if (window.apiService && window.apiService.createLead) {
            const result = await window.apiService.createLead(leadData);

            // Close the modal
            if (window.carrierProfileModal) {
                window.carrierProfileModal.hide();
            }

            // Show success message
            alert(`Lead created successfully! Lead ID: ${result.lead_id}`);

            // Refresh the leads list if on leads page
            if (window.location.pathname.includes('leads') && window.loadLeads) {
                window.loadLeads();
            }
        } else {
            console.error('Lead creation service not available');
            alert('Lead creation service not available. Please try again later.');
        }

    } catch (error) {
        console.error('Error creating lead:', error);
        alert('Failed to create lead. Please try again.');
    }
};

// Override the createLeadFromCarrier function in the modal
window.createLeadFromCarrier = window.createLeadFromCarrierData;

console.log('Carrier profile integration loaded');