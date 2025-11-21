// Data Synchronization Module for Vanguard Insurance Platform
// This module handles all data persistence with the backend server

const DataSync = {
    // Backend API URL - Update this when deploying
    API_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:3001/api'
        : window.location.hostname.includes('github.io')
        ? 'http://162-220-14-239.nip.io:3001/api'
        : window.location.hostname.includes('nip.io')
        ? 'http://162-220-14-239.nip.io:3001/api'
        : 'http://162.220.14.239:3001/api',

    // Initialize data sync
    async init() {
        console.log('Initializing data sync...');

        // IMPORTANT: Preserve archived leads BEFORE loading from server
        const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
        const currentLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        // Build a complete set of archived IDs before any server load
        const archivedIdsToPreserve = new Set();
        archivedLeads.forEach(lead => {
            archivedIdsToPreserve.add(String(lead.id));
        });
        currentLeads.forEach(lead => {
            if (lead.archived === true) {
                archivedIdsToPreserve.add(String(lead.id));
            }
        });

        // Store this for use in loadAllData
        this.preservedArchivedIds = archivedIdsToPreserve;
        console.log(`DataSync: Preserving ${archivedIdsToPreserve.size} archived leads before server load`);

        // Check if we have local data to migrate
        const hasLocalData = this.checkLocalData();

        if (hasLocalData) {
            console.log('Migrating local data to server...');
            await this.migrateLocalData();
        }

        // Delay initial load to ensure archived status is preserved
        setTimeout(async () => {
            // Load data from server
            await this.loadAllData();
        }, 1000);

        // Set up auto-sync
        this.setupAutoSync();
    },

    // Check if there's local data to migrate
    checkLocalData() {
        const clients = localStorage.getItem('insurance_clients');
        const policies = localStorage.getItem('insurance_policies');
        const leads = localStorage.getItem('insurance_leads');

        return !!(clients || policies || leads);
    },

    // Migrate local data to server
    async migrateLocalData() {
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        if (clients.length > 0 || policies.length > 0 || leads.length > 0) {
            try {
                const response = await fetch(`${this.API_URL}/bulk-save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ clients, policies, leads })
                });

                if (response.ok) {
                    console.log('Local data migrated successfully');
                    // Clear migrated flag to prevent re-migration
                    localStorage.setItem('data_migrated', 'true');
                }
            } catch (error) {
                console.error('Error migrating data:', error);
            }
        }
    },

    // Load all data from server
    async loadAllData() {
        try {
            const response = await fetch(`${this.API_URL}/all-data`);
            if (response.ok) {
                const data = await response.json();

                // Get current leads AND archived leads to preserve archived status
                const currentLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
                const permanentArchive = JSON.parse(localStorage.getItem('PERMANENT_ARCHIVED_IDS') || '[]');
                const serverLeads = data.leads || [];

                // Build comprehensive sets of archived lead identifiers
                const archivedIds = new Set();
                const archivedPhones = new Set();
                const archivedEmails = new Set();

                // PERMANENT ARCHIVE - These IDs can NEVER be unarchived
                permanentArchive.forEach(id => {
                    archivedIds.add(String(id));
                });
                console.log(`DataSync: Found ${permanentArchive.length} permanently archived leads`);

                // Use preserved archived IDs from init if available
                if (this.preservedArchivedIds) {
                    this.preservedArchivedIds.forEach(id => archivedIds.add(id));
                    console.log(`DataSync: Using ${this.preservedArchivedIds.size} preserved archived IDs from init`);
                }

                // Collect ALL identifiers from archived leads
                archivedLeads.forEach(lead => {
                    archivedIds.add(String(lead.id));
                    if (lead.phone) {
                        archivedPhones.add(lead.phone.replace(/\D/g, ''));
                    }
                    if (lead.email) {
                        archivedEmails.add(lead.email.toLowerCase());
                    }
                });

                // Also check current leads for archived flag
                currentLeads.forEach(lead => {
                    if (lead.archived === true) {
                        archivedIds.add(String(lead.id));
                        if (lead.phone) {
                            archivedPhones.add(lead.phone.replace(/\D/g, ''));
                        }
                        if (lead.email) {
                            archivedEmails.add(lead.email.toLowerCase());
                        }
                    }
                });

                console.log(`DataSync: Tracking ${archivedIds.size} archived leads with ${archivedPhones.size} phones and ${archivedEmails.size} emails`);

                // Merge server data with local archived status - STRICT CHECKING
                const mergedLeads = serverLeads.map(serverLead => {
                    let shouldArchive = false;
                    let archiveReason = '';

                    // Check by ID
                    if (archivedIds.has(String(serverLead.id))) {
                        shouldArchive = true;
                        archiveReason = 'ID match';
                    }

                    // Check by phone
                    if (!shouldArchive && serverLead.phone) {
                        const cleanPhone = serverLead.phone.replace(/\D/g, '');
                        if (cleanPhone && archivedPhones.has(cleanPhone)) {
                            shouldArchive = true;
                            archiveReason = 'Phone match';
                        }
                    }

                    // Check by email
                    if (!shouldArchive && serverLead.email && archivedEmails.has(serverLead.email.toLowerCase())) {
                        shouldArchive = true;
                        archiveReason = 'Email match';
                    }

                    // Apply archived status if any match found
                    if (shouldArchive) {
                        serverLead.archived = true;

                        // Find the archived lead to get metadata
                        const archivedLead = archivedLeads.find(l =>
                            String(l.id) === String(serverLead.id) ||
                            (l.phone && serverLead.phone && l.phone.replace(/\D/g, '') === serverLead.phone.replace(/\D/g, '')) ||
                            (l.email && serverLead.email && l.email.toLowerCase() === serverLead.email.toLowerCase())
                        ) || currentLeads.find(l => String(l.id) === String(serverLead.id) && l.archived);

                        if (archivedLead) {
                            serverLead.archivedDate = archivedLead.archivedDate;
                            serverLead.archivedBy = archivedLead.archivedBy;
                        }

                        console.log(`DataSync: Marked as archived (${archiveReason}): ${serverLead.id} - ${serverLead.name}`);
                    }

                    return serverLead;
                });

                // IMPORTANT: Remove any leads from the merged list that shouldn't be there
                const finalLeads = mergedLeads.filter(lead => {
                    // Check permanent archive FIRST - these are NEVER allowed
                    if (permanentArchive.includes(String(lead.id))) {
                        console.log(`DataSync: Filtering out permanently archived lead: ${lead.id} - ${lead.name}`);
                        // Don't even keep it with archived flag - remove it completely
                        return false;
                    }

                    // If it's in archived leads, it shouldn't be in the main list at all
                    const isInArchived = archivedLeads.some(archived =>
                        String(archived.id) === String(lead.id) ||
                        (archived.phone && lead.phone && archived.phone.replace(/\D/g, '') === lead.phone.replace(/\D/g, ''))
                    );

                    if (isInArchived && !lead.archived) {
                        console.log(`DataSync: Removing duplicate lead that exists in archived: ${lead.id} - ${lead.name}`);
                        return false;
                    }

                    return true;
                });

                // CRITICAL: Separate archived and active leads COMPLETELY
                const activeLeadsOnly = finalLeads.filter(lead => !lead.archived && !permanentArchive.includes(String(lead.id)));
                const archivedLeadsOnly = finalLeads.filter(lead => lead.archived === true || permanentArchive.includes(String(lead.id)));

                // Update localStorage - ONLY non-archived leads go to insurance_leads
                localStorage.setItem('insurance_clients', JSON.stringify(data.clients || []));
                localStorage.setItem('insurance_policies', JSON.stringify(data.policies || []));
                localStorage.setItem('insurance_leads', JSON.stringify(activeLeadsOnly)); // ONLY ACTIVE LEADS

                // Update archived leads storage separately
                if (archivedLeadsOnly.length > 0) {
                    localStorage.setItem('archivedLeads', JSON.stringify(archivedLeadsOnly));
                }

                console.log(`Data loaded from server: ${activeLeadsOnly.length} ACTIVE leads, ${archivedLeadsOnly.length} ARCHIVED leads`);

                // Save archived leads back to server to persist the archived status
                const leadsToUpdateOnServer = finalLeads.filter(lead => lead.archived === true);
                if (leadsToUpdateOnServer.length > 0) {
                    console.log(`DataSync: Saving ${leadsToUpdateOnServer.length} archived leads back to server...`);
                    leadsToUpdateOnServer.forEach(lead => {
                        fetch('/api/leads', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(lead)
                        }).catch(error => {
                            console.error(`DataSync: Failed to save archived status for lead ${lead.id}:`, error);
                        });
                    });
                }

                // Trigger UI refresh if the app is loaded
                if (window.refreshDashboard) {
                    window.refreshDashboard();
                }

                // Update dashboard statistics
                if (window.updateDashboardStats) {
                    setTimeout(() => {
                        window.updateDashboardStats();
                    }, 200);
                }
            }
        } catch (error) {
            console.error('Error loading data from server:', error);
            // Fall back to localStorage if server is unavailable
        }
    },

    // Save client to server
    async saveClient(client) {
        try {
            const response = await fetch(`${this.API_URL}/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(client)
            });

            if (response.ok) {
                // Also update localStorage for immediate UI update
                const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
                const index = clients.findIndex(c => c.id === client.id);

                if (index >= 0) {
                    clients[index] = client;
                } else {
                    clients.push(client);
                }

                localStorage.setItem('insurance_clients', JSON.stringify(clients));
                return true;
            }
        } catch (error) {
            console.error('Error saving client:', error);
            // Fall back to localStorage only
            const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            const index = clients.findIndex(c => c.id === client.id);

            if (index >= 0) {
                clients[index] = client;
            } else {
                clients.push(client);
            }

            localStorage.setItem('insurance_clients', JSON.stringify(clients));
        }
        return false;
    },

    // Delete client from server
    async deleteClient(clientId) {
        try {
            const response = await fetch(`${this.API_URL}/clients/${clientId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Also update localStorage
                const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
                const filtered = clients.filter(c => c.id !== clientId);
                localStorage.setItem('insurance_clients', JSON.stringify(filtered));
                return true;
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            // Fall back to localStorage only
            const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            const filtered = clients.filter(c => c.id !== clientId);
            localStorage.setItem('insurance_clients', JSON.stringify(filtered));
        }
        return false;
    },

    // Save policy to server
    async savePolicy(policy) {
        try {
            const response = await fetch(`${this.API_URL}/policies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(policy)
            });

            if (response.ok) {
                // Also update localStorage
                const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                const index = policies.findIndex(p => p.id === policy.id);

                if (index >= 0) {
                    policies[index] = policy;
                } else {
                    policies.push(policy);
                }

                localStorage.setItem('insurance_policies', JSON.stringify(policies));
                return true;
            }
        } catch (error) {
            console.error('Error saving policy:', error);
            // Fall back to localStorage only
            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            const index = policies.findIndex(p => p.id === policy.id);

            if (index >= 0) {
                policies[index] = policy;
            } else {
                policies.push(policy);
            }

            localStorage.setItem('insurance_policies', JSON.stringify(policies));
        }
        return false;
    },

    // Delete policy from server
    async deletePolicy(policyId) {
        try {
            const response = await fetch(`${this.API_URL}/policies/${policyId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Also update localStorage
                const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                const filtered = policies.filter(p => p.id !== policyId);
                localStorage.setItem('insurance_policies', JSON.stringify(filtered));
                return true;
            }
        } catch (error) {
            console.error('Error deleting policy:', error);
            // Fall back to localStorage only
            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            const filtered = policies.filter(p => p.id !== policyId);
            localStorage.setItem('insurance_policies', JSON.stringify(filtered));
        }
        return false;
    },

    // Save lead to server
    async saveLead(lead) {
        try {
            const response = await fetch(`${this.API_URL}/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(lead)
            });

            if (response.ok) {
                // Also update localStorage
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const index = leads.findIndex(l => l.id === lead.id);

                if (index >= 0) {
                    leads[index] = lead;
                } else {
                    leads.push(lead);
                }

                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                return true;
            }
        } catch (error) {
            console.error('Error saving lead:', error);
            // Fall back to localStorage only
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const index = leads.findIndex(l => l.id === lead.id);

            if (index >= 0) {
                leads[index] = lead;
            } else {
                leads.push(lead);
            }

            localStorage.setItem('insurance_leads', JSON.stringify(leads));
        }
        return false;
    },

    // Delete lead from server
    async deleteLead(leadId) {
        try {
            const response = await fetch(`${this.API_URL}/leads/${leadId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Also update localStorage
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const filtered = leads.filter(l => l.id !== leadId);
                localStorage.setItem('insurance_leads', JSON.stringify(filtered));
                return true;
            }
        } catch (error) {
            console.error('Error deleting lead:', error);
            // Fall back to localStorage only
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const filtered = leads.filter(l => l.id !== leadId);
            localStorage.setItem('insurance_leads', JSON.stringify(filtered));
        }
        return false;
    },

    // Set up auto-sync to periodically sync with server
    setupAutoSync() {
        // Sync every 2 minutes instead of 30 seconds to reduce overwrites
        setInterval(() => {
            console.log('DataSync: Running periodic sync...');
            this.loadAllData();
        }, 120000);

        // Sync when window regains focus, but with a debounce to prevent rapid syncs
        let focusTimeout;
        window.addEventListener('focus', () => {
            clearTimeout(focusTimeout);
            focusTimeout = setTimeout(() => {
                console.log('DataSync: Window focused, syncing data...');
                this.loadAllData();
            }, 1000);
        });

        // Sync before page unload
        window.addEventListener('beforeunload', () => {
            // Quick sync attempt (may not always complete)
            this.syncLocalChanges();
        });
    },

    // Sync any local changes to server
    async syncLocalChanges() {
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        // Use bulk save for efficiency
        if (clients.length > 0 || policies.length > 0 || leads.length > 0) {
            try {
                await fetch(`${this.API_URL}/bulk-save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ clients, policies, leads })
                });
            } catch (error) {
                console.error('Error syncing changes:', error);
            }
        }
    }
};

// Initialize on page load - DELAYED to preserve archived status
document.addEventListener('DOMContentLoaded', () => {
    // Wait for other scripts to load archived status first
    setTimeout(() => {
        console.log('DataSync: Initializing after delay to preserve archived leads...');
        DataSync.init();
    }, 2000);
});

// Export for use in other modules
window.DataSync = DataSync;