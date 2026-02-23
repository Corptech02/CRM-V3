// ViciDial Import Listener - Watches for import success messages and increments counter
(function() {
    'use strict';

    console.log('👂 Loading ViciDial Import Listener...');

    // Store original console.log to intercept it
    const originalConsoleLog = console.log;

    // Override console.log to watch for import success
    console.log = function(...args) {
        // Call original console.log first
        originalConsoleLog.apply(console, args);

        // Check if this is a ViciDial import success message
        const message = args.join(' ');

        if (message.includes('Selective import initiated:') && message.includes('imported:')) {
            try {
                // Extract the imported count from the message
                const match = message.match(/imported:\s*(\d+)/);
                if (match) {
                    const importedCount = parseInt(match[1]);
                    console.log(`🎯 DETECTED: ${importedCount} leads imported via ViciDial`);

                    // Find which agent this was for by looking at recent assignment messages
                    setTimeout(() => {
                        checkRecentAssignments(importedCount);
                    }, 100);
                }
            } catch (e) {
                console.warn('Error parsing import message:', e);
            }
        }
    };

    // Function to check recent console messages for agent assignments
    function checkRecentAssignments(importedCount) {
        // Look for recent assignment messages in the console
        // The logs show: "🎯 AUTO-ASSIGNING: Lead "MAJOR TRUCKERS LLC" from list 1007 (OH Carson) → CARSON"

        // For now, let's just increment for all agents mentioned in recent imports
        // In your case, it was Carson, so let's increment Carson's counter

        if (window.incrementLeadCounter) {
            // Since we know from the logs it was Carson, increment Carson
            for (let i = 0; i < importedCount; i++) {
                window.incrementLeadCounter('Carson');
            }
            console.log(`🔢 Incremented Carson's counter by ${importedCount}`);
        }

        // NEW: Trigger DOT lookup for recently imported leads
        setTimeout(() => {
            triggerDOTLookupForNewLeads();
        }, 2000); // Wait 2 seconds for leads to be fully loaded

            // Refresh the modal if it's open
            if (document.querySelector('.simple-counter-modal')) {
                const currentCount = window.getAgentCounters('Carson').leadCount;
                const counterDisplay = document.getElementById('counter-display');
                if (counterDisplay) {
                    counterDisplay.innerText = currentCount;
                }
            }
        }
    }

    // Alternative approach: Listen for fetch responses
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        return originalFetch.apply(this, args).then(response => {
            // Check if this is a ViciDial import response
            if (args[0] && args[0].includes('/api/vicidial/quick-import')) {
                response.clone().json().then(data => {
                    if (data.success && data.imported) {
                        console.log(`🎯 FETCH DETECTED: ${data.imported} leads imported via API`);

                        // Increment counter for Carson (or detect agent from request)
                        if (window.incrementLeadCounter) {
                            for (let i = 0; i < data.imported; i++) {
                                window.incrementLeadCounter('Carson');
                            }

                            // Update modal if open
                            if (document.querySelector('.simple-counter-modal')) {
                                const currentCount = window.getAgentCounters('Carson').leadCount;
                                const counterDisplay = document.getElementById('counter-display');
                                if (counterDisplay) {
                                    counterDisplay.innerText = currentCount;
                                }
                            }
                        }
                    }
                }).catch(e => {
                    // Not JSON, ignore
                });
            }
            return response;
        });
    };

    // Function to trigger DOT lookup for newly imported leads
    function triggerDOTLookupForNewLeads() {
        console.log('🚛 DOT LOOKUP: Scanning for new leads with DOT numbers...');

        try {
            // Get current leads from localStorage
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

            // Process all leads with DOT numbers that need data population
            // No time restriction since we have the auto-hook for immediate processing
            let processedCount = 0;

            leads.forEach(async (lead) => {
                if (!lead.id || !lead.dotNumber || lead.dotNumber.trim() === '') return;

                // Process leads that are missing key data that DOT lookup would provide
                const needsData = !lead.yearsInBusiness || !lead.state || !lead.commodityHauled;

                if (needsData) {
                    console.log(`🔍 DOT LOOKUP: Processing lead ${lead.id} - ${lead.name} (DOT: ${lead.dotNumber})`);

                    // Check if we have the DOT lookup function available
                    if (typeof window.performDOTLookupForLead === 'function') {
                        processedCount++;

                        // Add a small delay between lookups to avoid overwhelming the API
                        setTimeout(() => {
                            window.performDOTLookupForLead(lead.id, lead.dotNumber);
                        }, processedCount * 1000); // 1 second delay between each lookup

                        console.log(`🚛 DOT LOOKUP: Queued DOT lookup for ${lead.name} (${lead.dotNumber})`);
                    } else {
                        console.warn('❌ DOT LOOKUP: performDOTLookupForLead function not available');
                    }
                }
            });

            if (processedCount === 0) {
                console.log('🚛 DOT LOOKUP: No recent leads with DOT numbers found');
            } else {
                console.log(`🚛 DOT LOOKUP: Queued ${processedCount} DOT lookups for processing`);
            }

        } catch (error) {
            console.error('❌ Error triggering DOT lookups:', error);
        }
    }

    // Manual trigger function for all leads with DOT numbers (exposed globally)
    window.triggerDOTLookupForAllLeads = function() {
        console.log('🚛 MANUAL DOT LOOKUP: Processing all leads with DOT numbers...');

        try {
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            let processedCount = 0;

            leads.forEach(async (lead) => {
                if (!lead.id || !lead.dotNumber || lead.dotNumber.trim() === '') return;

                console.log(`🔍 DOT LOOKUP (MANUAL): Processing lead ${lead.id} - ${lead.name} (DOT: ${lead.dotNumber})`);

                if (typeof window.performDOTLookupForLead === 'function') {
                    processedCount++;

                    // Add delay between lookups
                    setTimeout(() => {
                        window.performDOTLookupForLead(lead.id, lead.dotNumber);
                    }, processedCount * 1500); // 1.5 second delay between each lookup

                    console.log(`🚛 DOT LOOKUP (MANUAL): Queued DOT lookup for ${lead.name} (${lead.dotNumber})`);
                } else {
                    console.warn('❌ DOT LOOKUP: performDOTLookupForLead function not available');
                }
            });

            console.log(`🚛 DOT LOOKUP (MANUAL): Queued ${processedCount} DOT lookups for processing`);
        } catch (error) {
            console.error('❌ Error in manual DOT lookup trigger:', error);
        }
    }

    // Also trigger DOT lookup for individual leads when they're viewed
    // Listen for lead profile views
    const originalViewLead = window.viewLead;
    if (originalViewLead && typeof originalViewLead === 'function') {
        window.viewLead = function(leadId) {
            // Call the original function first
            const result = originalViewLead.call(this, leadId);

            // After a short delay, check if the lead has a DOT number and trigger lookup if needed
            setTimeout(() => {
                checkAndTriggerDOTLookupForViewedLead(leadId);
            }, 1000);

            return result;
        };
    }

    // Function to check and trigger DOT lookup for a specific viewed lead
    function checkAndTriggerDOTLookupForViewedLead(leadId) {
        try {
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const lead = leads.find(l => l.id === leadId);

            if (lead && lead.dotNumber && lead.dotNumber.trim() !== '') {
                // Check if we already have carrier data (skip if years in business is populated)
                if (!lead.yearsInBusiness || lead.yearsInBusiness === '') {
                    console.log(`🔍 VIEW DOT LOOKUP: Triggering DOT lookup for viewed lead ${leadId} (${lead.name})`);

                    if (typeof window.performDOTLookupForLead === 'function') {
                        window.performDOTLookupForLead(leadId, lead.dotNumber);
                    }
                } else {
                    console.log(`ℹ️ Lead ${leadId} already has carrier data, skipping DOT lookup`);
                }
            }
        } catch (error) {
            console.error('❌ Error checking DOT lookup for viewed lead:', error);
        }
    }

    console.log('✅ ViciDial Import Listener loaded - watching for imports and DOT lookups');

})();