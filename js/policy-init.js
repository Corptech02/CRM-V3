// Policy Initialization - Ensures policies are loaded from server on page load
console.log('Policy Init: Starting...');

(async function() {
    // This runs immediately when script loads, before DOM is ready

    const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io';

    console.log('Policy Init: Fetching from', API_URL);

    try {
        // Fetch policies from server immediately
        const response = await fetch(`${API_URL}/api/policies`);
        if (response.ok) {
            const serverPolicies = await response.json();

            // ALWAYS update localStorage from server - server is source of truth
            localStorage.setItem('insurance_policies', JSON.stringify(serverPolicies));
            console.log(`Policy Init: Loaded ${serverPolicies.length} policies from server`);

            // Set a flag to indicate policies are loaded
            window.policiesLoadedFromServer = true;
        } else {
            console.error('Policy Init: Failed to fetch from server, status:', response.status);
        }
    } catch (error) {
        console.error('Policy Init: Error fetching policies:', error);
    }
})();

// Also ensure policies are refreshed when the page becomes visible
document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
        console.log('Policy Init: Page visible, refreshing policies...');

        const API_URL = window.location.hostname.includes('nip.io')
            ? `http://${window.location.hostname.split('.')[0]}:3001/api`
            : window.location.hostname === 'localhost'
            ? 'http://localhost:3001/api'
            : 'http://162.220.14.239:3001/api';

        try {
            const response = await fetch(`${API_URL}/api/policies`);
            if (response.ok) {
                const data = await response.json();
                const serverPolicies = data.policies || [];
                localStorage.setItem('insurance_policies', JSON.stringify(serverPolicies));
                console.log(`Policy Init: Refreshed ${serverPolicies.length} policies`);

                // If we're on the policies page, refresh the display
                if (window.location.hash === '#policies' && window.loadPoliciesView) {
                    window.loadPoliciesView();
                }
            }
        } catch (error) {
            console.error('Policy Init: Error refreshing:', error);
        }
    }
});

console.log('Policy Init: Setup complete');