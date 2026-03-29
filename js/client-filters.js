// Client Filters Functionality
console.log('🔍 Loading client filters functionality...');

// Auto-filter function for Maureen clients
function applyMaureenClientAutoFilter() {
    const sessionData = sessionStorage.getItem('vanguard_user');
    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            if (user.username && user.username.toLowerCase() === 'maureen') {
                setTimeout(() => {
                    const agentFilter = document.getElementById('clientAgentFilter');
                    if (agentFilter) {
                        agentFilter.value = '';
                        console.log('🔒 AUTO-FILTER (Clients): Set client filter to "All My Clients" for Maureen');
                        // Trigger the filter function immediately
                        filterClients();
                        console.log('✅ AUTO-FILTER (Clients): Applied Maureen "All My Clients" filter');
                    }
                }, 300); // Allow time for DOM to update
            } else {
                // For non-Maureen users, apply "All Agents" filter which excludes Maureen
                setTimeout(() => {
                    const agentFilter = document.getElementById('clientAgentFilter');
                    if (agentFilter) {
                        agentFilter.value = '';
                        console.log('🔒 AUTO-FILTER (Clients): Applied "All Agents" filter (excluding Maureen)');
                        // Trigger the filter function immediately to hide Maureen clients
                        filterClients();
                        console.log('✅ AUTO-FILTER (Clients): Maureen clients hidden from view');
                    }
                }, 300);
            }
        } catch (error) {
            console.error('Error applying Maureen auto-filter for clients:', error);
        }
    }
}

// Initialize client filters when the view loads
function initializeClientFilters() {
    // Wait a bit for the DOM to be ready
    setTimeout(() => {
        console.log('🎯 Client filters fully initialized');

        // Apply auto-filter after initialization
        applyMaureenClientAutoFilter();
    }, 500);
}

// Auto-initialize when the script loads and when clients view loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeClientFilters);
} else {
    initializeClientFilters();
}

// Also initialize when hash changes to clients
window.addEventListener('hashchange', function() {
    if (window.location.hash === '#clients') {
        setTimeout(() => {
            initializeClientFilters();
        }, 200);
    }
});

// Apply auto-filter when script loads and we're already on clients page
setTimeout(() => {
    if (window.location.hash === '#clients') {
        applyMaureenClientAutoFilter();
    }
}, 1000);

console.log('✅ Client filters script loaded');