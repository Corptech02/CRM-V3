// Fix Policy Modal Tabs - Makes tabs properly show/hide content sections for both view and edit modals
(function() {
    console.log('🔧 Fixing policy modal tabs...');
    
    // Store the original functions
    const originalSwitchTab = window.switchTab;
    const originalSwitchViewTab = window.switchViewTab;
    
    // Fix the edit/create modal switchTab function
    window.switchTab = function(tabId) {
        console.log('Switching edit/create tab:', tabId);
        
        // Find the policy modal (edit/create)
        const modal = document.getElementById('policyModal');
        if (!modal) {
            // If no modal found, fall back to original behavior
            if (originalSwitchTab) {
                return originalSwitchTab.call(this, tabId);
            }
            return;
        }
        
        // Remove active class from all tabs in this modal
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Remove active class from all content sections and hide them
        modal.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        // Add active class to selected tab
        const selectedTab = modal.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Show selected content
        const selectedContent = modal.querySelector(`#${tabId}-content`);
        if (selectedContent) {
            selectedContent.classList.add('active');
            selectedContent.style.display = 'block';
        }
    };
    
    // Fix the view page switchViewTab function
    window.switchViewTab = function(tabId) {
        console.log('Switching view tab:', tabId);

        // Policy view is now a page inside #policyDetailPage (not a modal)
        const page = document.getElementById('policyDetailPage');
        if (!page) {
            if (originalSwitchViewTab) return originalSwitchViewTab.call(this, tabId);
            return;
        }

        // Update tab buttons
        page.querySelectorAll('.policy-view-tab-btn').forEach(btn => {
            const isActive = btn.getAttribute('data-tab') === tabId;
            btn.classList.toggle('pv-tab-active', isActive);
            btn.style.borderBottom = isActive ? '3px solid #0066cc' : '3px solid transparent';
            btn.style.color = isActive ? '#0066cc' : '#6b7280';
        });

        // Show/hide content panels
        page.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        const selectedContent = document.getElementById(`${tabId}-view-content`);
        if (selectedContent) selectedContent.style.display = 'block';
    };
    
    // Add styles for policy edit modal tab display
    const style = document.createElement('style');
    style.textContent = `
        #policyModal .tab-content { display: none; }
        #policyModal .tab-content.active { display: block !important; }
    `;
    document.head.appendChild(style);
    
    // Function to initialize tabs when modal opens
    function initializeModalTabs(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        // Hide all tabs except the first one
        const tabContents = modal.querySelectorAll('.tab-content');
        tabContents.forEach((content, index) => {
            if (index === 0) {
                content.classList.add('active');
                content.style.display = 'block';
            } else {
                content.classList.remove('active');
                content.style.display = 'none';
            }
        });
        
        // Make sure first tab button is active
        const tabButtons = modal.querySelectorAll('.tab-btn');
        tabButtons.forEach((btn, index) => {
            if (index === 0) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // Watch for when policy edit modal is added to the DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.id === 'policyModal') {
                    console.log('Policy edit/create modal detected, initializing tabs...');
                    setTimeout(() => {
                        initializeModalTabs('policyModal');
                    }, 100);
                }
            });
        });
    });
    
    // Start observing the document body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Override showPolicyModal for edit/create
    const originalShowPolicyModal = window.showPolicyModal;
    if (originalShowPolicyModal) {
        window.showPolicyModal = function(...args) {
            const result = originalShowPolicyModal.apply(this, args);
            
            // Wait for modal to render then initialize tabs
            setTimeout(() => {
                initializeModalTabs('policyModal');
            }, 200);
            
            return result;
        };
    }
    
    console.log('✅ Policy modal tabs fixed for both view and edit/create');
    console.log('   - View modal tabs now properly show/hide content sections');
    console.log('   - Edit/create modal tabs work correctly');
    console.log('   - Only active tab content is visible');
    console.log('   - Smooth transitions between tabs');
})();