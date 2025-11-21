/**
 * Protect Vicidial Leads from being removed by other scripts
 * This script ensures Vicidial leads persist across page refreshes
 */

(function() {
    console.log('🛡️ Protecting Vicidial leads from removal...');
    
    // Store a backup of Vicidial leads
    const VICIDIAL_BACKUP_KEY = 'vicidialLeadsBackup';
    
    // Override localStorage.setItem to protect Vicidial leads
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    const originalRemoveItem = localStorage.removeItem;
    
    // Backup Vicidial leads whenever they're added
    function backupVicidialLeads() {
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        const vicidialLeads = leads.filter(lead => 
            lead.source && lead.source.includes('Vicidial')
        );
        
        if (vicidialLeads.length > 0) {
            localStorage.setItem(VICIDIAL_BACKUP_KEY, JSON.stringify(vicidialLeads));
            console.log(`📦 Backed up ${vicidialLeads.length} Vicidial leads`);
        }
    }
    
    // Restore Vicidial leads if they're missing
    function restoreVicidialLeads() {
        const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        const vicidialBackup = JSON.parse(localStorage.getItem(VICIDIAL_BACKUP_KEY) || '[]');
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
        
        if (vicidialBackup.length === 0) {
            return currentLeads;
        }
        
        // Filter out Vicidial leads that have been converted to clients or archived
        const restorationCandidates = vicidialBackup.filter(backupLead => {
            // Check if this lead exists as a client
            const isClient = clients.some(client => {
                const clientPhone = client.phone?.replace(/\D/g, '');
                const leadPhone = backupLead.phone?.replace(/\D/g, '');
                return (clientPhone && leadPhone && clientPhone === leadPhone) ||
                       (client.email?.toLowerCase() === backupLead.email?.toLowerCase()) ||
                       (client.convertedFrom === backupLead.id);
            });
            
            // Check if this lead is archived
            const isArchived = archivedLeads.some(archived => 
                archived.id === backupLead.id || 
                archived.originalId === backupLead.id
            );
            
            if (isClient) {
                console.log(`Lead ${backupLead.name} is now a client, not restoring`);
                return false;
            }
            if (isArchived) {
                console.log(`Lead ${backupLead.name} is archived, not restoring`);
                return false;
            }
            
            return true;
        });
        
        // Check if any restorable Vicidial leads are missing
        const currentVicidialIds = currentLeads
            .filter(lead => lead.source && lead.source.includes('Vicidial'))
            .map(lead => lead.id);
        
        const missingLeads = restorationCandidates.filter(lead => 
            !currentVicidialIds.includes(lead.id)
        );
        
        if (missingLeads.length > 0) {
            console.log(`⚠️ ${missingLeads.length} Vicidial leads missing! Restoring...`);
            
            // Remove any partial Vicidial leads
            const nonVicidialLeads = currentLeads.filter(lead => 
                !lead.source || !lead.source.includes('Vicidial')
            );
            
            // Only restore leads that aren't clients or archived
            const restoredVicidialLeads = restorationCandidates.map(lead => ({
                ...lead,
                stage: 'new' // Always set stage to 'new'
            }));
            
            // Combine and return
            const restoredLeads = [...nonVicidialLeads, ...restoredVicidialLeads];
            console.log(`✅ Restored ${restoredVicidialLeads.length} Vicidial leads (excluded converted/archived)`);
            return restoredLeads;
        }
        
        return currentLeads;
    }
    
    // Override localStorage.setItem
    localStorage.setItem = function(key, value) {
        if (key === 'leads') {
            try {
                const leads = JSON.parse(value);
                
                // Check if this is an archive operation
                // If archived leads were just updated, this is likely an archive operation
                const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
                const previousLeads = JSON.parse(originalGetItem.call(localStorage, 'leads') || '[]');
                
                // Check if a lead was just archived (exists in archived but not in new leads)
                const isArchiveOperation = archivedLeads.some(archived => 
                    !leads.find(lead => lead.id === archived.id || lead.id == archived.id) &&
                    previousLeads.find(lead => lead.id === archived.id || lead.id == archived.id)
                );
                
                if (isArchiveOperation) {
                    console.log('📦 Archive operation detected, allowing lead removal');
                    originalSetItem.call(localStorage, key, value);
                    return;
                }
                
                // Always restore Vicidial leads if missing
                const restoredLeads = restoreVicidialLeads();
                
                // If the new value has fewer Vicidial leads, restore them
                const newVicidialCount = leads.filter(lead => 
                    lead.source && lead.source.includes('Vicidial')
                ).length;
                
                const restoredVicidialCount = restoredLeads.filter(lead => 
                    lead.source && lead.source.includes('Vicidial')
                ).length;
                
                if (newVicidialCount < restoredVicidialCount) {
                    console.log('🛡️ Preventing removal of Vicidial leads');
                    
                    // Keep non-Vicidial leads from new value
                    const nonVicidialLeads = leads.filter(lead => 
                        !lead.source || !lead.source.includes('Vicidial')
                    );
                    
                    // Get Vicidial leads from restored data
                    const vicidialLeads = restoredLeads.filter(lead => 
                        lead.source && lead.source.includes('Vicidial')
                    );
                    
                    // Combine them
                    const protectedLeads = [...nonVicidialLeads, ...vicidialLeads];
                    
                    // Save with protection
                    originalSetItem.call(localStorage, key, JSON.stringify(protectedLeads));
                    
                    // Backup the Vicidial leads
                    backupVicidialLeads();
                    return;
                }
                
                // If adding or maintaining Vicidial leads, allow it
                originalSetItem.call(localStorage, key, value);
                
                // Backup if we have Vicidial leads
                if (newVicidialCount > 0) {
                    backupVicidialLeads();
                }
                
            } catch (e) {
                // If not valid JSON or other error, just save as is
                originalSetItem.call(localStorage, key, value);
            }
        } else {
            // For non-leads keys, save normally
            originalSetItem.call(localStorage, key, value);
        }
    };
    
    // Override localStorage.removeItem to prevent clearing leads
    localStorage.removeItem = function(key) {
        if (key === 'leads') {
            console.log('⚠️ Attempted to remove leads - preserving Vicidial leads');
            
            // Get backup
            const vicidialBackup = JSON.parse(localStorage.getItem(VICIDIAL_BACKUP_KEY) || '[]');
            
            if (vicidialBackup.length > 0) {
                // Instead of removing, just set to Vicidial leads only
                originalSetItem.call(localStorage, 'leads', JSON.stringify(vicidialBackup));
                return;
            }
        }
        
        // For other keys, remove normally
        originalRemoveItem.call(localStorage, key);
    };
    
    // Check and restore on page load
    window.addEventListener('DOMContentLoaded', function() {
        console.log('🔍 Checking for missing Vicidial leads...');
        
        const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        const restoredLeads = restoreVicidialLeads();
        
        if (restoredLeads.length > currentLeads.length) {
            localStorage.setItem('leads', JSON.stringify(restoredLeads));
            console.log('✅ Vicidial leads restored on page load');
            
            // Reload view if on leads page
            if (window.location.hash === '#lead-generation' || 
                window.location.hash === '#leads' || 
                document.querySelector('.leads-view')) {
                setTimeout(() => {
                    if (typeof loadLeadsView === 'function') {
                        loadLeadsView();
                    }
                }, 500);
            }
        }
    });
    
    // Also check periodically (every 5 seconds)
    setInterval(function() {
        const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        const vicidialBackup = JSON.parse(localStorage.getItem(VICIDIAL_BACKUP_KEY) || '[]');
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
        
        // Count how many Vicidial leads should be restored (not converted or archived)
        const restorableCount = vicidialBackup.filter(backupLead => {
            const isClient = clients.some(client => {
                const clientPhone = client.phone?.replace(/\D/g, '');
                const leadPhone = backupLead.phone?.replace(/\D/g, '');
                return (clientPhone && leadPhone && clientPhone === leadPhone) ||
                       (client.email?.toLowerCase() === backupLead.email?.toLowerCase()) ||
                       (client.convertedFrom === backupLead.id);
            });
            
            const isArchived = archivedLeads.some(archived => 
                archived.id === backupLead.id || 
                archived.originalId === backupLead.id
            );
            
            return !isClient && !isArchived;
        }).length;
        
        const currentVicidialCount = currentLeads.filter(lead => 
            lead.source && lead.source.includes('Vicidial')
        ).length;
        
        if (currentVicidialCount < restorableCount) {
            console.log('🔄 Auto-restoring missing Vicidial leads...');
            const restoredLeads = restoreVicidialLeads();
            localStorage.setItem('leads', JSON.stringify(restoredLeads));
        }
    }, 5000);
    
    console.log('✅ Vicidial lead protection active');
})();