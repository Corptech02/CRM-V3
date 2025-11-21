// FIX: Back to Inbox button should immediately reload emails
console.log('🔧 Fixing Back to Inbox button to auto-reload emails...');

// Override the backToInbox function to always reload emails immediately
window.backToInbox = function() {
    console.log('⬅️ Back to inbox - auto-reloading emails...');

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) {
        console.error('COI inbox not found');
        return;
    }

    // Show loading state immediately
    coiInbox.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
            <p>Loading emails...</p>
        </div>
    `;

    // Immediately reload emails
    if (typeof window.loadRealCOIEmails === 'function') {
        console.log('Using loadRealCOIEmails');
        window.loadRealCOIEmails();
    } else if (typeof window.loadCOIInbox === 'function') {
        console.log('Using loadCOIInbox');
        window.loadCOIInbox();
    } else {
        // Fallback - try to fetch emails directly
        console.log('Using fallback email loading');
        fetchAndDisplayEmails();
    }
};

// Fallback function to fetch and display emails
async function fetchAndDisplayEmails() {
    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    try {
        const response = await fetch('http://162-220-14-239.nip.io/api/gmail/messages?maxResults=20', {
            headers: {
                'Bypass-Tunnel-Reminder': 'true',
                'Cache-Control': 'no-cache'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch emails');
        }

        const emails = await response.json();
        console.log(`Loaded ${emails.length} emails`);

        // Display emails
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
                             style="cursor: pointer; padding: 15px; border-bottom: 1px solid #e5e7eb; background: white; transition: background 0.2s;"
                             onclick="expandEmail('${email.id}')"
                             onmouseover="this.style.background='#f9fafb'"
                             onmouseout="this.style.background='white'">

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
                                        ${email.attachments && email.attachments.length > 0 ?
                                            '<i class="fas fa-paperclip" style="margin-right: 8px; color: #9ca3af;"></i>' : ''}
                                        <span style="color: #9ca3af; font-size: 12px;">${dateStr}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Re-run status button injection after emails are loaded
        setTimeout(() => {
            if (typeof window.addStatusButtonsToEmails === 'function') {
                window.addStatusButtonsToEmails();
            }
            if (typeof window.injectStatusControls === 'function') {
                window.injectStatusControls();
            }
        }, 500);

    } catch (error) {
        console.error('Error loading emails:', error);
        coiInbox.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p>Error loading emails: ${error.message}</p>
                <button onclick="backToInbox()" style="margin-top: 10px; padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

// Also intercept any "Click below to reload emails" messages
const originalSetInterval = window.setInterval;
window.setInterval = function(callback, delay) {
    // Check if this is trying to show the reload message
    if (callback && callback.toString().includes('Click below to reload')) {
        console.log('Intercepted reload message - auto-reloading instead');
        // Don't show the message, just reload
        if (window.location.hash === '#coi') {
            backToInbox();
        }
        return null;
    }
    return originalSetInterval.apply(this, arguments);
};

// Monitor for the reload message and auto-click it
const checkForReloadMessage = setInterval(() => {
    const coiInbox = document.getElementById('coiInbox');
    if (coiInbox && coiInbox.innerHTML.includes('Click below to reload emails')) {
        console.log('Found reload message - auto-reloading...');

        // Find and click the reload button, or just reload directly
        const reloadBtn = coiInbox.querySelector('button');
        if (reloadBtn && reloadBtn.textContent.includes('Reload')) {
            reloadBtn.click();
        } else {
            backToInbox();
        }
    }
}, 500);

// Also fix it when emails are expanded
const originalExpandEmail = window.expandEmail;
if (originalExpandEmail) {
    window.expandEmail = async function(emailId) {
        // Save current inbox state before expanding
        const coiInbox = document.getElementById('coiInbox');
        if (coiInbox && !coiInbox.innerHTML.includes('Loading email')) {
            window.lastGoodInboxHTML = coiInbox.innerHTML;
        }

        // Call original expand function
        return originalExpandEmail.apply(this, arguments);
    };
}

console.log('✅ Back to Inbox fixed - will auto-reload emails');
console.log('📧 No more "Click below to reload emails" message!');