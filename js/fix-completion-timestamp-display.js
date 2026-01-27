// Fix for completion timestamp not displaying for completed leads with active highlights
console.log('🔧 COMPLETION TIMESTAMP FIX: Loading fix for missing completion timestamps...');

(function() {
    'use strict';

    // Function to check if a lead is completed and should show completion timestamp
    function isLeadCompleted(lead) {
        if (!lead.reachOut) return false;

        // Check if lead has actual completion data
        const hasCompletedTimestamp = lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt;
        const hasEmailConfirmation = lead.reachOut.emailConfirmed === true;
        const hasCallConnection = lead.reachOut.callsConnected > 0;
        const hasTextSent = lead.reachOut.textCount > 0;

        // Lead is completed if it has a completion timestamp AND some actual action was taken
        return hasCompletedTimestamp && (hasEmailConfirmation || hasCallConnection || hasTextSent);
    }

    // Function to ensure completion timestamp is displayed for completed leads
    function ensureCompletionTimestampDisplay(leadId, lead) {
        console.log(`🔍 COMPLETION CHECK: Lead ${leadId} (${lead.name})`);
        console.log(`   - completedAt: ${lead.reachOut?.completedAt}`);
        console.log(`   - emailConfirmed: ${lead.reachOut?.emailConfirmed}`);
        console.log(`   - callsConnected: ${lead.reachOut?.callsConnected}`);
        console.log(`   - textCount: ${lead.reachOut?.textCount}`);
        console.log(`   - greenHighlightUntil: ${lead.reachOut?.greenHighlightUntil}`);

        if (isLeadCompleted(lead)) {
            console.log(`✅ Lead ${leadId} should show completion timestamp`);

            // Find completion div
            const completionDiv = document.getElementById(`reach-out-completion-${leadId}`);
            const timestampSpan = document.getElementById(`completion-timestamp-${leadId}`);
            const countdownSpan = document.getElementById(`highlight-countdown-${leadId}`);

            if (completionDiv && timestampSpan) {
                // Set completion timestamp
                const completedAt = lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt;
                const completedDate = new Date(completedAt);
                timestampSpan.textContent = completedDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });

                // Set highlight countdown if there's an active highlight
                if (countdownSpan && lead.reachOut.greenHighlightUntil) {
                    const highlightEnd = new Date(lead.reachOut.greenHighlightUntil);
                    const now = new Date();

                    if (now < highlightEnd) {
                        // Active highlight - show countdown
                        const timeLeft = highlightEnd - now;
                        const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                        const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                        if (daysLeft > 0) {
                            countdownSpan.textContent = `Highlight expires in ${daysLeft}d ${hoursLeft}h`;
                        } else {
                            countdownSpan.textContent = `Highlight expires in ${hoursLeft}h`;
                        }
                    } else {
                        // Expired highlight
                        countdownSpan.textContent = 'Highlight expired';
                    }
                }

                // Show the completion div
                completionDiv.style.display = 'block';
                console.log(`✅ Completion timestamp displayed for lead ${leadId}`);

                // Also update the header and separator to green
                const headerTitle = document.getElementById(`reach-out-header-title-${leadId}`);
                if (headerTitle) {
                    headerTitle.innerHTML = '<i class="fas fa-tasks"></i> <span style="color: #10b981;">Reach Out</span>';
                }

                const separator = document.getElementById(`reach-out-separator-${leadId}`);
                if (separator) {
                    separator.style.borderBottom = '2px solid #10b981';
                }

                // Update TODO text to show completed
                const todoDiv = document.getElementById(`reach-out-todo-${leadId}`);
                if (todoDiv) {
                    todoDiv.innerHTML = `<span style="color: #10b981; font-weight: bold; font-size: 18px;">COMPLETED</span>`;
                }
            } else {
                console.log(`❌ Could not find completion elements for lead ${leadId}`);
            }
        } else {
            console.log(`🔴 Lead ${leadId} is not completed, completion timestamp should not show`);
        }
    }

    // Function to scan all visible leads and fix missing completion timestamps
    function fixAllCompletionTimestamps() {
        console.log('🔄 Scanning all leads for missing completion timestamps...');

        // Get leads from localStorage
        const leadsData = localStorage.getItem('insurance_leads');
        if (!leadsData) {
            console.log('❌ No leads data found in localStorage');
            return;
        }

        const leads = JSON.parse(leadsData);
        let fixedCount = 0;

        leads.forEach(lead => {
            // Check if this lead has a profile section visible
            const profileSection = document.querySelector(`[id*="${lead.id}"]`);
            if (profileSection) {
                const wasCompleted = isLeadCompleted(lead);
                const completionDiv = document.getElementById(`reach-out-completion-${lead.id}`);
                const isDisplayed = completionDiv && completionDiv.style.display === 'block';

                if (wasCompleted && !isDisplayed) {
                    console.log(`🔧 Fixing missing completion timestamp for lead ${lead.id} (${lead.name})`);
                    ensureCompletionTimestampDisplay(lead.id, lead);
                    fixedCount++;
                }
            }
        });

        console.log(`✅ Fixed ${fixedCount} missing completion timestamps`);
    }

    // Hook into profile creation to ensure completion timestamps are shown
    function hookProfileCreation() {
        // Override the createEnhancedProfile function to ensure completion timestamps are displayed
        const originalCreateProfile = window.protectedFunctions?.createEnhancedProfile;

        if (originalCreateProfile) {
            window.protectedFunctions.createEnhancedProfile = function(lead) {
                console.log(`🔧 COMPLETION FIX: Enhanced profile creation for ${lead.id}`);

                // Call original function
                const result = originalCreateProfile.apply(this, arguments);

                // Add a small delay to ensure DOM is ready, then check completion status
                setTimeout(() => {
                    ensureCompletionTimestampDisplay(lead.id, lead);
                }, 100);

                return result;
            };

            console.log('✅ Hooked into profile creation for completion timestamp fixes');
        }
    }

    // Initialize the fix
    setTimeout(() => {
        hookProfileCreation();
        fixAllCompletionTimestamps();

        // Set up periodic checks for missing completion timestamps
        setInterval(fixAllCompletionTimestamps, 5000);

    }, 1000);

    // Expose function for manual testing
    window.fixCompletionTimestamps = fixAllCompletionTimestamps;
    window.ensureCompletionTimestampDisplay = ensureCompletionTimestampDisplay;

    console.log('✅ COMPLETION TIMESTAMP FIX: Ready');

})();