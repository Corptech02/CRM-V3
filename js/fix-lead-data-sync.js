// Fix Lead Data Synchronization Issues
console.log('Loading lead data synchronization fix...');

(function() {
    // Function to sync leads from database to localStorage
    async function syncLeadsFromDatabase() {
        console.log('🔄 Syncing leads from database...');

        try {
            const response = await fetch('/api/leads', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                let leads = [];

                if (data.leads && Array.isArray(data.leads)) {
                    leads = data.leads;
                } else if (Array.isArray(data)) {
                    leads = data;
                } else {
                    console.error('Unexpected data format from API:', data);
                    return false;
                }

                console.log(`📥 Received ${leads.length} leads from database`);

                // Merge with existing localStorage leads to avoid losing any data
                const existingLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const mergedLeads = [...existingLeads];

                // Add new leads that don't exist locally
                leads.forEach(dbLead => {
                    const existsLocally = existingLeads.find(localLead =>
                        String(localLead.id) === String(dbLead.id)
                    );

                    if (!existsLocally) {
                        console.log('➕ Adding new lead from database:', dbLead.name);
                        mergedLeads.push(dbLead);
                    } else {
                        // Update existing lead with database data to ensure consistency
                        const localIndex = mergedLeads.findIndex(localLead =>
                            String(localLead.id) === String(dbLead.id)
                        );
                        if (localIndex !== -1) {
                            // Merge data, keeping any local changes that might exist
                            mergedLeads[localIndex] = { ...mergedLeads[localIndex], ...dbLead };
                        }
                    }
                });

                localStorage.setItem('insurance_leads', JSON.stringify(mergedLeads));
                console.log(`✅ Synchronized ${mergedLeads.length} total leads to localStorage`);
                return true;
            } else {
                console.error('Failed to fetch leads from database:', response.status);
                return false;
            }
        } catch (error) {
            console.error('Error syncing leads from database:', error);
            return false;
        }
    }

    // Enhanced viewLead function that handles missing leads
    const originalViewLead = window.viewLead;

    window.viewLead = async function(leadId) {
        console.log('🔍 Enhanced viewLead called with ID:', leadId);

        // Convert ID to string for consistent comparison
        const searchId = String(leadId);

        // First, try to find the lead in localStorage
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let lead = leads.find(l => String(l.id) === searchId);

        if (!lead) {
            console.log('❌ Lead not found in localStorage, attempting database sync...');

            // Try to sync from database
            const syncSuccess = await syncLeadsFromDatabase();

            if (syncSuccess) {
                // Try again after sync
                leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                lead = leads.find(l => String(l.id) === searchId);

                if (lead) {
                    console.log('✅ Lead found after database sync:', lead.name);
                } else {
                    console.log('❌ Lead still not found after sync, trying direct database fetch...');

                    // Try direct fetch from database for this specific lead
                    try {
                        const response = await fetch(`/api/leads/${searchId}`);
                        if (response.ok) {
                            const leadData = await response.json();
                            lead = leadData.lead || leadData;

                            if (lead) {
                                console.log('✅ Lead found via direct database fetch:', lead.name);

                                // Add to localStorage for future use
                                leads.push(lead);
                                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                            }
                        }
                    } catch (error) {
                        console.error('Direct database fetch failed:', error);
                    }
                }
            }

            if (!lead) {
                console.error('❌ Lead not found anywhere with ID:', searchId);

                // Show user-friendly error
                const errorMessage = `Lead not found (ID: ${searchId}). This may be due to a data synchronization issue. Would you like to refresh the page to sync data?`;

                if (confirm(errorMessage)) {
                    window.location.reload();
                }
                return;
            }
        }

        // Lead found, proceed with original function or showLeadProfile
        console.log('✅ Proceeding to show lead profile for:', lead.name);

        if (window.showLeadProfile && typeof window.showLeadProfile === 'function') {
            window.showLeadProfile(searchId);
        } else if (originalViewLead) {
            originalViewLead.call(this, searchId);
        } else {
            console.error('No lead profile display function available');
            alert('Error: Unable to display lead profile. Please refresh the page.');
        }
    };

    // Auto-sync on page load
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(async () => {
            console.log('🔄 Auto-syncing leads on page load...');
            await syncLeadsFromDatabase();

            // Also refresh the leads view if it's currently shown
            if (typeof loadLeadsView === 'function') {
                setTimeout(() => {
                    if (document.querySelector('#leadsTableBody')) {
                        console.log('🔄 Refreshing leads view after sync...');
                        loadLeadsView();
                    }
                }, 1000);
            }
        }, 2000);
    });

    // Also provide a manual sync function
    window.manualSyncLeads = syncLeadsFromDatabase;

    // Periodic sync every 5 minutes
    setInterval(async () => {
        console.log('🔄 Periodic lead sync...');
        await syncLeadsFromDatabase();
    }, 5 * 60 * 1000);

    console.log('✅ Lead data synchronization fix loaded');
})();