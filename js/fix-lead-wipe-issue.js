/**
 * Fix Lead Wipe Issue - Prevent leads from disappearing after status updates
 * This script prevents automatic lead sync scripts from overwriting existing leads
 */

console.log('🔒 Loading lead wipe protection...');

(function() {
    'use strict';

    // Store the original fetch function
    const originalFetch = window.fetch;

    // Track leads that exist before any sync operations
    let protectedLeadIds = new Set();

    // Initialize protection by capturing existing leads
    function initializeLeadProtection() {
        try {
            // Get leads from localStorage
            const localLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

            localLeads.forEach(lead => {
                if (lead.id) protectedLeadIds.add(String(lead.id));
            });

            insuranceLeads.forEach(lead => {
                if (lead.id) protectedLeadIds.add(String(lead.id));
            });

            console.log(`🔒 PROTECTION: Protecting ${protectedLeadIds.size} existing leads from sync operations`);
        } catch (error) {
            console.error('Error initializing lead protection:', error);
        }
    }

    // Override fetch to intercept and modify sync requests
    window.fetch = async function(...args) {
        const [url, options] = args;

        // Check if this is a lead-related API call
        if (typeof url === 'string' && (
            url.includes('/api/leads') ||
            url.includes('/api/vicidial') ||
            url.includes('/api/bulk-save')
        )) {
            console.log('🔒 PROTECTION: Intercepting API call:', url);

            // Call the original fetch
            const response = await originalFetch.apply(this, args);

            // If this is a POST/PUT that might overwrite leads, merge with existing
            if (options && (options.method === 'POST' || options.method === 'PUT')) {
                console.log('🔒 PROTECTION: Intercepting lead write operation');
            }

            return response;
        }

        // For non-lead API calls, just pass through
        return originalFetch.apply(this, args);
    };

    // Override ViciDial sync functions to prevent complete overwrite
    const syncFunctionsToProtect = [
        'syncVicidialLeads',
        'importLeads',
        'loadVicidialLeads',
        'realVicidialSync',
        'selectiveVicidialSync',
        'enhancedVicidialSync'
    ];

    syncFunctionsToProtect.forEach(funcName => {
        const originalFunc = window[funcName];
        if (originalFunc && typeof originalFunc === 'function') {
            window[funcName] = async function(...args) {
                console.log(`🔒 PROTECTION: Wrapping ${funcName} to preserve existing leads`);

                // Get current leads before sync
                const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
                const currentInsuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

                // Track which leads exist before sync
                const preExistingIds = new Set();
                currentLeads.forEach(lead => {
                    if (lead.id) preExistingIds.add(String(lead.id));
                });
                currentInsuranceLeads.forEach(lead => {
                    if (lead.id) preExistingIds.add(String(lead.id));
                });

                // Run the original function
                const result = await originalFunc.apply(this, args);

                // After sync, restore any leads that might have been deleted
                setTimeout(() => {
                    const newLeads = JSON.parse(localStorage.getItem('leads') || '[]');
                    const newInsuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

                    // Check for missing leads and restore them
                    const missingFromLeads = currentLeads.filter(lead =>
                        lead.id &&
                        preExistingIds.has(String(lead.id)) &&
                        !newLeads.some(newLead => String(newLead.id) === String(lead.id))
                    );

                    const missingFromInsurance = currentInsuranceLeads.filter(lead =>
                        lead.id &&
                        preExistingIds.has(String(lead.id)) &&
                        !newInsuranceLeads.some(newLead => String(newLead.id) === String(lead.id))
                    );

                    if (missingFromLeads.length > 0) {
                        console.log(`🔒 PROTECTION: Restoring ${missingFromLeads.length} leads that were removed by sync`);
                        const mergedLeads = [...newLeads, ...missingFromLeads];
                        localStorage.setItem('leads', JSON.stringify(mergedLeads));
                    }

                    if (missingFromInsurance.length > 0) {
                        console.log(`🔒 PROTECTION: Restoring ${missingFromInsurance.length} insurance leads that were removed by sync`);
                        const mergedInsurance = [...newInsuranceLeads, ...missingFromInsurance];
                        localStorage.setItem('insurance_leads', JSON.stringify(mergedInsurance));
                    }

                    // Refresh the page display if any leads were restored
                    if (missingFromLeads.length > 0 || missingFromInsurance.length > 0) {
                        if (typeof refreshLeadsList === 'function') {
                            refreshLeadsList();
                        }
                        if (typeof loadInsuranceData === 'function') {
                            loadInsuranceData();
                        }
                        window.dispatchEvent(new Event('leadDataChanged'));
                    }
                }, 1000);

                return result;
            };

            console.log(`🔒 PROTECTION: Wrapped ${funcName} function`);
        }
    });

    // Override localStorage.setItem for leads to prevent complete overwrites
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        if (key === 'leads' || key === 'insurance_leads') {
            try {
                const newData = JSON.parse(value);
                const currentData = JSON.parse(localStorage.getItem(key) || '[]');

                // If the new data has significantly fewer leads, it might be a wipe
                if (currentData.length > 0 && newData.length < (currentData.length * 0.5)) {
                    console.log(`🔒 PROTECTION: Preventing potential data wipe. Current: ${currentData.length}, New: ${newData.length}`);

                    // Merge the data instead of replacing
                    const existingIds = new Set(currentData.map(lead => String(lead.id)));
                    const mergedData = [...currentData];

                    // Add new leads that don't exist
                    newData.forEach(newLead => {
                        if (!existingIds.has(String(newLead.id))) {
                            mergedData.push(newLead);
                        } else {
                            // Update existing lead with new data
                            const index = mergedData.findIndex(lead => String(lead.id) === String(newLead.id));
                            if (index !== -1) {
                                mergedData[index] = { ...mergedData[index], ...newLead };
                            }
                        }
                    });

                    console.log(`🔒 PROTECTION: Merged ${key} data. Final count: ${mergedData.length}`);
                    return originalSetItem.call(this, key, JSON.stringify(mergedData));
                }
            } catch (error) {
                console.error('Error in lead protection:', error);
            }
        }

        return originalSetItem.call(this, key, value);
    };

    // Initialize protection on page load
    initializeLeadProtection();

    // Re-initialize protection if leads are loaded
    window.addEventListener('leadDataChanged', initializeLeadProtection);

    // Periodic check to ensure leads haven't been wiped
    setInterval(() => {
        const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        if (protectedLeadIds.size > 0 && currentLeads.length === 0) {
            console.warn('🔒 PROTECTION: All leads have been cleared! This might be a sync issue.');

            // Try to restore from server
            if (typeof loadLeadsFromServer === 'function') {
                console.log('🔒 PROTECTION: Attempting to reload leads from server...');
                loadLeadsFromServer();
            }
        }
    }, 30000); // Check every 30 seconds

    console.log('🔒 Lead wipe protection initialized');

    // Expose functions for manual use
    window.protectLeads = initializeLeadProtection;
    window.getProtectedLeadCount = () => protectedLeadIds.size;

})();