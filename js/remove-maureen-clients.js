/**
 * Remove all Maureen's clients from localStorage and any cached data
 * This ensures her clients don't appear in the clients page
 */

(function() {
    console.log('🧹 Removing Maureen\'s clients from all data sources...');

    // AGGRESSIVE: Clear localStorage clients immediately
    const clientsKey = 'clients';
    const storedData = localStorage.getItem(clientsKey);
    if (storedData) {
        try {
            let clients = JSON.parse(storedData);
            const filtered = clients.filter(c => c.assignedTo !== 'Maureen');
            if (filtered.length < clients.length) {
                localStorage.setItem(clientsKey, JSON.stringify(filtered));
                console.log(`🗑️ Removed ${clients.length - filtered.length} Maureen clients from localStorage`);
            }
        } catch(e) {
            console.error('Error parsing clients:', e);
        }
    }

    // Clean localStorage clients
    function cleanLocalStorageClients() {
        const storedClients = localStorage.getItem('clients');
        if (storedClients) {
            try {
                let clients = JSON.parse(storedClients);
                const initialCount = clients.length;

                // Filter out Maureen's clients
                clients = clients.filter(client => {
                    if (typeof client === 'object' && client !== null) {
                        return client.assignedTo !== 'Maureen';
                    }
                    return true;
                });

                const removedCount = initialCount - clients.length;
                if (removedCount > 0) {
                    localStorage.setItem('clients', JSON.stringify(clients));
                    console.log(`✅ Removed ${removedCount} of Maureen's clients from localStorage`);
                }
            } catch (e) {
                console.error('Error cleaning localStorage clients:', e);
            }
        }
    }

    // Clean window.allClients if it exists
    function cleanWindowClients() {
        if (window.allClients && Array.isArray(window.allClients)) {
            const initialCount = window.allClients.length;
            window.allClients = window.allClients.filter(client => {
                if (typeof client === 'object' && client !== null) {
                    return client.assignedTo !== 'Maureen';
                }
                return true;
            });
            const removedCount = initialCount - window.allClients.length;
            if (removedCount > 0) {
                console.log(`✅ Removed ${removedCount} of Maureen's clients from window.allClients`);
            }
        }
    }

    // Override loadClients function to filter out Maureen's clients
    const originalLoadClients = window.loadClients;
    if (originalLoadClients) {
        window.loadClients = async function() {
            const result = await originalLoadClients.apply(this, arguments);

            // Filter the result if it's an array
            if (Array.isArray(result)) {
                return result.filter(client => {
                    if (typeof client === 'object' && client !== null) {
                        return client.assignedTo !== 'Maureen';
                    }
                    return true;
                });
            }

            return result;
        };
    }

    // Override getClients function to filter out Maureen's clients
    const originalGetClients = window.getClients;
    if (originalGetClients) {
        window.getClients = function() {
            const clients = originalGetClients.apply(this, arguments);
            if (Array.isArray(clients)) {
                return clients.filter(client => {
                    if (typeof client === 'object' && client !== null) {
                        return client.assignedTo !== 'Maureen';
                    }
                    return true;
                });
            }
            return clients;
        };
    }

    // Clean up on page load
    cleanLocalStorageClients();
    cleanWindowClients();

    // Also clean up after a delay to catch any late-loaded data
    setTimeout(() => {
        cleanLocalStorageClients();
        cleanWindowClients();
    }, 2000);

    // Monitor for client list updates
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Check for client cards with Maureen's name
                        const clientCards = node.querySelectorAll?.('.client-card');
                        if (clientCards) {
                            clientCards.forEach(card => {
                                const agentText = card.textContent || '';
                                if (agentText.includes('Maureen')) {
                                    card.remove();
                                    console.log('🗑️ Removed Maureen client card from DOM');
                                }
                            });
                        }
                    }
                });
            }
        });
    });

    // Start observing the document body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('✅ Maureen client removal system active');
})();