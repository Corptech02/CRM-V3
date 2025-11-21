
// Auto-Import New Vicidial SALE Leads
// Generated: 2025-09-11T22:50:56.436129
(function() {
    const newLeads = [
  {
    "contact": "ADMINISTRATION\n\n\n\n\n  Reports \n\n\n\n\n Users\n\n\n\n\n Campaigns\n\n\n\n Lists\n \u00a0 \n\t\t\t Show Lists \n \u00a0 \n\t\t\t\t\t\t Add A New List \n \u00a0 \n\t\t\t\t\t\t Search For A Lead \n \u00a0 \n\t\t\t Add A New Lead \n \u00a0 \n\t\t\t Add-Delete DNC Number \n \u00a0 \n\t\t\t Load New Leads \n\n\n\n\n  Scripts \n\n\n\n  Filters \n\n\n\n  Inbound \n\n\n\n\n  User Groups \n\n\n\n\n  Remote Agents \n\n\n\n\n  Admin",
    "company": "ZUBKU TRUCKING LLC",
    "list_id": "999",
    "status": "SALE",
    "found_date": "2025-09-11T22:50:55.105357"
  },
  {
    "company": "ZUBKU TRUCKING LLC",
    "contact": "List ID:",
    "list_id": "999",
    "status": "SALE",
    "found_date": "2025-09-11T22:50:55.111789"
  }
];
    
    console.log('🚀 Auto-importing ' + newLeads.length + ' new SALE leads from Vicidial...');
    
    // Get existing leads
    let existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    let imported = 0;
    
    newLeads.forEach(leadData => {
        // Check for duplicates
        const isDuplicate = existingLeads.some(lead => 
            lead.phone === leadData.phone || 
            (lead.name === leadData.company && leadData.company)
        );
        
        if (!isDuplicate) {
            const newLead = {
                id: 'auto_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: leadData.company || 'Unknown Company',
                contact: leadData.contact || '',
                phone: leadData.phone || '',
                email: leadData.email || '',
                status: 'new',
                stage: 'Qualification',
                source: 'Vicidial Auto-Import - SALE',
                created: new Date().toISOString(),
                notes: 'Auto-imported from Vicidial - SALE status lead',
                priority: 'high'
            };
            
            existingLeads.push(newLead);
            imported++;
        }
    });
    
    // Save updated leads
    localStorage.setItem('leads', JSON.stringify(existingLeads));
    
    // Show notification
    if (imported > 0) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 100000;
        `;
        notification.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">🎯 New SALE Leads!</h3>
            <p>Auto-imported ${imported} new leads from Vicidial</p>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
        
        // Refresh view
        if (typeof loadLeadsView === 'function') {
            loadLeadsView();
        }
    }
    
    console.log('Auto-import complete: ' + imported + ' new leads');
})();
