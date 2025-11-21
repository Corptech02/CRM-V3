// Fix Renewal Finalize Visual Update - Immediate color change
console.log('🔧 Fixing renewal finalize visual update...');

(function() {
    // Track finalized renewals - will be loaded from server
    let finalizedRenewals = {};

    // Load finalized status from server on page load
    async function loadFinalizedStatus() {
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001/api/renewal-completions'
                : `http://${window.location.hostname}:3001/api/renewal-completions`;
            const response = await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();
                finalizedRenewals = data;
                console.log('✅ Loaded renewal completions from server:', Object.keys(finalizedRenewals).length);

                // Apply styling to existing renewal items
                Object.keys(finalizedRenewals).forEach(policyKey => {
                    const [policyNumber, expirationDate] = policyKey.split('_');
                    updateRenewalVisual(policyNumber, expirationDate, true);
                });
            }
        } catch (error) {
            console.error('Error loading renewal completions:', error);
            // Fall back to localStorage if server is unavailable
            finalizedRenewals = JSON.parse(localStorage.getItem('finalizedRenewals') || '{}');
        }
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
                    completed,
                    tasks: null // Could be expanded to include task details
                })
            });

            if (response.ok) {
                console.log(`✅ Saved renewal completion to server: ${policyKey}`);
                // Also save to localStorage as backup
                localStorage.setItem('finalizedRenewals', JSON.stringify(finalizedRenewals));
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

    // Function to update visual indicator immediately
    function updateRenewalVisual(policyNumber, expirationDate, isFinalized) {
        console.log(`🎨 Updating visual for policy ${policyNumber}, finalized: ${isFinalized}`);

        // Find all renewal items (might be multiple views)
        const allRenewalItems = document.querySelectorAll('.renewal-item');

        allRenewalItems.forEach(item => {
            // Check if this is the right policy
            const itemInfo = item.querySelector('.policy-number');
            if (itemInfo && itemInfo.textContent.includes(policyNumber)) {
                console.log('✅ Found matching renewal item');

                if (isFinalized) {
                    // Add finalized styling
                    item.classList.add('renewal-finalized');
                    item.style.borderLeft = '6px solid #4CAF50';
                    item.style.background = 'linear-gradient(to right, rgba(76, 175, 80, 0.1) 0%, transparent 60%)';

                    // Update any existing stripe
                    const stripe = item.querySelector('.renewal-stripe');
                    if (stripe) {
                        stripe.style.background = 'linear-gradient(180deg, #4CAF50 0%, #45a049 100%)';
                        stripe.style.width = '6px';
                    }

                    // Add checkmark to client name if not present
                    const clientName = item.querySelector('h4');
                    if (clientName && !clientName.querySelector('.finalized-check')) {
                        const checkmark = document.createElement('span');
                        checkmark.className = 'finalized-check';
                        checkmark.style.cssText = 'color: #4CAF50; margin-left: 10px; font-weight: bold;';
                        checkmark.textContent = '✓';
                        clientName.appendChild(checkmark);
                    }
                } else {
                    // Remove finalized styling
                    item.classList.remove('renewal-finalized');
                    item.style.borderLeft = '4px solid #2196F3';
                    item.style.background = '';

                    // Reset stripe
                    const stripe = item.querySelector('.renewal-stripe');
                    if (stripe) {
                        stripe.style.background = 'linear-gradient(180deg, #2196F3 0%, #1976D2 100%)';
                        stripe.style.width = '5px';
                    }

                    // Remove checkmark
                    const checkmark = item.querySelector('.finalized-check');
                    if (checkmark) {
                        checkmark.remove();
                    }
                }

                // Force a repaint
                item.style.display = 'none';
                item.offsetHeight; // Force reflow
                item.style.display = '';
            }
        });
    }

    // Wait for renewalsManager to be ready
    function setupFinalizeTracking() {
        if (!window.renewalsManager) {
            setTimeout(setupFinalizeTracking, 100);
            return;
        }

        console.log('🚀 Setting up finalize tracking');

        // Intercept checkbox changes directly
        document.addEventListener('change', function(e) {
            // Check if this is a task checkbox
            if (e.target.type === 'checkbox' && e.target.className === 'task-checkbox') {
                const taskItem = e.target.closest('.task-item');
                if (taskItem) {
                    const taskName = taskItem.querySelector('.task-name');

                    // Check if this is the Finalize Renewal task
                    if (taskName && taskName.textContent.includes('Finalize Renewal')) {
                        console.log('📋 Finalize Renewal checkbox changed:', e.target.checked);

                        // Get current selected renewal
                        const selectedPolicy = window.renewalsManager?.selectedRenewal;
                        if (selectedPolicy) {
                            const policyKey = `${selectedPolicy.policyNumber}_${selectedPolicy.expirationDate}`;

                            if (e.target.checked) {
                                // Mark as finalized
                                finalizedRenewals[policyKey] = { completed: true, completedAt: new Date().toISOString() };
                                saveFinalizedStatus(selectedPolicy.policyNumber, selectedPolicy.expirationDate, true);
                                updateRenewalVisual(selectedPolicy.policyNumber, selectedPolicy.expirationDate, true);

                                // Show success message
                                const successMsg = document.createElement('div');
                                successMsg.style.cssText = `
                                    position: fixed;
                                    top: 20px;
                                    right: 20px;
                                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                                    color: white;
                                    padding: 15px 25px;
                                    border-radius: 8px;
                                    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
                                    z-index: 10000;
                                    animation: slideIn 0.3s ease;
                                `;
                                successMsg.innerHTML = `
                                    <i class="fas fa-check-circle"></i>
                                    Renewal Finalized for ${selectedPolicy.clientName || selectedPolicy.policyNumber}
                                `;
                                document.body.appendChild(successMsg);

                                setTimeout(() => {
                                    successMsg.style.animation = 'slideOut 0.3s ease';
                                    setTimeout(() => successMsg.remove(), 300);
                                }, 3000);
                            } else {
                                // Mark as not finalized
                                delete finalizedRenewals[policyKey];
                                saveFinalizedStatus(selectedPolicy.policyNumber, selectedPolicy.expirationDate, false);
                                updateRenewalVisual(selectedPolicy.policyNumber, selectedPolicy.expirationDate, false);
                            }
                        }
                    }
                }
            }
        }, true); // Use capture phase

        // Override the generateRenewalsList to include finalized status
        const originalGenerateList = window.renewalsManager.generateRenewalsList.bind(window.renewalsManager);
        window.renewalsManager.generateRenewalsList = function(policies) {
            const html = originalGenerateList(policies);

            // After generating, apply finalized styling
            setTimeout(() => {
                policies.forEach(policy => {
                    const policyKey = `${policy.policyNumber}_${policy.expirationDate}`;
                    if (finalizedRenewals[policyKey]) {
                        updateRenewalVisual(policy.policyNumber, policy.expirationDate, true);
                    }
                });
            }, 100);

            return html;
        };
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }

        /* Enhanced finalized renewal styling */
        .renewal-item.renewal-finalized {
            border-left: 6px solid #4CAF50 !important;
            background: linear-gradient(to right, rgba(76, 175, 80, 0.1) 0%, transparent 60%) !important;
            transition: all 0.3s ease;
        }

        .renewal-item.renewal-finalized:hover {
            background: linear-gradient(to right, rgba(76, 175, 80, 0.15) 0%, transparent 60%) !important;
            border-left-width: 8px !important;
        }

        /* Pulse animation for newly finalized items */
        .renewal-item.renewal-finalized {
            animation: pulseGreen 0.6s ease;
        }

        @keyframes pulseGreen {
            0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
            50% { box-shadow: 0 0 20px 10px rgba(76, 175, 80, 0.2); }
            100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }

        /* Make the border more prominent */
        .renewal-item {
            border-left: 4px solid #2196F3 !important;
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    // Load completions from server first, then start setup
    loadFinalizedStatus().then(() => {
        setupFinalizeTracking();
        console.log('✅ Renewal finalize visual update fix active with server persistence');
    });
})();