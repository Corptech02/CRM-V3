// Debug Policy Modal - Find which modal is actually being used
console.log('🔍 Debug Policy Modal loaded');

// Override and trace all policy-related functions
const originalEditPolicy = window.editPolicy;
window.editPolicy = function(policyId) {
    console.log('🎯 editPolicy called with:', policyId);

    if (originalEditPolicy) {
        return originalEditPolicy(policyId);
    }
};

const originalShowPolicyModal = window.showPolicyModal;
window.showPolicyModal = function(existingPolicy) {
    console.log('🎯 showPolicyModal called with policy:', existingPolicy?.policyNumber || existingPolicy?.id);

    if (originalShowPolicyModal) {
        return originalShowPolicyModal(existingPolicy);
    }
};

console.log('🔍 Debug Policy Modal ready');
