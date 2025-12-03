// Fix COI Email Timeout - VERSION 999 WITH PROPER FORMDATA HANDLING
console.log('🚀🚀🚀 COI EMAIL TIMEOUT FIX VERSION 999 LOADED 🚀🚀🚀');
console.log('⏰ COI Email Timeout Fix loaded - Extending timeouts for COI operations');

// Override fetch for COI email operations to increase timeout
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    // Check if this is a COI email request
    if (typeof url === 'string' && (
        url.includes('/api/coi/send-with-pdf') ||
        url.includes('/api/coi/generate-pdf') ||
        url.includes('/api/coi/crm-real-prepare') ||
        url.includes('/api/coi/send-request')
    )) {
        console.log('⏰ Applying extended timeout for COI request:', url);

        // Create abort signal with 3 minute timeout for COI operations
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('❌ COI request timed out after 3 minutes');
            controller.abort();
        }, 180000); // 3 minutes

        // Carefully add abort signal to options without breaking FormData
        const newOptions = { ...options };

        // Only add abort signal if there isn't one already
        if (!newOptions.signal) {
            newOptions.signal = controller.signal;
        } else {
            console.log('⚠️ Request already has signal, skipping timeout for:', url);
            clearTimeout(timeoutId);
            return originalFetch(url, options);
        }

        // Call original fetch and clear timeout on completion
        try {
            console.log('🔍 DEBUG: Making COI request with options:', {
                method: newOptions.method,
                hasBody: !!newOptions.body,
                bodyType: newOptions.body?.constructor?.name,
                hasSignal: !!newOptions.signal
            });

            return originalFetch(url, newOptions).catch((error) => {
                console.error('🚨 FETCH ERROR:', error);
                console.log('🔍 Request details:', { url, options: newOptions });
                throw error;
            }).finally(() => {
                clearTimeout(timeoutId);
            });
        } catch (error) {
            console.error('🚨 FETCH SETUP ERROR:', error);
            clearTimeout(timeoutId);
            throw error;
        }
    }

    // For non-COI requests, check for double /api prefix and fix
    const correctedUrl = url.replace('/api/api/', '/api/');
    return originalFetch(correctedUrl, options);
};

console.log('✅ COI Email timeout extended to 3 minutes for all COI operations');