// Diagnostic Tool - Understanding Task Sharing Issue
console.log('🔍 DIAGNOSING TASK SHARING ISSUE...');

(function() {
    // Log all renewal selections
    let lastSelectedPolicy = null;
    let taskStates = {};

    // Monitor all clicks
    document.addEventListener('click', function(e) {
        // Check if renewal item was clicked
        const renewalItem = e.target.closest('.renewal-item');
        if (renewalItem) {
            // Extract policy info
            const policyNum = renewalItem.querySelector('.policy-number')?.textContent || 'Unknown';
            const clientName = renewalItem.querySelector('h4')?.textContent || 'Unknown';

            console.log('%c🎯 RENEWAL CLICKED', 'background: blue; color: white; padding: 5px;');
            console.log('Policy:', policyNum);
            console.log('Client:', clientName);

            // Store as last selected
            lastSelectedPolicy = policyNum;

            // After a delay, check what tasks are shown
            setTimeout(() => {
                console.log('%c📋 CHECKING TASK STATE', 'background: green; color: white; padding: 5px;');

                // Find all task checkboxes
                const checkboxes = document.querySelectorAll('input[type="checkbox"].task-checkbox, input.task-checkbox, input[onchange*="updateTaskStatus"]');
                console.log(`Found ${checkboxes.length} task checkboxes`);

                checkboxes.forEach((cb, index) => {
                    const taskName = cb.closest('.task-item')?.querySelector('.task-name')?.textContent ||
                                   cb.parentElement?.parentElement?.querySelector('div:nth-child(2)')?.textContent ||
                                   `Task ${index + 1}`;
                    console.log(`  - ${taskName}: ${cb.checked ? '✅ CHECKED' : '⬜ UNCHECKED'}`);
                });

                // Check if these are the same as before
                const currentState = Array.from(checkboxes).map(cb => cb.checked).join(',');
                if (taskStates[lastSelectedPolicy] && taskStates[lastSelectedPolicy] !== currentState) {
                    console.log('%c⚠️ TASK STATE CHANGED!', 'background: orange; color: white; padding: 5px;');
                }
                taskStates[lastSelectedPolicy] = currentState;

                // Check what's in the DOM
                const tabContent = document.getElementById('tabContent');
                if (tabContent) {
                    const dataAttributes = tabContent.querySelectorAll('[data-policy-key], [data-policy], [data-current-policy]');
                    if (dataAttributes.length > 0) {
                        console.log('Found policy-specific data attributes:');
                        dataAttributes.forEach(el => {
                            console.log('  -', el.dataset);
                        });
                    } else {
                        console.log('%c❌ NO POLICY-SPECIFIC DATA ATTRIBUTES FOUND!', 'background: red; color: white; padding: 5px;');
                        console.log('This means tasks are NOT being generated per-policy');
                    }
                }

                // Check if renewalsManager has the right policy
                if (window.renewalsManager) {
                    console.log('RenewalsManager selected policy:', window.renewalsManager.selectedRenewal?.policyNumber);
                }
            }, 500);
        }

        // Monitor checkbox changes
        if (e.target.type === 'checkbox' && (e.target.classList.contains('task-checkbox') || e.target.closest('.task-item'))) {
            console.log('%c☑️ CHECKBOX CHANGED', 'background: purple; color: white; padding: 5px;');
            console.log('For policy:', lastSelectedPolicy);
            console.log('Checkbox checked:', e.target.checked);

            const taskName = e.target.closest('.task-item')?.querySelector('.task-name')?.textContent || 'Unknown task';
            console.log('Task:', taskName);
        }
    }, true);

    // Monitor tab switches
    if (window.renewalsManager) {
        const originalSwitchTab = window.renewalsManager.switchTab;
        window.renewalsManager.switchTab = function(tab) {
            console.log('%c📑 TAB SWITCHED TO:', 'background: #333; color: white; padding: 5px;', tab);

            if (originalSwitchTab) {
                originalSwitchTab.call(this, tab);
            }

            if (tab === 'tasks') {
                setTimeout(() => {
                    console.log('Checking if tasks were refreshed...');
                    const checkboxes = document.querySelectorAll('input[type="checkbox"].task-checkbox');
                    console.log(`Tasks tab now shows ${checkboxes.length} checkboxes`);
                }, 100);
            }
        };
    }

    // Indicator removed per user request

    console.log('%c🚀 DIAGNOSTIC TOOL READY', 'background: green; color: white; padding: 10px; font-size: 16px;');
    console.log('1. Click on different policies');
    console.log('2. Check/uncheck tasks');
    console.log('3. Watch the console for diagnostic info');
})();