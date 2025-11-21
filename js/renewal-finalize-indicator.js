// Renewal Finalize Indicator - Green stripe for completed renewals
console.log('💚 Adding green stripe indicator for finalized renewals...');

(function() {
    // Track finalized renewals - will be loaded from server
    let finalizedRenewals = {};

    // Load finalized status from server
    async function loadFinalizedStatus() {
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001/api/renewal-completions'
                : `http://${window.location.hostname}:3001/api/renewal-completions`;
            const response = await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();
                finalizedRenewals = data;
                console.log('✅ Loaded renewal completions from server');
                return true;
            }
        } catch (error) {
            console.error('Error loading renewal completions:', error);
            // Fall back to localStorage
            finalizedRenewals = JSON.parse(localStorage.getItem('finalizedRenewals') || '{}');
        }
        return false;
    }

    // Save finalized status to server
    async function saveFinalizedStatus(policyNumber, expirationDate, completed) {
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
            } else {
                console.error('Failed to save to server, using localStorage');
                localStorage.setItem('finalizedRenewals', JSON.stringify(finalizedRenewals));
            }
        } catch (error) {
            console.error('Error saving renewal completion:', error);
            // Fall back to localStorage
            localStorage.setItem('finalizedRenewals', JSON.stringify(finalizedRenewals));
        }
    }

    // Wait for renewalsManager to be available
    async function initializeFinalizedIndicators() {
        if (!window.renewalsManager) {
            setTimeout(initializeFinalizedIndicators, 100);
            return;
        }

        // Load completions from server first
        await loadFinalizedStatus();

        const originalGenerateList = window.renewalsManager.generateRenewalsList.bind(window.renewalsManager);

        window.renewalsManager.generateRenewalsList = function(policies) {
            if (policies.length === 0) {
                return '<div class="empty-state"><i class="fas fa-inbox"></i><p>No renewals found for this period</p></div>';
            }

            return policies.map(policy => {
                const policyKey = `${policy.policyNumber}_${policy.expirationDate}`;
                const isFinalized = finalizedRenewals[policyKey] || false;
                const daysUntilExpiration = this.getDaysUntilExpiration(policy.expirationDate);
                const urgencyClass = this.getUrgencyClass(daysUntilExpiration);

                // Add finalized class if this renewal is finalized
                const finalizedClass = isFinalized ? 'finalized-renewal' : '';
                const stripColor = isFinalized ? 'green-stripe' : 'blue-stripe';

                return `
                    <div class="renewal-item ${finalizedClass}"
                         data-policy-key="${policyKey}"
                         onclick="renewalsManager.selectRenewal(${JSON.stringify(policy).replace(/"/g, '&quot;')})">
                        <div class="renewal-stripe ${stripColor}"></div>
                        <div class="renewal-item-content">
                            <div class="renewal-item-header">
                                <div class="renewal-item-info">
                                    <h4>${policy.clientName || 'Unknown Client'}</h4>
                                    <div class="policy-number">Policy #${policy.policyNumber || 'N/A'}</div>
                                </div>
                                <span class="expiration-badge ${urgencyClass}">
                                    ${daysUntilExpiration <= 0 ? 'EXPIRED' : `${daysUntilExpiration} days`}
                                </span>
                            </div>
                            <div class="renewal-item-details">
                                <div class="detail-item">
                                    <i class="fas fa-shield-alt"></i>
                                    <span>${this.getPolicyTypeDisplay(policy.policyType)}</span>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-dollar-sign"></i>
                                    <span>$${(policy.premium || 0).toLocaleString()}/yr</span>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-building"></i>
                                    <span>${policy.carrier || 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-calendar"></i>
                                    <span>${new Date(policy.expirationDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            ${isFinalized ? '<div class="finalized-badge"><i class="fas fa-check-circle"></i> Renewal Finalized</div>' : ''}
                        </div>
                    </div>
                `;
            }).join('');
        };

        // Override updateTaskStatus to track Finalize Renewal checkbox
        const originalUpdateTask = window.renewalsManager.updateTaskStatus.bind(window.renewalsManager);
        window.renewalsManager.updateTaskStatus = function(taskId, checked) {
            console.log('🔄 Task updated:', taskId, 'checked:', checked);

            // Call original function first to update internal state
            if (originalUpdateTask) {
                originalUpdateTask(taskId, checked);
            }

            // Check if this is the Finalize Renewal task (ID 10)
            if (taskId === 10 && checked) {
                // Get current selected renewal
                const selectedPolicy = this.selectedRenewal;
                if (selectedPolicy) {
                    const policyKey = `${selectedPolicy.policyNumber}_${selectedPolicy.expirationDate}`;
                    finalizedRenewals[policyKey] = { completed: true, completedAt: new Date().toISOString() };
                    saveFinalizedStatus(selectedPolicy.policyNumber, selectedPolicy.expirationDate, true);

                    console.log('✅ Renewal finalized:', policyKey);

                    // Refresh the entire renewals list to show the update
                    setTimeout(() => {
                        console.log('🔄 Refreshing renewals list to show finalized status');
                        const renewalsItems = document.getElementById('renewalsItems');
                        if (renewalsItems && this.selectedRenewal) {
                            // Get current policies and re-render
                            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                            const filteredPolicies = this.filterPoliciesByView ?
                                this.filterPoliciesByView(policies) : policies;
                            renewalsItems.innerHTML = this.generateRenewalsList(filteredPolicies);

                            // Re-select the current item
                            const renewalItem = document.querySelector(`[data-policy-key="${policyKey}"]`);
                            if (renewalItem) {
                                renewalItem.classList.add('selected');
                            }
                        }
                    }, 100);
                }
            } else if (taskId === 10 && !checked) {
                // Handle unchecking the finalize task
                const selectedPolicy = this.selectedRenewal;
                if (selectedPolicy) {
                    const policyKey = `${selectedPolicy.policyNumber}_${selectedPolicy.expirationDate}`;
                    delete finalizedRenewals[policyKey];
                    saveFinalizedStatus(selectedPolicy.policyNumber, selectedPolicy.expirationDate, false);

                    console.log('❌ Renewal unfinalized:', policyKey);

                    // Refresh the list
                    setTimeout(() => {
                        const renewalsItems = document.getElementById('renewalsItems');
                        if (renewalsItems) {
                            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                            const filteredPolicies = this.filterPoliciesByView ?
                                this.filterPoliciesByView(policies) : policies;
                            renewalsItems.innerHTML = this.generateRenewalsList(filteredPolicies);

                            // Re-select the current item
                            const renewalItem = document.querySelector(`[data-policy-key="${policyKey}"]`);
                            if (renewalItem) {
                                renewalItem.classList.add('selected');
                            }
                        }
                    }, 100);
                }
            }
        };
    }

    // Start initialization
    initializeFinalizedIndicators();

    // Add CSS for the stripes and finalized status
    const style = document.createElement('style');
    style.textContent = `
        /* Renewal Item Container */
        .renewal-item {
            position: relative;
            padding-left: 8px !important;
            transition: all 0.3s ease;
            overflow: hidden;
        }

        .renewal-item-content {
            position: relative;
            z-index: 1;
        }

        /* Stripe Indicator */
        .renewal-stripe {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 5px;
            transition: all 0.3s ease;
        }

        /* Blue stripe for pending renewals */
        .renewal-stripe.blue-stripe {
            background: linear-gradient(180deg, #2196F3 0%, #1976D2 100%);
        }

        /* Green stripe for finalized renewals */
        .renewal-stripe.green-stripe {
            background: linear-gradient(180deg, #4CAF50 0%, #45a049 100%);
            width: 6px;
            box-shadow: 2px 0 4px rgba(76, 175, 80, 0.3);
        }

        /* Hover and selected states */
        .renewal-item:hover .renewal-stripe.blue-stripe {
            width: 8px;
            background: linear-gradient(180deg, #1976D2 0%, #0D47A1 100%);
        }

        .renewal-item:hover .renewal-stripe.green-stripe {
            width: 10px;
            background: linear-gradient(180deg, #45a049 0%, #388E3C 100%);
        }

        .renewal-item.selected .renewal-stripe {
            width: 100% !important;
            opacity: 0.1;
        }

        .renewal-item.selected .renewal-item-content {
            color: white;
        }

        .renewal-item.selected.finalized-renewal .renewal-item-content h4,
        .renewal-item.selected.finalized-renewal .renewal-item-content .policy-number,
        .renewal-item.selected.finalized-renewal .renewal-item-content .detail-item {
            color: white !important;
        }

        /* Finalized renewal styling */
        .renewal-item.finalized-renewal {
            background: linear-gradient(to right, rgba(76, 175, 80, 0.05) 0%, transparent 50%);
        }

        .renewal-item.finalized-renewal:hover {
            background: linear-gradient(to right, rgba(76, 175, 80, 0.1) 0%, transparent 50%);
        }

        /* Finalized Badge */
        .finalized-badge {
            margin-top: 10px;
            padding: 4px 10px;
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }

        .finalized-badge i {
            font-size: 0.9em;
        }

        /* Visual feedback for renewal items in list */
        .renewal-item.finalized-renewal .renewal-item-header h4::after {
            content: '✓';
            color: #4CAF50;
            margin-left: 10px;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);

    console.log('✅ Green stripe indicator active for finalized renewals');
})();