// Policy Fix - Ensures policies ALWAYS load from server first
console.log('Policy Fix: Script loaded at', new Date().toISOString());
console.log('Policy Fix: Overriding loadPoliciesView to always fetch from server');

// Store the original function
const originalLoadPoliciesView = window.loadPoliciesView;

// Override loadPoliciesView to ALWAYS fetch from server first
window.loadPoliciesView = async function() {
    console.log('Policy Fix: Loading policies view...');

    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

    // Show loading state immediately
    dashboardContent.innerHTML = `
        <div class="policies-view">
            <header class="content-header">
                <h1>Policy Management</h1>
            </header>
            <div style="text-align: center; padding: 60px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #667eea;"></i>
                <p style="margin-top: 20px; color: #6b7280;">Loading policies from server...</p>
            </div>
        </div>
    `;

    try {
        const API_URL = window.location.hostname.includes('nip.io')
            ? `http://${window.location.hostname.split('.')[0]}:3001/api`
            : window.location.hostname === 'localhost'
            ? 'http://localhost:3001/api'
            : 'http://162.220.14.239:3001/api';

        console.log('Policy Fix: Fetching from', API_URL + '/all-data');

        const response = await fetch(`${API_URL}/all-data`);
        if (response.ok) {
            const data = await response.json();
            const serverPolicies = data.policies || [];

            // ALWAYS use server data as source of truth
            localStorage.setItem('insurance_policies', JSON.stringify(serverPolicies));
            console.log(`Policy Fix: Loaded ${serverPolicies.length} policies from server`);
        } else {
            console.error('Policy Fix: Server responded with', response.status);
        }
    } catch (error) {
        console.error('Policy Fix: Error fetching from server:', error);
    }

    // Now call the original function which will use the updated localStorage
    if (originalLoadPoliciesView) {
        originalLoadPoliciesView.call(this);
    }
};

// Also fix generatePolicyRows to handle the data correctly
const originalGeneratePolicyRows = window.generatePolicyRows;
window.generatePolicyRows = function() {
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log(`Policy Fix: Generating rows for ${policies.length} policies`);

    if (policies.length === 0) {
        return `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <div style="color: #9ca3af;">
                        <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 16px;"></i>
                        <p>No policies found</p>
                        <button class="btn-primary" onclick="showNewPolicy()" style="margin-top: 16px;">
                            <i class="fas fa-plus"></i> Create First Policy
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    return policies.map(policy => {
        // Handle different date formats
        let effectiveDate = 'N/A';
        let expirationDate = 'N/A';

        if (policy.effectiveDate) {
            try {
                effectiveDate = new Date(policy.effectiveDate).toLocaleDateString();
            } catch (e) {
                effectiveDate = policy.effectiveDate;
            }
        }

        if (policy.expirationDate) {
            try {
                expirationDate = new Date(policy.expirationDate).toLocaleDateString();
            } catch (e) {
                expirationDate = policy.expirationDate;
            }
        }

        const status = policy.policyStatus || policy.status || 'Unknown';
        const statusClass = status.toLowerCase() === 'active' || status.toLowerCase() === 'in-force' ? 'badge-success' :
                          status.toLowerCase() === 'pending' ? 'badge-warning' : 'badge-secondary';

        // Get premium value from various possible fields
        let premium = policy.premium ||
                     policy.annualPremium ||
                     policy.financial?.['Annual Premium'] ||
                     policy.financial?.['Premium'] ||
                     0;

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

console.log('Policy Fix: Override complete');

// Also handle direct navigation to #policies
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Policy Fix: DOM loaded, checking if on policies page...');

    // Check if we're on the policies page
    if (window.location.hash === '#policies') {
        console.log('Policy Fix: On policies page, ensuring data is loaded...');

        // Check if we have policies in localStorage
        const existingPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

        if (existingPolicies.length === 0) {
            console.log('Policy Fix: No policies in localStorage, fetching from server...');

            const API_URL = window.location.hostname.includes('nip.io')
                ? `http://${window.location.hostname.split('.')[0]}:3001/api`
                : window.location.hostname === 'localhost'
                ? 'http://localhost:3001/api'
                : 'http://162.220.14.239:3001/api';

            try {
                const response = await fetch(`${API_URL}/all-data`);
                if (response.ok) {
                    const data = await response.json();
                    const serverPolicies = data.policies || [];
                    localStorage.setItem('insurance_policies', JSON.stringify(serverPolicies));
                    console.log(`Policy Fix: Loaded ${serverPolicies.length} policies from server on page load`);

                    // Trigger a refresh of the policies view
                    if (window.loadPoliciesView) {
                        window.loadPoliciesView();
                    }
                }
            } catch (error) {
                console.error('Policy Fix: Error loading on page load:', error);
            }
        } else {
            console.log(`Policy Fix: Found ${existingPolicies.length} policies in localStorage`);
        }
    }
});