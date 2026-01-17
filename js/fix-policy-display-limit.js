// Fix Policy Display Limit Issue
console.log('Policy Display Fix: Addressing 2-policy display limitation');

// Override generatePolicyRows to ensure all policies are displayed
const originalGeneratePolicyRows = window.generatePolicyRows;
window.generatePolicyRows = function() {
    let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
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
            // Default to admin view if session parsing fails
            isAdmin = true;
        }
    } else {
        // Default to admin view if no session data
        isAdmin = true;
        console.log('🔍 Policy Display Fix - No session data, defaulting to admin view');
    }

    // For debugging: always show all policies for now
    console.log(`📊 Policy Display Fix: Showing all ${policies.length} policies (debug mode)`);

    if (policies.length === 0) {
        // Show message when no policies exist
        return `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
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
        const typeLabel = window.getPolicyTypeLabel ? window.getPolicyTypeLabel(policyType) : policyType;
        const badgeClass = window.getBadgeClass ? window.getBadgeClass(policyType) : 'badge-secondary';

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
        if (policy.insured?.['Name/Business Name']) {
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

        // Get carrier name
        const carrier = policy.overview?.['Carrier'] || policy.carrier || 'N/A';

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
                <td style="padding-left: 20px;">
                    <span class="policy-number">${policyNumber}</span>
                    <div class="policy-type-badge ${badgeClass}">${typeLabel}</div>
                </td>
                <td>
                    <span class="client-name">${clientName}</span>
                </td>
                <td>
                    <span class="carrier-name">${carrier}</span>
                </td>
                <td>
                    <span class="effective-date">${effectiveDate}</span>
                </td>
                <td>
                    <span class="expiration-date">${expirationDate}</span>
                </td>
                <td>
                    <span class="premium-amount">${premium}</span>
                </td>
                <td>
                    <span class="assigned-agent">${assignedTo}</span>
                </td>
                <td>
                    <span class="badge ${statusClass}">${displayStatus}</span>
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