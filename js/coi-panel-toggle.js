// COI Panel Toggle - Minimize/Maximize functionality for COI management panels

(function() {
    'use strict';

    let isRightPanelMinimized = false;
    let hasSetDefaultState = false;

    // Remove any previous instant styles and let manual toggle control everything
    const existingInstant = document.getElementById('coi-pre-minimized-instant');
    if (existingInstant) {
        existingInstant.remove();
    }

    // Apply minimized state immediately without waiting for button
    function applyMinimizedStateDirectly() {
        const rightPanel = document.querySelector('.coi-right-panel');
        const leftPanel = document.querySelector('.coi-left-panel');
        const coiContainer = document.querySelector('.coi-container');

        if (!rightPanel || !leftPanel || !coiContainer) return false;

        // Apply inline styles immediately for instant effect
        applyInstantMinimizedStyles(rightPanel, leftPanel, coiContainer);

        // Also apply CSS classes for consistency
        rightPanel.classList.add('minimized');
        leftPanel.classList.add('expanded');
        coiContainer.classList.add('right-panel-minimized');

        isRightPanelMinimized = true;
        console.log('COI Panel: Applied minimized state directly (instant inline styles + CSS)');
        return true;
    }

    // Set default minimized state
    function setDefaultMinimizedState() {
        if (hasSetDefaultState) return;

        const rightPanel = document.querySelector('.coi-right-panel');
        const leftPanel = document.querySelector('.coi-left-panel');

        if (rightPanel && leftPanel) {
            // First try to apply CSS directly
            if (applyMinimizedStateDirectly()) {
                hasSetDefaultState = true;

                // Update button icon when it becomes available
                setTimeout(() => {
                    updateToggleButtonState();
                }, 500);

                setTimeout(() => {
                    updateToggleButtonState();
                }, 1500);
            }
        }
    }

    // Update the toggle button to match current state
    function updateToggleButtonState() {
        const toggleBtn = document.querySelector('.panel-toggle-btn');
        if (toggleBtn) {
            if (isRightPanelMinimized) {
                toggleBtn.innerHTML = '<i class="fas fa-expand"></i>';
                toggleBtn.title = 'Restore COI Inbox';
            } else {
                toggleBtn.innerHTML = '<i class="fas fa-minus"></i>';
                toggleBtn.title = 'Minimize COI Inbox';
            }
        }
    }

    // Initialize panel toggle functionality
    function initPanelToggle() {
        // Wait for COI management content to be loaded
        const checkInterval = setInterval(() => {
            const rightPanel = document.querySelector('.coi-right-panel');
            const leftPanel = document.querySelector('.coi-left-panel');

            if (rightPanel && leftPanel) {
                clearInterval(checkInterval);
                addToggleButtons();
                setupStyles();

                // Default to minimized state on load
                setTimeout(() => {
                    setDefaultMinimizedState();
                }, 300);

                // Also try again after a longer delay to handle late-loading content
                setTimeout(() => {
                    setDefaultMinimizedState();
                }, 1000);

                setTimeout(() => {
                    setDefaultMinimizedState();
                }, 2000);
            }
        }, 500);

        // Clear interval after 10 seconds to avoid infinite checking
        setTimeout(() => clearInterval(checkInterval), 10000);
    }

    // Add toggle buttons to panel headers
    function addToggleButtons() {
        // Add minimize button to COI Request Inbox
        const rightPanelHeader = document.querySelector('.coi-right-panel .panel-header');
        if (rightPanelHeader && !rightPanelHeader.querySelector('.panel-toggle-btn')) {
            const minimizeBtn = document.createElement('button');
            minimizeBtn.className = 'panel-toggle-btn btn-secondary btn-small';
            minimizeBtn.innerHTML = '<i class="fas fa-minus"></i>';
            minimizeBtn.title = 'Minimize COI Inbox';
            minimizeBtn.style.cssText = `
                margin-left: 10px;
                padding: 6px 8px;
                border: none;
                background: #6b7280;
                color: white;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
            `;

            minimizeBtn.addEventListener('click', toggleRightPanel);

            // Insert before existing actions or at the end
            const inboxActions = rightPanelHeader.querySelector('.inbox-actions');
            if (inboxActions) {
                inboxActions.appendChild(minimizeBtn);
            } else {
                rightPanelHeader.appendChild(minimizeBtn);
            }
        }
    }

    // Toggle the right panel minimize/maximize state
    function toggleRightPanel() {
        const rightPanel = document.querySelector('.coi-right-panel');
        const leftPanel = document.querySelector('.coi-left-panel');
        const coiContainer = document.querySelector('.coi-container');
        const toggleBtn = document.querySelector('.panel-toggle-btn');

        if (!rightPanel || !leftPanel || !coiContainer) return;

        isRightPanelMinimized = !isRightPanelMinimized;

        if (isRightPanelMinimized) {
            // Minimize right panel - apply inline styles
            applyInstantMinimizedStyles(rightPanel, leftPanel, coiContainer);
            rightPanel.classList.add('minimized');
            leftPanel.classList.add('expanded');
            coiContainer.classList.add('right-panel-minimized');

            console.log('COI Panel: Right panel minimized, Policy Profiles expanded');
        } else {
            // Restore normal view - remove inline styles and classes
            clearInlineStyles(rightPanel, leftPanel, coiContainer);
            rightPanel.classList.remove('minimized');
            leftPanel.classList.remove('expanded');
            coiContainer.classList.remove('right-panel-minimized');

            console.log('COI Panel: Normal view restored');
        }

        // Update button state
        updateToggleButtonState();

        // Trigger resize event for any charts or components that need to adjust
        window.dispatchEvent(new Event('resize'));
    }

    // Apply instant minimized styles directly to elements
    function applyInstantMinimizedStyles(rightPanel, leftPanel, coiContainer) {
        // Apply inline styles immediately to bypass CSS conflicts
        if (coiContainer) {
            coiContainer.style.gridTemplateColumns = '1fr 60px';
            coiContainer.style.transition = 'grid-template-columns 0.3s ease';
        }

        if (rightPanel) {
            rightPanel.style.minWidth = '60px';
            rightPanel.style.maxWidth = '60px';
            rightPanel.style.transition = 'all 0.3s ease';

            // Hide content immediately
            const header = rightPanel.querySelector('.panel-header');
            if (header) {
                const h3 = header.querySelector('h3');
                const buttons = header.querySelectorAll('.btn-secondary:not(.panel-toggle-btn)');

                if (h3) h3.style.display = 'none';
                buttons.forEach(btn => btn.style.display = 'none');

                header.style.justifyContent = 'center';
                header.style.padding = '15px 5px';
            }

            const inbox = rightPanel.querySelector('.coi-inbox');
            if (inbox) inbox.style.display = 'none';
        }

        if (leftPanel) {
            leftPanel.style.transition = 'all 0.3s ease';
        }
    }

    // Clear inline styles to restore normal view
    function clearInlineStyles(rightPanel, leftPanel, coiContainer) {
        if (coiContainer) {
            coiContainer.style.gridTemplateColumns = '';
            coiContainer.style.transition = 'grid-template-columns 0.3s ease';
        }

        if (rightPanel) {
            rightPanel.style.minWidth = '';
            rightPanel.style.maxWidth = '';
            rightPanel.style.transition = 'all 0.3s ease';

            // Restore content visibility
            const header = rightPanel.querySelector('.panel-header');
            if (header) {
                const h3 = header.querySelector('h3');
                const buttons = header.querySelectorAll('.btn-secondary:not(.panel-toggle-btn)');

                if (h3) h3.style.display = '';
                buttons.forEach(btn => btn.style.display = '');

                header.style.justifyContent = '';
                header.style.padding = '';
            }

            const inbox = rightPanel.querySelector('.coi-inbox');
            if (inbox) inbox.style.display = '';
        }

        if (leftPanel) {
            leftPanel.style.transition = 'all 0.3s ease';
        }
    }

    // Setup dynamic styles for minimize/maximize states
    function setupStyles() {
        const style = document.createElement('style');
        style.id = 'coi-panel-toggle-styles';
        style.textContent = `
            /* Smooth transitions */
            .coi-container {
                transition: grid-template-columns 0.3s ease;
            }

            .coi-left-panel,
            .coi-right-panel {
                transition: all 0.3s ease;
            }

            /* Minimized right panel state */
            .coi-container.right-panel-minimized {
                grid-template-columns: 1fr 60px;
            }

            .coi-right-panel.minimized {
                min-width: 60px;
                max-width: 60px;
            }

            .coi-right-panel.minimized .panel-header h3,
            .coi-right-panel.minimized .inbox-actions .btn-secondary:not(.panel-toggle-btn) {
                display: none;
            }

            .coi-right-panel.minimized .panel-header {
                justify-content: center;
                padding: 15px 5px;
            }

            .coi-right-panel.minimized .coi-inbox {
                display: none;
            }

            /* Expanded left panel state */
            .coi-left-panel.expanded {
                /* Policy Profiles gets more space when COI inbox is minimized */
            }

            /* Hover effects for toggle button */
            .panel-toggle-btn:hover {
                background: #374151 !important;
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            /* Responsive design */
            @media (max-width: 768px) {
                .coi-container.right-panel-minimized {
                    grid-template-columns: 1fr 50px;
                }

                .coi-right-panel.minimized {
                    min-width: 50px;
                    max-width: 50px;
                }

                .panel-toggle-btn {
                    padding: 4px 6px !important;
                    font-size: 12px !important;
                }
            }

            /* Animation for content */
            .policy-viewer {
                transition: all 0.3s ease;
            }

            .coi-left-panel.expanded .policy-viewer {
                /* Add any special styles for expanded policy viewer */
            }

            /* Visual indicator when minimized */
            .coi-right-panel.minimized {
                border-left: 3px solid #10b981;
                background: linear-gradient(135deg, #f0fdf4 0%, #f9fafb 100%);
            }

            .coi-right-panel.minimized .panel-header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
            }

            /* Tooltip for minimized state */
            .coi-right-panel.minimized::before {
                content: attr(data-tooltip);
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-90deg);
                font-size: 12px;
                font-weight: 600;
                color: #10b981;
                white-space: nowrap;
                pointer-events: none;
                z-index: 1;
            }
        `;

        // Remove existing styles if they exist
        const existing = document.getElementById('coi-panel-toggle-styles');
        if (existing) {
            existing.remove();
        }

        document.head.appendChild(style);
    }

    // Add tooltip to minimized panel
    function updateTooltip() {
        const rightPanel = document.querySelector('.coi-right-panel');
        if (rightPanel) {
            if (isRightPanelMinimized) {
                rightPanel.setAttribute('data-tooltip', 'COI Inbox');
            } else {
                rightPanel.removeAttribute('data-tooltip');
            }
        }
    }

    // Keyboard shortcut support
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + M to toggle panels (only when in COI tab)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
                const coiContainer = document.querySelector('.coi-container');
                if (coiContainer && coiContainer.offsetParent !== null) { // Check if visible
                    e.preventDefault();
                    toggleRightPanel();
                }
            }
        });
    }

    // Auto-restore on page navigation
    function setupNavigationHandler() {
        // Save state to localStorage
        window.addEventListener('beforeunload', () => {
            localStorage.setItem('coiPanelMinimized', isRightPanelMinimized);
        });

        // Reset state tracking when navigating to COI
        const originalHash = window.location.hash;
        let lastHash = originalHash;

        const checkHashChange = () => {
            const currentHash = window.location.hash;
            if (currentHash !== lastHash) {
                if (currentHash === '#coi') {
                    console.log('COI Panel: Navigated to COI tab, resetting state');
                    hasSetDefaultState = false;
                    isRightPanelMinimized = false;

                    // Try to set minimized state after a delay
                    setTimeout(() => setDefaultMinimizedState(), 500);
                    setTimeout(() => setDefaultMinimizedState(), 1500);
                    setTimeout(() => setDefaultMinimizedState(), 3000);
                }
                lastHash = currentHash;
            }
        };

        setInterval(checkHashChange, 500);

        // Restore state when returning to COI tab
        const savedState = localStorage.getItem('coiPanelMinimized');

        // Always default to minimized for now (ignore saved state)
        const shouldBeMinimized = true; // Force minimized on every load

        if (shouldBeMinimized) {
            setTimeout(() => {
                setDefaultMinimizedState();
            }, 1000);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPanelToggle);
    } else {
        initPanelToggle();
    }

    // Also initialize when tab content changes (SPA navigation)
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 &&
                        (node.classList?.contains('coi-container') ||
                         node.querySelector?.('.coi-container'))) {
                        console.log('COI Panel: COI container detected, applying minimized state IMMEDIATELY...');

                        // Apply minimized state immediately - no setTimeout delay
                        hasSetDefaultState = false;
                        setDefaultMinimizedState(); // Instant call

                        // Also try alternative direct approach
                        applyMinimizedStateDirectly();

                        // Start button initialization quickly
                        setTimeout(initPanelToggle, 25);

                        // Additional safety attempts
                        setTimeout(() => setDefaultMinimizedState(), 100);
                        setTimeout(() => setDefaultMinimizedState(), 300);
                        setTimeout(() => setDefaultMinimizedState(), 600);
                        break;
                    }
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Setup additional features
    setupKeyboardShortcuts();
    setupNavigationHandler();

    // Update tooltip when state changes
    setInterval(() => {
        updateTooltip();
    }, 1000);

    // Expose toggle function globally for manual control
    window.toggleCOIPanel = toggleRightPanel;

    console.log('COI Panel Toggle initialized. COI Inbox defaults to minimized. Use Ctrl+Shift+M to toggle or click the expand button.');

})();