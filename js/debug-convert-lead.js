// Debug script to check lead IDs and fix convert to client function
console.log('Debugging Convert to Client functionality...');

// Check what leads we have in localStorage
const leads = JSON.parse(localStorage.getItem('leads') || '[]');
console.log('Current leads in localStorage:', leads);
console.log('Lead IDs:', leads.map(l => ({ id: l.id, type: typeof l.id, name: l.name })));

// Override the convertLead function to add better debugging
window.convertLead = function(leadId) {
    console.log('convertLead called with leadId:', leadId, 'type:', typeof leadId);
    
    // Get the lead data
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    console.log('All leads:', leads);
    console.log('Looking for lead with ID:', leadId);
    
    // Try multiple matching strategies
    let lead = leads.find(l => l.id === leadId);
    if (!lead) {
        console.log('Exact match failed, trying string conversion...');
        lead = leads.find(l => String(l.id) === String(leadId));
    }
    if (!lead) {
        console.log('String match failed, trying parseInt...');
        lead = leads.find(l => parseInt(l.id) === parseInt(leadId));
    }
    
    if (!lead) {
        console.error('Lead not found!');
        console.log('Available lead IDs:', leads.map(l => l.id));
        showNotification('Lead not found - Check console for details', 'error');
        return;
    }
    
    console.log('Lead found:', lead);
    
    // Create conversion modal
    const modalHTML = `
        <div class="modal-overlay active" id="convertLeadModal">
            <div class="modal-container" style="max-width: 700px; width: 90%;">
                <div class="modal-header" style="padding: 24px 30px; border-bottom: 1px solid #e5e7eb;">
                    <h2 style="margin: 0; color: #111827; font-size: 24px; font-weight: 600;">Convert Lead to Client</h2>
                    <button class="close-btn" onclick="closeConvertModal()" style="font-size: 28px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 30px;">
                    <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                        <p style="margin: 0; color: #0369a1; font-size: 14px;">
                            <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                            Converting <strong>${lead.name || 'this lead'}</strong> to a client will move them from leads to the clients section.
                        </p>
                    </div>
                    
                    <form id="convertLeadForm">
                        <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">Client Name</label>
                                <input type="text" value="${lead.name || ''}" id="clientName" required 
                                       style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">Contact Person</label>
                                <input type="text" value="${lead.contact || ''}" id="clientContact" 
                                       style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">Email</label>
                                <input type="email" value="${lead.email || ''}" id="clientEmail" 
                                       style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">Phone</label>
                                <input type="tel" value="${lead.phone || ''}" id="clientPhone" 
                                       style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;">
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">Policy Type</label>
                                <select id="policyType" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;">
                                    <option value="">Select Policy Type</option>
                                    <option value="Commercial Auto" ${lead.product === 'Commercial Auto' ? 'selected' : ''}>Commercial Auto</option>
                                    <option value="General Liability">General Liability</option>
                                    <option value="Property">Property</option>
                                    <option value="Workers Comp">Workers Compensation</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">Policy Status</label>
                                <select id="policyStatus" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;">
                                    <option value="Active" selected>Active</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Under Review">Under Review</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group" style="margin-top: 20px;">
                            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">Notes</label>
                            <textarea id="conversionNotes" rows="3" 
                                      style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;"
                                      placeholder="Add any notes about this conversion...">${lead.notes || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer" style="padding: 20px 30px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px;">
                    <button onclick="closeConvertModal()" 
                            style="padding: 10px 20px; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 6px; cursor: pointer;">
                        Cancel
                    </button>
                    <button onclick="confirmConvertLead('${lead.id}')" 
                            style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-check" style="margin-right: 8px;"></i>
                        Convert to Client
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remove any existing modal
    const existingModal = document.getElementById('convertLeadModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// Function to close the modal
window.closeConvertModal = function() {
    const modal = document.getElementById('convertLeadModal');
    if (modal) {
        modal.remove();
    }
};

// Function to confirm the conversion
window.confirmConvertLead = function(leadId) {
    console.log('Confirming conversion for lead:', leadId);
    
    // Get form data
    const clientData = {
        id: Date.now(), // Generate new client ID
        name: document.getElementById('clientName').value,
        contact: document.getElementById('clientContact').value,
        email: document.getElementById('clientEmail').value,
        phone: document.getElementById('clientPhone').value,
        policyType: document.getElementById('policyType').value,
        policyStatus: document.getElementById('policyStatus').value,
        notes: document.getElementById('conversionNotes').value,
        convertedFrom: leadId,
        convertedDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    
    // Get existing clients
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    
    // Add new client
    clients.push(clientData);
    localStorage.setItem('clients', JSON.stringify(clients));
    
    // Remove lead from leads
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const updatedLeads = leads.filter(l => String(l.id) !== String(leadId));
    localStorage.setItem('leads', JSON.stringify(updatedLeads));
    
    // Close modal
    closeConvertModal();
    
    // Show success message
    if (window.showNotification) {
        window.showNotification('Lead successfully converted to client!', 'success');
    } else {
        alert('Lead successfully converted to client!');
    }
    
    // Refresh the leads view if it's active
    if (window.loadLeadsView) {
        window.loadLeadsView();
    }
    
    console.log('Conversion complete. New client:', clientData);
};

console.log('Convert to Client debugging script loaded');