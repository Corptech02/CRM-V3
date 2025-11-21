/**
 * Fix for slow policy view loading - Shows modal immediately with loading state
 */

(function() {
    'use strict';
    
    console.log('Policy view speed fix loaded');
    
    // Store original function
    const originalViewPolicy = window.viewPolicy;
    
    // Override viewPolicy to show modal immediately
    window.viewPolicy = function(policyId) {
        console.log('Fast viewing policy:', policyId);
        
        // Show modal immediately with loading state
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay active';
        modalOverlay.id = 'policyViewModal';
        modalOverlay.style.cssText = 'z-index: 10000;';
        
        modalOverlay.innerHTML = `
            <div class="modal-content" style="max-width: 1200px; width: 95%; max-height: 90vh;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <h2 style="margin: 0; color: #1f2937;">Policy Details</h2>
                        <span class="badge badge-primary" style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px;">Loading...</span>
                    </div>
                    <button class="close-modal" onclick="document.getElementById('policyViewModal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 400px;">
                    <div style="text-align: center;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #3b82f6; margin-bottom: 20px;"></i>
                        <p style="color: #6b7280; font-size: 16px;">Loading policy details...</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add to DOM immediately
        document.body.appendChild(modalOverlay);
        
        // Load policy data asynchronously
        setTimeout(() => {
            try {
                // Get policy from localStorage
                const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                const idStr = String(policyId);
                
                let policy = policies.find(p => {
                    if (String(p.id) === idStr) return true;
                    if (p.policyNumber === idStr) return true;
                    if (p.policyNumber && p.policyNumber.includes(idStr)) return true;
                    if (p.policyNumber && p.policyNumber.endsWith(idStr)) return true;
                    return false;
                });
                
                if (!policy) {
                    // Show error in modal
                    const modalBody = modalOverlay.querySelector('.modal-body');
                    if (modalBody) {
                        modalBody.innerHTML = `
                            <div style="text-align: center; padding: 40px;">
                                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc2626; margin-bottom: 20px;"></i>
                                <p style="color: #dc2626; font-size: 18px; font-weight: 600;">Policy not found</p>
                                <p style="color: #6b7280; margin-top: 10px;">Policy ID: ${policyId}</p>
                                <button onclick="document.getElementById('policyViewModal').remove()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
                            </div>
                        `;
                    }
                    return;
                }
                
                // Remove the loading modal
                modalOverlay.remove();
                
                // Call the original function to show the full modal
                showPolicyDetailsModal(policy);
                
            } catch (error) {
                console.error('Error loading policy:', error);
                const modalBody = modalOverlay.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.innerHTML = `
                        <div style="text-align: center; padding: 40px;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc2626; margin-bottom: 20px;"></i>
                            <p style="color: #dc2626; font-size: 18px; font-weight: 600;">Error loading policy</p>
                            <p style="color: #6b7280; margin-top: 10px;">${error.message}</p>
                            <button onclick="document.getElementById('policyViewModal').remove()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
                        </div>
                    `;
                }
            }
        }, 10); // Minimal delay to show loading state
    };
    
    // Also optimize showPolicyDetailsModal if it exists
    const originalShowPolicyDetailsModal = window.showPolicyDetailsModal;
    if (originalShowPolicyDetailsModal) {
        window.showPolicyDetailsModal = function(policy) {
            console.log('Optimized showPolicyDetailsModal called');
            
            // Use requestAnimationFrame for smoother rendering
            requestAnimationFrame(() => {
                originalShowPolicyDetailsModal.call(this, policy);
            });
        };
    }
    
    console.log('Policy view speed optimization applied');
    
})();