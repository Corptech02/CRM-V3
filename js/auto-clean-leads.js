// Auto-cleanup script for removing mock data and ensuring proper archiving
console.log('🧹 Lead cleanup functions loaded...');

// Export cleanup function instead of auto-running
window.performLeadCleanup = function() {
    console.log('🧹 Running manual lead cleanup...');
    // Define mock/test patterns to remove
    const mockPatterns = [
        'Test Lead', 'Test Company', 'Test Trucking',
        'Robert Thompson', 'Jennifer Martin', 'Michael Chen',
        'Davis Construct', 'ABC Corp', 'Tech Startup', 'ABC Trucking'
    ];

    // Clean BOTH leads storage keys
    function cleanLeads() {
        // Clean insurance_leads (primary)
        let insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        // Clean leads (secondary)
        let regularLeads = JSON.parse(localStorage.getItem('leads') || '[]');

        const originalInsuranceCount = insuranceLeads.length;
        const originalRegularCount = regularLeads.length;

        // Clean function
        const cleanLeadData = (leads) => leads.filter(lead => {
            // Check for mock patterns
            if (lead.name) {
                for (const pattern of mockPatterns) {
                    if (lead.name.includes(pattern)) {
                        console.log(`Removing mock lead: ${lead.name}`);
                        return false;
                    }
                }
            }

            // Fix qualified status
            if (lead.stage === 'qualified') {
                lead.stage = 'quoted';
            }

            return true;
        });

        // Clean both datasets
        insuranceLeads = cleanLeadData(insuranceLeads);
        regularLeads = cleanLeadData(regularLeads);

        // Save cleaned leads to BOTH keys
        localStorage.setItem('insurance_leads', JSON.stringify(insuranceLeads));
        localStorage.setItem('leads', JSON.stringify(insuranceLeads)); // Sync both to insurance_leads data

        console.log(`✅ Cleaned insurance_leads: removed ${originalInsuranceCount - insuranceLeads.length} mock entries`);
        console.log(`✅ Cleaned leads: removed ${originalRegularCount - regularLeads.length} mock entries`);
        console.log(`✅ Synchronized both keys to clean data`);

        return insuranceLeads;
    }

    // Ensure archived leads are properly stored and create comprehensive exclusion lists
    function consolidateArchived() {
        // Get ALL possible archived sources
        const archived1 = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
        const archived2 = JSON.parse(localStorage.getItem('archived_leads') || '[]');
        const permanentArchive = JSON.parse(localStorage.getItem('PERMANENT_ARCHIVED_IDS') || '[]');

        // Combine and deduplicate by ID, name, phone, email
        const archivedMap = new Map();
        const archivedNames = new Set();
        const archivedPhones = new Set();
        const archivedEmails = new Set();

        [...archived1, ...archived2].forEach(lead => {
            if (lead.id) {
                archivedMap.set(lead.id, lead);
            }
            if (lead.name) {
                archivedNames.add(lead.name.toLowerCase().trim());
            }
            if (lead.phone) {
                archivedPhones.add(lead.phone.replace(/\D/g, ''));
            }
            if (lead.email) {
                archivedEmails.add(lead.email.toLowerCase().trim());
            }
        });

        // Add permanent IDs
        permanentArchive.forEach(id => {
            if (id) {
                archivedMap.set(String(id), { id: String(id), archived: true, source: 'permanent' });
            }
        });

        // Save consolidated archived leads to ALL storage keys
        const consolidated = Array.from(archivedMap.values());
        localStorage.setItem('archived_leads', JSON.stringify(consolidated));
        localStorage.setItem('archivedLeads', JSON.stringify(consolidated));

        // Store exclusion lists for fast lookup
        window.archivedExclusion = {
            ids: new Set(Array.from(archivedMap.keys()).map(id => String(id))),
            names: archivedNames,
            phones: archivedPhones,
            emails: archivedEmails
        };

        console.log(`✅ Consolidated ${consolidated.length} archived leads`);
        console.log(`✅ Created exclusion lists: ${archivedNames.size} names, ${archivedPhones.size} phones, ${archivedEmails.size} emails`);
        return consolidated;
    }

    // Move any remaining mock/test data to archived
    function archiveMockData() {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const archived = JSON.parse(localStorage.getItem('archived_leads') || '[]');
        const archivedIds = new Set(archived.map(l => l.id));

        let movedCount = 0;
        const cleanedLeads = leads.filter(lead => {
            // Check if it's mock data that should be archived
            if (lead.name) {
                for (const pattern of mockPatterns) {
                    if (lead.name.includes(pattern) && !archivedIds.has(lead.id)) {
                        // Move to archived
                        archived.push({...lead, archived: true});
                        movedCount++;
                        console.log(`Archiving mock lead: ${lead.name}`);
                        return false;
                    }
                }
            }
            return true;
        });

        if (movedCount > 0) {
            localStorage.setItem('insurance_leads', JSON.stringify(cleanedLeads));
            localStorage.setItem('archived_leads', JSON.stringify(archived));
            localStorage.setItem('archivedLeads', JSON.stringify(archived));
            console.log(`✅ Moved ${movedCount} mock leads to archive`);
        }
    }

    // BULLETPROOF archived lead removal from active leads
    function removeArchivedFromActive() {
        if (!window.archivedExclusion) {
            console.log('⚠️ Archived exclusion lists not loaded, running consolidateArchived first');
            consolidateArchived();
        }

        // Clean BOTH storage keys
        const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const regularLeads = JSON.parse(localStorage.getItem('leads') || '[]');

        const filterArchived = (leads) => leads.filter(lead => {
            // Check ID
            if (window.archivedExclusion.ids.has(String(lead.id))) {
                console.log(`🚫 Removing archived lead by ID: ${lead.name} (${lead.id})`);
                return false;
            }

            // Check name
            if (lead.name && window.archivedExclusion.names.has(lead.name.toLowerCase().trim())) {
                console.log(`🚫 Removing archived lead by name: ${lead.name}`);
                return false;
            }

            // Check phone
            if (lead.phone) {
                const cleanPhone = lead.phone.replace(/\D/g, '');
                if (cleanPhone && window.archivedExclusion.phones.has(cleanPhone)) {
                    console.log(`🚫 Removing archived lead by phone: ${lead.name} (${lead.phone})`);
                    return false;
                }
            }

            // Check email
            if (lead.email && window.archivedExclusion.emails.has(lead.email.toLowerCase().trim())) {
                console.log(`🚫 Removing archived lead by email: ${lead.name} (${lead.email})`);
                return false;
            }

            return true;
        });

        const cleanInsuranceLeads = filterArchived(insuranceLeads);
        const cleanRegularLeads = filterArchived(regularLeads);

        // Save cleaned data
        localStorage.setItem('insurance_leads', JSON.stringify(cleanInsuranceLeads));
        localStorage.setItem('leads', JSON.stringify(cleanInsuranceLeads)); // Sync to same clean data

        console.log(`✅ Removed ${insuranceLeads.length - cleanInsuranceLeads.length} archived leads from insurance_leads`);
        console.log(`✅ Removed ${regularLeads.length - cleanRegularLeads.length} archived leads from leads`);

        return cleanInsuranceLeads;
    }

    // Complete cleanup sequence
    try {
        console.log('🧹 Starting comprehensive lead cleanup...');
        consolidateArchived();      // First: identify all archived leads
        cleanLeads();              // Second: remove mock data and sync keys
        archiveMockData();         // Third: move any remaining mock to archive
        removeArchivedFromActive(); // Fourth: bulletproof archived removal
        console.log('🎯 Complete lead cleanup finished!');
    } catch (error) {
        console.error('Error during comprehensive cleanup:', error);
    }
};

// Run cleanup only when manually called or when loadLeadsView is called
console.log('💡 Use performLeadCleanup() to manually clean data');