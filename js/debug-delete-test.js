/**
 * DEBUG DELETE TEST - Direct console testing
 */

// Simple function to test lead deletion directly
window.testDeleteLead = function(leadId) {
    console.log('🧪 TESTING: Starting direct delete test for lead:', leadId);

    // First, check if lead exists
    const xhr1 = new XMLHttpRequest();
    const apiUrl = window.VANGUARD_API_URL || `http://${window.location.hostname}:3001/api`;
    const checkUrl = `${apiUrl}/leads/${leadId}`;

    console.log('🧪 TESTING: Checking if lead exists at:', checkUrl);

    xhr1.open('GET', checkUrl, false); // Synchronous for testing
    xhr1.send();

    console.log('🧪 TESTING: GET response status:', xhr1.status);
    console.log('🧪 TESTING: GET response text:', xhr1.responseText);

    if (xhr1.status === 404) {
        console.log('🧪 TESTING: Lead does not exist in database');
        return;
    }

    // Now try to delete it
    const xhr2 = new XMLHttpRequest();
    const deleteUrl = `${apiUrl}/leads/${leadId}`;

    console.log('🧪 TESTING: Attempting DELETE at:', deleteUrl);

    xhr2.open('DELETE', deleteUrl, false); // Synchronous for testing
    xhr2.setRequestHeader('Content-Type', 'application/json');
    xhr2.send();

    console.log('🧪 TESTING: DELETE response status:', xhr2.status);
    console.log('🧪 TESTING: DELETE response text:', xhr2.responseText);

    // Verify deletion
    const xhr3 = new XMLHttpRequest();
    xhr3.open('GET', checkUrl, false); // Synchronous for testing
    xhr3.send();

    console.log('🧪 TESTING: Verification GET status:', xhr3.status);

    if (xhr3.status === 404) {
        console.log('✅ SUCCESS: Lead successfully deleted from server');
        return true;
    } else {
        console.log('❌ FAILED: Lead still exists in server database');
        console.log('🧪 TESTING: Lead data still in DB:', xhr3.responseText);
        return false;
    }
};

// Function to get all current lead IDs
window.getCurrentLeadIds = function() {
    const xhr = new XMLHttpRequest();
    const apiUrl = window.VANGUARD_API_URL || `http://${window.location.hostname}:3001/api`;
    const leadsUrl = `${apiUrl}/leads`;

    console.log('🧪 GETTING: All leads from:', leadsUrl);

    xhr.open('GET', leadsUrl, false); // Synchronous for testing
    xhr.send();

    if (xhr.status === 200) {
        const leads = JSON.parse(xhr.responseText);
        console.log('🧪 CURRENT LEADS:', leads.length, 'total');
        leads.forEach(lead => {
            console.log(`  - ID: ${lead.id}, Name: ${lead.name}`);
        });
        return leads.map(lead => lead.id);
    } else {
        console.log('❌ Failed to get leads. Status:', xhr.status);
        return [];
    }
};

console.log('🧪 DEBUG TOOLS LOADED:');
console.log('  - testDeleteLead(leadId) - Test deleting a specific lead');
console.log('  - getCurrentLeadIds() - Get all current lead IDs');
console.log('');
console.log('USAGE:');
console.log('  1. Run: getCurrentLeadIds()');
console.log('  2. Pick a lead ID from the list');
console.log('  3. Run: testDeleteLead("LEAD_ID_HERE")');