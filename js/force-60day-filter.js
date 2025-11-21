// FORCE 60-day filtering in Month View
console.log('📊 Forcing 60-day data filtering...');

(function() {
    // Override the filter function directly
    function override60DayFilter() {
        if (!window.renewalsManager) {
            setTimeout(override60DayFilter, 100);
            return;
        }

        console.log('🔄 Overriding filterPoliciesByView for 60 days');

        // Complete override of filterPoliciesByView
        window.renewalsManager.filterPoliciesByView = function(policies) {
            const now = new Date();

            if (this.currentView === 'month') {
                // ALWAYS use 60 days for month view
                const sixtyDaysFromNow = new Date(now);
                sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

                console.log(`📅 Filtering for 60-day period: ${now.toLocaleDateString()} to ${sixtyDaysFromNow.toLocaleDateString()}`);

                const filtered = policies.filter(policy => {
                    const expDate = new Date(policy.expirationDate);
                    return expDate >= now && expDate <= sixtyDaysFromNow;
                });

                console.log(`Found ${filtered.length} policies expiring in next 60 days`);
                return filtered;
            } else {
                // Year view - show all policies for the year
                return policies.filter(policy => {
                    const expDate = new Date(policy.expirationDate);
                    return expDate.getFullYear() <= now.getFullYear() + 1;
                });
            }
        };

        // Also update the helper functions
        window.renewalsManager.getExpiringInDays = function(policies, days) {
            const now = new Date();
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + days);

            return policies.filter(policy => {
                const expDate = new Date(policy.expirationDate);
                return expDate >= now && expDate <= targetDate;
            }).length;
        };

        window.renewalsManager.getExpiringPremium = function(policies, days) {
            const now = new Date();
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + days);

            return policies.filter(policy => {
                const expDate = new Date(policy.expirationDate);
                return expDate >= now && expDate <= targetDate;
            }).reduce((sum, policy) => sum + (policy.premium || 0), 0);
        };
    }

    // Start override
    override60DayFilter();

    console.log('✅ 60-day filtering is now active');
})();