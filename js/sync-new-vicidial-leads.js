// Manual sync function for new Vicidial leads
(function() {
    'use strict';
    
    // Function to manually sync new Vicidial leads
    window.syncNewVicidialLeads = async function(forceRefresh = false) {
        console.log('Syncing new Vicidial leads...');
        
        // Clear the import flag if forcing refresh
        if (forceRefresh) {
            localStorage.removeItem('vicidialLeadsImported');
            localStorage.removeItem('vici_imported_leads');
            console.log('Cleared import history for fresh sync');
        }
        
        // Get current leads
        const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        const currentLeadIds = currentLeads.map(l => l.id);
        
        // Fetch new leads from Lead Transfer API
        let newVicidialLeads = [];
        
        try {
            // Fetch from the Lead Transfer server
            const response = await fetch('http://localhost:8903/api/leads');
            if (response.ok) {
                const apiLeads = await response.json();
                console.log(`Found ${apiLeads.length} leads from Lead Transfer API`);
                
                // Transform API leads to our format
                newVicidialLeads = apiLeads.map(lead => ({
                    id: lead.id || 'lead_' + Date.now() + '_' + Math.random(),
                    name: lead.company || lead.contact || 'Unknown',
                    contact: lead.contact || '',
                    phone: lead.phone || '',
                    email: lead.email || '',
                    dot: lead.dotNumber || '',
                    mc: lead.mcNumber || '',
                    address: [lead.address, lead.city, lead.state].filter(Boolean).join(', '),
                    status: lead.status || 'new',
                    stage: lead.priority === 'high' ? 'Negotiation' : 'Qualification',
                    source: lead.source || 'Vicidial',
                    created: lead.dateAdded || new Date().toISOString(),
                    fleetSize: lead.fleetSize || 0,
                    yearsInBusiness: lead.yearsInBusiness || 0,
                    notes: lead.notes || '',
                    driverCount: lead.driverCount || 0,
                    leadScore: lead.leadScore || 0,
                    safetyRating: lead.safetyRating || '',
                    coverageType: lead.coverageType || 'Commercial Auto',
                    estimatedPremium: lead.estimatedPremium || ''
                }));
            } else {
                console.error('Failed to fetch from Lead Transfer API:', response.status);
            }
        } catch (error) {
            console.error('Error fetching leads from API:', error);
            // Fallback to manual check if API is down
            console.log('API unavailable, checking for manual updates...');
        }
        
        // Filter out already imported leads
        const leadsToImport = newVicidialLeads.filter(lead => !currentLeadIds.includes(lead.id));
        
        if (leadsToImport.length > 0) {
            // Add new leads
            const updatedLeads = [...currentLeads, ...leadsToImport];
            localStorage.setItem('leads', JSON.stringify(updatedLeads));
            
            console.log(`Imported ${leadsToImport.length} new leads`);
            
            // Show notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 10000;
                font-weight: 600;
            `;
            notification.innerHTML = `✅ Imported ${leadsToImport.length} new leads from Vicidial`;
            document.body.appendChild(notification);
            
            setTimeout(() => notification.remove(), 3000);
            
            // Refresh the leads view if visible
            if (typeof loadLeadsView === 'function') {
                loadLeadsView();
            }
            
            return leadsToImport;
        } else {
            console.log('No new leads to import');
            return [];
        }
    };
    
    // Add a button to manually sync
    function addSyncButton() {
        // Wait for the page to load
        setTimeout(() => {
            // Check if we're in the leads section
            const leadsSection = document.querySelector('#leads-section, .leads-header');
            if (leadsSection && !document.getElementById('sync-vicidial-btn')) {
                const syncBtn = document.createElement('button');
                syncBtn.id = 'sync-vicidial-btn';
                syncBtn.innerHTML = '<i class="fas fa-sync"></i> Sync Vicidial Leads';
                syncBtn.style.cssText = `
                    background: #0066cc;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-left: 10px;
                    font-size: 14px;
                `;
                syncBtn.onclick = () => {
                    syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
                    setTimeout(() => {
                        syncNewVicidialLeads(true);
                        syncBtn.innerHTML = '<i class="fas fa-sync"></i> Sync Vicidial Leads';
                    }, 1000);
                };
                
                // Find a place to add the button
                const headerButtons = leadsSection.querySelector('.section-header, .leads-actions');
                if (headerButtons) {
                    headerButtons.appendChild(syncBtn);
                }
            }
        }, 2000);
    }
    
    // Auto-sync DISABLED to prevent archived leads from reappearing
    // setInterval(() => {
    //     console.log('Auto-checking for new Vicidial leads...');
    //     syncNewVicidialLeads();
    // }, 300000); // 5 minutes
    
    // Add sync button when page changes
    const observer = new MutationObserver(() => {
        addSyncButton();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Initial button add
    addSyncButton();
    
    // Also check on load
    window.addEventListener('load', () => {
        console.log('Checking for new Vicidial leads on page load...');
        syncNewVicidialLeads();
    });
    
    console.log('Vicidial sync system initialized. Use syncNewVicidialLeads(true) to force refresh.');
})();