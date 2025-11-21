// DEBUG: COI Loading Issues
console.log('🔍 DEBUG: COI Load Monitor Active');

// Check what functions exist
setTimeout(() => {
    console.log('🔍 Function check:');
    console.log('- loadCOIView exists?', typeof window.loadCOIView);
    console.log('- loadCOIInbox exists?', typeof window.loadCOIInbox);
    console.log('- loadRealCOIEmails exists?', typeof window.loadRealCOIEmails);
    console.log('- Current hash:', window.location.hash);

    // If on COI page, check the inbox
    if (window.location.hash === '#coi') {
        const coiInbox = document.getElementById('coiInbox');
        if (coiInbox) {
            console.log('🔍 COI Inbox found');
            console.log('- Inner HTML length:', coiInbox.innerHTML.length);
            console.log('- Has email items?', coiInbox.querySelector('.email-item') ? 'YES' : 'NO');
            console.log('- Has status buttons?', coiInbox.querySelector('.status-btn-handled') ? 'YES' : 'NO');

            // If empty, try to load
            if (!coiInbox.querySelector('.email-item')) {
                console.log('🔍 Inbox is empty - attempting to load emails');
                if (window.loadRealCOIEmails) {
                    console.log('🔍 Calling loadRealCOIEmails()');
                    window.loadRealCOIEmails();
                } else if (window.loadCOIInbox) {
                    console.log('🔍 Calling loadCOIInbox()');
                    window.loadCOIInbox();
                } else {
                    console.error('🔍 ERROR: No email loading function available!');
                }
            }
        } else {
            console.log('🔍 COI Inbox element not found - page may not be loaded yet');
        }
    }
}, 1000);

// Monitor for changes
let lastCheck = '';
setInterval(() => {
    if (window.location.hash === '#coi') {
        const coiInbox = document.getElementById('coiInbox');
        if (coiInbox) {
            const currentState = coiInbox.innerHTML.substring(0, 100);
            if (currentState !== lastCheck) {
                console.log('🔍 COI Inbox content changed');
                lastCheck = currentState;

                // Check if it needs real emails
                if (!coiInbox.querySelector('.status-btn-handled') && coiInbox.querySelector('.email-item')) {
                    console.log('🔍 Found emails WITHOUT check/X buttons - reloading with buttons');
                    if (window.loadRealCOIEmails) {
                        window.loadRealCOIEmails();
                    }
                }
            }
        }
    }
}, 500);

console.log('🔍 DEBUG: Monitoring started');