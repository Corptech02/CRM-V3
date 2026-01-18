// Simple Reports Call Count Fix - Only fix the data, keep original UI
console.log('🔧 SIMPLE FIX: Patching call counts without changing UI...');

// Let the original function run, then patch the displayed numbers
document.addEventListener('DOMContentLoaded', function() {
    // Monitor for modal creation
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    console.log('🔍 Node added:', node.className, node.tagName);

                    // Look for agent performance modals with multiple detection methods
                    const agentModal = node.querySelector && (
                        node.querySelector('.agent-performance-content') ||
                        node.classList.contains('agent-profile-modal') ||
                        (node.classList.contains('modal-overlay') && node.innerHTML && node.innerHTML.includes('Performance Profile'))
                    );

                    if (agentModal) {
                        console.log('🔧 Found agent modal, fixing call counts...');
                        setTimeout(() => fixCallCountsInModal(node), 100);
                    } else if (node.innerHTML && node.innerHTML.includes('Performance Profile')) {
                        console.log('🔧 Found Performance Profile text, trying fix...');
                        setTimeout(() => fixCallCountsInModal(node), 100);
                    }
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

function fixCallCountsInModal(modalElement) {
    try {
        console.log('🚫 DISABLED: fixCallCountsInModal - Total Calls and Duration now work directly like Total Leads');
        console.log('✅ NO FIXING NEEDED: Modal gets correct values from TRUE counter system');

        // Extract agent name just for logging
        const titleElement = modalElement.querySelector('h2');
        if (titleElement) {
            const agentNameMatch = titleElement.textContent.match(/(\w+)\s+Performance Profile/);
            if (agentNameMatch) {
                const agentName = agentNameMatch[1];
                console.log(`✅ DIRECT DISPLAY: ${agentName} metrics come directly from TRUE counter (same as Total Leads)`);
            }
        }

    } catch (error) {
        console.error('❌ Error in disabled fix function:', error);
    }
}

// Manual trigger function for testing (console-based)
window.manualFixCallCounts = function(agentName = 'Carson') {
    console.log(`🔧 CONSOLE-OVERRIDE: Manual fix triggered for ${agentName}`);
    const modal = document.querySelector('.agent-profile-modal') || document.querySelector('[class*="modal"]');
    if (modal) {
        console.log('🔧 CONSOLE-OVERRIDE: Found modal manually, applying console-based fix...');
        fixCallCountsInModal(modal);
    } else {
        console.log('❌ CONSOLE-OVERRIDE: No modal found for manual fix');
    }
};

// Direct fix function using console-based stats
window.directFixCallCounts = function(agentName = 'Carson') {
    console.log(`🔧 CONSOLE-OVERRIDE: DIRECT FIX for ${agentName}`);

    // Get stats from TRUE INCREMENTAL COUNTER (same system as Total Leads)
    let totalConnectedCalls = 0;
    let totalCallDuration = 0;

    if (window.getAgentCounters) {
        const trueCounters = window.getAgentCounters(agentName);
        totalConnectedCalls = trueCounters.callCount || 0;
        totalCallDuration = trueCounters.totalCallDuration || 0;
        console.log(`🎯 TRUE-OVERRIDE: ${agentName} TRUE stats:`, trueCounters);
    } else {
        console.log('⚠️ TRUE-OVERRIDE: True counter system not available, using 0');
    }

    // Find ALL elements and update both Total Calls and Total Call Duration
    const allElements = document.querySelectorAll('*');
    let fixedCalls = false;
    let fixedDuration = false;

    allElements.forEach(element => {
        const nextSib = element.nextElementSibling;
        const parent = element.parentElement;

        // Only update elements that are large metric numbers (28px font size)
        const hasLargeFontStyle = element.style && (
            element.style.fontSize === '28px' ||
            element.style.fontSize.includes('28px') ||
            element.getAttribute('style')?.includes('font-size: 28px')
        );

        // Check if this element is related to "Total Calls" and is a large metric
        if (hasLargeFontStyle && nextSib && nextSib.textContent && nextSib.textContent.includes('Total Calls')) {
            console.log(`🔧 CONSOLE-OVERRIDE: FOUND Total Calls metric! Updating from ${element.textContent} to ${totalConnectedCalls}`);
            element.textContent = totalConnectedCalls;
            element.style.color = totalConnectedCalls > 0 ? '#059669' : '#dc2626';
            element.style.fontWeight = 'bold';

            // Flash to show console-based update
            element.style.background = '#10b981';
            element.style.color = 'white';
            setTimeout(() => {
                element.style.background = '';
                element.style.color = totalConnectedCalls > 0 ? '#059669' : '#dc2626';
            }, 500);

            fixedCalls = true;
        }

        // Check if this element is related to "Total Call Duration" and is a large metric
        if (hasLargeFontStyle && nextSib && nextSib.textContent && nextSib.textContent.includes('Total Call Duration')) {
            console.log(`🔧 CONSOLE-OVERRIDE: FOUND Total Call Duration metric! Updating from ${element.textContent} to ${totalCallDuration}`);
            element.textContent = totalCallDuration;
            element.style.color = totalCallDuration > 0 ? '#0ea5e9' : '#dc2626';
            element.style.fontWeight = 'bold';

            // Flash to show console-based update
            element.style.background = '#0ea5e9';
            element.style.color = 'white';
            setTimeout(() => {
                element.style.background = '';
                element.style.color = totalCallDuration > 0 ? '#0ea5e9' : '#dc2626';
            }, 500);

            fixedDuration = true;
        }
    });

    console.log(`✅ CONSOLE-OVERRIDE: Direct fix complete - Calls: ${fixedCalls ? 'Updated' : 'Not Found'}, Duration: ${fixedDuration ? 'Updated' : 'Not Found'}`);

    // If we couldn't find elements directly, try using the live stats tracker's modal update function
    if (!fixedCalls || !fixedDuration) {
        if (window.liveStatsTracker && window.liveStatsTracker.updateUIIfOpen) {
            console.log('🔧 LIVE-OVERRIDE: Trying live stats tracker modal update as fallback');
            window.liveStatsTracker.updateUIIfOpen(agentName);
        }
    }
};

console.log('✅ CONSOLE-OVERRIDE: Simple call count fix loaded - now using console-based stats!');
console.log('🧪 CONSOLE-OVERRIDE: Test with: window.manualFixCallCounts("Carson")');
console.log('🔧 CONSOLE-OVERRIDE: All call counting now uses console tracker instead of lead data calculations');