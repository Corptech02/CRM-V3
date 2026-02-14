// Client Bulk Operations
console.log('Loading client bulk operations...');

// Agent Assignment Modal
window.showAgentAssignmentModal = function(selectedClients) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3><i class="fas fa-user-tag"></i> Assign Clients to Agent</h3>
                <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 20px; color: #6b7280;">
                    Assigning <strong>${selectedClients.length}</strong> clients to a new agent:
                </p>
                <div class="client-list" style="max-height: 200px; overflow-y: auto; background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    ${selectedClients.map(client => `
                        <div style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                            <i class="fas fa-user" style="color: #9ca3af;"></i>
                            <span>${client.name}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="form-group">
                    <label for="assignAgent" style="display: block; margin-bottom: 8px; font-weight: 500;">Select Agent</label>
                    <select id="assignAgent" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                        <option value="">Choose an agent...</option>
                        <option value="Grant">Grant</option>
                        <option value="Maureen">Maureen</option>
                        <option value="Sarah">Sarah</option>
                        <option value="Mike">Mike</option>
                        <option value="Jessica">Jessica</option>
                    </select>
                </div>
                <div class="form-group" style="margin-top: 20px;">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="sendNotification" checked>
                        <span>Send notification email to assigned agent</span>
                    </label>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button class="btn-primary" onclick="processAgentAssignment()">
                    <i class="fas fa-check"></i> Assign Clients
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Store selected clients data in modal for processing
    modal._selectedClients = selectedClients;
};

// Process agent assignment
window.processAgentAssignment = function() {
    const modal = document.querySelector('.modal-overlay');
    const selectedAgent = document.getElementById('assignAgent').value;
    const sendNotification = document.getElementById('sendNotification').checked;
    const selectedClients = modal._selectedClients;

    if (!selectedAgent) {
        showNotification('Please select an agent', 'warning');
        return;
    }

    // Update clients with new agent assignment
    updateClientAssignments(selectedClients, selectedAgent, sendNotification);

    modal.remove();
};

// Update client assignments
function updateClientAssignments(clients, newAgent, sendNotification) {
    const successCount = clients.length;

    // Update each client in localStorage/API
    clients.forEach(client => {
        updateClientAgent(client.id, newAgent);

        // Update the visual representation immediately
        const agentCell = client.element.cells[6]; // Assuming agent is in 7th column
        if (agentCell) {
            agentCell.textContent = newAgent;
        }
    });

    // Clear selections
    clearAllSelections();

    // Show success message
    showNotification(`Successfully assigned ${successCount} clients to ${newAgent}`, 'success');

    if (sendNotification) {
        // Simulate sending notification
        setTimeout(() => {
            showNotification(`Notification sent to ${newAgent}`, 'info');
        }, 1000);
    }

    // Refresh the view
    if (window.loadClientsView) {
        setTimeout(() => window.loadClientsView(), 500);
    }
}

