// Fix Policy Tabs Display - Ensure Vehicles and Drivers tabs appear correctly
console.log('🔧 Fixing policy tabs display...');

// Override the policy viewing functions to ensure correct tabs are shown
function ensureCorrectPolicyTabs() {
    // Store the original functions if they exist
    const originalViewPolicy = window.viewPolicy;
    const originalViewPolicyProfile = window.viewPolicyProfile;
    const originalViewPolicyProfileCOI = window.viewPolicyProfileCOI;

    // Enhanced policy viewing function
    function enhancedViewPolicy(policyId) {
        console.log('🔍 Enhanced view policy called for:', policyId);

        // Call original function first if it exists
        if (originalViewPolicy) {
            originalViewPolicy(policyId);
        } else if (originalViewPolicyProfile) {
            originalViewPolicyProfile(policyId);
        } else if (originalViewPolicyProfileCOI) {
            originalViewPolicyProfileCOI(policyId);
        }

        // Wait a moment for the modal to load, then fix tabs
        setTimeout(() => {
            fixPolicyTabStructure();
        }, 500);
    }

    function fixPolicyTabStructure() {
        console.log('🔧 Fixing policy tab structure...');

        // Find the policy modal (could be different IDs)
        const policyModal = document.getElementById('policyViewModal') ||
                           document.getElementById('policyModal') ||
                           document.getElementById('policyViewer') ||
                           document.querySelector('[id*="policy"]') ||
                           document.querySelector('.modal:last-child');

        if (!policyModal) {
            console.log('❌ No policy modal found');
            return;
        }

        // Find the tabs container
        const tabsContainer = policyModal.querySelector('.policy-tabs') ||
                             policyModal.querySelector('.tabs') ||
                             policyModal.querySelector('[class*="tab"]');

        if (!tabsContainer) {
            console.log('❌ No tabs container found in policy modal');
            return;
        }

        // Check current tabs
        const currentTabs = Array.from(tabsContainer.querySelectorAll('.tab-btn, button[data-tab]'));
        const currentTabNames = currentTabs.map(tab =>
            tab.textContent.trim().toLowerCase() ||
            (tab.getAttribute('data-tab') || '').toLowerCase()
        );

        console.log('📋 Current tabs:', currentTabNames);

        // Check if vehicles and drivers tabs are missing
        const hasVehiclesTab = currentTabNames.some(name => name.includes('vehicle'));
        const hasDriversTab = currentTabNames.some(name => name.includes('driver'));

        console.log('🚗 Has vehicles tab:', hasVehiclesTab);
        console.log('👤 Has drivers tab:', hasDriversTab);

        if (!hasVehiclesTab || !hasDriversTab) {
            console.log('🔧 Adding missing tabs...');

            // Find where to insert new tabs (after coverage, before financial)
            const coverageTab = currentTabs.find(tab =>
                tab.textContent.toLowerCase().includes('coverage') ||
                tab.getAttribute('data-tab') === 'coverage'
            );

            const insertionPoint = coverageTab ? coverageTab.nextElementSibling : currentTabs[4];

            if (!hasVehiclesTab) {
                const vehiclesTab = document.createElement('button');
                vehiclesTab.className = 'tab-btn';
                vehiclesTab.setAttribute('data-tab', 'vehicles');
                vehiclesTab.setAttribute('onclick', 'switchViewTab(\'vehicles\')');
                vehiclesTab.style.cssText = 'padding: 14px 24px; font-size: 14px; border-radius: 8px; transition: all 0.2s; margin: 2px;';
                vehiclesTab.innerHTML = '<i class="fas fa-car" style="margin-right: 6px;"></i> Vehicles';

                if (insertionPoint) {
                    tabsContainer.insertBefore(vehiclesTab, insertionPoint);
                } else {
                    tabsContainer.appendChild(vehiclesTab);
                }

                console.log('✅ Added vehicles tab');
            }

            if (!hasDriversTab) {
                const driversTab = document.createElement('button');
                driversTab.className = 'tab-btn';
                driversTab.setAttribute('data-tab', 'drivers');
                driversTab.setAttribute('onclick', 'switchViewTab(\'drivers\')');
                driversTab.style.cssText = 'padding: 14px 24px; font-size: 14px; border-radius: 8px; transition: all 0.2s; margin: 2px;';
                driversTab.innerHTML = '<i class="fas fa-id-card" style="margin-right: 6px;"></i> Drivers';

                const financialTab = currentTabs.find(tab =>
                    tab.textContent.toLowerCase().includes('financial') ||
                    tab.getAttribute('data-tab') === 'financial'
                );

                if (financialTab) {
                    tabsContainer.insertBefore(driversTab, financialTab);
                } else if (insertionPoint) {
                    tabsContainer.insertBefore(driversTab, insertionPoint);
                } else {
                    tabsContainer.appendChild(driversTab);
                }

                console.log('✅ Added drivers tab');
            }

            // Add corresponding content sections if they don't exist
            setTimeout(() => {
                addMissingTabContent(policyModal);
            }, 100);
        }
    }

    function addMissingTabContent(policyModal) {
        console.log('🔧 Adding missing tab content sections...');

        const contentContainer = policyModal.querySelector('.tab-contents') ||
                                policyModal.querySelector('.modal-content') ||
                                policyModal.querySelector('.policy-content') ||
                                policyModal;

        // Add vehicles content if missing
        if (!contentContainer.querySelector('#vehicles-view-content')) {
            const vehiclesContent = document.createElement('div');
            vehiclesContent.id = 'vehicles-view-content';
            vehiclesContent.className = 'tab-content';
            vehiclesContent.innerHTML = `
                <div style="padding: 20px;">
                    <h3><i class="fas fa-car"></i> Vehicles Information</h3>
                    <p>Vehicle details will be populated here when this policy is viewed.</p>
                    <div id="vehicles-list"></div>
                </div>
            `;
            contentContainer.appendChild(vehiclesContent);
            console.log('✅ Added vehicles content section');
        }

        // Add drivers content if missing
        if (!contentContainer.querySelector('#drivers-view-content')) {
            const driversContent = document.createElement('div');
            driversContent.id = 'drivers-view-content';
            driversContent.className = 'tab-content';
            driversContent.innerHTML = `
                <div style="padding: 20px;">
                    <h3><i class="fas fa-id-card"></i> Drivers Information</h3>
                    <p>Driver details will be populated here when this policy is viewed.</p>
                    <div id="drivers-list"></div>
                </div>
            `;
            contentContainer.appendChild(driversContent);
            console.log('✅ Added drivers content section');
        }
    }

    // Override the viewPolicy functions
    if (typeof window.viewPolicy !== 'undefined') {
        console.log('🔄 Overriding window.viewPolicy');
        window.viewPolicy = enhancedViewPolicy;
    }
    if (typeof window.viewPolicyProfile !== 'undefined') {
        console.log('🔄 Overriding window.viewPolicyProfile');
        window.viewPolicyProfile = enhancedViewPolicy;
    }
    if (typeof window.viewPolicyProfileCOI !== 'undefined') {
        console.log('🔄 Overriding window.viewPolicyProfileCOI');
        window.viewPolicyProfileCOI = enhancedViewPolicy;
    }

    // Make enhanced function available globally
    window.enhancedViewPolicy = enhancedViewPolicy;
    window.fixPolicyTabStructure = fixPolicyTabStructure;
}

// Run the enhancement
setTimeout(() => {
    ensureCorrectPolicyTabs();
}, 1000);

// Also run when DOM changes (in case policies are loaded dynamically)
if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                Array.from(mutation.addedNodes).forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE &&
                        (node.id && node.id.includes('policy') ||
                         node.className && node.className.includes('modal'))) {
                        setTimeout(fixPolicyTabStructure, 200);
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('👀 Mutation observer set up to watch for policy modals');
}

console.log('✅ Policy tabs display fix loaded and active');