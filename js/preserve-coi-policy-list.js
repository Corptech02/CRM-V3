// Prevent Multiple Policy List Loads
console.log('🛡️ Preventing duplicate policy list loads...');

(function() {
    let policyListLoaded = false;
    let loadInProgress = false;

    // Wrap the loadRealPolicyList function to prevent rapid consecutive calls
    const originalLoadRealPolicyList = window.loadRealPolicyList;

    // Override with debounced version
    window.loadRealPolicyList = function() {
        if (loadInProgress) {
            console.log('Policy load already in progress, skipping...');
            return;
        }

        loadInProgress = true;
        console.log('Loading policy list...');

        // Call the original function
        if (originalLoadRealPolicyList) {
            originalLoadRealPolicyList();
        }

        policyListLoaded = true;

        // Reset flag after a short delay
        setTimeout(() => {
            loadInProgress = false;
        }, 1000);
    };

    // When COI tab loads, only load once
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#coi' && !policyListLoaded) {
            console.log('✅ COI tab opened - loading policies once');

            setTimeout(() => {
                if (window.loadRealPolicyList) {
                    window.loadRealPolicyList();
                }
            }, 200);
        }
    });

    console.log('✅ Policy list load protection active');
})();