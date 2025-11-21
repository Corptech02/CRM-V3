/**
 * Fix stuck leads that can't be archived
 * This script identifies and fixes leads with 'qualified' stage that are stuck
 */

(function() {
    console.log('🔧 Checking for stuck leads...');
    
    // Function to diagnose stuck leads
    window.diagnoseStuckLeads = function() {
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        const qualifiedLeads = leads.filter(lead => lead.stage === 'qualified');
        
        console.log(`Found ${qualifiedLeads.length} leads with 'qualified' stage:`);
        qualifiedLeads.forEach(lead => {
            console.log(`- ${lead.name} (ID: ${lead.id}, Source: ${lead.source || 'Unknown'})`);
        });
        
        return qualifiedLeads;
    };
    
    // Function to fix stage values
    window.fixQualifiedStage = function() {
        console.log('📝 Fixing qualified stage to new...');
        
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        let fixedCount = 0;
        
        const updatedLeads = leads.map(lead => {
            if (lead.stage === 'qualified') {
                console.log(`Fixing stage for: ${lead.name}`);
                lead.stage = 'new';
                fixedCount++;
            }
            return lead;
        });
        
        if (fixedCount > 0) {
            // Use original setItem to bypass protection
            const originalSetItem = Object.getOwnPropertyDescriptor(Storage.prototype, 'setItem').value ||
                                   Storage.prototype.setItem;
            originalSetItem.call(localStorage, 'leads', JSON.stringify(updatedLeads));
            
            console.log(`✅ Fixed ${fixedCount} leads with qualified stage`);
            
            // Reload view
            if (typeof loadLeadsView === 'function') {
                loadLeadsView();
            }
        } else {
            console.log('No leads with qualified stage found');
        }
        
        return fixedCount;
    };
    
    // Function to force-archive specific leads
    window.forceArchiveLead = function(leadId) {
        console.log(`🔨 Force-archiving lead: ${leadId}`);
        
        // Get leads using original getItem
        const originalGetItem = Object.getOwnPropertyDescriptor(Storage.prototype, 'getItem').value ||
                               Storage.prototype.getItem;
        const originalSetItem = Object.getOwnPropertyDescriptor(Storage.prototype, 'setItem').value ||
                               Storage.prototype.setItem;
        
        const leads = JSON.parse(originalGetItem.call(localStorage, 'leads') || '[]');
        const leadIndex = leads.findIndex(l => l.id === leadId || l.id == leadId);
        
        if (leadIndex === -1) {
            console.log('Lead not found');
            return false;
        }
        
        const lead = leads[leadIndex];
        console.log(`Found lead: ${lead.name}`);
        
        // Add archive metadata
        lead.archived = true;
        lead.archivedDate = new Date().toISOString();
        lead.archivedBy = 'Force Archive';
        
        // Get archived leads
        let archivedLeads = JSON.parse(originalGetItem.call(localStorage, 'archivedLeads') || '[]');
        
        // Check if already in archive
        const alreadyArchived = archivedLeads.find(l => l.id === leadId || l.id == leadId);
        if (!alreadyArchived) {
            archivedLeads.push(lead);
            originalSetItem.call(localStorage, 'archivedLeads', JSON.stringify(archivedLeads));
            console.log('✅ Added to archive');
        }
        
        // Remove from active leads
        leads.splice(leadIndex, 1);
        originalSetItem.call(localStorage, 'leads', JSON.stringify(leads));
        console.log('✅ Removed from active leads');
        
        // Show notification
        if (typeof showNotification === 'function') {
            showNotification(`Lead "${lead.name}" force-archived`, 'success');
        }
        
        // Reload view
        if (typeof loadLeadsView === 'function') {
            loadLeadsView();
        }
        
        return true;
    };
    
    // Function to force-archive all qualified leads
    window.forceArchiveQualifiedLeads = function() {
        console.log('🔨 Force-archiving all qualified leads...');
        
        const qualifiedLeads = diagnoseStuckLeads();
        let archivedCount = 0;
        
        qualifiedLeads.forEach(lead => {
            if (forceArchiveLead(lead.id)) {
                archivedCount++;
            }
        });
        
        console.log(`✅ Force-archived ${archivedCount} qualified leads`);
        return archivedCount;
    };
    
    // Auto-diagnose on load
    setTimeout(() => {
        const stuckLeads = diagnoseStuckLeads();
        if (stuckLeads.length > 0) {
            console.log('⚠️ Found stuck leads with qualified stage!');
            console.log('Use fixQualifiedStage() to change them to "new" stage');
            console.log('Or use forceArchiveQualifiedLeads() to archive them all');
            console.log('Or use forceArchiveLead(leadId) to archive a specific lead');
        }
    }, 1000);
    
    console.log('✅ Stuck leads fix script loaded');
    console.log('Available commands:');
    console.log('- diagnoseStuckLeads() - See stuck leads');
    console.log('- fixQualifiedStage() - Change qualified to new');
    console.log('- forceArchiveLead(leadId) - Force archive a specific lead');
    console.log('- forceArchiveQualifiedLeads() - Archive all qualified leads');
})();