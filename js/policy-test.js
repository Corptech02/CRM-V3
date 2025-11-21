// Test script to verify policy loading behavior
console.log('=== POLICY LOAD TEST STARTING ===');

// Function to test policy loading
async function testPolicyLoading() {
    console.log('Test 1: Checking current localStorage state...');
    const currentPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log(`Current policies in localStorage: ${currentPolicies.length}`);

    console.log('\nTest 2: Simulating browser data clear...');
    localStorage.removeItem('insurance_policies');
    const afterClearPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log(`After clear: ${afterClearPolicies.length} policies`);

    console.log('\nTest 3: Testing server fetch...');
    const API_URL = window.location.hostname.includes('nip.io')
        ? `http://${window.location.hostname.split('.')[0]}:3001/api`
        : window.location.hostname === 'localhost'
        ? 'http://localhost:3001/api'
        : 'http://162.220.14.239:3001/api';

    try {
        const response = await fetch(`${API_URL}/all-data`);
        if (response.ok) {
            const data = await response.json();
            const serverPolicies = data.policies || [];
            console.log(`✓ Server has ${serverPolicies.length} policies`);

            // Update localStorage
            localStorage.setItem('insurance_policies', JSON.stringify(serverPolicies));

            // Verify it was saved
            const savedPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
            console.log(`✓ Saved ${savedPolicies.length} policies to localStorage`);

            // List the policies
            console.log('\nPolicies from server:');
            serverPolicies.forEach(p => {
                console.log(`  - ${p.policyNumber}: ${p.clientName}`);
            });

            console.log('\n=== TEST COMPLETE ===');
            console.log(`Result: ${savedPolicies.length === 8 ? 'PASS ✓' : 'FAIL ✗'} - Expected 8 policies, got ${savedPolicies.length}`);
        } else {
            console.error(`✗ Server error: ${response.status}`);
        }
    } catch (error) {
        console.error('✗ Fetch error:', error);
    }
}

// Run the test
testPolicyLoading();