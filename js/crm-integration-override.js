// Override localStorage functions to use CRM API
// This ensures all policy and client data is synchronized across devices

(function() {
    console.log('CRM Integration Override - Activating server-side storage');

    // Wait for CRM API to be ready
    function waitForCRMAPI() {
        if (typeof crmAPI === 'undefined') {
            setTimeout(waitForCRMAPI, 100);
            return;
        }

        console.log('CRM API ready, overriding storage functions');

        // Override policy loading functions
        const originalLoadPolicies = window.loadPolicies;
        window.loadPolicies = async function() {
            console.log('Loading policies from CRM API...');
            try {
                const policies = await crmAPI.policies.getAll();
                console.log(`Loaded ${policies.length} policies from server`);

                // Update the UI
                const tbody = document.getElementById('policiesTableBody');
                if (tbody) {
                    tbody.innerHTML = '';
                    policies.forEach(policy => {
                        const row = tbody.insertRow();
                        row.innerHTML = `
                            <td>${policy.policy_number || ''}</td>
                            <td>${policy.client_name || ''}</td>
                            <td>${policy.carrier || ''}</td>
                            <td>${policy.effective_date || ''}</td>
                            <td>${policy.expiration_date || ''}</td>
                            <td>${policy.premium ? '$' + policy.premium : ''}</td>
                            <td><span class="status-badge status-${(policy.status || 'active').toLowerCase()}">${policy.status || 'Active'}</span></td>
                            <td>
                                <button class="btn-action" onclick="viewPolicy('${policy.id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-action" onclick="editPolicy('${policy.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-action btn-danger" onclick="deletePolicy('${policy.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        `;
                    });
                }

                // Also store in localStorage for backward compatibility
                localStorage.setItem('policies', JSON.stringify(policies));
                return policies;
            } catch (error) {
                console.error('Error loading policies from CRM:', error);
                // Fallback to localStorage
                if (originalLoadPolicies) {
                    return originalLoadPolicies();
                }
                return JSON.parse(localStorage.getItem('policies') || '[]');
            }
        };

        // Override client loading functions
        const originalLoadClients = window.loadClients;
        window.loadClients = async function() {
            console.log('Loading clients from CRM API...');
            try {
                const clients = await crmAPI.clients.getAll();
                console.log(`Loaded ${clients.length} clients from server`);

                // Update the UI
                const tbody = document.getElementById('clientsTableBody');
                if (tbody) {
                    tbody.innerHTML = '';
                    clients.forEach(client => {
                        const row = tbody.insertRow();
                        row.innerHTML = `
                            <td>${client.name || ''}</td>
                            <td>${client.email || ''}</td>
                            <td>${client.phone || ''}</td>
                            <td>${client.company || ''}</td>
                            <td><span class="status-badge status-${(client.status || 'active').toLowerCase()}">${client.status || 'Active'}</span></td>
                            <td>
                                <button class="btn-action" onclick="viewClient('${client.id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-action" onclick="editClient('${client.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-action btn-danger" onclick="deleteClient('${client.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        `;
                    });
                }

                // Also store in localStorage for backward compatibility
                localStorage.setItem('clients', JSON.stringify(clients));
                return clients;
            } catch (error) {
                console.error('Error loading clients from CRM:', error);
                // Fallback to localStorage
                if (originalLoadClients) {
                    return originalLoadClients();
                }
                return JSON.parse(localStorage.getItem('clients') || '[]');
            }
        };

        // Override save functions
        window.savePolicyToCRM = async function(policy) {
            try {
                let result;
                if (policy.id) {
                    result = await crmAPI.policies.update(policy.id, policy);
                } else {
                    result = await crmAPI.policies.create(policy);
                }
                console.log('Policy saved to CRM:', result);

                // Reload policies to update UI
                await window.loadPolicies();
                return result;
            } catch (error) {
                console.error('Error saving policy to CRM:', error);
                throw error;
            }
        };

        window.saveClientToCRM = async function(client) {
            try {
                let result;
                if (client.id) {
                    result = await crmAPI.clients.update(client.id, client);
                } else {
                    result = await crmAPI.clients.create(client);
                }
                console.log('Client saved to CRM:', result);

                // Reload clients to update UI
                await window.loadClients();
                return result;
            } catch (error) {
                console.error('Error saving client to CRM:', error);
                throw error;
            }
        };

        // Override delete functions
        window.deletePolicyFromCRM = async function(policyId) {
            try {
                await crmAPI.policies.delete(policyId);
                console.log('Policy deleted from CRM');

                // Reload policies to update UI
                await window.loadPolicies();
            } catch (error) {
                console.error('Error deleting policy from CRM:', error);
                throw error;
            }
        };

        window.deleteClientFromCRM = async function(clientId) {
            try {
                await crmAPI.clients.delete(clientId);
                console.log('Client deleted from CRM');

                // Reload clients to update UI
                await window.loadClients();
            } catch (error) {
                console.error('Error deleting client from CRM:', error);
                throw error;
            }
        };

        // Auto-load data when switching tabs
        const originalShowTab = window.showTab;
        window.showTab = function(tabName) {
            if (originalShowTab) {
                originalShowTab(tabName);
            }

            // Load data based on tab
            switch(tabName) {
                case 'policies':
                    window.loadPolicies();
                    break;
                case 'clients':
                    window.loadClients();
                    break;
                case 'leads':
                    // Load leads if needed
                    break;
            }
        };

        // Initial load
        setTimeout(() => {
            if (document.getElementById('policiesTableBody')) {
                window.loadPolicies();
            }
            if (document.getElementById('clientsTableBody')) {
                window.loadClients();
            }
        }, 1000);

        console.log('✅ CRM Integration Override complete - all data now syncs across devices!');
    }

    // Start the override process
    waitForCRMAPI();
})();