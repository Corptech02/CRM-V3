// Fix Profile Display Issues
(function() {
    'use strict';

    console.log('🔧 Fixing profile display issues...');

    // Store original createEnhancedProfile
    const originalCreate = window.createEnhancedProfile;

    // Override createEnhancedProfile to ensure visibility
    window.createEnhancedProfile = function(lead) {
        console.log('📊 Creating enhanced profile with display fix for:', lead.name || lead.id);

        // Remove any existing profiles first
        const existingProfiles = document.querySelectorAll('#lead-profile-container, .modal-overlay, #lead-profile-modal');
        existingProfiles.forEach(el => {
            console.log('Removing existing profile element:', el.id || el.className);
            el.remove();
        });

        // Call original if it exists
        if (originalCreate && typeof originalCreate === 'function') {
            originalCreate(lead);
        } else {
            // If original doesn't exist, log error and DON'T create fallback
            console.error('❌ Original createEnhancedProfile not found from final-profile-fix.js');
            console.log('Make sure final-profile-fix.js is loaded before fix-profile-display.js');
        }

        // Ensure the profile is visible with a slight delay
        setTimeout(() => {
            const profileContainer = document.getElementById('lead-profile-container');
            if (profileContainer) {
                console.log('✅ Profile container found, ensuring visibility');

                // Force visibility
                profileContainer.style.display = 'flex';
                profileContainer.style.visibility = 'visible';
                profileContainer.style.opacity = '1';
                profileContainer.style.zIndex = '999999';

                // Ensure it's on top of everything
                const allElements = document.querySelectorAll('*');
                let maxZ = 0;
                allElements.forEach(el => {
                    const z = parseInt(window.getComputedStyle(el).zIndex);
                    if (!isNaN(z) && z > maxZ) maxZ = z;
                });

                if (maxZ >= 999999) {
                    profileContainer.style.zIndex = (maxZ + 1).toString();
                }

                // Hide any loading overlays
                const loadingOverlays = document.querySelectorAll('#lead-loading-overlay, .loading-overlay');
                loadingOverlays.forEach(overlay => {
                    console.log('Hiding loading overlay');
                    overlay.style.display = 'none';
                });

                // Make sure body isn't preventing scroll
                document.body.style.overflow = 'auto';

                console.log('✅ Profile display fixed');
            } else {
                console.log('⚠️ Profile container not found after 100ms wait');
                // DON'T create fallback - the enhanced profile should handle this
            }
        }, 100);
    };

    // Removed fallback profile creation - we only use the enhanced profile from final-profile-fix.js

    // Also monitor for profiles being hidden
    setInterval(() => {
        const profile = document.getElementById('lead-profile-container');
        if (profile && (profile.style.display === 'none' || profile.style.visibility === 'hidden')) {
            console.log('🔧 Profile was hidden, making it visible again');
            profile.style.display = 'block';
            profile.style.visibility = 'visible';
            profile.style.opacity = '1';
        }
    }, 500);

    console.log('✅ Profile display fix ready');
})();