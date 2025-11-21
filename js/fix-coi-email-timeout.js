// Fix COI Email Timeout - Increase fetch timeout for COI email operations
console.log('⏰ COI Email Timeout Fix loaded - Extending timeouts for COI operations');

// Override fetch for COI email operations to increase timeout
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    // Check if this is a COI email request
    if (typeof url === 'string' && (
        url.includes('/api/coi/send-with-pdf') ||
        url.includes('/api/coi/generate-pdf') ||
        url.includes('/api/coi/crm-real-prepare')
    )) {
        console.log('⏰ Applying extended timeout for COI request:', url);

        // Create abort signal with 3 minute timeout for COI operations
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('❌ COI request timed out after 3 minutes');
            controller.abort();
        }, 180000); // 3 minutes

        // Add abort signal to options
        options = {
            ...options,
            signal: controller.signal
        };

        // Call original fetch and clear timeout on completion
        return originalFetch(url, options).finally(() => {
            clearTimeout(timeoutId);
        });
    }

    // For non-COI requests, check for double /api prefix and fix
    const correctedUrl = url.replace('/api/api/', '/api/');
    return originalFetch(correctedUrl, options);
};

console.log('✅ COI Email timeout extended to 3 minutes for all COI operations');