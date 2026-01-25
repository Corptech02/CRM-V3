// APP SENT STAGE VERIFICATION SCRIPT
console.log('🔍 APP SENT VERIFICATION - Loading...');

function verifyAppSentFix() {
    setTimeout(() => {
        console.log('================================================');
        console.log('🔍 VERIFYING APP SENT STAGE FUNCTIONALITY');
        console.log('================================================');

        try {
            // Check for app sent leads
            const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            const appSentLeads = leads.filter(l => l.stage === 'app sent' || l.stage === 'app_sent');

            console.log(`📊 Total leads: ${leads.length}`);
            console.log(`📊 App sent leads: ${appSentLeads.length}`);

            if (appSentLeads.length === 0) {
                console.log('❌ No app sent leads found to verify');
                return;
            }

            // Test each app sent lead
            appSentLeads.forEach((lead, index) => {
                console.log(`\n🔍 Testing app sent lead ${index + 1}: ${lead.name} (ID: ${lead.id})`);

                // Test isHighlightActiveForLead function
                if (window.isHighlightActiveForLead) {
                    const hasActiveHighlight = window.isHighlightActiveForLead(lead);
                    console.log(`   isHighlightActiveForLead: ${hasActiveHighlight} ${hasActiveHighlight ? '✅' : '❌'}`);
                } else {
                    console.log('   isHighlightActiveForLead: FUNCTION NOT FOUND ❌');
                }

                // Test getNextAction function
                if (window.getNextAction) {
                    const todoResult = window.getNextAction(lead.stage, lead);
                    const isEmpty = todoResult === '' || todoResult.length === 0;
                    console.log(`   getNextAction result: "${todoResult}" ${isEmpty ? '✅' : '❌'}`);
                } else {
                    console.log('   getNextAction: FUNCTION NOT FOUND ❌');
                }

                // Check DOM table highlighting
                const tableBody = document.querySelector('tbody');
                if (tableBody) {
                    const rows = tableBody.querySelectorAll('tr');
                    let leadRow = null;

                    rows.forEach(row => {
                        const checkbox = row.querySelector('.lead-checkbox');
                        if (checkbox && String(checkbox.value) === String(lead.id)) {
                            leadRow = row;
                        }
                    });

                    if (leadRow) {
                        const hasGreenBg = leadRow.style.backgroundColor.includes('185, 129') ||
                                          leadRow.classList.contains('reach-out-complete');
                        console.log(`   Table row green highlight: ${hasGreenBg ? '✅' : '❌'}`);

                        const todoCell = leadRow.querySelectorAll('td')[6];
                        if (todoCell) {
                            const todoText = todoCell.textContent.trim();
                            const todoHTML = todoCell.innerHTML;
                            const isEmpty = todoText === '' || todoText.length === 0;
                            const hasReviewLead = todoText.includes('Review lead');

                            console.log(`   TODO cell text: "${todoText}"`);
                            console.log(`   TODO cell HTML: "${todoHTML}"`);
                            console.log(`   TODO cell empty: ${isEmpty ? '✅' : '❌'}`);

                            if (hasReviewLead) {
                                console.log(`   ❌ STILL SHOWING "Review lead" - FIX NEEDED!`);
                            }
                        } else {
                            console.log('   TODO cell: NOT FOUND ❌');
                        }
                    } else {
                        console.log('   Table row: NOT FOUND ❌');
                    }
                } else {
                    console.log('   Table body: NOT FOUND ❌');
                }
            });

            // Test showCallStatus override
            console.log('\n🔍 TESTING SHOWCALLSTATUS OVERRIDE:');
            console.log('   protectedFunctions available:', !!window.protectedFunctions);
            console.log('   protectedFunctions.showCallStatus available:', !!(window.protectedFunctions?.showCallStatus));
            console.log('   global showCallStatus available:', !!window.showCallStatus);
            console.log('   showCallStatusEnhanced available:', !!window.showCallStatusEnhanced);
            console.log('   showAppSentHighlightModal available:', !!window.showAppSentHighlightModal);

            // Summary
            console.log('\n================================================');
            console.log('📊 APP SENT VERIFICATION SUMMARY');
            console.log('================================================');

            const expectedBehavior = [
                'App sent leads should have green table highlighting',
                'App sent leads should have empty TODO cells',
                'isHighlightActiveForLead should return true for app sent',
                'getNextAction should return empty string for app sent',
                'Highlight duration button should show "Indefinite" modal'
            ];

            expectedBehavior.forEach(behavior => {
                console.log(`📋 ${behavior}`);
            });

            console.log('\n🎯 To test highlight duration button:');
            console.log('   1. Find an app sent lead in the table');
            console.log('   2. Click the "Highlight Duration" button');
            console.log('   3. Should see green "Indefinite" modal instead of gray "No Active Highlight"');

        } catch (error) {
            console.error('❌ Error during app sent verification:', error);
        }
    }, 2000);
}

// Run verification automatically
verifyAppSentFix();

// Make function available globally
window.verifyAppSentFix = verifyAppSentFix;

console.log('✅ App sent verification script loaded');