// Remove fake leads and prepare for real lead import
(function() {
    'use strict';
    
    console.log('🔄 Cleaning up fake leads...');
    
    // Get current leads
    let currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    
    // IDs of the fake leads to remove
    const fakeLeadIds = [
        'vici_coastal_2025',
        'vici_express_2025', 
        'vici_swift_2025',
        'vici_premier_2025',
        'vici_eagle_2025'
    ];
    
    // Remove fake leads
    const originalCount = currentLeads.length;
    currentLeads = currentLeads.filter(lead => !fakeLeadIds.includes(lead.id));
    const removedCount = originalCount - currentLeads.length;
    
    // Save cleaned leads
    localStorage.setItem('leads', JSON.stringify(currentLeads));
    
    console.log(`✅ Removed ${removedCount} fake leads`);
    console.log(`📊 ${currentLeads.length} real leads remain`);
    
    // Show notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc2626;
        color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 100000;
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">🗑️ Fake Leads Removed</h3>
        <p>Removed ${removedCount} placeholder leads.</p>
        <p style="margin-top: 10px; font-size: 14px;">
            To import REAL leads from Vicidial:
        </p>
        <ol style="margin: 10px 0 0 20px; font-size: 14px;">
            <li>Go to ViciBox and check for new SALE status leads</li>
            <li>Note the lead information (company, phone, etc)</li>
            <li>Run: addRealLead() in console with the lead data</li>
        </ol>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 10 seconds
    setTimeout(() => notification.remove(), 10000);
    
    // Refresh leads view
    if (typeof loadLeadsView === 'function') {
        loadLeadsView();
    } else if (typeof showLeads === 'function') {
        showLeads();
    }
})();

// Function to manually add REAL leads from Vicidial
window.addRealLead = function(leadData) {
    // Example usage:
    // addRealLead({
    //     company: 'Real Trucking Company',
    //     contact: 'John Smith',
    //     phone: '555-123-4567',
    //     dotNumber: 'DOT123456',
    //     mcNumber: 'MC654321'
    // });
    
    if (!leadData || !leadData.company) {
        console.error('Please provide lead data with at least company name');
        console.log('Example: addRealLead({ company: "ABC Trucking", phone: "555-1234" })');
        return;
    }
    
    const newLead = {
        id: 'real_' + Date.now(),
        name: leadData.company,
        contact: leadData.contact || '',
        phone: leadData.phone || '',
        email: leadData.email || '',
        dotNumber: leadData.dotNumber || '',
        mcNumber: leadData.mcNumber || '',
        address: leadData.address || '',
        status: 'new',
        stage: 'Qualification',
        source: 'Vicidial - Manual Import',
        created: new Date().toISOString(),
        fleetSize: leadData.fleetSize || 0,
        notes: 'Manually imported from Vicidial'
    };
    
    // Get current leads
    const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    
    // Add new lead
    currentLeads.push(newLead);
    
    // Save
    localStorage.setItem('leads', JSON.stringify(currentLeads));
    
    console.log(`✅ Added real lead: ${newLead.name}`);
    
    // Refresh view
    if (typeof loadLeadsView === 'function') {
        loadLeadsView();
    } else if (typeof showLeads === 'function') {
        showLeads();
    }
    
    return newLead;
};

console.log('🎯 To add REAL leads from Vicidial, use:');
console.log('addRealLead({ company: "Company Name", phone: "555-1234", dotNumber: "DOT123" })');