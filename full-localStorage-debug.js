// Full localStorage Debug Script - Run in CRM Browser Console
console.log('🔍 Full localStorage debugging...');

// Check the insurance_policies key specifically
const insurancePoliciesData = localStorage.getItem('insurance_policies');

if (insurancePoliciesData) {
    console.log('✅ Found insurance_policies data:', insurancePoliciesData.length, 'characters');
    console.log('📄 First 200 characters:', insurancePoliciesData.substring(0, 200));

    try {
        const parsed = JSON.parse(insurancePoliciesData);
        console.log('📋 Parsed successfully. Type:', typeof parsed);
        console.log('📋 Is array?', Array.isArray(parsed));

        if (Array.isArray(parsed)) {
            console.log('📋 Array length:', parsed.length);
            parsed.forEach((item, idx) => {
                console.log(`Item ${idx}:`, typeof item, item.policy_number || item.policyNumber || item.id);
                if (item && typeof item === 'object') {
                    console.log(`  Keys:`, Object.keys(item).slice(0, 10));
                    if (item.coiDocuments) {
                        console.log(`  Has coiDocuments:`, item.coiDocuments.length);
                    }
                }
            });
        } else {
            console.log('📋 Object keys:', Object.keys(parsed).slice(0, 10));
        }

    } catch (e) {
        console.error('❌ Parse error:', e);
    }
} else {
    console.log('❌ No insurance_policies found');
}

// Also check all other keys for any COI-related data
console.log('\n🔍 Scanning ALL localStorage keys for COI data...');
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);

    if (value.toLowerCase().includes('coi') || value.toLowerCase().includes('acord') || value.toLowerCase().includes('certificate')) {
        console.log(`🎯 Found potential COI data in key: ${key}`);
        console.log(`  Length: ${value.length} characters`);
        console.log(`  Preview: ${value.substring(0, 200)}...`);
    }
}