// Clear specific test clients from localStorage
(function() {
    const testClientIds = [
        'client_birthday_1', // Emily Davis
        'client_birthday_2', // Robert Brown
        'client_birthday_3', // Jessica Martinez
        'client_birthday_4'  // David Thompson
    ];

    // Remove from insurance_clients localStorage
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const filteredClients = clients.filter(client => !testClientIds.includes(client.id));

    if (clients.length !== filteredClients.length) {
        localStorage.setItem('insurance_clients', JSON.stringify(filteredClients));
        console.log('Removed test clients from localStorage:', testClientIds);
    }

    // Also clear any cached client data
    const cachedClients = JSON.parse(localStorage.getItem('cached_clients') || '[]');
    const filteredCachedClients = cachedClients.filter(client => !testClientIds.includes(client.id));

    if (cachedClients.length !== filteredCachedClients.length) {
        localStorage.setItem('cached_clients', JSON.stringify(filteredCachedClients));
    }
})();