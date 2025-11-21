// FIX: Make 60-Day View text persistent
console.log('🔧 Fixing 60-Day View text to be persistent...');

(function() {
    // Function to update all Month View references to 60-Day View
    function updateTo60DayView() {
        // Update buttons
        document.querySelectorAll('button').forEach(btn => {
            if (btn.innerHTML.includes('Month View') ||
                btn.textContent.includes('Month View') ||
                btn.innerHTML.includes('fa-calendar-day')) {

                // Check if it needs updating
                if (!btn.innerHTML.includes('60-Day View')) {
                    const isActive = btn.classList.contains('active');
                    btn.innerHTML = '<i class="fas fa-calendar-days"></i> 60-Day View';
                    if (isActive) {
                        btn.classList.add('active');
                    }
                }
            }
        });

        // Update headers
        document.querySelectorAll('h3, h4, .list-header').forEach(elem => {
            if (elem.textContent === 'Monthly Renewals' || elem.textContent === 'Month Renewals') {
                elem.textContent = '60-Day Renewals';
            }
        });

        // Update any stat cards
        document.querySelectorAll('.stat-card h4').forEach(h4 => {
            if (h4.textContent === 'Expiring This Month') {
                h4.textContent = 'Expiring Next 30 Days';
            }
        });
    }

    // Override the loadRenewalsView function to replace HTML
    if (window.renewalsManager) {
        const originalLoad = window.renewalsManager.loadRenewalsView;
        window.renewalsManager.loadRenewalsView = function() {
            // Store original innerHTML setter
            const dashboardContent = document.querySelector('.dashboard-content');
            if (dashboardContent) {
                const originalSetter = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;

                // Temporarily override innerHTML to replace text
                Object.defineProperty(dashboardContent, 'innerHTML', {
                    set: function(html) {
                        // Replace Month View with 60-Day View in the HTML
                        html = html.replace(/Month View/g, '60-Day View');
                        html = html.replace(/Monthly Renewals/g, '60-Day Renewals');
                        html = html.replace(/fa-calendar-day/g, 'fa-calendar-days');
                        html = html.replace(/Expiring This Month/g, 'Expiring Next 30 Days');

                        // Call original setter with modified HTML
                        originalSetter.call(this, html);
                    },
                    configurable: true
                });
            }

            // Call original function
            if (originalLoad) {
                originalLoad.call(this);
            }

            // Restore original innerHTML setter
            if (dashboardContent) {
                delete dashboardContent.innerHTML;
            }

            // Also update after a delay
            setTimeout(updateTo60DayView, 100);
        };

        // Override switchView
        const originalSwitch = window.renewalsManager.switchView;
        window.renewalsManager.switchView = function(view) {
            if (originalSwitch) {
                originalSwitch.call(this, view);
            }
            setTimeout(updateTo60DayView, 100);
            setTimeout(updateTo60DayView, 300);
        };
    }

    // Continuous monitor - check every 500ms
    setInterval(updateTo60DayView, 500);

    // Monitor for DOM changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if renewal view elements were added
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.classList && (
                            node.classList.contains('view-btn') ||
                            node.classList.contains('renewals-view') ||
                            node.querySelector?.('.view-btn')
                        )) {
                            updateTo60DayView();
                        }
                    }
                });
            }
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also intercept any onclick handlers
    document.addEventListener('click', function(e) {
        if (e.target.closest('button') &&
            (e.target.textContent.includes('View') ||
             e.target.innerHTML.includes('fa-calendar'))) {
            setTimeout(updateTo60DayView, 50);
            setTimeout(updateTo60DayView, 150);
            setTimeout(updateTo60DayView, 300);
        }
    }, true);

    // Initial update
    updateTo60DayView();

    console.log('✅ 60-Day View text will now persist');
})();