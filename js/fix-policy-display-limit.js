// Fix Policy Display Limit Issue
console.log('Policy Display Fix: Addressing 2-policy display limitation');

// Override generatePolicyRows to ensure all policies are displayed
const originalGeneratePolicyRows = window.generatePolicyRows;
window.generatePolicyRows = async function() {
    // Sync with server first so carrier/other fields reflect latest saved data
    let policies = [];
    if (window.loadPoliciesFromServer) {
        try {
            const serverPolicies = await window.loadPoliciesFromServer();
            if (serverPolicies && serverPolicies.length > 0) {
                policies = serverPolicies;
            }
        } catch (e) {
            console.warn('Policy Display Fix: server sync failed, using localStorage', e);
        }
    }
    if (policies.length === 0) {
        policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    }
    console.log(`📊 Policy Display Fix: Found ${policies.length} total policies`);

    // Get current user and check if they are admin
    const sessionData = sessionStorage.getItem('vanguard_user');
    let currentUser = null;
    let isAdmin = false;

    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            currentUser = user.username;
            isAdmin = ['grant', 'maureen'].includes(currentUser.toLowerCase());
            console.log(`🔍 Policy Display Fix - Current user: ${currentUser}, Is Admin: ${isAdmin}`);
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
        console.log(`🔒 Policy Display Fix: Filtered policies: ${originalCount} -> ${policies.length} (showing only ${currentUser}'s policies)`);
    } else if (isAdmin) {
        console.log(`👑 Policy Display Fix: Admin user - showing all ${policies.length} policies`);
    }

    if (policies.length === 0) {
        // Show message when no policies exist
        return `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p style="font-size: 16px; margin: 0;">No policies found</p>
                    <p style="font-size: 14px; margin-top: 8px;">Click "New Policy" to create your first policy</p>
                </td>
            </tr>
        `;
    }

    // Generate rows for actual saved policies - SHOW ALL POLICIES
    return policies.map(policy => {
        // Ensure policy type is available - check multiple possible locations
        const policyType = policy.policyType || policy.type || (policy.overview && policy.overview['Policy Type'] ?
            policy.overview['Policy Type'].toLowerCase().replace(/\s+/g, '-') : 'unknown');

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

        // Check if policy is expired based on expiration date
        let statusClass = window.getStatusClass ? window.getStatusClass(policy.policyStatus || policy.status) : 'badge-secondary';
        let displayStatus = policy.policyStatus || policy.status || 'Active';

        // Override status if policy has expired
        if (policy.expirationDate) {
            const today = new Date();
            const expirationDate = new Date(policy.expirationDate);

            if (expirationDate < today) {
                statusClass = 'pending'; // This will map to orange styling
                displayStatus = 'UPDATE POLICY';
            }
        }

        // Check multiple possible locations for the premium
        const premiumValue = policy.financial?.['Annual Premium'] ||
                            policy.financial?.['Premium'] ||
                            policy.financial?.['Monthly Premium'] ||
                            policy.premium ||
                            policy.monthlyPremium ||
                            policy.annualPremium ||
                            0;

        // Format the premium value
        const premium = typeof premiumValue === 'number' ?
                       `$${premiumValue.toLocaleString()}` :
                       (premiumValue?.toString().startsWith('$') ? premiumValue : `$${premiumValue || '0.00'}`);

        // Get client name - PRIORITY 1: Named Insured from form, PRIORITY 2: clientName, PRIORITY 3: client profile
        let clientName = 'N/A';

        // PRIORITY 1: Check Named Insured tab data first (most accurate)
        if (policy.insured?.['Business Name']) {
            clientName = policy.insured['Business Name'];
        } else if (policy.contact?.['Business Name']) {
            clientName = policy.contact['Business Name'];
        } else if (policy.insured?.['Name/Business Name']) {
            clientName = policy.insured['Name/Business Name'];
        } else if (policy.insured?.['Primary Named Insured']) {
            clientName = policy.insured['Primary Named Insured'];
        } else if (policy.namedInsured?.name) {
            clientName = policy.namedInsured.name;
        } else if (policy.clientName && policy.clientName !== 'N/A' && policy.clientName !== 'Unknown' && policy.clientName !== 'unknown') {
            // PRIORITY 2: Use existing clientName if it's valid
            clientName = policy.clientName;
        } else if (policy.clientId) {
            // PRIORITY 3: Get from client profile using clientId
            const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            const client = clients.find(c => c.id === policy.clientId);
            if (client && client.name && client.name !== 'N/A' && client.name !== 'Unknown') {
                clientName = client.name;
            }
        }

        // Get carrier name — top-level carrier is authoritative; overview.Carrier can be stale
        const carrier = policy.carrier || policy.overview?.['Carrier'] || 'N/A';

        // Get effective and expiration dates
        const effectiveDate = policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString() : 'N/A';
        const expirationDate = policy.expirationDate ? new Date(policy.expirationDate).toLocaleDateString() : 'N/A';

        // Get assigned agent
        const assignedTo = policy.assignedTo ||
                          policy.agent ||
                          policy.assignedAgent ||
                          policy.producer ||
                          'Grant';

        // Get policy number
        const policyNumber = policy.policyNumber || policy.overview?.['Policy Number'] || policy.id || 'N/A';

        return `
            <tr data-policy-id="${policy.id}">
                <td class="policy-number" style="padding-left: 20px;">
                    ${policyNumber}
                </td>
                <td>
                    <span class="policy-type-badge ${badgeClass}">${typeLabel}</span>
                </td>
                <td>
                    ${clientName}
                </td>
                <td>
                    ${carrier}
                </td>
                <td>
                    ${effectiveDate}
                </td>
                <td>
                    ${expirationDate}
                </td>
                <td>
                    ${premium}/yr
                </td>
                <td>
                    ${assignedTo}
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${displayStatus}</span>
                </td>
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

console.log('Policy Display Fix: Override installed - all policies will be displayed');