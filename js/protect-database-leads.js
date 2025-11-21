/**
 * Protect ViciDial leads stored in database from localStorage clearing
 * Ensures leads are loaded from server database, not localStorage
 */

(function() {
    'use strict';

    console.log('🛡️ Protecting database-stored ViciDial leads from localStorage clearing...');

    // Function to load leads from server database instead of localStorage
    async function loadLeadsFromDatabase() {
        try {
            console.log('📡 Loading leads from server database...');

            const response = await fetch('/api/leads', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const leads = await response.json(); // Server returns array directly, not wrapped in object

                // Filter out any leads that have been marked as deleted
                const deletedLeadIds = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');
                const filteredLeads = leads.filter(lead => !deletedLeadIds.includes(String(lead.id)));

                console.log(`✅ Loaded ${leads.length} leads from server database`);
                if (filteredLeads.length !== leads.length) {
                    console.log(`🚫 Filtered out ${leads.length - filteredLeads.length} deleted leads`);
                }

                // Update localStorage with filtered server data (but server is the source of truth)
                localStorage.setItem('insurance_leads', JSON.stringify(filteredLeads));
                localStorage.setItem('leads', JSON.stringify(filteredLeads));

                return filteredLeads;
            } else {
                console.warn('⚠️ Failed to load leads from server database');
                return [];
            }
        } catch (error) {
            console.error('❌ Error loading leads from database:', error);
            return [];
        }
    }

    // Function to save a lead to the server database
    async function saveLeadToDatabase(leadData) {
        try {
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(leadData)
            });

            if (response.ok) {
                console.log(`✅ Lead ${leadData.name || leadData.id} saved to server database`);
                return true;
            } else {
                console.warn(`⚠️ Failed to save lead ${leadData.name || leadData.id} to database`);
                return false;
            }
        } catch (error) {
            console.error('❌ Error saving lead to database:', error);
            return false;
        }
    }

    // Function to delete a lead from the server database
    async function deleteLeadFromDatabase(leadId) {
        try {
            const response = await fetch(`/api/leads/${leadId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                console.log(`✅ Lead ${leadId} deleted from server database`);
                return true;
            } else {
                console.warn(`⚠️ Failed to delete lead ${leadId} from database`);
                return false;
            }
        } catch (error) {
            console.error('❌ Error deleting lead from database:', error);
            return false;
        }
    }

    // Override functions that might clear leads to restore from database
    const originalClear = localStorage.clear;
    localStorage.clear = function() {
        console.log('🔄 localStorage.clear() called - will restore leads from database');

        // CRITICAL: Preserve deleted lead IDs before clearing localStorage
        const deletedLeadIds = localStorage.getItem('DELETED_LEAD_IDS');

        originalClear.call(this);

        // Restore deleted lead IDs immediately after clearing
        if (deletedLeadIds) {
            localStorage.setItem('DELETED_LEAD_IDS', deletedLeadIds);
            console.log(`🛡️ Preserved ${JSON.parse(deletedLeadIds).length} deleted lead IDs across localStorage clear`);
        }

        // Restore leads from database after clearing
        setTimeout(async () => {
            await loadLeadsFromDatabase();

            // Trigger leads view refresh if on leads page
            if (window.location.hash === '#leads' && typeof window.loadLeadsView === 'function') {
                window.loadLeadsView();
            }
        }, 100);
    };

    // Override removeItem to restore leads if they're cleared
    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = function(key) {
        if (key === 'insurance_leads' || key === 'leads') {
            console.log(`🔄 localStorage.removeItem('${key}') called - will restore from database`);
            originalRemoveItem.call(this, key);

            // Restore from database
            setTimeout(async () => {
                await loadLeadsFromDatabase();

                // Trigger refresh if needed
                if (window.location.hash === '#leads' && typeof window.loadLeadsView === 'function') {
                    window.loadLeadsView();
                }
            }, 100);
        } else {
            originalRemoveItem.call(this, key);
        }
    };

    // Override setItem to sync important lead changes to database
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.call(this, key, value);

        if (key === 'insurance_leads' || key === 'leads') {
            try {
                const leads = JSON.parse(value);
                if (Array.isArray(leads) && leads.length > 0) {
                    // Get list of deleted lead IDs to avoid re-saving them
                    const deletedLeadIds = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');

                    // TEMPORARILY DISABLED - Check if any leads are from ViciDial and save them to database
                    // BUT do not save deleted leads
                    console.log('🚫 ViciDial lead auto-saving temporarily disabled for cleanup');

                    // CRITICAL: After processing leads, wait a moment for any deletion operations to complete,
                    // then check for leads that should be deleted from the server
                    setTimeout(() => {
                        const updatedDeletedIds = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');
                        updatedDeletedIds.forEach(deletedId => {
                            // Check if this deleted ID somehow got re-saved to server and remove it
                            fetch('/api/leads/' + deletedId)
                                .then(response => {
                                    if (response.ok) {
                                        console.log(`🚫 CLEANUP: Removing re-saved deleted lead ${deletedId} from server`);
                                        return fetch('/api/leads/' + deletedId, { method: 'DELETE' });
                                    }
                                })
                                .catch(error => console.log(`Cleanup check for ${deletedId}:`, error));
                        });
                    }, 2000);
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
    };

    // Add API endpoint handler for loading leads
    window.loadLeadsFromDatabase = loadLeadsFromDatabase;
    window.saveLeadToDatabase = saveLeadToDatabase;
    window.deleteLeadFromDatabase = deleteLeadFromDatabase;

    // Automatically load leads from database when the page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(loadLeadsFromDatabase, 1000);
        });
    } else {
        setTimeout(loadLeadsFromDatabase, 1000);
    }

    // Refresh leads from database when navigating to leads page
    const originalAddEventListener = window.addEventListener;
    window.addEventListener('hashchange', async function(e) {
        if (window.location.hash === '#leads') {
            console.log('🔄 Navigated to leads page - refreshing from database');
            await loadLeadsFromDatabase();
        }
    });

    // Monitor for ViciDial sync completion and save to database
    document.addEventListener('vicidialSyncComplete', async function(e) {
        console.log('🔄 ViciDial sync completed - saving leads to database');

        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const deletedLeadIds = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');

        for (const lead of leads) {
            if ((lead.source === 'ViciDial' || lead.listId) &&
                !deletedLeadIds.includes(String(lead.id))) {
                await saveLeadToDatabase(lead);
            }
        }
    });

    // Cleanup function to remove any deleted leads that accidentally got re-saved to database
    async function cleanupDeletedLeadsFromDatabase() {
        const deletedLeadIds = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');

        if (deletedLeadIds.length > 0) {
            console.log(`🧹 Cleaning up ${deletedLeadIds.length} deleted leads from database...`);

            for (const leadId of deletedLeadIds) {
                try {
                    await deleteLeadFromDatabase(leadId);
                } catch (error) {
                    // Lead might already be deleted, ignore errors
                }
            }
        }
    }

    // Run cleanup periodically
    setInterval(cleanupDeletedLeadsFromDatabase, 30000); // Every 30 seconds

    // Also expose the cleanup function globally
    window.cleanupDeletedLeadsFromDatabase = cleanupDeletedLeadsFromDatabase;

    console.log('✅ Database lead protection active - ViciDial leads will persist even after localStorage clearing');

})();