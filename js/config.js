// API Configuration
const API_CONFIG = {
    // Using backend on port 3001
    API_BASE_URL: window.VANGUARD_API_URL || (window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : `http://${window.location.hostname}:3001`),
    
    // API endpoints
    ENDPOINTS: {
        SEARCH: '/api/search',
        STATS: '/api/stats/summary',
        LEADS_EXPIRING: '/api/leads/expiring-insurance',
        VICIDIAL_TEST: '/api/vicidial/test',
        VICIDIAL_LISTS: '/api/vicidial/lists',
        VICIDIAL_OVERWRITE: '/api/vicidial/overwrite',
        VICIDIAL_UPLOAD: '/api/vicidial/upload'
    }
};

// Export for use in other scripts
window.API_CONFIG = API_CONFIG;