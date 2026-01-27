// Fix Profile Modal Completion Display for All Leads
console.log('🔧 PROFILE COMPLETION DISPLAY FIX: Loading comprehensive fix for all leads with highlight durations...');

// Function to check if a lead should show completion status
function shouldShowCompletionStatus(lead) {
    if (!lead || !lead.reachOut) return false;

    // Check for any completion indicators
    const hasCompletion = lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt;
    const hasEmailConfirmed = lead.reachOut.emailConfirmed === true;
    const hasConnectedCalls = lead.reachOut.callsConnected > 0;
    const hasTexts = lead.reachOut.textCount > 0;
    const hasActiveHighlight = lead.reachOut.greenHighlightUntil;

    // Lead should show completion if it has any of these
    return hasCompletion || hasEmailConfirmed || hasConnectedCalls || hasTexts || hasActiveHighlight;
}

// Function to check if highlight is still active
function isHighlightActive(greenHighlightUntil) {
    if (!greenHighlightUntil) return false;

    try {
        const now = new Date();
        const expiry = new Date(greenHighlightUntil);
        return now < expiry;
    } catch (e) {
        console.warn('Invalid greenHighlightUntil date:', greenHighlightUntil);
        return false;
    }
}

// Function to format time remaining
function formatTimeRemaining(greenHighlightUntil) {
    if (!greenHighlightUntil) return '';

    try {
        const now = new Date();
        const expiry = new Date(greenHighlightUntil);
        const diff = expiry - now;

        if (diff <= 0) return 'Expired';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    } catch (e) {
        console.warn('Error calculating time remaining:', e);
        return '';
    }
}

