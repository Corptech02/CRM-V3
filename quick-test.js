// Quick test to verify highlighting functionality
(function() {
    console.log('🔥 QUICK HIGHLIGHT TEST');

    // Simulate being on leads page
    if (window.location.hash !== '#leads') {
        window.location.hash = '#leads';
        console.log('📍 Set hash to #leads');
    }

    setTimeout(() => {
        // Check if functions exist
        console.log('🔍 Function availability:');
        console.log('  forceAllHighlighting:', typeof window.forceAllHighlighting);
        console.log('  loadLeadsView:', typeof window.loadLeadsView);
        console.log('  forceHighlightNow:', typeof window.forceHighlightNow);

        // Check data
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        console.log('📊 Leads count:', leads.length);

        // Check table
        const table = document.getElementById('leadsTableBody');
        if (table) {
            const rows = table.querySelectorAll('tr');
            console.log('📋 Table rows:', rows.length);

            // Try to call forceAllHighlighting
            if (typeof window.forceAllHighlighting === 'function') {
                console.log('💥 Calling forceAllHighlighting...');
                const result = window.forceAllHighlighting();
                console.log('Result:', result);

                // Check if highlighting was applied
                setTimeout(() => {
                    let yellowCount = 0, orangeCount = 0, redCount = 0, greenCount = 0;
                    rows.forEach((row, idx) => {
                        const style = row.getAttribute('style') || '';
                        if (style.includes('#fef3c7')) {
                            yellowCount++;
                            console.log(`Row ${idx}: YELLOW`);
                        } else if (style.includes('#fed7aa')) {
                            orangeCount++;
                            console.log(`Row ${idx}: ORANGE`);
                        } else if (style.includes('#fecaca')) {
                            redCount++;
                            console.log(`Row ${idx}: RED`);
                        } else if (style.includes('rgba(16, 185, 129')) {
                            greenCount++;
                            console.log(`Row ${idx}: GREEN`);
                        }
                    });

                    console.log(`🎨 Highlighting results: ${yellowCount} yellow, ${orangeCount} orange, ${redCount} red, ${greenCount} green`);

                    if (yellowCount + orangeCount + redCount + greenCount > 0) {
                        console.log('✅ SUCCESS: Highlighting is working!');
                    } else {
                        console.log('❌ FAILED: No highlighting applied');
                    }
                }, 200);
            }
        } else {
            console.log('❌ No table found');
        }
    }, 500);
})();