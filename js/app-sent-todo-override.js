// APP SENT TODO OVERRIDE - Force empty TODO text for app sent stage
console.log('🚀 APP SENT TODO OVERRIDE - Loading...');

(function() {
    // Store original functions
    let originalGetNextAction = null;

    // Enhanced getNextAction that always returns empty for app sent
    function getNextActionAppSentOverride(stage, lead) {
        console.log(`🔍 TODO OVERRIDE: Stage="${stage}", Lead=${lead?.id || 'unknown'}`);

        // CRITICAL: App sent stage ALWAYS returns empty string
        if (stage === 'app_sent' || stage === 'app sent' || stage === 'App Sent') {
            console.log(`✅ APP SENT DETECTED - returning empty TODO text`);
            return '';
        }

        // For all other stages, use original function if available
        if (originalGetNextAction) {
            const result = originalGetNextAction(stage, lead);
            console.log(`🔄 Using original function for ${stage}: "${result}"`);
            return result;
        }

        // Fallback logic if no original function
        console.log(`⚠️ No original function, using fallback for ${stage}`);
        return 'Review lead';
    }

    // Install override function
    function installTodoOverride() {
        console.log('🔧 INSTALLING APP SENT TODO OVERRIDE...');

        // Override global getNextAction
        if (window.getNextAction) {
            console.log('🔄 Overriding global getNextAction');
            if (!originalGetNextAction) originalGetNextAction = window.getNextAction;
            window.getNextAction = getNextActionAppSentOverride;
            console.log('✅ Global getNextAction overridden for app sent');
        } else {
            console.log('❌ Global getNextAction not found');
        }

        // Make override function globally available
        window.getNextActionAppSentOverride = getNextActionAppSentOverride;

        console.log('📊 TODO OVERRIDE STATUS:');
        console.log('   global getNextAction available:', !!window.getNextAction);
        console.log('   originalGetNextAction stored:', !!originalGetNextAction);
        console.log('   override function set:', window.getNextAction === getNextActionAppSentOverride);
    }

    // More aggressive installation with multiple attempts
    installTodoOverride();
    setTimeout(installTodoOverride, 500);
    setTimeout(installTodoOverride, 1000);
    setTimeout(installTodoOverride, 2000);
    setTimeout(installTodoOverride, 3000);

    // Watch for getNextAction function changes and re-override
    let todoWatcher = setInterval(() => {
        if (window.getNextAction && window.getNextAction !== getNextActionAppSentOverride) {
            console.log('🔄 Detected getNextAction function change, re-installing override...');
            installTodoOverride();
        }
    }, 1000);

    // Also override any table generation that might bypass getNextAction
    function interceptTableGeneration() {
        console.log('🔧 Installing table generation interceptor...');

        // Override common table generation patterns
        const originalQuerySelectorAll = Document.prototype.querySelectorAll;

        // Don't actually override querySelectorAll as it's too broad, instead focus on the specific issue
        // Let's directly modify any TODO cells that show "Review lead" for app sent leads

        setTimeout(() => {
            fixExistingAppSentTodos();
        }, 100);
    }

    // Function to fix existing app sent TODO cells
    function fixExistingAppSentTodos() {
        console.log('🔧 Fixing existing app sent TODO cells...');

        try {
            // Get all leads from localStorage
            let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            if (leads.length === 0) {
                leads = JSON.parse(localStorage.getItem('leads') || '[]');
            }

            // Filter app sent leads
            const appSentLeads = leads.filter(l =>
                l.stage === 'app_sent' ||
                l.stage === 'app sent' ||
                l.stage === 'App Sent'
            );

            console.log(`🔍 Found ${appSentLeads.length} app sent leads to fix`);

            // Find table body
            const tableBody = document.querySelector('#leadsTableBody') || document.querySelector('tbody');
            if (!tableBody) {
                console.log('❌ No table body found');
                return;
            }

            const rows = tableBody.querySelectorAll('tr');

            rows.forEach(row => {
                const checkbox = row.querySelector('.lead-checkbox');
                if (!checkbox) return;

                const leadId = checkbox.value;
                const lead = appSentLeads.find(l => String(l.id) === String(leadId));

                if (lead) {
                    // This is an app sent lead, clear the TODO cell
                    const todoCell = row.querySelectorAll('td')[6]; // TODO column
                    if (todoCell) {
                        const currentText = todoCell.textContent.trim();
                        if (currentText === 'Review lead' || currentText.includes('Review lead')) {
                            console.log(`🔧 Clearing TODO for app sent lead ${leadId}: "${currentText}" -> ""`);
                            todoCell.innerHTML = '<div style="font-weight: bold; color: black;"></div>';
                        }
                    }
                }
            });

        } catch (error) {
            console.error('❌ Error fixing app sent TODOs:', error);
        }
    }

    // Install table interceptor
    interceptTableGeneration();

    // Run fixes periodically to catch any missed updates
    setInterval(fixExistingAppSentTodos, 2000);

    console.log('✅ App sent TODO override installed');

})();

console.log('🎯 APP SENT TODO OVERRIDE - Ready');