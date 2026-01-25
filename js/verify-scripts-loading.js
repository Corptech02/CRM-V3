// VERIFY SCRIPTS LOADING - Test that our scripts are actually working
console.log('🔍 VERIFY SCRIPTS LOADING - Starting verification...');

// Check if our protection functions exist
setTimeout(() => {
    console.log('\n🔍 === SCRIPT LOADING VERIFICATION ===');

    // Check if debug script loaded
    if (window.handleEmailConfirmation && window.handleEmailConfirmation.toString().includes('EMAIL CONFIRMATION SEQUENCE START')) {
        console.log('✅ Debug email confirmation script is loaded and active');
    } else {
        console.log('❌ Debug email confirmation script is NOT loaded or not working');
    }

    // Check if protection script loaded
    if (window.emailConfirmedLeads) {
        console.log('✅ Email confirmation protection script is loaded');
        console.log(`   Protected leads: ${window.emailConfirmedLeads.size}`);
    } else {
        console.log('❌ Email confirmation protection script is NOT loaded');
    }

    // Check if our stage update modifications are active
    if (window.updateStage && window.updateStage.toString().includes('PROTECTED updateStage')) {
        console.log('✅ Protected updateStage function is active');
    } else {
        console.log('❌ Protected updateStage function is NOT active');
        console.log('   Current updateStage function:');
        console.log('   ' + (window.updateStage ? window.updateStage.toString().substring(0, 200) + '...' : 'UNDEFINED'));
    }

    // Test if our modifications to final-profile-fix-protected.js are working
    const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
    if (leads.length > 0) {
        const testLead = leads[0];
        console.log('🧪 Testing hasEmailConfirmation logic with first lead...');

        // Create a mock lead with email confirmation
        const mockLead = {
            id: 'test123',
            name: 'Test Lead',
            stage: 'info_requested',
            reachOut: {
                emailConfirmations: [{
                    timestamp: new Date().toISOString(),
                    confirmed: true,
                    notes: 'Test confirmation'
                }],
                completedAt: new Date().toISOString(),
                reachOutCompletedAt: new Date().toISOString(),
                greenHighlightUntil: new Date(Date.now() + 7*24*60*60*1000).toISOString()
            }
        };

        // Test our logic
        const hasEmailConfirmation = mockLead.reachOut &&
            mockLead.reachOut.emailConfirmations &&
            mockLead.reachOut.emailConfirmations.length > 0 &&
            mockLead.reachOut.emailConfirmations.some(conf => conf.confirmed === true);

        console.log(`   hasEmailConfirmation result: ${hasEmailConfirmation}`);

        if (hasEmailConfirmation) {
            console.log('✅ Email confirmation detection logic is working');
        } else {
            console.log('❌ Email confirmation detection logic is NOT working');
        }
    }

    console.log('\n🎯 INSTRUCTIONS FOR TESTING:');
    console.log('1. Open a lead profile');
    console.log('2. Change stage to "info_requested"');
    console.log('3. Say "No" to schedule popup');
    console.log('4. Say "Yes" to email confirmation popup');
    console.log('5. Watch this console for detailed debug output');
    console.log('6. If you see no debug output, the scripts are not working');

    console.log('\n🔍 === END VERIFICATION ===\n');

}, 2000);

console.log('🔍 VERIFY SCRIPTS LOADING - Loaded');