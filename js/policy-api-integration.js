// Policy Management API Integration
console.log('Loading Policy API Integration...');

document.addEventListener('DOMContentLoaded', function() {
    initializePolicyAPIIntegration();
});

function initializePolicyAPIIntegration() {
    console.log('Policy API Integration Ready');

    // Override policy loading functions
    if (window.loadPolicyList) {
        const originalLoadPolicyList = window.loadPolicyList;
        window.loadPolicyList = async function() {
            console.log('Loading policies from comprehensive API...');

            try {
                // Use API service to get policies
                if (window.apiService && window.apiService.getPolicies) {
                    const policies = await window.apiService.getPolicies();
                    console.log(`Loaded ${policies.length} policies from API`);

                    // Store in localStorage for compatibility
                    localStorage.setItem('insurance_policies', JSON.stringify(policies));
                    localStorage.setItem('policies', JSON.stringify(policies));

                    // Update the policy list display
                    displayPolicyList(policies);
                } else {
                    // Fall back to original function
                    originalLoadPolicyList();
                }
            } catch (error) {
                console.error('Failed to load policies from API:', error);
                // Fall back to original function
                originalLoadPolicyList();
            }
        };
    }

    // Override policy creation
    if (window.savePolicyForClient) {
        const originalSavePolicyForClient = window.savePolicyForClient;
        window.savePolicyForClient = async function(clientId) {
            try {
                // Get policy data from the form
                const policyData = collectPolicyDataFromForm();

                if (!policyData) {
                    console.error('No policy data collected');
                    return;
                }

                // Add client association
                policyData.client_id = clientId;
                policyData.policy_holder = getPolicyHolderName(clientId);

                // Use API service to create policy
                if (window.apiService && window.apiService.createPolicy) {
                    const newPolicy = await window.apiService.createPolicy(policyData);
                    console.log('Policy created via API:', newPolicy);

                    // Show success message
                    if (window.showNotification) {
                        window.showNotification('Policy created successfully!', 'success');
                    }

                    // Refresh policy displays
                    if (window.loadPolicyList) {
                        window.loadPolicyList();
                    }

                    // Close modal if it exists
                    const modal = document.getElementById('policyModal');
                    if (modal) {
                        modal.style.display = 'none';
                    }

                } else {
                    // Fall back to original function
                    originalSavePolicyForClient(clientId);
                }

            } catch (error) {
                console.error('Failed to save policy via API:', error);
                if (window.showNotification) {
                    window.showNotification('Failed to save policy: ' + error.message, 'error');
                }

                // Fall back to original function
                originalSavePolicyForClient(clientId);
            }
        };
    }

    // Override generic policy saving
    if (window.collectPolicyData) {
        const originalCollectPolicyData = window.collectPolicyData;
        window.collectPolicyData = function() {
            // Use the enhanced data collection
            return collectPolicyDataFromForm() || originalCollectPolicyData();
        };
    }

    console.log('✅ Policy API Integration initialized');
}

// Enhanced policy data collection from form
function collectPolicyDataFromForm() {
    try {
        // Get form elements
        const policyTypeEl = document.getElementById('policyType') || document.querySelector('select[name="policyType"]');
        const carrierEl = document.getElementById('carrierName') || document.querySelector('input[name="carrier"]');
        const policyNumberEl = document.getElementById('policyNumber') || document.querySelector('input[name="policyNumber"]');
        const startDateEl = document.getElementById('effectiveDate') || document.querySelector('input[name="startDate"]');
        const endDateEl = document.getElementById('expirationDate') || document.querySelector('input[name="endDate"]');
        const premiumEl = document.getElementById('monthlyPremium') || document.querySelector('input[name="premium"]');
        const coverageEl = document.getElementById('coverageAmount') || document.querySelector('input[name="coverage"]');
        const deductibleEl = document.getElementById('deductible') || document.querySelector('input[name="deductible"]');

        if (!policyTypeEl || !carrierEl) {
            console.warn('Required policy form elements not found');
            return null;
        }

        const policyData = {
            id: `POLICY_${Date.now()}`,
            policy_type: policyTypeEl.value || 'Commercial Auto',
            carrier: carrierEl.value || 'Unknown Carrier',
            policy_number: policyNumberEl ? policyNumberEl.value : `POL-${Date.now()}`,
            start_date: startDateEl ? startDateEl.value : new Date().toISOString().split('T')[0],
            end_date: endDateEl ? endDateEl.value : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            premium: parseFloat((premiumEl ? premiumEl.value : '0').replace(/[$,]/g, '')) || 0,
            coverage_amount: parseFloat((coverageEl ? coverageEl.value : '1000000').replace(/[$,]/g, '')) || 1000000,
            deductible: parseFloat((deductibleEl ? deductibleEl.value : '1000').replace(/[$,]/g, '')) || 1000,
            status: 'Active',
            created_date: new Date().toISOString(),
            created_by: getCurrentUserName()
        };

        // Add additional fields if available
        const agentEl = document.getElementById('agent') || document.querySelector('input[name="agent"]');
        if (agentEl) {
            policyData.agent = agentEl.value;
        }

        const notesEl = document.getElementById('policyNotes') || document.querySelector('textarea[name="notes"]');
        if (notesEl) {
            policyData.notes = notesEl.value;
        }

        console.log('Collected policy data:', policyData);
        return policyData;

    } catch (error) {
        console.error('Error collecting policy data:', error);
        return null;
    }
}

