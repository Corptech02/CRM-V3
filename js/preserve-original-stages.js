// PRESERVE the ORIGINAL stage display - don't replace it!
(function() {
    'use strict';

    console.log('🛡️ PRESERVING original stage display...');

    // Wait for app.js to load and capture the ORIGINAL functions
    let originalGetStageHtml = null;
    let originalGenerateRows = null;
    let captureAttempts = 0;

    const captureOriginals = setInterval(() => {
        captureAttempts++;

        // Capture the ORIGINAL functions from app.js
        if (window.getStageHtml && !originalGetStageHtml) {
            originalGetStageHtml = window.getStageHtml;
            console.log('✅ Captured ORIGINAL getStageHtml');
        }

        if (window.generateSimpleLeadRows && !originalGenerateRows) {
            // Only capture if it uses getStageHtml (the correct one)
            const funcString = window.generateSimpleLeadRows.toString();
            if (funcString.includes('getStageHtml')) {
                originalGenerateRows = window.generateSimpleLeadRows;
                console.log('✅ Captured ORIGINAL generateSimpleLeadRows');
            }
        }

        // Once we have both, start protecting them
        if (originalGetStageHtml && originalGenerateRows) {
            clearInterval(captureOriginals);
            protectOriginals();
        }

        // Stop trying after 2 seconds
        if (captureAttempts > 40) {
            clearInterval(captureOriginals);
            console.log('⚠️ Could not capture originals, using current versions');
            if (window.getStageHtml) originalGetStageHtml = window.getStageHtml;
            if (window.generateSimpleLeadRows) originalGenerateRows = window.generateSimpleLeadRows;
            protectOriginals();
        }
    }, 50);

    function protectOriginals() {
        console.log('🛡️ Protecting original functions...');

        // Monitor and restore if anything tries to override
        setInterval(() => {
            // If getStageHtml gets overridden, restore the ORIGINAL
            if (originalGetStageHtml && window.getStageHtml !== originalGetStageHtml) {
                const overrideFunc = window.getStageHtml.toString();

                // Only restore if the override is one of our "fixes" (not another original)
                if (overrideFunc.includes('stage-default') ||
                    overrideFunc.includes('#e0e7ff') ||
                    overrideFunc.includes('PRE-LOADING')) {
                    console.log('🔄 Restoring ORIGINAL getStageHtml');
                    window.getStageHtml = originalGetStageHtml;
                }
            }

            // If generateSimpleLeadRows gets overridden, check if it's broken
            if (originalGenerateRows && window.generateSimpleLeadRows !== originalGenerateRows) {
                const overrideFunc = window.generateSimpleLeadRows.toString();

                // If the override doesn't use getStageHtml, it's broken - restore original
                if (!overrideFunc.includes('getStageHtml') ||
                    overrideFunc.includes('${lead.stage ||') ||
                    overrideFunc.includes('FINAL FIX')) {
                    console.log('🔄 Restoring ORIGINAL generateSimpleLeadRows');
                    window.generateSimpleLeadRows = originalGenerateRows;
                }
            }
        }, 100);
    }

    console.log('✅ Original stage preservation active');
})();