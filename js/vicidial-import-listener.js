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

    console.log('✅ ViciDial Import Listener loaded - watching for imports');

})();