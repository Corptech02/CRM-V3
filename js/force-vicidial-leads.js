/**
 * FORCE VICIDIAL LEADS - DISABLED
 *
 * This script was preventing legitimate ViciDial lead deletions by users.
 * The protection was too aggressive and interfered with normal operations.
 * SCRIPT DISABLED TO ALLOW PROPER LEAD MANAGEMENT.
 */

console.log('🔇 Force ViciDial Leads - DISABLED (was preventing legitimate deletions)');

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

// DISABLED: localStorage override was preventing legitimate deletions
// const originalSetItem = localStorage.setItem;
// localStorage.setItem = function(key, value) {
//     // DISABLED - was blocking user deletions
// };
console.log('🔓 localStorage override DISABLED - users can now delete leads normally');

// DISABLED: Auto-forcing leads on page load
// if (document.readyState === 'loading') {
//     // DISABLED - was preventing deletions
// } else {
//     // DISABLED - was preventing deletions
// }
console.log('🔓 Auto-force on page load DISABLED - allowing normal lead management');

// DISABLED: Interval check was constantly restoring deleted leads
// setInterval(async () => {
//     // DISABLED - was preventing legitimate deletions by constantly restoring leads
// }, 5000);
console.log('🔓 Interval failsafe DISABLED - leads will stay deleted when users delete them');

// Function still available for manual emergency use if needed
window.forceViciDialLeads = forceViciDialLeadsIntoLocalStorage;

console.log('✅ Force ViciDial Leads script loaded - PROTECTION DISABLED, normal deletions now allowed');