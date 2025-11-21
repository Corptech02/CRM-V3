// CRM API Integration - Centralized data storage for all devices
// This replaces localStorage with server-side storage

const CRM_API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8880'
    : window.location.hostname.includes('github.io')
    ? 'https://silver-shirts-flash.loca.lt'
    : 'http://162.220.14.239:8880';

const crmAPI = {
    // === POLICIES ===
    policies: {
        // Get all policies
        getAll: async function() {
            try {
                const response = await fetch(`${CRM_API_URL}/api/policies`, {
                    headers: {
                        'Accept': 'application/json',
                        'Bypass-Tunnel-Reminder': 'true'
                    }
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Error fetching policies:', error);
                return [];
            }
        },

        // Create new policy
        create: async function(policy) {
            try {
                const response = await fetch(`${CRM_API_URL}/api/policies`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Bypass-Tunnel-Reminder': 'true'
                    },
                    body: JSON.stringify(policy)
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Error creating policy:', error);
                throw error;
            }
        },

        // Update policy
        update: async function(id, policy) {
            try {
                const response = await fetch(`${CRM_API_URL}/api/policies/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Bypass-Tunnel-Reminder': 'true'
                    },
                    body: JSON.stringify(policy)
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Error updating policy:', error);
                throw error;
            }
        },

        // Delete policy
        delete: async function(id) {
            try {
                const response = await fetch(`${CRM_API_URL}/api/policies/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Bypass-Tunnel-Reminder': 'true'
                    }
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return true;
            } catch (error) {
                console.error('Error deleting policy:', error);
                throw error;
            }
        }
    },

    // === CLIENTS ===
    clients: {
        // Get all clients
        getAll: async function() {
            try {
                const response = await fetch(`${CRM_API_URL}/api/clients`, {
                    headers: {
                        'Accept': 'application/json',
                        'Bypass-Tunnel-Reminder': 'true'
                    }
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Error fetching clients:', error);
                return [];
            }
        },

        // Create new client
        create: async function(client) {
            try {
                const response = await fetch(`${CRM_API_URL}/api/clients`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Bypass-Tunnel-Reminder': 'true'
                    },
                    body: JSON.stringify(client)
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Error creating client:', error);
                throw error;
            }
        },

        // Update client
        update: async function(id, client) {
            try {
                const response = await fetch(`${CRM_API_URL}/api/clients/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Bypass-Tunnel-Reminder': 'true'
                    },
                    body: JSON.stringify(client)
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Error updating client:', error);
                throw error;
            }
        },

        // Delete client
        delete: async function(id) {
            try {
                const response = await fetch(`${CRM_API_URL}/api/clients/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Bypass-Tunnel-Reminder': 'true'
                    }
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return true;
            } catch (error) {
                console.error('Error deleting client:', error);
                throw error;
            }
        }
    },

    // === LEADS ===
    leads: {
        // Get all leads
        getAll: async function() {
            try {
                const response = await fetch(`${CRM_API_URL}/api/leads`, {
                    headers: {
                        'Accept': 'application/json',
                        'Bypass-Tunnel-Reminder': 'true'
                    }
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Error fetching leads:', error);
                return [];
            }
        },

        // Create new lead
        create: async function(lead) {
            try {
                const response = await fetch(`${CRM_API_URL}/api/leads`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Bypass-Tunnel-Reminder': 'true'
                    },
                    body: JSON.stringify(lead)
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Error creating lead:', error);
                throw error;
            }
        },

        // Bulk create leads
        createBulk: async function(leads) {
            try {
                const response = await fetch(`${CRM_API_URL}/api/leads/bulk`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Bypass-Tunnel-Reminder': 'true'
                    },
                    body: JSON.stringify({ leads })
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Error creating bulk leads:', error);
                throw error;
            }
        },

        // Update lead
        update: async function(id, lead) {
            try {
                const response = await fetch(`${CRM_API_URL}/api/leads/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Bypass-Tunnel-Reminder': 'true'
                    },
                    body: JSON.stringify(lead)
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Error updating lead:', error);
                throw error;
            }
        },

        // Delete lead
        delete: async function(id) {
            try {
                const response = await fetch(`${CRM_API_URL}/api/leads/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Bypass-Tunnel-Reminder': 'true'
                    }
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return true;
            } catch (error) {
                console.error('Error deleting lead:', error);
                throw error;
            }
        }
    },

    // === MIGRATION HELPERS ===
    migration: {
        // Migrate localStorage data to server
        migrateFromLocalStorage: async function() {
            try {
                console.log('Starting migration from localStorage to server...');

                // Migrate policies
                const localPolicies = JSON.parse(localStorage.getItem('policies') || '[]');
                if (localPolicies.length > 0) {
                    console.log(`Migrating ${localPolicies.length} policies...`);
                    for (const policy of localPolicies) {
                        try {
                            await crmAPI.policies.create(policy);
                        } catch (e) {
                            console.warn('Policy already exists or error:', e);
                        }
                    }
                }

                // Migrate clients
                const localClients = JSON.parse(localStorage.getItem('clients') || '[]');
                if (localClients.length > 0) {
                    console.log(`Migrating ${localClients.length} clients...`);
                    for (const client of localClients) {
                        try {
                            await crmAPI.clients.create(client);
                        } catch (e) {
                            console.warn('Client already exists or error:', e);
                        }
                    }
                }

                // Migrate leads
                const localLeads = JSON.parse(localStorage.getItem('generatedLeads') || '[]');
                if (localLeads.length > 0) {
                    console.log(`Migrating ${localLeads.length} leads...`);
                    await crmAPI.leads.createBulk(localLeads);
                }

                console.log('Migration completed!');
                return true;
            } catch (error) {
                console.error('Migration failed:', error);
                return false;
            }
        }
    },

    // === HEALTH CHECK ===
    health: async function() {
        try {
            const response = await fetch(`${CRM_API_URL}/api/crm/health`, {
                headers: {
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('CRM API health check failed:', error);
            return false;
        }
    }
};

// Auto-initialize on page load
window.addEventListener('DOMContentLoaded', async function() {
    console.log('CRM API integration loaded');

    // Check if CRM API is available
    const isHealthy = await crmAPI.health();
    if (isHealthy) {
        console.log('✅ CRM API is connected and healthy');

        // Check if we need to migrate localStorage data
        const hasMigrated = localStorage.getItem('crm_migrated');
        if (!hasMigrated) {
            console.log('First time using CRM API, migrating localStorage data...');
            const migrationSuccess = await crmAPI.migration.migrateFromLocalStorage();
            if (migrationSuccess) {
                localStorage.setItem('crm_migrated', 'true');
                console.log('✅ Migration completed successfully');
            }
        }
    } else {
        console.warn('⚠️ CRM API is not available, falling back to localStorage');
    }
});

// Export for use in other scripts
window.crmAPI = crmAPI;