// Fix COI Policy Lookup - Ensure policy data is available for COI email functions
console.log('🔧 Loading COI Policy Lookup Fix...');

// Enhanced policy lookup function that checks multiple sources
async function findPolicy(policyId) {
    console.log('🔍 Looking for policy:', policyId);

    // 1. Check if already loaded in window.currentCOIPolicy
    if (window.currentCOIPolicy && (
        window.currentCOIPolicy.id === policyId ||
        window.currentCOIPolicy.policyNumber === policyId ||
        String(window.currentCOIPolicy.id) === String(policyId)
    )) {
        console.log('✅ Found policy in window.currentCOIPolicy');
        return window.currentCOIPolicy;
    }

    // 2. Check localStorage for insurance_policies
    const localPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    let policy = localPolicies.find(p =>
        p.id === policyId ||
        p.policyNumber === policyId ||
        String(p.id) === String(policyId) ||
        String(p.policyNumber) === String(policyId)
    );

    if (policy) {
        console.log('✅ Found policy in localStorage');
        window.currentCOIPolicy = policy;
        return policy;
    }

    // 3. Load from database via API
    try {
        console.log('🌐 Fetching policy from database...');
        const response = await fetch(`/api/policies/${encodeURIComponent(policyId)}`);
        if (response.ok) {
            const policyData = await response.json();
            if (policyData && policyData.data) {
                const parsedPolicy = typeof policyData.data === 'string' ? JSON.parse(policyData.data) : policyData.data;
                console.log('✅ Found policy in database');
                window.currentCOIPolicy = parsedPolicy;
                return parsedPolicy;
            }
        }
    } catch (error) {
        console.error('❌ Database lookup failed:', error);
    }

    // 4. Try alternative ID formats (in case of mismatched IDs)
    console.log('🔄 Trying alternative lookups...');

    // Check if policyId might be a client reference
    const allPolicies = localPolicies;
    for (const p of allPolicies) {
        if (p.clientId === policyId || p.clientName === policyId) {
            console.log('✅ Found policy by client reference');
            window.currentCOIPolicy = p;
            return p;
        }
    }

    console.log('❌ Policy not found anywhere');
    return null;
}

// Enhanced emailCOI function with proper policy lookup
const originalEmailCOI = window.emailCOI;
window.emailCOI = async function(policyId) {
    console.log('📧 emailCOI called with policyId:', policyId);

    try {
        // First ensure we have the policy data
        const policy = await findPolicy(policyId);

        if (!policy) {
            // Show helpful error message
            const errorMsg = `Policy not found (ID: ${policyId})\n\nPossible solutions:\n1. Make sure you're viewing the policy details first\n2. Try refreshing the page\n3. Check if the policy exists in your system`;
            alert(errorMsg);
            return;
        }

        // Set the current policy globally
        window.currentCOIPolicy = policy;

        console.log('✅ Policy loaded for COI email:', policy.policyNumber || policy.id);

        // Call the original function if it exists, otherwise use titan version
        if (originalEmailCOI && typeof originalEmailCOI === 'function') {
            return originalEmailCOI(policyId);
        } else if (window.titanEmailCOI && typeof window.titanEmailCOI === 'function') {
            return window.titanEmailCOI(policyId);
        } else {
            // Fallback - just show compose with loaded policy
            if (window.showCOIEmailCompose) {
                return window.showCOIEmailCompose(policyId, policy);
            } else {
                alert('COI email system not properly loaded. Please refresh the page.');
            }
        }

    } catch (error) {
        console.error('❌ Error in emailCOI:', error);
        alert(`Error preparing COI email: ${error.message}`);
    }
};

// Enhanced emailACORD function with proper policy lookup
const originalEmailACORD = window.emailACORD;
window.emailACORD = async function(policyId) {
    console.log('📧 emailACORD called with policyId:', policyId);

    try {
        // First ensure we have the policy data
        const policy = await findPolicy(policyId);

        if (!policy) {
            const errorMsg = `Policy not found (ID: ${policyId})\n\nPossible solutions:\n1. Make sure you're viewing the policy details first\n2. Try refreshing the page\n3. Check if the policy exists in your system`;
            alert(errorMsg);
            return;
        }

        // Set the current policy globally
        window.currentCOIPolicy = policy;

        console.log('✅ Policy loaded for ACORD email:', policy.policyNumber || policy.id);

        // Call the original function if it exists, otherwise use titan version
        if (originalEmailACORD && typeof originalEmailACORD === 'function') {
            return originalEmailACORD(policyId);
        } else if (window.titanEmailACORD && typeof window.titanEmailACORD === 'function') {
            return window.titanEmailACORD(policyId);
        } else {
            // Fallback - just show compose with loaded policy
            if (window.showCOIEmailCompose) {
                return window.showCOIEmailCompose(policyId, policy);
            } else {
                alert('ACORD email system not properly loaded. Please refresh the page.');
            }
        }

    } catch (error) {
        console.error('❌ Error in emailACORD:', error);
        alert(`Error preparing ACORD email: ${error.message}`);
    }
};

// Add API endpoint handler to server.js if it doesn't exist
// This ensures we can fetch individual policies from the database

// Lock down the functions to prevent other scripts from overriding
Object.defineProperty(window, 'findPolicy', {
    value: findPolicy,
    writable: false,
    configurable: false
});

console.log('✅ COI Policy Lookup Fix loaded');
console.log('🎯 emailCOI and emailACORD functions now have enhanced policy lookup');
console.log('📋 Functions will now:');
console.log('  1. Check window.currentCOIPolicy first');
console.log('  2. Check localStorage for policies');
console.log('  3. Fetch from database if needed');
console.log('  4. Show helpful error messages if policy not found');