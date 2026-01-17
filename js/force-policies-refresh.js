/**
 * Force Policies Refresh - Clean localStorage and reload from server
 * This fixes issues where leads were incorrectly mixed with policies
 */

(function() {
    console.log('🔄 Forcing policies refresh from server...');

    // Function to force refresh policies from server
    async function forceRefreshPolicies() {
        try {
            // Clear localStorage policies to force fresh data
            localStorage.removeItem('insurance_policies');
            console.log('🗑️ Cleared stale localStorage policies data');

            // Get API URL based on protocol
            const apiUrl = window.location.protocol === 'https:'
                ? `https://${window.location.hostname}/api`
                : `http://${window.location.hostname}:3001/api`;

            // Fetch fresh policies from server
            console.log('📡 Fetching fresh policies from:', apiUrl + '/policies');
            const response = await fetch(apiUrl + '/policies');

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }

            const serverPolicies = await response.json();
            console.log(`✅ Fetched ${serverPolicies.length} policies from server`);

            // Filter out any non-policy data (leads that got mixed in)
            const cleanPolicies = serverPolicies.filter(item => {
                // A policy should have these characteristics vs a lead
                const isPolicy = (
                    item.policyNumber ||
                    item.policy_number ||
                    (item.id && item.id.startsWith('POL-')) ||
                    (item.id && item.id.startsWith('policy_')) ||
                    item.carrier ||
                    item.premium ||
                    item.effective_date ||
                    item.expiration_date
                ) && !item.stage && !item.status; // leads have stage/status, policies don't

                if (!isPolicy) {
                    console.warn('🚫 Filtering out non-policy item:', item.id || 'unknown', item.insured_name || item.name);
                }

                return isPolicy;
            });

            console.log(`🧹 Cleaned data: ${cleanPolicies.length} valid policies, filtered out ${serverPolicies.length - cleanPolicies.length} non-policy items`);

            // Save clean policies to localStorage
            localStorage.setItem('insurance_policies', JSON.stringify(cleanPolicies));
            console.log('💾 Saved clean policies to localStorage');

            // Trigger policy view refresh if we're on the policies page
            if (window.location.hash === '#policies' && window.loadPoliciesView) {
                console.log('🔄 Refreshing policies view...');
                setTimeout(() => window.loadPoliciesView(), 100);
            }

            return cleanPolicies;
        } catch (error) {
            console.error('❌ Failed to refresh policies:', error);
            // Don't throw - let the app continue with whatever data it has
            return [];
        }
    }

    // Run the refresh immediately
    forceRefreshPolicies();

    // Also expose it globally for manual use
    window.forceRefreshPolicies = forceRefreshPolicies;

    console.log('✅ Force policies refresh script loaded');
})();