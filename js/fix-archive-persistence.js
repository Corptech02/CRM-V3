// Fix Archive Persistence - Prevent archived leads from reappearing
console.log('🔧 Fixing archive persistence...');

(function() {
    // Store original loadAllData function
    const originalLoadAllData = window.DataSync && window.DataSync.loadAllData;

    if (originalLoadAllData) {
        // Override loadAllData to respect archived status
        window.DataSync.loadAllData = async function() {
            console.log('🛡️ Enhanced loadAllData - preserving archived status');

            // Get current archived leads and permanent archive BEFORE sync
            const permanentArchive = JSON.parse(localStorage.getItem('permanentArchive') || '[]');
            const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
            const archivedIds = new Set([
                ...permanentArchive,
                ...archivedLeads.map(l => String(l.id))
            ]);

            // Store current archived state
            const preLoadArchived = new Set(archivedIds);

            // Call original function
            const result = await originalLoadAllData.call(this);

            // After load, re-apply archived status
            setTimeout(() => {
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

                // Filter out any leads that should be archived
                const activeLeads = leads.filter(lead => {
                    const leadIdStr = String(lead.id);

                    // Check if this lead was archived before the sync
                    if (preLoadArchived.has(leadIdStr)) {
                        console.log(`🚫 Removing re-appeared archived lead: ${lead.name} (${lead.id})`);

                        // Make sure it's in archivedLeads
                        const archivedList = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
                        const isInArchived = archivedList.some(l => String(l.id) === leadIdStr);

                        if (!isInArchived) {
                            // Add to archived if not there
                            lead.archived = true;
                            lead.archivedDate = lead.archivedDate || new Date().toISOString();
                            lead.archivedBy = lead.archivedBy || 'System';
                            archivedList.push(lead);
                            localStorage.setItem('archivedLeads', JSON.stringify(archivedList));
                        }

                        return false; // Remove from active list
                    }

                    return !lead.archived;
                });

                // Update the active leads list
                localStorage.setItem('insurance_leads', JSON.stringify(activeLeads));

                // Reload the view if we removed any archived leads
                if (activeLeads.length !== leads.length) {
                    console.log(`♻️ Cleaned up ${leads.length - activeLeads.length} archived lead(s) that reappeared`);

                    // Reload the leads view if visible
                    if (typeof loadLeadsView === 'function' && window.location.hash === '#leads') {
                        loadLeadsView();
                    }
                }
            }, 100);

            return result;
        };
    }

    // Also override the archiveLead function to immediately hide the lead
    const originalArchiveLead = window.archiveLead;

    window.archiveLead = function(leadId) {
        console.log('🗄️ Enhanced archiveLead - immediate removal');

        // Immediately hide the lead row from view
        const leadsTableBody = document.getElementById('leadsTableBody');
        if (leadsTableBody) {
            const leadRows = leadsTableBody.querySelectorAll('tr');
            leadRows.forEach(row => {
                const checkbox = row.querySelector('.lead-checkbox');
                if (checkbox && checkbox.value === String(leadId)) {
                    row.style.opacity = '0.3';
                    row.style.pointerEvents = 'none';

                    // Add "Archiving..." status
                    const nameCell = row.querySelector('td:nth-child(2)');
                    if (nameCell) {
                        nameCell.innerHTML += ' <span style="color: #f59e0b; font-style: italic;">(Archiving...)</span>';
                    }
                }
            });
        }

        // Call original function
        if (originalArchiveLead) {
            originalArchiveLead.call(this, leadId);
        }

        // Set a timer to ensure the lead stays hidden
        const hideInterval = setInterval(() => {
            const leadsTableBody = document.getElementById('leadsTableBody');
            if (leadsTableBody) {
                const leadRows = leadsTableBody.querySelectorAll('tr');
                leadRows.forEach(row => {
                    const checkbox = row.querySelector('.lead-checkbox');
                    if (checkbox && checkbox.value === String(leadId)) {
                        row.remove();
                        clearInterval(hideInterval);
                    }
                });
            }
        }, 1000);

        // Clear interval after 30 seconds
        setTimeout(() => clearInterval(hideInterval), 30000);
    };

    // Prevent sync during archive operation
    let archiveInProgress = false;
    const originalFetch = window.fetch;

    window.fetch = function(...args) {
        const url = args[0];

        // If archiving is in progress, delay data sync
        if (archiveInProgress && url && url.includes('/api/leads') && args[1]?.method === 'GET') {
            console.log('⏸️ Delaying sync during archive operation');
            return new Promise(resolve => {
                setTimeout(() => {
                    originalFetch.apply(this, args).then(resolve);
                }, 5000); // Wait 5 seconds
            });
        }

        // Detect archive operations
        if (url && url.includes('/api/leads') && args[1]?.method === 'POST') {
            const body = args[1]?.body;
            if (body && body.includes('"archived":true')) {
                archiveInProgress = true;
                setTimeout(() => {
                    archiveInProgress = false;
                }, 10000); // Block syncs for 10 seconds after archive
            }
        }

        return originalFetch.apply(this, args);
    };

    console.log('✅ Archive persistence fix applied');
})();