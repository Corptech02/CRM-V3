/**
 * Fix Quote Application Button Click
 * Ensures the button works correctly with leadId
 */

(function() {
    console.log('🔧 Loading Quote Application Click Fix...');

    // Function to fix quote application buttons in lead profiles
    function fixQuoteApplicationButtons() {
        // Find all Quote Application buttons
        const quoteButtons = document.querySelectorAll('button');

        quoteButtons.forEach(button => {
            // Only target the "Quote Application" button, NOT the "Save Quote Application" button
            if (button.textContent.includes('Quote Application') && !button.textContent.includes('Save')) {
                // Check if this button is in a lead profile context
                const leadProfileContainer = button.closest('.lead-details, .profile-container, [data-lead-id]');

                if (leadProfileContainer) {
                    // Try to extract leadId from the URL or profile container
                    let leadId = null;

                    // Method 1: Check for leadId in URL hash
                    const hash = window.location.hash;
                    const leadIdMatch = hash.match(/leadId[=:]([^&]+)/);
                    if (leadIdMatch) {
                        leadId = leadIdMatch[1];
                    }

                    // Method 2: Check for leadId in profile container
                    if (!leadId && leadProfileContainer.dataset.leadId) {
                        leadId = leadProfileContainer.dataset.leadId;
                    }

                    // Method 3: Look for leadId in nearby elements
                    if (!leadId) {
                        const leadIdElement = leadProfileContainer.querySelector('[data-lead-id]');
                        if (leadIdElement) {
                            leadId = leadIdElement.dataset.leadId;
                        }
                    }

                    // Method 4: Extract from any onclick attributes on nearby elements
                    if (!leadId) {
                        const elements = leadProfileContainer.querySelectorAll('[onclick*="leadId"]');
                        elements.forEach(el => {
                            const onclick = el.getAttribute('onclick');
                            const match = onclick.match(/['"]([^'"]+)['"].*leadId|leadId.*['"]([^'"]+)['"]/);
                            if (match) {
                                leadId = match[1] || match[2];
                            }
                        });
                    }

                    // Method 5: Look for current viewing lead from global state
                    if (!leadId && window.currentViewingLead) {
                        leadId = window.currentViewingLead;
                    }

                    // Method 6: Check localStorage for current lead
                    if (!leadId) {
                        try {
                            const currentLead = localStorage.getItem('currentViewingLeadId');
                            if (currentLead) {
                                leadId = currentLead;
                            }
                        } catch (e) {
                            // Ignore
                        }
                    }

                    console.log(`Found Quote Application button, leadId: ${leadId}`);

                    if (leadId) {
                        // Remove existing onclick to avoid conflicts
                        button.removeAttribute('onclick');

                        // Add new click handler
                        button.addEventListener('click', function(e) {
                            e.preventDefault();
                            console.log(`Quote Application clicked for lead: ${leadId}`);

                            // Try different quote application functions in order of preference
                            if (typeof window.createQuoteApplication === 'function') {
                                console.log('Using createQuoteApplication');
                                window.createQuoteApplication(leadId);
                            } else if (typeof window.showQuoteApplicationServer === 'function') {
                                console.log('Using showQuoteApplicationServer');
                                window.showQuoteApplicationServer(leadId);
                            } else if (typeof window.showQuoteApplication === 'function') {
                                console.log('Using showQuoteApplication');
                                window.showQuoteApplication(leadId);
                            } else {
                                console.error('No quote application function found');
                                alert('Quote Application feature is loading. Please try again in a moment.');

                                // Try to load the required scripts
                                const script1 = document.createElement('script');
                                script1.src = 'js/quote-application-server.js';
                                script1.onload = () => {
                                    const script2 = document.createElement('script');
                                    script2.src = 'js/quote-application.js';
                                    script2.onload = () => {
                                        console.log('Quote application scripts loaded');
                                        // Try again
                                        if (typeof window.showQuoteApplicationServer === 'function') {
                                            window.showQuoteApplicationServer(leadId);
                                        }
                                    };
                                    document.head.appendChild(script2);
                                };
                                document.head.appendChild(script1);
                            }
                        });

                        // Mark as fixed
                        button.dataset.quoteAppFixed = 'true';
                        console.log('✅ Fixed Quote Application button for lead:', leadId);
                    } else {
                        console.warn('⚠️ Could not determine leadId for Quote Application button');
                    }
                }
            }
        });
    }

    // Override showLeadProfile to capture current lead ID
    const originalShowLeadProfile = window.showLeadProfile;
    if (originalShowLeadProfile) {
        window.showLeadProfile = function(leadId) {
            console.log('Setting currentViewingLead to:', leadId);
            window.currentViewingLead = leadId;
            localStorage.setItem('currentViewingLeadId', leadId);

            // Call original function
            const result = originalShowLeadProfile.call(this, leadId);

            // Fix buttons after profile loads
            setTimeout(() => {
                fixQuoteApplicationButtons();
            }, 500);

            return result;
        };
    }

    // Run fix on page load
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(fixQuoteApplicationButtons, 1000);
    });

    // Also run fix when DOM changes (for dynamically loaded content)
    const observer = new MutationObserver(function(mutations) {
        let shouldFix = false;
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'BUTTON' && node.textContent.includes('Quote Application')) {
                            shouldFix = true;
                        } else if (node.querySelector && node.querySelector('button')) {
                            const buttons = node.querySelectorAll('button');
                            buttons.forEach(btn => {
                                if (btn.textContent.includes('Quote Application')) {
                                    shouldFix = true;
                                }
                            });
                        }
                    }
                });
            }
        });

        if (shouldFix) {
            setTimeout(fixQuoteApplicationButtons, 100);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('✅ Quote Application Click Fix loaded');
})();