// Function to format completion timestamp
function formatCompletionTimestamp(timestamp) {
    if (!timestamp) return '';

    try {
        const date = new Date(timestamp);
        const options = {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        return date.toLocaleDateString('en-US', options);
    } catch (e) {
        console.warn('Error formatting timestamp:', timestamp, e);
        return 'Invalid Date';
    }
}

// Main function to update profile completion display
function updateProfileCompletionDisplay(leadId) {
    console.log(`🔧 PROFILE FIX: Updating completion display for lead ${leadId}`);

    try {
        // Get lead data
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const lead = leads.find(l => String(l.id) === String(leadId));

        if (!lead) {
            console.warn(`⚠️ Lead ${leadId} not found in localStorage`);
            return;
        }

        console.log(`🔍 PROFILE FIX: Lead ${leadId} data:`, {
            name: lead.name,
            stage: lead.stage,
            reachOut: lead.reachOut
        });

        // Check if lead should show completion
        const showCompletion = shouldShowCompletionStatus(lead);

        // Get DOM elements
        const headerTitle = document.getElementById(`reach-out-header-title-${leadId}`);
        const todoDiv = document.getElementById(`reach-out-todo-${leadId}`);
        const completionDiv = document.getElementById(`reach-out-completion-${leadId}`);
        const separatorDiv = document.getElementById(`reach-out-separator-${leadId}`);
        const timestampSpan = document.getElementById(`completion-timestamp-${leadId}`);
        const countdownSpan = document.getElementById(`highlight-countdown-${leadId}`);

        if (!headerTitle || !todoDiv || !completionDiv) {
            console.warn(`⚠️ PROFILE FIX: Missing DOM elements for lead ${leadId}`);
            return;
        }

        if (showCompletion) {
            console.log(`✅ PROFILE FIX: Lead ${leadId} should show completion status`);

            // Update header to green "Reach Out"
            const reachOutSpan = headerTitle.querySelector('span');
            if (reachOutSpan) {
                reachOutSpan.style.color = '#10b981';
                reachOutSpan.textContent = 'Reach Out';
            }

            // Update TODO to show COMPLETED
            todoDiv.innerHTML = '<span style="color: #10b981; font-weight: bold; font-size: 18px;">COMPLETED</span>';

            // Show completion timestamp section
            completionDiv.style.display = 'block';

            // Update separator to green
            if (separatorDiv) {
                separatorDiv.style.borderBottom = '2px solid #10b981';
            }

            // Get the most recent completion timestamp
            const completionTime = lead.reachOut.completedAt ||
                                 lead.reachOut.reachOutCompletedAt ||
                                 new Date().toISOString();

            // Update completion timestamp
            if (timestampSpan) {
                timestampSpan.textContent = formatCompletionTimestamp(completionTime);
            }

            // Update countdown if highlight is active
            if (countdownSpan && lead.reachOut.greenHighlightUntil) {
                const isActive = isHighlightActive(lead.reachOut.greenHighlightUntil);
                if (isActive) {
                    const timeRemaining = formatTimeRemaining(lead.reachOut.greenHighlightUntil);
                    countdownSpan.textContent = `Highlight expires in: ${timeRemaining}`;
                } else {
                    countdownSpan.textContent = 'Highlight expired';
                }
            }

            console.log(`✅ PROFILE FIX: Updated completion display for lead ${leadId}`);

        } else {
            console.log(`❌ PROFILE FIX: Lead ${leadId} should NOT show completion (keeping default red state)`);

            // Keep default red state
            const reachOutSpan = headerTitle.querySelector('span');
            if (reachOutSpan) {
                reachOutSpan.style.color = '#dc2626';
                reachOutSpan.textContent = 'Reach Out';
            }

            // Hide completion section
            completionDiv.style.display = 'none';

            // Update separator to orange
            if (separatorDiv) {
                separatorDiv.style.borderBottom = '2px solid #f59e0b';
            }
        }

    } catch (error) {
        console.error(`❌ PROFILE FIX: Error updating lead ${leadId}:`, error);
    }
}

// Function to fix all leads when profile modal opens
function fixAllProfileCompletionDisplays() {
    console.log('🔧 PROFILE FIX: Checking all profile modals for completion display issues...');

    try {
        // Find all reach-out completion elements currently in DOM
        const completionElements = document.querySelectorAll('[id^="reach-out-completion-"]');

        completionElements.forEach(element => {
            const leadId = element.id.replace('reach-out-completion-', '');
            if (leadId) {
                updateProfileCompletionDisplay(leadId);
            }
        });

        console.log(`✅ PROFILE FIX: Processed ${completionElements.length} profile completion displays`);

    } catch (error) {
        console.error('❌ PROFILE FIX: Error fixing completion displays:', error);
    }
}

// Hook into profile opening events
if (window.createEnhancedProfile) {
    const originalCreateEnhancedProfile = window.createEnhancedProfile;

    window.createEnhancedProfile = function(lead) {
        console.log(`🔧 PROFILE FIX: Intercepting profile creation for lead ${lead.id}`);

        // Call original function
        const result = originalCreateEnhancedProfile.apply(this, arguments);

        // Fix completion display after a short delay to ensure DOM is ready
        setTimeout(() => {
            updateProfileCompletionDisplay(lead.id);
        }, 100);

        return result;
    };

    console.log('✅ PROFILE FIX: Hooked into createEnhancedProfile function');
}

// Also hook into any profile update functions
if (window.updateReachOut) {
    const originalUpdateReachOut = window.updateReachOut;

    window.updateReachOut = function(leadId, type, value) {
        console.log(`🔧 PROFILE FIX: Intercepting reachOut update for lead ${leadId}`);

        // Call original function
        const result = originalUpdateReachOut.apply(this, arguments);

        // Fix completion display after update
        setTimeout(() => {
            updateProfileCompletionDisplay(leadId);
        }, 200);

        return result;
    };

    console.log('✅ PROFILE FIX: Hooked into updateReachOut function');
}

// Periodic check for profile modals that need fixing
setInterval(() => {
    const profileModal = document.getElementById('lead-profile-container');
    if (profileModal && profileModal.style.display !== 'none') {
        fixAllProfileCompletionDisplays();
    }
}, 2000); // Check every 2 seconds when profile is open

// Manual fix function for immediate use
window.fixProfileCompletionDisplay = function(leadId) {
    if (leadId) {
        updateProfileCompletionDisplay(leadId);
    } else {
        fixAllProfileCompletionDisplays();
    }
};

// Auto-fix when script loads if profile is already open
setTimeout(() => {
    fixAllProfileCompletionDisplays();
}, 500);

console.log('✅ PROFILE COMPLETION DISPLAY FIX: Comprehensive fix loaded successfully');