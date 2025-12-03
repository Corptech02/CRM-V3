// Fix permanent delete functionality and prevent deleted leads from reappearing
(function() {
    'use strict';

    console.log('🗑️ FIX-PERMANENT-DELETE: Ensuring deleted leads stay deleted...');

    // Track permanently deleted lead IDs
    let deletedLeadIds = JSON.parse(localStorage.getItem('permanentlyDeletedLeads') || '[]');

    // Override permanentlyDeleteLead function
    window.permanentlyDeleteLead = function(leadId) {
        if (!confirm('Are you sure you want to permanently delete this lead? This action cannot be undone.')) {
            return;
        }

        console.log('🗑️ Permanently deleting lead:', leadId);
        leadId = String(leadId);

        // Get archived leads
        let archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
        const leadIndex = archivedLeads.findIndex(l => String(l.id) === leadId);

        if (leadIndex === -1) {
            showNotification('Archived lead not found', 'error');
            return;
        }

        const lead = archivedLeads[leadIndex];

        // Remove from archived leads
        archivedLeads.splice(leadIndex, 1);
        localStorage.setItem('archivedLeads', JSON.stringify(archivedLeads));

        // Add to permanently deleted list
        if (!deletedLeadIds.includes(leadId)) {
            deletedLeadIds.push(leadId);
            localStorage.setItem('permanentlyDeletedLeads', JSON.stringify(deletedLeadIds));
        }

        // Also delete from server
        if (window.api && window.api.deleteLead) {
            window.api.deleteLead(leadId).catch(err => {
                console.error('Error deleting from server:', err);
            });
        }

        showNotification(`Lead "${lead.name}" permanently deleted`, 'success');

        // Reload the archived view
        loadArchivedLeadsView();
    };

    // Intercept data sync to filter out deleted leads
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        if (key === 'archivedLeads' || key === 'insurance_leads') {
            try {
                let data = JSON.parse(value);
                if (Array.isArray(data)) {
                    // Filter out permanently deleted leads
                    const deletedIds = JSON.parse(localStorage.getItem('permanentlyDeletedLeads') || '[]');
                    data = data.filter(lead => !deletedIds.includes(String(lead.id)));
                    value = JSON.stringify(data);
                }
            } catch (e) {
                // Not JSON or error parsing, let it through
            }
        }
        return originalSetItem.call(localStorage, key, value);
    };

    // Override DataSync if it exists
    if (window.DataSync && window.DataSync.loadAllData) {
        const originalLoadAllData = window.DataSync.loadAllData;
        window.DataSync.loadAllData = async function() {
            console.log('🛡️ DataSync: Filtering permanently deleted leads...');

            const deletedIds = JSON.parse(localStorage.getItem('permanentlyDeletedLeads') || '[]');
            const result = await originalLoadAllData.call(this);

            // Filter out deleted leads from both active and archived
            setTimeout(() => {
                let archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
                let activeLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

                const filteredArchived = archivedLeads.filter(lead =>
                    !deletedIds.includes(String(lead.id))
                );
                const filteredActive = activeLeads.filter(lead =>
                    !deletedIds.includes(String(lead.id))
                );

                if (filteredArchived.length !== archivedLeads.length) {
                    console.log(`✅ Filtered ${archivedLeads.length - filteredArchived.length} deleted leads from archived`);
                    originalSetItem.call(localStorage, 'archivedLeads', JSON.stringify(filteredArchived));
                }

                if (filteredActive.length !== activeLeads.length) {
                    console.log(`✅ Filtered ${activeLeads.length - filteredActive.length} deleted leads from active`);
                    originalSetItem.call(localStorage, 'insurance_leads', JSON.stringify(filteredActive));
                }

                // Refresh view if on archived leads page
                const currentHash = window.location.hash;
                if (currentHash.includes('archived')) {
                    loadArchivedLeadsView();
                }
            }, 100);

            return result;
        };
    }

    // Clean up any deleted leads that may have reappeared
    function cleanupDeletedLeads() {
        const deletedIds = JSON.parse(localStorage.getItem('permanentlyDeletedLeads') || '[]');
        if (deletedIds.length === 0) return;

        let archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
        const originalCount = archivedLeads.length;

        archivedLeads = archivedLeads.filter(lead =>
            !deletedIds.includes(String(lead.id))
        );

        if (archivedLeads.length !== originalCount) {
            console.log(`🧹 Cleaned ${originalCount - archivedLeads.length} deleted leads that reappeared`);
            originalSetItem.call(localStorage, 'archivedLeads', JSON.stringify(archivedLeads));

            // Refresh view if on archived leads
            if (window.location.hash.includes('archived')) {
                loadArchivedLeadsView();
            }
        }
    }

    // Run cleanup periodically - DISABLED to prevent blinking
    // setInterval(cleanupDeletedLeads, 3000);

    // Initial cleanup
    cleanupDeletedLeads();

    console.log('✅ FIX-PERMANENT-DELETE: Ready - deleted leads will stay deleted');
})();