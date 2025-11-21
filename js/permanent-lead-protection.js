/**
 * Permanent Lead Protection System
 * Prevents ViciDial sync scripts from wiping out existing leads
 * This script should be loaded BEFORE any ViciDial sync scripts
 */

console.log('🛡️ Initializing Permanent Lead Protection System...');

(function() {
    'use strict';

    // Create a namespace for our protection system
    window.LeadProtection = window.LeadProtection || {};

    const PROTECTION_KEY = 'lead_protection_active';
    const PROTECTED_IDS_KEY = 'protected_lead_ids';

    // Track protection status
    let protectionActive = localStorage.getItem(PROTECTION_KEY) === 'true';
    let protectedLeadIds = new Set(JSON.parse(localStorage.getItem(PROTECTED_IDS_KEY) || '[]'));

    console.log(`🛡️ PROTECTION: Starting with ${protectedLeadIds.size} protected leads`);

    // Initialize protection
    function initializeProtection() {
        // Get all current leads and mark them as protected
        try {
            const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const insuranceLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

            currentLeads.forEach(lead => {
                if (lead.id) protectedLeadIds.add(String(lead.id));
            });

            insuranceLeads.forEach(lead => {
                if (lead.id) protectedLeadIds.add(String(lead.id));
            });

            // Save protected IDs
            localStorage.setItem(PROTECTED_IDS_KEY, JSON.stringify([...protectedLeadIds]));
            localStorage.setItem(PROTECTION_KEY, 'true');
            protectionActive = true;

            console.log(`🛡️ PROTECTION: Now protecting ${protectedLeadIds.size} leads`);
        } catch (error) {
            console.error('Error initializing lead protection:', error);
        }
    }

    // Enhanced localStorage override that prevents data wipes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        if (!protectionActive) {
            return originalSetItem.call(this, key, value);
        }

        if (key === 'leads' || key === 'insurance_leads') {
            try {
                const newData = JSON.parse(value);
                const currentData = JSON.parse(localStorage.getItem(key) || '[]');

                // Check if this is a potential data wipe (more than 50% reduction)
                const isSignificantReduction = currentData.length > 5 && newData.length < (currentData.length * 0.5);

                // Check if any protected leads are missing
                const missingProtectedLeads = currentData.filter(lead =>
                    protectedLeadIds.has(String(lead.id)) &&
                    !newData.some(newLead => String(newLead.id) === String(lead.id))
                );

                if (isSignificantReduction || missingProtectedLeads.length > 0) {
                    console.warn(`🛡️ PROTECTION: Blocking potential data wipe for ${key}`);
                    console.warn(`Current: ${currentData.length}, New: ${newData.length}, Missing: ${missingProtectedLeads.length}`);

                    // Merge instead of replace
                    const mergedData = [...currentData];
                    const existingIds = new Set(currentData.map(lead => String(lead.id)));

                    // Add new leads that don't exist
                    newData.forEach(newLead => {
                        if (!existingIds.has(String(newLead.id))) {
                            mergedData.push(newLead);
                            console.log(`🛡️ PROTECTION: Adding new lead: ${newLead.name}`);
                        }
                    });

                    console.log(`🛡️ PROTECTION: Merged ${key} data. Final count: ${mergedData.length}`);
                    return originalSetItem.call(this, key, JSON.stringify(mergedData));
                }

                // Update protected IDs with any new leads
                newData.forEach(lead => {
                    if (lead.id) {
                        protectedLeadIds.add(String(lead.id));
                    }
                });

                localStorage.setItem(PROTECTED_IDS_KEY, JSON.stringify([...protectedLeadIds]));

            } catch (error) {
                console.error('Error in lead protection:', error);
            }
        }

        return originalSetItem.call(this, key, value);
    };

    // Override dangerous functions that clear data
    const dangerousFunctions = [
        'clearAllLeads',
        'resetLeadData',
        'clearLeadStorage',
        'wipeLeadData'
    ];

    dangerousFunctions.forEach(funcName => {
        if (window[funcName]) {
            const original = window[funcName];
            window[funcName] = function(...args) {
                if (protectionActive) {
                    console.warn(`🛡️ PROTECTION: Blocked call to dangerous function: ${funcName}`);
                    return false;
                }
                return original.apply(this, args);
            };
        }
    });

    // Override fetch to protect against API calls that might wipe data
    const originalFetch = window.fetch;
    if (originalFetch) {
        window.fetch = function(url, options = {}) {
            if (protectionActive && typeof url === 'string') {
                // Monitor DELETE requests to leads API
                if (options.method === 'DELETE' && url.includes('/api/leads')) {
                    console.log(`🛡️ PROTECTION: Monitoring DELETE request to ${url}`);
                }

                // Monitor bulk operations that might wipe data
                if (options.method === 'POST' && url.includes('/api/bulk') && options.body) {
                    try {
                        const body = JSON.parse(options.body);
                        if (body.leads && body.leads.length === 0) {
                            console.warn(`🛡️ PROTECTION: Blocking bulk operation with empty leads array`);
                            return Promise.resolve(new Response('{"success": false, "error": "Blocked by lead protection"}', {
                                status: 403,
                                headers: { 'Content-Type': 'application/json' }
                            }));
                        }
                    } catch (e) {
                        // Ignore JSON parse errors
                    }
                }
            }

            return originalFetch.apply(this, arguments);
        };
    }

    // Monitor for ViciDial sync operations
    const vicidialSyncFunctions = [
        'syncVicidialLeads',
        'importVicidialData',
        'loadVicidialLeads',
        'realVicidialSync',
        'selectiveVicidialSync',
        'enhancedVicidialSync',
        'vicidialFullSync'
    ];

    vicidialSyncFunctions.forEach(funcName => {
        // Override existing functions
        if (window[funcName]) {
            const original = window[funcName];
            window[funcName] = function(...args) {
                console.log(`🛡️ PROTECTION: Monitoring ViciDial sync function: ${funcName}`);

                // Get lead count before sync
                const leadsBefore = JSON.parse(localStorage.getItem('leads') || '[]').length;

                const result = original.apply(this, args);

                // Check lead count after sync (with a delay)
                setTimeout(() => {
                    const leadsAfter = JSON.parse(localStorage.getItem('leads') || '[]').length;
                    if (leadsAfter < leadsBefore) {
                        console.warn(`🛡️ PROTECTION: ViciDial sync reduced leads from ${leadsBefore} to ${leadsAfter}`);
                        // Trigger restoration if needed
                        restoreProtectedLeads();
                    }
                }, 1000);

                return result;
            };
        }

        // Intercept function definitions
        const originalDefine = Object.defineProperty;
        Object.defineProperty = function(obj, prop, descriptor) {
            if (obj === window && vicidialSyncFunctions.includes(prop) && descriptor.value) {
                console.log(`🛡️ PROTECTION: Intercepting definition of ${prop}`);
                const originalFunc = descriptor.value;
                descriptor.value = function(...args) {
                    console.log(`🛡️ PROTECTION: Monitoring newly defined ${prop}`);
                    return originalFunc.apply(this, args);
                };
            }
            return originalDefine.call(this, obj, prop, descriptor);
        };
    });

    // Function to restore protected leads if they're missing
    async function restoreProtectedLeads() {
        console.log('🛡️ PROTECTION: Checking for missing protected leads...');

        try {
            const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const currentIds = new Set(currentLeads.map(lead => String(lead.id)));

            const missingIds = [...protectedLeadIds].filter(id => !currentIds.has(id));

            if (missingIds.length > 0) {
                console.log(`🛡️ PROTECTION: Found ${missingIds.length} missing protected leads. Attempting restore...`);

                // Try to restore from server
                const response = await fetch('/api/leads');
                if (response.ok) {
                    const serverLeads = await response.json();
                    const missingLeads = serverLeads.filter(lead => missingIds.includes(String(lead.id)));

                    if (missingLeads.length > 0) {
                        const restoredData = [...currentLeads, ...missingLeads];
                        localStorage.setItem('leads', JSON.stringify(restoredData));
                        console.log(`🛡️ PROTECTION: Restored ${missingLeads.length} leads from server`);
                    }
                }
            }
        } catch (error) {
            console.error('Error restoring protected leads:', error);
        }
    }

    // Periodic check for data integrity
    setInterval(() => {
        if (protectionActive) {
            const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const currentIds = new Set(currentLeads.map(lead => String(lead.id)));
            const missingProtected = [...protectedLeadIds].filter(id => !currentIds.has(id));

            if (missingProtected.length > 5) {
                console.warn(`🛡️ PROTECTION: ${missingProtected.length} protected leads are missing!`);
                restoreProtectedLeads();
            }
        }
    }, 60000); // Check every minute

    // Public API
    window.LeadProtection = {
        enable: function() {
            protectionActive = true;
            localStorage.setItem(PROTECTION_KEY, 'true');
            initializeProtection();
            console.log('🛡️ PROTECTION: Lead protection ENABLED');
        },

        disable: function() {
            protectionActive = false;
            localStorage.setItem(PROTECTION_KEY, 'false');
            console.log('🛡️ PROTECTION: Lead protection DISABLED');
        },

        isActive: function() {
            return protectionActive;
        },

        getProtectedCount: function() {
            return protectedLeadIds.size;
        },

        addProtectedLead: function(leadId) {
            protectedLeadIds.add(String(leadId));
            localStorage.setItem(PROTECTED_IDS_KEY, JSON.stringify([...protectedLeadIds]));
        },

        restoreLeads: restoreProtectedLeads,

        status: function() {
            console.log(`🛡️ PROTECTION STATUS:`);
            console.log(`Active: ${protectionActive}`);
            console.log(`Protected leads: ${protectedLeadIds.size}`);
            console.log(`Current leads: ${JSON.parse(localStorage.getItem('leads') || '[]').length}`);
        }
    };

    // Initialize on load
    if (localStorage.getItem(PROTECTION_KEY) !== 'false') {
        initializeProtection();
    }

    console.log('🛡️ Permanent Lead Protection System initialized');
    console.log('Use LeadProtection.status() to check protection status');

})();