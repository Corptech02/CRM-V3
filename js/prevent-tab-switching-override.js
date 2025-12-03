// Prevent Tab Switching Override - Stop scripts from forcing leads view
(function() {
    'use strict';

    console.log('🚫 Preventing forced tab switching back to leads...');

    let isUserSwitchingTabs = false;
    let targetHash = null;

    // Monitor hash changes to detect when user is switching tabs
    window.addEventListener('hashchange', function(e) {
        const newHash = window.location.hash;
        const oldHash = e.oldURL ? e.oldURL.split('#')[1] : '';

        // User is switching AWAY from leads to another tab
        if (oldHash === 'leads' && newHash !== '#leads' && newHash !== '') {
            console.log(`🚫 User switching from leads to ${newHash} - blocking forced returns`);
            isUserSwitchingTabs = true;
            targetHash = newHash;

            // Clear the flag after 2 seconds to allow normal operation
            setTimeout(() => {
                isUserSwitchingTabs = false;
                targetHash = null;
            }, 2000);
        }
    });

    // Override loadLeadsView to prevent forced calls during tab switching
    if (window.loadLeadsView) {
        const originalLoadLeadsView = window.loadLeadsView;

        window.loadLeadsView = function() {
            // If user is actively switching away from leads, block the call
            if (isUserSwitchingTabs) {
                console.log('🚫 Blocked loadLeadsView call during tab switching');
                return;
            }

            // Only allow if we're actually on the leads tab
            if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
                return originalLoadLeadsView.apply(this, arguments);
            } else {
                console.log('🚫 Blocked loadLeadsView call - not on leads tab');
                return;
            }
        };
    }

    // Also override any hash setting that tries to force back to leads
    let isOverridingHash = false;
    const originalLocationReplace = window.location.replace;
    const originalHistoryReplaceState = window.history.replaceState;
    const originalHistoryPushState = window.history.pushState;

    window.location.replace = function(url) {
        if (isUserSwitchingTabs && url.includes('#leads')) {
            console.log('🚫 Blocked location.replace to leads during tab switching');
            return;
        }
        return originalLocationReplace.call(this, url);
    };

    window.history.replaceState = function(state, title, url) {
        if (isUserSwitchingTabs && url && url.includes('#leads')) {
            console.log('🚫 Blocked history.replaceState to leads during tab switching');
            return;
        }
        return originalHistoryReplaceState.call(this, state, title, url);
    };

    window.history.pushState = function(state, title, url) {
        if (isUserSwitchingTabs && url && url.includes('#leads')) {
            console.log('🚫 Blocked history.pushState to leads during tab switching');
            return;
        }
        return originalHistoryPushState.call(this, state, title, url);
    };

    console.log('✅ Tab switching override protection activated');
})();