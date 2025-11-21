// Policy Server Synchronization
// This file overrides the policy loading and saving functions to use server-side storage

console.log('🚫 Policy Server Sync DISABLED to prevent deletePolicy conflicts');
return; // DISABLE ENTIRE FILE TO PREVENT CONFLICTS

// Load policies from server on page load/refresh
window.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, fetching policies from server...');

    try {
        const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io';

        const response = await fetch(`${API_URL}/api/policies`);
        if (response.ok) {
            const serverPolicies = await response.json();

            // Update localStorage with server data
            localStorage.setItem('insurance_policies', JSON.stringify(serverPolicies));
            console.log(`Initial load: ${serverPolicies.length} policies from server`);
        }
    } catch (error) {
        console.error('Error loading initial policies:', error);
    }
});

// Override the loadPoliciesView function to fetch from server
const originalLoadPoliciesView = window.loadPoliciesView;
window.loadPoliciesView = async function() {
    console.log('Loading policies from server...');

    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) {
        // Show loading state
        if (originalLoadPoliciesView) {
            originalLoadPoliciesView.call(this);
        }
        return;
    }

    try {
        // Fetch policies from server
        const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io';

        const response = await fetch(`${API_URL}/api/policies`);
        if (response.ok) {
            const serverPolicies = await response.json();

            // Update localStorage with server data for compatibility
            localStorage.setItem('insurance_policies', JSON.stringify(serverPolicies));
            console.log(`Loaded ${serverPolicies.length} policies from server`);
        } else {
            console.error('Failed to fetch policies from server');
        }
    } catch (error) {
        console.error('Error fetching policies from server:', error);
    }

    // Now call the original function which will use the updated localStorage
    if (originalLoadPoliciesView) {
        originalLoadPoliciesView.call(this);
    }
};

// Override generatePolicyRows to ensure it uses the latest data
const originalGeneratePolicyRows = window.generatePolicyRows;
window.generatePolicyRows = function() {
    // Ensure we have the latest policies
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log(`Generating rows for ${policies.length} policies`);

    if (originalGeneratePolicyRows) {
        return originalGeneratePolicyRows.call(this);
    }

    // Fallback implementation if original doesn't exist
    if (policies.length === 0) {
        return `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <div style="color: #9ca3af;">
                        <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 16px;"></i>
                        <p>No policies found</p>
                    </div>
                </td>
            </tr>
        `;
    }

    return policies.map(policy => {
        const effectiveDate = policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString() : 'N/A';
        const expirationDate = policy.expirationDate ? new Date(policy.expirationDate).toLocaleDateString() : 'N/A';
        const status = policy.policyStatus || policy.status || 'Unknown';
        const statusClass = status.toLowerCase() === 'active' || status.toLowerCase() === 'in-force' ? 'badge-success' :
                          status.toLowerCase() === 'pending' ? 'badge-warning' : 'badge-secondary';

        // Get premium value
        let premium = policy.financial?.['Annual Premium'] ||
                     policy.financial?.['Premium'] ||
                     policy.premium ||
                     policy.annualPremium || 0;

        // Format premium
        if (typeof premium === 'string') {
            premium = premium.replace(/[$,\s]/g, '');
        }
        premium = parseFloat(premium) || 0;
        const formattedPremium = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(premium);

        return `
            <tr>
                <td style="padding-left: 20px;">${policy.policyNumber || 'N/A'}</td>
                <td>${policy.clientName || policy.client || 'N/A'}</td>
                <td>${policy.carrier || 'N/A'}</td>
                <td>${effectiveDate}</td>
                <td>${expirationDate}</td>
                <td>${formattedPremium}</td>
                <td><span class="badge ${statusClass}">${status}</span></td>
                <td>
                    <button class="btn-icon" onclick="viewPolicyDetails('${policy.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="editPolicy('${policy.id}')" title="Edit Policy">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deletePolicy('${policy.id}')" title="Delete Policy">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
};

// DISABLED: Override deletePolicy to prevent conflicts with fix-policy-server-save.js
// const originalDeletePolicy = window.deletePolicy;
// window.deletePolicy = async function(policyId) {
    if (!confirm('Are you sure you want to delete this policy?')) {
        return;
    }

    try {
        // Delete from server
        if (window.DataSync && window.DataSync.deletePolicy) {
            await window.DataSync.deletePolicy(policyId);
            console.log('Policy deleted from server');
        } else {
            // Direct API call as fallback
            const API_URL = window.location.hostname.includes('nip.io')
                ? `http://${window.location.hostname.split('.')[0]}:3001/api`
                : window.location.hostname === 'localhost'
                ? 'http://localhost:3001/api'
                : 'http://162.220.14.239:3001/api';

            const response = await fetch(`${API_URL}/policies/${policyId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log('Policy deleted from server');
            }
        }

        // Also delete from localStorage for immediate UI update
        let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        policies = policies.filter(p => p.id !== policyId);
        localStorage.setItem('insurance_policies', JSON.stringify(policies));

        // Refresh the view
        if (window.loadPoliciesView) {
            window.loadPoliciesView();
        }

        // Show notification
        if (window.showNotification) {
            window.showNotification('Policy deleted successfully', 'success');
        }
    } catch (error) {
        console.error('Error deleting policy:', error);
        if (window.showNotification) {
            window.showNotification('Error deleting policy', 'error');
        }
    }
};

// Auto-sync policies every 10 seconds
setInterval(async () => {
    // Only sync if we're on the policies page
    const dashboardContent = document.querySelector('.dashboard-content');
    if (dashboardContent && dashboardContent.querySelector('.policies-view')) {
        try {
            const API_URL = window.location.hostname.includes('nip.io')
                ? `http://${window.location.hostname.split('.')[0]}:3001/api`
                : window.location.hostname === 'localhost'
                ? 'http://localhost:3001/api'
                : 'http://162.220.14.239:3001/api';

            const response = await fetch(`${API_URL}/api/policies`);
            if (response.ok) {
                const data = await response.json();
                const serverPolicies = data.policies || [];

                // Check if policies have changed
                const currentPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                if (JSON.stringify(serverPolicies) !== JSON.stringify(currentPolicies)) {
                    localStorage.setItem('insurance_policies', JSON.stringify(serverPolicies));
                    console.log('Policies updated from server');

                    // Refresh the table
                    const tableBody = document.getElementById('policyTableBody');
                    if (tableBody && window.generatePolicyRows) {
                        tableBody.innerHTML = window.generatePolicyRows();
                    }
                }
            }
        } catch (error) {
            console.error('Error during auto-sync:', error);
        }
    }
}, 10000);

console.log('Policy Server Sync initialized');