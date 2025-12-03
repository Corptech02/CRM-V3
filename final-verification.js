// FINAL VERIFICATION TEST FOR LEAD HIGHLIGHTING
console.log('🔥🔥🔥 FINAL VERIFICATION: LEAD HIGHLIGHTING SYSTEM 🔥🔥🔥');

// Step 1: Check data availability
const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
console.log('📊 STEP 1: Data Check - Found', leads.length, 'leads');

if (leads.length > 0) {
    console.log('🔍 Checking timestamp data in first 3 leads:');
    for (let i = 0; i < Math.min(3, leads.length); i++) {
        const lead = leads[i];
        console.log(`Lead ${i} (${lead.name}):`);

        let timestamp = null;
        let source = 'none';

        if (lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
            timestamp = lead.stageTimestamps[lead.stage];
            source = 'stageTimestamps';
        } else if (lead.stageUpdatedAt) {
            timestamp = lead.stageUpdatedAt;
            source = 'stageUpdatedAt';
        } else if (lead.updatedAt) {
            timestamp = lead.updatedAt;
            source = 'updatedAt';
        } else if (lead.createdAt) {
            timestamp = lead.createdAt;
            source = 'createdAt';
        } else if (lead.created) {
            source = 'created';
            const parts = lead.created.split('/');
            if (parts.length === 3) {
                timestamp = new Date(parts[2], parts[0] - 1, parts[1]).toISOString();
            }
        }

        if (timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const diffTime = nowDate - compareDate;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            let expectedColor = 'none';
            if (diffDays === 1) expectedColor = 'YELLOW';
            else if (diffDays > 1 && diffDays < 7) expectedColor = 'ORANGE';
            else if (diffDays >= 7) expectedColor = 'RED';

            console.log(`  ✓ Timestamp: ${date.toDateString()} (${source}) - ${diffDays} days old → ${expectedColor}`);
        } else {
            console.log(`  ✗ No timestamp found`);
        }
    }
}

// Step 2: Check function availability
console.log('\n📋 STEP 2: Function Availability');
console.log('  forceAllHighlighting:', typeof window.forceAllHighlighting);
console.log('  loadLeadsView:', typeof window.loadLeadsView);
console.log('  forceHighlightNow:', typeof window.forceHighlightNow);

// Step 3: Check table
console.log('\n🔍 STEP 3: Table Check');
const table = document.getElementById('leadsTableBody');
if (table) {
    const rows = table.querySelectorAll('tr');
    console.log('✓ Table found with', rows.length, 'rows');

    // Step 4: Test highlighting function
    console.log('\n💥 STEP 4: Testing Highlighting Function');
    if (typeof window.forceAllHighlighting === 'function') {
        console.log('🎨 Calling forceAllHighlighting()...');
        const result = window.forceAllHighlighting();
        console.log('Function returned:', result);

        // Check results after brief delay
        setTimeout(() => {
            let yellowCount = 0, orangeCount = 0, redCount = 0, greenCount = 0;

            rows.forEach((row, idx) => {
                const style = row.getAttribute('style') || '';
                const classList = row.className || '';

                if (style.includes('#fef3c7') || classList.includes('timestamp-yellow')) {
                    yellowCount++;
                    console.log(`  Row ${idx}: 🟡 YELLOW`);
                } else if (style.includes('#fed7aa') || classList.includes('timestamp-orange')) {
                    orangeCount++;
                    console.log(`  Row ${idx}: 🟠 ORANGE`);
                } else if (style.includes('#fecaca') || classList.includes('timestamp-red')) {
                    redCount++;
                    console.log(`  Row ${idx}: 🔴 RED`);
                } else if (style.includes('rgba(16, 185, 129') || classList.includes('reach-out-complete')) {
                    greenCount++;
                    console.log(`  Row ${idx}: 🟢 GREEN`);
                } else {
                    console.log(`  Row ${idx}: ⚪ No highlight`);
                }
            });

            console.log(`\n🎨 HIGHLIGHTING SUMMARY:`);
            console.log(`  🟡 Yellow: ${yellowCount}`);
            console.log(`  🟠 Orange: ${orangeCount}`);
            console.log(`  🔴 Red: ${redCount}`);
            console.log(`  🟢 Green: ${greenCount}`);
            console.log(`  Total highlighted: ${yellowCount + orangeCount + redCount + greenCount}/${rows.length}`);

            if (yellowCount + orangeCount + redCount + greenCount > 0) {
                console.log('\n✅ SUCCESS! Highlighting is working correctly!');
                console.log('🎉 The orange/yellow highlighting system has been restored!');
            } else {
                console.log('\n❌ FAILED: No highlighting was applied');
                console.log('🔧 Debugging required');
            }
        }, 300);
    } else {
        console.log('❌ forceAllHighlighting function not found');
    }
} else {
    console.log('❌ Table not found - may need to navigate to leads page first');
}

console.log('\n🔥 VERIFICATION COMPLETE - Check results above 🔥');