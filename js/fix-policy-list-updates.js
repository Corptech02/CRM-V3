// Fix Policy List Updates in Lead Management
console.log('Applying policy list update fixes...');

// Enhanced showLeadProfile function with policy list
window.showLeadProfileWithPolicies = function(leadId) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        showNotification('Lead not found', 'error');
        return;
    }

    const dashboardContent = document.querySelector('.dashboard-content');

    // Get all policies and filter for this lead
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const leadPolicies = allPolicies.filter(policy => {
        // Match by lead ID
        if (policy.leadId && String(policy.leadId) === String(leadId)) {
            return true;
        }
        // Match by insured name
        const insuredName = policy.insured?.['Name/Business Name'] ||
                           policy.insured?.['Primary Named Insured'] ||
                           policy.insuredName;
        if (insuredName && lead.name && insuredName.toLowerCase() === lead.name.toLowerCase()) {
            return true;
        }
        return false;
    });

    console.log(`Found ${leadPolicies.length} policies for lead ${lead.name}`);

    // Generate policy list HTML with proper colors
    const generatePolicyList = (policies) => {
        if (!policies || policies.length === 0) {
            return `
                <div class="empty-state" style="padding: 40px; text-align: center; color: #6b7280;">
                    <i class="fas fa-file-alt" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p style="margin: 0;">No policies attached</p>
                    <button class="btn-primary" onclick="attachPolicy(${leadId})" style="margin-top: 16px;">
                        <i class="fas fa-plus"></i> Attach Policy
                    </button>
                </div>
            `;
        }

        return `
            <table class="data-table" style="margin-top: 20px;">
                <thead>
                    <tr>
                        <th>Policy Number</th>
                        <th>Type</th>
                        <th>Premium</th>
                        <th>Status</th>
                        <th>Win/Loss</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${policies.map(policy => {
                        // Get premium value from various possible locations
                        let premiumValue = 0;
                        if (policy.financial) {
                            premiumValue = policy.financial['Annual Premium'] ||
                                          policy.financial['Premium'] ||
                                          policy.financial.annualPremium ||
                                          policy.financial.premium || 0;
                        }
                        if (!premiumValue) {
                            premiumValue = policy['Annual Premium'] ||
                                          policy.Premium ||
                                          policy.premium ||
                                          policy.annualPremium || 0;
                        }

                        // Convert to number
                        const numericPremium = typeof premiumValue === 'string' ?
                            parseFloat(premiumValue.replace(/[$,]/g, '')) || 0 :
                            parseFloat(premiumValue) || 0;

                        // Get win/loss status and determine color
                        const winLossStatus = policy.winLoss || policy.status || '';
                        const statusColor = winLossStatus.toLowerCase() === 'win' ? '#10b981' :
                                          winLossStatus.toLowerCase() === 'loss' ? '#ef4444' :
                                          '#6b7280';

                        return `
                            <tr data-policy-id="${policy.id || policy.policyNumber}">
                                <td>
                                    <span style="color: #3b82f6; cursor: pointer;" onclick="viewPolicy('${policy.id || policy.policyNumber}')">
                                        ${policy.policyNumber || 'N/A'}
                                    </span>
                                </td>
                                <td>${policy.type || policy.policyType || 'N/A'}</td>
                                <td class="policy-premium">$${numericPremium.toLocaleString()}</td>
                                <td>
                                    <span class="status-badge ${policy.status || 'active'}">
                                        ${policy.status || 'Active'}
                                    </span>
                                </td>
                                <td>
                                    <span class="win-loss-badge" style="
                                        background: ${statusColor}20;
                                        color: ${statusColor};
                                        padding: 4px 12px;
                                        border-radius: 4px;
                                        font-weight: 500;
                                        display: inline-block;
                                    ">
                                        ${winLossStatus || 'Pending'}
                                    </span>
                                </td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn-icon" onclick="viewPolicy('${policy.id || policy.policyNumber}')" title="View Policy">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn-icon" onclick="editPolicy('${policy.id || policy.policyNumber}')" title="Edit Policy">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-icon" onclick="detachPolicy('${policy.id || policy.policyNumber}', ${leadId})" title="Detach Policy" style="color: #dc2626;">
                                            <i class="fas fa-unlink"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div style="margin-top: 20px;">
                <button class="btn-primary" onclick="attachPolicy(${leadId})">
                    <i class="fas fa-plus"></i> Attach Policy
                </button>
            </div>
        `;
    };

    dashboardContent.innerHTML = `
        <div class="lead-profile" data-lead-id="${lead.id}">
            <header class="content-header">
                <div>
                    <button class="btn-text" onclick="loadLeadsView()">
                        <i class="fas fa-arrow-left"></i> Back to Leads
                    </button>
                    <h1>Lead Profile: ${lead.name}</h1>
                </div>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="editLead(${lead.id})">
                        <i class="fas fa-edit"></i> Edit Lead
                    </button>
                    <button class="btn-danger" onclick="deleteLead(${lead.id})">
                        <i class="fas fa-trash"></i> Delete Lead
                    </button>
                    <button class="btn-primary" onclick="convertLead(${lead.id})">
                        <i class="fas fa-user-check"></i> Convert to Client
                    </button>
                </div>
            </header>

            <div class="profile-grid">
                <!-- Lead Information -->
                <div class="profile-section">
                    <h2><i class="fas fa-user"></i> Lead Information</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Name</label>
                            <p>${lead.name}</p>
                        </div>
                        <div class="info-item">
                            <label>Phone</label>
                            <p>${lead.phone}</p>
                        </div>
                        <div class="info-item">
                            <label>Email</label>
                            <p>${lead.email}</p>
                        </div>
                        <div class="info-item">
                            <label>Product Interest</label>
                            <p>${lead.product}</p>
                        </div>
                        <div class="info-item">
                            <label>Stage</label>
                            <p>${window.getStageHtml ? window.getStageHtml(lead.stage) : lead.stage}</p>
                        </div>
                        <div class="info-item">
                            <label>Assigned To</label>
                            <p>${lead.assignedTo || 'Unassigned'}</p>
                        </div>
                    </div>
                </div>

                <!-- Policies Attached Section -->
                <div class="profile-section">
                    <div class="section-header">
                        <h2><i class="fas fa-file-contract"></i> Policies Attached (${leadPolicies.length})</h2>
                        <div style="display: flex; gap: 20px; align-items: center;">
                            <div style="font-size: 14px; color: #6b7280;">
                                Total Premium: <strong style="color: #10b981; font-size: 18px;">
                                    $${leadPolicies.reduce((sum, p) => {
                                        let premium = 0;
                                        if (p.financial) {
                                            premium = p.financial['Annual Premium'] || p.financial.premium || 0;
                                        }
                                        if (!premium) {
                                            premium = p.premium || p.annualPremium || 0;
                                        }
                                        const numeric = typeof premium === 'string' ?
                                            parseFloat(premium.replace(/[$,]/g, '')) || 0 :
                                            parseFloat(premium) || 0;
                                        return sum + numeric;
                                    }, 0).toLocaleString()}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div class="policies-list" id="policiesList">
                        ${generatePolicyList(leadPolicies)}
                    </div>
                </div>

                <!-- Activity Timeline -->
                <div class="profile-section">
                    <h2><i class="fas fa-history"></i> Activity Timeline</h2>
                    <div class="timeline">
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <h4>Lead Created</h4>
                                <p>Lead was created on ${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</p>
                                <span class="timeline-date">${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notes Section -->
                <div class="profile-section">
                    <div class="section-header">
                        <h2><i class="fas fa-sticky-note"></i> Notes</h2>
                        <button class="btn-secondary" onclick="addNote(${lead.id})">
                            <i class="fas fa-plus"></i> Add Note
                        </button>
                    </div>
                    <div class="notes-list">
                        ${lead.notes && Array.isArray(lead.notes) && lead.notes.length > 0 ? lead.notes.map(note => `
                            <div class="note-item">
                                <div class="note-header">
                                    <strong>${note.author || lead.assignedTo}</strong>
                                    <span class="note-date">${note.date || 'Today'}</span>
                                </div>
                                <p>${note.text}</p>
                            </div>
                        `).join('') : `
                            <div class="note-item">
                                <p style="color: #6b7280;">No notes yet</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Update the lead profile after any policy changes
    window.refreshPolicyList = function(leadId) {
        const policiesSection = document.querySelector('#policiesList');
        if (policiesSection) {
            const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            const leadPolicies = allPolicies.filter(policy => {
                if (policy.leadId && String(policy.leadId) === String(leadId)) {
                    return true;
                }
                const lead = leads.find(l => String(l.id) === String(leadId));
                if (lead) {
                    const insuredName = policy.insured?.['Name/Business Name'] ||
                                       policy.insured?.['Primary Named Insured'] ||
                                       policy.insuredName;
                    if (insuredName && lead.name && insuredName.toLowerCase() === lead.name.toLowerCase()) {
                        return true;
                    }
                }
                return false;
            });

            policiesSection.innerHTML = generatePolicyList(leadPolicies);

            // Update total premium display
            const totalPremium = leadPolicies.reduce((sum, p) => {
                let premium = 0;
                if (p.financial) {
                    premium = p.financial['Annual Premium'] || p.financial.premium || 0;
                }
                if (!premium) {
                    premium = p.premium || p.annualPremium || 0;
                }
                const numeric = typeof premium === 'string' ?
                    parseFloat(premium.replace(/[$,]/g, '')) || 0 :
                    parseFloat(premium) || 0;
                return sum + numeric;
            }, 0);

            const totalPremiumElement = document.querySelector('.section-header strong');
            if (totalPremiumElement) {
                totalPremiumElement.textContent = '$' + totalPremium.toLocaleString();
            }

            // Update policy count
            const policyCountElement = document.querySelector('.section-header h2');
            if (policyCountElement && policyCountElement.textContent.includes('Policies Attached')) {
                policyCountElement.innerHTML = `<i class="fas fa-file-contract"></i> Policies Attached (${leadPolicies.length})`;
            }
        }
    };
};

// DO NOT override the existing functions - just enhance them
// window.viewLead = window.showLeadProfileWithPolicies;

// DO NOT override showLeadProfile - keep the original
// if (window.showLeadProfile) {
//     window.showLeadProfile = window.showLeadProfileWithPolicies;
// }

// Function to update policy display after changes
window.updatePolicyDisplay = function(policyId) {
    console.log('Updating policy display for:', policyId);

    // Get the current lead ID from the profile if visible
    const leadProfile = document.querySelector('.lead-profile');
    if (leadProfile) {
        const leadId = leadProfile.dataset.leadId;
        if (leadId) {
            console.log('Refreshing policy list for lead:', leadId);
            window.refreshPolicyList(leadId);
        }
    }

    // Also refresh the leads view if visible
    const leadsView = document.querySelector('.leads-view');
    if (leadsView) {
        console.log('Refreshing leads view...');
        loadLeadsView();
    }

    // Also refresh the clients view if visible
    const clientsView = document.querySelector('.clients-view');
    if (clientsView) {
        console.log('Refreshing clients view...');
        loadClientsView();
    }
};

// Hook into the save policy function to trigger updates
const originalSavePolicy = window.savePolicy;
if (originalSavePolicy) {
    window.savePolicy = function() {
        const result = originalSavePolicy.apply(this, arguments);

        // Get the policy ID from the modal
        const modal = document.getElementById('policyModal');
        if (modal) {
            const policyId = modal.dataset.policyId;
            setTimeout(() => {
                window.updatePolicyDisplay(policyId);
            }, 100);
        }

        return result;
    };
}

// Function to attach a policy to a lead
window.attachPolicy = function(leadId) {
    // Get available policies
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => String(l.id) === String(leadId));

    if (!lead) {
        showNotification('Lead not found', 'error');
        return;
    }

    // Filter policies that are not already attached
    const unattachedPolicies = allPolicies.filter(policy => {
        return !policy.leadId || String(policy.leadId) !== String(leadId);
    });

    if (unattachedPolicies.length === 0) {
        showNotification('No available policies to attach', 'info');
        return;
    }

    // Create modal for selecting policy
    const modalHTML = `
        <div class="modal-overlay active" id="attachPolicyModal">
            <div class="modal-container">
                <div class="modal-header">
                    <h2>Attach Policy to ${lead.name}</h2>
                    <button class="close-btn" onclick="document.getElementById('attachPolicyModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Select Policy</label>
                        <select class="form-control" id="policyToAttach" style="width: 100%;">
                            <option value="">Select a policy...</option>
                            ${unattachedPolicies.map(policy => `
                                <option value="${policy.id || policy.policyNumber}">
                                    ${policy.policyNumber} - ${policy.type || policy.policyType || 'Unknown Type'} - $${policy.premium || 0}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="document.getElementById('attachPolicyModal').remove()">Cancel</button>
                    <button class="btn-primary" onclick="confirmAttachPolicy('${leadId}')">Attach Policy</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// Function to confirm policy attachment
window.confirmAttachPolicy = function(leadId) {
    const policySelect = document.getElementById('policyToAttach');
    const policyId = policySelect.value;

    if (!policyId) {
        showNotification('Please select a policy', 'error');
        return;
    }

    // Update the policy with lead ID
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policyIndex = policies.findIndex(p => (p.id || p.policyNumber) === policyId);

    if (policyIndex !== -1) {
        policies[policyIndex].leadId = leadId;
        localStorage.setItem('insurance_policies', JSON.stringify(policies));

        // Close modal
        document.getElementById('attachPolicyModal').remove();

        // Refresh the policy list
        window.refreshPolicyList(leadId);

        showNotification('Policy attached successfully', 'success');
    }
};

// Function to detach a policy from a lead
window.detachPolicy = function(policyId, leadId) {
    if (confirm('Are you sure you want to detach this policy?')) {
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const policyIndex = policies.findIndex(p => (p.id || p.policyNumber) === policyId);

        if (policyIndex !== -1) {
            delete policies[policyIndex].leadId;
            localStorage.setItem('insurance_policies', JSON.stringify(policies));

            // Refresh the policy list
            window.refreshPolicyList(leadId);

            showNotification('Policy detached successfully', 'success');
        }
    }
};

console.log('Policy list update fixes applied successfully');