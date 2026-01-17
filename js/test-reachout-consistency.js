// Test ReachOut Data Consistency
console.log('🧪 TESTING: ReachOut data consistency fix...');

// Function to test reach-out data consistency
window.testReachOutConsistency = function() {
    console.log('\n🔬 === REACHOUT CONSISTENCY TEST ===');

    try {
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        console.log(`📊 Testing with ${leads.length} leads`);

        // Find test leads
        const klassicLead = leads.find(l => l.name && l.name.includes('KLASSIC'));
        const centexLead = leads.find(l => l.name && l.name.includes('CENTEX'));

        if (!klassicLead) {
            console.warn('⚠️ KLASSIC lead not found');
            return false;
        }

        if (!centexLead) {
            console.warn('⚠️ CENTEX lead not found');
            return false;
        }

        // Set unique test data
        console.log('🔧 Setting unique test data...');

        // KLASSIC gets stats: calls=3, connected=1, emails=2, texts=1
        if (!klassicLead.reachOut) klassicLead.reachOut = {};
        klassicLead.reachOut.callAttempts = 3;
        klassicLead.reachOut.callsConnected = 1;
        klassicLead.reachOut.emailCount = 2;
        klassicLead.reachOut.textCount = 1;
        klassicLead.reachOut.voicemailCount = 0;

        // CENTEX gets stats: calls=5, connected=2, emails=1, texts=3
        if (!centexLead.reachOut) centexLead.reachOut = {};
        centexLead.reachOut.callAttempts = 5;
        centexLead.reachOut.callsConnected = 2;
        centexLead.reachOut.emailCount = 1;
        centexLead.reachOut.textCount = 3;
        centexLead.reachOut.voicemailCount = 1;

        // Save data
        localStorage.setItem('insurance_leads', JSON.stringify(leads));

        console.log(`✅ KLASSIC (${klassicLead.id}): calls=3, connected=1, emails=2, texts=1`);
        console.log(`✅ CENTEX (${centexLead.id}): calls=5, connected=2, emails=1, texts=3`);

        // Run the fix function if available
        if (window.protectedFunctions && typeof window.protectedFunctions.fixAllLeadReachOutReferences === 'function') {
            console.log('🔧 Running fixAllLeadReachOutReferences...');
            window.protectedFunctions.fixAllLeadReachOutReferences();
        }

        // Test consistency by checking data multiple times
        console.log('\n🧪 Testing data consistency...');

        for (let i = 1; i <= 3; i++) {
            const currentLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const currentKlassic = currentLeads.find(l => l.name && l.name.includes('KLASSIC'));
            const currentCentex = currentLeads.find(l => l.name && l.name.includes('CENTEX'));

            if (currentKlassic && currentCentex) {
                const klassicData = `calls=${currentKlassic.reachOut?.callAttempts || 0}, connected=${currentKlassic.reachOut?.callsConnected || 0}, emails=${currentKlassic.reachOut?.emailCount || 0}`;
                const centexData = `calls=${currentCentex.reachOut?.callAttempts || 0}, connected=${currentCentex.reachOut?.callsConnected || 0}, emails=${currentCentex.reachOut?.emailCount || 0}`;

                console.log(`Check ${i} - KLASSIC: ${klassicData}`);
                console.log(`Check ${i} - CENTEX: ${centexData}`);

                // Verify expected values
                const klassicOK = currentKlassic.reachOut?.callAttempts === 3 &&
                                  currentKlassic.reachOut?.callsConnected === 1 &&
                                  currentKlassic.reachOut?.emailCount === 2;

                const centexOK = currentCentex.reachOut?.callAttempts === 5 &&
                                 currentCentex.reachOut?.callsConnected === 2 &&
                                 currentCentex.reachOut?.emailCount === 1;

                if (klassicOK && centexOK) {
                    console.log(`✅ Check ${i}: Data is consistent!`);
                } else {
                    console.error(`❌ Check ${i}: Data inconsistency detected!`);
                    if (!klassicOK) console.error(`   KLASSIC expected: calls=3,connected=1,emails=2 but got: ${klassicData}`);
                    if (!centexOK) console.error(`   CENTEX expected: calls=5,connected=2,emails=1 but got: ${centexData}`);
                }
            }
        }

        console.log('\n✅ Test completed. Now test opening/closing profiles for both leads to verify consistency.');
        return true;

    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
};

// Function to verify current lead data
window.checkLeadData = function(leadName) {
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const lead = leads.find(l => l.name && l.name.includes(leadName));

    if (lead) {
        console.log(`📊 ${leadName} Data:`, {
            id: lead.id,
            calls: lead.reachOut?.callAttempts || 0,
            connected: lead.reachOut?.callsConnected || 0,
            emails: lead.reachOut?.emailCount || 0,
            texts: lead.reachOut?.textCount || 0,
            voicemails: lead.reachOut?.voicemailCount || 0
        });
    } else {
        console.log(`❌ Lead containing "${leadName}" not found`);
    }
};

// Function to force-fix all shared references immediately
window.fixSharedReferences = function() {
    console.log('🔧 FORCE FIXING shared reachOut references...');

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

    leads.forEach((lead, index) => {
        // Force create new unique objects
        if (lead.reachOut) {
            const oldData = lead.reachOut;
            lead.reachOut = {
                callAttempts: typeof oldData.callAttempts === 'number' ? oldData.callAttempts : 0,
                callsConnected: typeof oldData.callsConnected === 'number' ? oldData.callsConnected : 0,
                emailCount: typeof oldData.emailCount === 'number' ? oldData.emailCount : 0,
                textCount: typeof oldData.textCount === 'number' ? oldData.textCount : 0,
                voicemailCount: typeof oldData.voicemailCount === 'number' ? oldData.voicemailCount : 0,
                // Deep copy arrays and preserve other properties
                callLogs: oldData.callLogs ? JSON.parse(JSON.stringify(oldData.callLogs)) : [],
                completedAt: oldData.completedAt,
                reachOutCompletedAt: oldData.reachOutCompletedAt,
                contacted: oldData.contacted,
                emailSent: oldData.emailSent,
                textSent: oldData.textSent
            };
        } else {
            lead.reachOut = {
                callAttempts: 0,
                callsConnected: 0,
                emailCount: 0,
                textCount: 0,
                voicemailCount: 0,
                callLogs: [],
                contacted: false,
                emailSent: false,
                textSent: false
            };
        }
    });

    localStorage.setItem('insurance_leads', JSON.stringify(leads));
    console.log(`✅ Force-fixed reachOut objects for ${leads.length} leads`);
};

console.log('🎯 INSTRUCTIONS:');
console.log('1. Run window.fixSharedReferences() - fixes shared references');
console.log('2. Run window.testReachOutConsistency() - sets unique test data');
console.log('3. Run window.checkLeadData("KLASSIC") - check specific lead data');
console.log('4. Open different lead profiles to verify unique stats');