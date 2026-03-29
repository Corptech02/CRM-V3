// Check for accidentally deleted legitimate policies
console.log('🚨 Checking for missing legitimate policies...');

const legitimateClients = [
    'LOPEZ TRUCKING COMPANY LLC',
    'AL\'S TOWING LLC',
    'DU ROAD TRUCKING LLC',
    'MAVICS GLOBAL SERVICES LLC'
];

// Check localStorage for these policies
const localPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
console.log(`📊 Total policies in localStorage: ${localPolicies.length}`);

const foundPolicies = [];

localPolicies.forEach((policy, index) => {
    const policyStr = JSON.stringify(policy);

    for (const clientName of legitimateClients) {
        if (policyStr.includes(clientName)) {
            foundPolicies.push({
                clientName,
                policyId: policy.id,
                policy: policy
            });
            console.log(`✅ Found ${clientName} policy in localStorage`);
            break;
        }
    }
});

console.log(`📋 Summary: Found ${foundPolicies.length} legitimate policies in localStorage`);

if (foundPolicies.length > 0) {
    console.log('💾 These policies can potentially be restored to the database');
    window.policiesToRestore = foundPolicies;
} else {
    console.log('❌ No legitimate policies found in localStorage cache');
}

// Also check clients
const localClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
const foundClients = localClients.filter(client =>
    legitimateClients.some(legitName =>
        client.name && client.name.includes(legitName.split(' ')[0])
    )
);

console.log(`👥 Found ${foundClients.length} legitimate clients in localStorage`);
foundClients.forEach(client => {
    console.log(`  - ${client.name} (ID: ${client.id})`);
});