// Fix Lead Premium Sync - Syncs policy premiums to leads and shows win/loss colors
console.log('Applying lead premium sync fixes...');

// Enhanced generateSimpleLeadRows that calculates premium from policies
window.enhancedGenerateSimpleLeadRows = function(leads) {
    if (!leads || leads.length === 0) {
        return '<tr><td colspan="10" style="text-align: center; padding: 2rem;">No leads found</td></tr>';
    }

    // Get all policies to calculate premiums
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    console.log(`Calculating premiums for ${leads.length} leads from ${allPolicies.length} policies`);

    return leads.map(lead => {
        // Find all policies for this lead
        const leadPolicies = allPolicies.filter(policy => {
            // Match by lead ID
            if (policy.leadId && String(policy.leadId) === String(lead.id)) {
                return true;
            }
            // Match by insured name
            const insuredName = policy.insured?.['Name/Business Name'] ||
                               policy.insured?.['Primary Named Insured'] ||
                               policy.insuredName;
            if (insuredName && lead.name && insuredName.toLowerCase() === lead.name.toLowerCase()) {
                return true;
            }
            return false;
        });

        // Calculate total premium from policies
        let totalPremium = 0;
        let winLossStatus = 'pending';
        let hasWin = false;
        let hasLoss = false;

        leadPolicies.forEach(policy => {
            // Get premium value
            let premiumValue = 0;
            if (policy.financial) {
                premiumValue = policy.financial['Annual Premium'] ||
                              policy.financial['Premium'] ||
                              policy.financial.annualPremium ||
                              policy.financial.premium || 0;
            }
            if (!premiumValue) {
                premiumValue = policy['Annual Premium'] ||
                              policy.Premium ||
                              policy.premium ||
                              policy.annualPremium || 0;
            }

            // Convert to number
            const numericPremium = typeof premiumValue === 'string' ?
                parseFloat(premiumValue.replace(/[$,]/g, '')) || 0 :
                parseFloat(premiumValue) || 0;

            totalPremium += numericPremium;

            // Track win/loss status
            if (policy.winLoss === 'win') hasWin = true;
            if (policy.winLoss === 'loss') hasLoss = true;
        });

        // Determine overall win/loss status
        if (hasWin && !hasLoss) winLossStatus = 'win';
        else if (hasLoss && !hasWin) winLossStatus = 'loss';
        else if (hasWin && hasLoss) winLossStatus = 'mixed';
        else if (leadPolicies.length > 0) winLossStatus = 'pending';

        // Determine color based on win/loss status
        const statusColor = winLossStatus === 'win' ? '#10b981' :
                          winLossStatus === 'loss' ? '#ef4444' :
                          winLossStatus === 'mixed' ? '#f59e0b' :
                          '#6b7280';

        // Use policy premium if available, otherwise use lead's stored premium
        const displayPremium = totalPremium > 0 ? totalPremium : (lead.premium || 0);

        // Truncate name to 15 characters max
        const displayName = lead.name && lead.name.length > 15 ? lead.name.substring(0, 15) + '...' : lead.name || '';

        return \`
            <tr>
                <td>
                    <input type="checkbox" class="lead-checkbox" value="\${lead.id}" data-lead='\${JSON.stringify(lead).replace(/'/g, '&apos;')}'>
                </td>
                <td class="lead-name" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <strong style="cursor: pointer; color: #3b82f6; text-decoration: underline; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" onclick="viewLead(\${lead.id})" title="\${lead.name}">\${displayName}</strong>
                </td>
                <td>
                    <div class="contact-info" style="display: flex; gap: 10px; align-items: center;">
                        <a href="tel:\${lead.phone}" title="\${lead.phone}" style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                            <i class="fas fa-phone"></i>
                        </a>
                        <a href="mailto:\${lead.email}" title="\${lead.email}" style="color: #3b82f6; text-decoration: none; font-size: 16px;">
                            <i class="fas fa-envelope"></i>
                        </a>
                    </div>
                </td>
                <td>\${lead.product}</td>
                <td style="font-weight: 600;">
                    <span style="color: \${leadPolicies.length > 0 ? statusColor : 'inherit'};">
                        $\${displayPremium.toLocaleString()}
                    </span>
                </td>
                <td>\${window.getStageHtml ? window.getStageHtml(lead.stage) : lead.stage}</td>
                <td>\${lead.renewalDate || 'N/A'}</td>
                <td>\${lead.assignedTo || 'Unassigned'}</td>
                <td>\${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : lead.created || 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="viewLead('\${lead.id}')" title="View Lead"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" onclick="archiveLead('\${lead.id}')" title="Archive Lead" style="color: #f59e0b;"><i class="fas fa-archive"></i></button>
                        <button class="btn-icon" onclick="convertLead('\${lead.id}')" title="Convert to Client"><i class="fas fa-user-check"></i></button>
                    </div>
                </td>
            </tr>
        \`;
    }).join('');
};

// Override the original generateSimpleLeadRows function
window.originalGenerateSimpleLeadRows = window.generateSimpleLeadRows;
window.generateSimpleLeadRows = window.enhancedGenerateSimpleLeadRows;

// Enhanced save policy that updates lead premium
window.enhancedSavePolicyWithLeadUpdate = function() {
    console.log('Enhanced save policy with lead update called');

    // Get form data
    const policyData = {
        id: window.editingPolicyId || Date.now().toString(),
        policyNumber: document.getElementById('policyNumber')?.value || '',
        policyType: document.getElementById('policyType')?.value || '',
        type: document.getElementById('policyType')?.value || '',
        carrier: document.getElementById('carrier')?.value || '',
        status: document.getElementById('policyStatus')?.value || 'active',
        effectiveDate: document.getElementById('effectiveDate')?.value || '',
        expirationDate: document.getElementById('expirationDate')?.value || '',

        // Win/Loss status
        winLoss: document.getElementById('winLossStatus')?.value ||
                 document.getElementById('winLoss')?.value ||
                 document.querySelector('select[name="winLoss"]')?.value ||
                 'pending',

        // Store premium in multiple locations
        financial: {},

        // Insured information
        insured: {
            'Name/Business Name': document.getElementById('insuredName')?.value || '',
            'Primary Named Insured': document.getElementById('insuredName')?.value || ''
        }
    };

    // Get premium value
    let premiumValue = document.getElementById('annualPremium')?.value ||
                      document.getElementById('premium')?.value ||
                      document.querySelector('input[name="premium"]')?.value ||
                      document.querySelector('input[name="annualPremium"]')?.value ||
                      '0';

    // Clean premium value
    premiumValue = String(premiumValue).replace(/[$,]/g, '');

    // Store premium in all locations
    policyData.financial['Annual Premium'] = premiumValue;
    policyData.financial['Premium'] = premiumValue;
    policyData.financial.premium = premiumValue;
    policyData.financial.annualPremium = premiumValue;
    policyData.premium = premiumValue;
    policyData.annualPremium = premiumValue;

    console.log('Saving policy with premium:', premiumValue, 'and win/loss:', policyData.winLoss);

    // Get existing policies
    let policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    // Update or add the policy
    if (window.editingPolicyId) {
        const index = policies.findIndex(p => p.id === window.editingPolicyId || p.policyNumber === window.editingPolicyId);
        if (index !== -1) {
            // Preserve leadId if it exists
            if (policies[index].leadId) {
                policyData.leadId = policies[index].leadId;
            }
            policies[index] = { ...policies[index], ...policyData };
        } else {
            policies.push(policyData);
        }
    } else {
        policies.push(policyData);
    }

    // Save policies
    localStorage.setItem('insurance_policies', JSON.stringify(policies));

    // Update the associated lead's premium
    if (policyData.leadId) {
        updateLeadPremium(policyData.leadId);
    }

    // Close modal
    if (window.closePolicyModal) {
        window.closePolicyModal();
    }

    // Refresh all displays
    setTimeout(() => {
        if (window.loadLeadsView && document.querySelector('.leads-view')) {
            console.log('Refreshing leads view...');
            window.loadLeadsView();
        }
        if (window.loadClientsView && document.querySelector('.clients-view')) {
            window.loadClientsView();
        }
        if (window.loadPoliciesView && document.querySelector('.policies-view')) {
            window.loadPoliciesView();
        }
    }, 100);

    // Show success notification
    if (window.showNotification) {
        window.showNotification('Policy saved successfully', 'success');
    }

    return true;
};

// Function to update a lead's premium based on attached policies
function updateLeadPremium(leadId) {
    console.log('Updating lead premium for lead ID:', leadId);

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));

    if (leadIndex === -1) {
        console.log('Lead not found:', leadId);
        return;
    }

    const lead = leads[leadIndex];
    const allPolicies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    // Calculate total premium from all attached policies
    let totalPremium = 0;
    const leadPolicies = allPolicies.filter(policy => {
        if (policy.leadId && String(policy.leadId) === String(leadId)) {
            return true;
        }
        const insuredName = policy.insured?.['Name/Business Name'] ||
                           policy.insured?.['Primary Named Insured'] ||
                           policy.insuredName;
        if (insuredName && lead.name && insuredName.toLowerCase() === lead.name.toLowerCase()) {
            return true;
        }
        return false;
    });

    leadPolicies.forEach(policy => {
        let premiumValue = 0;
        if (policy.financial) {
            premiumValue = policy.financial['Annual Premium'] ||
                          policy.financial['Premium'] ||
                          policy.financial.annualPremium ||
                          policy.financial.premium || 0;
        }
        if (!premiumValue) {
            premiumValue = policy['Annual Premium'] ||
                          policy.Premium ||
                          policy.premium ||
                          policy.annualPremium || 0;
        }
        const numericPremium = typeof premiumValue === 'string' ?
            parseFloat(premiumValue.replace(/[$,]/g, '')) || 0 :
            parseFloat(premiumValue) || 0;
        totalPremium += numericPremium;
    });

    // Update the lead's premium
    leads[leadIndex].premium = totalPremium;
    console.log(`Updated lead ${lead.name} premium to: ${totalPremium}`);

    // Save updated leads
    localStorage.setItem('insurance_leads', JSON.stringify(leads));
}

// Override the existing savePolicy function
const originalSavePolicy3 = window.savePolicy;
if (originalSavePolicy3) {
    window.savePolicy = function() {
        console.log('Intercepting savePolicy for lead premium sync');
        return window.enhancedSavePolicyWithLeadUpdate();
    };
}

// Add win/loss field to policy modal when it opens
const observePolicyModal = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && (node.id === 'policyModal' || (node.querySelector && node.querySelector('#policyModal')))) {
                console.log('Policy modal detected, adding win/loss field...');

                setTimeout(() => {
                    // Check if win/loss field exists
                    if (!document.getElementById('winLossStatus') && !document.getElementById('winLoss')) {
                        const financialTab = document.querySelector('#financial-tab');
                        if (financialTab) {
                            const formGrid = financialTab.querySelector('.form-grid');
                            if (formGrid) {
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

                                // Add after premium field if it exists
                                const premiumField = document.getElementById('annualPremium')?.parentElement ||
                                                   document.getElementById('premium')?.parentElement;
                                if (premiumField && premiumField.nextSibling) {
                                    premiumField.parentNode.insertBefore(winLossDiv, premiumField.nextSibling);
                                } else {
                                    formGrid.appendChild(winLossDiv);
                                }

                                // Add color change handler
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

                                // If editing, set the value
                                if (window.editingPolicyId) {
                                    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
                                    const policy = policies.find(p => p.id === window.editingPolicyId);
                                    if (policy && policy.winLoss) {
                                        select.value = policy.winLoss;
                                        select.dispatchEvent(new Event('change'));
                                    }
                                }
                            }
                        }
                    }
                }, 500);
            }
        });
    });
});

observePolicyModal.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('Lead premium sync fixes applied successfully');