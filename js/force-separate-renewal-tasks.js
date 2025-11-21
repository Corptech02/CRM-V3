// FORCE Separate Renewal Tasks - Most Aggressive Fix
console.log('🔨 FORCING separate Renewal Tasks Checklist per policy...');

(function() {
    // Storage for each policy's checkbox states
    const STORAGE_KEY = 'forcedSeparateRenewalTasks';
    let taskDatabase = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

    // Track current policy being viewed
    let currentPolicyNumber = null;
    let checkboxStates = {};

    // Save task states
    function saveTaskStates() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(taskDatabase));
        console.log('💾 Saved task states:', taskDatabase);
    }

    // Extract policy number from the Policy Information section
    function getCurrentPolicyNumber() {
        // Look for Policy # in the renewal profile
        const policyElements = [
            ...document.querySelectorAll('p'),
            ...document.querySelectorAll('div'),
            ...document.querySelectorAll('span')
        ];

        for (let elem of policyElements) {
            const text = elem.textContent;
            if (text && text.includes('Policy #:')) {
                const match = text.match(/Policy #:\s*(\d+)/);
                if (match) {
                    return match[1];
                }
            }
        }

        // Alternative: Look for policy number pattern
        const profileText = document.querySelector('.renewal-details, #renewalDetails, [id*="renewal"]')?.textContent || '';
        const policyMatch = profileText.match(/\b(\d{9,10})\b/); // Match 9-10 digit numbers
        return policyMatch ? policyMatch[1] : null;
    }

    // Get all checkboxes in the Renewal Tasks Checklist
    function getRenewalCheckboxes() {
        // Find checkboxes near "Renewal Tasks Checklist" text
        const checkboxes = [];

        // Method 1: Find all checkboxes in renewal area
        const renewalContainers = document.querySelectorAll('.renewal-details, #renewalDetails, [class*="renewal"]');
        renewalContainers.forEach(container => {
            const boxes = container.querySelectorAll('input[type="checkbox"]');
            boxes.forEach(box => checkboxes.push(box));
        });

        // Method 2: Find checkboxes near task-related elements
        document.querySelectorAll('.task-item input[type="checkbox"], .task-checkbox, input[type="checkbox"][onchange*="Task"]').forEach(box => {
            if (!checkboxes.includes(box)) {
                checkboxes.push(box);
            }
        });

        // Method 3: Find checkboxes with specific patterns
        document.querySelectorAll('input[type="checkbox"]').forEach(box => {
            const parent = box.closest('[class*="task"], [class*="renewal"]');
            if (parent && !checkboxes.includes(box)) {
                checkboxes.push(box);
            }
        });

        return checkboxes;
    }

    // FORCE reset all checkboxes to a specific state
    function forceCheckboxState(policyNumber) {
        console.log(`🔄 FORCING checkbox state for policy: ${policyNumber}`);

        const checkboxes = getRenewalCheckboxes();
        console.log(`Found ${checkboxes.length} checkboxes to reset`);

        // Get saved state for this policy (or create new)
        if (!taskDatabase[policyNumber]) {
            console.log(`📝 Creating new checkbox state for policy ${policyNumber}`);
            taskDatabase[policyNumber] = {
                box1: false, box2: false, box3: false, box4: false, box5: false,
                box6: false, box7: false, box8: false, box9: false, box10: false
            };
            saveTaskStates();
        }

        const savedState = taskDatabase[policyNumber];

        // FORCE each checkbox to the saved state
        checkboxes.forEach((checkbox, index) => {
            const boxKey = `box${index + 1}`;
            const shouldBeChecked = savedState[boxKey] || false;

            // FORCE the checkbox state
            checkbox.checked = shouldBeChecked;

            // Add tracking attributes
            checkbox.setAttribute('data-policy-tracked', policyNumber);
            checkbox.setAttribute('data-box-index', boxKey);

            // Visual feedback
            const parent = checkbox.closest('div, tr, .task-item');
            if (parent) {
                if (shouldBeChecked) {
                    parent.style.opacity = '0.7';
                    parent.style.background = 'rgba(76, 175, 80, 0.1)';
                } else {
                    parent.style.opacity = '1';
                    parent.style.background = '';
                }
            }

            console.log(`  Checkbox ${index + 1}: ${shouldBeChecked ? '☑️' : '⬜'}`);
        });
    }

    // Monitor for policy changes
    function detectPolicyChange() {
        const newPolicyNumber = getCurrentPolicyNumber();

        if (newPolicyNumber && newPolicyNumber !== currentPolicyNumber) {
            console.log(`📋 POLICY CHANGED: ${currentPolicyNumber} → ${newPolicyNumber}`);
            currentPolicyNumber = newPolicyNumber;

            // FORCE immediate checkbox reset
            setTimeout(() => {
                forceCheckboxState(newPolicyNumber);
            }, 100);
        }
    }

    // Intercept checkbox changes
    document.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
            const policyNumber = e.target.getAttribute('data-policy-tracked') || currentPolicyNumber;
            const boxIndex = e.target.getAttribute('data-box-index');

            if (policyNumber) {
                // Determine box index if not set
                let index = boxIndex;
                if (!index) {
                    const allBoxes = getRenewalCheckboxes();
                    const position = allBoxes.indexOf(e.target);
                    if (position >= 0) {
                        index = `box${position + 1}`;
                    }
                }

                if (index) {
                    console.log(`✅ Saving: Policy ${policyNumber}, ${index} = ${e.target.checked}`);

                    // Update storage
                    if (!taskDatabase[policyNumber]) {
                        taskDatabase[policyNumber] = {};
                    }
                    taskDatabase[policyNumber][index] = e.target.checked;
                    saveTaskStates();
                }
            }
        }
    }, true);

    // Monitor clicks on policies
    document.addEventListener('click', function(e) {
        // Check if clicked on a policy in the calendar or list
        const clickTargets = [
            '.policy-item',
            '.renewal-item',
            '[onclick*="renewal"]',
            '[class*="policy"]'
        ];

        let isPolicyClick = false;
        clickTargets.forEach(selector => {
            if (e.target.closest(selector)) {
                isPolicyClick = true;
            }
        });

        if (isPolicyClick) {
            console.log('🎯 Policy clicked, waiting for profile to load...');

            // Check for policy change multiple times
            const checkIntervals = [100, 300, 500, 800, 1200];
            checkIntervals.forEach(delay => {
                setTimeout(detectPolicyChange, delay);
            });
        }
    }, true);

    // Monitor DOM mutations
    const observer = new MutationObserver(function(mutations) {
        // Check if Policy Information changed
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const target = mutation.target;
                if (target.textContent && target.textContent.includes('Policy #:')) {
                    console.log('📝 Policy Information changed detected');
                    setTimeout(detectPolicyChange, 100);
                }
            }
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Periodic check (failsafe)
    setInterval(() => {
        const currentPolicy = getCurrentPolicyNumber();
        if (currentPolicy && currentPolicy !== currentPolicyNumber) {
            detectPolicyChange();
        }
    }, 1000);

    // Override renewalsManager if available
    if (window.renewalsManager) {
        const original = window.renewalsManager.selectRenewal;
        window.renewalsManager.selectRenewal = function(policy) {
            console.log('🎯 renewalsManager.selectRenewal called:', policy.policyNumber);

            if (original) {
                original.call(this, policy);
            }

            // Force update after selection
            currentPolicyNumber = policy.policyNumber;
            setTimeout(() => {
                forceCheckboxState(policy.policyNumber);
            }, 200);
        };
    }

    // Indicator removed per user request

    console.log('⚡ FORCED separation active! Each policy now has completely separate task checkboxes!');
})();