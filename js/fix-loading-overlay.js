/**
 * Add loading overlay for all view actions (policy, lead, client views)
 */

(function() {
    'use strict';
    
    console.log('Loading overlay fix loaded');
    
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
        
        // Auto-remove after max 10 seconds (failsafe)
        setTimeout(() => {
            if (document.getElementById('global-loading-overlay')) {
                document.getElementById('global-loading-overlay').remove();
            }
        }, 10000);
    };
    
    // Hide loading overlay
    window.hideLoadingOverlay = function() {
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => overlay.remove(), 300);
        }
    };
    
    // Override viewPolicy to show loading immediately
    const originalViewPolicy = window.viewPolicy;
    window.viewPolicy = function(policyId) {
        console.log('Loading policy view with overlay');
        showLoadingOverlay('Loading Policy Details');
        
        // Call original after a tiny delay to ensure overlay shows
        setTimeout(() => {
            if (originalViewPolicy) {
                originalViewPolicy.call(this, policyId);
            }
            // Hide overlay after modal should be ready
            setTimeout(hideLoadingOverlay, 500);
        }, 50);
    };
    
    // Override viewLead if it exists
    if (window.viewLead) {
        const originalViewLead = window.viewLead;
        window.viewLead = function(leadId) {
            showLoadingOverlay('Loading Lead Profile');
            setTimeout(() => {
                originalViewLead.call(this, leadId);
                setTimeout(hideLoadingOverlay, 500);
            }, 50);
        };
    }
    
    // Override viewLeadDetails if it exists
    if (window.viewLeadDetails) {
        const originalViewLeadDetails = window.viewLeadDetails;
        // Store original globally for carrier lookup to use
        window.originalViewLeadDetails = originalViewLeadDetails;

        window.viewLeadDetails = function(leadId) {
            showLoadingOverlay('Loading Lead Details');
            setTimeout(() => {
                originalViewLeadDetails.call(this, leadId);
                setTimeout(hideLoadingOverlay, 500);
            }, 50);
        };
    }
    
    // Override viewClient if it exists
    if (window.viewClient) {
        const originalViewClient = window.viewClient;
        window.viewClient = function(clientId) {
            showLoadingOverlay('Loading Client Profile');
            setTimeout(() => {
                originalViewClient.call(this, clientId);
                setTimeout(hideLoadingOverlay, 500);
            }, 50);
        };
    }
    
    // Override showPolicyDetailsModal to hide overlay when it opens
    const originalShowPolicyDetailsModal = window.showPolicyDetailsModal;
    if (originalShowPolicyDetailsModal) {
        window.showPolicyDetailsModal = function(policy) {
            const result = originalShowPolicyDetailsModal.call(this, policy);
            // Hide overlay once modal is shown
            hideLoadingOverlay();
            return result;
        };
    }
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        #global-loading-overlay {
            animation: fadeIn 0.3s ease;
        }
    `;
    document.head.appendChild(style);
    
    console.log('Loading overlay system installed');
    
})();