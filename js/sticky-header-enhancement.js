// Sticky Table Header Enhancement
// Ensures the sticky header works properly with dynamic content and scrolling

(function() {
    'use strict';

    let stickyHeaderObserver = null;
    let tableHeaderHeight = 0;

    // Function to initialize sticky header functionality
    function initStickyHeader() {
        // Wait for leads table to be rendered
        const checkTable = () => {
            const leadsTable = document.getElementById('leadsTable');
            const tableContainer = document.querySelector('.leads-view .table-container');

            if (leadsTable && tableContainer) {
                console.log('🔧 Initializing sticky header functionality');
                setupStickyHeader(leadsTable, tableContainer);
            } else {
                // Retry in 100ms if table isn't ready yet
                setTimeout(checkTable, 100);
            }
        };

        checkTable();
    }

    // Setup sticky header with proper positioning
    function setupStickyHeader(table, container) {
        const thead = table.querySelector('thead');
        const contentHeader = document.querySelector('.leads-view .content-header');

        if (!thead || !contentHeader) return;

        // Calculate the top position for the sticky header
        function updateStickyPosition() {
            const headerRect = contentHeader.getBoundingClientRect();
            const headerBottom = headerRect.bottom;

            // Update CSS custom property for sticky positioning
            document.documentElement.style.setProperty('--sticky-header-top', `${headerBottom}px`);
            tableHeaderHeight = thead.offsetHeight;
        }

        // Update position on scroll and resize
        let rafId = null;
        function handleScroll() {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                updateStickyPosition();
                rafId = null;
            });
        }

        // Initial setup
        updateStickyPosition();

        // Listen for scroll events
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', updateStickyPosition);

        // Observe table changes to re-initialize if needed
        if (stickyHeaderObserver) {
            stickyHeaderObserver.disconnect();
        }

        stickyHeaderObserver = new MutationObserver(() => {
            updateStickyPosition();
        });

        stickyHeaderObserver.observe(table, {
            childList: true,
            subtree: true
        });

        // Add visual enhancement when header becomes sticky
        const intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.target === thead) {
                        if (entry.intersectionRatio < 1) {
                            thead.classList.add('is-sticky');
                        } else {
                            thead.classList.remove('is-sticky');
                        }
                    }
                });
            },
            {
                threshold: [1],
                rootMargin: '-1px 0px 0px 0px'
            }
        );

        intersectionObserver.observe(thead);

        console.log('✅ Sticky header initialized successfully');
    }

    // Function to handle tab switching (active/archived leads)
    function handleTabSwitch() {
        // Re-initialize sticky header when switching tabs
        setTimeout(initStickyHeader, 200);
    }

    // Enhanced initialization - handle both page load and navigation
    function initialize() {
        // Initialize immediately if DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initStickyHeader);
        } else {
            initStickyHeader();
        }

        // Re-initialize when leads view is loaded
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        if (node.classList && node.classList.contains('leads-view')) {
                            setTimeout(initStickyHeader, 100);
                        }
                        // Check for table being added
                        const table = node.querySelector ? node.querySelector('#leadsTable') : null;
                        if (table) {
                            setTimeout(initStickyHeader, 100);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Export functions for external use
    window.initStickyHeader = initStickyHeader;
    window.handleTabSwitch = handleTabSwitch;

    // Override existing switchLeadTab function if it exists
    const originalSwitchLeadTab = window.switchLeadTab;
    window.switchLeadTab = function(tabName) {
        console.log('🔄 Lead tab switching to:', tabName);

        // Call original function if it exists
        if (originalSwitchLeadTab) {
            originalSwitchLeadTab.call(this, tabName);
        } else {
            // Default tab switching behavior for active/archived leads
            const activeTab = document.getElementById('active-leads-tab');
            const archivedTab = document.getElementById('archived-leads-tab');
            const activeButton = document.querySelector('.lead-tab:first-child');
            const archivedButton = document.querySelector('.lead-tab:last-child');

            if (tabName === 'active') {
                if (activeTab) activeTab.style.display = 'block';
                if (archivedTab) archivedTab.style.display = 'none';
                if (activeButton) {
                    activeButton.style.background = '#3b82f6';
                    activeButton.style.color = 'white';
                }
                if (archivedButton) {
                    archivedButton.style.background = '#f3f4f6';
                    archivedButton.style.color = '#6b7280';
                }
            } else if (tabName === 'archived') {
                if (activeTab) activeTab.style.display = 'none';
                if (archivedTab) archivedTab.style.display = 'block';
                if (archivedButton) {
                    archivedButton.style.background = '#3b82f6';
                    archivedButton.style.color = 'white';
                }
                if (activeButton) {
                    activeButton.style.background = '#f3f4f6';
                    activeButton.style.color = '#6b7280';
                }
            }
        }

        // Re-initialize sticky header after tab switch
        handleTabSwitch();
    };

    // Auto-initialize
    initialize();

    console.log('🔧 Sticky header enhancement script loaded');
})();