// Display policy list in the UI
function displayPolicyList(policies) {
    const policyList = document.getElementById('policyList');
    if (!policyList) return;

    if (policies.length === 0) {
        policyList.innerHTML = `
            <div class="no-policies">
                <p>No policies found. Create your first policy to get started.</p>
            </div>
        `;
        return;
    }

    policyList.innerHTML = policies.map(policy => `
        <div class="policy-item" onclick="viewPolicyProfile('${policy.id}')">
            <div class="policy-header">
                <h4>${policy.policy_type || 'Unknown Type'}</h4>
                <span class="policy-status status-${(policy.status || 'active').toLowerCase()}">
                    ${policy.status || 'Active'}
                </span>
            </div>
            <div class="policy-details">
                <div class="policy-info">
                    <strong>Policy #:</strong> ${policy.policy_number || 'N/A'}
                </div>
                <div class="policy-info">
                    <strong>Carrier:</strong> ${policy.carrier || 'Unknown'}
                </div>
                <div class="policy-info">
                    <strong>Premium:</strong> $${(policy.premium || 0).toLocaleString()}/month
                </div>
                <div class="policy-info">
                    <strong>Expires:</strong> ${policy.end_date ? new Date(policy.end_date).toLocaleDateString() : 'N/A'}
                </div>
            </div>
        </div>
    `).join('');
}

// Get current user name
function getCurrentUserName() {
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        return userInfo.full_name || userInfo.username || 'System User';
    } catch {
        return 'System User';
    }
}

// Get policy holder name from client ID
function getPolicyHolderName(clientId) {
    try {
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const client = clients.find(c => c.id === clientId);
        if (client) {
            return `${client.firstName || ''} ${client.lastName || ''}`.trim();
        }
        return 'Unknown Client';
    } catch {
        return 'Unknown Client';
    }
}

// Enhanced policy profile viewer
function viewPolicyProfile(policyId) {
    console.log('Viewing policy profile:', policyId);

    // Get policy data
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p => p.id === policyId);

    if (!policy) {
        console.error('Policy not found:', policyId);
        return;
    }

    // Create enhanced policy profile modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2>Policy Profile - ${policy.policy_type || 'Unknown Type'}</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="policy-profile-grid">
                    <div class="policy-section">
                        <h3>Policy Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Policy Number:</label>
                                <span>${policy.policy_number || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Carrier:</label>
                                <span>${policy.carrier || 'Unknown'}</span>
                            </div>
                            <div class="info-item">
                                <label>Type:</label>
                                <span>${policy.policy_type || 'Unknown'}</span>
                            </div>
                            <div class="info-item">
                                <label>Status:</label>
                                <span class="status-badge status-${(policy.status || 'active').toLowerCase()}">
                                    ${policy.status || 'Active'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="policy-section">
                        <h3>Coverage Details</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Coverage Amount:</label>
                                <span>$${(policy.coverage_amount || 0).toLocaleString()}</span>
                            </div>
                            <div class="info-item">
                                <label>Deductible:</label>
                                <span>$${(policy.deductible || 0).toLocaleString()}</span>
                            </div>
                            <div class="info-item">
                                <label>Monthly Premium:</label>
                                <span>$${(policy.premium || 0).toLocaleString()}</span>
                            </div>
                            <div class="info-item">
                                <label>Annual Premium:</label>
                                <span>$${((policy.premium || 0) * 12).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div class="policy-section">
                        <h3>Policy Period</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Effective Date:</label>
                                <span>${policy.start_date ? new Date(policy.start_date).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Expiration Date:</label>
                                <span>${policy.end_date ? new Date(policy.end_date).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Policy Holder:</label>
                                <span>${policy.policy_holder || 'Unknown'}</span>
                            </div>
                            <div class="info-item">
                                <label>Agent:</label>
                                <span>${policy.agent || getCurrentUserName()}</span>
                            </div>
                        </div>
                    </div>

                    ${policy.notes ? `
                    <div class="policy-section">
                        <h3>Notes</h3>
                        <div class="notes-content">
                            ${policy.notes}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <div class="policy-actions">
                    <button class="btn-primary" onclick="editPolicy('${policy.id}')">
                        <i class="fas fa-edit"></i> Edit Policy
                    </button>
                    <button class="btn-secondary" onclick="renewPolicy('${policy.id}')">
                        <i class="fas fa-sync"></i> Renew Policy
                    </button>
                    <button class="btn-success" onclick="generateCOI('${policy.id}')">
                        <i class="fas fa-certificate"></i> Generate COI
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Make functions globally available
window.collectPolicyDataFromForm = collectPolicyDataFromForm;
window.displayPolicyList = displayPolicyList;
window.viewPolicyProfile = viewPolicyProfile;

console.log('✅ Policy API Integration loaded');