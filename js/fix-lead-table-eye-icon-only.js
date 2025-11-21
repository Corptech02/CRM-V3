/**
 * Loading overlay ONLY for eye icons in lead management table
 * Very specific - won't trigger anywhere else
 */

(function() {
    'use strict';
    
    console.log('Lead table eye icon overlay fix loaded');
    
    // Create loading overlay function
    window.showLeadLoadingOverlay = function(message = 'Loading Lead Profile...') {
        // Remove any existing overlay
        const existing = document.getElementById('lead-loading-overlay');
        if (existing) existing.remove();
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'lead-loading-overlay';
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
            ">
                <div style="margin-bottom: 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #3b82f6;"></i>
                </div>
                <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 20px; font-weight: 600;">${message}</h3>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Please wait...</p>
            </div>
        `;
        
        document.body.appendChild(overlay);
        console.log('Lead loading overlay shown');
        
        // Auto-remove after 30 seconds (failsafe)
        setTimeout(() => {
            const overlayElement = document.getElementById('lead-loading-overlay');
            if (overlayElement) {
                console.log('Auto-removing lead overlay after 30s');
                overlayElement.remove();
            }
        }, 30000);
    };
    
    // Hide loading overlay
    window.hideLeadLoadingOverlay = function() {
        const overlay = document.getElementById('lead-loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                    console.log('Lead loading overlay hidden');
                }
            }, 300);
        }
    };
    
    // ONLY intercept clicks on eye icons in the leads table
    document.addEventListener('click', function(e) {
        let target = e.target;
        
        // Check if we clicked an eye icon
        let isEyeIcon = false;
        let button = null;
        
        // Check the clicked element and up to 3 parents
        for (let i = 0; i < 4; i++) {
            if (!target) break;
            
            // Check if this is an eye icon
            if (target.classList && target.classList.contains('fa-eye')) {
                isEyeIcon = true;
                button = target.closest('button');
                break;
            }
            
            // Check if this is a button containing an eye icon
            if (target.tagName === 'BUTTON' && target.querySelector('.fa-eye')) {
                isEyeIcon = true;
                button = target;
                break;
            }
            
            target = target.parentElement;
        }
        
        // If not an eye icon, stop here
        if (!isEyeIcon || !button) {
            return;
        }
        
        // Now check if this eye icon is in the leads table
        let inLeadsTable = false;
        let checkElement = button;
        
        // Check up to 10 levels to find a leads table
        for (let i = 0; i < 10; i++) {
            if (!checkElement) break;
            
            // Check for leads table indicators
            if (checkElement.classList && (
                checkElement.classList.contains('leads-table') ||
                checkElement.classList.contains('leads-container') ||
                checkElement.classList.contains('leads-list'))) {
                inLeadsTable = true;
                break;
            }
            
            // Check for table with leads header
            if (checkElement.tagName === 'TABLE') {
                const headers = checkElement.querySelectorAll('th');
                for (let header of headers) {
                    if (header.textContent.toLowerCase().includes('lead') ||
                        header.textContent.toLowerCase().includes('company') ||
                        header.textContent.toLowerCase().includes('contact')) {
                        inLeadsTable = true;
                        break;
                    }
                }
            }
            
            // Check for leads view container
            if (checkElement.id && (
                checkElement.id.includes('leads') ||
                checkElement.id === 'mainContent')) {
                // Additional check - make sure we're in leads view
                const breadcrumb = document.querySelector('.breadcrumb, .page-title, h2');
                if (breadcrumb && breadcrumb.textContent.toLowerCase().includes('lead')) {
                    inLeadsTable = true;
                    break;
                }
            }
            
            checkElement = checkElement.parentElement;
        }
        
        // Only show overlay if the eye icon is in the leads table
        if (inLeadsTable) {
            // Check the onclick to make sure it's viewLead
            const onclickStr = button.getAttribute('onclick') || '';
            if (onclickStr.includes('viewLead')) {
                console.log('Eye icon clicked in leads table - showing overlay');
                showLeadLoadingOverlay('Loading Lead Profile...');
            }
        }
    }, true);
    
    // Override viewLead function to ensure overlay shows
    const originalViewLead = window.viewLead;
    if (originalViewLead) {
        window.viewLead = function(leadId) {
            // Only show overlay if not already visible
            if (!document.getElementById('lead-loading-overlay')) {
                // Check if we're in the leads management view
                const isInLeadsView = document.querySelector('.leads-table, .leads-container, #leadsTable');
                if (isInLeadsView) {
                    showLeadLoadingOverlay('Loading Lead Profile...');
                }
            }
            
            // Call original function
            setTimeout(() => {
                originalViewLead.call(this, leadId);
            }, 50);
        };
    }
    
    // Watch for lead profile modal to hide overlay
    const observer = new MutationObserver((mutations) => {
        // Only check if overlay is visible
        if (!document.getElementById('lead-loading-overlay')) return;
        
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    // Check for lead profile modal
                    if (node.id === 'lead-profile-modal' ||
                        node.id === 'lead-profile-container' ||
                        (node.classList && node.classList.contains('modal-overlay'))) {
                        
                        // Check if it has lead content
                        const hasLeadContent = node.querySelector('.profile-section, .profile-header, #quote-submissions-container');
                        if (hasLeadContent) {
                            console.log('Lead profile detected, hiding overlay');
                            setTimeout(hideLeadLoadingOverlay, 200);
                        } else {
                            // Even without specific content, hide overlay after profile appears
                            console.log('Profile container detected, hiding overlay');
                            setTimeout(hideLeadLoadingOverlay, 500);
                        }
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    console.log('Lead table eye icon overlay system ready - ONLY triggers in lead management table');
    
})();