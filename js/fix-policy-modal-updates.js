// Fix Policy Modal Updates - Ensures premium and win/loss status are properly saved and displayed
console.log('Applying policy modal update fixes...');

// Enhanced save policy function that properly updates all views
window.enhancedSavePolicy = function() {
    console.log('Enhanced save policy called');

    // Get form data
    const policyData = {
        id: window.editingPolicyId || Date.now().toString(),
        policyNumber: document.getElementById('policyNumber')?.value || '',
        policyType: document.getElementById('policyType')?.value || '',
        carrier: document.getElementById('carrier')?.value || '',
        status: document.getElementById('policyStatus')?.value || 'active',
        effectiveDate: document.getElementById('effectiveDate')?.value || '',
        expirationDate: document.getElementById('expirationDate')?.value || '',

        // Financial information with proper premium handling
        financial: {
            'Annual Premium': document.getElementById('annualPremium')?.value || document.getElementById('premium')?.value || '0',
            'Premium': document.getElementById('premium')?.value || document.getElementById('annualPremium')?.value || '0',
            'Monthly Payment': document.getElementById('monthlyPayment')?.value || '0',
            'Deductible': document.getElementById('deductible')?.value || '0',
            'Coverage Limit': document.getElementById('coverageLimit')?.value || '0'
        },

        // Win/Loss status
        winLoss: document.getElementById('winLossStatus')?.value || 'pending',

        // Also store premium at top level for compatibility
        premium: document.getElementById('annualPremium')?.value || document.getElementById('premium')?.value || '0',
        annualPremium: document.getElementById('annualPremium')?.value || document.getElementById('premium')?.value || '0',

        // Insured information
        insured: {
            'Name/Business Name': document.getElementById('insuredName')?.value || '',
            'Primary Named Insured': document.getElementById('insuredName')?.value || '',
            'Address': document.getElementById('insuredAddress')?.value || '',
            'City': document.getElementById('insuredCity')?.value || '',
            'State': document.getElementById('insuredState')?.value || '',
            'ZIP': document.getElementById('insuredZip')?.value || '',
            'Phone': document.getElementById('insuredPhone')?.value || '',
            'Email': document.getElementById('insuredEmail')?.value || ''
        },

        // Coverage details
        coverage: {
            'Bodily Injury': document.getElementById('bodilyInjury')?.value || '',
            'Property Damage': document.getElementById('propertyDamage')?.value || '',
            'Comprehensive': document.getElementById('comprehensive')?.value || '',
            'Collision': document.getElementById('collision')?.value || '',
            'Uninsured Motorist': document.getElementById('uninsuredMotorist')?.value || ''
        },

        // Additional fields
        notes: document.getElementById('policyNotes')?.value || '',
        lastModified: new Date().toISOString()
    };

    // Clean up premium values - ensure they're stored as numbers without $ or commas
    if (policyData.financial['Annual Premium']) {
        const cleanPremium = String(policyData.financial['Annual Premium']).replace(/[$,]/g, '');
        policyData.financial['Annual Premium'] = cleanPremium;
        policyData.financial['Premium'] = cleanPremium;
        policyData.premium = cleanPremium;
        policyData.annualPremium = cleanPremium;
    }

    console.log('Saving policy data:', policyData);

    // Get existing policies
    let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    // Update or add the policy
    if (window.editingPolicyId) {
        const index = policies.findIndex(p => p.id === window.editingPolicyId);
        if (index !== -1) {
            // Preserve any existing fields not in the form
            policies[index] = { ...policies[index], ...policyData };
        } else {
            policies.push(policyData);
        }
    } else {
        policies.push(policyData);
    }

    // Save to localStorage
    localStorage.setItem('insurance_policies', JSON.stringify(policies));

    console.log('Policy saved successfully');

    // Close modal
    closePolicyModal();

    // Update all displays
    setTimeout(() => {
        // Update policy display if function exists
        if (window.updatePolicyDisplay) {
            window.updatePolicyDisplay(policyData.id);
        }

        // Refresh lead profile if visible
        const leadProfile = document.querySelector('.lead-profile');
        if (leadProfile) {
            const leadId = leadProfile.dataset.leadId;
            if (leadId && window.refreshPolicyList) {
                window.refreshPolicyList(leadId);
            }
        }

        // Refresh policies view if visible
        if (document.querySelector('.policies-view')) {
            loadPoliciesView();
        }

        // Refresh clients view if visible
        if (document.querySelector('.clients-view')) {
            loadClientsView();
        }

        // Refresh leads view if visible
        if (document.querySelector('.leads-view')) {
            loadLeadsView();
        }
    }, 100);

    // Show success notification
    if (window.showNotification) {
        window.showNotification('Policy saved successfully', 'success');
    }

    return true;
};

