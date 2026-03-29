// Clear test clients and policies from localStorage cache
console.log('🧹 Clearing test data from localStorage...');

const clientsToDelete = ['CLIENT-002', 'CLIENT-003', 'CLIENT-004'];
const clientNamesToDelete = ['Brown Family Insurance', 'test llc', 'Smith Trucking LLC'];

const testPolicyPatterns = [
    'test111111',
    'test222222',
    'test142725',
    'Grant Corp',
    'Johnson Construction',
    'Business name Test LLC',
    'POL-1770228419041-hp6t6cavk',
    'POL-1770302215995-2ks01t6nr',
    'POL-1770145633181-hst9hav97'
];

// Clear test clients from insurance_clients
let clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
const originalClientCount = clients.length;

clients = clients.filter(client => {
    return !clientsToDelete.includes(client.id) &&
           !clientNamesToDelete.includes(client.name);
});

const removedClientCount = originalClientCount - clients.length;
localStorage.setItem('insurance_clients', JSON.stringify(clients));

// Clear test policies from insurance_policies
let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
const originalPolicyCount = policies.length;

policies = policies.filter(policy => {
    const policyStr = JSON.stringify(policy);

    // Check if policy contains any test patterns
    for (const pattern of testPolicyPatterns) {
        if (policyStr.includes(pattern)) {
            return false; // Remove this policy
        }
    }

    // Check for generic test patterns
    if (policyStr.includes('test') || policyStr.includes('Test') ||
        policyStr.includes('undefined') || policyStr.includes('N/A')) {
        return false; // Remove this policy
    }

    return true; // Keep this policy
});

const removedPolicyCount = originalPolicyCount - policies.length;
localStorage.setItem('insurance_policies', JSON.stringify(policies));

console.log(`✅ Removed ${removedClientCount} test clients from localStorage`);
console.log(`✅ Removed ${removedPolicyCount} test policies from localStorage`);
console.log(`📊 Remaining clients: ${clients.length}`);
console.log(`📊 Remaining policies: ${policies.length}`);

// Force reload the current view
if (window.location.hash === '#clients' && typeof loadClientsView === 'function') {
    console.log('🔄 Reloading clients view...');
    setTimeout(() => {
        loadClientsView();
    }, 100);
} else if (window.location.hash === '#policies' && typeof loadPoliciesView === 'function') {
    console.log('🔄 Reloading policies view...');
    setTimeout(() => {
        loadPoliciesView();
    }, 100);
}