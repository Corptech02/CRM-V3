/**
 * Fix eye icon button lead IDs - ensures each button has the correct lead ID
 */

(function() {
    'use strict';

    console.log('🔧 Action button lead ID fix loaded');

    function fixActionButtonLeadIds() {
        console.log('🔧 Fixing ALL action button lead IDs...');

        // Find all action buttons - not just eye icons, but ALL buttons in action-buttons divs
        const actionButtons = document.querySelectorAll('.action-buttons button[onclick*="Lead"], button.btn-icon[onclick*="viewLead"], button.btn-icon[onclick*="archiveLead"], button.btn-icon[onclick*="convertLead"], button.btn-icon[onclick*="permanentlyDeleteActiveLead"]');
        console.log(`👁️ Found ${actionButtons.length} action buttons to fix`);

        actionButtons.forEach((button, index) => {
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

            // Extract current lead ID from various button types
            let currentLeadIdMatch = currentOnclick.match(/viewLead\(['"]([^'"]+)['"]\)/);
            if (!currentLeadIdMatch) {
                currentLeadIdMatch = currentOnclick.match(/archiveLead\(['"]([^'"]+)['"]\)/);
            }
            if (!currentLeadIdMatch) {
                currentLeadIdMatch = currentOnclick.match(/convertLead\(['"]([^'"]+)['"]\)/);
            }
            if (!currentLeadIdMatch) {
                currentLeadIdMatch = currentOnclick.match(/permanentlyDeleteActiveLead\(['"]([^'"]+)['"]\)/);
            }

            if (!currentLeadIdMatch) {
                console.log(`⚠️ Button ${index}: Could not extract current lead ID from button onclick:`, currentOnclick);
                return;
            }

            const currentLeadId = currentLeadIdMatch[1];

            // Check if the lead IDs match
            if (currentLeadId !== correctLeadId) {
                // Fix ALL button types with the correct lead ID
                let newOnclick = currentOnclick;
                newOnclick = newOnclick.replace(/viewLead\(['"]([^'"]+)['"]\)/g, `viewLead('${correctLeadId}')`);
                newOnclick = newOnclick.replace(/archiveLead\(['"]([^'"]+)['"]\)/g, `archiveLead('${correctLeadId}')`);
                newOnclick = newOnclick.replace(/convertLead\(['"]([^'"]+)['"]\)/g, `convertLead('${correctLeadId}')`);
                newOnclick = newOnclick.replace(/permanentlyDeleteActiveLead\(['"]([^'"]+)['"]\)/g, `permanentlyDeleteActiveLead('${correctLeadId}')`);

                button.setAttribute('onclick', newOnclick);
                console.log(`✅ Fixed button ${index}: ${currentLeadId} → ${correctLeadId}`);

                // Also get the lead name for logging
                const leadName = nameElement.textContent.trim();
                console.log(`   Lead: ${leadName}`);
            } else {
                console.log(`✓ Button ${index}: Already correct (${correctLeadId})`);
            }
        });

        console.log('🔧 Action button lead ID fix complete');
    }

    // Run the fix when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixActionButtonLeadIds);
    } else {
        // DOM already loaded
        setTimeout(fixActionButtonLeadIds, 100);
    }

    // Also run when new content is added (for dynamic table updates)
    const observer = new MutationObserver((mutations) => {
        let shouldFix = false;

        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if new action buttons were added
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // Element node
                        if (node.matches && (
                            node.matches('button.btn-icon[onclick*="viewLead"]') ||
                            node.matches('button.btn-icon[onclick*="archiveLead"]') ||
                            node.matches('button.btn-icon[onclick*="convertLead"]') ||
                            node.matches('button.btn-icon[onclick*="permanentlyDeleteActiveLead"]') ||
                            node.matches('.action-buttons')
                        )) {
                            shouldFix = true;
                            break;
                        }
                        if (node.querySelector && (
                            node.querySelector('button.btn-icon[onclick*="viewLead"]') ||
                            node.querySelector('button.btn-icon[onclick*="archiveLead"]') ||
                            node.querySelector('button.btn-icon[onclick*="convertLead"]') ||
                            node.querySelector('button.btn-icon[onclick*="permanentlyDeleteActiveLead"]') ||
                            node.querySelector('.action-buttons')
                        )) {
                            shouldFix = true;
                            break;
                        }
                    }
                }
            }
        });

        if (shouldFix) {
            console.log('🔧 New action buttons detected, applying fix...');
            setTimeout(fixActionButtonLeadIds, 100);
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('🔧 Action button lead ID fix system installed');

})();