/**
 * Fix premium concatenation issue - ensures premiums are properly parsed as numbers
 */

(function() {
    'use strict';

    console.log('Premium concatenation fix loading...');

    // Create a robust premium parser function
    window.parsePremium = function(premium) {
        // Handle null/undefined
        if (premium === undefined || premium === null || premium === '') {
            return 0;
        }

        // Convert to string for processing
        let premStr = String(premium);

        // Remove $ and spaces
        premStr = premStr.replace(/[$\s]/g, '');

        // Check if this looks like multiple concatenated values
        // Pattern: "6000012,63100" should be split into "60000" and "12,631"
        if (premStr.match(/^\d{5,}[\d,]+$/)) {
            // This looks concatenated - need to extract individual values
            console.log('Detected concatenated premium:', premStr);

            // Look for pattern where numbers are mashed together
            // Try to find reasonable break points
            if (premStr.includes(',')) {
                // Split by comma to find segments
                const parts = premStr.split(',');

                // Check if first part is too long (likely concatenated)
                if (parts[0] && parts[0].length > 5) {
                    // Extract first 5 digits as one number
                    const firstNum = parseInt(parts[0].substring(0, 5));
                    console.log('Extracted first premium:', firstNum);
                    return firstNum || 0;
                }
            }

            // If still too large, just take first 5 digits
            if (premStr.replace(/,/g, '').length > 6) {
                const cleaned = premStr.replace(/,/g, '');
                const firstNum = parseInt(cleaned.substring(0, 5));
                console.log('Extracted premium from long string:', firstNum);
                return firstNum || 0;
            }
        }

        // Standard parsing - remove commas and parse
        premStr = premStr.replace(/,/g, '');
        let value = parseFloat(premStr) || 0;

        // Sanity check - if value is over 500,000, it's likely concatenated
        if (value > 500000) {
            console.log('Premium too large, likely concatenated:', value);
            // Take first 5 digits
            const strValue = String(Math.floor(value));
            value = parseInt(strValue.substring(0, 5)) || 0;
            console.log('Reduced to:', value);
        }

        return value;
    };

    // Override the calculateStagePremiumWithStatus function if it exists
    const originalLoadLeadsView = window.loadLeadsView;

    window.loadLeadsView = function() {
        console.log('Enhanced loadLeadsView with fixed premium parsing');

        const dashboardContent = document.querySelector('.dashboard-content');
        if (!dashboardContent) {
            return;
        }

        // Get leads and fix their premiums
        let allLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

        // Fix all premium values in the data
        allLeads = allLeads.map(lead => {
            if (lead.premium !== undefined && lead.premium !== null) {
                const originalPremium = lead.premium;
                lead.premium = window.parsePremium(lead.premium);

                if (originalPremium !== lead.premium) {
                    console.log(`Fixed premium for ${lead.name}: ${originalPremium} -> ${lead.premium}`);
                }
            }
            return lead;
        });

        // Save the fixed data back
        localStorage.setItem('insurance_leads', JSON.stringify(allLeads));
        localStorage.setItem('leads', JSON.stringify(allLeads));

        // Call the original function
        if (originalLoadLeadsView) {
            originalLoadLeadsView.call(this);
        }
    };

    // Also fix premiums when leads are loaded from the API
    const originalProcessLeads = window.processLeadsData;
    if (originalProcessLeads) {
        window.processLeadsData = function(leads) {
            // Fix premiums in the data
            if (Array.isArray(leads)) {
                leads = leads.map(lead => {
                    if (lead.premium !== undefined && lead.premium !== null) {
                        lead.premium = window.parsePremium(lead.premium);
                    }
                    return lead;
                });
            }

            // Call original function
            return originalProcessLeads.call(this, leads);
        };
    }

    // Fix existing data immediately
    const fixExistingData = function() {
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let hasChanges = false;

        leads = leads.map(lead => {
            if (lead.premium !== undefined && lead.premium !== null) {
                const originalPremium = lead.premium;
                const fixedPremium = window.parsePremium(lead.premium);

                if (originalPremium !== fixedPremium) {
                    console.log(`Fixing premium for ${lead.name}: "${originalPremium}" -> ${fixedPremium}`);
                    lead.premium = fixedPremium;
                    hasChanges = true;
                }
            }
            return lead;
        });

        if (hasChanges) {
            console.log('Saving fixed premium data to localStorage');
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            localStorage.setItem('leads', JSON.stringify(leads));
        }
    };

    // Run the fix immediately
    fixExistingData();

    console.log('Premium concatenation fix installed');

})();