// Debug Lead ID Corruption - Find where lead IDs get changed to 8126662
console.log('🔍 DEBUGGING: Lead ID corruption detector loaded...');

// Override the viewLead function to catch incorrect IDs immediately
const originalViewLead = window.viewLead;

window.viewLead = function(leadId) {
    console.log(`🔍 VIEWLEAD CALLED: leadId=${leadId} (type: ${typeof leadId})`);

    // Get the stack trace to see where this came from
    const stack = new Error().stack;
    console.log('📍 CALL STACK:', stack);

    if (String(leadId) === '8126662') {
        console.error(`🚨 HARDCODED 8126662 DETECTED!`);
        console.error(`🚨 CALL CAME FROM:`, stack);

        // Try to find the actual element that was clicked
        const activeElement = document.activeElement;
        if (activeElement) {
            console.log('🖱️ Active element:', activeElement);
            console.log('🖱️ Active element onclick:', activeElement.getAttribute('onclick'));

            // Check if the active element has debug data
            const debugId = activeElement.getAttribute('data-debug-lead-id');
            if (debugId && debugId !== '8126662') {
                console.log(`🔧 FOUND CORRECT ID from data-debug-lead-id: ${debugId}`);
                leadId = debugId;
            }

            // Check parent elements for correct ID
            let parent = activeElement.parentElement;
            while (parent && !debugId) {
                const parentDebugId = parent.getAttribute('data-debug-lead-id');
                if (parentDebugId && parentDebugId !== '8126662') {
                    console.log(`🔧 FOUND CORRECT ID from parent data-debug-lead-id: ${parentDebugId}`);
                    leadId = parentDebugId;
                    break;
                }
                parent = parent.parentElement;
            }
        }
    }

    // Call the original function
    if (originalViewLead) {
        return originalViewLead.call(this, leadId);
    } else {
        console.error('❌ Original viewLead function not found!');
    }
};

// Monitor DOM mutations for hardcoded buttons
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    // Check for hardcoded buttons
                    const badButtons = node.querySelectorAll ? node.querySelectorAll('[onclick*="8126662"]') : [];
                    if (badButtons.length > 0) {
                        console.warn(`🚨 HARDCODED BUTTONS DETECTED: ${badButtons.length} buttons with 8126662`);
                        badButtons.forEach((btn, index) => {
                            console.warn(`Button ${index + 1}:`, btn.getAttribute('onclick'));
                        });
                    }
                }
            });
        }
    });
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Function to manually check for hardcoded buttons
window.checkHardcodedButtons = function() {
    const badButtons = document.querySelectorAll('[onclick*="8126662"]');
    console.log(`🔍 Found ${badButtons.length} hardcoded buttons:`);
    badButtons.forEach((btn, index) => {
        console.log(`Button ${index + 1}:`, btn.getAttribute('onclick'));
        console.log('  Element:', btn);
        console.log('  Parent row:', btn.closest('tr'));
    });
};

console.log('✅ Lead ID corruption detector active');
console.log('🎯 Run window.checkHardcodedButtons() to manually check for hardcoded buttons');