// Fix loading spinner for leads view - DISABLED to prevent tab switching interference
(function() {
    console.log('Loading spinner fix DISABLED to prevent flashing and tab switching issues');

    // DISABLED - This was interfering with tab switching
    return;

    let currentHash = window.location.hash;
    let hasLoadedLeads = false;
    let isLoadingLeads = false;

    // Track if we're actually in the leads view
    function inLeadsView() {
        return window.location.hash === '#leads';
    }

    // Only show spinner when navigating TO leads from another tab
    window.addEventListener('hashchange', function(event) {
        const oldHash = currentHash;
        const newHash = window.location.hash;
        currentHash = newHash;

        // Only show spinner when:
        // 1. Going TO leads tab
        // 2. FROM a different tab
        // 3. Not already loading
        // 4. Haven't just loaded it
        if (newHash === '#leads' && oldHash !== '#leads' && !isLoadingLeads && !hasLoadedLeads) {
            console.log('Navigating to leads - showing spinner once');
            isLoadingLeads = true;

            const dashboardContent = document.querySelector('.dashboard-content');
            if (dashboardContent) {
                // Show spinner
                dashboardContent.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px;">
                        <div style="width: 60px; height: 60px; border: 4px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <p style="margin-top: 20px; color: #6b7280; font-size: 16px;">Loading leads...</p>
                    </div>
                    <style>
                        @keyframes spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                    </style>
                `;

                // Mark as loaded after 2 seconds
                setTimeout(() => {
                    isLoadingLeads = false;
                    if (inLeadsView()) {
                        hasLoadedLeads = true;
                    }
                }, 2000);
            }
        }

        // Reset the flag when leaving leads view
        if (oldHash === '#leads' && newHash !== '#leads') {
            hasLoadedLeads = false;
        }
    });

    // Block any attempts to show loading spinner after initial load
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value) {
            // If we're in leads view and already loaded, block any loading spinner HTML
            if (inLeadsView() && hasLoadedLeads && typeof value === 'string' && value.includes('Loading leads...')) {
                console.log('Blocked loading spinner - already loaded');
                return;
            }
            originalInnerHTML.set.call(this, value);
        },
        get: originalInnerHTML.get
    });
})();