// Add green highlight to renewal card when "Finalize Renewal" is checked
console.log('🟢 Adding green highlight for finalized renewals...');

(function() {
    // Add CSS for green finalized state
    const style = document.createElement('style');
    style.textContent = `
        /* Green highlight for finalized renewals */
        .renewal-card.finalized {
            border-left: 5px solid #4CAF50 !important;
            background: linear-gradient(to right, rgba(76, 175, 80, 0.1), transparent) !important;
        }

        .renewal-card.finalized .status-badge {
            background: #4CAF50 !important;
            color: white !important;
        }

        .renewal-card.finalized::before {
            content: '✓';
            position: absolute;
            top: 10px;
            right: 10px;
            width: 24px;
            height: 24px;
            background: #4CAF50;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 16px;
        }

        /* Ensure position relative for the checkmark */
        .renewal-card {
            position: relative;
        }
    `;
    document.head.appendChild(style);

    // Function to check if renewal is finalized
    function isRenewalFinalized(policyId) {
        // Check all possible storage locations for finalized status
        const policyData = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const policy = policyData.find(p => p.id === policyId);

        if (!policy) return false;

        const policyNumber = policy.policyNumber || policy.number || policyId;

        // Check task storage for this policy
        const storageKey = `renewalTasks_${policyNumber}`;
        const tasks = JSON.parse(localStorage.getItem(storageKey) || '[]');

        // Check if "Finalize Renewal" task (ID 10) is completed
        const finalizeTask = tasks.find(t => t.id === 10);
        if (finalizeTask && finalizeTask.completed && finalizeTask.completedAt) {
            return true;
        }

        // Also check legacy finalized storage
        const finalized = JSON.parse(localStorage.getItem('finalizedRenewals') || '[]');
        if (finalized.includes(policyId)) {
            return true;
        }

        return false;
    }

    // Function to update renewal card appearance
    function updateRenewalCards() {
        document.querySelectorAll('.renewal-card').forEach(card => {
            const policyId = card.id ? card.id.replace('renewal-card-', '') : null;
            if (policyId) {
                if (isRenewalFinalized(policyId)) {
                    card.classList.add('finalized');

                    // Change status badge text from "upcoming" to "complete"
                    const statusBadge = card.querySelector('.status-badge');
                    if (statusBadge) {
                        if (statusBadge.textContent.toLowerCase().includes('upcoming')) {
                            statusBadge.textContent = 'Complete';
                        }
                    }

                    console.log(`🟢 Card ${policyId} marked as finalized`);
                } else {
                    card.classList.remove('finalized');

                    // Restore original status if not finalized
                    const statusBadge = card.querySelector('.status-badge');
                    if (statusBadge && statusBadge.textContent === 'Complete') {
                        statusBadge.textContent = 'Upcoming';
                    }
                }
            }
        });
    }

    // Override toggleTask to update cards when Finalize Renewal is checked
    const originalToggleTask = window.toggleTask;
    window.toggleTask = function(taskId) {
        // Call original function
        if (originalToggleTask) {
            originalToggleTask.call(this, taskId);
        }

        // If this is the Finalize Renewal task (ID 10), update cards
        if (taskId === 10) {
            setTimeout(() => {
                updateRenewalCards();
                console.log('🟢 Updated renewal cards after finalize toggle');
            }, 100);
        }
    };

    // Update cards when renewal view is loaded
    const originalLoadRenewals = window.renewalsManager?.loadRenewalsView;
    if (originalLoadRenewals) {
        window.renewalsManager.loadRenewalsView = function() {
            // Call original
            originalLoadRenewals.call(this);

            // Update card appearances
            setTimeout(updateRenewalCards, 100);
        };
    }

    // Update cards when switching views
    const originalSwitchView = window.renewalsManager?.switchView;
    if (originalSwitchView) {
        window.renewalsManager.switchView = function(view) {
            // Call original
            originalSwitchView.call(this, view);

            // Update card appearances
            setTimeout(updateRenewalCards, 100);
        };
    }

    // Override renderMonthView to add finalized class
    const originalRenderMonth = window.renderMonthView;
    if (originalRenderMonth) {
        window.renderMonthView = function(policies) {
            let html = originalRenderMonth.call(this, policies);

            // Update cards after render
            setTimeout(updateRenewalCards, 100);

            return html;
        };
    }

    // Override renderYearView to add finalized class
    const originalRenderYear = window.renderYearView;
    if (originalRenderYear) {
        window.renderYearView = function(policies) {
            let html = originalRenderYear.call(this, policies);

            // Update cards after render
            setTimeout(updateRenewalCards, 100);

            return html;
        };
    }

    // Monitor DOM for renewal card additions
    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;

        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList) {
                        if (node.classList.contains('renewal-card') ||
                            node.querySelector?.('.renewal-card')) {
                            shouldUpdate = true;
                        }
                    }
                });
            }
        });

        if (shouldUpdate) {
            setTimeout(updateRenewalCards, 100);
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also update when profile is closed (going back to list)
    window.closeRenewalProfile = function() {
        const renewalProfile = document.getElementById('renewalProfile');
        const listContainer = document.getElementById('renewalListContainer');

        if (renewalProfile) {
            renewalProfile.style.display = 'none';
            renewalProfile.innerHTML = '';
        }

        if (listContainer) {
            listContainer.style.width = '100%';
        }

        // Update cards when returning to list
        setTimeout(updateRenewalCards, 100);
    };

    // Initial update
    setTimeout(updateRenewalCards, 500);

    // Periodic update to catch any changes
    setInterval(updateRenewalCards, 2000);

    console.log('✅ Green highlight for finalized renewals is active');
})();