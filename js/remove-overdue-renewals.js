// Remove overdue renewals (0 days or less) from display
(function() {
    'use strict';

    console.log('🔄 Removing overdue renewals filter active');

    // Function to filter out overdue/expired policies
    function filterOutOverdueRenewals(policies) {
        if (!Array.isArray(policies)) return policies;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return policies.filter(policy => {
            if (!policy.expirationDate) return true;

            const expDate = new Date(policy.expirationDate);
            expDate.setHours(0, 0, 0, 0);

            const daysUntilExpiration = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

            // Remove policies that are expired or expiring today (0 days or less)
            if (daysUntilExpiration <= 0) {
                console.log(`📛 Filtered out overdue/expired policy: ${policy.policyNumber} (${daysUntilExpiration} days)`);
                return false;
            }

            return true;
        });
    }

    // Override the getExpiringPolicies function if it exists
    if (window.getExpiringPolicies) {
        const originalGetExpiringPolicies = window.getExpiringPolicies;
        window.getExpiringPolicies = function(...args) {
            const result = originalGetExpiringPolicies.apply(this, args);
            return filterOutOverdueRenewals(result);
        };
    }

    // Override localStorage getItem for insurance_policies
    const originalGetItem = localStorage.getItem;
    window.getFilteredPolicies = function() {
        const policies = JSON.parse(originalGetItem.call(localStorage, 'insurance_policies') || '[]');
        return filterOutOverdueRenewals(policies);
    };

    // Monitor and filter renewal displays
    function filterRenewalDisplays() {
        // Filter renewal cards
        document.querySelectorAll('.renewal-card, .policy-card').forEach(card => {
            const expiryText = card.textContent || '';

            // Check for EXPIRED or 0 days text
            if (expiryText.includes('EXPIRED') ||
                expiryText.includes('0 days') ||
                expiryText.includes('-') && expiryText.includes('days')) {

                console.log('🚫 Hiding overdue renewal card');
                card.style.display = 'none';
                card.remove();
            }
        });

        // Filter table rows
        document.querySelectorAll('tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                const text = cell.textContent || '';
                if (text === 'EXPIRED' || text === '0 days' || (text.includes('-') && text.includes('days'))) {
                    console.log('🚫 Hiding overdue renewal row');
                    row.style.display = 'none';
                }
            });
        });
    }

    // Apply filtering on mutations
    const observer = new MutationObserver(() => {
        filterRenewalDisplays();
    });

    // Start observing when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            filterRenewalDisplays();
        });
    } else {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        filterRenewalDisplays();
    }

    // Apply filtering every second to catch dynamic updates
    setInterval(filterRenewalDisplays, 1000);

    console.log('✅ Overdue renewals filter initialized - will remove policies with 0 days or less');
})();