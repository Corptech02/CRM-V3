// NUCLEAR LEAD CLEANUP - FORCE CLEAR EVERYTHING
console.log('🚀 NUCLEAR CLEANUP - FORCE CLEARING ALL LEAD DATA');

(function() {
    'use strict';

    // IMMEDIATE DATA DESTRUCTION
    console.log('💥 CLEARING ALL LEAD STORAGE...');
    localStorage.removeItem('insurance_leads');
    localStorage.removeItem('leads');
    localStorage.removeItem('archivedLeads');
    localStorage.removeItem('archived_leads');
    localStorage.removeItem('PERMANENT_ARCHIVED_IDS');
    localStorage.removeItem('vicidial_import_history');
    localStorage.removeItem('vici_imported_leads');
    localStorage.removeItem('vicidialLeadsImported');

    // Set empty arrays
    localStorage.setItem('insurance_leads', '[]');
    localStorage.setItem('leads', '[]');
    localStorage.setItem('archived_leads', '[]');
    localStorage.setItem('archivedLeads', '[]');

    console.log('✅ ALL LEAD DATA CLEARED');

    // BLOCK ALL LEAD LOADING FUNCTIONS
    const blockedFunctions = [
        'loadLeadsFromServer',
        'syncVicidialLeads',
        'importLeads',
        'loadVicidialLeads',
        'generateSampleLeads',
        'addSampleLead',
        'createMockLead'
    ];

    blockedFunctions.forEach(funcName => {
        if (window[funcName]) {
            console.log(`🚫 BLOCKING FUNCTION: ${funcName}`);
            window[funcName] = function() {
                console.log(`🚫 BLOCKED CALL TO: ${funcName}`);
                return false;
            };
        }
    });

    // OVERRIDE localStorage.setItem COMPLETELY for lead keys
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        if (key === 'insurance_leads' || key === 'leads') {
            try {
                const data = JSON.parse(value);
                if (Array.isArray(data) && data.length > 0) {
                    console.log(`🚫 BLOCKED ATTEMPT TO SET ${key} with ${data.length} leads`);
                    console.log('Data:', data.map(l => l.name).slice(0, 5));
                    return; // Block completely
                }
            } catch (e) {
                console.log(`🚫 BLOCKED NON-JSON DATA to ${key}`);
                return;
            }
        }
        originalSetItem.call(localStorage, key, value);
    };

    // MONITOR for any lead additions
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'leadsList' ||
                mutation.target.closest('#leadsList') ||
                mutation.target.classList?.contains('lead-row')) {

                // Check for mock data in the DOM
                const mockElements = document.querySelectorAll('[data-lead-id]');
                mockElements.forEach(element => {
                    const text = element.textContent || '';
                    if (text.includes('Test') ||
                        text.includes('Robert Thompson') ||
                        text.includes('Jennifer Martin') ||
                        text.includes('ABC Corp')) {
                        console.log(`🚫 REMOVING MOCK ELEMENT: ${text.substring(0, 50)}`);
                        element.remove();
                    }
                });
            }
        });
    });

    // Start monitoring when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document, { childList: true, subtree: true });
        });
    } else {
        observer.observe(document, { childList: true, subtree: true });
    }

    // SPY ON ALL FUNCTION CALLS THAT MIGHT LOAD DATA
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && (url.includes('lead') || url.includes('api'))) {
            console.log(`🕵️ FETCH INTERCEPTED: ${url}`);
            console.trace('Fetch called from:');
        }
        return originalFetch.apply(this, args);
    };

    // MONITOR ALL LEAD-RELATED CONSOLE ACTIVITY
    setInterval(() => {
        const insuranceLeads = localStorage.getItem('insurance_leads');
        const regularLeads = localStorage.getItem('leads');

        if (insuranceLeads && insuranceLeads !== '[]') {
            console.log(`🚨 ALERT: insurance_leads contains data: ${insuranceLeads.length} chars`);
            localStorage.setItem('insurance_leads', '[]');
        }

        if (regularLeads && regularLeads !== '[]') {
            console.log(`🚨 ALERT: leads contains data: ${regularLeads.length} chars`);
            localStorage.setItem('leads', '[]');
        }
    }, 100); // Check every 100ms

    console.log('🛡️ NUCLEAR PROTECTION ACTIVE - NO LEADS CAN BE ADDED');

    // AGGRESSIVE: Clear data every second
    setInterval(() => {
        localStorage.setItem('insurance_leads', '[]');
        localStorage.setItem('leads', '[]');
    }, 1000);

    // FORCE RELOAD of leads view to show empty state
    setTimeout(() => {
        if (window.location.hash === '#leads' && typeof window.loadLeadsView === 'function') {
            console.log('🔄 FORCE RELOADING LEADS VIEW...');
            window.loadLeadsView();
        }
    }, 1000);

})();