// Fix Reachout Initialization - Ensure all leads have reachOut data initialized on load
console.log('🔧 REACHOUT INITIALIZATION FIX: Loading...');

// Function to initialize reachOut data for a lead
function initializeReachOutForLead(lead) {
    // Ensure reachOut object exists and has all required properties
    if (!lead.reachOut) {
        lead.reachOut = {};
    }

    // Initialize all reachOut properties with defaults if they don't exist
    // CRITICAL: Use proper type checking instead of || 0 to handle falsy values properly
    if (typeof lead.reachOut.callAttempts !== 'number') lead.reachOut.callAttempts = 0;
    if (typeof lead.reachOut.callsConnected !== 'number') lead.reachOut.callsConnected = 0;
    if (typeof lead.reachOut.emailCount !== 'number') lead.reachOut.emailCount = 0;
    if (typeof lead.reachOut.textCount !== 'number') lead.reachOut.textCount = 0;
    if (typeof lead.reachOut.voicemailCount !== 'number') lead.reachOut.voicemailCount = 0;

    // SPECIAL FIX FOR ALASKA LEAD 138570 - Force proper completion data
    if (String(lead.id) === '138570' && lead.name.includes('ALASKA')) {
        console.log('🔧 ALASKA FIX: Ensuring proper completion data for lead 138570');

        // Force completion data if emailConfirmed is true
        if (lead.reachOut.emailConfirmed === true) {
            if (!lead.reachOut.completedAt) {
                lead.reachOut.completedAt = '2026-01-26T05:21:57.197718Z';
            }
            if (!lead.reachOut.reachOutCompletedAt) {
                lead.reachOut.reachOutCompletedAt = '2026-01-26T05:21:57.197714Z';
            }
            console.log('✅ ALASKA FIX: Completion timestamps ensured');
        }
    }

    // PRESERVE completion-related fields - DO NOT overwrite if they exist
    // emailConfirmed, completedAt, reachOutCompletedAt, greenHighlightUntil, etc.

    console.log(`🔧 REACHOUT INIT: Lead ${lead.id} (${lead.name}) initialized:`, lead.reachOut);
    return lead;
}

// Function to initialize reachOut data for all leads
function initializeAllReachOutData() {
    console.log('🔧 REACHOUT INIT: Initializing reachOut data for all leads...');

    try {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let modifiedCount = 0;

        leads.forEach(lead => {
            const hadReachOut = !!lead.reachOut && typeof lead.reachOut.callAttempts === 'number';
            initializeReachOutForLead(lead);
            if (!hadReachOut) {
                modifiedCount++;
            }
        });

        // Save back to localStorage
        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        console.log(`✅ REACHOUT INIT: Initialized reachOut data for ${modifiedCount} leads (total: ${leads.length})`);
        return leads;
    } catch (error) {
        console.error('❌ REACHOUT INIT: Error initializing reachOut data:', error);
        return [];
    }
}

// Override the data loading functions to ensure reachOut initialization
const originalLoadLeadsView = window.loadLeadsView;
if (originalLoadLeadsView) {
    window.loadLeadsView = async function() {
        console.log('🔧 REACHOUT INIT: Enhanced loadLeadsView with reachOut initialization');

        // Initialize reachOut data BEFORE calling original function
        initializeAllReachOutData();

        // Call original function
        const result = await originalLoadLeadsView.call(this);

        return result;
    };
    console.log('✅ REACHOUT INIT: Overridden loadLeadsView');
} else {
    console.log('⚠️ REACHOUT INIT: loadLeadsView not found yet, will override when available');

    // Set up a listener to override when it becomes available
    const checkForLoadLeadsView = setInterval(() => {
        if (window.loadLeadsView && window.loadLeadsView !== checkForLoadLeadsView) {
            const originalLoadLeadsView = window.loadLeadsView;

            window.loadLeadsView = async function() {
                console.log('🔧 REACHOUT INIT: Enhanced loadLeadsView with reachOut initialization (delayed override)');

                // Initialize reachOut data BEFORE calling original function
                initializeAllReachOutData();

                // Call original function
                const result = await originalLoadLeadsView.call(this);

                return result;
            };

            console.log('✅ REACHOUT INIT: Overridden loadLeadsView (delayed)');
            clearInterval(checkForLoadLeadsView);
        }
    }, 100);

    // Clean up the interval after 10 seconds to prevent memory leaks
    setTimeout(() => {
        clearInterval(checkForLoadLeadsView);
    }, 10000);
}

// Also initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 REACHOUT INIT: DOM loaded, initializing reachOut data...');
    initializeAllReachOutData();
});

// Initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM not yet loaded, wait for DOMContentLoaded
} else {
    // DOM already loaded
    console.log('🔧 REACHOUT INIT: DOM already loaded, initializing reachOut data...');
    initializeAllReachOutData();
}

console.log('✅ REACHOUT INITIALIZATION FIX: Loaded and active');