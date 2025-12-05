/**
 * FORCE VICIDIAL LEADS - Emergency Fix for ViciDial Lead Persistence
 *
 * This script ensures ViciDial leads are ALWAYS present in localStorage
 * and never filtered out, regardless of other caching logic.
 */

console.log('🚀 Force ViciDial Leads - Loading emergency persistence fix');

// Emergency function to ensure ViciDial leads are in localStorage
async function forceViciDialLeadsIntoLocalStorage() {
    try {
        console.log('🔧 EMERGENCY: Forcing ViciDial leads into localStorage');

        // Get current API data
        const response = await fetch('/api/leads');
        if (!response.ok) {
            console.error('❌ Failed to fetch leads from API');
            return;
        }

        const apiLeads = await response.json();
        const vicidialLeads = apiLeads.filter(lead => lead.source === 'ViciDial' && !lead.archived);

        console.log(`📊 API Data: ${apiLeads.length} total leads, ${vicidialLeads.length} ViciDial leads`);

        if (vicidialLeads.length === 0) {
            console.log('ℹ️ No ViciDial leads found in API');
            return;
        }

        // Get current localStorage
        let currentLeads = [];
        try {
            currentLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        } catch (e) {
            console.warn('⚠️ Error parsing localStorage, starting fresh:', e);
            currentLeads = [];
        }

        // Remove any existing ViciDial leads to avoid duplicates
        const nonViciDialLeads = currentLeads.filter(lead => lead.source !== 'ViciDial');

        // Force ViciDial leads into localStorage
        const updatedLeads = [...nonViciDialLeads, ...vicidialLeads];

        localStorage.setItem('insurance_leads', JSON.stringify(updatedLeads));

        console.log(`✅ FORCED ${vicidialLeads.length} ViciDial leads into localStorage:`,
            vicidialLeads.map(l => `${l.id} - ${l.name}`));

        // Log summary
        console.log(`📈 localStorage Summary: ${updatedLeads.length} total leads (${vicidialLeads.length} ViciDial)`);

        return vicidialLeads.length;

    } catch (error) {
        console.error('❌ EMERGENCY: Failed to force ViciDial leads:', error);
        return 0;
    }
}

// Override localStorage.setItem to prevent ViciDial leads from being removed
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    if (key === 'insurance_leads') {
        try {
            const leads = JSON.parse(value);
            const vicidialCount = leads.filter(l => l.source === 'ViciDial').length;
            console.log(`🔍 INTERCEPTED localStorage.setItem: ${leads.length} leads (${vicidialCount} ViciDial)`);

            if (vicidialCount === 0) {
                console.warn('⚠️ PROTECTION: Attempt to save localStorage without ViciDial leads - forcing re-fetch');
                // Force re-fetch ViciDial leads before saving
                forceViciDialLeadsIntoLocalStorage().then(() => {
                    console.log('✅ PROTECTION: ViciDial leads restored after intercept');
                });
            }
        } catch (e) {
            console.warn('⚠️ Error parsing leads in setItem intercept:', e);
        }
    }
    return originalSetItem.call(this, key, value);
};

// Force ViciDial leads on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('📅 DOM loaded - forcing ViciDial leads');
        const count = await forceViciDialLeadsIntoLocalStorage();
        if (count > 0) {
            console.log('🎉 ViciDial leads forced successfully on page load');
        }
    });
} else {
    // DOM already loaded, run immediately
    forceViciDialLeadsIntoLocalStorage().then(count => {
        if (count > 0) {
            console.log('🎉 ViciDial leads forced successfully immediately');
        }
    });
}

// Also force leads every few seconds as a failsafe
setInterval(async () => {
    const currentLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const vicidialInStorage = currentLeads.filter(l => l.source === 'ViciDial').length;

    if (vicidialInStorage === 0) {
        console.log('🔄 FAILSAFE: No ViciDial leads in localStorage - forcing refresh');
        const count = await forceViciDialLeadsIntoLocalStorage();
        if (count > 0) {
            console.log('🔄 FAILSAFE: ViciDial leads restored');

            // Trigger any available display refresh functions
            if (typeof displayLeads === 'function') {
                displayLeads();
            }
            if (typeof refreshLeadsDisplay === 'function') {
                refreshLeadsDisplay();
            }
            if (typeof loadContent === 'function' && window.location.hash === '#leads') {
                loadContent('#leads');
            }
        }
    }
}, 5000); // Check every 5 seconds

// Make the force function available globally for manual calling
window.forceViciDialLeads = forceViciDialLeadsIntoLocalStorage;

console.log('✅ Force ViciDial Leads script loaded - ViciDial leads are now protected');