// Enhanced view/edit policy function
window.enhancedViewPolicy = function(policyId) {
    console.log('Viewing/editing policy:', policyId);

    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p => (p.id === policyId) || (p.policyNumber === policyId));

    if (!policy) {
        if (window.showNotification) {
            window.showNotification('Policy not found', 'error');
        }
        return;
    }

    // Show the policy modal with existing data
    showPolicyModal(policy);
};

// Add win/loss status field to the policy form if it doesn't exist
window.addWinLossField = function() {
    // Check if we're in the financial tab
    const financialSection = document.querySelector('#financial-tab .form-section');
    if (financialSection && !document.getElementById('winLossStatus')) {
        // Find the form grid
        const formGrid = financialSection.querySelector('.form-grid');
        if (formGrid) {
            // Add win/loss status field
            const winLossField = document.createElement('div');
            winLossField.className = 'form-group';
            winLossField.innerHTML = `
                <label>Win/Loss Status</label>
                <select id="winLossStatus" class="form-control" onchange="updateWinLossColor(this)">
                    <option value="pending">Pending</option>
                    <option value="win" style="color: #10b981;">Win</option>
                    <option value="loss" style="color: #ef4444;">Loss</option>
                </select>
            `;

            // Insert after premium field or at the end
            const premiumField = formGrid.querySelector('#annualPremium')?.parentElement || formGrid.querySelector('#premium')?.parentElement;
            if (premiumField) {
                premiumField.insertAdjacentElement('afterend', winLossField);
            } else {
                formGrid.appendChild(winLossField);
            }
        }
    }
};

// Function to update win/loss field color
window.updateWinLossColor = function(selectElement) {
    const value = selectElement.value;
    if (value === 'win') {
        selectElement.style.backgroundColor = '#10b98120';
        selectElement.style.color = '#10b981';
    } else if (value === 'loss') {
        selectElement.style.backgroundColor = '#ef444420';
        selectElement.style.color = '#ef4444';
    } else {
        selectElement.style.backgroundColor = '';
        selectElement.style.color = '';
    }
};

// Override the existing savePolicy function
if (window.savePolicy) {
    console.log('Overriding existing savePolicy function');
    window.originalSavePolicy = window.savePolicy;
    window.savePolicy = window.enhancedSavePolicy;
}

// Override the existing viewPolicy and editPolicy functions
if (window.viewPolicy) {
    console.log('Overriding existing viewPolicy function');
    window.originalViewPolicy = window.viewPolicy;
    window.viewPolicy = window.enhancedViewPolicy;
}

if (window.editPolicy) {
    console.log('Overriding existing editPolicy function');
    window.originalEditPolicy = window.editPolicy;
    window.editPolicy = window.enhancedViewPolicy;
}

// Function to populate the form with win/loss status
window.enhancedPopulatePolicyForm = function(policy) {
    console.log('Populating policy form with:', policy);

    // Call original populate function if it exists
    if (window.originalPopulatePolicyForm) {
        window.originalPopulatePolicyForm(policy);
    } else if (window.populatePolicyForm) {
        window.populatePolicyForm(policy);
    }

    // Add win/loss field if not present
    setTimeout(() => {
        addWinLossField();

        // Set win/loss status
        const winLossField = document.getElementById('winLossStatus');
        if (winLossField && policy.winLoss) {
            winLossField.value = policy.winLoss;
            updateWinLossColor(winLossField);
        }

        // Ensure premium is set correctly
        const premiumField = document.getElementById('annualPremium') || document.getElementById('premium');
        if (premiumField) {
            let premiumValue = 0;
            if (policy.financial) {
                premiumValue = policy.financial['Annual Premium'] || policy.financial.Premium || policy.financial.premium || 0;
            }
            if (!premiumValue) {
                premiumValue = policy.premium || policy.annualPremium || 0;
            }
            // Clean the value
            premiumValue = String(premiumValue).replace(/[$,]/g, '');
            premiumField.value = premiumValue;
        }
    }, 200);
};

// Override populatePolicyForm if it exists
if (window.populatePolicyForm) {
    console.log('Overriding existing populatePolicyForm function');
    window.originalPopulatePolicyForm = window.populatePolicyForm;
    window.populatePolicyForm = window.enhancedPopulatePolicyForm;
}

// Monitor for policy modal opening to add win/loss field
const observeModalCreation = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.id === 'policyModal') {
                console.log('Policy modal detected, enhancing...');
                setTimeout(() => {
                    addWinLossField();

                    // Also check if we need to populate win/loss for editing
                    if (window.editingPolicyId) {
                        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                        const policy = policies.find(p => p.id === window.editingPolicyId);
                        if (policy && policy.winLoss) {
                            const winLossField = document.getElementById('winLossStatus');
                            if (winLossField) {
                                winLossField.value = policy.winLoss;
                                updateWinLossColor(winLossField);
                            }
                        }
                    }
                }, 300);
            }
        });
    });
});

// Start observing
observeModalCreation.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('Policy modal update fixes applied successfully');