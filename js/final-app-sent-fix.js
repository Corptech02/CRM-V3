// FINAL APP SENT FIX - Ultimate override for all TODO text generation
console.log('🚨 FINAL APP SENT FIX - Loading ultimate override...');

(function() {
    // Function to force fix all app sent leads immediately
    function forceFixAppSentLeads() {
        console.log('🚨 FORCE FIXING ALL APP SENT LEADS...');

        try {
            // Get all leads
            let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            if (leads.length === 0) {
                leads = JSON.parse(localStorage.getItem('leads') || '[]');
            }

            // Find app sent leads
            const appSentLeads = leads.filter(l =>
                l.stage === 'app_sent' ||
                l.stage === 'app sent' ||
                l.stage === 'App Sent'
            );

            console.log(`🔍 Found ${appSentLeads.length} app sent leads`);

            if (appSentLeads.length === 0) {
                console.log('❌ No app sent leads found to fix');
                return;
            }

            // Force fix each app sent lead in the DOM
            appSentLeads.forEach(lead => {
                console.log(`🔧 Force fixing app sent lead: ${lead.name} (ID: ${lead.id})`);
                forceFixSingleAppSentLead(lead.id);
            });

            // After fixing all app sent leads, trigger the highlighting function
            if (appSentLeads.length > 0) {
                console.log('🔄 Triggering highlighting refresh after app sent fixes...');
                setTimeout(() => {
                    if (window.applyReachOutCompleteHighlighting) {
                        window.applyReachOutCompleteHighlighting();
                    }
                }, 100);
            }

        } catch (error) {
            console.error('❌ Error in force fix:', error);
        }
    }

    // Function to force fix a single app sent lead
    function forceFixSingleAppSentLead(leadId) {
        const tableBody = document.querySelector('#leadsTableBody') || document.querySelector('tbody');
        if (!tableBody) return;

        const rows = tableBody.querySelectorAll('tr');

        rows.forEach(row => {
            const checkbox = row.querySelector('.lead-checkbox');
            if (!checkbox || String(checkbox.value) !== String(leadId)) return;

            // This is the app sent lead row
            const todoCell = row.querySelectorAll('td')[6]; // TODO column is usually 7th column (index 6)
            if (!todoCell) return;

            const currentText = todoCell.textContent.trim();
            const currentHTML = todoCell.innerHTML;

            // If it shows any text, clear it and apply green highlighting
            if (currentText && currentText !== '') {
                console.log(`🔧 CLEARING TODO for app sent lead ${leadId}: "${currentText}" -> EMPTY`);
                todoCell.innerHTML = '<div style="font-weight: bold; color: black;"></div>';
            }

            // ALWAYS apply green highlighting for app sent leads (regardless of TODO text)
            console.log(`🟢 APPLYING GREEN HIGHLIGHT for app sent lead ${leadId}`);
            row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
            row.style.setProperty('background', 'rgba(16, 185, 129, 0.2)', 'important');
            row.style.setProperty('border-left', '4px solid #10b981', 'important');
            row.style.setProperty('border-right', '2px solid #10b981', 'important');
            row.classList.add('reach-out-complete');

            console.log(`✅ Fixed app sent lead ${leadId} - cleared TODO and applied green highlighting`);
        });

        // After fixing the single lead, ensure highlighting is applied
        setTimeout(() => {
            if (window.applyReachOutCompleteHighlighting) {
                console.log('🔄 Re-applying highlighting after single lead fix...');
                window.applyReachOutCompleteHighlighting();
            }
        }, 50);
    }

    // Override ALL possible getNextAction variations
    function overrideAllGetNextActionFunctions() {
        console.log('🔧 OVERRIDING ALL GET NEXT ACTION FUNCTIONS...');

        // Create the ultimate override function
        function ultimateGetNextAction(stage, lead) {
            // ABSOLUTE: App sent always returns empty
            if (stage === 'app_sent' || stage === 'app sent' || stage === 'App Sent') {
                console.log(`✅ ULTIMATE OVERRIDE: App sent stage detected - returning EMPTY`);
                return '';
            }

            // For other stages, use fallback logic
            const stagesRequiringReachOut = ['quoted', 'info_requested', 'quote_sent', 'quote-sent-unaware', 'quote-sent-aware', 'interested'];

            if (stagesRequiringReachOut.includes(stage)) {
                // Check if has active highlight
                if (lead && lead.reachOut && (lead.reachOut.completedAt || lead.reachOut.reachOutCompletedAt)) {
                    const hasActiveHighlight = (() => {
                        let highlightExpiry = null;
                        if (lead.reachOut.greenHighlightUntil) {
                            highlightExpiry = new Date(lead.reachOut.greenHighlightUntil);
                        } else if (lead.greenHighlight?.expiresAt) {
                            highlightExpiry = new Date(lead.greenHighlight.expiresAt);
                        } else if (lead.greenUntil) {
                            highlightExpiry = new Date(lead.greenUntil);
                        }
                        return highlightExpiry ? new Date() < highlightExpiry : false;
                    })();

                    if (hasActiveHighlight) {
                        return '';
                    } else {
                        return '<span style="color: #dc2626; font-weight: bold;">Reach out</span>';
                    }
                } else {
                    return '<span style="color: #dc2626; font-weight: bold;">Reach out</span>';
                }
            }

            // Default fallback
            const actionMap = {
                'new': 'Assign Stage',
                'contact_attempted': '<span style="color: #dc2626; font-weight: bold;">Reach out</span>',
                'info_received': 'Prepare Quote',
                'loss_runs_requested': '<span style="color: #dc2626; font-weight: bold;">Reach out</span>',
                'not-interested': 'Archive lead',
                'closed': 'Process complete'
            };
            return actionMap[stage] || 'Review lead';
        }

        // Override global function
        window.getNextAction = ultimateGetNextAction;
        console.log('✅ Global getNextAction overridden with ultimate function');

        // Also override any protected functions
        if (window.protectedFunctions) {
            window.protectedFunctions.getNextAction = ultimateGetNextAction;
            console.log('✅ protectedFunctions.getNextAction overridden');
        }

        // Make it available globally with multiple names
        window.getNextActionFixed = ultimateGetNextAction;
        window.getNextActionAppSentOverride = ultimateGetNextAction;
        window.ultimateGetNextAction = ultimateGetNextAction;
    }

    // Override table generation functions
    function overrideTableGeneration() {
        console.log('🔧 OVERRIDING TABLE GENERATION...');

        // If generateSimpleLeadRows exists, enhance it
        if (window.generateSimpleLeadRows) {
            const originalGenerateSimpleLeadRows = window.generateSimpleLeadRows;

            window.generateSimpleLeadRows = function(leads) {
                console.log('🔧 ENHANCED generateSimpleLeadRows called');

                // Call original function
                const result = originalGenerateSimpleLeadRows(leads);

                // Post-process the result to fix app sent leads
                setTimeout(() => {
                    console.log('🔧 Post-processing table for app sent fixes...');
                    forceFixAppSentLeads();
                }, 100);

                return result;
            };

            console.log('✅ Enhanced generateSimpleLeadRows with app sent fixes');
        }

        // If displayLeads exists, enhance it
        if (window.displayLeads) {
            const originalDisplayLeads = window.displayLeads;

            window.displayLeads = function() {
                console.log('🔧 ENHANCED displayLeads called');

                // Call original function
                const result = originalDisplayLeads();

                // Post-process for app sent fixes
                setTimeout(() => {
                    console.log('🔧 Post-processing displayLeads for app sent fixes...');
                    forceFixAppSentLeads();
                }, 100);

                return result;
            };

            console.log('✅ Enhanced displayLeads with app sent fixes');
        }
    }

    // Install all overrides
    function installAllOverrides() {
        console.log('🚨 INSTALLING ALL APP SENT OVERRIDES...');

        overrideAllGetNextActionFunctions();
        overrideTableGeneration();

        // Force fix immediately
        setTimeout(forceFixAppSentLeads, 100);
        setTimeout(forceFixAppSentLeads, 500);
        setTimeout(forceFixAppSentLeads, 1000);
        setTimeout(forceFixAppSentLeads, 2000);
    }

    // Install immediately and repeatedly
    installAllOverrides();
    setTimeout(installAllOverrides, 1000);
    setTimeout(installAllOverrides, 3000);

    // Continuous monitoring and fixing
    setInterval(forceFixAppSentLeads, 3000);

    // Make functions globally available
    window.forceFixAppSentLeads = forceFixAppSentLeads;
    window.forceFixSingleAppSentLead = forceFixSingleAppSentLead;

    console.log('✅ FINAL APP SENT FIX - All overrides installed');

})();

console.log('🎯 FINAL APP SENT FIX - Ultimate override ready');