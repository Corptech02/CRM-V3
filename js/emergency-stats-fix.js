/**
 * Emergency Stats Fix - Stop the "$0$0$0$0$0" issue immediately
 */

console.log('🚨 Emergency stats fix - stopping stat value concatenation...');

(function() {
    'use strict';

    // Clear any existing intervals that might be updating stats - DISABLED - This was causing infinite loop flickering!
    // let highestIntervalId = setInterval(()=>{}, 0);
    // for (let i = 0; i < highestIntervalId; i++) {
    //     clearInterval(i);
    // }

    // Override problematic functions
    let updateInProgress = false;

    // Helper function to safely parse premium values
    function safeParsePremium(value) {
        if (!value) return 0;
        if (typeof value === 'string') {
            // Remove everything except digits and decimal point
            const cleaned = value.replace(/[^\d.]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }

    // Safe currency formatter
    function safeFormatCurrency(value) {
        const num = safeParsePremium(value);
        if (num === 0) return '$0';
        if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return '$' + (num / 1000).toFixed(0) + 'K';
        return '$' + num.toLocaleString();
    }

    // Safe number formatter
    function safeFormatNumber(value) {
        const num = parseInt(value) || 0;
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
        return num.toString();
    }

    // Function to immediately fix the stats display
    function fixStatsDisplay() {
        if (updateInProgress) return;
        updateInProgress = true;

        try {
            console.log('🔧 Fixing stats display...');

            // Get current data
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

            // Calculate stats
            const clientCount = clients.length;
            const policyCount = policies.length;

            // Calculate total premium from leads that have valid premium values
            let totalLeadPremium = 0;
            leads.forEach(lead => {
                const premium = safeParsePremium(lead.premium);
                totalLeadPremium += premium;
            });

            // Calculate policy premiums
            let totalPolicyPremium = 0;
            policies.forEach(policy => {
                const premium = safeParsePremium(policy.premium || policy.monthlyPremium);
                totalPolicyPremium += premium;
            });

            console.log('📊 Calculated stats:', {
                clients: clientCount,
                policies: policyCount,
                leadPremium: totalLeadPremium,
                policyPremium: totalPolicyPremium
            });

            // Update all stat cards directly
            const statCards = document.querySelectorAll('.stat-value');

            if (statCards.length >= 4) {
                statCards[0].textContent = safeFormatNumber(clientCount);
                statCards[1].textContent = safeFormatNumber(policyCount);
                statCards[2].textContent = safeFormatCurrency(totalPolicyPremium);
                statCards[3].textContent = safeFormatCurrency(totalLeadPremium);

                console.log('✅ Updated all 4 stat cards');
            } else {
                console.log('⚠️ Found', statCards.length, 'stat cards, expected 4');

                // Try alternative selectors
                const activeClientsEl = document.querySelector('[data-stat="clients"] .stat-value');
                const activePoliciesEl = document.querySelector('[data-stat="policies"] .stat-value');
                const allTimePremiumEl = document.querySelector('[data-stat="premium"] .stat-value');
                const leadPremiumEl = document.querySelector('[data-stat="leads"] .stat-value');

                if (activeClientsEl) activeClientsEl.textContent = safeFormatNumber(clientCount);
                if (activePoliciesEl) activePoliciesEl.textContent = safeFormatNumber(policyCount);
                if (allTimePremiumEl) allTimePremiumEl.textContent = safeFormatCurrency(totalPolicyPremium);
                if (leadPremiumEl) leadPremiumEl.textContent = safeFormatCurrency(totalLeadPremium);
            }

        } catch (error) {
            console.error('❌ Error fixing stats:', error);
        } finally {
            updateInProgress = false;
        }
    }

    // Override any existing formatCurrency functions to prevent concatenation
    if (window.DashboardStats) {
        const original = window.DashboardStats.prototype.formatCurrency;
        window.DashboardStats.prototype.formatCurrency = function(num) {
            return safeFormatCurrency(num);
        };

        const originalFormat = window.DashboardStats.prototype.formatNumber;
        window.DashboardStats.prototype.formatNumber = function(num) {
            return safeFormatNumber(num);
        };

        console.log('🔧 Overrode DashboardStats formatting functions');
    }

    // Run the fix immediately
    fixStatsDisplay();

    // Set up a clean interval for updates - DISABLED to prevent DOM manipulation flickering
    // setInterval(fixStatsDisplay, 15000);

    // Listen for data changes
    window.addEventListener('leadDataChanged', fixStatsDisplay);
    window.addEventListener('storage', fixStatsDisplay);

    // Expose manual fix function
    window.fixStatsNow = fixStatsDisplay;

    console.log('✅ Emergency stats fix applied. Use fixStatsNow() to manually update.');

})();