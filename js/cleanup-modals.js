// Clean up any stacked quote application modals
(function() {
    'use strict';
    
    // Function to remove DUPLICATE quote application modals (keep the last one)
    function cleanupModals() {
        const modals = document.querySelectorAll('#quote-application-modal');
        // Only remove if there are multiple modals stacked
        if (modals.length > 1) {
            // Remove all but the last one
            for (let i = 0; i < modals.length - 1; i++) {
                modals[i].remove();
                console.log('Removed duplicate modal');
            }
        }
    }
    
    // Clean on load - but only duplicates
    cleanupModals();
    
    // Check periodically for duplicates only
    setInterval(cleanupModals, 30000); // Every 30 seconds instead of 10
    
    // Add global cleanup function that removes ALL modals
    window.cleanupAllQuoteModals = function() {
        const modals = document.querySelectorAll('#quote-application-modal');
        modals.forEach(modal => {
            modal.remove();
            console.log('Removed modal');
        });
    };
    
    // Keep the original for compatibility but only clean duplicates
    window.cleanupQuoteModals = cleanupModals;
    
    console.log('Modal cleanup script loaded - will only remove duplicates');
})();