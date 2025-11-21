// AGGRESSIVE Fix for Single Policy Selection in Renewals
console.log('🔨 FORCING single policy selection in renewals...');

(function() {
    // Track the currently selected policy
    let currentlySelectedPolicy = null;

    // Function to clear ALL selections
    function clearAllSelections() {
        console.log('🧹 Clearing ALL renewal selections');

        // Find ALL renewal items by multiple methods
        const selectors = [
            '.renewal-item',
            '[class*="renewal-item"]',
            'div[onclick*="selectRenewal"]'
        ];

        selectors.forEach(selector => {
            const items = document.querySelectorAll(selector);
            items.forEach(item => {
                // Remove all selection indicators
                item.classList.remove('selected');
                item.classList.remove('active');
                item.classList.remove('highlighted');

                // Reset all inline styles
                item.style.background = '';
                item.style.backgroundColor = '';
                item.style.border = '';
                item.style.borderColor = '';
                item.style.borderLeft = '';
                item.style.color = '';
                item.style.transform = '';
                item.style.boxShadow = '';

                // Reset all child elements
                const allChildren = item.querySelectorAll('*');
                allChildren.forEach(child => {
                    child.style.color = '';
                    child.style.background = '';
                    child.style.backgroundColor = '';
                });
            });
        });
    }

    // Function to select a specific item
    function selectItem(element, policy) {
        console.log('✅ Selecting policy:', policy?.policyNumber);

        // Add selected class
        element.classList.add('selected');

        // Apply selection styles FORCEFULLY
        element.style.cssText = `
            background: linear-gradient(to right, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            border-left: 6px solid #667eea !important;
            transform: scale(1.02) !important;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
        `;

        // Make all text white
        const allText = element.querySelectorAll('*');
        allText.forEach(el => {
            el.style.color = 'white !important';
        });

        // Store current selection
        currentlySelectedPolicy = policy;
    }

    // GLOBAL click handler - captures ALL clicks
    document.addEventListener('click', function(e) {
        // Check if clicked on or within a renewal item
        const renewalItem = e.target.closest('.renewal-item');

        if (renewalItem) {
            console.log('🎯 Renewal item clicked');

            // Prevent default and stop propagation
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            // ALWAYS clear all selections first
            clearAllSelections();

            // Extract policy data
            let policy = null;
            const onclickAttr = renewalItem.getAttribute('onclick');
            if (onclickAttr) {
                try {
                    // Extract the JSON from onclick
                    const match = onclickAttr.match(/selectRenewal\((.*?)\)/);
                    if (match) {
                        const jsonStr = match[1].replace(/&quot;/g, '"').replace(/, event\)$/, '');
                        policy = JSON.parse(jsonStr);
                    }
                } catch (err) {
                    console.error('Failed to parse policy data:', err);
                }
            }

            // Select this item
            selectItem(renewalItem, policy);

            // Call the original renewal manager if available
            if (window.renewalsManager && policy) {
                // Update the selected renewal
                window.renewalsManager.selectedRenewal = policy;

                // Update details panel
                const detailsPanel = document.getElementById('renewalDetails');
                if (detailsPanel) {
                    detailsPanel.innerHTML = window.renewalsManager.generateRenewalDetails(policy);
                }
            }

            return false; // Prevent any further handling
        }
    }, true); // Use capture phase to intercept early

    // Monitor for new renewal items being added to DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                // Check if renewal items were added
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        const renewalItems = node.querySelectorAll ? node.querySelectorAll('.renewal-item') : [];
                        if (renewalItems.length > 0 || (node.classList && node.classList.contains('renewal-item'))) {
                            console.log('🔄 New renewal items detected, ensuring single selection');

                            // Clear all selections except current
                            setTimeout(() => {
                                clearAllSelections();

                                // Re-select current policy if exists
                                if (currentlySelectedPolicy) {
                                    const items = document.querySelectorAll('.renewal-item');
                                    items.forEach(item => {
                                        const policyNum = item.querySelector('.policy-number');
                                        if (policyNum && policyNum.textContent.includes(currentlySelectedPolicy.policyNumber)) {
                                            selectItem(item, currentlySelectedPolicy);
                                        }
                                    });
                                }
                            }, 100);
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

    // Override the renewalsManager selectRenewal if it exists
    function overrideSelectRenewal() {
        if (window.renewalsManager) {
            console.log('🔧 Overriding renewalsManager.selectRenewal');

            window.renewalsManager.selectRenewal = function(policy) {
                console.log('📌 selectRenewal called for:', policy.policyNumber);

                // Clear all selections
                clearAllSelections();

                // Find and select the correct item
                const items = document.querySelectorAll('.renewal-item');
                items.forEach(item => {
                    const policyNum = item.querySelector('.policy-number');
                    if (policyNum && policyNum.textContent.includes(policy.policyNumber)) {
                        selectItem(item, policy);
                    }
                });

                // Update internal state
                this.selectedRenewal = policy;

                // Update details panel
                const detailsPanel = document.getElementById('renewalDetails');
                if (detailsPanel) {
                    detailsPanel.innerHTML = this.generateRenewalDetails(policy);
                }
            };
        } else {
            setTimeout(overrideSelectRenewal, 100);
        }
    }

    overrideSelectRenewal();

    // Periodically check and fix any multiple selections
    setInterval(() => {
        const selectedItems = document.querySelectorAll('.renewal-item.selected');
        if (selectedItems.length > 1) {
            console.log('⚠️ Multiple selections detected, fixing...');

            // Keep only the last one selected
            for (let i = 0; i < selectedItems.length - 1; i++) {
                selectedItems[i].classList.remove('selected');
                selectedItems[i].style.cssText = '';
            }
        }
    }, 500);

    // Add CSS to ensure our styles take precedence
    const style = document.createElement('style');
    style.textContent = `
        /* Force single selection */
        .renewal-item {
            cursor: pointer !important;
            transition: all 0.3s ease !important;
        }

        /* Default state */
        .renewal-item:not(.selected) {
            background: #f8f9fa !important;
            color: inherit !important;
            border-left: 4px solid #2196F3 !important;
        }

        .renewal-item:not(.selected):hover {
            background: #e9ecef !important;
            transform: translateX(5px) !important;
        }

        /* Selected state - OVERRIDE EVERYTHING */
        .renewal-item.selected,
        .renewal-item.selected:hover {
            background: linear-gradient(to right, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            border-left: 6px solid #667eea !important;
            transform: scale(1.02) !important;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
        }

        .renewal-item.selected * {
            color: white !important;
        }

        /* Prevent multiple blue selections */
        .renewal-item.selected ~ .renewal-item.selected {
            background: #f8f9fa !important;
            color: inherit !important;
            border-left: 4px solid #2196F3 !important;
            transform: none !important;
            box-shadow: none !important;
        }
    `;
    document.head.appendChild(style);

    console.log('✅ AGGRESSIVE single selection fix active');
})();