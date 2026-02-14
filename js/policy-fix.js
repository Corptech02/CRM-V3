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

        // Try policies endpoint first, fallback to all-data
        let serverPolicies = [];

        try {
            const policiesResponse = await fetch(`${API_URL}/policies`);
            if (policiesResponse.ok) {
                serverPolicies = await policiesResponse.json();
                console.log(`Policy Fix: Loaded ${serverPolicies.length} policies from /policies endpoint`);
            } else {
                throw new Error('Policies endpoint failed');
            }
        } catch (policiesError) {
            console.log('Policy Fix: Trying all-data endpoint as fallback...');
            const response = await fetch(`${API_URL}/all-data`);
            if (response.ok) {
                const data = await response.json();
                // Handle nested policies structure
                serverPolicies = data.policies || [];

                // Check if policies is nested (contains another policies array)
                if (serverPolicies.length > 0 && serverPolicies[0].policies) {
                    serverPolicies = serverPolicies[0].policies;
                    console.log(`Policy Fix: Found nested policies structure, extracted ${serverPolicies.length} policies`);
                }

                console.log(`Policy Fix: Loaded ${serverPolicies.length} policies from /all-data endpoint`);
            }
        }

        // ALWAYS use server data as source of truth
        if (serverPolicies && serverPolicies.length > 0) {
            localStorage.setItem('insurance_policies', JSON.stringify(serverPolicies));
            console.log(`Policy Fix: Successfully stored ${serverPolicies.length} policies to localStorage`);
        } else {
            console.error('Policy Fix: No policies found or failed to fetch from server');
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
    let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log(`Policy Fix: Generating rows for ${policies.length} policies`);

    // Get current user and check if they are admin
    const sessionData = sessionStorage.getItem('vanguard_user');
    let currentUser = null;
    let isAdmin = false;

    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            currentUser = user.username;
            isAdmin = ['grant', 'maureen'].includes(currentUser.toLowerCase());
            console.log(`🔍 Policy Fix - Current user: ${currentUser}, Is Admin: ${isAdmin}`);
        } catch (error) {
            console.error('Error parsing session data:', error);
        }
    }

    // Filter policies based on user role (same as client filtering logic)
    if (!isAdmin && currentUser) {
        const originalCount = policies.length;
        policies = policies.filter(policy => {
            const assignedTo = policy.assignedTo ||
                              policy.agent ||
                              policy.assignedAgent ||
                              policy.producer ||
                              'Grant'; // Default to Grant if no assignment
            return assignedTo.toLowerCase() === currentUser.toLowerCase();
        });
        console.log(`🔒 Policy Fix: Filtered policies: ${originalCount} -> ${policies.length} (showing only ${currentUser}'s policies)`);
    } else if (isAdmin) {
        console.log(`👑 Policy Fix: Admin user - showing all ${policies.length} policies`);
    }

    if (policies.length === 0) {
        return `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px;">
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

        // Get policy type and badge styling
        const policyType = policy.policyType || policy.type || 'unknown';

        // Helper functions for policy type labels and badges
        function getPolicyTypeLabel(type) {
            if (!type || type === 'unknown') return 'Unknown';
            const normalizedType = type.toString().toLowerCase();
            const labels = {
                'personal-auto': 'Personal Auto',
                'commercial-auto': 'Commercial Auto',
                'homeowners': 'Homeowners',
                'commercial-property': 'Commercial Property',
                'general-liability': 'General Liability',
                'professional-liability': 'Professional Liability',
                'workers-comp': 'Workers Compensation',
                'umbrella': 'Umbrella',
                'life': 'Life',
                'health': 'Health'
            };
            return labels[normalizedType] || type;
        }

        function getBadgeClass(type) {
            if (!type) return 'badge-gray';
            const typeStr = type.toString().toLowerCase();
            if (typeStr.includes('commercial')) return 'badge-orange';
            if (typeStr.includes('auto')) return 'badge-blue';
            if (typeStr.includes('home')) return 'badge-green';
            if (typeStr.includes('liability')) return 'badge-purple';
            return 'badge-gray';
        }

        const typeLabel = getPolicyTypeLabel(policyType);
        const badgeClass = getBadgeClass(policyType);

        // Get client name with same logic as main function
        let clientName = 'N/A';
        if (policy.insured?.['Name/Business Name']) {
            clientName = policy.insured['Name/Business Name'];
        } else if (policy.insured?.['Primary Named Insured']) {
            clientName = policy.insured['Primary Named Insured'];
        } else if (policy.namedInsured?.name) {
            clientName = policy.namedInsured.name;
        } else if (policy.clientName && policy.clientName !== 'N/A' && policy.clientName !== 'Unknown' && policy.clientName !== 'unknown') {
            clientName = policy.clientName;
        }

        // Get assigned agent
        const assignedTo = policy.assignedTo || policy.agent || policy.assignedAgent || policy.producer || 'Grant';

        return `
            <tr>
                <td class="policy-number" style="padding-left: 20px;">${policy.policyNumber || 'N/A'}</td>
                <td><span class="policy-type-badge ${badgeClass}">${typeLabel}</span></td>
                <td>${clientName}</td>
                <td>${policy.carrier || 'N/A'}</td>
                <td>${effectiveDate}</td>
                <td>${expirationDate}</td>
                <td>${formattedPremium}/yr</td>
                <td>${assignedTo}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="viewPolicy('${policy.id}')" title="View Policy">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="editPolicy('${policy.id}')" title="Edit Policy">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="deletePolicy('${policy.id}')" title="Delete Policy">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
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