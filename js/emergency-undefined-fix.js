// EMERGENCY UNDEFINED VALUES FIX
console.log('🚨 EMERGENCY: Fixing ALL undefined values in reach out sections...');

function fixAllUndefinedValues() {
    console.log('🔧 STARTING COMPREHENSIVE UNDEFINED VALUES FIX...');

    try {
        // Fix both insurance_leads and leads
        const storageKeys = ['insurance_leads', 'leads'];
        let totalFixedLeads = 0;
        let totalFixedProperties = 0;

        storageKeys.forEach(storageKey => {
            console.log(`🔍 CHECKING ${storageKey}...`);

            let leads = JSON.parse(localStorage.getItem(storageKey) || '[]');
            let fixedLeadsInThisStorage = 0;

            leads.forEach((lead, index) => {
                let needsSaving = false;

                // Initialize reachOut if missing
                if (!lead.reachOut || typeof lead.reachOut !== 'object') {
                    console.log(`🔧 INITIALIZING MISSING REACH OUT: ${lead.name} (${lead.id})`);
                    leads[index].reachOut = {
                        emailCount: 0,
                        textCount: 0,
                        callAttempts: 0,
                        callsConnected: 0,
                        voicemailCount: 0,
                        emailSent: false,
                        textSent: false,
                        callMade: false,
                        activityTimestamps: []
                    };
                    needsSaving = true;
                    fixedLeadsInThisStorage++;
                }

                // Fix each property that could be undefined/null/NaN
                const numericProperties = {
                    emailCount: 0,
                    textCount: 0,
                    callAttempts: 0,
                    callsConnected: 0,
                    voicemailCount: 0
                };

                const booleanProperties = {
                    emailSent: false,
                    textSent: false,
                    callMade: false
                };

                // Fix numeric properties
                Object.entries(numericProperties).forEach(([prop, defaultValue]) => {
                    const currentValue = lead.reachOut[prop];

                    if (currentValue === undefined ||
                        currentValue === null ||
                        isNaN(currentValue) ||
                        typeof currentValue !== 'number' ||
                        currentValue < 0) {

                        console.log(`🔧 FIXING ${prop}: ${lead.name} had "${currentValue}", setting to ${defaultValue}`);
                        leads[index].reachOut[prop] = defaultValue;
                        needsSaving = true;
                        totalFixedProperties++;
                    }
                });

                // Fix boolean properties
                Object.entries(booleanProperties).forEach(([prop, defaultValue]) => {
                    const currentValue = lead.reachOut[prop];

                    if (currentValue === undefined ||
                        currentValue === null ||
                        typeof currentValue !== 'boolean') {

                        console.log(`🔧 FIXING ${prop}: ${lead.name} had "${currentValue}", setting to ${defaultValue}`);
                        leads[index].reachOut[prop] = defaultValue;
                        needsSaving = true;
                        totalFixedProperties++;
                    }
                });

                // Ensure activityTimestamps exists
                if (!Array.isArray(lead.reachOut.activityTimestamps)) {
                    console.log(`🔧 FIXING activityTimestamps: ${lead.name} - setting to empty array`);
                    leads[index].reachOut.activityTimestamps = [];
                    needsSaving = true;
                    totalFixedProperties++;
                }
            });

            // Save if any changes were made
            if (fixedLeadsInThisStorage > 0) {
                localStorage.setItem(storageKey, JSON.stringify(leads));
                console.log(`✅ FIXED ${fixedLeadsInThisStorage} leads in ${storageKey}`);
                totalFixedLeads += fixedLeadsInThisStorage;
            } else {
                console.log(`✅ NO ISSUES FOUND in ${storageKey}`);
            }
        });

        if (totalFixedLeads > 0) {
            console.log(`🎉 EMERGENCY FIX COMPLETE!`);
            console.log(`   📊 Total leads fixed: ${totalFixedLeads}`);
            console.log(`   📊 Total properties fixed: ${totalFixedProperties}`);
            console.log(`   💾 Data saved to localStorage`);

            // If we're on a profile page, try to refresh it
            const currentModal = document.querySelector('.lead-profile-modal, .enhanced-lead-profile, #simple-lead-profile');
            if (currentModal) {
                console.log('🔄 Profile detected - will refresh in 2 seconds...');
                setTimeout(() => {
                    if (window.location.reload) {
                        window.location.reload();
                    }
                }, 2000);
            }

            return `FIXED: ${totalFixedLeads} leads, ${totalFixedProperties} properties`;
        } else {
            console.log(`✅ NO UNDEFINED VALUES FOUND - All reach out data is already correct!`);
            return 'NO ISSUES FOUND';
        }

    } catch (error) {
        console.error('❌ ERROR IN EMERGENCY FIX:', error);
        return `ERROR: ${error.message}`;
    }
}

// Run the fix immediately
const result = fixAllUndefinedValues();

// Show the result
console.log(`🏁 EMERGENCY FIX RESULT: ${result}`);

// Make it available globally for re-running
window.fixAllUndefinedValues = fixAllUndefinedValues;

// Show alert with results (but only if fixes were made)
if (result.startsWith('FIXED:')) {
    alert(`✅ Emergency Fix Complete!\n\n${result}\n\nThe page will refresh in a moment to show the fixes.`);
} else {
    console.log('✅ No undefined values found - all data is already correct!');
}