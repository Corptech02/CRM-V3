// Keep lead profile open - prevent auto-closing
(function() {
    'use strict';

    console.log('🔒 KEEP-PROFILE-OPEN: Preventing auto-close...');

    // Track if profile is open
    let profileOpen = false;

    // Override closeLeadProfile to require user action
    window.closeLeadProfile = function() {
        console.log('✅ Closing lead profile on user request');

        // Remove the profile container
        const container = document.getElementById('lead-profile-container');
        if (container) {
            container.remove();
            profileOpen = false;
        }

        // Also try removing any modal overlays
        const overlays = document.querySelectorAll('.modal-overlay');
        overlays.forEach(overlay => {
            if (overlay.querySelector('.lead-profile-modal')) {
                overlay.remove();
            }
        });
    };

    // Make sure showLeadProfile works
    const originalShowLeadProfile = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        console.log(`📂 Opening lead profile for ID: ${leadId}`);

        // Remove any existing profile first
        if (profileOpen) {
            const existingContainer = document.getElementById('lead-profile-container');
            if (existingContainer) {
                existingContainer.remove();
            }
        }

        profileOpen = true;

        // Call original function
        if (originalShowLeadProfile) {
            return originalShowLeadProfile.call(this, leadId);
        }
    };

    // Prevent clicks from propagating and closing the modal
    document.addEventListener('click', function(e) {
        // If clicking on profile modal content, stop propagation
        if (e.target.closest('.lead-profile-modal')) {
            // Allow close button and overlay clicks
            if (e.target.classList.contains('close-btn') ||
                e.target.classList.contains('modal-overlay')) {
                return;
            }
            e.stopPropagation();
        }
    }, true);

    // Prevent double-clicking from closing
    document.addEventListener('dblclick', function(e) {
        if (e.target.closest('.lead-profile-modal')) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);

    // Monitor for profile removal
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.removedNodes.forEach(function(node) {
                if (node.id === 'lead-profile-container') {
                    console.log('⚠️ Lead profile was removed from DOM');
                    profileOpen = false;
                }
            });
        });
    });

    observer.observe(document.body, { childList: true });

    console.log('✅ KEEP-PROFILE-OPEN: Initialized');
})();