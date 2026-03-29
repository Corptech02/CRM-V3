// Prevent Fast Click Timing Issue - Stops wrong lead loading when clicking too fast after page refresh
console.log('🚨 TIMING FIX: Preventing fast-click timing issues...');

// Debug flag - set to true to enable verbose logging
const SAFE_VIEWLEAD_DEBUG = false;

// Capture original viewLead function before overriding
const originalViewLead = window.viewLead;

// Recursion prevention flag
let isInViewLead = false;

let isSystemReady = false;
let clickQueue = [];

// Wait for critical systems to be ready
function waitForSystemReady() {
    console.log('⏳ TIMING FIX: Waiting for system to be ready...');

    const checkReady = () => {
        // Check if critical functions exist
        const hasLeadData = localStorage.getItem('insurance_leads');
        const hasViewLead = typeof window.viewLead === 'function' || (window.protectedFunctions && typeof window.protectedFunctions.viewLead === 'function');
        const hasDOMContent = document.readyState === 'complete' || document.readyState === 'interactive';

        if (hasLeadData && hasViewLead && hasDOMContent) {
            isSystemReady = true;
            console.log('✅ TIMING FIX: System is ready for lead clicks');

            // Process any queued clicks
            if (clickQueue.length > 0) {
                console.log(`🔄 TIMING FIX: Processing ${clickQueue.length} queued clicks`);
                clickQueue.forEach(queuedClick => {
                    setTimeout(() => queuedClick.callback(queuedClick.leadId), 100);
                });
                clickQueue = [];
            }
            return true;
        }
        return false;
    };

    // Check immediately
    if (checkReady()) return;

    // Check periodically
    const readyInterval = setInterval(() => {
        if (checkReady()) {
            clearInterval(readyInterval);
        }
    }, 100);

    // Force ready after 3 seconds max
    setTimeout(() => {
        if (!isSystemReady) {
            console.warn('⚠️ TIMING FIX: Forcing system ready after 3 second timeout');
            isSystemReady = true;
            clearInterval(readyInterval);
        }
    }, 3000);
}

// Safe viewLead wrapper
function safeViewLead(leadId) {
    // Prevent infinite recursion
    if (isInViewLead) {
        console.warn('⚠️ SAFE VIEWLEAD: Preventing recursion - already in viewLead call');
        return;
    }
    isInViewLead = true;

    try {
        // Only log debug info if debug flag is enabled
        if (SAFE_VIEWLEAD_DEBUG) {
            console.log(`🛡️ SAFE VIEWLEAD: Called with ID=${leadId}, System Ready=${isSystemReady}`);
        }

        // Validate the lead ID
        if (!leadId || leadId === 'undefined' || leadId === 'null') {
            console.error('❌ SAFE VIEWLEAD: Invalid lead ID provided');
            return;
        }

        // Check if this is the problematic default ID
        if (String(leadId) === '8126662') {
            console.warn('⚠️ SAFE VIEWLEAD: Detected hardcoded 8126662 - investigating...');

            // If system isn't ready, this might be a timing issue
            if (!isSystemReady) {
                console.warn('⚠️ SAFE VIEWLEAD: System not ready - queuing click');
                clickQueue.push({ leadId, callback: safeViewLead });
                return;
            }
        }

        if (!isSystemReady) {
            if (SAFE_VIEWLEAD_DEBUG) {
                console.log('⏳ SAFE VIEWLEAD: System not ready - queuing click for', leadId);
            }
            clickQueue.push({ leadId, callback: safeViewLead });
            return;
        }

        // Verify the lead exists in localStorage (only log errors unless debugging)
        try {
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const lead = leads.find(l => String(l.id) === String(leadId));

            if (!lead) {
                console.error(`❌ SAFE VIEWLEAD: Lead ${leadId} not found in localStorage`);
                console.log('Available lead IDs:', leads.map(l => l.id).slice(0, 10));
                return;
            }

            // Only log successful lead finding in debug mode
            if (SAFE_VIEWLEAD_DEBUG) {
                console.log(`✅ SAFE VIEWLEAD: Found lead ${leadId} - ${lead.name}`);
            }
        } catch (error) {
            console.error('❌ SAFE VIEWLEAD: Error accessing localStorage:', error);
            return;
        }

        // Call the actual viewLead function (use original, not window.viewLead to avoid recursion)
        if (window.protectedFunctions && typeof window.protectedFunctions.viewLead === 'function') {
            window.protectedFunctions.viewLead(leadId);
        } else if (typeof originalViewLead === 'function') {
            originalViewLead(leadId);
        } else {
            console.error('❌ SAFE VIEWLEAD: No original viewLead function found');
        }

    } catch (error) {
        console.error('❌ SAFE VIEWLEAD: Error in safeViewLead:', error);
    } finally {
        // Always reset recursion flag
        isInViewLead = false;
    }
}

// Override the global viewLead function with our safe wrapper
window.viewLead = function(leadId) {
    return safeViewLead(leadId);
};

// Start the ready check
waitForSystemReady();

// Also check readiness when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForSystemReady);
}

// Check readiness when window fully loads
window.addEventListener('load', waitForSystemReady);

console.log('✅ TIMING FIX: Fast-click protection active');
console.log('🎯 System will queue clicks until fully ready to prevent wrong lead loading');
console.log('🔇 TIMING FIX: Verbose logging disabled (set SAFE_VIEWLEAD_DEBUG=true to enable)');