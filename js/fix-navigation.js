// Fix navigation issues with tabs
console.log('Fixing navigation system...');

(function() {
    // Store original functions
    const originalLoadContent = window.loadContent;
    const originalLoadLeadsView = window.loadLeadsView;
    
    // Override loadContent to properly handle navigation
    window.loadContent = function(section) {
        console.log('Loading content for section:', section);
        
        // Get dashboard content area
        const dashboardContent = document.querySelector('.dashboard-content');
        
        if (!dashboardContent) {
            console.error('Dashboard content area not found');
            return;
        }
        
        // Clear the content first for non-dashboard sections
        if (section !== '#dashboard' && section !== '#' && section !== '') {
            dashboardContent.innerHTML = '';
        }
        
        // Update active menu item
        updateActiveMenuItem(section);
        
        // Load the appropriate view
        switch(section) {
            case '':
            case '#':
            case '#dashboard':
                loadFullDashboard();
                break;
                
            case '#leads':
            case '#leads-management':
                console.log('Loading leads view...');
                // Clear content first
                dashboardContent.innerHTML = '';
                // Call the original loadLeadsView
                if (window.loadLeadsView) {
                    window.loadLeadsView();
                }
                break;
                
            case '#clients':
                loadClientsView();
                break;
                
            case '#policies':
                loadPoliciesView();
                break;
                
            case '#renewals':
                loadRenewalsView();
                break;
                
            case '#claims':
                loadClaimsView();
                break;
                
            case '#reports':
                loadReportsView();
                break;
                
            case '#lead-generation':
                loadLeadGenerationView();
                break;
                
            case '#marketing':
                loadMarketingView();
                break;
                
            case '#automation':
                loadAutomationView();
                break;
                
            case '#integrations':
                loadIntegrationsView();
                break;
                
            case '#tools':
                loadToolsView();
                break;
                
            case '#coi':
                loadCOIView();
                break;
                
            case '#commissions':
                loadCommissionsView();
                break;
                
            case '#carriers':
                loadCarriersView();
                break;
                
            default:
                console.log('Unknown section:', section);
                // Try to call original if it exists
                if (originalLoadContent) {
                    originalLoadContent(section);
                }
        }
    };
    
    // Fix menu item clicks
    function setupMenuHandlers() {
        // Remove old event listeners
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
        });
        
        // Add new event listeners
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const href = this.getAttribute('href');
                console.log('Menu clicked:', href);
                
                // Update the hash
                window.location.hash = href;
                
                // Load the content
                loadContent(href);
                
                // Update active state
                updateActiveMenuItem(href);
            });
        });
    }
    
    // Update active menu item
    window.updateActiveMenuItem = function(hash) {
        // Remove all active classes
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current item
        const activeLink = document.querySelector(`.sidebar-menu a[href="${hash}"]`);
        if (activeLink) {
            activeLink.parentElement.classList.add('active');
        }
    };
    
    // Handle hash changes
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash || '#dashboard';
        console.log('Hash changed to:', hash);
        loadContent(hash);
    });
    
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupMenuHandlers);
    } else {
        setupMenuHandlers();
    }
    
    // Also setup after a delay to catch any dynamically added elements
    setTimeout(setupMenuHandlers, 1000);
    
    console.log('Navigation system fixed');
})();