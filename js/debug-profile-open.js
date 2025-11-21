// Debug script to trace why profile isn't opening
(function() {
    'use strict';

    console.log('🔍 DEBUG-PROFILE-OPEN: Starting trace...');

    // Check if showLeadProfile exists
    console.log('showLeadProfile exists?', typeof window.showLeadProfile);
    console.log('viewLead exists?', typeof window.viewLead);
    console.log('closeLeadProfile exists?', typeof window.closeLeadProfile);

    // Override viewLead to trace execution
    const originalViewLead = window.viewLead;
    window.viewLead = function(leadId) {
        console.log('📍 viewLead called with:', leadId);

        // Check if showLeadProfile is available
        if (window.showLeadProfile && typeof window.showLeadProfile === 'function') {
            console.log('✅ Calling showLeadProfile...');
            try {
                window.showLeadProfile(leadId);
                console.log('✅ showLeadProfile completed');

                // Check if profile was added to DOM
                setTimeout(() => {
                    const container = document.getElementById('lead-profile-container');
                    const overlay = document.querySelector('.modal-overlay');
                    console.log('Profile container exists?', !!container);
                    console.log('Modal overlay exists?', !!overlay);

                    if (!container && !overlay) {
                        console.error('❌ Profile was not added to DOM!');
                    } else {
                        console.log('✅ Profile is in DOM');
                    }
                }, 100);

            } catch (error) {
                console.error('❌ Error in showLeadProfile:', error);
            }
        } else {
            console.error('❌ showLeadProfile not available');
            if (originalViewLead) {
                return originalViewLead.call(this, leadId);
            }
        }
    };

    // Check if lead-profile-enhanced.js loaded properly
    if (window.showLeadProfile) {
        // Test the function directly
        console.log('🧪 Testing showLeadProfile directly...');

        // Get a sample lead ID
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        if (leads.length > 0) {
            const testLeadId = leads[0].id;
            console.log('Test lead ID:', testLeadId);

            // Add test button
            const testBtn = document.createElement('button');
            testBtn.textContent = 'TEST PROFILE OPEN';
            testBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 99999; background: red; color: white; padding: 10px;';
            testBtn.onclick = function() {
                console.log('🧪 Test button clicked, opening profile for:', testLeadId);
                window.showLeadProfile(testLeadId);
            };
            document.body.appendChild(testBtn);
        }
    }

    console.log('✅ DEBUG-PROFILE-OPEN: Ready');
})();