// Manual Profile Completion Fix - Run this in console to fix open profiles immediately
console.log('🔧 MANUAL PROFILE FIX: Loading immediate fix for profile completion displays...');

window.manualFixProfileCompletion = function(leadId) {
    console.log(`🔧 MANUAL FIX: Starting fix for lead ${leadId || 'ALL'}`);

    if (leadId) {
        // Fix specific lead
        fixSingleLeadProfile(leadId);
    } else {
        // Fix all open profiles
        fixAllOpenProfiles();
    }
};

function fixSingleLeadProfile(leadId) {
    console.log(`🔧 MANUAL FIX: Fixing profile for lead ${leadId}`);

    try {
        // Get lead data
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        const lead = leads.find(l => String(l.id) === String(leadId));

        if (!lead) {
            console.error(`❌ Lead ${leadId} not found`);
            return;
        }

        // Check if should show completion
        const shouldShowCompletion = checkCompletionStatus(lead);

        // Get DOM elements
        const elements = {
            header: document.getElementById(`reach-out-header-title-${leadId}`),
            todo: document.getElementById(`reach-out-todo-${leadId}`),
            completion: document.getElementById(`reach-out-completion-${leadId}`),
            separator: document.getElementById(`reach-out-separator-${leadId}`),
            timestamp: document.getElementById(`completion-timestamp-${leadId}`),
            countdown: document.getElementById(`highlight-countdown-${leadId}`)
        };

        console.log(`🔍 MANUAL FIX: DOM elements for lead ${leadId}:`, {
            header: !!elements.header,
            todo: !!elements.todo,
            completion: !!elements.completion,
            separator: !!elements.separator,
            timestamp: !!elements.timestamp,
            countdown: !!elements.countdown
        });

        if (!elements.header || !elements.todo || !elements.completion) {
            console.error(`❌ Missing DOM elements for lead ${leadId}`);
            return;
        }

        console.log(`🔍 MANUAL FIX: Lead ${leadId} completion check:`, {
            shouldShow: shouldShowCompletion,
            reachOut: lead.reachOut,
            stage: lead.stage
        });

        if (shouldShowCompletion) {
            // SHOW COMPLETION STATUS
            console.log(`✅ MANUAL FIX: Showing completion for lead ${leadId}`);

            // Update header to green
            const headerSpan = elements.header.querySelector('span');
            if (headerSpan) {
                headerSpan.style.color = '#10b981';
                headerSpan.style.fontWeight = 'bold';
            }

            // Update TODO to COMPLETED
            elements.todo.innerHTML = '<span style="color: #10b981; font-weight: bold; font-size: 18px;">COMPLETED</span>';

            // Show completion section
            elements.completion.style.display = 'block';

            // Update separator to green
            if (elements.separator) {
                elements.separator.style.borderBottom = '2px solid #10b981';
            }

            // Update timestamps
            const completionTime = lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt || new Date().toISOString();

            if (elements.timestamp) {
                elements.timestamp.textContent = formatTimestamp(completionTime);
            }

            if (elements.countdown && lead.reachOut.greenHighlightUntil) {
                const timeLeft = getTimeRemaining(lead.reachOut.greenHighlightUntil);
                elements.countdown.textContent = `Highlight expires in: ${timeLeft}`;
            }

            console.log(`✅ MANUAL FIX: Successfully updated completion display for lead ${leadId}`);

        } else {
            // HIDE COMPLETION STATUS
            console.log(`❌ MANUAL FIX: Hiding completion for lead ${leadId} (no valid completion)`);

            // Update header to red
            const headerSpan = elements.header.querySelector('span');
            if (headerSpan) {
                headerSpan.style.color = '#dc2626';
            }

            // Hide completion section
            elements.completion.style.display = 'none';

            // Update separator to orange
            if (elements.separator) {
                elements.separator.style.borderBottom = '2px solid #f59e0b';
            }
        }

    } catch (error) {
        console.error(`❌ MANUAL FIX: Error fixing lead ${leadId}:`, error);
    }
}

function fixAllOpenProfiles() {
    console.log('🔧 MANUAL FIX: Fixing all open profiles...');

    try {
        // Find all profile completion elements in DOM
        const completionElements = document.querySelectorAll('[id^="reach-out-completion-"]');

        console.log(`🔍 MANUAL FIX: Found ${completionElements.length} profile completion elements`);

        completionElements.forEach(element => {
            const leadId = element.id.replace('reach-out-completion-', '');
            if (leadId) {
                console.log(`🔧 MANUAL FIX: Processing lead ${leadId}`);
                fixSingleLeadProfile(leadId);
            }
        });

        console.log(`✅ MANUAL FIX: Processed ${completionElements.length} profiles`);

    } catch (error) {
        console.error('❌ MANUAL FIX: Error fixing all profiles:', error);
    }
}

function checkCompletionStatus(lead) {
    if (!lead || !lead.reachOut) return false;

    // Check multiple completion indicators
    const hasCompletion = lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt;
    const hasEmailConfirmed = lead.reachOut.emailConfirmed === true;
    const hasConnectedCalls = lead.reachOut.callsConnected > 0;
    const hasTexts = lead.reachOut.textCount > 0;
    const hasActiveHighlight = lead.reachOut.greenHighlightUntil;

    const result = hasCompletion || hasEmailConfirmed || hasConnectedCalls || hasTexts || hasActiveHighlight;

    console.log(`🔍 COMPLETION CHECK for lead ${lead.id}:`, {
        hasCompletion,
        hasEmailConfirmed,
        hasConnectedCalls,
        hasTexts,
        hasActiveHighlight,
        result
    });

    return result;
}

function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';

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
        return 'Invalid Date';
    }
}

function getTimeRemaining(greenHighlightUntil) {
    if (!greenHighlightUntil) return '';

    try {
        const now = new Date();
        const expiry = new Date(greenHighlightUntil);
        const diff = expiry - now;

        if (diff <= 0) return 'EXPIRED';

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
        return 'Error';
    }
}

// Auto-fix any profiles currently open
setTimeout(() => {
    fixAllOpenProfiles();
}, 1000);

console.log('✅ MANUAL PROFILE FIX: Ready! Use manualFixProfileCompletion() in console to fix profiles.');
console.log('Usage examples:');
console.log('  manualFixProfileCompletion()        // Fix all open profiles');
console.log('  manualFixProfileCompletion("131451") // Fix specific lead');