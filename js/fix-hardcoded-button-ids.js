// Fix Hardcoded Button IDs - Emergency Fix
console.log('🔧 EMERGENCY FIX: Starting hardcoded button ID fixer...');
console.log('🔧 EMERGENCY FIX: Script loaded successfully!');

function fixHardcodedButtons() {
    console.log('🔧 EMERGENCY FIX: Running fixHardcodedButtons...');

    // Find all buttons with hardcoded onclick handlers
    const buttons = document.querySelectorAll('button[onclick*="viewLead(\'8126662\')"], button[onclick*="archiveLead(\'8126662\')"], button[onclick*="convertLead(\'8126662\')"], button[onclick*="permanentlyDeleteActiveLead(\'8126662\')"]');

    console.log(`🔧 EMERGENCY FIX: Searching for hardcoded buttons... found ${buttons.length} buttons`);

    if (buttons.length > 0) {
        console.log(`🔧 FOUND ${buttons.length} hardcoded buttons to fix`);

        buttons.forEach((button, index) => {
            // Find the lead ID from the row context
            const row = button.closest('tr');
            if (!row) return;

            // Look for the correct lead ID in data attributes or debug attributes
            const debugLeadElement = row.querySelector('[data-debug-lead-id]');
            const leadNameElement = row.querySelector('[onclick*="viewLead("]');

            let correctLeadId = null;

            if (debugLeadElement) {
                correctLeadId = debugLeadElement.getAttribute('data-debug-lead-id');
            } else if (leadNameElement) {
                const match = leadNameElement.getAttribute('onclick').match(/viewLead\('([^']+)'\)/);
                if (match) correctLeadId = match[1];
            }

            if (correctLeadId && correctLeadId !== '8126662') {
                const currentOnclick = button.getAttribute('onclick');
                let newOnclick = currentOnclick;

                // Replace all instances of the hardcoded ID
                newOnclick = newOnclick.replace(/viewLead\('8126662'\)/g, `viewLead('${correctLeadId}')`);
                newOnclick = newOnclick.replace(/archiveLead\('8126662'\)/g, `archiveLead('${correctLeadId}')`);
                newOnclick = newOnclick.replace(/convertLead\('8126662'\)/g, `convertLead('${correctLeadId}')`);
                newOnclick = newOnclick.replace(/permanentlyDeleteActiveLead\('8126662'\)/g, `permanentlyDeleteActiveLead('${correctLeadId}')`);

                button.setAttribute('onclick', newOnclick);
                console.log(`✅ FIXED button ${index + 1}: ${currentOnclick} → ${newOnclick}`);
            }
        });
    } else {
        console.log('✅ No hardcoded buttons found - all good!');
    }
}

// Run the fix when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(fixHardcodedButtons, 100);
    });
} else {
    setTimeout(fixHardcodedButtons, 100);
}

// Also run the fix whenever the leads view is refreshed
const originalLoadLeadsView = window.loadLeadsView;
if (typeof originalLoadLeadsView === 'function') {
    window.loadLeadsView = function(...args) {
        const result = originalLoadLeadsView.apply(this, args);
        setTimeout(fixHardcodedButtons, 500);
        return result;
    };
}

// Run the fix periodically as a safety net
setInterval(fixHardcodedButtons, 2000);

// Run immediately when script loads
console.log('🔧 EMERGENCY FIX: Running immediate fix check...');
setTimeout(fixHardcodedButtons, 50);

console.log('🔧 EMERGENCY FIX: Hardcoded button ID fixer loaded and active');