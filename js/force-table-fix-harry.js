// FORCE FIX: Ensure Harry Welling shows red TODO text
console.log('🚨 FORCING HARRY WELLING TODO FIX');

function forceHarryWellingFix() {
    console.log('🔧 Step 1: Check current state...');

    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    const harry = leads.find(l => l.name && l.name.includes('HARRY WELLING'));

    if (!harry) {
        console.log('❌ Harry Welling not found!');
        return false;
    }

    console.log('✅ Found Harry Welling:', harry.name, 'ID:', harry.id);

    // Test the functions
    if (!window.getNextAction || !window.isHighlightActiveForLead) {
        console.log('❌ Required functions not available, forcing reload...');
        location.reload();
        return false;
    }

    const hasActiveHighlight = window.isHighlightActiveForLead(harry);
    const todoResult = window.getNextAction(harry.stage, harry);

    console.log('🔍 Function test results:');
    console.log('   isHighlightActiveForLead:', hasActiveHighlight);
    console.log('   getNextAction result:', `"${todoResult}"`);

    const shouldShowRedText = !hasActiveHighlight && ['quoted', 'info_requested', 'quote_sent'].includes(harry.stage);
    console.log('   Should show red text:', shouldShowRedText);

    if (shouldShowRedText && !todoResult.includes('color: #dc2626')) {
        console.log('🚨 ERROR: Function should return red text but does not!');
        return false;
    }

    console.log('🔧 Step 2: Force complete table regeneration...');

    // Force table regeneration
    if (window.generateSimpleLeadRows) {
        console.log('🔄 Regenerating table with generateSimpleLeadRows...');
        const tableBody = document.querySelector('#leadsTableBody') || document.querySelector('tbody');

        if (tableBody) {
            // Completely regenerate table content
            const freshLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            tableBody.innerHTML = window.generateSimpleLeadRows(freshLeads);
            console.log('✅ Table regenerated');
        }
    } else {
        // Fallback to other refresh methods
        if (window.displayLeads) {
            console.log('🔄 Using displayLeads...');
            window.displayLeads();
        } else if (window.loadLeadsView) {
            console.log('🔄 Using loadLeadsView...');
            window.loadLeadsView();
        }
    }

    // Wait for table update, then apply highlighting
    setTimeout(() => {
        console.log('🔧 Step 3: Apply highlighting with corrected logic...');

        if (window.applyReachOutCompleteHighlighting) {
            window.applyReachOutCompleteHighlighting();
        }

        // Final verification
        setTimeout(() => {
            console.log('🔧 Step 4: Final verification...');

            const tableBody = document.querySelector('#leadsTableBody') || document.querySelector('tbody');
            if (!tableBody) {
                console.log('❌ Cannot find table body for verification');
                return false;
            }

            const rows = tableBody.querySelectorAll('tr');
            let harryRow = null;

            rows.forEach(row => {
                const nameCell = row.querySelector('td:first-child');
                if (nameCell && nameCell.textContent.includes('HARRY WELLING')) {
                    harryRow = row;
                }
            });

            if (!harryRow) {
                console.log('❌ Harry Welling row not found after table regeneration!');
                return false;
            }

            const todoCell = harryRow.querySelectorAll('td')[6];
            if (!todoCell) {
                console.log('❌ TODO cell not found in Harry row!');
                return false;
            }

            const todoText = todoCell.textContent.trim();
            const todoHTML = todoCell.innerHTML;
            const hasRedStyling = todoHTML.includes('color: #dc2626') || todoHTML.includes('color:#dc2626');
            const hasGreenBg = harryRow.style.backgroundColor.includes('185, 129') || harryRow.classList.contains('reach-out-complete');

            console.log('📊 FINAL RESULTS FOR HARRY WELLING:');
            console.log(`   TODO cell text: "${todoText}"`);
            console.log(`   Has red styling: ${hasRedStyling}`);
            console.log(`   Has green background: ${hasGreenBg}`);

            const isFixed = hasRedStyling && !hasGreenBg && todoText.toLowerCase().includes('reach');

            if (isFixed) {
                console.log('\n🎉 SUCCESS! Harry Welling is now showing correctly:');
                console.log('✅ Red "reach out" text in TODO column');
                console.log('✅ No green highlighting');
                console.log('\n🎯 The fix is complete and working!');
                return true;
            } else {
                console.log('\n🚨 STILL BROKEN! Harry Welling is not showing correctly:');
                if (!hasRedStyling) console.log('❌ Missing red styling');
                if (hasGreenBg) console.log('❌ Still has green background');
                if (!todoText.includes('reach')) console.log('❌ TODO text wrong');

                console.log('\n🔧 Attempting one more fix...');

                // Manual fix - directly update the TODO cell
                todoCell.innerHTML = '<span style="color: #dc2626; font-weight: bold;">Reach out</span>';

                // Remove green styling
                harryRow.style.removeProperty('background-color');
                harryRow.style.removeProperty('background');
                harryRow.style.removeProperty('border-left');
                harryRow.style.removeProperty('border-right');
                harryRow.classList.remove('reach-out-complete');

                console.log('🔧 Applied manual fix to Harry Welling row');
                return false; // Still need to fix the underlying logic
            }
        }, 1000);
    }, 500);
}

// Run the fix immediately
forceHarryWellingFix();