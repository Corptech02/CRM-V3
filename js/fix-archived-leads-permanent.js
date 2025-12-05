/**
 * Permanent fix for archived leads - ensures they NEVER reappear in main lead list
 */

(function() {
    'use strict';

    console.log('Archived leads permanent fix loading...');

    // Store archived lead IDs separately to ensure they're never lost
    function getArchivedLeadIds() {
        return JSON.parse(localStorage.getItem('archived_lead_ids') || '[]');
    }

    function addArchivedLeadId(leadId) {
        const archivedIds = getArchivedLeadIds();
        if (!archivedIds.includes(String(leadId))) {
            archivedIds.push(String(leadId));
            localStorage.setItem('archived_lead_ids', JSON.stringify(archivedIds));
        }
    }

    function removeArchivedLeadId(leadId) {
        const archivedIds = getArchivedLeadIds();
        const filtered = archivedIds.filter(id => id !== String(leadId));
        localStorage.setItem('archived_lead_ids', JSON.stringify(filtered));
    }

    // DISABLED: Override archiveLead function to track archived IDs
    // This was causing issues with user confirmation dialogs being bypassed
    // The archived-leads-functionality.js file handles archiving properly with confirmation
    /*
    const originalArchiveLead = window.archiveLead;
    window.archiveLead = function(leadId) {
        console.log('Archiving lead permanently:', leadId);

        // Mark lead as archived in all storage locations
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let found = false;

        leads = leads.map(lead => {
            if (String(lead.id) === String(leadId)) {
                lead.archived = true;
                found = true;
                // Add to archived IDs list
                addArchivedLeadId(leadId);
            }
            return lead;
        });

        if (found) {
            // Save to all storage locations
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            localStorage.setItem('leads', JSON.stringify(leads));

            // Also save to archived leads storage
            const archivedLeads = JSON.parse(localStorage.getItem('archived_leads') || '[]');
            const archivedLead = leads.find(l => String(l.id) === String(leadId));
            if (archivedLead && !archivedLeads.find(l => String(l.id) === String(leadId))) {
                archivedLeads.push(archivedLead);
                localStorage.setItem('archived_leads', JSON.stringify(archivedLeads));
            }

            // Refresh the view
            if (typeof loadLeadsView === 'function') {
                loadLeadsView();
            }

            // Show notification
            if (window.showNotification) {
                showNotification('Lead archived successfully', 'success');
            }
        }

        // Call original if it exists
        if (originalArchiveLead) {
            return originalArchiveLead.call(this, leadId);
        }
    };
    */

    // Filter function to exclude archived leads
    function filterOutArchivedLeads(leads) {
        const archivedIds = getArchivedLeadIds();
        return leads.filter(lead => {
            // Check multiple conditions for archived status
            const isArchived = lead.archived === true ||
                               lead.archived === 'true' ||
                               archivedIds.includes(String(lead.id));
            return !isArchived;
        });
    }

    // Override ALL sync functions to respect archived flag
    const syncFunctions = [
        'syncVicidialLeads',
        'syncNewVicidialLeads',
        'forceAddVicidialLeads',
        'importVicidialLeads',
        'refreshLeads'
    ];

    syncFunctions.forEach(funcName => {
        const original = window[funcName];
        if (original) {
            window[funcName] = async function(...args) {
                console.log(`Running ${funcName} with archived filter...`);

                // Call original function
                const result = await original.apply(this, args);

                // After sync, filter out archived leads
                setTimeout(() => {
                    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                    const beforeCount = leads.length;

                    // Filter out archived leads
                    leads = filterOutArchivedLeads(leads);

                    const afterCount = leads.length;
                    if (beforeCount !== afterCount) {
                        console.log(`Filtered out ${beforeCount - afterCount} archived leads after ${funcName}`);

                        // Save filtered leads back
                        localStorage.setItem('insurance_leads', JSON.stringify(leads));
                        localStorage.setItem('leads', JSON.stringify(leads));

                        // Refresh view if needed
                        if (typeof loadLeadsView === 'function') {
                            loadLeadsView();
                        }
                    }
                }, 100);

                return result;
            };
        }
    });

    // Override localStorage setItem to filter archived leads
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
        if (key === 'insurance_leads' || key === 'leads') {
            try {
                let leads = JSON.parse(value);
                if (Array.isArray(leads)) {
                    // Filter out archived leads before saving
                    const filteredLeads = filterOutArchivedLeads(leads);
                    if (filteredLeads.length !== leads.length) {
                        console.log(`Filtering out ${leads.length - filteredLeads.length} archived leads from ${key}`);
                        value = JSON.stringify(filteredLeads);
                    }
                }
            } catch (e) {
                // Not JSON or not an array, proceed normally
            }
        }
        return originalSetItem.call(this, key, value);
    };

    // Clean up on load
    function cleanupArchivedLeads() {
        console.log('Cleaning up archived leads on load...');

        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const beforeCount = leads.length;

        // Filter out archived leads
        leads = filterOutArchivedLeads(leads);

        const afterCount = leads.length;
        if (beforeCount !== afterCount) {
            console.log(`Removed ${beforeCount - afterCount} archived leads on load`);

            // Save filtered leads back WITHOUT triggering setItem override
            originalSetItem.call(localStorage, 'insurance_leads', JSON.stringify(leads));
            originalSetItem.call(localStorage, 'leads', JSON.stringify(leads));
        }

        // Also ensure archived_leads storage is populated
        const archivedLeads = JSON.parse(localStorage.getItem('archived_leads') || '[]');
        const archivedIds = getArchivedLeadIds();

        if (archivedIds.length > 0 && archivedLeads.length === 0) {
            // Reconstruct archived leads from IDs if needed
            const allLeadsWithArchived = JSON.parse(localStorage.getItem('all_leads_backup') || '[]');
            const reconstructed = allLeadsWithArchived.filter(lead =>
                archivedIds.includes(String(lead.id))
            );
            if (reconstructed.length > 0) {
                localStorage.setItem('archived_leads', JSON.stringify(reconstructed));
                console.log(`Reconstructed ${reconstructed.length} archived leads`);
            }
        }
    }

    // Run cleanup immediately
    cleanupArchivedLeads();

    // Also run cleanup periodically to catch any sync operations
    setInterval(cleanupArchivedLeads, 30000); // Every 30 seconds

    // Override loadLeadsView to always filter archived leads
    const originalLoadLeadsView = window.loadLeadsView;
    if (originalLoadLeadsView) {
        window.loadLeadsView = function(...args) {
            // Clean up before loading
            cleanupArchivedLeads();

            // Call original
            return originalLoadLeadsView.apply(this, args);
        };
    }

    console.log('Archived leads permanent fix installed - archived leads will NEVER reappear');

})();