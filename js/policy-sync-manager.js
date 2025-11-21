// DISABLED: Policy Sync Manager to prevent deletePolicy conflicts
console.log('🚫 Policy Sync Manager DISABLED to prevent deletePolicy conflicts');
return;

const PolicySyncManager = {
    // Backend API URL
    API_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:3001/api'
        : window.location.hostname.includes('github.io')
        ? 'http://162-220-14-239.nip.io:3001/api'
        : window.location.hostname.includes('nip.io')
        ? 'http://162-220-14-239.nip.io:3001/api'
        : 'http://162.220.14.239:3001/api',

    // Load all policies from server
    async loadPolicies() {
        try {
            console.log('Loading policies from server...');
            const response = await fetch(`${this.API_URL}/policies`);

            if (response.ok) {
                const policies = await response.json();

                // Update localStorage with server data
                localStorage.setItem('insurance_policies', JSON.stringify(policies || []));
                console.log(`Loaded ${policies.length} policies from server`);

                return policies;
            } else {
                console.error('Failed to load policies from server:', response.status);
                // Fallback to localStorage
                return JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            }
        } catch (error) {
            console.error('Error loading policies from server:', error);
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        }
    },

    // Save/Update a policy
    async savePolicy(policy) {
        try {
            console.log('Saving policy to server:', policy.policyNumber);

            // Ensure policy has an ID
            if (!policy.id) {
                policy.id = 'POL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            }

            const response = await fetch(`${this.API_URL}/policies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(policy)
            });

            if (response.ok) {
                console.log('Policy saved to server successfully');

                // Update localStorage
                const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                const index = policies.findIndex(p => p.id === policy.id);

                if (index >= 0) {
                    policies[index] = policy;
                } else {
                    policies.push(policy);
                }

                localStorage.setItem('insurance_policies', JSON.stringify(policies));
                return true;
            } else {
                console.error('Failed to save policy to server:', response.status);
                return false;
            }
        } catch (error) {
            console.error('Error saving policy to server:', error);

            // Fallback: Save to localStorage only
            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            const index = policies.findIndex(p => p.id === policy.id);

            if (index >= 0) {
                policies[index] = policy;
            } else {
                policies.push(policy);
            }

            localStorage.setItem('insurance_policies', JSON.stringify(policies));
            return false;
        }
    },

    // Delete a policy
    async deletePolicy(policyId) {
        try {
            console.log('Deleting policy from server:', policyId);

            const response = await fetch(`${this.API_URL}/policies/${policyId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log('Policy deleted from server successfully');

                // Update localStorage
                const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                const filtered = policies.filter(p => p.id !== policyId);
                localStorage.setItem('insurance_policies', JSON.stringify(filtered));

                return true;
            } else {
                console.error('Failed to delete policy from server:', response.status);
                return false;
            }
        } catch (error) {
            console.error('Error deleting policy from server:', error);

            // Fallback: Delete from localStorage only
            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            const filtered = policies.filter(p => p.id !== policyId);
            localStorage.setItem('insurance_policies', JSON.stringify(filtered));

            return false;
        }
    },

    // Initialize and set up auto-sync
    async init() {
        console.log('Initializing Policy Sync Manager...');

        // Load policies from server on startup
        await this.loadPolicies();

        // Set up periodic sync (every 30 seconds)
        setInterval(() => {
            this.loadPolicies();
        }, 30000);

        // Sync on window focus
        window.addEventListener('focus', () => {
            this.loadPolicies();
        });

        // Override the global functions if they exist
        if (window.savePolicy) {
            const originalSavePolicy = window.savePolicy;
            window.savePolicy = async function() {
                const result = await originalSavePolicy.apply(this, arguments);
                // After local save, sync with server
                const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                if (policies.length > 0) {
                    const latestPolicy = policies[policies.length - 1];
                    await PolicySyncManager.savePolicy(latestPolicy);
                }
                return result;
            };
        }

        // Override deletePolicy functions
        if (window.deletePolicy) {
            const originalDeletePolicy = window.deletePolicy;
            window.deletePolicy = async function(policyId, clientId) {
                // Use our server-synced version
                const success = await PolicySyncManager.deletePolicy(policyId);
                if (success) {
                    // Refresh views
                    if (window.location.hash === '#policies' && window.loadPoliciesView) {
                        window.loadPoliciesView();
                    }
                    if (clientId && window.viewClient) {
                        window.viewClient(clientId);
                    }

                    // Show notification
                    if (window.showNotification) {
                        window.showNotification('Policy deleted successfully!', 'success');
                    }

                    // Close any open modals
                    const deleteModal = document.getElementById('deleteConfirmModal');
                    if (deleteModal) deleteModal.remove();

                    const viewModal = document.getElementById('policyViewModal');
                    if (viewModal) viewModal.remove();
                }
                return success;
            };
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        PolicySyncManager.init();
    }, 1000);
});

// Export for use in other modules
window.PolicySyncManager = PolicySyncManager;