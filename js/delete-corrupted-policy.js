// EMERGENCY: Remove Corrupted Policy with undefined values
console.log('🚨 EMERGENCY: Removing corrupted policy...');

function removeCorruptedPolicy() {
    console.log('🔧 STARTING CORRUPTED POLICY REMOVAL...');

    try {
        // Check both possible storage locations
        const storageKeys = ['insurance_policies', 'policies'];
        let totalRemoved = 0;
        let foundCorrupted = false;

        storageKeys.forEach(storageKey => {
            console.log(`🔍 CHECKING ${storageKey}...`);

            let policies = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const originalLength = policies.length;

            console.log(`📊 Found ${originalLength} policies in ${storageKey}`);

            // Filter out corrupted policies
            policies = policies.filter((policy, index) => {
                // Check for corrupted data patterns
                const isCorrupted = (
                    policy.id === 'unknown' ||
                    policy.id === undefined ||
                    policy.id === null ||
                    policy.policyNumber === 'undefined' ||
                    policy.policyNumber === undefined ||
                    policy.policyNumber === null ||
                    (policy.clientName && policy.clientName.includes('Unknown Rep')) ||
                    (policy.effectiveDate === 'Invalid Date Invalid Date') ||
                    (policy.expirationDate === 'Invalid Date Invalid Date') ||
                    (policy.premium === '$0/yr' && policy.effectiveDate === 'Invalid Date Invalid Date')
                );

                if (isCorrupted) {
                    console.log(`🗑️ REMOVING CORRUPTED POLICY at index ${index}:`, {
                        id: policy.id,
                        policyNumber: policy.policyNumber,
                        clientName: policy.clientName,
                        effectiveDate: policy.effectiveDate,
                        expirationDate: policy.expirationDate,
                        premium: policy.premium
                    });
                    foundCorrupted = true;
                    return false; // Remove this policy
                }
                return true; // Keep this policy
            });

            const newLength = policies.length;
            const removedCount = originalLength - newLength;

            if (removedCount > 0) {
                localStorage.setItem(storageKey, JSON.stringify(policies));
                console.log(`✅ REMOVED ${removedCount} corrupted policies from ${storageKey}`);
                console.log(`📊 Policies count: ${originalLength} → ${newLength}`);
                totalRemoved += removedCount;
            } else {
                console.log(`✅ NO CORRUPTED POLICIES found in ${storageKey}`);
            }
        });

        // Also check leads storage for similar corruption
        console.log('🔍 CHECKING insurance_leads for corrupted policy references...');
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let leadsFixed = 0;

        leads.forEach((lead, index) => {
            if (lead.policyId === 'unknown' ||
                lead.policyId === undefined ||
                lead.policyId === null ||
                (lead.name && lead.name.includes('Unknown Rep'))) {

                console.log(`🔧 FIXING CORRUPTED LEAD: ${lead.name} (ID: ${lead.id})`);

                // Reset corrupted policy references
                if (lead.policyId === 'unknown' || lead.policyId === undefined || lead.policyId === null) {
                    delete leads[index].policyId;
                }

                leadsFixed++;
            }
        });

        if (leadsFixed > 0) {
            localStorage.setItem('insurance_leads', JSON.stringify(leads));
            console.log(`✅ FIXED ${leadsFixed} leads with corrupted policy references`);
        }

        if (totalRemoved > 0 || foundCorrupted) {
            console.log(`🎉 CORRUPTED POLICY REMOVAL COMPLETE!`);
            console.log(`   📊 Total corrupted policies removed: ${totalRemoved}`);
            console.log(`   📊 Leads with policy references fixed: ${leadsFixed}`);
            console.log(`   💾 Data saved to localStorage`);

            // Refresh the page to show the updated data
            console.log('🔄 Refreshing page to show clean data...');
            setTimeout(() => {
                window.location.reload();
            }, 2000);

            return `SUCCESS: Removed ${totalRemoved} corrupted policies, fixed ${leadsFixed} leads`;
        } else {
            console.log(`✅ NO CORRUPTED POLICIES FOUND - All policy data is clean!`);
            return 'NO CORRUPTED POLICIES FOUND';
        }

    } catch (error) {
        console.error('❌ ERROR IN CORRUPTED POLICY REMOVAL:', error);
        return `ERROR: ${error.message}`;
    }
}

// Run the fix immediately
const result = removeCorruptedPolicy();

// Show the result
console.log(`🏁 CORRUPTED POLICY REMOVAL RESULT: ${result}`);

// Make it available globally for re-running
window.removeCorruptedPolicy = removeCorruptedPolicy;

// Show alert with results
if (result.startsWith('SUCCESS:')) {
    alert(`✅ Corrupted Policy Removed!\n\n${result}\n\nThe page will refresh to show the clean policy list.`);
} else if (result === 'NO CORRUPTED POLICIES FOUND') {
    console.log('✅ No corrupted policies found - all policy data is clean!');
} else {
    alert(`❌ Error: ${result}`);
}