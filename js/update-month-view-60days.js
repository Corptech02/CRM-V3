// Update Month View to show 60 days of renewals instead of 30
console.log('📅 Updating Month View to show 60-day period...');

(function() {
    // Wait for renewalsManager to be available
    function updateMonthView() {
        if (!window.renewalsManager) {
            setTimeout(updateMonthView, 100);
            return;
        }

        console.log('✅ Updating renewalsManager month view to 60 days');

        // Override the filterPoliciesByView function
        const originalFilter = window.renewalsManager.filterPoliciesByView;
        window.renewalsManager.filterPoliciesByView = function(policies) {
            const now = new Date();

            if (this.currentView === 'month') {
                // Changed from 30 to 60 days
                const sixtyDaysFromNow = new Date(now);
                sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

                console.log(`📅 Filtering policies for 60-day view: ${now.toLocaleDateString()} to ${sixtyDaysFromNow.toLocaleDateString()}`);

                return policies.filter(policy => {
                    const expDate = new Date(policy.expirationDate);
                    return expDate >= now && expDate <= sixtyDaysFromNow;
                });
            } else {
                // Year view remains the same
                if (originalFilter) {
                    return originalFilter.call(this, policies);
                }
                return policies;
            }
        };

        // Override the loadRenewalsView to update the UI text
        const originalLoadView = window.renewalsManager.loadRenewalsView;
        window.renewalsManager.loadRenewalsView = function() {
            // Call original function
            if (originalLoadView) {
                originalLoadView.call(this);
            }

            // Update the button text and header after a short delay
            setTimeout(() => {
                // Update the Month View button text
                const monthButton = document.querySelector('.view-btn:has-text("Month View"), button:contains("Month View")');
                if (!monthButton) {
                    // Find button by looking for calendar-day icon
                    const buttons = document.querySelectorAll('.view-btn');
                    buttons.forEach(btn => {
                        if (btn.innerHTML.includes('fa-calendar-day') || btn.textContent.includes('Month View')) {
                            btn.innerHTML = '<i class="fas fa-calendar-days"></i> 60-Day View';
                        }
                    });
                }

                // Update the header text if in month view
                if (this.currentView === 'month') {
                    const listHeader = document.querySelector('.renewals-list .list-header h3');
                    if (listHeader && listHeader.textContent.includes('Monthly')) {
                        listHeader.textContent = '60-Day Renewals';
                    }
                }

                // Update stat card to reflect 60 days
                const statCards = document.querySelectorAll('.stat-card');
                statCards.forEach(card => {
                    const h4 = card.querySelector('h4');
                    if (h4 && h4.textContent === 'Expiring This Month') {
                        h4.textContent = 'Expiring Next 30 Days';
                    }
                });
            }, 100);
        };

        // Override switchView to update text when switching
        const originalSwitchView = window.renewalsManager.switchView;
        window.renewalsManager.switchView = function(view) {
            // Call original
            if (originalSwitchView) {
                originalSwitchView.call(this, view);
            }

            // Update UI after switch
            setTimeout(() => {
                if (view === 'month') {
                    // Update header
                    const listHeader = document.querySelector('.renewals-list .list-header h3');
                    if (listHeader) {
                        listHeader.textContent = '60-Day Renewals';
                    }

                    // Update button if needed
                    const buttons = document.querySelectorAll('.view-btn');
                    buttons.forEach(btn => {
                        if (btn.classList.contains('active') && (btn.innerHTML.includes('fa-calendar-day') || btn.textContent.includes('Month'))) {
                            if (!btn.textContent.includes('60-Day')) {
                                btn.innerHTML = '<i class="fas fa-calendar-days"></i> 60-Day View';
                            }
                        }
                    });
                }
            }, 100);
        };

        // Also override the month-specific functions if they exist
        if (window.renewalsManager.getExpiringThisMonth) {
            window.renewalsManager.getExpiringThisMonth = function(policies) {
                const now = new Date();
                const thirtyDaysFromNow = new Date(now);
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

                return policies.filter(policy => {
                    const expDate = new Date(policy.expirationDate);
                    return expDate >= now && expDate <= thirtyDaysFromNow;
                }).length;
            };
        }
    }

    // Start the update
    updateMonthView();

    // Also update any existing buttons immediately if page is already loaded
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            // Find and update month view button
            document.querySelectorAll('button').forEach(btn => {
                if (btn.textContent.includes('Month View') || btn.innerHTML.includes('fa-calendar-day')) {
                    if (btn.innerHTML.includes('fa-calendar-day')) {
                        btn.innerHTML = '<i class="fas fa-calendar-days"></i> 60-Day View';
                    } else {
                        btn.textContent = '60-Day View';
                    }
                }
            });
        }, 500);
    });

    console.log('✅ Month View updated to show 60-day period');
})();