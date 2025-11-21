// Debug script to check lead storage and sync issues
(function() {
    console.log('🔍 DEBUGGING LEAD STORAGE...');
    
    // Check both storage keys
    const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const regularLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    
    console.log(`📦 insurance_leads count: ${insuranceLeads.length}`);
    console.log(`📦 leads count: ${regularLeads.length}`);
    
    // Show first 3 IDs from each
    console.log('Insurance leads IDs:', insuranceLeads.slice(0, 5).map(l => ({ id: l.id, name: l.name })));
    console.log('Regular leads IDs:', regularLeads.slice(0, 5).map(l => ({ id: l.id, name: l.name })));
    
    // Check for ID type mismatches
    const hasStringIds = insuranceLeads.some(l => typeof l.id === 'string');
    const hasNumberIds = insuranceLeads.some(l => typeof l.id === 'number');
    
    if (hasStringIds && hasNumberIds) {
        console.warn('⚠️ MIXED ID TYPES DETECTED! Some IDs are strings, some are numbers');
    }
    
    // Sync function to ensure both keys have same data
    window.syncLeadStorage = function() {
        console.log('🔄 SYNCING LEAD STORAGE...');
        
        // Get all unique leads from both sources
        const allLeadsMap = new Map();
        
        // Add from insurance_leads
        insuranceLeads.forEach(lead => {
            if (!lead.archived) {
                allLeadsMap.set(String(lead.id), lead);
            }
        });
        
        // Add from leads (but don't overwrite if already exists)
        regularLeads.forEach(lead => {
            if (!lead.archived && !allLeadsMap.has(String(lead.id))) {
                allLeadsMap.set(String(lead.id), lead);
            }
        });
        
        // Convert back to array
        const syncedLeads = Array.from(allLeadsMap.values());
        
        console.log(`✅ Synced ${syncedLeads.length} active leads`);
        
        // Save to both keys
        localStorage.setItem('insurance_leads', JSON.stringify(syncedLeads));
        localStorage.setItem('leads', JSON.stringify(syncedLeads));
        
        return syncedLeads;
    };
    
    // Auto sync
    const syncedLeads = window.syncLeadStorage();
    
    // Override viewLead to show what's being called
    const originalViewLead = window.viewLead;
    window.viewLead = function(leadId) {
        console.log(`📞 viewLead called with ID: "${leadId}" (type: ${typeof leadId})`);
        
        // Try to find the lead in storage
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const lead = leads.find(l => String(l.id) === String(leadId));
        
        if (!lead) {
            console.error(`❌ Lead not found with ID: "${leadId}"`);
            console.log('Available IDs:', leads.map(l => l.id));
        } else {
            console.log(`✅ Found lead: ${lead.name}`);
        }
        
        // Call original function
        return originalViewLead.call(this, leadId);
    };
    
    console.log('✅ Debug script loaded. Use syncLeadStorage() to force sync.');
})();
