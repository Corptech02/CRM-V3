// URGENT: Verify Harry Welling fix is actually working
console.log('🚨 URGENT VERIFICATION: Testing Harry Welling fix...');

function verifyHarryWellingFix() {
    console.log('==================================================');
    console.log('🔍 STEP 1: Check Harry Welling in localStorage');
    console.log('==================================================');

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const harry = leads.find(l => l.name && l.name.includes('HARRY WELLING'));

    if (!harry) {
        console.log('❌ CRITICAL: Harry Welling not found in localStorage!');
        return false;
    }

    console.log('✅ Found Harry Welling:', harry.name);
    console.log('   ID:', harry.id);
    console.log('   Stage:', harry.stage);
    console.log('   ReachOut data:', harry.reachOut);

    console.log('\n==================================================');
    console.log('🔍 STEP 2: Test highlight status function');
    console.log('==================================================');

    let hasActiveHighlight = false;
    if (window.isHighlightActiveForLead) {
        hasActiveHighlight = window.isHighlightActiveForLead(harry);
        console.log('✅ isHighlightActiveForLead result:', hasActiveHighlight);
    } else {
        console.log('❌ CRITICAL: isHighlightActiveForLead function not available!');
        return false;
    }

    console.log('\n==================================================');
    console.log('🔍 STEP 3: Test getNextAction function');
    console.log('==================================================');

    let todoResult = '';
    if (window.getNextAction) {
        todoResult = window.getNextAction(harry.stage, harry);
        console.log('✅ getNextAction result:', `"${todoResult}"`);

        if (todoResult.includes('color: #dc2626')) {
            console.log('✅ CORRECT: Returns red styled text');
        } else {
            console.log('❌ INCORRECT: Should return red styled text but got:', todoResult);
        }
    } else {
        console.log('❌ CRITICAL: getNextAction function not available!');
        return false;
    }

    console.log('\n==================================================');
    console.log('🔍 STEP 4: Force table refresh and check DOM');
    console.log('==================================================');

    // Force table refresh
    if (window.displayLeads) {
        console.log('🔄 Calling displayLeads()...');
        window.displayLeads();
    } else if (window.loadLeadsView) {
        console.log('🔄 Calling loadLeadsView()...');
        window.loadLeadsView();
    } else {
        console.log('❌ No table refresh function found');
    }

    // Wait for table to update, then check DOM
    setTimeout(() => {
        console.log('\n==================================================');
        console.log('🔍 STEP 5: Check actual table DOM');
        console.log('==================================================');

        const tableBody = document.querySelector('#leads-table tbody') ||
                          document.querySelector('#leadsTableBody') ||
                          document.querySelector('tbody');

        if (!tableBody) {
            console.log('❌ CRITICAL: Cannot find table body in DOM!');
            return false;
        }

        const rows = tableBody.querySelectorAll('tr');
        console.log(`📊 Found ${rows.length} rows in table`);

        let harryRow = null;
        rows.forEach(row => {
            const nameCell = row.querySelector('td:first-child');
            if (nameCell && nameCell.textContent.includes('HARRY WELLING')) {
                harryRow = row;
            }
        });

        if (!harryRow) {
            console.log('❌ CRITICAL: Harry Welling row not found in DOM table!');
            return false;
        }

        console.log('✅ Found Harry Welling row in DOM');

        // Check TODO column (typically 7th column, index 6)
        const todoCell = harryRow.querySelectorAll('td')[6];
        if (!todoCell) {
            console.log('❌ CRITICAL: TODO cell not found in Harry Welling row!');
            return false;
        }

        const todoContent = todoCell.innerHTML;
        const todoText = todoCell.textContent.trim();

        console.log('📋 Harry Welling TODO cell content:', `"${todoText}"`);
        console.log('📋 Harry Welling TODO cell HTML:', todoContent);

        // Check for red styling
        const hasRedStyling = todoContent.includes('color: #dc2626') ||
                             todoContent.includes('color:#dc2626') ||
                             todoContent.includes('color: rgb(220, 38, 38)');

        // Check for green highlighting on row
        const rowStyles = harryRow.style;
        const hasGreenBackground = rowStyles.backgroundColor.includes('185, 129') ||
                                  rowStyles.background.includes('185, 129') ||
                                  harryRow.classList.contains('reach-out-complete');

        console.log('\n==================================================');
        console.log('🎯 FINAL VERIFICATION RESULTS');
        console.log('==================================================');

        console.log('Expected behavior for Harry Welling:');
        console.log('  - Profile shows: "No Active Highlight" ✅');
        console.log('  - Profile shows: "TO DO: Call" ✅');
        console.log('  - Table should show: RED "reach out" text');
        console.log('  - Table should show: NO green highlighting');

        console.log('Actual results:');
        console.log(`  - TODO cell text: "${todoText}"`);
        console.log(`  - Has red styling: ${hasRedStyling ? '✅ YES' : '❌ NO'}`);
        console.log(`  - Has green background: ${hasGreenBackground ? '❌ YES (should be NO)' : '✅ NO'}`);

        const isCorrect = hasRedStyling && !hasGreenBackground && todoText.toLowerCase().includes('reach');

        if (isCorrect) {
            console.log('\n🎉 SUCCESS: Harry Welling fix is working correctly!');
            console.log('✅ Shows red reach-out text');
            console.log('✅ No green highlighting');
            return true;
        } else {
            console.log('\n🚨 FAILURE: Harry Welling fix is NOT working!');

            if (!hasRedStyling) {
                console.log('❌ Missing red reach-out text styling');
            }
            if (hasGreenBackground) {
                console.log('❌ Still has green highlighting (should be removed)');
            }
            if (!todoText.toLowerCase().includes('reach')) {
                console.log('❌ TODO text does not contain "reach"');
            }

            console.log('\n🔧 DIAGNOSTICS:');
            console.log('   hasActiveHighlight:', hasActiveHighlight);
            console.log('   todoResult:', `"${todoResult}"`);
            console.log('   Stage requires reach-out:', ['quoted', 'info_requested', 'quote_sent'].includes(harry.stage));

            return false;
        }

    }, 1500);
}

// Run the verification immediately
verifyHarryWellingFix();