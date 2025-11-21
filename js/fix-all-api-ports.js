/**
 * Fix All API Ports
 * Overrides fetch to redirect all incorrect ports to correct port 3001
 */

(function() {
    console.log('🔧 Fixing API port redirects...');

    // Store original fetch
    const originalFetch = window.fetch;

    // Override fetch to fix ports
    window.fetch = function(url, options) {
        let fixedUrl = url;

        // Convert URL object to string if needed
        if (url instanceof URL) {
            fixedUrl = url.toString();
        }

        // Only fix URLs that are strings
        if (typeof fixedUrl === 'string') {
            // Replace incorrect ports with correct port 3001
            // Port 8897 was used for quote-submissions
            if (fixedUrl.includes(':8897')) {
                console.log(`🔄 Redirecting port 8897 → 3001: ${fixedUrl}`);
                fixedUrl = fixedUrl.replace(':8897', ':3001');
            }

            // Port 8880 was used for CRM API
            if (fixedUrl.includes(':8880')) {
                console.log(`🔄 Redirecting port 8880 → 3001: ${fixedUrl}`);
                fixedUrl = fixedUrl.replace(':8880', ':3001');
            }

            // Port 8080 might be used for some services
            if (fixedUrl.includes(':8080') && fixedUrl.includes('/api/')) {
                console.log(`🔄 Redirecting port 8080 → 3001: ${fixedUrl}`);
                fixedUrl = fixedUrl.replace(':8080', ':3001');
            }

            // Port 5001 might be used for some services
            if (fixedUrl.includes(':5001') && fixedUrl.includes('/api/')) {
                console.log(`🔄 Redirecting port 5001 → 3001: ${fixedUrl}`);
                fixedUrl = fixedUrl.replace(':5001', ':3001');
            }

            // Port 5000 might be used for some services
            if (fixedUrl.includes(':5000') && fixedUrl.includes('/api/')) {
                console.log(`🔄 Redirecting port 5000 → 3001: ${fixedUrl}`);
                fixedUrl = fixedUrl.replace(':5000', ':3001');
            }
        }

        // Call original fetch with fixed URL
        return originalFetch.call(this, fixedUrl, options);
    };

    // Also override XMLHttpRequest for older code
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        let fixedUrl = url;

        if (typeof fixedUrl === 'string') {
            // Replace incorrect ports
            if (fixedUrl.includes(':8897')) {
                console.log(`🔄 XHR: Redirecting port 8897 → 3001: ${fixedUrl}`);
                fixedUrl = fixedUrl.replace(':8897', ':3001');
            }
            if (fixedUrl.includes(':8880')) {
                console.log(`🔄 XHR: Redirecting port 8880 → 3001: ${fixedUrl}`);
                fixedUrl = fixedUrl.replace(':8880', ':3001');
            }
        }

        return originalOpen.call(this, method, fixedUrl, async, user, password);
    };

    // Fix API configuration objects that might be cached
    if (window.API_CONFIG) {
        if (window.API_CONFIG.port === 8897 || window.API_CONFIG.port === 8880) {
            console.log('🔧 Fixing API_CONFIG port');
            window.API_CONFIG.port = 3001;
        }
        if (window.API_CONFIG.url && window.API_CONFIG.url.includes(':8897')) {
            window.API_CONFIG.url = window.API_CONFIG.url.replace(':8897', ':3001');
        }
        if (window.API_CONFIG.url && window.API_CONFIG.url.includes(':8880')) {
            window.API_CONFIG.url = window.API_CONFIG.url.replace(':8880', ':3001');
        }
    }

    // Fix any hardcoded API URLs in global scope
    if (window.apiUrl) {
        if (window.apiUrl.includes(':8897')) {
            window.apiUrl = window.apiUrl.replace(':8897', ':3001');
            console.log('🔧 Fixed window.apiUrl');
        }
        if (window.apiUrl.includes(':8880')) {
            window.apiUrl = window.apiUrl.replace(':8880', ':3001');
            console.log('🔧 Fixed window.apiUrl');
        }
    }

    // Fix CRM API if it exists
    if (window.CRM_API && window.CRM_API.baseURL) {
        if (window.CRM_API.baseURL.includes(':8880')) {
            window.CRM_API.baseURL = window.CRM_API.baseURL.replace(':8880', ':3001');
            console.log('🔧 Fixed CRM_API.baseURL');
        }
    }

    console.log('✅ API port redirect fix loaded - all API calls will use port 3001');
})();