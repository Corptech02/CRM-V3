// Fix client profile and policy display issues - DISABLED TO USE MAIN APP.JS VERSION
console.log('Client profile fix script disabled - using main app.js viewClient function');

/*
// Store the original viewClient function properly
const originalViewClient = window.viewClient;

// Override viewClient to handle all client storage locations and policies
window.viewClient = function(id) {
    console.log('viewClient called with ID:', id);
    
    const clientId = String(id);
    
    // Clear any previous profile view
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) {
        console.error('Dashboard content not found');
        return;
    }
    
    // Get client from all possible storage locations
    let client = null;
    
    // Check insurance_clients first
    const insuranceClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    client = insuranceClients.find(c => String(c.id) === clientId);
    console.log('Checking insurance_clients:', client ? 'Found' : 'Not found');
    
    // Check clients storage if not found
    if (!client) {
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        client = clients.find(c => String(c.id) === clientId);
        console.log('Checking clients storage:', client ? 'Found' : 'Not found');
    }
    
    if (!client) {
        console.error('Client not found in any storage');
        showNotification('Client not found', 'error');
        loadClientsView();
        return;
    }
    
    console.log('Client found:', client);
    
    // Get all policies for this client
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log('Total policies in storage:', allPolicies.length);
    
    // Find policies that belong to this client
    const clientPolicies = allPolicies.filter(policy => {
        // Check multiple ways to match policies to client
        if (policy.clientId && String(policy.clientId) === clientId) return true;
        if (policy.client_id && String(policy.client_id) === clientId) return true;
        
        // Check by client name
        const policyClientName = policy.clientName || policy.client_name || 
                                policy.insured?.['Name/Business Name'] || 
                                policy.insured?.['Primary Named Insured'];
        if (policyClientName && client.name && 
            policyClientName.toLowerCase() === client.name.toLowerCase()) return true;
        
        // Check if client has policies array with this policy
        if (client.policies && Array.isArray(client.policies)) {
            return client.policies.some(p => {
                if (typeof p === 'string') {
                    return p === policy.id || p === policy.policyNumber;
                }
                if (typeof p === 'object' && p.id) {
                    return p.id === policy.id;
                }
                return false;
            });
        }
        
        return false;
    });
    
    console.log('Client policies found:', clientPolicies.length);
    
    // Build the profile view
    dashboardContent.innerHTML = `
        <div class="client-profile-view">
            <header class="content-header">
                <div class="header-back">
                    <button class="btn-back" onclick="loadClientsView()">
                        <i class="fas fa-arrow-left"></i> Back to Clients
                    </button>
                    <h1>Client Profile</h1>
                </div>
                <div class="header-actions">
                    <button class="btn-secondary" onclick="editClient('${clientId}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-primary" onclick="addPolicyToClient('${clientId}')">
                        <i class="fas fa-file-contract"></i> Add Policy
                    </button>
                </div>
            </header>
            
            <div class="client-profile-grid">
                <!-- Client Information Card -->
                <div class="profile-card">
                    <h3><i class="fas fa-user-circle"></i> Client Information</h3>
                    <div class="profile-info-grid">
                        <div class="info-item">
                            <label>Company/Name</label>
                            <p>${client.name || 'N/A'}</p>
                        </div>
                        <div class="info-item">
                            <label>Contact Person</label>
                            <p>${client.contact || client.contactPerson || 'N/A'}</p>
                        </div>
                        <div class="info-item">
                            <label>Email</label>
                            <p>${client.email || 'N/A'}</p>
                        </div>
                        <div class="info-item">
                            <label>Phone</label>
                            <p>${client.phone || 'N/A'}</p>
                        </div>
                        <div class="info-item">
                            <label>Type</label>
                            <p>${client.type || client.policyType || 'Personal Lines'}</p>
                        </div>
                        <div class="info-item">
                            <label>Status</label>
                            <p><span class="status status-active">${client.status || client.policyStatus || 'Active'}</span></p>
                        </div>
                        ${client.address ? `
                            <div class="info-item" style="grid-column: 1 / -1;">
                                <label>Address</label>
                                <p>${client.address}</p>
                            </div>
                        ` : ''}
                        ${client.convertedFrom ? `
                            <div class="info-item">
                                <label>Source</label>
                                <p><span style="color: #10b981;">Converted from Lead #${client.convertedFrom}</span></p>
                            </div>
                            <div class="info-item">
                                <label>Converted Date</label>
                                <p>${new Date(client.convertedDate || client.createdAt).toLocaleDateString()}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Notes Section -->
                <div class="profile-card">
                    <h3><i class="fas fa-sticky-note"></i> Notes</h3>
                    <div class="notes-section">
                        <textarea id="client-notes" style="width: 100%; min-height: 150px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;" 
                                  placeholder="Add notes about this client...">${client.notes || ''}</textarea>
                        <button class="btn-secondary" style="margin-top: 10px;" onclick="saveClientNotes('${clientId}')">
                            <i class="fas fa-save"></i> Save Notes
                        </button>
                    </div>
                </div>
                
                <!-- Policies Section -->
                <div class="profile-card" style="grid-column: 1 / -1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3><i class="fas fa-file-contract"></i> Policies (${clientPolicies.length})</h3>
                        <button class="btn-primary" onclick="addPolicyToClient('${clientId}')">
                            <i class="fas fa-plus"></i> Add Policy
                        </button>
                    </div>
                    ${clientPolicies.length > 0 ? `
                        <div class="data-table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Policy Number</th>
                                        <th>Type</th>
                                        <th>Carrier</th>
                                        <th>Premium</th>
                                        <th>Effective Date</th>
                                        <th>Expiration Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${clientPolicies.map(policy => {
                                        const policyType = policy.type || policy.policyType || 
                                                         policy.coverages?.type || 'General';
                                        const carrier = policy.carrier || policy.carrierName || 
                                                      policy.company || 'N/A';
                                        const premium = policy.premium || policy.totalPremium || 
                                                      policy.annualPremium || 0;
                                        const effectiveDate = policy.effectiveDate || policy.effective_date || 
                                                            policy.policyPeriod?.start || 'N/A';
                                        const expirationDate = policy.expirationDate || policy.expiration_date || 
                                                             policy.policyPeriod?.end || 'N/A';
                                        const status = policy.status || 'Active';
                                        
                                        return `
                                            <tr>
                                                <td>${policy.policyNumber || policy.policy_number || 'N/A'}</td>
                                                <td>${policyType}</td>
                                                <td>${carrier}</td>
                                                <td>$${typeof premium === 'number' ? premium.toLocaleString() : premium}</td>
                                                <td>${effectiveDate}</td>
                                                <td>${expirationDate}</td>
                                                <td><span class="status status-${status.toLowerCase()}">${status}</span></td>
                                                <td>
                                                    <div class="action-buttons">
                                                        <button class="btn-icon" onclick="viewPolicy('${policy.id}')" title="View Policy">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="btn-icon" onclick="editPolicy('${policy.id}')" title="Edit Policy">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 60px 20px; background: #f9fafb; border-radius: 8px;">
                            <i class="fas fa-file-contract" style="font-size: 48px; color: #d1d5db; margin-bottom: 16px;"></i>
                            <p style="color: #6b7280; font-size: 16px; margin-bottom: 20px;">No policies found for this client</p>
                            <button class="btn-primary" onclick="addPolicyToClient('${clientId}')">
                                <i class="fas fa-plus"></i> Add First Policy
                            </button>
                        </div>
                    `}
                </div>
                
                <!-- Activity Timeline -->
                <div class="profile-card" style="grid-column: 1 / -1;">
                    <h3><i class="fas fa-history"></i> Recent Activity</h3>
                    <div class="activity-timeline">
                        ${client.convertedDate ? `
                            <div class="timeline-item">
                                <div class="timeline-icon" style="background: #10b981;">
                                    <i class="fas fa-user-check"></i>
                                </div>
                                <div class="timeline-content">
                                    <p><strong>Converted from Lead</strong></p>
                                    <p class="text-muted">${new Date(client.convertedDate).toLocaleString()}</p>
                                </div>
                            </div>
                        ` : ''}
                        ${clientPolicies.map(policy => `
                            <div class="timeline-item">
                                <div class="timeline-icon" style="background: #3b82f6;">
                                    <i class="fas fa-file-contract"></i>
                                </div>
                                <div class="timeline-content">
                                    <p><strong>Policy Added</strong> - ${policy.policyNumber || 'New Policy'}</p>
                                    <p class="text-muted">${policy.createdAt ? new Date(policy.createdAt).toLocaleString() : 'Recently'}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
};

// Function to save client notes
window.saveClientNotes = function(clientId) {
    const notesTextarea = document.getElementById('client-notes');
    if (!notesTextarea) return;
    
    const notes = notesTextarea.value;
    
    // Update client in all storage locations
    const insuranceClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const clientIndex = insuranceClients.findIndex(c => String(c.id) === String(clientId));
    
    if (clientIndex !== -1) {
        insuranceClients[clientIndex].notes = notes;
        localStorage.setItem('insurance_clients', JSON.stringify(insuranceClients));
    }
    
    // Also update in clients storage if exists there
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const clientIndex2 = clients.findIndex(c => String(c.id) === String(clientId));
    
    if (clientIndex2 !== -1) {
        clients[clientIndex2].notes = notes;
        localStorage.setItem('clients', JSON.stringify(clients));
    }
    
    showNotification('Notes saved successfully', 'success');
};

// Override addPolicyToClient to ensure policies are linked correctly
const originalAddPolicyToClient = window.addPolicyToClient;
window.addPolicyToClient = function(clientId) {
    console.log('Adding policy to client:', clientId);
    
    // Store the client ID globally so the policy form can use it
    window.currentPolicyClientId = clientId;
    
    // Call original function if it exists
    if (originalAddPolicyToClient) {
        originalAddPolicyToClient(clientId);
    } else {
        // Create a simple policy form
        showAddPolicyForm(clientId);
    }
};

// Function to show add policy form
function showAddPolicyForm(clientId) {
    // Get client info
    const insuranceClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const client = insuranceClients.find(c => String(c.id) === String(clientId)) ||
                  clients.find(c => String(c.id) === String(clientId));
    
    if (!client) {
        showNotification('Client not found', 'error');
        return;
    }
    
    const modalHTML = `
        <div class="modal-overlay active" id="addPolicyModal">
            <div class="modal-container" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>Add Policy for ${client.name}</h2>
                    <button class="close-btn" onclick="closeAddPolicyModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addPolicyForm">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Policy Number *</label>
                                <input type="text" id="policyNumber" required>
                            </div>
                            <div class="form-group">
                                <label>Policy Type *</label>
                                <select id="policyType" required>
                                    <option value="">Select Type</option>
                                    <option value="Commercial Auto">Commercial Auto</option>
                                    <option value="General Liability">General Liability</option>
                                    <option value="Property">Property</option>
                                    <option value="Workers Comp">Workers Compensation</option>
                                    <option value="Professional Liability">Professional Liability</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Carrier/Company *</label>
                                <input type="text" id="carrier" required>
                            </div>
                            <div class="form-group">
                                <label>Annual Premium *</label>
                                <input type="number" id="premium" required>
                            </div>
                            <div class="form-group">
                                <label>Effective Date *</label>
                                <input type="date" id="effectiveDate" required>
                            </div>
                            <div class="form-group">
                                <label>Expiration Date *</label>
                                <input type="date" id="expirationDate" required>
                            </div>
                            <div class="form-group" style="grid-column: 1 / -1;">
                                <label>Coverage Details</label>
                                <textarea id="coverageDetails" rows="3"></textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeAddPolicyModal()">Cancel</button>
                    <button class="btn-primary" onclick="saveNewPolicy('${clientId}')">
                        <i class="fas fa-save"></i> Save Policy
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remove any existing modal
    const existingModal = document.getElementById('addPolicyModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Function to close add policy modal
window.closeAddPolicyModal = function() {
    const modal = document.getElementById('addPolicyModal');
    if (modal) modal.remove();
};

// Function to save new policy
window.saveNewPolicy = function(clientId) {
    const policyData = {
        id: Date.now().toString(),
        clientId: clientId,
        client_id: clientId, // Add both formats for compatibility
        policyNumber: document.getElementById('policyNumber').value,
        type: document.getElementById('policyType').value,
        policyType: document.getElementById('policyType').value,
        carrier: document.getElementById('carrier').value,
        carrierName: document.getElementById('carrier').value,
        premium: parseFloat(document.getElementById('premium').value),
        annualPremium: parseFloat(document.getElementById('premium').value),
        effectiveDate: document.getElementById('effectiveDate').value,
        effective_date: document.getElementById('effectiveDate').value,
        expirationDate: document.getElementById('expirationDate').value,
        expiration_date: document.getElementById('expirationDate').value,
        coverageDetails: document.getElementById('coverageDetails').value,
        status: 'Active',
        createdAt: new Date().toISOString()
    };
    
    // Get client info to add to policy
    const insuranceClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const client = insuranceClients.find(c => String(c.id) === String(clientId)) ||
                  clients.find(c => String(c.id) === String(clientId));
    
    if (client) {
        policyData.clientName = client.name;
        policyData.client_name = client.name;
    }
    
    // Add policy to insurance_policies storage
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    policies.push(policyData);
    localStorage.setItem('insurance_policies', JSON.stringify(policies));
    
    console.log('Policy saved:', policyData);
    
    // Close modal
    closeAddPolicyModal();
    
    // Show success message
    showNotification('Policy added successfully!', 'success');
    
    // Reload the client profile to show the new policy
    setTimeout(() => {
        viewClient(clientId);
    }, 500);
};

// Ensure showNotification function exists
if (!window.showNotification) {
    window.showNotification = function(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };
}

console.log('Client profile and policies fix applied');
*/