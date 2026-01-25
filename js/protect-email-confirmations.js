// PROTECT EMAIL CONFIRMATIONS - Prevent reset after email confirmation completion
console.log('🛡️ PROTECT EMAIL CONFIRMATIONS - Loading...');

(function() {
    // Track leads that have been completed via email confirmation
    let emailConfirmedLeads = new Set();

    // Override the original stage change logic to protect email confirmations
    const originalStageChangeLogic = window.updateStage;

    if (originalStageChangeLogic) {
        window.updateStage = function(leadId, stage) {
            console.log(`🛡️ PROTECTED updateStage called: Lead ${leadId} -> ${stage}`);

            // Check if this lead was recently email confirmed
            if (emailConfirmedLeads.has(String(leadId))) {
                console.log(`🛡️ Lead ${leadId} has recent email confirmation - preserving completion data`);

                // Get current lead data
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

                if (leadIndex !== -1 && leads[leadIndex].reachOut && leads[leadIndex].reachOut.emailConfirmations) {
                    // Store the email confirmation data before stage change
                    const emailConfirmations = [...leads[leadIndex].reachOut.emailConfirmations];
                    const completedAt = leads[leadIndex].reachOut.completedAt;
                    const reachOutCompletedAt = leads[leadIndex].reachOut.reachOutCompletedAt;
                    const greenHighlightUntil = leads[leadIndex].reachOut.greenHighlightUntil;
                    const emailConfirmed = leads[leadIndex].reachOut.emailConfirmed;

                    console.log(`🛡️ Storing email confirmation data before stage change:`);
                    console.log(`   emailConfirmations: ${emailConfirmations.length}`);
                    console.log(`   completedAt: ${completedAt}`);
                    console.log(`   greenHighlightUntil: ${greenHighlightUntil}`);

                    // Call original function
                    const result = originalStageChangeLogic.call(this, leadId, stage);

                    // Restore email confirmation data after stage change
                    setTimeout(() => {
                        const updatedLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                        const updatedLeadIndex = updatedLeads.findIndex(l => String(l.id) === String(leadId));

                        if (updatedLeadIndex !== -1) {
                            console.log(`🛡️ RESTORING email confirmation data for lead ${leadId}`);

                            if (!updatedLeads[updatedLeadIndex].reachOut) {
                                updatedLeads[updatedLeadIndex].reachOut = {};
                            }

                            // Restore all email confirmation related data
                            updatedLeads[updatedLeadIndex].reachOut.emailConfirmations = emailConfirmations;
                            updatedLeads[updatedLeadIndex].reachOut.completedAt = completedAt;
                            updatedLeads[updatedLeadIndex].reachOut.reachOutCompletedAt = reachOutCompletedAt;
                            updatedLeads[updatedLeadIndex].reachOut.greenHighlightUntil = greenHighlightUntil;
                            updatedLeads[updatedLeadIndex].reachOut.emailConfirmed = emailConfirmed;

                            localStorage.setItem('insurance_leads', JSON.stringify(updatedLeads));

                            console.log(`✅ RESTORED email confirmation completion for lead ${leadId}`);

                            // Also update the UI immediately
                            if (window.markReachOutComplete) {
                                window.markReachOutComplete(leadId, completedAt);
                            }
                        }
                    }, 100);

                    return result;
                }
            }

            // Normal stage change for leads without email confirmations
            return originalStageChangeLogic.call(this, leadId, stage);
        };

        console.log('✅ Protected updateStage function with email confirmation preservation');
    }

    // Override handleEmailConfirmation to track email confirmed leads
    const originalHandleEmailConfirmation = window.handleEmailConfirmation;

    if (originalHandleEmailConfirmation) {
        window.handleEmailConfirmation = function(leadId, confirmed) {
            console.log(`🛡️ PROTECTED handleEmailConfirmation: Lead ${leadId} confirmed=${confirmed}`);

            // Add to protection list
            emailConfirmedLeads.add(String(leadId));

            // Set a timer to remove from protection after some time
            setTimeout(() => {
                emailConfirmedLeads.delete(String(leadId));
                console.log(`🛡️ Removed lead ${leadId} from email confirmation protection`);
            }, 10000); // Protect for 10 seconds

            // Call original function
            const result = originalHandleEmailConfirmation.call(this, leadId, confirmed);

            // Additional protection - save the state multiple times
            setTimeout(() => {
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

                if (leadIndex !== -1 && leads[leadIndex].reachOut && confirmed) {
                    console.log(`🛡️ DOUBLE-CHECKING email confirmation preservation for lead ${leadId}`);

                    // Ensure completion is still set
                    if (!leads[leadIndex].reachOut.completedAt) {
                        console.log(`🛡️ FIXING: Email confirmation completion was reset - restoring it`);
                        leads[leadIndex].reachOut.completedAt = new Date().toISOString();
                        leads[leadIndex].reachOut.reachOutCompletedAt = new Date().toISOString();
                    }

                    // Ensure green highlight is still set
                    if (!leads[leadIndex].reachOut.greenHighlightUntil) {
                        console.log(`🛡️ FIXING: Green highlight was reset - restoring it`);
                        const days = confirmed ? 7 : 2;
                        const expiryDate = new Date();
                        expiryDate.setDate(expiryDate.getDate() + days);
                        leads[leadIndex].reachOut.greenHighlightUntil = expiryDate.toISOString();
                    }

                    localStorage.setItem('insurance_leads', JSON.stringify(leads));
                }
            }, 500);

            return result;
        };

        console.log('✅ Protected handleEmailConfirmation with persistence checks');
    }

    // Additional protection - monitor localStorage changes and restore email confirmations
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        if (key === 'insurance_leads') {
            try {
                const newLeads = JSON.parse(value);
                let modified = false;

                newLeads.forEach((lead, index) => {
                    if (emailConfirmedLeads.has(String(lead.id))) {
                        // Check if email confirmation data was lost
                        if (lead.reachOut && lead.reachOut.emailConfirmations && lead.reachOut.emailConfirmations.length > 0) {
                            const hasConfirmation = lead.reachOut.emailConfirmations.some(conf => conf.confirmed === true);

                            if (hasConfirmation && !lead.reachOut.completedAt) {
                                console.log(`🛡️ INTERCEPTED: localStorage write would lose email confirmation for lead ${lead.id} - fixing it`);
                                lead.reachOut.completedAt = new Date().toISOString();
                                lead.reachOut.reachOutCompletedAt = new Date().toISOString();
                                modified = true;
                            }
                        }
                    }
                });

                if (modified) {
                    console.log('🛡️ Modified localStorage write to preserve email confirmations');
                    value = JSON.stringify(newLeads);
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }

        return originalSetItem.call(this, key, value);
    };

    console.log('✅ Protected localStorage writes to preserve email confirmations');

    // Make protection functions available globally for debugging
    window.emailConfirmedLeads = emailConfirmedLeads;

    console.log('🛡️ Email confirmation protection system loaded');

})();

console.log('🛡️ PROTECT EMAIL CONFIRMATIONS - Ready');