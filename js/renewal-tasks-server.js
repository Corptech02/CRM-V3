// Renewal Tasks Server Storage - Load tasks from server on page load
console.log('📋 Renewal Tasks Server Storage initialized');

// Override the loadRenewalProfile or similar functions to load tasks from server
(function() {
    // Watch for when renewal profile loads
    const originalSwitchProfileTab = window.switchProfileTab;

    // Also handle initial load
    const observer = new MutationObserver(async (mutations) => {
        const tabContent = document.getElementById('profileTabContent');
        if (tabContent && tabContent.innerHTML.includes('Loading tasks...')) {
            // Load tasks from server
            if (typeof renderTasksTab === 'function') {
                try {
                    const html = await renderTasksTab();
                    tabContent.innerHTML = html;
                } catch (error) {
                    console.error('Error loading tasks:', error);
                }
            }
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('✅ Renewal tasks will now load from server');
})();