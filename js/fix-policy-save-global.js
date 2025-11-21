// Global Policy Save Fix - Ensures ALL policy saves trigger lead list refresh
console.log('Applying global policy save fixes...');

// Store original localStorage setItem
const originalSetItem = localStorage.setItem;

// Override localStorage.setItem to detect policy saves
localStorage.setItem = function(key, value) {
    // Call original function
    originalSetItem.call(this, key, value);

    // If policies were saved, trigger refresh
    if (key === 'insurance_policies') {
        console.log('Policies saved to localStorage, triggering refresh...');

        // Mark that we need to refresh
        window.policiesJustSaved = true;

        // If we're currently in lead profile, mark for refresh on exit
        if (document.querySelector('.lead-profile')) {
            window.needsLeadListRefresh = true;
            console.log('In lead profile, will refresh lead list on exit');
        }

        // If we're in the lead list view, refresh immediately
        if (document.querySelector('.leads-view')) {
            setTimeout(() => {
                console.log('Refreshing lead list view...');
                if (window.loadLeadsView) {
                    window.loadLeadsView();
                }
            }, 100);
        }
    }
};

// Watch for navigation away from lead profile
window.watchForLeadProfileExit = function() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Check if we just left the lead profile
            if (window.needsLeadListRefresh) {
                const leadProfile = document.querySelector('.lead-profile');
                const leadsView = document.querySelector('.leads-view');

                if (!leadProfile && leadsView) {
                    console.log('Exited lead profile, refreshing lead list...');
                    window.needsLeadListRefresh = false;

                    // Force refresh of lead list
                    if (window.loadLeadsView) {
                        setTimeout(() => {
                            window.loadLeadsView();
                        }, 100);
                    }
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};

// Start watching
window.watchForLeadProfileExit();

// Enhanced close modal function that ensures refresh
window.enhancedClosePolicyModal = function() {
    console.log('Closing policy modal with refresh...');

    // Find and close the modal
    const modal = document.getElementById('policyModal');
    if (modal) {
        modal.remove();
    }

    // Mark for refresh
    window.needsLeadListRefresh = true;

    // If we're going back to lead list, refresh it
    setTimeout(() => {
        if (document.querySelector('.leads-view')) {
            console.log('Back to leads view, refreshing...');
            if (window.loadLeadsView) {
                window.loadLeadsView();
            }
        }
    }, 200);
};

// Override closePolicyModal if it exists
if (window.closePolicyModal) {
    window.originalClosePolicyModal = window.closePolicyModal;
    window.closePolicyModal = window.enhancedClosePolicyModal;
}

// Hook into ALL save buttons in policy forms
document.addEventListener('click', function(e) {
    // Check if this is a save button in a policy context
    if (e.target && (
        e.target.textContent?.includes('Save') ||
        e.target.textContent?.includes('save') ||
        e.target.innerHTML?.includes('fa-save')
    )) {
        // Check if we're in a policy modal or policy form
        const policyModal = e.target.closest('#policyModal');
        const policyForm = e.target.closest('.policy-form') ||
                          e.target.closest('[id*="policy"]') ||
                          e.target.closest('[class*="policy"]');

        if (policyModal || policyForm) {
            console.log('Policy save button clicked, marking for refresh...');
            window.needsLeadListRefresh = true;

            // Also force refresh after a delay
            setTimeout(() => {
                if (document.querySelector('.leads-view')) {
                    console.log('Refreshing leads view after policy save...');
                    if (window.loadLeadsView) {
                        window.loadLeadsView();
                    }
                }
            }, 500);
        }
    }

    // Also check for "Back to Leads" button
    if (e.target && (
        e.target.textContent?.includes('Back to Leads') ||
        e.target.innerHTML?.includes('Back to Leads')
    )) {
        console.log('Back to Leads clicked');
        if (window.needsLeadListRefresh) {
            setTimeout(() => {
                console.log('Refreshing lead list on return...');
                if (window.loadLeadsView) {
                    window.loadLeadsView();
                }
            }, 300);
        }
    }
}, true);

// Enhanced function to attach policy to lead and update premium
window.attachPolicyToLead = function(policyId, leadId) {
    console.log(`Attaching policy ${policyId} to lead ${leadId}`);

    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policyIndex = policies.findIndex(p =>
        p.id === policyId || p.policyNumber === policyId
    );

    if (policyIndex !== -1) {
        policies[policyIndex].leadId = leadId;
        localStorage.setItem('insurance_policies', JSON.stringify(policies));

        // Update lead's premium
        updateLeadPremiumFromPolicies(leadId);

        // Mark for refresh
        window.needsLeadListRefresh = true;
    }
};

// Function to update lead premium from attached policies
window.updateLeadPremiumFromPolicies = function(leadId) {
    console.log('Updating lead premium from policies for lead:', leadId);

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');

    const leadIndex = leads.findIndex(l => String(l.id) === String(leadId));
    if (leadIndex === -1) return;

    const lead = leads[leadIndex];

    // Find all policies for this lead
    const leadPolicies = policies.filter(policy => {
        if (policy.leadId && String(policy.leadId) === String(leadId)) {
            return true;
        }
        // Also match by name
        const insuredName = policy.insured?.['Name/Business Name'] ||
                           policy.insured?.['Primary Named Insured'] ||
                           policy.insuredName;
        if (insuredName && lead.name &&
            insuredName.toLowerCase() === lead.name.toLowerCase()) {
            // Update the leadId for future reference
            policy.leadId = leadId;
            return true;
        }
        return false;
    });

    // Calculate total premium
    let totalPremium = 0;
    leadPolicies.forEach(policy => {
        let premiumValue = 0;

        // Check all possible premium locations
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
    });

    // Update lead's premium
    leads[leadIndex].premium = totalPremium;
    console.log(`Updated lead ${lead.name} premium to: ${totalPremium}`);

    // Save updated leads
    localStorage.setItem('insurance_leads', JSON.stringify(leads));

    // Mark for refresh
    window.needsLeadListRefresh = true;
};

// Watch for any policy edits in lead profile
const watchPolicyEdits = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
                // Check for policy edit forms
                if (node.classList?.contains('policy-edit') ||
                    node.id?.includes('policyEdit') ||
                    node.querySelector?.('.policy-form')) {

                    console.log('Policy edit form detected in lead profile');

                    // Find save buttons and enhance them
                    const saveButtons = node.querySelectorAll('button');
                    saveButtons.forEach(btn => {
                        if (btn.textContent?.includes('Save')) {
                            btn.addEventListener('click', () => {
                                console.log('Policy save in lead profile detected');
                                window.needsLeadListRefresh = true;

                                // Get lead ID from profile
                                const leadProfile = document.querySelector('.lead-profile');
                                if (leadProfile) {
                                    const leadId = leadProfile.dataset.leadId;
                                    if (leadId) {
                                        setTimeout(() => {
                                            updateLeadPremiumFromPolicies(leadId);
                                        }, 100);
                                    }
                                }
                            });
                        }
                    });
                }
            }
        });
    });
});

watchPolicyEdits.observe(document.body, {
    childList: true,
    subtree: true
});

// Force refresh function that can be called manually
window.forceLeadListRefresh = function() {
    console.log('Forcing lead list refresh...');

    if (window.loadLeadsView && document.querySelector('.leads-view')) {
        window.loadLeadsView();
    }
};

// Also hook into browser back button
window.addEventListener('popstate', function() {
    if (window.needsLeadListRefresh && document.querySelector('.leads-view')) {
        console.log('Browser back detected, refreshing lead list...');
        setTimeout(() => {
            if (window.loadLeadsView) {
                window.loadLeadsView();
            }
        }, 100);
    }
});

console.log('Global policy save fixes applied - all policy saves will now trigger lead list refresh');