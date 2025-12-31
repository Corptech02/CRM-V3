// Fix localStorage quota exceeded error
(function() {
    console.log('🧹 Fixing localStorage quota exceeded error...');

    // Function to clear problematic data
    function clearProblematicData() {
        const itemsToCheck = [
            'insurance_clients',
            'insurance_leads',
            'insurance_policies',
            'leads',
            'clients'
        ];

        let totalCleared = 0;

        itemsToCheck.forEach(item => {
            try {
                const data = localStorage.getItem(item);
                if (data) {
                    const size = new Blob([data]).size;
                    console.log(`📊 ${item}: ${(size / 1024 / 1024).toFixed(2)}MB`);

                    // If item is over 2MB, clear it
                    if (size > 2 * 1024 * 1024) {
                        localStorage.removeItem(item);
                        console.log(`🗑️ Cleared ${item} (${(size / 1024 / 1024).toFixed(2)}MB)`);
                        totalCleared += size;
                    }
                }
            } catch (e) {
                console.log(`❌ Error checking ${item}:`, e);
                // If we can't even read it, remove it
                localStorage.removeItem(item);
                console.log(`🗑️ Force removed corrupted ${item}`);
            }
        });

        console.log(`✅ Total space cleared: ${(totalCleared / 1024 / 1024).toFixed(2)}MB`);
    }

    // Function to get localStorage usage
    function getStorageUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage.getItem(key).length;
            }
        }
        return total;
    }

    // Check current usage
    const beforeUsage = getStorageUsage();
    console.log(`📊 Current localStorage usage: ${(beforeUsage / 1024 / 1024).toFixed(2)}MB`);

    // Clear problematic data
    clearProblematicData();

    // Check usage after cleanup
    const afterUsage = getStorageUsage();
    console.log(`📊 New localStorage usage: ${(afterUsage / 1024 / 1024).toFixed(2)}MB`);

    // Override problematic API calls
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];

        // Block 404-causing API calls
        if (typeof url === 'string' && url.includes('/api/leads/') && !url.includes('/api/leads?')) {
            const leadId = url.split('/api/leads/')[1];
            // Only allow valid lead IDs (not the massive numbers we're seeing)
            if (leadId.length > 10) {
                console.log(`🚫 Blocking invalid lead API call: ${url}`);
                return Promise.resolve(new Response('{"error":"Invalid lead ID"}', {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
        }

        return originalFetch.apply(this, args);
    };

    console.log('✅ localStorage quota fix applied');
})();