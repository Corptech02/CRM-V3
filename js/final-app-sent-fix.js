// FINAL APP SENT FIX - Ultimate override for all TODO text generation

(function() {
    // Function to force fix all app sent leads immediately
    function forceFixAppSentLeads() {
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

            if (appSentLeads.length === 0) return;

            // Force fix each app sent lead in the DOM
            appSentLeads.forEach(lead => {
                forceFixSingleAppSentLead(lead.id);
            });

            // After fixing all app sent leads, trigger the highlighting function
            if (appSentLeads.length > 0) {
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
                todoCell.innerHTML = '<div style="font-weight: bold; color: black;"></div>';
            }

            // ALWAYS apply green highlighting for app sent leads (regardless of TODO text)
            row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
            row.style.setProperty('background', 'rgba(16, 185, 129, 0.2)', 'important');
            row.style.setProperty('border-left', '4px solid #10b981', 'important');
            row.style.setProperty('border-right', '2px solid #10b981', 'important');
            row.classList.add('reach-out-complete');
        });

        // After fixing the single lead, ensure highlighting is applied
        setTimeout(() => {
            if (window.applyReachOutCompleteHighlighting) {
                window.applyReachOutCompleteHighlighting();
            }
        }, 50);
    }

    // Override ALL possible getNextAction variations
    function overrideAllGetNextActionFunctions() {

        // SIMPLIFIED: Callback-only TO DO logic
        function ultimateGetNextAction(stage, lead) {
            console.log(`🎯 SIMPLIFIED TODO CHECK: Lead ${lead?.id} - Stage: ${stage}`);

            // Check for overdue scheduled callbacks ONLY
            if (lead && lead.id) {
                const isCallbackOverdue = checkForOverdueCallback(lead.id);
                console.log(`📞 CALLBACK CHECK: Lead ${lead.id} - isOverdue: ${isCallbackOverdue}`);

                if (isCallbackOverdue) {
                    // Create clickable reach out call link for overdue callbacks
                    const phoneNumber = lead?.phone || '';
                    const leadId = lead?.id || '';
                    const clickHandler = `handleReachOutCall('${leadId}', '${phoneNumber}')`;
                    console.log(`🔴 OVERDUE CALLBACK: Showing "Reach out: CALL" for lead ${leadId}`);
                    return `<a href="tel:${phoneNumber}" onclick="${clickHandler}" style="color: #dc2626; font-weight: bold; text-decoration: none; cursor: pointer;">Reach out: CALL</a>`;
                }
            }

            // Standard stage-based actions (no reach-out complexity)
            const actionMap = {
                'new': 'Assign Stage',
                'info_received': 'Prepare Quote',
                'loss_runs_received': 'Prepare app.',
                'app_prepared': 'Email brokers',
                'not-interested': 'Archive lead',
                'closed': 'Process complete'
            };

            const result = actionMap[stage] || '';
            console.log(`📋 STANDARD TODO: Lead ${lead?.id} - Stage: ${stage} → "${result}"`);
            return result;
        }

        // Helper function to check if lead has overdue callbacks
        function checkForOverdueCallback(leadId) {
            try {
                const callbacks = JSON.parse(localStorage.getItem('scheduled_callbacks') || '{}');
                const leadCallbacks = callbacks[leadId] || [];
                const now = new Date();

                // Check if any callback is overdue
                const overdueCallback = leadCallbacks.find(callback => {
                    if (callback.completed) return false; // Skip completed callbacks

                    const callbackDateTime = new Date(`${callback.date}T${callback.time}`);
                    return callbackDateTime < now; // Overdue if callback time has passed
                });

                return !!overdueCallback;
            } catch (error) {
                console.error('❌ Error checking overdue callbacks:', error);
                return false;
            }
        }

        // Override global function
        window.getNextAction = ultimateGetNextAction;

        // Also override any protected functions
        if (window.protectedFunctions) {
            window.protectedFunctions.getNextAction = ultimateGetNextAction;
        }

        // Make it available globally with multiple names
        window.getNextActionFixed = ultimateGetNextAction;
        window.getNextActionAppSentOverride = ultimateGetNextAction;
        window.ultimateGetNextAction = ultimateGetNextAction;
    }

    // Override table generation functions
    function overrideTableGeneration() {

        // If generateSimpleLeadRows exists, enhance it
        if (window.generateSimpleLeadRows) {
            const originalGenerateSimpleLeadRows = window.generateSimpleLeadRows;

            window.generateSimpleLeadRows = function(leads) {
                // Call original function
                const result = originalGenerateSimpleLeadRows(leads);

                // Post-process the result to fix app sent leads
                setTimeout(() => {
                    forceFixAppSentLeads();
                }, 100);

                return result;
            };
        }

        // If displayLeads exists, enhance it
        if (window.displayLeads) {
            const originalDisplayLeads = window.displayLeads;

            window.displayLeads = function() {
                // Call original function
                const result = originalDisplayLeads();

                // Post-process for app sent fixes
                setTimeout(() => {
                    forceFixAppSentLeads();
                }, 100);

                return result;
            };
        }
    }

    // Install all overrides
    function installAllOverrides() {
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

    // Continuous monitoring and fixing (reduced frequency)
    setInterval(forceFixAppSentLeads, 10000);

    // Make functions globally available
    window.forceFixAppSentLeads = forceFixAppSentLeads;
    window.forceFixSingleAppSentLead = forceFixSingleAppSentLead;

})();