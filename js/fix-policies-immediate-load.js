// Immediate fix for policies not loading on renewals/policies page
console.log('🔧 POLICY IMMEDIATE LOAD FIX ACTIVE');

// Force load policies from server when navigating to policies/renewals page
function forceLoadPoliciesFromServer() {
    console.log('🔄 Force loading policies from server...');

    const API_BASE = window.location.hostname === 'localhost'
        ? 'http://localhost:3001/api'
        : window.location.hostname.includes('162-220-14-239')
        ? 'https://162-220-14-239.nip.io/api'
        : 'https://162-220-14-239.nip.io/api';

    fetch(`${API_BASE}/policies`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(serverPolicies => {
            console.log(`✅ FORCE LOAD: Got ${serverPolicies.length} policies from server`);

            // Save to localStorage
            localStorage.setItem('insurance_policies', JSON.stringify(serverPolicies));
            console.log('💾 FORCE LOAD: Saved policies to localStorage');

            // Force refresh the policies view
            if (window.loadPoliciesView && typeof window.loadPoliciesView === 'function') {
                console.log('🔄 FORCE LOAD: Refreshing policies view...');
                setTimeout(() => {
                    window.loadPoliciesView();
                }, 100);
            } else {
                console.log('⚠️ FORCE LOAD: loadPoliciesView not available, trying direct refresh...');
                // Try to manually trigger a policies page refresh
                if (window.location.hash === '#renewals' || window.location.hash === '#policies') {
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
            }
        })
        .catch(error => {
            console.error('❌ FORCE LOAD: Error loading policies:', error);
        });
}

// Intercept hash changes to force load when navigating to policies
function interceptPoliciesNavigation() {
    const originalHashChange = window.onhashchange;

    window.onhashchange = function(e) {
        if (originalHashChange) {
            originalHashChange.call(this, e);
        }

        if (window.location.hash === '#renewals' || window.location.hash === '#policies') {
            console.log('🎯 POLICY NAVIGATION DETECTED: Loading policies...');
            setTimeout(forceLoadPoliciesFromServer, 200);
        }
    };
}

// Also intercept when page first loads on policies
if (window.location.hash === '#renewals' || window.location.hash === '#policies') {
    console.log('🎯 PAGE LOADED ON POLICIES: Force loading...');
    setTimeout(forceLoadPoliciesFromServer, 500);
}

// Set up navigation interception
interceptPoliciesNavigation();

// Also hook into the savePolicy function to refresh after saves
const originalSavePolicy = window.savePolicy;
if (originalSavePolicy) {
    window.savePolicy = function(...args) {
        console.log('🔧 POLICY SAVE INTERCEPTED: Will refresh after save');
        const result = originalSavePolicy.apply(this, args);

        // Force refresh after save
        setTimeout(() => {
            if (window.location.hash === '#renewals' || window.location.hash === '#policies') {
                console.log('🔄 POST-SAVE: Force refreshing policies view...');
                forceLoadPoliciesFromServer();
            }
        }, 1000);

        return result;
    };
}

console.log('✅ Policy immediate load fix installed');