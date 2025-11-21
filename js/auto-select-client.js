// Auto-select client when navigating from incoming calls or other sources
(function() {
    console.log('Auto-select client handler initialized');

    // Function to select and show a specific client
    function selectClient(clientId) {
        console.log('Attempting to select client:', clientId);

        // Wait for clients view to load
        const checkInterval = setInterval(() => {
            // Check if we're on the clients page
            if (window.location.hash !== '#clients') {
                clearInterval(checkInterval);
                return;
            }

            // Look for client rows in the table
            const clientRows = document.querySelectorAll('tr[data-client-id], tr[onclick*="viewClientProfile"], tr[onclick*="showClientProfile"]');

            if (clientRows.length > 0) {
                console.log('Found', clientRows.length, 'client rows');

                // Find the specific client row
                let found = false;
                clientRows.forEach(row => {
                    // Check various ways the client ID might be stored
                    const rowClientId = row.getAttribute('data-client-id') ||
                                       row.getAttribute('data-id');

                    // Also check onclick attribute
                    const onclick = row.getAttribute('onclick');
                    if (onclick) {
                        const match = onclick.match(/['"]([^'"]+)['"]/);
                        if (match && String(match[1]) === String(clientId)) {
                            console.log('Found client row via onclick:', clientId);

                            // Click the row to open the profile
                            row.click();

                            // Also try clicking the view button if it exists
                            const viewBtn = row.querySelector('button[onclick*="viewClientProfile"], button[onclick*="showClientProfile"], .fa-eye');
                            if (viewBtn) {
                                setTimeout(() => viewBtn.click(), 100);
                            }

                            found = true;
                            clearInterval(checkInterval);
                            return;
                        }
                    }

                    if (String(rowClientId) === String(clientId)) {
                        console.log('Found client row:', clientId);

                        // Click the row to open the profile
                        row.click();

                        // Also try clicking the view button if it exists
                        const viewBtn = row.querySelector('button[onclick*="viewClientProfile"], button[onclick*="showClientProfile"], .fa-eye');
                        if (viewBtn) {
                            setTimeout(() => viewBtn.click(), 100);
                        }

                        found = true;
                        clearInterval(checkInterval);
                    }
                });

                if (!found) {
                    // Try to find by name if ID doesn't match
                    const clientName = sessionStorage.getItem('autoSelectClientName');
                    if (clientName) {
                        clientRows.forEach(row => {
                            const nameCell = row.querySelector('td:nth-child(2), .client-name');
                            if (nameCell && nameCell.textContent.includes(clientName)) {
                                console.log('Found client by name:', clientName);
                                row.click();

                                const viewBtn = row.querySelector('button[onclick*="viewClientProfile"], button[onclick*="showClientProfile"], .fa-eye');
                                if (viewBtn) {
                                    setTimeout(() => viewBtn.click(), 100);
                                }

                                clearInterval(checkInterval);
                            }
                        });
                    }
                }

                // Clear the check after attempting
                if (clientRows.length > 0) {
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        sessionStorage.removeItem('autoSelectClientId');
                        sessionStorage.removeItem('autoSelectClientName');
                    }, 2000);
                }
            }
        }, 500);

        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
    }

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#clients') {
            const clientId = sessionStorage.getItem('autoSelectClientId');
            if (clientId) {
                console.log('Hash changed to clients, auto-selecting:', clientId);
                setTimeout(() => selectClient(clientId), 500);
            }
        }
    });

    // Listen for custom selectClient events
    document.addEventListener('selectClient', (event) => {
        console.log('Select client event received:', event.detail);
        if (event.detail && event.detail.clientId) {
            selectClient(event.detail.clientId);

            // Also store the name for fallback
            if (event.detail.client && event.detail.client.name) {
                sessionStorage.setItem('autoSelectClientName', event.detail.client.name);
            }
        }
    });

    // Check on page load
    if (window.location.hash === '#clients') {
        const clientId = sessionStorage.getItem('autoSelectClientId');
        if (clientId) {
            console.log('Page loaded on clients view, auto-selecting:', clientId);
            setTimeout(() => selectClient(clientId), 1000);
        }
    }

    console.log('Auto-select client handler ready');
})();