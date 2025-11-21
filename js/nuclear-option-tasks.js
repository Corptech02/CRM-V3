// NUCLEAR OPTION - Complete Task Isolation Per Policy
console.log('☢️ NUCLEAR OPTION: Complete task isolation per policy');

(function() {
    // Master storage
    const NUCLEAR_KEY = 'nuclearTaskStates';
    let nuclearStorage = {};

    // Try to load existing
    try {
        nuclearStorage = JSON.parse(localStorage.getItem(NUCLEAR_KEY) || '{}');
    } catch(e) {
        nuclearStorage = {};
    }

    // Save function
    function saveNuclear() {
        localStorage.setItem(NUCLEAR_KEY, JSON.stringify(nuclearStorage));
    }

    // Track what policy we're viewing
    let lastKnownPolicy = null;

    // Get policy number from anywhere on page
    function findPolicyNumber() {
        // Method 1: Direct text search
        const pageText = document.body.innerText || document.body.textContent || '';
        const policyMatch = pageText.match(/Policy #:\s*(\d{9,10})/);
        if (policyMatch) return policyMatch[1];

        // Method 2: Search specific elements
        const elements = document.querySelectorAll('p, div, span, td, th');
        for (let el of elements) {
            const text = el.textContent || '';
            if (text.includes('Policy #:')) {
                const match = text.match(/(\d{9,10})/);
                if (match) return match[1];
            }
        }

        return null;
    }

    // COMPLETELY RESET all checkboxes
    function nuclearReset(policyNumber) {
        console.log(`☢️ NUCLEAR RESET for policy: ${policyNumber}`);

        // Find EVERY checkbox on the page
        const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
        console.log(`Found ${allCheckboxes.length} total checkboxes on page`);

        // Filter to only task-related checkboxes
        const taskCheckboxes = [];
        allCheckboxes.forEach(cb => {
            // Check if it's near task-related content
            const parent = cb.parentElement;
            const grandParent = parent?.parentElement;
            const greatGrandParent = grandParent?.parentElement;

            const nearbyText = (
                (parent?.textContent || '') +
                (grandParent?.textContent || '') +
                (greatGrandParent?.textContent || '')
            ).toLowerCase();

            // If it's near task/renewal related text, it's probably a task checkbox
            if (nearbyText.includes('pending') ||
                nearbyText.includes('task') ||
                nearbyText.includes('renewal') ||
                nearbyText.includes('request') ||
                nearbyText.includes('received') ||
                nearbyText.includes('create') ||
                nearbyText.includes('send') ||
                nearbyText.includes('finalize')) {
                taskCheckboxes.push(cb);
            }
        });

        console.log(`Identified ${taskCheckboxes.length} task checkboxes`);

        // Get or create state for this policy
        if (!nuclearStorage[policyNumber]) {
            console.log(`Creating fresh state for ${policyNumber}`);
            nuclearStorage[policyNumber] = {};
            for (let i = 0; i < 10; i++) {
                nuclearStorage[policyNumber][`task${i}`] = false;
            }
        }

        const policyState = nuclearStorage[policyNumber];

        // Apply the state
        taskCheckboxes.forEach((cb, index) => {
            const taskKey = `task${index}`;
            const shouldBeChecked = policyState[taskKey] === true;

            // FORCE the state
            cb.checked = shouldBeChecked;

            // Mark it
            cb.setAttribute('data-nuclear-policy', policyNumber);
            cb.setAttribute('data-nuclear-task', taskKey);

            console.log(`  Task ${index}: ${shouldBeChecked ? '☑️ CHECKED' : '⬜ UNCHECKED'}`);
        });

        saveNuclear();
    }

    // Monitor for ANY checkbox change
    document.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
            const policy = e.target.getAttribute('data-nuclear-policy') || lastKnownPolicy;
            const task = e.target.getAttribute('data-nuclear-task');

            if (policy && task) {
                console.log(`💾 Saving: ${policy} / ${task} = ${e.target.checked}`);

                if (!nuclearStorage[policy]) {
                    nuclearStorage[policy] = {};
                }
                nuclearStorage[policy][task] = e.target.checked;
                saveNuclear();
            }
        }
    }, true);

    // MAIN LOOP - Check every 500ms
    setInterval(() => {
        const currentPolicy = findPolicyNumber();

        if (currentPolicy && currentPolicy !== lastKnownPolicy) {
            console.log(`🔄 POLICY SWITCH DETECTED: ${lastKnownPolicy} → ${currentPolicy}`);
            lastKnownPolicy = currentPolicy;

            // NUCLEAR RESET
            setTimeout(() => {
                nuclearReset(currentPolicy);
            }, 100);
        }
    }, 500);

    // Also monitor clicks
    document.addEventListener('click', function() {
        setTimeout(() => {
            const policy = findPolicyNumber();
            if (policy && policy !== lastKnownPolicy) {
                console.log(`🖱️ Click triggered policy change: ${policy}`);
                lastKnownPolicy = policy;
                nuclearReset(policy);
            }
        }, 300);
    }, true);

    // Indicator removed per user request

    console.log('☢️ NUCLEAR OPTION ACTIVE - Tasks are now COMPLETELY ISOLATED per policy!');
})();