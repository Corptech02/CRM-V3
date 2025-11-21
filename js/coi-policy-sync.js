// COI Policy Sync - Keeps COI Management in sync with Policies tab
console.log('COI Policy Sync loading...');

// Listen for storage changes to detect when policies are updated
window.addEventListener('storage', function(e) {
    // Check if the change was to insurance_policies
    if (e.key === 'insurance_policies') {
        console.log('Policies changed in another tab, updating COI view...');

        // Check if we're currently on the COI Management tab
        if (window.location.hash === '#coi') {
            // Reload the policy list with the new data
            if (window.loadRealPolicyList) {
                window.loadRealPolicyList();
            }
        }
    }
});

// Also listen for custom events that indicate policies were updated
window.addEventListener('policiesUpdated', function() {
    console.log('Policies updated, refreshing COI policy list...');

    // Check if we're on the COI Management tab
    if (window.location.hash === '#coi') {
        if (window.loadRealPolicyList) {
            window.loadRealPolicyList();
        }
    }
});

// Override the original policy save/update/delete functions to trigger refresh
(function() {
    // Store original localStorage.setItem
    const originalSetItem = localStorage.setItem.bind(localStorage);

    // Override setItem to detect policy changes
    localStorage.setItem = function(key, value) {
        // Call original setItem
        originalSetItem(key, value);

        // If insurance_policies was updated, trigger refresh
        if (key === 'insurance_policies') {
            console.log('Policies updated via setItem');

            // Dispatch custom event
            window.dispatchEvent(new Event('policiesUpdated'));

            // If we're on COI tab, refresh immediately
            if (window.location.hash === '#coi') {
                setTimeout(() => {
                    if (window.loadRealPolicyList) {
                        window.loadRealPolicyList();
                    }
                }, 100);
            }
        }
    };
})();

// Auto-refresh when navigating to COI tab
window.addEventListener('hashchange', function() {
    if (window.location.hash === '#coi') {
        console.log('Navigated to COI Management, loading latest policies...');

        // Small delay to ensure DOM is ready
        setTimeout(() => {
            if (window.loadRealPolicyList) {
                window.loadRealPolicyList();
            }
        }, 100);
    }
});

// Initial load if already on COI tab
if (window.location.hash === '#coi') {
    setTimeout(() => {
        if (window.loadRealPolicyList) {
            window.loadRealPolicyList();
        }
    }, 500);
}

// Function to manually sync policies
window.syncCOIPolicies = function() {
    console.log('Manual sync triggered');
    if (window.loadRealPolicyList) {
        window.loadRealPolicyList();

        // Show notification
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000;';
        notification.innerHTML = '<i class="fas fa-check-circle"></i> Policies synced successfully';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }
};

console.log('COI Policy Sync ready - policies will stay in sync with Policies tab');