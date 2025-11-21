// Global API URL Configuration
// This file sets the correct API URLs based on where the app is accessed from

(function() {
    'use strict';

    // Determine the API URLs based on current hostname
    const hostname = window.location.hostname;

    // Define API endpoints
    let API_BASE, OLD_API_BASE;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Local development
        API_BASE = 'http://localhost:8897/api';
        OLD_API_BASE = 'http://localhost:5001/api';
    } else {
        // Production server - use the actual hostname
        API_BASE = `http://${hostname}:8897/api`;
        OLD_API_BASE = `http://${hostname}:5001/api`;
    }

    // Make URLs globally available
    window.API_URLS = {
        BASE: API_BASE,
        OLD_BASE: OLD_API_BASE,

        // Specific endpoints
        LEADS: `${API_BASE}/leads`,
        QUOTE_SUBMISSIONS: `${API_BASE}/quote-submissions`,
        POLICIES: `${API_BASE}/policies`,

        // Helper function to get lead URL
        getLeadUrl: function(leadId) {
            return `${API_BASE}/leads/${leadId}`;
        },

        // Helper function to get quote submission URL
        getQuoteUrl: function(leadId) {
            return `${API_BASE}/quote-submissions/${leadId}`;
        }
    };

    console.log('API URLs configured:', {
        hostname: hostname,
        API_BASE: API_BASE
    });

})();