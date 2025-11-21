/**
 * Force restore Vicidial leads on every page load
 * This runs after all other scripts to ensure leads are present
 */

(function() {
    // Wait for page to fully load
    window.addEventListener('load', function() {
        setTimeout(function() {
            console.log('🔧 Force-checking Vicidial leads...');
            
            const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const vicidialCount = currentLeads.filter(lead => 
                lead.source && lead.source.includes('Vicidial')
            ).length;
            
            console.log(`Current Vicidial leads: ${vicidialCount}`);
            
            // Check backup
            const backup = JSON.parse(localStorage.getItem('vicidialLeadsBackup') || '[]');
            console.log(`Backup Vicidial leads: ${backup.length}`);
            
            // If we have a backup but no current Vicidial leads, restore them
            if (backup.length > 0 && vicidialCount < backup.length) {
                console.log('🚨 Vicidial leads missing! Force-restoring...');
                
                // Get non-Vicidial leads
                const nonVicidialLeads = currentLeads.filter(lead => 
                    !lead.source || !lead.source.includes('Vicidial')
                );
                
                // Ensure backup leads have stage 'new'
                const restoredVicidialLeads = backup.map(lead => ({
                    ...lead,
                    stage: 'new'
                }));
                
                // Combine
                const allLeads = [...nonVicidialLeads, ...restoredVicidialLeads];
                
                // Force save
                const originalSetItem = Object.getOwnPropertyDescriptor(Storage.prototype, 'setItem').value ||
                                       Storage.prototype.setItem;
                originalSetItem.call(localStorage, 'leads', JSON.stringify(allLeads));
                
                console.log(`✅ Force-restored ${restoredVicidialLeads.length} Vicidial leads`);
                
                // Reload the view if we're on the leads page
                if (window.location.hash === '#lead-generation' || 
                    window.location.hash === '#leads' || 
                    document.querySelector('.leads-view')) {
                    
                    // Find and click the Leads Management button to refresh
                    const leadsBtn = document.querySelector('a[href="#lead-generation"]');
                    if (leadsBtn) {
                        console.log('Refreshing leads view...');
                        leadsBtn.click();
                    } else if (typeof loadLeadsView === 'function') {
                        loadLeadsView();
                    }
                }
            } else if (vicidialCount > 0) {
                console.log('✅ Vicidial leads are present');
            }
            
        }, 1000); // Wait 1 second after page load
    });
    
    // Also add a manual restore function
    window.forceRestoreVicidialLeads = function() {
        const backup = JSON.parse(localStorage.getItem('vicidialLeadsBackup') || '[]');
        
        if (backup.length === 0) {
            console.log('No backup found. Try syncing first.');
            return;
        }
        
        const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        const nonVicidialLeads = currentLeads.filter(lead => 
            !lead.source || !lead.source.includes('Vicidial')
        );
        
        const restoredVicidialLeads = backup.map(lead => ({
            ...lead,
            stage: 'new'
        }));
        
        const allLeads = [...nonVicidialLeads, ...restoredVicidialLeads];
        
        localStorage.setItem('leads', JSON.stringify(allLeads));
        
        console.log(`✅ Manually restored ${restoredVicidialLeads.length} Vicidial leads`);
        
        // Reload view
        if (typeof loadLeadsView === 'function') {
            loadLeadsView();
        }
    };
    
    console.log('Force-restore script loaded. Use forceRestoreVicidialLeads() if needed.');
})();