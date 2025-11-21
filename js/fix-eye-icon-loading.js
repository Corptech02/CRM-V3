/**
 * Fix loading overlay for eye icon clicks - intercepts all eye icon clicks
 */

(function() {
    'use strict';
    
    console.log('Eye icon loading fix loaded');
    
    // Create loading overlay function
    window.showLoadingOverlay = function(message = 'Loading...') {
        // Remove any existing overlay
        const existing = document.getElementById('global-loading-overlay');
        if (existing) existing.remove();
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'global-loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            backdrop-filter: blur(4px);
            animation: fadeIn 0.2s ease;
        `;
        
        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                text-align: center;
                min-width: 300px;
                animation: scaleIn 0.3s ease;
            ">
                <div style="margin-bottom: 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #3b82f6;"></i>
                </div>
                <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 20px; font-weight: 600;">${message}</h3>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Please wait...</p>
            </div>
        `;
        
        document.body.appendChild(overlay);
        console.log('Loading overlay shown:', message);
        
        // Auto-remove after max 30 seconds (failsafe - only for stuck situations)
        setTimeout(() => {
            const overlayElement = document.getElementById('global-loading-overlay');
            if (overlayElement) {
                console.log('Auto-removing loading overlay after 30s failsafe');
                overlayElement.remove();
            }
        }, 30000);
    };
    
    // Hide loading overlay
    window.hideLoadingOverlay = function() {
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                    console.log('Loading overlay hidden');
                }
            }, 300);
        }
    };
    
    // Intercept all clicks on document
    document.addEventListener('click', function(e) {
        // SKIP if clicking on close buttons or if a modal is already open
        let clickTarget = e.target;

        // Check if this is a close button or inside a modal
        for (let i = 0; i < 5; i++) {
            if (!clickTarget) break;

            // Skip if this is a close button
            if (clickTarget.classList && (
                clickTarget.classList.contains('close-modal') ||
                clickTarget.classList.contains('close-btn') ||
                clickTarget.classList.contains('btn-close') ||
                clickTarget.classList.contains('modal-close'))) {
                console.log('Close button clicked, skipping overlay');
                return;
            }

            // Skip if onclick contains 'close' or 'remove'
            if (clickTarget.onclick && (
                clickTarget.onclick.toString().includes('close') ||
                clickTarget.onclick.toString().includes('remove') ||
                clickTarget.onclick.toString().includes('.remove()'))) {
                console.log('Close/remove action detected, skipping overlay');
                return;
            }

            // Skip if this is the × button
            if (clickTarget.textContent === '×' || clickTarget.innerHTML === '&times;') {
                console.log('× button clicked, skipping overlay');
                return;
            }

            clickTarget = clickTarget.parentElement;
        }

        // Check if we're inside an open modal (clicking inside shouldn't trigger overlay)
        if (e.target.closest('.modal-overlay') || e.target.closest('.modal-content')) {
            console.log('Click inside modal, skipping overlay');
            return;
        }

        // Check if clicked element or its parent is an eye icon button
        let target = e.target;
        let button = null;

        // Check up to 3 levels up for a button with eye icon
        for (let i = 0; i < 3; i++) {
            if (!target) break;

            // Check if this is a button with onclick containing 'view'
            if (target.tagName === 'BUTTON' && target.onclick && target.onclick.toString().includes('view')) {
                button = target;
                break;
            }

            // Check if this element contains an eye icon
            if (target.querySelector && target.querySelector('.fa-eye')) {
                button = target;
                break;
            }

            // Check if this IS an eye icon
            if (target.classList && target.classList.contains('fa-eye')) {
                button = target.closest('button');
                break;
            }

            target = target.parentElement;
        }

        // If we found an eye icon button, show loading
        if (button) {
            const onclickStr = button.onclick ? button.onclick.toString() : '';
            console.log('Eye icon clicked, onclick:', onclickStr);

            // Determine what type of view based on onclick
            let loadingMessage = 'Loading...';
            if (onclickStr.includes('viewPolicy')) {
                loadingMessage = 'Loading Policy Details';
            } else if (onclickStr.includes('viewLead')) {
                loadingMessage = 'Loading Lead Profile';
            } else if (onclickStr.includes('viewClient')) {
                loadingMessage = 'Loading Client Profile';
            }

            // Show loading immediately
            showLoadingOverlay(loadingMessage);

            // Don't auto-hide - wait for modal to appear
        }
    }, true); // Use capture phase to catch event early
    
    // Also override the view functions directly
    const originalViewPolicy = window.viewPolicy;
    if (originalViewPolicy) {
        window.viewPolicy = function(policyId) {
            console.log('viewPolicy called with loading overlay');
            if (!document.getElementById('global-loading-overlay')) {
                showLoadingOverlay('Loading Policy Details');
            }

            // Small delay to ensure overlay renders
            setTimeout(() => {
                originalViewPolicy.call(this, policyId);
                // Don't auto-hide - wait for modal to appear
            }, 50);
        };
    }
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes scaleIn {
            from { 
                opacity: 0;
                transform: scale(0.9);
            }
            to { 
                opacity: 1;
                transform: scale(1);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Also listen for when modals open to hide the overlay
    const observer = new MutationObserver((mutations) => {
        // Only hide overlay if there's one visible
        if (!document.getElementById('global-loading-overlay')) return;

        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Check if a modal was added with actual content
                        let isModalReady = false;

                        // Check for modal overlay with content
                        if (node.classList && (node.classList.contains('modal-overlay') ||
                            node.classList.contains('modal'))) {
                            // Check if it has substantial content (not just loading state)
                            const hasContent = node.querySelector('.modal-content') ||
                                             node.querySelector('.modal-body') ||
                                             node.querySelector('.profile-section');
                            const hasForm = node.querySelector('form') ||
                                          node.querySelector('input') ||
                                          node.querySelector('.form-group');

                            if (hasContent || hasForm) {
                                isModalReady = true;
                                console.log('Modal with content detected');
                            }
                        }

                        // Check for specific profile modals
                        if (node.id === 'policyViewModal' ||
                            node.id === 'lead-profile-modal' ||
                            node.id === 'lead-profile-container' ||
                            node.className?.includes('profile-modal')) {
                            isModalReady = true;
                            console.log('Profile modal detected:', node.id || node.className);
                        }

                        // Check if the node contains profile content
                        if (node.querySelector && (
                            node.querySelector('.profile-header') ||
                            node.querySelector('.profile-section') ||
                            node.querySelector('.policy-details') ||
                            node.querySelector('#quote-submissions-container'))) {
                            isModalReady = true;
                            console.log('Profile content detected');
                        }

                        if (isModalReady) {
                            // Small delay to ensure modal is fully rendered
                            setTimeout(() => {
                                console.log('Hiding overlay - modal is ready');
                                hideLoadingOverlay();
                            }, 200);
                        }
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('Eye icon loading system installed - intercepting all clicks');
    
})();