// FIX FIRST TABLE TEMPLATE - Ensure first loading template has correct highlighting
console.log('🔧 FIX FIRST TABLE TEMPLATE - Loading...');

(function() {
    // Override the generateSimpleLeadRows function to apply green highlighting correctly
    function enhanceGenerateSimpleLeadRows() {
        if (window.generateSimpleLeadRows) {
            const originalFunction = window.generateSimpleLeadRows;

            window.generateSimpleLeadRows = function(leads) {
                console.log('🔧 ENHANCED generateSimpleLeadRows: Processing leads with green highlighting logic');

                // Call original function to get the HTML
                let htmlResult = originalFunction.call(this, leads);

                // Post-process the HTML to ensure proper styling for empty TODO cells
                setTimeout(() => {
                    console.log('🔄 Post-processing table for green highlighting...');

                    // Force apply highlighting logic after table is rendered
                    if (window.applyReachOutCompleteHighlighting) {
                        window.applyReachOutCompleteHighlighting();
                    }

                    // Also force fix app sent leads specifically
                    if (window.forceFixAppSentLeads) {
                        window.forceFixAppSentLeads();
                    }

                }, 100);

                return htmlResult;
            };

            console.log('✅ Enhanced generateSimpleLeadRows with green highlighting');
        }
    }

    // Override displayLeads function if it exists
    function enhanceDisplayLeads() {
        if (window.displayLeads) {
            const originalDisplayLeads = window.displayLeads;

            window.displayLeads = function() {
                console.log('🔧 ENHANCED displayLeads: Ensuring green highlighting');

                // Call original function
                const result = originalDisplayLeads.call(this);

                // Apply highlighting after display
                setTimeout(() => {
                    console.log('🔄 Applying highlighting after displayLeads...');

                    if (window.applyReachOutCompleteHighlighting) {
                        window.applyReachOutCompleteHighlighting();
                    }

                    if (window.forceFixAppSentLeads) {
                        window.forceFixAppSentLeads();
                    }

                }, 100);

                return result;
            };

            console.log('✅ Enhanced displayLeads with green highlighting');
        }
    }

    // Force highlighting application function
    function forceApplyCorrectHighlighting() {
        console.log('🔧 FORCE APPLYING CORRECT HIGHLIGHTING...');

        try {
            const tableBody = document.querySelector('#leadsTableBody') || document.querySelector('tbody');
            if (!tableBody) {
                console.log('❌ No table body found');
                return;
            }

            const rows = tableBody.querySelectorAll('tr');
            console.log(`🔍 Checking ${rows.length} rows for highlighting`);

            let fixedCount = 0;

            rows.forEach(row => {
                const todoCell = row.querySelectorAll('td')[6]; // TODO column
                if (!todoCell) return;

                const todoText = todoCell.textContent.trim();
                const isEmpty = todoText === '' || todoText.length === 0;

                if (isEmpty) {
                    // Empty TODO should ALWAYS have green highlighting
                    const hasGreenBg = row.style.backgroundColor.includes('185, 129') ||
                                      row.classList.contains('reach-out-complete');

                    if (!hasGreenBg) {
                        console.log(`🔧 Fixing empty TODO without green highlighting`);
                        row.style.setProperty('background-color', 'rgba(16, 185, 129, 0.2)', 'important');
                        row.style.setProperty('background', 'rgba(16, 185, 129, 0.2)', 'important');
                        row.style.setProperty('border-left', '4px solid #10b981', 'important');
                        row.style.setProperty('border-right', '2px solid #10b981', 'important');
                        row.classList.add('reach-out-complete');
                        fixedCount++;
                    }
                }
            });

            if (fixedCount > 0) {
                console.log(`✅ Fixed ${fixedCount} rows with missing green highlighting`);
            }

        } catch (error) {
            console.error('❌ Error in force highlighting:', error);
        }
    }

    // Install enhancements immediately and on intervals
    function installEnhancements() {
        enhanceGenerateSimpleLeadRows();
        enhanceDisplayLeads();

        // Force highlighting application
        setTimeout(forceApplyCorrectHighlighting, 200);
        setTimeout(forceApplyCorrectHighlighting, 1000);
        setTimeout(forceApplyCorrectHighlighting, 3000);
    }

    // Run enhancements
    installEnhancements();

    // Re-run enhancements after delays to catch late-loading functions
    setTimeout(installEnhancements, 1000);
    setTimeout(installEnhancements, 3000);

    // Continuous monitoring
    setInterval(forceApplyCorrectHighlighting, 5000);

    // Make functions available globally
    window.forceApplyCorrectHighlighting = forceApplyCorrectHighlighting;

    console.log('✅ First table template fix loaded');

})();

console.log('🎯 FIX FIRST TABLE TEMPLATE - Ready');