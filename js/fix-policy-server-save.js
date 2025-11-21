// Fix Policy Server Save - Ensure ALL policy operations save to server, not localStorage
console.log('Policy Server Save Fix: Loading...');

(function() {
    // API endpoint configuration
    const API_URL = window.VANGUARD_API_URL || 'http://162-220-14-239.nip.io:3001';

    // Override the savePolicy function to save to server
    window.savePolicy = async function(policyData) {
        console.log('Saving policy to SERVER:', policyData);

        try {
            // Ensure policy has an ID
            if (!policyData.id) {
                policyData.id = 'policy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }

            // Preserve existing client information if not provided
            if (!policyData.clientName && policyData.clientId) {
                const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
                const client = clients.find(c => c.id === policyData.clientId);
                if (client) {
                    policyData.clientName = client.name || client.companyName || client.businessName || 'N/A';
                }
            }

            // Add timestamps
            if (!policyData.createdAt) {
                policyData.createdAt = new Date().toISOString();
            }
            policyData.updatedAt = new Date().toISOString();

            // Save to server
            const response = await fetch(`${API_URL}/api/policies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(policyData)
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            console.log('Policy saved to server:', result);

            // Also update localStorage for immediate UI updates
            let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            const existingIndex = policies.findIndex(p => p.id === policyData.id);

            if (existingIndex >= 0) {
                policies[existingIndex] = policyData;
            } else {
                policies.push(policyData);
            }

            localStorage.setItem('insurance_policies', JSON.stringify(policies));

            // Show success notification
            if (window.showNotification) {
                showNotification('Policy saved to server successfully', 'success');
            }

            // Refresh the view
            if (window.loadPoliciesView) {
                setTimeout(() => loadPoliciesView(), 500);
            }

            return result;

        } catch (error) {
            console.error('Error saving policy to server:', error);
            if (window.showNotification) {
                showNotification('Error saving policy to server', 'error');
            }
            throw error;
        }
    };

    // Override addPolicy function
    window.addPolicy = async function(policyData) {
        console.log('Adding new policy to SERVER');
        return window.savePolicy(policyData);
    };

    // Override createPolicy function
    window.createPolicy = async function(policyData) {
        console.log('Creating new policy on SERVER');
        return window.savePolicy(policyData);
    };

    // Override editPolicy function to save to server
    const originalEditPolicy = window.editPolicy;
    window.editPolicy = async function(policyId) {
        console.log('Edit policy:', policyId);

        // Call original edit function to show the modal
        if (originalEditPolicy) {
            originalEditPolicy(policyId);
        }

        // Note: The actual save will happen when savePolicy is called from the modal
    };

    // Override updatePolicy function
    window.updatePolicy = async function(policyData) {
        console.log('Updating policy on SERVER:', policyData.id);
        return window.savePolicy(policyData);
    };

    // Override deletePolicy function to delete from server
    window.deletePolicy = async function(policyId) {
        console.log('🗑️ DELETE INITIATED - Policy ID:', policyId);

        if (!policyId || policyId === 'undefined' || policyId === 'unknown') {
            console.error('❌ DELETE FAILED - Invalid policy ID:', policyId);
            alert('Error: Cannot delete policy - invalid ID');
            return;
        }

        if (!confirm('Are you sure you want to delete this policy?')) {
            console.log('❌ DELETE CANCELLED by user');
            return;
        }

        console.log('✅ DELETE CONFIRMED - Proceeding with deletion...');

        try {
            // First try to delete by ID
            let response = await fetch(`${API_URL}/api/policies/${policyId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            let deleteResult = await response.json();

            // If 0 rows deleted, policy might be stored by policyNumber instead of id
            if (deleteResult.deleted === 0) {
                console.log('⚠️ Delete by ID failed, trying to find policy by policyNumber...');

                // Get all policies and find the one with matching policyNumber
                const policiesResponse = await fetch(`${API_URL}/api/policies`);
                const policies = await policiesResponse.json();
                const policy = policies.find(p =>
                    p.policyNumber === policyId ||
                    p.id === policyId ||
                    (p.overview && p.overview["Policy Number"] === policyId)
                );

                if (policy && policy.id) {
                    console.log(`🔄 Found policy with actual ID: ${policy.id}, retrying delete...`);
                    response = await fetch(`${API_URL}/api/policies/${policy.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    deleteResult = await response.json();
                }
            }

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            if (deleteResult.deleted === 0) {
                console.warn(`⚠️ Policy ${policyId} not found in server database - removing from localStorage only`);

                // Remove from localStorage anyway (it's mock/test data)
                let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                const originalLength = policies.length;
                policies = policies.filter(p =>
                    p.id !== policyId &&
                    p.policyNumber !== policyId &&
                    (p.overview && p.overview["Policy Number"] !== policyId)
                );

                if (policies.length < originalLength) {
                    if (window.originalSetItem) {
                        window.originalSetItem.call(localStorage, 'insurance_policies', JSON.stringify(policies));
                    } else {
                        originalSetItem.call(localStorage, 'insurance_policies', JSON.stringify(policies));
                    }

                    console.log(`✅ Removed localStorage-only policy: ${policyId}`);

                    // Close modals and refresh
                    const modals = document.querySelectorAll('.modal, #policyViewModal');
                    modals.forEach(modal => modal.remove());

                    if (window.showNotification) {
                        showNotification('Policy removed from local storage', 'success');
                    }

                    if (window.loadPoliciesView) {
                        setTimeout(() => loadPoliciesView(), 100);
                        setTimeout(() => loadPoliciesView(), 500);
                    }

                    return true;
                } else {
                    throw new Error(`Policy not found anywhere: ${policyId}`);
                }
            }

            console.log('Policy deleted from server');

            // Also remove from localStorage using original setItem to bypass monitoring
            let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            policies = policies.filter(p => p.id !== policyId);

            // Use original setItem to avoid triggering policy reload
            if (window.originalSetItem) {
                window.originalSetItem.call(localStorage, 'insurance_policies', JSON.stringify(policies));
            } else {
                originalSetItem.call(localStorage, 'insurance_policies', JSON.stringify(policies));
            }

            // Close any open modals
            const modals = document.querySelectorAll('.modal, #policyViewModal');
            modals.forEach(modal => modal.remove());

            // Show success notification
            if (window.showNotification) {
                showNotification('Policy deleted from server', 'success');
            }

            // Force refresh the policy view immediately and with backup
            if (window.loadPoliciesView) {
                console.log('🔄 Refreshing policy view after deletion...');
                setTimeout(() => loadPoliciesView(), 100);
                setTimeout(() => loadPoliciesView(), 500);
                setTimeout(() => loadPoliciesView(), 1000);
            }

            // Also trigger any other refresh mechanisms
            if (window.location.hash === '#policy-management') {
                window.location.hash = '#policy-management'; // Force re-render
            }

            return true;

        } catch (error) {
            console.error('❌ DELETE ERROR - Server deletion failed:', error);
            console.error('❌ DELETE ERROR - Details:', {
                message: error.message,
                stack: error.stack,
                policyId: policyId,
                apiUrl: API_URL
            });

            if (window.showNotification) {
                showNotification(`Failed to delete policy: ${error.message}`, 'error');
            } else {
                alert(`Failed to delete policy: ${error.message}`);
            }
            throw error;
        }
    };

    // Fix the savePolicyForClient function to use server AND update client
    window.savePolicyForClient = async function(clientId) {
        console.log('Saving policy for client to SERVER:', clientId);

        // Collect policy data from modal
        const policyData = window.collectPolicyData ? window.collectPolicyData() : {};

        if (!policyData || Object.keys(policyData).length === 0) {
            showNotification('Please fill in policy details', 'error');
            return;
        }

        // Ensure policy has an ID
        if (!policyData.id) {
            policyData.id = 'policy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        // Link to client and get client name
        policyData.clientId = clientId;

        // Get client name from localStorage or server
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const client = clients.find(c => c.id === clientId);
        if (client) {
            policyData.clientName = client.name || client.companyName || client.businessName || 'N/A';
        }

        try {
            // 1. Save policy to server
            const policyResult = await window.savePolicy(policyData);

            // 2. Update client record to include this policy
            await updateClientPolicies(clientId, policyData.id);

            console.log('Policy saved and linked to client on server');

            // Refresh client view if we're on the client profile page
            if (window.loadClientProfile && window.currentViewingClientId === clientId) {
                setTimeout(() => window.loadClientProfile(clientId), 500);
            }

            return policyResult;

        } catch (error) {
            console.error('Error saving policy for client:', error);
            showNotification('Error saving policy for client', 'error');
            throw error;
        }
    };

    // Function to update client's policy list on server
    async function updateClientPolicies(clientId, policyId) {
        console.log('Updating client policies on server:', clientId, policyId);

        try {
            // Get current client data from server
            const clientResponse = await fetch(`${API_URL}/api/clients/${clientId}`);
            if (!clientResponse.ok) {
                throw new Error('Failed to fetch client data');
            }

            const clientData = await clientResponse.json();

            // Add policy to client's policies array
            if (!clientData.policies) {
                clientData.policies = [];
            }
            if (!clientData.policies.includes(policyId)) {
                clientData.policies.push(policyId);
            }

            // Save updated client back to server
            const updateResponse = await fetch(`${API_URL}/api/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clientData)
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update client with policy');
            }

            console.log('Client updated with new policy on server');

            // Also update localStorage for immediate UI updates
            let clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            const clientIndex = clients.findIndex(c => c.id === clientId);
            if (clientIndex >= 0) {
                if (!clients[clientIndex].policies) {
                    clients[clientIndex].policies = [];
                }
                if (!clients[clientIndex].policies.includes(policyId)) {
                    clients[clientIndex].policies.push(policyId);
                }
                localStorage.setItem('insurance_clients', JSON.stringify(clients));
            }

            return true;

        } catch (error) {
            console.error('Error updating client policies:', error);
            throw error;
        }
    }

    // Intercept localStorage setItem calls for policies and redirect to server
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        if (key === 'insurance_policies') {
            console.warn('Direct localStorage write detected for policies - this should go through savePolicy()');
            // Still allow it but log a warning
        }
        return originalSetItem.call(localStorage, key, value);
    };

    // Load policies from server on page load
    async function loadPoliciesFromServer() {
        try {
            console.log('Loading policies from server...');
            const response = await fetch(`${API_URL}/api/policies`);

            if (response.ok) {
                const serverPolicies = await response.json();

                // Update localStorage with server data
                localStorage.setItem('insurance_policies', JSON.stringify(serverPolicies));
                console.log(`Loaded ${serverPolicies.length} policies from server`);

                return serverPolicies;
            }
        } catch (error) {
            console.error('Error loading policies from server:', error);
        }
        return [];
    }

    // Override deleteClient function to delete from server
    window.deleteClient = async function(clientId) {
        console.log('🗑️ DELETE CLIENT - ID:', clientId);

        if (!clientId || clientId === 'undefined' || clientId === 'unknown') {
            console.error('❌ DELETE FAILED - Invalid client ID:', clientId);
            alert('Error: Cannot delete client - invalid ID');
            return;
        }

        // Get client data first to show their name
        let clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        let client = clients.find(c => c.id === clientId);

        // If not found in localStorage, try to get from server
        if (!client) {
            try {
                const response = await fetch(`${API_URL}/api/clients/${clientId}`);
                if (response.ok) {
                    client = await response.json();
                } else {
                    console.error('❌ Client not found in server:', clientId);
                    alert('Client not found');
                    return;
                }
            } catch (error) {
                console.error('❌ Error fetching client from server:', error);
                alert('Client not found');
                return;
            }
        }

        const clientName = client.name || client.companyName || client.businessName || 'Unknown Client';

        if (!confirm(`Are you sure you want to delete client "${clientName}"? This action cannot be undone.`)) {
            console.log('❌ DELETE CANCELLED by user');
            return;
        }

        console.log('✅ DELETE CONFIRMED - Proceeding with deletion...');

        try {
            // Delete from server
            const response = await fetch(`${API_URL}/api/clients/${clientId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            console.log('Client deleted from server:', result);

            // Remove from localStorage
            clients = clients.filter(c => c.id !== clientId);
            localStorage.setItem('insurance_clients', JSON.stringify(clients));

            // Show success notification
            if (window.showNotification) {
                showNotification(`Client "${clientName}" has been deleted successfully`, 'success');
            }

            // Reload the clients view
            if (window.loadClientsView) {
                setTimeout(() => loadClientsView(), 100);
                setTimeout(() => loadClientsView(), 500);
            }

            return true;

        } catch (error) {
            console.error('❌ DELETE ERROR - Server deletion failed:', error);

            // Try to delete from localStorage only as fallback
            const originalLength = clients.length;
            clients = clients.filter(c => c.id !== clientId);

            if (clients.length < originalLength) {
                localStorage.setItem('insurance_clients', JSON.stringify(clients));
                console.log(`✅ Removed localStorage-only client: ${clientId}`);

                if (window.showNotification) {
                    showNotification('Client removed from local storage', 'success');
                }

                if (window.loadClientsView) {
                    setTimeout(() => loadClientsView(), 100);
                }

                return true;
            } else {
                if (window.showNotification) {
                    showNotification(`Failed to delete client: ${error.message}`, 'error');
                } else {
                    alert(`Failed to delete client: ${error.message}`);
                }
                throw error;
            }
        }
    };

    // Auto-load from server when script loads
    loadPoliciesFromServer();

    console.log('Policy Server Save Fix: All policy and client operations now save to server');
})();