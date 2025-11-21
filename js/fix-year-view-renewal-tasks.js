// FIX: Year View Annual Renewal Calendar - Separate Tasks Per Policy
console.log('🎯 FIXING Year View Renewal Profile Task Sharing...');

(function() {
    // Storage for each policy's task states in year view
    const YEAR_VIEW_TASKS_KEY = 'yearViewRenewalTasks';
    let yearViewTaskStates = JSON.parse(localStorage.getItem(YEAR_VIEW_TASKS_KEY) || '{}');

    // Currently displayed policy in renewal profile
    let currentProfilePolicy = null;

    // Save task states
    function saveTaskStates() {
        localStorage.setItem(YEAR_VIEW_TASKS_KEY, JSON.stringify(yearViewTaskStates));
        console.log('💾 Saved year view task states');
    }

    // Initialize tasks for a policy if not exists
    function initializePolicyTasks(policyNumber) {
        if (!yearViewTaskStates[policyNumber]) {
            console.log(`📝 Creating fresh tasks for policy: ${policyNumber}`);
            yearViewTaskStates[policyNumber] = {
                task1: false,
                task2: false,
                task3: false,
                task4: false,
                task5: false,
                task6: false,
                task7: false,
                task8: false,
                task9: false,
                task10: false
            };
            saveTaskStates();
        }
        return yearViewTaskStates[policyNumber];
    }

    // Monitor for renewal profile opening
    function detectRenewalProfile() {
        // Look for the renewal profile container
        const profileContainers = [
            document.querySelector('.renewal-details'),
            document.querySelector('#renewalDetails'),
            document.querySelector('[class*="renewal-profile"]'),
            document.querySelector('[class*="renewal-detail"]')
        ].filter(Boolean);

        if (profileContainers.length > 0) {
            const container = profileContainers[0];

            // Extract policy info from the profile
            const policyNumElement = container.querySelector('p:has-text("Policy #"), [class*="policy-number"], span:contains("#")');
            const clientNameElement = container.querySelector('h3, h4, [class*="client-name"]');

            if (policyNumElement || clientNameElement) {
                const policyText = policyNumElement?.textContent || '';
                const policyMatch = policyText.match(/[#:]?\s*(\d+)/);
                const policyNumber = policyMatch ? policyMatch[1] : null;

                if (policyNumber && policyNumber !== currentProfilePolicy) {
                    console.log(`🔄 Renewal Profile opened for policy: ${policyNumber}`);
                    currentProfilePolicy = policyNumber;
                    updateTaskCheckboxes(policyNumber);
                }
            }
        }
    }

    // Update all task checkboxes based on stored state
    function updateTaskCheckboxes(policyNumber) {
        console.log(`📋 Loading tasks for policy: ${policyNumber}`);

        const tasks = initializePolicyTasks(policyNumber);

        // Find all checkboxes in the renewal profile
        const checkboxes = document.querySelectorAll(`
            input[type="checkbox"]:not(.policy-specific-handled),
            .renewal-details input[type="checkbox"],
            #renewalDetails input[type="checkbox"],
            .task-checkbox,
            [class*="task"] input[type="checkbox"]
        `);

        console.log(`Found ${checkboxes.length} checkboxes to update`);

        checkboxes.forEach((checkbox, index) => {
            const taskKey = `task${index + 1}`;

            // Mark as handled
            checkbox.classList.add('policy-specific-handled');
            checkbox.dataset.yearViewPolicy = policyNumber;
            checkbox.dataset.yearViewTask = taskKey;

            // Set the checked state from storage
            checkbox.checked = tasks[taskKey] || false;

            console.log(`  Task ${index + 1}: ${checkbox.checked ? '☑️' : '⬜'}`);

            // Update visual state
            updateTaskVisual(checkbox, checkbox.checked);
        });
    }

    // Update visual state of task row
    function updateTaskVisual(checkbox, checked) {
        const row = checkbox.closest('div, tr, .task-item, [class*="task"]');
        if (row) {
            if (checked) {
                row.style.opacity = '0.7';
                row.style.background = 'rgba(76, 175, 80, 0.1)';
                const taskText = row.querySelector('.task-name, td:nth-child(2), div:nth-child(2)');
                if (taskText) {
                    taskText.style.textDecoration = 'line-through';
                }
            } else {
                row.style.opacity = '1';
                row.style.background = '';
                const taskText = row.querySelector('.task-name, td:nth-child(2), div:nth-child(2)');
                if (taskText) {
                    taskText.style.textDecoration = '';
                }
            }
        }
    }

    // Handle checkbox changes
    document.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox' && (
            e.target.classList.contains('policy-specific-handled') ||
            e.target.closest('.renewal-details, #renewalDetails, [class*="renewal"]')
        )) {
            const policyNumber = e.target.dataset.yearViewPolicy || currentProfilePolicy;
            const taskKey = e.target.dataset.yearViewTask;

            if (policyNumber && taskKey) {
                console.log(`✅ Task ${taskKey} changed to ${e.target.checked} for policy ${policyNumber}`);

                // Update storage
                if (!yearViewTaskStates[policyNumber]) {
                    yearViewTaskStates[policyNumber] = {};
                }
                yearViewTaskStates[policyNumber][taskKey] = e.target.checked;
                saveTaskStates();

                // Update visual
                updateTaskVisual(e.target, e.target.checked);

                // Special handling for task 10 (Finalize Renewal)
                if (taskKey === 'task10' && e.target.checked) {
                    console.log('🌟 Finalize Renewal checked!');
                    // Update the policy box in year view calendar
                    updateYearViewPolicyBox(policyNumber, true);
                }
            }
        }
    }, true);

    // Update policy box in year view calendar
    function updateYearViewPolicyBox(policyNumber, finalized) {
        // Find policy boxes in the calendar
        const policyBoxes = document.querySelectorAll('.policy-item, [class*="policy"], .renewal-item');

        policyBoxes.forEach(box => {
            const text = box.textContent;
            if (text && text.includes(policyNumber)) {
                if (finalized) {
                    box.style.borderLeft = '5px solid #4CAF50';
                    box.style.background = 'linear-gradient(to right, rgba(76, 175, 80, 0.1), transparent)';
                    if (!box.querySelector('.finalized-indicator')) {
                        const indicator = document.createElement('span');
                        indicator.className = 'finalized-indicator';
                        indicator.style.cssText = 'color: #4CAF50; margin-left: 5px; font-weight: bold;';
                        indicator.textContent = '✓';
                        box.appendChild(indicator);
                    }
                } else {
                    box.style.borderLeft = '';
                    box.style.background = '';
                    const indicator = box.querySelector('.finalized-indicator');
                    if (indicator) indicator.remove();
                }
            }
        });
    }

    // Monitor for policy clicks in year view
    document.addEventListener('click', function(e) {
        // Check if clicked on a policy in the calendar
        const policyElement = e.target.closest('.policy-item, [onclick*="selectRenewal"], [class*="policy"]');

        if (policyElement) {
            console.log('📅 Policy clicked in year view calendar');

            // Wait for the renewal profile to load
            setTimeout(() => {
                detectRenewalProfile();
            }, 300);
        }

        // Check for tab switches
        if (e.target.textContent === 'Tasks' || e.target.classList.contains('tab-btn')) {
            setTimeout(() => {
                detectRenewalProfile();
            }, 200);
        }
    }, true);

    // Monitor DOM changes for renewal profile loading
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        // Check if renewal profile was added
                        if (node.classList && (
                            node.classList.contains('renewal-details') ||
                            node.id === 'renewalDetails' ||
                            node.querySelector?.('.renewal-details, #renewalDetails')
                        )) {
                            console.log('🔍 Renewal profile detected via DOM mutation');
                            setTimeout(() => {
                                detectRenewalProfile();
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

    // Override renewalsManager if available
    function overrideRenewalManager() {
        if (window.renewalsManager) {
            console.log('🔧 Overriding renewalsManager for year view');

            const originalSelectRenewal = window.renewalsManager.selectRenewal;
            window.renewalsManager.selectRenewal = function(policy) {
                console.log('🎯 Year view policy selected:', policy.policyNumber);

                // Store current policy
                currentProfilePolicy = policy.policyNumber;

                // Call original
                if (originalSelectRenewal) {
                    originalSelectRenewal.call(this, policy);
                }

                // Update tasks after a delay
                setTimeout(() => {
                    updateTaskCheckboxes(policy.policyNumber);
                }, 200);
            };
        } else {
            setTimeout(overrideRenewalManager, 100);
        }
    }

    overrideRenewalManager();

    // Indicator removed per user request

    console.log('✅ Year View Renewal Tasks are now SEPARATE per policy!');
})();