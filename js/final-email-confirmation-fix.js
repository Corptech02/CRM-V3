// FINAL EMAIL CONFIRMATION FIX - Complete solution for email confirmation persistence
console.log('🛡️ FINAL EMAIL CONFIRMATION FIX - Loading comprehensive protection...');

(function() {
    // Track leads with email confirmations that should remain completed
    let emailConfirmedLeads = new Map(); // leadId -> { completedAt, greenHighlightUntil, emailConfirmations }

    // Override createEnhancedProfile to preserve email confirmation state
    const originalCreateEnhancedProfile = window.createEnhancedProfile;

    if (originalCreateEnhancedProfile) {
        window.createEnhancedProfile = function(lead) {
            console.log(`🛡️ PROTECTED createEnhancedProfile called for lead ${lead?.id}`);

            // Check if this lead has email confirmations that should be preserved
            if (lead && emailConfirmedLeads.has(String(lead.id))) {
                const preservedData = emailConfirmedLeads.get(String(lead.id));
                console.log(`🛡️ Restoring email confirmation data for lead ${lead.id}:`, preservedData);

                // Ensure reach-out object exists
                if (!lead.reachOut) {
                    lead.reachOut = {};
                }

                // Restore completion and highlight data
                lead.reachOut.completedAt = preservedData.completedAt;
                lead.reachOut.reachOutCompletedAt = preservedData.completedAt;
                lead.reachOut.greenHighlightUntil = preservedData.greenHighlightUntil;
                lead.reachOut.emailConfirmations = preservedData.emailConfirmations;
                lead.reachOut.emailConfirmed = true;

                console.log(`✅ Email confirmation data restored for lead ${lead.id}`);
            }

            return originalCreateEnhancedProfile.call(this, lead);
        };
        console.log('✅ Protected createEnhancedProfile function');
    }

    // Override handleEmailConfirmation to track completed leads
    const originalHandleEmailConfirmation = window.handleEmailConfirmation;

    if (originalHandleEmailConfirmation) {
        window.handleEmailConfirmation = function(leadId, confirmed) {
            console.log(`🛡️ EMAIL CONFIRMATION: Lead ${leadId}, confirmed: ${confirmed}`);

            // Call original function
            const result = originalHandleEmailConfirmation.call(this, leadId, confirmed);

            // Store the completion data for protection
            if (confirmed) {
                const days = 7;
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + days);

                const emailConfirmation = {
                    timestamp: new Date().toISOString(),
                    confirmed: confirmed,
                    notes: `Email confirmation - Lead confirmed receiving email`
                };

                emailConfirmedLeads.set(String(leadId), {
                    completedAt: new Date().toISOString(),
                    greenHighlightUntil: expiryDate.toISOString(),
                    emailConfirmations: [emailConfirmation]
                });

                console.log(`🛡️ Stored protection data for lead ${leadId}`);

                // Set expiration for protection (protect for 24 hours)
                setTimeout(() => {
                    emailConfirmedLeads.delete(String(leadId));
                    console.log(`🛡️ Removed protection for lead ${leadId} after 24 hours`);
                }, 24 * 60 * 60 * 1000);
            }

            return result;
        };
        console.log('✅ Enhanced handleEmailConfirmation with protection tracking');
    }

    // Override displayLeads to preserve email confirmations
    const originalDisplayLeads = window.displayLeads;

    if (originalDisplayLeads) {
        window.displayLeads = function() {
            console.log('🛡️ PROTECTED displayLeads called');

            // Before calling displayLeads, ensure protected leads have their data
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            let dataModified = false;

            leads.forEach((lead, index) => {
                if (emailConfirmedLeads.has(String(lead.id))) {
                    const preservedData = emailConfirmedLeads.get(String(lead.id));

                    // Ensure reach-out completion is preserved
                    if (!lead.reachOut) lead.reachOut = {};

                    if (!lead.reachOut.completedAt || !lead.reachOut.emailConfirmations) {
                        console.log(`🛡️ Restoring completion data for lead ${lead.id} before displayLeads`);
                        lead.reachOut.completedAt = preservedData.completedAt;
                        lead.reachOut.reachOutCompletedAt = preservedData.completedAt;
                        lead.reachOut.greenHighlightUntil = preservedData.greenHighlightUntil;
                        lead.reachOut.emailConfirmations = preservedData.emailConfirmations;
                        lead.reachOut.emailConfirmed = true;
                        dataModified = true;
                    }
                }
            });

            if (dataModified) {
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                console.log('🛡️ Updated localStorage before displayLeads to preserve email confirmations');
            }

            return originalDisplayLeads.call(this);
        };
        console.log('✅ Protected displayLeads function');
    }

    // Override loadLeadsView to preserve email confirmations
    const originalLoadLeadsView = window.loadLeadsView;

    if (originalLoadLeadsView) {
        window.loadLeadsView = function() {
            console.log('🛡️ PROTECTED loadLeadsView called');

            // Similar protection as displayLeads
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            let dataModified = false;

            leads.forEach((lead, index) => {
                if (emailConfirmedLeads.has(String(lead.id))) {
                    const preservedData = emailConfirmedLeads.get(String(lead.id));

                    if (!lead.reachOut) lead.reachOut = {};

                    if (!lead.reachOut.completedAt || !lead.reachOut.emailConfirmations) {
                        console.log(`🛡️ Restoring completion data for lead ${lead.id} before loadLeadsView`);
                        lead.reachOut.completedAt = preservedData.completedAt;
                        lead.reachOut.reachOutCompletedAt = preservedData.completedAt;
                        lead.reachOut.greenHighlightUntil = preservedData.greenHighlightUntil;
                        lead.reachOut.emailConfirmations = preservedData.emailConfirmations;
                        lead.reachOut.emailConfirmed = true;
                        dataModified = true;
                    }
                }
            });

            if (dataModified) {
                localStorage.setItem('insurance_leads', JSON.stringify(leads));
                console.log('🛡️ Updated localStorage before loadLeadsView to preserve email confirmations');
            }

            return originalLoadLeadsView.call(this);
        };
        console.log('✅ Protected loadLeadsView function');
    }

    // Additional protection: Monitor for any profile refresh and preserve completion
    let profileRefreshMonitor = setInterval(() => {
        const currentProfileModal = document.querySelector('.lead-profile-modal');
        if (currentProfileModal && currentProfileModal.style.display !== 'none') {
            const leadId = currentProfileModal.getAttribute('data-lead-id');

            if (leadId && emailConfirmedLeads.has(String(leadId))) {
                // Check if completion status was lost in the profile
                const todoDiv = document.getElementById(`reach-out-todo-${leadId}`);
                if (todoDiv && !todoDiv.innerHTML.includes('COMPLETED')) {
                    console.log(`🛡️ PROFILE COMPLETION LOST - Restoring for lead ${leadId}`);

                    // Restore completion UI in profile
                    todoDiv.innerHTML = `<span style="color: #10b981; font-weight: bold; font-size: 18px;">COMPLETED</span>`;

                    // Also update header title
                    const headerTitle = document.getElementById(`reach-out-header-title-${leadId}`);
                    if (headerTitle) {
                        headerTitle.innerHTML = '<i class="fas fa-tasks"></i> <span style="color: #10b981;">Reach Out</span>';
                    }

                    console.log(`✅ Profile completion UI restored for lead ${leadId}`);
                }
            }
        }
    }, 1000);

    // Stop monitoring after 10 minutes
    setTimeout(() => {
        clearInterval(profileRefreshMonitor);
        console.log('🛡️ Stopped profile refresh monitoring after 10 minutes');
    }, 10 * 60 * 1000);

    // Make debugging functions available
    window.emailConfirmedLeadsDebug = emailConfirmedLeads;

    console.log('🛡️ FINAL EMAIL CONFIRMATION FIX - Complete protection system loaded');

})();

console.log('🛡️ FINAL EMAIL CONFIRMATION FIX - Ready');