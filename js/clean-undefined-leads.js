// Clean up leads with undefined or invalid IDs
(function() {
    'use strict';

    console.log('🧹 Cleaning up invalid leads...');

    // Clean archived leads
    let archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
    const originalArchived = archivedLeads.length;
    archivedLeads = archivedLeads.filter(lead => lead.id && lead.id !== 'undefined' && lead.id !== 'null');
    if (archivedLeads.length !== originalArchived) {
        localStorage.setItem('archivedLeads', JSON.stringify(archivedLeads));
        console.log(`✅ Removed ${originalArchived - archivedLeads.length} invalid archived leads`);
    }

    // Clean permanent archived IDs
    let permanentArchived = JSON.parse(localStorage.getItem('PERMANENT_ARCHIVED_IDS') || '[]');
    const originalPermanent = permanentArchived.length;
    permanentArchived = permanentArchived.filter(id => id && id !== 'undefined' && id !== 'null');
    if (permanentArchived.length !== originalPermanent) {
        localStorage.setItem('PERMANENT_ARCHIVED_IDS', JSON.stringify(permanentArchived));
        console.log(`✅ Removed ${originalPermanent - permanentArchived.length} invalid permanent archived IDs`);
    }

    // Clean regular leads
    let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const originalLeads = leads.length;
    leads = leads.filter(lead => lead.id && lead.id !== 'undefined' && lead.id !== 'null' && lead.name);
    if (leads.length !== originalLeads) {
        localStorage.setItem('insurance_leads', JSON.stringify(leads));
        localStorage.setItem('leads', JSON.stringify(leads));
        console.log(`✅ Removed ${originalLeads - leads.length} invalid leads`);
    }

    console.log('🧹 Cleanup complete');
})();