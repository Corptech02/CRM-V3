// Unarchive the TEST UPDATE COMMERCIAL AUTO lead
console.log('Looking for archived TEST UPDATE lead...');

// Get all leads from localStorage
let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

// Find the archived lead
const archivedLead = leads.find(l =>
    l.name && l.name.includes('TEST UPDATE COM') &&
    (l.archived === true || l.stage === 'archived')
);

if (archivedLead) {
    console.log('Found archived lead:', archivedLead.name);
    console.log('Current status:', {
        id: archivedLead.id,
        archived: archivedLead.archived,
        stage: archivedLead.stage,
        premium: archivedLead.premium
    });

    // Unarchive the lead
    archivedLead.archived = false;
    delete archivedLead.archivedAt;
    delete archivedLead.archivedBy;

    // Make sure stage is not 'archived'
    if (archivedLead.stage === 'archived') {
        archivedLead.stage = 'quoted'; // Based on your description
    }

    // Save back to localStorage
    localStorage.setItem('insurance_leads', JSON.stringify(leads));

    console.log('Lead has been restored to active status!');
    console.log('New status:', {
        archived: archivedLead.archived,
        stage: archivedLead.stage
    });

    // Show notification
    if (window.showNotification) {
        window.showNotification('Lead "' + archivedLead.name + '" has been unarchived', 'success');
    }

    // Refresh the view if we're in leads management
    if (window.location.hash === '#leads' && window.loadLeadsView) {
        console.log('Refreshing leads view...');
        window.loadLeadsView();
    }
} else {
    console.log('Archived lead not found. Checking all leads...');

    // Show all leads with TEST UPDATE in the name
    const testLeads = leads.filter(l => l.name && l.name.includes('TEST UPDATE'));
    console.log('Found', testLeads.length, 'leads with TEST UPDATE:');
    testLeads.forEach(lead => {
        console.log(`- "${lead.name}": archived=${lead.archived}, stage=${lead.stage}, id=${lead.id}`);
    });

    // Also check for any archived leads
    const allArchived = leads.filter(l => l.archived === true);
    console.log('\nAll archived leads:', allArchived.length);
    allArchived.forEach(lead => {
        console.log(`- "${lead.name}": stage=${lead.stage}, premium=${lead.premium}`);

        // Unarchive if it matches the description
        if (lead.product === 'Commercial Auto' && lead.premium == 12719) {
            console.log('Found matching lead by product and premium! Unarchiving...');
            lead.archived = false;
            delete lead.archivedAt;
            delete lead.archivedBy;
            if (lead.stage === 'archived') {
                lead.stage = 'quoted';
            }

            // Save
            localStorage.setItem('insurance_leads', JSON.stringify(leads));

            if (window.showNotification) {
                window.showNotification('Lead "' + lead.name + '" has been unarchived', 'success');
            }

            if (window.location.hash === '#leads' && window.loadLeadsView) {
                window.loadLeadsView();
            }
        }
    });
}

console.log('Unarchive process completed.');