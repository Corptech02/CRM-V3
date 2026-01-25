// FINAL COMPREHENSIVE TEST - All systems working together
console.log('🎯 FINAL COMPREHENSIVE TEST: ALL SYSTEMS INTEGRATION');
console.log('==================================================');

function runFinalTest() {
    console.log('🔧 Testing complete integrated system...');

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    console.log(`📊 Found ${leads.length} total leads`);

    // Test specific leads
    const testNames = ['HARRY WELLING', 'Rock Hard', 'Howard', 'Maples'];

    testNames.forEach(searchName => {
        const lead = leads.find(l => l.name && l.name.includes(searchName));

        if (lead) {
            console.log(`\n📋 TESTING: ${lead.name} (ID: ${lead.id})`);
            console.log(`   Stage: ${lead.stage}`);

            // 1. Test highlight status function
            let hasActiveHighlight = false;
            if (window.isHighlightActiveForLead) {
                hasActiveHighlight = window.isHighlightActiveForLead(lead);
                console.log(`   🔍 Highlight Active: ${hasActiveHighlight}`);
            } else {
                console.log(`   ❌ isHighlightActiveForLead function not found`);
            }

            // 2. Test getNextAction function
            let todoResult = '';
            if (window.getNextAction) {
                todoResult = window.getNextAction(lead.stage, lead);
                console.log(`   🎯 TODO Result: "${todoResult}"`);
            } else {
                console.log(`   ❌ getNextAction function not found`);
            }

            // 3. Expected behavior check
            const stagesNeedingReachOut = ['quoted', 'info_requested', 'quote_sent', 'quote-sent-unaware', 'quote-sent-aware', 'interested'];
            if (stagesNeedingReachOut.includes(lead.stage)) {
                console.log(`   📝 EXPECTED BEHAVIOR:`);

                if (hasActiveHighlight) {
                    console.log(`      - Should show: GREEN highlight + NO todo text`);
                    const isCorrect = todoResult === '' && hasActiveHighlight;
                    console.log(`      - ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}: Empty todo = ${todoResult === ''}, Active highlight = ${hasActiveHighlight}`);
                } else {
                    console.log(`      - Should show: NO green highlight + RED "reach out" text`);
                    const isCorrect = todoResult.includes('color: #dc2626') && !hasActiveHighlight;
                    console.log(`      - ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}: Red text = ${todoResult.includes('color: #dc2626')}, No highlight = ${!hasActiveHighlight}`);
                }
            } else {
                console.log(`   ℹ️  Stage "${lead.stage}" does not require reach-out`);
            }
        } else {
            console.log(`❌ Lead containing "${searchName}" not found`);
        }
    });

    console.log('\n🔧 Forcing table refresh and highlighting update...');

    // Force table refresh
    if (window.displayLeads) {
        window.displayLeads();
        console.log('✅ displayLeads() called');
    } else if (window.loadLeadsView) {
        window.loadLeadsView();
        console.log('✅ loadLeadsView() called');
    }

    // Force highlighting update
    setTimeout(() => {
        if (window.applyReachOutCompleteHighlighting) {
            window.applyReachOutCompleteHighlighting();
            console.log('✅ applyReachOutCompleteHighlighting() called');
        }

        console.log('\n🎯 Check the lead table now:');
        console.log('  - Leads with ACTIVE highlights should be GREEN with NO todo text');
        console.log('  - Leads with NO/EXPIRED highlights should have RED "reach out" text and NO green highlighting');
        console.log('\n✅ FINAL TEST COMPLETE!');
    }, 1000);
}

// Run the test
runFinalTest();

// Make it available for manual testing
window.runFinalTest = runFinalTest;