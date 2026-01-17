/**
 * Fix eye icon button lead IDs - ensures each button has the correct lead ID
 */

(function() {
    'use strict';

    console.log('🔧 Eye icon lead ID fix loaded');

    function fixEyeIconLeadIds() {
        console.log('🔧 Fixing eye icon lead IDs...');

        // Find all eye icon buttons
        const eyeButtons = document.querySelectorAll('button.btn-icon[onclick*="viewLead"]');
        console.log(`👁️ Found ${eyeButtons.length} eye icon buttons to fix`);

        eyeButtons.forEach((button, index) => {
            // Find the parent row
            const row = button.closest('tr');
            if (!row) {
                console.log(`⚠️ Button ${index}: No parent row found`);
                return;
            }

            // Find the lead name element in the same row
            const nameElement = row.querySelector('.lead-name strong[onclick*="viewLead"]');
            if (!nameElement) {
                console.log(`⚠️ Button ${index}: No name element with onclick found in row`);
                return;
            }

            // Extract the correct lead ID from the name element
            const nameOnclick = nameElement.getAttribute('onclick');
            const leadIdMatch = nameOnclick.match(/viewLead\(['"]([^'"]+)['"]\)/);

            if (!leadIdMatch) {
                console.log(`⚠️ Button ${index}: Could not extract lead ID from name onclick:`, nameOnclick);
                return;
            }

            const correctLeadId = leadIdMatch[1];
            const currentOnclick = button.getAttribute('onclick');
            const currentLeadIdMatch = currentOnclick.match(/viewLead\(['"]([^'"]+)['"]\)/);

            if (!currentLeadIdMatch) {
                console.log(`⚠️ Button ${index}: Could not extract current lead ID from button onclick:`, currentOnclick);
                return;
            }

            const currentLeadId = currentLeadIdMatch[1];

            // Check if the lead IDs match
            if (currentLeadId !== correctLeadId) {
                // Fix the button onclick
                const newOnclick = `viewLead('${correctLeadId}')`;
                button.setAttribute('onclick', newOnclick);
                console.log(`✅ Fixed button ${index}: ${currentLeadId} → ${correctLeadId}`);

                // Also get the lead name for logging
                const leadName = nameElement.textContent.trim();
                console.log(`   Lead: ${leadName}`);
            } else {
                console.log(`✓ Button ${index}: Already correct (${correctLeadId})`);
            }
        });

        console.log('🔧 Eye icon lead ID fix complete');
    }

    // Run the fix when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixEyeIconLeadIds);
    } else {
        // DOM already loaded
        setTimeout(fixEyeIconLeadIds, 100);
    }

    // Also run when new content is added (for dynamic table updates)
    const observer = new MutationObserver((mutations) => {
        let shouldFix = false;

        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if new buttons were added
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // Element node
                        if (node.matches && node.matches('button.btn-icon[onclick*="viewLead"]')) {
                            shouldFix = true;
                            break;
                        }
                        if (node.querySelector && node.querySelector('button.btn-icon[onclick*="viewLead"]')) {
                            shouldFix = true;
                            break;
                        }
                    }
                }
            }
        });

        if (shouldFix) {
            console.log('🔧 New eye icon buttons detected, applying fix...');
            setTimeout(fixEyeIconLeadIds, 100);
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('🔧 Eye icon lead ID fix system installed');

})();