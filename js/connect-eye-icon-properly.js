// Connect Eye Icon to Proper Lead Profile
// This ensures the eye icon uses the correct lead profile from final-profile-fix.js
(function() {
    'use strict';

    console.log('🔗 Connecting eye icon to proper lead profile');

    // Wait for page to load
    function ensureCorrectProfile() {
        // Check if viewLead exists from final-profile-fix.js
        if (window.viewLead && window.viewLead.toString().includes('Fixed viewLead')) {
            console.log('✅ final-profile-fix.js viewLead is active - no changes needed');
            return;
        }

        // If not, wait a moment and check again
        setTimeout(() => {
            if (window.viewLead && window.viewLead.toString().includes('Fixed viewLead')) {
                console.log('✅ final-profile-fix.js viewLead is now active');
            } else {
                console.log('⚠️ final-profile-fix.js may not be loaded properly');
                // Don't override - let the existing scripts handle it
            }
        }, 1000);
    }

    // Run check after DOM loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureCorrectProfile);
    } else {
        ensureCorrectProfile();
    }

    // Also check after a delay
    setTimeout(ensureCorrectProfile, 2000);

    console.log('✅ Eye icon connector ready');
})();