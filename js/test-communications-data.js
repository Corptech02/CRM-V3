// Test data generator for Communications Reminders
function generateTestDataForCommunications() {
    // Add some test policies created recently
    const existingPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const today = new Date();

    const testPolicies = [
        {
            id: 'test_policy_1',
            clientName: 'John Smith',
            type: 'Auto Insurance',
            premium: 250,
            createdAt: new Date(today.getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString(), // 1 day ago
            date: new Date(today.getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString()
        },
        {
            id: 'test_policy_2',
            clientName: 'Sarah Johnson',
            type: 'Home Insurance',
            premium: 450,
            createdAt: new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000)).toISOString(), // 3 days ago
            date: new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000)).toISOString()
        },
        {
            id: 'test_policy_3',
            clientName: 'Mike Wilson',
            type: 'Commercial Auto',
            premium: 800,
            createdAt: new Date(today.getTime() - (5 * 24 * 60 * 60 * 1000)).toISOString(), // 5 days ago
            date: new Date(today.getTime() - (5 * 24 * 60 * 60 * 1000)).toISOString()
        }
    ];

    // Add test policies if they don't exist
    testPolicies.forEach(policy => {
        if (!existingPolicies.find(p => p.id === policy.id)) {
            existingPolicies.push(policy);
        }
    });

    localStorage.setItem('insurance_policies', JSON.stringify(existingPolicies));

    // Add some test clients with birthdays
    const existingClients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');

    const testClients = [];

    // Add test clients if they don't exist
    testClients.forEach(client => {
        if (!existingClients.find(c => c.id === client.id)) {
            existingClients.push(client);
        }
    });

    localStorage.setItem('insurance_clients', JSON.stringify(existingClients));

    console.log('Test data for Communications tab generated successfully!');
    console.log('- Added 3 recent policies for gift reminders');
    console.log('- Added 4 clients with upcoming birthdays');

    // Refresh the communications view if it's currently active
    if (window.location.hash === '#communications' && window.communicationsReminders) {
        window.communicationsReminders.updateRemindersDisplay();
        window.communicationsReminders.updateStats();
    }
}

// Auto-generate test data on load (for demo purposes)
document.addEventListener('DOMContentLoaded', () => {
    // DISABLED: Auto-generation of test data to prevent overriding user deletions
    // const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    // const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');

    // if (policies.length < 5 || clients.length < 5) {
    //     generateTestDataForCommunications();
    // }

    console.log('ℹ️ Test data auto-generation disabled to prevent overriding user deletions');
});