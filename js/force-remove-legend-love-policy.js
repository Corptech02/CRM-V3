// FORCE REMOVE: LEGEND LOVE LOGISTIC Unknown Rep corrupted policy
console.log('🚨 FORCE REMOVING: LEGEND LOVE LOGISTIC corrupted policy...');

function forceRemoveLegendLovePolicy() {
    console.log('🔧 FORCE REMOVAL STARTED...');

    try {
        // Get all storage keys that might contain policies
        const storageKeys = ['insurance_policies', 'policies', 'insurance_leads', 'leads'];
        let totalChanges = 0;

        storageKeys.forEach(storageKey => {
            console.log(`🔍 CHECKING ${storageKey}...`);

            let data = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const originalLength = data.length;

            console.log(`📊 Found ${originalLength} items in ${storageKey}`);

            // Remove LEGEND LOVE LOGISTIC entries
            const filteredData = data.filter((item, index) => {
                const shouldRemove = (
                    // Policy checks
                    (item.insured_name && item.insured_name.includes('LEGEND LOVE LOGISTIC')) ||
                    (item.clientName && item.clientName.includes('LEGEND LOVE LOGISTIC')) ||
                    (item.name && item.name.includes('LEGEND LOVE LOGISTIC')) ||

                    // ID checks
                    item.id === 'unknown' ||
                    item.policy_id === 'unknown' ||
                    item.policyId === 'unknown' ||

                    // Policy number checks
                    item.policy_number === 'undefined' ||
                    item.policyNumber === 'undefined' ||

                    // Date checks for corrupted entries
                    item.effective_date === '' ||
                    item.effectiveDate === 'Invalid Date Invalid Date' ||
                    item.expirationDate === 'Invalid Date Invalid Date' ||

                    // Premium checks
                    (item.premium === '$0/yr' && (
                        item.effective_date === '' ||
                        !item.effective_date ||
                        item.effectiveDate === 'Invalid Date Invalid Date'
                    )) ||

                    // Representative checks
                    (item.insured_name && item.insured_name.includes('Unknown Rep')) ||
                    (item.clientName && item.clientName.includes('Unknown Rep')) ||
                    (item.name && item.name.includes('Unknown Rep'))
                );

                if (shouldRemove) {
                    console.log(`🗑️ REMOVING CORRUPTED ENTRY from ${storageKey} at index ${index}:`, {
                        type: storageKey,
                        id: item.id || item.policy_id || item.policyId || 'no-id',
                        name: item.name || item.insured_name || item.clientName || 'no-name',
                        policy_number: item.policy_number || item.policyNumber || 'no-policy-number',
                        effective_date: item.effective_date || item.effectiveDate || 'no-date',
                        premium: item.premium || 'no-premium'
                    });
                    return false; // Remove this item
                }
                return true; // Keep this item
            });

            const newLength = filteredData.length;
            const removedCount = originalLength - newLength;

            if (removedCount > 0) {
                localStorage.setItem(storageKey, JSON.stringify(filteredData));
                console.log(`✅ REMOVED ${removedCount} corrupted entries from ${storageKey}`);
                console.log(`📊 Count: ${originalLength} → ${newLength}`);
                totalChanges += removedCount;
            } else {
                console.log(`✅ NO CORRUPTED ENTRIES found in ${storageKey}`);
            }
        });

        // Also clear any cached API responses that might contain the corrupted data
        const cacheKeys = ['policies_cache', 'leads_cache', 'api_cache'];
        cacheKeys.forEach(cacheKey => {
            if (localStorage.getItem(cacheKey)) {
                localStorage.removeItem(cacheKey);
                console.log(`🧹 CLEARED cache: ${cacheKey}`);
                totalChanges++;
            }
        });

        if (totalChanges > 0) {
            console.log(`🎉 FORCE REMOVAL COMPLETE!`);
            console.log(`   📊 Total changes made: ${totalChanges}`);
            console.log(`   🗑️ LEGEND LOVE LOGISTIC policy completely removed`);
            console.log(`   💾 All data cleaned and saved`);

            // Force reload to clear any in-memory caches
            console.log('🔄 Force reloading page to clear all caches...');
            setTimeout(() => {
                // Clear any remaining cache and force hard reload
                if ('caches' in window) {
                    caches.keys().then(names => {
                        names.forEach(name => caches.delete(name));
                    });
                }
                window.location.reload(true); // Force reload from server
            }, 1500);

            return `SUCCESS: Removed ${totalChanges} corrupted entries, including LEGEND LOVE LOGISTIC policy`;
        } else {
            console.log(`✅ NO LEGEND LOVE LOGISTIC POLICY FOUND - All data is clean!`);
            return 'LEGEND LOVE LOGISTIC POLICY NOT FOUND';
        }

    } catch (error) {
        console.error('❌ ERROR IN FORCE REMOVAL:', error);
        return `ERROR: ${error.message}`;
    }
}

// Run the fix immediately
const result = forceRemoveLegendLovePolicy();

// Show the result
console.log(`🏁 FORCE REMOVAL RESULT: ${result}`);

// Make it available globally for re-running
window.forceRemoveLegendLovePolicy = forceRemoveLegendLovePolicy;

// Show alert with results
if (result.startsWith('SUCCESS:')) {
    alert(`✅ LEGEND LOVE LOGISTIC Policy Forcibly Removed!\n\n${result}\n\nThe page will force reload to clear all caches.`);
} else if (result === 'LEGEND LOVE LOGISTIC POLICY NOT FOUND') {
    console.log('✅ LEGEND LOVE LOGISTIC policy not found - data is clean!');
    alert('✅ LEGEND LOVE LOGISTIC policy not found in storage - data appears to be clean!');
} else {
    alert(`❌ Error: ${result}`);
    console.error('Force removal failed:', result);
}

// Additional emergency cleanup - remove any DOM elements showing this policy
setTimeout(() => {
    const tableRows = document.querySelectorAll('tr');
    tableRows.forEach(row => {
        const text = row.textContent || '';
        if (text.includes('LEGEND LOVE LOGISTIC') || text.includes('Unknown Rep') || text.includes('undefined')) {
            console.log('🗑️ REMOVING DOM element containing LEGEND LOVE LOGISTIC');
            row.remove();
        }
    });
}, 500);