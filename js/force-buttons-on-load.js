// FORCE STATUS BUTTONS ON INITIAL LOAD
console.log('⚡ Force buttons on load - ensuring status buttons appear immediately');

// Function to add buttons whenever emails are detected
function ensureStatusButtons() {
    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    // Check if we have email items but no buttons
    const emailItems = coiInbox.querySelectorAll('.email-item, [onclick*="expandEmail"], [style*="cursor: pointer"][style*="padding"]');
    const existingButtons = coiInbox.querySelectorAll('.status-buttons-final, .nuclear-buttons, .email-status-controls-aggressive');

    if (emailItems.length > 0 && existingButtons.length === 0) {
        console.log(`⚡ Found ${emailItems.length} emails without buttons - adding now!`);

        // Try all button injection methods
        if (typeof window.addStatusButtonsToEmails === 'function') {
            window.addStatusButtonsToEmails();
        }
        if (typeof window.injectStatusControls === 'function') {
            window.injectStatusControls();
        }
        if (typeof window.nuclearForceButtons === 'function') {
            window.nuclearForceButtons();
        }
    }
}

// Override loadRealCOIEmails to ensure buttons are added
const originalLoadRealCOIEmails = window.loadRealCOIEmails;
if (originalLoadRealCOIEmails) {
    window.loadRealCOIEmails = async function() {
        console.log('⚡ Intercepted loadRealCOIEmails - will add buttons after load');
        const result = await originalLoadRealCOIEmails.apply(this, arguments);

        // Add buttons after a short delay to ensure emails are rendered
        setTimeout(ensureStatusButtons, 500);
        setTimeout(ensureStatusButtons, 1000);
        setTimeout(ensureStatusButtons, 1500);

        return result;
    };
}

// Monitor for COI page navigation
function checkForCOIPage() {
    if (window.location.hash === '#coi') {
        const coiInbox = document.getElementById('coiInbox');
        if (coiInbox) {
            // Check if emails are loaded
            const hasEmails = coiInbox.querySelector('.email-item') ||
                             coiInbox.querySelector('[onclick*="expandEmail"]');

            if (hasEmails) {
                console.log('⚡ COI page detected with emails - ensuring buttons');
                ensureStatusButtons();
            } else {
                // If no emails yet, wait and try to load them
                console.log('⚡ COI page detected but no emails - loading...');
                if (typeof window.loadRealCOIEmails === 'function') {
                    window.loadRealCOIEmails();
                }
            }
        }
    }
}

// Check on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('⚡ Page loaded - checking for COI');
    setTimeout(checkForCOIPage, 100);
    setTimeout(checkForCOIPage, 500);
    setTimeout(checkForCOIPage, 1000);
});

// Check on hash change
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#coi') {
        console.log('⚡ Navigated to COI - ensuring buttons');
        setTimeout(checkForCOIPage, 100);
        setTimeout(checkForCOIPage, 500);
        setTimeout(checkForCOIPage, 1000);
    }
});

// Also check periodically for the first 5 seconds after page load
let checkCount = 0;
const initialCheck = setInterval(() => {
    checkCount++;
    if (checkCount > 10) {
        clearInterval(initialCheck);
        return;
    }

    if (window.location.hash === '#coi') {
        checkForCOIPage();
    }
}, 500);

// Monitor DOM for email list changes
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.target.id === 'coiInbox' || mutation.target.closest('#coiInbox')) {
            // Check if emails were just added
            const hasEmails = document.querySelector('#coiInbox .email-item');
            const hasButtons = document.querySelector('#coiInbox .status-buttons-final, #coiInbox .nuclear-buttons');

            if (hasEmails && !hasButtons) {
                console.log('⚡ Emails detected via mutation - adding buttons');
                setTimeout(ensureStatusButtons, 300);
            }
        }
    }
});

// Start observing when ready
if (document.body) {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Force immediate check if already on COI page
if (window.location.hash === '#coi') {
    console.log('⚡ Already on COI page - immediate check');
    checkForCOIPage();
}

console.log('✅ Force buttons on load initialized - buttons will appear on page load/refresh');