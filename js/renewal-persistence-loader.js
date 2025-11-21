// Global renewal completion persistence loader
console.log('🔄 Renewal persistence loader initializing...');

(function() {
    // Global object to store completions
    window.renewalCompletions = {};

    // Function to load completions from server
    async function loadRenewalCompletions() {
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001/api/renewal-completions'
                : `http://${window.location.hostname}:3001/api/renewal-completions`;

            console.log('📥 Loading renewal completions from:', apiUrl);

            const response = await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();
                window.renewalCompletions = data;

                // Also store in window.finalizedRenewals for compatibility
                window.finalizedRenewals = data;

                console.log(`✅ Loaded ${Object.keys(data).length} renewal completions from server`);

                // Apply visual indicators to any existing renewal items
                applyCompletionVisuals();

                return data;
            } else {
                console.error('Failed to load completions:', response.status);
            }
        } catch (error) {
            console.error('Error loading renewal completions:', error);
            // Fall back to localStorage
            const localData = localStorage.getItem('finalizedRenewals');
            if (localData) {
                window.renewalCompletions = JSON.parse(localData);
                window.finalizedRenewals = window.renewalCompletions;
                console.log('📦 Loaded from localStorage as fallback');
            }
        }
        return window.renewalCompletions;
    }

    // Function to save completion to server
    window.saveRenewalCompletion = async function(policyNumber, expirationDate, completed = true) {
        const policyKey = `${policyNumber}_${expirationDate}`;

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001/api/renewal-completions'
                : `http://${window.location.hostname}:3001/api/renewal-completions`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    policyKey,
                    policyNumber,
                    expirationDate,
                    completed
                })
            });

            if (response.ok) {
                console.log(`✅ Saved renewal completion to server: ${policyKey}`);
                // Update local cache
                if (completed) {
                    window.renewalCompletions[policyKey] = {
                        completed: true,
                        completedAt: new Date().toISOString()
                    };
                } else {
                    delete window.renewalCompletions[policyKey];
                }
                // Update compatibility object
                window.finalizedRenewals = window.renewalCompletions;

                // Apply visual update
                applyCompletionVisuals();

                return true;
            } else {
                console.error('Failed to save to server');
                return false;
            }
        } catch (error) {
            console.error('Error saving renewal completion:', error);
            // Fall back to localStorage
            localStorage.setItem('finalizedRenewals', JSON.stringify(window.renewalCompletions));
            return false;
        }
    };

    // Function to check if a renewal is completed
    window.isRenewalCompleted = function(policyNumber, expirationDate) {
        const policyKey = `${policyNumber}_${expirationDate}`;
        return !!(window.renewalCompletions[policyKey] ||
                  (window.finalizedRenewals && window.finalizedRenewals[policyKey]));
    };

    // Function to apply visual indicators
    function applyCompletionVisuals() {
        // Apply to renewal items in renewals tab
        const renewalItems = document.querySelectorAll('.renewal-item');
        renewalItems.forEach(item => {
            const policyKey = item.getAttribute('data-policy-key');
            if (policyKey && window.renewalCompletions[policyKey]) {
                if (!item.classList.contains('renewal-finalized')) {
                    item.classList.add('renewal-finalized');
                    item.style.borderLeft = '6px solid #4CAF50';
                    item.style.background = 'linear-gradient(to right, rgba(76, 175, 80, 0.1) 0%, transparent 60%)';

                    // Update stripe color if exists
                    const stripe = item.querySelector('.renewal-stripe');
                    if (stripe) {
                        stripe.style.background = 'linear-gradient(180deg, #4CAF50 0%, #45a049 100%)';
                        stripe.style.width = '6px';
                    }

                    console.log(`Applied completion visual to ${policyKey}`);
                }
            }
        });

        // Apply to task checkboxes if in renewal details
        if (window.renewalsManager && window.renewalsManager.selectedRenewal) {
            const selectedPolicy = window.renewalsManager.selectedRenewal;
            const policyKey = `${selectedPolicy.policyNumber}_${selectedPolicy.expirationDate}`;

            if (window.renewalCompletions[policyKey]) {
                // Check the finalize task checkbox
                const finalizeCheckbox = document.querySelector('input[type="checkbox"][onclick*="taskId: 10"]');
                if (finalizeCheckbox && !finalizeCheckbox.checked) {
                    finalizeCheckbox.checked = true;
                    console.log('✅ Checked finalize renewal task');
                }
            }
        }
    }

    // Load on page ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOM loaded, loading renewal completions...');
            loadRenewalCompletions();
        });
    } else {
        console.log('📄 Page ready, loading renewal completions...');
        loadRenewalCompletions();
    }

    // Re-apply visuals when renewals tab is shown
    document.addEventListener('click', (e) => {
        if (e.target && e.target.textContent === 'Policy Renewals') {
            setTimeout(() => {
                console.log('🔄 Renewals tab opened, applying completion visuals');
                applyCompletionVisuals();
            }, 500);
        }
    });

    // Listen for renewal list updates
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.target.id === 'renewalsItems' ||
                mutation.target.className?.includes('renewal')) {
                applyCompletionVisuals();
                break;
            }
        }
    });

    // Start observing when ready
    setTimeout(() => {
        const renewalsContainer = document.getElementById('renewalsItems');
        if (renewalsContainer) {
            observer.observe(renewalsContainer, {
                childList: true,
                subtree: true
            });
            console.log('👁️ Watching for renewal list changes');
        }
    }, 2000);

    console.log('✅ Renewal persistence loader ready');
})();