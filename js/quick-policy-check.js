// Quick policy check - runs immediately when loaded
console.log('🔍 Quick Policy Check - Running immediate verification...');

(function quickPolicyCheck() {
    try {
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        console.log('📊 Total policies found:', policies.length);

        if (policies.length === 0) {
            console.log('❌ No policies found! Will attempt to add them...');

            setTimeout(() => {
                if (typeof window.addAlsTowingPolicy === 'function') {
                    console.log('🔄 Adding AL\'S TOWING LLC policy...');
                    window.addAlsTowingPolicy();
                }
                if (typeof window.addBlueSkyPolicy === 'function') {
                    console.log('🔄 Adding BLUE SKY LOGISTICS policy...');
                    window.addBlueSkyPolicy();
                }
            }, 2000);
        } else {
            console.log('✅ Policies found in localStorage:');
            policies.forEach((policy, index) => {
                console.log(`  ${index + 1}. ${policy.clientName} (${policy.carrierName}) - $${policy.premium.toLocaleString()}`);
                if (policy.vehicles) {
                    console.log(`     Vehicles: ${policy.vehicles.length}`);
                }
                if (policy.drivers) {
                    console.log(`     Drivers: ${policy.drivers.length}`);
                }
            });

            // Check our specific policies
            const alsTowing = policies.find(p => p.clientName === 'AL\'S TOWING LLC');
            const blueSky = policies.find(p => p.clientName === 'BLUE SKY LOGISTICS INC');

            console.log('🎯 Target Policy Check:');
            console.log('   AL\'S TOWING LLC:', alsTowing ? '✅ Found' : '❌ Not found');
            console.log('   BLUE SKY LOGISTICS:', blueSky ? '✅ Found' : '❌ Not found');

            if (alsTowing && alsTowing.vehicles && alsTowing.vehicles.length > 0) {
                console.log(`   AL'S TOWING details: ${alsTowing.vehicles.length} vehicles, $${alsTowing.premium.toLocaleString()} premium`);
                console.log(`   Vehicles: ${alsTowing.vehicles.map(v => `${v.year} ${v.make} ${v.model || v.type}`).join(', ')}`);
            }

            if (blueSky && blueSky.vehicles && blueSky.vehicles.length > 0) {
                console.log(`   BLUE SKY details: ${blueSky.vehicles.length} vehicles, $${blueSky.premium.toLocaleString()} premium`);
            }
        }

        // Check function availability
        console.log('🔧 Functions available:');
        console.log('   addAlsTowingPolicy:', typeof window.addAlsTowingPolicy);
        console.log('   addBlueSkyPolicy:', typeof window.addBlueSkyPolicy);
        console.log('   fixPolicyTabStructure:', typeof window.fixPolicyTabStructure);
        console.log('   populateAllPolicyTabs:', typeof window.populateAllPolicyTabs);

    } catch (error) {
        console.error('❌ Quick policy check error:', error);
    }
})();

console.log('✅ Quick policy check script loaded');