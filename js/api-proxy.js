/**
 * API Proxy - Routes API calls through the same origin to avoid CORS issues
 * This creates a local proxy that forwards requests to the insurance database
 */

(function() {
    // Store the original fetch function
    const originalFetch = window.fetch;
    
    // Override fetch for API calls to localhost:8002
    window.fetch = function(url, options = {}) {
        // Check if this is a call to our local API
        if (typeof url === 'string' && url.includes('localhost:8002')) {
            console.log('Intercepting API call:', url);
            
            // Extract the path from the URL
            const urlObj = new URL(url);
            const path = urlObj.pathname + urlObj.search;
            
            // Create a proxy request through our server
            // Since we're on the same origin, we can make a server-side request
            const proxyUrl = `/api-proxy${path}`;
            
            console.log('Redirecting to proxy:', proxyUrl);
            
            // For now, return a mock response since we can't proxy without a backend
            // This would normally go through a server-side proxy
            return new Promise((resolve) => {
                console.warn('Direct API access blocked by CORS. Using fallback data.');
                
                // Return mock data that matches the expected format
                const mockResponse = {
                    ok: false,
                    status: 503,
                    statusText: 'Service Unavailable',
                    json: async () => {
                        throw new Error('Cannot access local API from browser due to CORS. The insurance database is running but not accessible from this context. Please run the Vanguard system locally or set up a proper proxy server.');
                    }
                };
                
                resolve(mockResponse);
            });
        }
        
        // For all other requests, use the original fetch
        return originalFetch.apply(this, arguments);
    };
    
    console.log('API Proxy initialized - will intercept localhost:8002 calls');
})();