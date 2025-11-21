// Fix Policy Refresh - Only handles refreshing policy displays when updated
console.log('Applying policy refresh fixes...');

// Function to refresh policy displays after changes
window.refreshAllPolicyDisplays = function() {
    console.log('Refreshing all policy displays...');

    // Refresh leads view if visible
    const leadsView = document.querySelector('.leads-view');
    if (leadsView) {
        console.log('Refreshing leads view...');
        if (window.loadLeadsView) {
            window.loadLeadsView();
        }
    }

    // Refresh clients view if visible
    const clientsView = document.querySelector('.clients-view');
    if (clientsView) {
        console.log('Refreshing clients view...');
        if (window.loadClientsView) {
            window.loadClientsView();
        }
    }

    // Refresh policies view if visible
    const policiesView = document.querySelector('.policies-view');
    if (policiesView) {
        console.log('Refreshing policies view...');
        if (window.loadPoliciesView) {
            window.loadPoliciesView();
        }
    }
};

// Enhanced save policy that properly saves premium and win/loss
window.enhancedSavePolicyData = function() {
    console.log('Enhanced save policy data called');

    // Get the modal
    const modal = document.getElementById('policyModal');
    if (!modal) {
        console.error('Policy modal not found');
        return false;
    }

    // Gather all form data
    const policyData = {
        id: window.editingPolicyId || Date.now().toString(),
        policyNumber: document.getElementById('policyNumber')?.value || '',
        policyType: document.getElementById('policyType')?.value || '',
        type: document.getElementById('policyType')?.value || '', // Also store as 'type'
        carrier: document.getElementById('carrier')?.value || '',
        status: document.getElementById('policyStatus')?.value || 'active',
        effectiveDate: document.getElementById('effectiveDate')?.value || '',
        expirationDate: document.getElementById('expirationDate')?.value || '',

        // Win/Loss status - check multiple possible field IDs
        winLoss: document.getElementById('winLossStatus')?.value ||
                 document.getElementById('winLoss')?.value ||
                 document.querySelector('select[name="winLoss"]')?.value ||
                 'pending',

        // Store premium in multiple locations for compatibility
        financial: {},

        // Insured information
        insured: {
            'Name/Business Name': document.getElementById('insuredName')?.value || '',
            'Primary Named Insured': document.getElementById('insuredName')?.value || '',
            'Address': document.getElementById('insuredAddress')?.value || '',
            'City': document.getElementById('insuredCity')?.value || '',
            'State': document.getElementById('insuredState')?.value || '',
            'ZIP': document.getElementById('insuredZip')?.value || ''
        }
    };

    // Get premium value from various possible field IDs
    let premiumValue = document.getElementById('annualPremium')?.value ||
                      document.getElementById('premium')?.value ||
                      document.querySelector('input[name="premium"]')?.value ||
                      document.querySelector('input[name="annualPremium"]')?.value ||
                      '0';

    // Clean premium value (remove $ and commas)
    premiumValue = String(premiumValue).replace(/[$,]/g, '');

    // Store premium in all possible locations
    policyData.financial['Annual Premium'] = premiumValue;
    policyData.financial['Premium'] = premiumValue;
    policyData.financial.premium = premiumValue;
    policyData.financial.annualPremium = premiumValue;
    policyData.premium = premiumValue;
    policyData.annualPremium = premiumValue;
    policyData['Annual Premium'] = premiumValue;
    policyData.Premium = premiumValue;

    console.log('Saving policy with premium:', premiumValue, 'and win/loss:', policyData.winLoss);

    // Get existing policies
    let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    // Update or add the policy
    if (window.editingPolicyId) {
        const index = policies.findIndex(p => p.id === window.editingPolicyId || p.policyNumber === window.editingPolicyId);
        if (index !== -1) {
            // Preserve existing fields and update with new data
            policies[index] = { ...policies[index], ...policyData };
            console.log('Updated existing policy at index:', index);
        } else {
            policies.push(policyData);
            console.log('Added as new policy (ID not found)');
        }
    } else {
        policies.push(policyData);
        console.log('Added new policy');
    }

    // Save to localStorage
    localStorage.setItem('insurance_policies', JSON.stringify(policies));
    console.log('Policies saved to localStorage');

    // Close modal
    if (window.closePolicyModal) {
        window.closePolicyModal();
    }

    // Refresh all displays after a short delay
    setTimeout(() => {
        window.refreshAllPolicyDisplays();
    }, 100);

    // Show success notification
    if (window.showNotification) {
        window.showNotification('Policy saved successfully', 'success');
    }

    return true;
};

// Hook into the existing save policy function
const originalSavePolicy2 = window.savePolicy;
if (originalSavePolicy2) {
    window.savePolicy = function() {
        console.log('Intercepting savePolicy call');

        // Try our enhanced save first
        const result = window.enhancedSavePolicyData();

        // If it fails, fall back to original
        if (!result && originalSavePolicy2) {
            return originalSavePolicy2.apply(this, arguments);
        }

        return result;
    };
}

// Monitor for policy form creation to ensure fields are properly set up
const observePolicyForm = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
                // Check if this is a policy modal or contains policy fields
                if (node.id === 'policyModal' || (node.querySelector && node.querySelector('#policyModal'))) {
                    console.log('Policy modal detected, checking for win/loss field...');

                    setTimeout(() => {
                        // Check if win/loss field exists, if not add it
                        if (!document.getElementById('winLossStatus') && !document.getElementById('winLoss')) {
                            const financialTab = document.querySelector('#financial-tab');
                            if (financialTab) {
                                const formGrid = financialTab.querySelector('.form-grid');
                                if (formGrid && !formGrid.querySelector('#winLossStatus')) {
                                    console.log('Adding win/loss status field...');

                                    const winLossDiv = document.createElement('div');
                                    winLossDiv.className = 'form-group';
                                    winLossDiv.innerHTML = `
                                        <label>Win/Loss Status</label>
                                        <select id="winLossStatus" class="form-control" style="width: 100%;">
                                            <option value="pending">Pending</option>
                                            <option value="win" style="color: #10b981;">Win</option>
                                            <option value="loss" style="color: #ef4444;">Loss</option>
                                        </select>
                                    `;

                                    formGrid.appendChild(winLossDiv);

                                    // Add change event to update color
                                    const select = document.getElementById('winLossStatus');
                                    select.addEventListener('change', function() {
                                        if (this.value === 'win') {
                                            this.style.backgroundColor = '#10b98120';
                                            this.style.color = '#10b981';
                                        } else if (this.value === 'loss') {
                                            this.style.backgroundColor = '#ef444420';
                                            this.style.color = '#ef4444';
                                        } else {
                                            this.style.backgroundColor = '';
                                            this.style.color = '';
                                        }
                                    });
                                }
                            }
                        }

                        // If editing, populate win/loss value
                        if (window.editingPolicyId) {
                            const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                            const policy = policies.find(p => p.id === window.editingPolicyId || p.policyNumber === window.editingPolicyId);
                            if (policy && policy.winLoss) {
                                const winLossField = document.getElementById('winLossStatus') || document.getElementById('winLoss');
                                if (winLossField) {
                                    winLossField.value = policy.winLoss;
                                    // Trigger change event to update color
                                    winLossField.dispatchEvent(new Event('change'));
                                }
                            }
                        }
                    }, 500);
                }
            }
        });
    });
});

// Start observing
observePolicyForm.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('Policy refresh fixes applied successfully');