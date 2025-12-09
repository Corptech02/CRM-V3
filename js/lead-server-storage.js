// Lead Server Storage Module
// Handles saving and retrieving leads from the server instead of localStorage

// Save a single lead to server
async function saveLeadToServer(lead) {
    try {
        const response = await fetch('/api/leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(lead)
        });

        if (!response.ok) {
            throw new Error('Failed to save lead to server');
        }

        const result = await response.json();
        console.log('Lead saved to server:', result);
        return result;
    } catch (error) {
        console.error('Error saving lead to server:', error);
        throw error;
    }
}

// Save multiple leads to server
async function saveLeadsToServer(leads) {
    const results = [];
    const errors = [];

    for (const lead of leads) {
        try {
            const result = await saveLeadToServer(lead);
            results.push(result);
        } catch (error) {
            console.error('Error saving lead:', lead.id, error);
            errors.push({ lead, error });
        }
    }

    if (errors.length > 0) {
        console.warn(`Failed to save ${errors.length} leads to server`);
    }

    return { saved: results, failed: errors };
}

// Load all leads from server
async function loadLeadsFromServer() {
    try {
        const response = await fetch('/api/leads');

        if (!response.ok) {
            throw new Error('Failed to load leads from server');
        }

        const leads = await response.json();
        console.log(`Loaded ${leads.length} leads from server`);

        // Also update localStorage as a cache/backup - using both keys for compatibility
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));

        return leads;
    } catch (error) {
        console.error('Error loading leads from server:', error);
        // Fallback to localStorage if server fails - check both keys
        return JSON.parse(localStorage.getItem('insurance_leads') || localStorage.getItem('leads') || '[]');
    }
}

// Delete lead from server
async function deleteLeadFromServer(leadId) {
    try {
        const response = await fetch(`/api/leads/${leadId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete lead from server');
        }

        console.log('Lead deleted from server:', leadId);
        return true;
    } catch (error) {
        console.error('Error deleting lead from server:', error);
        throw error;
    }
}

// Archive lead on server
async function archiveLeadOnServer(lead) {
    try {
        const response = await fetch('/api/archived-leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(lead)
        });

        if (!response.ok) {
            throw new Error('Failed to archive lead on server');
        }

        console.log('Lead archived on server:', lead.id);
        return true;
    } catch (error) {
        console.error('Error archiving lead on server:', error);
        throw error;
    }
}

// Import leads - saves both to server and localStorage
async function importLeadsToServer(newLeads) {
    try {
        // First, get existing leads from server
        const existingLeads = await loadLeadsFromServer();

        // Add new leads with proper IDs and timestamps
        const leadsToAdd = newLeads.map((lead, index) => ({
            ...lead,
            id: lead.id || `imported_${Date.now()}_${index}`,
            createdAt: lead.createdAt || new Date().toISOString(),
            stage: lead.stage || 'new',
            product: lead.product || 'General Insurance'
        }));

        // Save new leads to server
        const saveResults = await saveLeadsToServer(leadsToAdd);

        // Update localStorage with combined data
        const allLeads = [...existingLeads, ...saveResults.saved];
        localStorage.setItem('insurance_leads', JSON.stringify(allLeads));

        console.log(`Successfully imported ${saveResults.saved.length} leads to server`);
        if (saveResults.failed.length > 0) {
            console.warn(`Failed to import ${saveResults.failed.length} leads`);
        }

        return saveResults;
    } catch (error) {
        console.error('Error importing leads to server:', error);
        throw error;
    }
}

// Update existing lead on server
async function updateLeadOnServer(leadId, updates) {
    try {
        // Get the existing lead
        const leads = await loadLeadsFromServer();
        const existingLead = leads.find(l => l.id === leadId);

        if (!existingLead) {
            throw new Error(`Lead ${leadId} not found`);
        }

        // Merge updates with existing lead
        const updatedLead = {
            ...existingLead,
            ...updates,
            id: leadId, // Ensure ID doesn't change
            updatedAt: new Date().toISOString()
        };

        // Save to server
        const result = await saveLeadToServer(updatedLead);

        // Update localStorage cache
        const updatedLeads = leads.map(l => l.id === leadId ? result : l);
        localStorage.setItem('insurance_leads', JSON.stringify(updatedLeads));

        console.log('Lead updated on server:', leadId);
        return result;
    } catch (error) {
        console.error('Error updating lead on server:', error);
        throw error;
    }
}

// Sync localStorage leads to server (for migration)
async function syncLocalLeadsToServer() {
    try {
        const localLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        if (localLeads.length === 0) {
            console.log('No local leads to sync');
            return;
        }

        console.log(`Syncing ${localLeads.length} local leads to server...`);

        const results = await saveLeadsToServer(localLeads);

        console.log(`Successfully synced ${results.saved.length} leads to server`);
        if (results.failed.length > 0) {
            console.warn(`Failed to sync ${results.failed.length} leads`);
        }

        return results;
    } catch (error) {
        console.error('Error syncing local leads to server:', error);
        throw error;
    }
}

// Make functions available globally
window.saveLeadToServer = saveLeadToServer;
window.saveLeadsToServer = saveLeadsToServer;
window.loadLeadsFromServer = loadLeadsFromServer;
window.deleteLeadFromServer = deleteLeadFromServer;
window.archiveLeadOnServer = archiveLeadOnServer;
window.importLeadsToServer = importLeadsToServer;
window.updateLeadOnServer = updateLeadOnServer;
window.syncLocalLeadsToServer = syncLocalLeadsToServer;

// Auto-sync on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing lead server storage...');

    // Load leads from server on startup
    await loadLeadsFromServer();

    // Optional: Sync any local-only leads to server
    // This helps migrate existing localStorage data to server
    const serverLeads = await loadLeadsFromServer();
    const localLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

    const serverIds = new Set(serverLeads.map(l => String(l.id)));
    const unsyncedLeads = localLeads.filter(l => !serverIds.has(String(l.id)));

    if (unsyncedLeads.length > 0) {
        console.log(`Found ${unsyncedLeads.length} unsynced leads, syncing to server...`);
        await saveLeadsToServer(unsyncedLeads);
    }
});

console.log('Lead Server Storage module loaded');