// Update individual client agent
function updateClientAgent(clientId, newAgent) {
    // Update in localStorage
    const insuranceClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const clientIndex = insuranceClients.findIndex(c => String(c.id) === String(clientId));

    if (clientIndex !== -1) {
        insuranceClients[clientIndex].assignedTo = newAgent;
        insuranceClients[clientIndex].agent = newAgent;
        localStorage.setItem('insurance_clients', JSON.stringify(insuranceClients));
    }

    // Also update API if available
    const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io';
    fetch(`${API_URL}/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ assignedTo: newAgent, agent: newAgent })
    }).catch(error => {
        console.warn('Could not update client via API:', error);
    });
}

// Delete multiple clients
window.deleteMultipleClients = function(clients) {
    const loadingModal = showLoadingModal('Deleting clients...');

    let successCount = 0;
    let errorCount = 0;

    const deletePromises = clients.map(client => {
        return deleteClientById(client.id)
            .then(() => {
                successCount++;
                // Remove row from table immediately
                client.element.remove();
            })
            .catch(() => {
                errorCount++;
            });
    });

    Promise.all(deletePromises)
        .finally(() => {
            loadingModal.remove();
            clearAllSelections();

            if (successCount > 0) {
                showNotification(`Successfully deleted ${successCount} clients`, 'success');
            }
            if (errorCount > 0) {
                showNotification(`Failed to delete ${errorCount} clients`, 'error');
            }

            // Refresh the view
            if (window.loadClientsView) {
                setTimeout(() => window.loadClientsView(), 500);
            }
        });
};

// Delete client by ID
function deleteClientById(clientId) {
    return new Promise((resolve, reject) => {
        // Remove from localStorage
        const insuranceClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const filteredClients = insuranceClients.filter(c => String(c.id) !== String(clientId));
        localStorage.setItem('insurance_clients', JSON.stringify(filteredClients));

        // Remove from API if available
        const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io';
        fetch(`${API_URL}/api/clients/${clientId}`, {
            method: 'DELETE',
            headers: { 'Cache-Control': 'no-cache' }
        })
        .then(() => resolve())
        .catch(() => {
            // Even if API fails, localStorage deletion succeeded
            console.warn('API deletion failed, but localStorage was updated');
            resolve();
        });
    });
}

// Clear all selections
function clearAllSelections() {
    const checkboxes = document.querySelectorAll('.clients-view input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    updateBulkActionsVisibility();
}

// Show loading modal
function showLoadingModal(message) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 300px; text-align: center;">
            <div class="modal-body" style="padding: 40px 20px;">
                <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p style="margin: 0; color: #6b7280;">${message}</p>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;

    document.body.appendChild(modal);
    return modal;
}

// Enhanced client details modal
window.showEnhancedClientDetails = function(clientId) {
    // Get client data
    const client = getClientById(clientId);
    if (!client) {
        showNotification('Client not found', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h3><i class="fas fa-user"></i> Client Details: ${client.name}</h3>
                <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="client-details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <!-- Basic Information -->
                    <div class="info-section">
                        <h4 style="margin-bottom: 15px; color: #374151;"><i class="fas fa-info-circle"></i> Basic Information</h4>
                        <div class="info-item" style="margin-bottom: 12px;">
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase; display: block;">Name</label>
                            <span style="font-size: 16px;">${client.name || 'N/A'}</span>
                        </div>
                        <div class="info-item" style="margin-bottom: 12px;">
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase; display: block;">Phone</label>
                            <span style="font-size: 16px;">
                                <a href="tel:${client.phone}" style="color: #3b82f6; text-decoration: none;">${client.phone || 'N/A'}</a>
                            </span>
                        </div>
                        <div class="info-item" style="margin-bottom: 12px;">
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase; display: block;">Email</label>
                            <span style="font-size: 16px;">
                                <a href="mailto:${client.email}" style="color: #3b82f6; text-decoration: none;">${client.email || 'N/A'}</a>
                            </span>
                        </div>
                        <div class="info-item" style="margin-bottom: 12px;">
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase; display: block;">Type</label>
                            <span class="badge badge-blue">${client.type || client.policyType || 'Personal Lines'}</span>
                        </div>
                    </div>

                    <!-- Account Information -->
                    <div class="info-section">
                        <h4 style="margin-bottom: 15px; color: #374151;"><i class="fas fa-file-contract"></i> Account Information</h4>
                        <div class="info-item" style="margin-bottom: 12px;">
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase; display: block;">Status</label>
                            <span class="status status-active">${client.status || 'Active'}</span>
                        </div>
                        <div class="info-item" style="margin-bottom: 12px;">
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase; display: block;">Assigned Agent</label>
                            <span style="font-size: 16px;">${client.assignedTo || client.agent || 'Grant'}</span>
                        </div>
                        <div class="info-item" style="margin-bottom: 12px;">
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase; display: block;">Total Premium</label>
                            <span style="font-size: 16px; font-weight: 600; color: #059669;">
                                ${typeof client.totalPremium === 'number' ? '$' + client.totalPremium.toLocaleString() : client.totalPremium || '$0'}
                            </span>
                        </div>
                        <div class="info-item" style="margin-bottom: 12px;">
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase; display: block;">Policies</label>
                            <span style="font-size: 16px;">${client.policies ? client.policies.length : 0}</span>
                        </div>
                    </div>
                </div>

                <!-- Activity Timeline -->
                <div class="activity-section" style="margin-top: 30px;">
                    <h4 style="margin-bottom: 15px; color: #374151;"><i class="fas fa-clock"></i> Recent Activity</h4>
                    <div class="timeline" style="background: #f9fafb; border-radius: 8px; padding: 20px;">
                        <div class="timeline-item" style="padding: 10px 0; border-left: 3px solid #3b82f6; padding-left: 15px; margin-left: 10px;">
                            <div style="font-size: 14px; font-weight: 500;">Client Created</div>
                            <div style="font-size: 12px; color: #6b7280;">${client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Unknown'}</div>
                        </div>
                        ${client.convertedFrom ? `
                            <div class="timeline-item" style="padding: 10px 0; border-left: 3px solid #10b981; padding-left: 15px; margin-left: 10px;">
                                <div style="font-size: 14px; font-weight: 500;">Converted from Lead</div>
                                <div style="font-size: 12px; color: #6b7280;">Lead ID: ${client.convertedFrom}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="quick-actions" style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px;">
                    <h4 style="margin-bottom: 15px; color: #374151;"><i class="fas fa-bolt"></i> Quick Actions</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn-primary" onclick="viewClient('${client.id}'); this.closest('.modal-overlay').remove();">
                            <i class="fas fa-eye"></i> View Full Profile
                        </button>
                        <button class="btn-secondary" onclick="editClient('${client.id}'); this.closest('.modal-overlay').remove();">
                            <i class="fas fa-edit"></i> Edit Client
                        </button>
                        <button class="btn-secondary" onclick="addPolicyToClient('${client.id}'); this.closest('.modal-overlay').remove();">
                            <i class="fas fa-file-contract"></i> Add Policy
                        </button>
                        ${client.phone ? `
                            <button class="btn-secondary" onclick="window.open('tel:${client.phone}')">
                                <i class="fas fa-phone"></i> Call
                            </button>
                        ` : ''}
                        ${client.email ? `
                            <button class="btn-secondary" onclick="window.open('mailto:${client.email}')">
                                <i class="fas fa-envelope"></i> Email
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

// Get client by ID
function getClientById(clientId) {
    const insuranceClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    return insuranceClients.find(c => String(c.id) === String(clientId));
}

// Add right-click context menu for client rows
window.addClientContextMenu = function() {
    document.addEventListener('contextmenu', function(e) {
        const row = e.target.closest('.clients-view .data-table tbody tr');
        if (!row || row.cells.length === 1) return; // Skip if not a client row

        e.preventDefault();

        // Get client ID
        const actionButtons = row.querySelector('.action-buttons');
        const viewButton = actionButtons?.querySelector('[onclick*="viewClient"]');
        const clientId = viewButton?.getAttribute('onclick')?.match(/viewClient\('([^']+)'\)/)?.[1];

        if (!clientId) return;

        // Remove existing context menu
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) existingMenu.remove();

        // Create context menu
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.style.cssText = `
            position: fixed;
            top: ${e.pageY}px;
            left: ${e.pageX}px;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            z-index: 10000;
            min-width: 180px;
            overflow: hidden;
        `;

        contextMenu.innerHTML = `
            <div class="context-menu-item" onclick="showEnhancedClientDetails('${clientId}'); this.closest('.context-menu').remove();">
                <i class="fas fa-info-circle"></i> Quick View
            </div>
            <div class="context-menu-item" onclick="viewClient('${clientId}'); this.closest('.context-menu').remove();">
                <i class="fas fa-eye"></i> Full Profile
            </div>
            <div class="context-menu-item" onclick="editClient('${clientId}'); this.closest('.context-menu').remove();">
                <i class="fas fa-edit"></i> Edit Client
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" onclick="addPolicyToClient('${clientId}'); this.closest('.context-menu').remove();">
                <i class="fas fa-file-contract"></i> Add Policy
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item danger" onclick="if(confirm('Delete this client?')) deleteClient('${clientId}'); this.closest('.context-menu').remove();">
                <i class="fas fa-trash"></i> Delete Client
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .context-menu-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 15px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s;
            }
            .context-menu-item:hover {
                background-color: #f3f4f6;
            }
            .context-menu-item.danger {
                color: #dc2626;
            }
            .context-menu-item.danger:hover {
                background-color: #fee2e2;
            }
            .context-menu-separator {
                height: 1px;
                background: #e5e7eb;
                margin: 5px 0;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(contextMenu);

        // Close menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                contextMenu.remove();
                style.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 0);
    });
};

// Initialize context menu when clients view loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.location.hash === '#clients') {
            window.addClientContextMenu();
        }
    }, 1000);
});

console.log('Client bulk operations loaded successfully');