// AGGRESSIVE FIX - Force back button to ALWAYS reload emails immediately
console.log('🔥 AGGRESSIVE BACK BUTTON FIX LOADING...');

// Override backToInbox globally and aggressively
Object.defineProperty(window, 'backToInbox', {
    value: function() {
        console.log('🔥 AGGRESSIVE BACK - RELOADING EMAILS NOW!');

        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) {
            console.error('No COI inbox found');
            return;
        }

        // IMMEDIATELY show loading and fetch emails
        coiInbox.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
                <p>Loading emails...</p>
            </div>
        `;

        // Force reload emails RIGHT NOW
        if (typeof window.loadRealCOIEmails === 'function') {
            window.loadRealCOIEmails();
        } else {
            // Direct fetch if no function available
            fetch('http://162-220-14-239.nip.io/api/gmail/messages?maxResults=20', {
                headers: {
                    'Bypass-Tunnel-Reminder': 'true',
                    'Cache-Control': 'no-cache'
                },
                cache: 'no-store'
            })
            .then(response => response.json())
            .then(emails => {
                displayEmailsDirectly(emails);
            })
            .catch(error => {
                console.error('Error:', error);
                coiInbox.innerHTML = `<div style="color: red; padding: 20px;">Error loading emails: ${error.message}</div>`;
            });
        }
    },
    writable: false,
    configurable: false
});

// Function to display emails directly
function displayEmailsDirectly(emails) {
    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    console.log(`Displaying ${emails.length} emails`);

    coiInbox.innerHTML = `
        <div class="email-list">
            ${emails.map(email => {
                const date = new Date(email.date);
                const isToday = date.toDateString() === new Date().toDateString();
                const dateStr = isToday ?
                    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                const fromMatch = email.from.match(/\"?([^\"<]+)\"?\s*<?/);
                const senderName = fromMatch ? fromMatch[1].trim() : email.from.split('@')[0];

                return `
                    <div class="email-item"
                         style="cursor: pointer; padding: 15px; border-bottom: 1px solid #e5e7eb; background: white; position: relative;"
                         onclick="expandEmail('${email.id}')">

                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <div style="margin-bottom: 5px;">
                                    <i class="fas fa-circle" style="color: #667eea; font-size: 8px; margin-right: 8px;"></i>
                                    <strong style="color: #1f2937;">${senderName}</strong>
                                </div>
                                <div style="color: #374151; font-weight: 500;">${email.subject}</div>
                                <div style="margin-top: 5px; font-size: 13px; color: #6b7280;">
                                    ${email.snippet ? email.snippet.substring(0, 100) + '...' : ''}
                                </div>
                                <div style="margin-top: 5px;">
                                    <span style="color: #9ca3af; font-size: 12px;">${dateStr}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // Try to add status buttons after a delay
    setTimeout(() => {
        if (typeof window.addStatusButtonsToEmails === 'function') {
            window.addStatusButtonsToEmails();
        }
        if (typeof window.nuclearForceButtons === 'function') {
            // Use nuclear option if regular buttons don't work
            console.log('Using nuclear force for buttons...');
            window.nuclearForceButtons();
        }
    }, 500);
}

// Intercept ALL click events at the HIGHEST priority
document.addEventListener('click', function(e) {
    // Check if this is ANY back button
    const target = e.target;
    const button = target.closest('button');

    if (button) {
        const text = button.textContent || '';
        const hasBackIcon = button.querySelector('.fa-arrow-left') || button.querySelector('[class*="arrow-left"]');
        const isBackButton = text.includes('Back') || text.includes('back') || hasBackIcon;

        if (isBackButton) {
            // Check if we're in an email detail view
            const coiInbox = document.getElementById('coiInbox');
            if (coiInbox) {
                const emailDetail = coiInbox.querySelector('.email-detail-view');
                if (emailDetail) {
                    console.log('🔥 INTERCEPTED BACK BUTTON - FORCING RELOAD!');
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    // Force reload
                    window.backToInbox();
                    return false;
                }
            }
        }
    }
}, true); // CAPTURE phase - runs FIRST

// Monitor DOM for "Click below to reload" and KILL IT
const killReloadMessage = new MutationObserver((mutations) => {
    const coiInbox = document.getElementById('coiInbox');
    if (coiInbox && coiInbox.innerHTML.includes('Click below to reload')) {
        console.log('🔥 FOUND RELOAD MESSAGE - KILLING IT!');
        window.backToInbox();
    }
});

// Start monitoring
if (document.getElementById('coiInbox')) {
    killReloadMessage.observe(document.getElementById('coiInbox'), {
        childList: true,
        subtree: true
    });
}

// Monitor for COI inbox creation
const bodyObserver = new MutationObserver(() => {
    const coiInbox = document.getElementById('coiInbox');
    if (coiInbox && !coiInbox.hasAttribute('data-monitored')) {
        coiInbox.setAttribute('data-monitored', 'true');
        killReloadMessage.observe(coiInbox, {
            childList: true,
            subtree: true
        });
    }
});

bodyObserver.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('✅ AGGRESSIVE BACK FIX ACTIVE!');
console.log('🔥 Back button will ALWAYS reload emails immediately');
console.log('🚫 "Click below to reload" message DISABLED');