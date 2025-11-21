// Fix Profile Position - Prevent jumping from center to top-left
(function() {
    'use strict';

    console.log('🔧 Fixing profile position issues...');

    // Monitor for profile container
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.id === 'lead-profile-container') {
                    console.log('Profile container detected, fixing position...');
                    fixProfilePosition(node);
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Fix profile position
    function fixProfilePosition(container) {
        // Ensure it stays centered
        container.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.5) !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 999999 !important;
            animation: fadeIn 0.3s ease !important;
        `;

        // Find the content div and ensure it's styled properly
        const content = container.querySelector('div');
        if (content && content !== container) {
            content.style.position = 'relative';
            content.style.transform = 'none';
            content.style.top = 'auto';
            content.style.left = 'auto';

            // Ensure proper sizing
            if (!content.style.maxWidth) {
                content.style.maxWidth = '1200px';
            }
            if (!content.style.width) {
                content.style.width = '90%';
            }
            if (!content.style.maxHeight) {
                content.style.maxHeight = '90vh';
            }
            if (!content.style.overflowY) {
                content.style.overflowY = 'auto';
            }
        }

        // Watch for changes that might move it
        const positionWatcher = setInterval(() => {
            if (!document.getElementById('lead-profile-container')) {
                clearInterval(positionWatcher);
                return;
            }

            // Check if position changed
            const currentContainer = document.getElementById('lead-profile-container');
            if (currentContainer) {
                const styles = window.getComputedStyle(currentContainer);

                // If it's not centered, fix it
                if (styles.display !== 'flex' ||
                    styles.justifyContent !== 'center' ||
                    styles.alignItems !== 'center' ||
                    styles.position !== 'fixed') {

                    console.log('Profile position changed, fixing...');
                    currentContainer.style.cssText = `
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        background: rgba(0, 0, 0, 0.5) !important;
                        display: flex !important;
                        justify-content: center !important;
                        align-items: center !important;
                        z-index: 999999 !important;
                    `;
                }
            }
        }, 100);

        // Stop watching after 5 seconds
        setTimeout(() => clearInterval(positionWatcher), 5000);
    }

    // Add animation styles if not present
    if (!document.getElementById('profile-position-styles')) {
        const style = document.createElement('style');
        style.id = 'profile-position-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            #lead-profile-container {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
            }

            #lead-profile-container > div {
                position: relative !important;
                transform: none !important;
                top: auto !important;
                left: auto !important;
            }
        `;
        document.head.appendChild(style);
    }

    console.log('✅ Profile position fix ready');
})();