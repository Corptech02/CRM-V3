// Disable Loading Overlays - Remove all annoying loading popups
(function() {
    'use strict';

    console.log('🚫 Disabling all loading overlays...');

    // Override any loading overlay functions
    window.showLeadLoadingOverlay = function() {
        console.log('🚫 Blocked showLeadLoadingOverlay');
        return;
    };

    window.showLoadingOverlay = function() {
        console.log('🚫 Blocked showLoadingOverlay');
        return;
    };

    window.hideLoadingOverlay = function() {
        console.log('🚫 Blocked hideLoadingOverlay');
        return;
    };

    window.hideLeadLoadingOverlay = function() {
        console.log('🚫 Blocked hideLeadLoadingOverlay');
        return;
    };

    // Remove any existing loading overlays
    function removeLoadingOverlays() {
        const overlaySelectors = [
            '#lead-loading-overlay',
            '#loading-overlay',
            '.loading-overlay',
            '[id*="loading"]',
            '[class*="loading"]'
        ];

        overlaySelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el.textContent && (
                    el.textContent.includes('Loading Lead Profile') ||
                    el.textContent.includes('Please wait') ||
                    el.textContent.includes('Loading...')
                )) {
                    console.log('🚫 Removing loading overlay:', el.id || el.className);
                    el.remove();
                }
            });
        });

        // Remove high z-index loading elements
        document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex);
            if (zIndex > 1000 && style.position !== 'static') {
                if (el.textContent && (
                    el.textContent.includes('Loading Lead Profile') ||
                    el.textContent.includes('Please wait') ||
                    el.textContent.includes('Loading...')
                )) {
                    console.log('🚫 Removing high z-index loading element');
                    el.remove();
                }
            }
        });
    }

    // Run immediately
    removeLoadingOverlays();

    // Run periodically to catch dynamically created overlays
    setInterval(removeLoadingOverlays, 500);

    // Observer to catch new loading overlays as they're added
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    if (node.textContent && (
                        node.textContent.includes('Loading Lead Profile') ||
                        node.textContent.includes('Please wait')
                    )) {
                        console.log('🚫 Immediately removing loading overlay');
                        node.remove();
                    }
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('✅ Loading overlay blocking activated');
})();