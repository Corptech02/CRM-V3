// Remove Demo/Test Leads - One-time cleanup
console.log('🧹 Removing demo/test leads...');

(function() {
    // List of demo lead names to remove
    const demoLeadNames = [
        'Robert Thompson',
        'Jennifer Martin',
        'Transport Solutions LLC',
        'Michael Chen',
        'Davis Construction',
        'ABC Corp',
        'Tech Startup Inc'
    ];

    // Also remove by email patterns that are clearly test data
    const demoEmails = [
        'test@example.com',
        'demo@example.com',
        'sample@example.com'
    ];

    // Get current leads
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const originalCount = leads.length;

    // Filter out demo leads
    leads = leads.filter(lead => {
        // Check if it's a demo lead by name
        const isDemo = demoLeadNames.some(demoName =>
            lead.name && lead.name.toLowerCase().includes(demoName.toLowerCase())
        );

        // Check if it's a demo lead by email
        const isDemoEmail = lead.email && demoEmails.some(demoEmail =>
            lead.email.toLowerCase().includes(demoEmail.toLowerCase())
        );

        // Check if assigned to demo agents
        const isDemoAgent = lead.assignedTo && (
            lead.assignedTo === 'John Smith' ||
            lead.assignedTo === 'Sarah Johnson' ||
            lead.assignedTo === 'Mike Wilson' ||
            lead.assignedTo === 'Lisa Anderson'
        );

        // Check for old dates (before January 2025)
        const createdDate = new Date(lead.createdAt || lead.dateAdded || '');
        const isOldDemo = createdDate < new Date('2025-01-01');

        if (isDemo || isDemoEmail || (isDemoAgent && isOldDemo)) {
            console.log(`🗑️ Removing demo lead: ${lead.name} (${lead.email || 'no email'})`);
            return false;
        }

        return true;
    });

    // Save cleaned leads
    localStorage.setItem('insurance_leads', JSON.stringify(leads));

    console.log(`✅ Removed ${originalCount - leads.length} demo leads`);
    console.log(`📊 ${leads.length} real leads remaining`);

    // Show remaining leads
    console.log('Remaining leads:');
    leads.forEach(lead => {
        console.log(`  - ${lead.name} (${lead.email || 'no email'}) - ${lead.stage || 'no stage'}`);
    });

    // Reload the leads view if on that page - DISABLED to prevent duplicate tables
    // if (window.location.hash === '#leads' && typeof loadLeadsView === 'function') {
    //     loadLeadsView();
    // }
})();