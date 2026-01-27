// Aggressive fix for completion timestamp display - runs repeatedly until elements are found
console.log('🚀 FORCE COMPLETION FIX: Loading aggressive completion timestamp fix...');

(function() {
    'use strict';

    // Track which leads we've already fixed to avoid repeated processing
    const fixedLeads = new Set();

    // Function to aggressively find and fix completion timestamps
    function aggressiveCompletionFix() {
        // Get leads from localStorage
        const leadsData = localStorage.getItem('insurance_leads');
        if (!leadsData) return;

        const leads = JSON.parse(leadsData);

        leads.forEach(lead => {
            const leadId = lead.id;

            // Skip if already fixed
            if (fixedLeads.has(leadId)) return;

            // Check if this lead should show completion timestamp
            const hasCompletedTimestamp = lead.reachOut?.completedAt || lead.reachOut?.reachOutCompletedAt;
            const hasEmailConfirmation = lead.reachOut?.emailConfirmed === true;
            const hasCallConnection = lead.reachOut?.callsConnected > 0;
            const hasTextSent = lead.reachOut?.textCount > 0;

            const shouldShowCompletion = hasCompletedTimestamp && (hasEmailConfirmation || hasCallConnection || hasTextSent);

            if (shouldShowCompletion) {
                // Check if elements exist NOW
                const completionDiv = document.getElementById(`reach-out-completion-${leadId}`);
                const timestampSpan = document.getElementById(`completion-timestamp-${leadId}`);
                const countdownSpan = document.getElementById(`highlight-countdown-${leadId}`);
                const todoDiv = document.getElementById(`reach-out-todo-${leadId}`);
                const headerTitle = document.getElementById(`reach-out-header-title-${leadId}`);
                const separator = document.getElementById(`reach-out-separator-${leadId}`);

                if (completionDiv && timestampSpan) {
                    console.log(`🔧 FORCE FIX: Found completion elements for lead ${leadId}, applying fix...`);

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

                    // Set countdown if highlight is active
                    if (countdownSpan && lead.reachOut.greenHighlightUntil) {
                        const highlightEnd = new Date(lead.reachOut.greenHighlightUntil);
                        const now = new Date();

                        if (now < highlightEnd) {
                            const timeLeft = highlightEnd - now;
                            const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                            const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                            if (daysLeft > 0) {
                                countdownSpan.textContent = `Highlight expires in ${daysLeft}d ${hoursLeft}h`;
                            } else {
                                countdownSpan.textContent = `Highlight expires in ${hoursLeft}h`;
                            }
                        } else {
                            countdownSpan.textContent = 'Highlight expired';
                        }
                    }

                    // Show completion div (this is the key step!)
                    completionDiv.style.display = 'block';

                    // Update header to green
                    if (headerTitle) {
                        headerTitle.innerHTML = '<i class="fas fa-tasks"></i> <span style="color: #10b981;">Reach Out</span>';
                    }

                    // Update separator to green
                    if (separator) {
                        separator.style.borderBottom = '2px solid #10b981';
                    }

                    // Update TODO to completed
                    if (todoDiv) {
                        todoDiv.innerHTML = `<span style="color: #10b981; font-weight: bold; font-size: 18px;">COMPLETED</span>`;
                    }

                    // Mark as fixed
                    fixedLeads.add(leadId);
                    console.log(`✅ FORCE FIX: Successfully fixed completion display for lead ${leadId} (${lead.name})`);

                    // Also hide the reach-out checkboxes since it's completed
                    const reachOutSection = document.querySelector(`#reach-out-completion-${leadId}`).closest('.profile-section');
                    if (reachOutSection) {
                        // Change background to light green to indicate completion
                        reachOutSection.style.background = '#f0f9ff'; // Light green
                    }
                }
            }
        });
    }

    // Function to specifically fix lead 131454 immediately
    function forceFixLead131454() {
        const targetLeadId = '131454';
        console.log(`🎯 FORCE FIX: Specifically targeting lead ${targetLeadId}...`);

        // Wait a bit for DOM to be ready, then try multiple times
        const attempts = [100, 500, 1000, 2000, 3000, 5000];

        attempts.forEach(delay => {
            setTimeout(() => {
                const completionDiv = document.getElementById(`reach-out-completion-${targetLeadId}`);

                if (completionDiv && !fixedLeads.has(targetLeadId)) {
                    console.log(`🎯 FORCE FIX: Found elements for ${targetLeadId} at ${delay}ms delay, applying fix...`);

                    // Get lead data
                    const leadsData = localStorage.getItem('insurance_leads');
                    if (leadsData) {
                        const leads = JSON.parse(leadsData);
                        const lead = leads.find(l => l.id === targetLeadId);

                        if (lead && lead.reachOut?.completedAt && lead.reachOut?.emailConfirmed) {
                            // Apply all the fixes
                            const timestampSpan = document.getElementById(`completion-timestamp-${targetLeadId}`);
                            const countdownSpan = document.getElementById(`highlight-countdown-${targetLeadId}`);
                            const todoDiv = document.getElementById(`reach-out-todo-${targetLeadId}`);
                            const headerTitle = document.getElementById(`reach-out-header-title-${targetLeadId}`);
                            const separator = document.getElementById(`reach-out-separator-${targetLeadId}`);

                            if (timestampSpan) {
                                const completedDate = new Date(lead.reachOut.completedAt);
                                timestampSpan.textContent = completedDate.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                });
                            }

                            if (countdownSpan && lead.reachOut.greenHighlightUntil) {
                                const highlightEnd = new Date(lead.reachOut.greenHighlightUntil);
                                const now = new Date();

                                if (now < highlightEnd) {
                                    const timeLeft = highlightEnd - now;
                                    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                                    const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                    countdownSpan.textContent = `Highlight expires in ${daysLeft}d ${hoursLeft}h`;
                                }
                            }

                            // Show completion div - THE MOST IMPORTANT STEP
                            completionDiv.style.display = 'block';

                            if (headerTitle) {
                                headerTitle.innerHTML = '<i class="fas fa-tasks"></i> <span style="color: #10b981;">Reach Out</span>';
                            }

                            if (separator) {
                                separator.style.borderBottom = '2px solid #10b981';
                            }

                            if (todoDiv) {
                                todoDiv.innerHTML = `<span style="color: #10b981; font-weight: bold; font-size: 18px;">COMPLETED</span>`;
                            }

                            // Mark as fixed
                            fixedLeads.add(targetLeadId);
                            console.log(`🎯✅ FORCE FIX: Successfully fixed lead ${targetLeadId} at ${delay}ms!`);

                            // Change section background
                            const reachOutSection = completionDiv.closest('.profile-section');
                            if (reachOutSection) {
                                reachOutSection.style.background = '#f0f9ff';
                            }
                        }
                    }
                }
            }, delay);
        });
    }

    // Start aggressive fixing
    setTimeout(() => {
        console.log('🚀 FORCE COMPLETION FIX: Starting aggressive completion timestamp fixing...');

        // Fix lead 131454 specifically
        forceFixLead131454();

        // General fix for all leads
        aggressiveCompletionFix();

        // Set up continuous checking
        setInterval(aggressiveCompletionFix, 2000);

    }, 500);

    // Expose function for manual use
    window.forceFixLead131454 = forceFixLead131454;
    window.aggressiveCompletionFix = aggressiveCompletionFix;

    console.log('✅ FORCE COMPLETION FIX: Loaded and will start in 500ms');

})();