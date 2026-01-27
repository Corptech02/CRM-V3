// Simple policy check script
console.log('🔍 Checking current policies in localStorage...');

try {
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log('📊 Total policies found:', policies.length);

    if (policies.length === 0) {
        console.log('❌ No policies found in localStorage');
        console.log('🔄 Attempting to add AL\'S TOWING LLC policy...');

        // Try to add AL'S TOWING policy if it doesn't exist
        if (typeof window.addAlsTowingPolicy === 'function') {
            window.addAlsTowingPolicy();
        } else {
            console.log('❌ addAlsTowingPolicy function not available');
        }

        // Try to add BLUE SKY policy if it doesn't exist
        if (typeof window.addBlueSkyPolicy === 'function') {
            window.addBlueSkyPolicy();
        } else {
            console.log('❌ addBlueSkyPolicy function not available');
        }
    } else {
        policies.forEach((policy, index) => {
            console.log(`📋 Policy ${index + 1}:`, {
                client: policy.clientName,
                policyNumber: policy.policyNumber,
                carrier: policy.carrierName,
                premium: policy.premium,
                vehicles: policy.vehicles ? policy.vehicles.length : 0,
                drivers: policy.drivers ? policy.drivers.length : 0
            });
        });

        // Check for our specific policies
        const alsTowing = policies.find(p => p.clientName === 'AL\'S TOWING LLC');
        const blueSky = policies.find(p => p.clientName === 'BLUE SKY LOGISTICS INC');

        console.log('🔍 AL\'S TOWING LLC:', alsTowing ? '✅ Found' : '❌ Not found');
        console.log('🔍 BLUE SKY LOGISTICS:', blueSky ? '✅ Found' : '❌ Not found');
    }
} catch (error) {
    console.error('❌ Error checking policies:', error);
}

// Check if our policy addition functions are available
console.log('🔧 Available functions:');
console.log('- addAlsTowingPolicy:', typeof window.addAlsTowingPolicy);
console.log('- addBlueSkyPolicy:', typeof window.addBlueSkyPolicy);
console.log('- fixPolicyTabStructure:', typeof window.fixPolicyTabStructure);
console.log('- populateAllPolicyTabs:', typeof window.populateAllPolicyTabs);