/**
 * Database Sync Tools - Console commands for manual database management
 */

// Function to show database status
window.showDatabaseStatus = async function() {
    console.log('=== DATABASE STATUS ===');

    try {
        // Check API (backend database)
        const apiResponse = await fetch('/api/leads');
        const apiLeads = apiResponse.ok ? await apiResponse.json() : [];
        console.log(`Backend Database (via API): ${apiLeads.length} leads`);
        apiLeads.forEach(lead => console.log(`  - ${lead.id}: ${lead.name}`));

        // Check localStorage
        const localLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        console.log(`LocalStorage: ${localLeads.length} leads`);

        // Check deleted IDs
        const deletedIds = JSON.parse(localStorage.getItem('DELETED_LEAD_IDS') || '[]');
        console.log(`Deleted Lead IDs: ${deletedIds.length} entries`);
        if (deletedIds.length > 0) {
            console.log('Deleted IDs:', deletedIds);
        }

        return {
            backend: apiLeads,
            localStorage: localLeads,
            deletedIds: deletedIds
        };

    } catch (error) {
        console.error('Error checking database status:', error);
    }
};

// Function to force sync localStorage with backend
window.forceSyncWithBackend = async function() {
    console.log('🔄 FORCE SYNC: Syncing localStorage with backend database...');

    try {
        const response = await fetch('/api/leads');
        const backendLeads = response.ok ? await response.json() : [];

        localStorage.setItem('insurance_leads', JSON.stringify(backendLeads));
        localStorage.setItem('leads', JSON.stringify(backendLeads));

        console.log(`✅ FORCE SYNC: Synced ${backendLeads.length} leads from backend to localStorage`);

        // Refresh view if on leads page
        if (window.location.hash === '#leads' && typeof window.loadLeadsView === 'function') {
            setTimeout(() => window.loadLeadsView(), 500);
        }

        return backendLeads;

    } catch (error) {
        console.error('❌ FORCE SYNC: Error syncing with backend:', error);
    }
};

// Function to delete a lead by ID with verification
window.testDeleteLeadWithVerification = async function(leadId) {
    console.log(`🧪 TEST DELETE: Testing deletion of lead ${leadId}`);

    // Check if lead exists in backend
    try {
        const checkResponse = await fetch(`/api/leads/${leadId}`);
        if (checkResponse.status === 404) {
            console.log(`❌ TEST DELETE: Lead ${leadId} does not exist in backend database`);
            return false;
        }

        console.log(`✅ TEST DELETE: Lead ${leadId} exists in backend, proceeding with deletion`);

        // Delete the lead
        const deleteResponse = await fetch(`/api/leads/${leadId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        const deleteResult = await deleteResponse.json();
        console.log(`🧪 TEST DELETE: Delete response:`, deleteResult);

        // Verify deletion
        const verifyResponse = await fetch(`/api/leads/${leadId}`);
        if (verifyResponse.status === 404) {
            console.log(`✅ TEST DELETE: Lead ${leadId} successfully deleted from backend database`);
            return true;
        } else {
            console.log(`❌ TEST DELETE: Lead ${leadId} still exists after deletion attempt`);
            return false;
        }

    } catch (error) {
        console.error(`❌ TEST DELETE: Error testing deletion of lead ${leadId}:`, error);
        return false;
    }
};

// Function to clear all deleted IDs (useful for testing)
window.clearDeletedIds = function() {
    localStorage.removeItem('DELETED_LEAD_IDS');
    console.log('✅ Cleared all deleted lead IDs');
};

console.log('🔧 DATABASE SYNC TOOLS LOADED:');
console.log('  - showDatabaseStatus() - Shows current database state');
console.log('  - forceSyncWithBackend() - Syncs localStorage with backend');
console.log('  - testDeleteLeadWithVerification(leadId) - Tests lead deletion');
console.log('  - clearDeletedIds() - Clears deleted IDs list');