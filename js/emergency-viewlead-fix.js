// Emergency ViewLead Fix - Override to get correct lead ID from table context
console.log('🚨 EMERGENCY: Loading viewLead context fix...');

// Store original viewLead function
const originalViewLead = window.viewLead;

// Override viewLead to detect and fix hardcoded 8126662 calls
window.viewLead = function(leadId) {
    console.log(`🚨 EMERGENCY viewLead called with: ${leadId}`);

    // If the hardcoded value is being used, try to find the correct lead ID from context
    if (String(leadId) === '8126662') {
        console.log('🚨 HARDCODED 8126662 DETECTED! Attempting to find correct lead ID...');

        // Try to find the button that was clicked and get the correct ID from table context
        const clickedButton = document.activeElement;
        if (clickedButton && clickedButton.tagName === 'BUTTON') {
            const row = clickedButton.closest('tr');
            if (row) {
                // Look for the debug lead ID or extract from lead name onclick
                const debugElement = row.querySelector('[data-debug-lead-id]');
                const leadNameElement = row.querySelector('[onclick*="viewLead("]');

                let correctLeadId = null;

                if (debugElement) {
                    correctLeadId = debugElement.getAttribute('data-debug-lead-id');
                    console.log(`🔍 Found correct ID from debug attribute: ${correctLeadId}`);
                } else if (leadNameElement) {
                    const match = leadNameElement.getAttribute('onclick').match(/viewLead\('([^']+)'\)/);
                    if (match) {
                        correctLeadId = match[1];
                        console.log(`🔍 Found correct ID from lead name onclick: ${correctLeadId}`);
                    }
                }

                if (correctLeadId && correctLeadId !== '8126662') {
                    console.log(`✅ EMERGENCY FIX: Using correct lead ID ${correctLeadId} instead of ${leadId}`);
                    leadId = correctLeadId;
                } else {
                    console.warn(`⚠️ Could not find correct lead ID, proceeding with ${leadId}`);
                }
            }
        }
    }

    // Call the original function with the potentially corrected leadId
    if (typeof originalViewLead === 'function') {
        return originalViewLead.call(this, leadId);
    } else if (window.protectedFunctions && typeof window.protectedFunctions.viewLead === 'function') {
        return window.protectedFunctions.viewLead.call(this, leadId);
    } else {
        console.error('❌ No viewLead function found to call!');
    }
};

console.log('✅ EMERGENCY: viewLead override installed successfully!');