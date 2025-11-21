// KILL FAKE EMAILS - Override app.js's loadCOIInbox that loads sample emails
console.log('🔥 KILLING FAKE EMAILS - Overriding loadCOIInbox to load REAL emails with buttons');

// Override the fake loadCOIInbox with our real one
window.loadCOIInbox = function() {
    console.log('🔥 INTERCEPTED loadCOIInbox - Loading REAL emails instead of fake ones!');

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    // Show loading state
    coiInbox.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
            <p>Loading real emails from Gmail...</p>
        </div>
    `;

    // Load REAL emails with status buttons
    if (typeof window.loadRealCOIEmails === 'function') {
        console.log('🔥 Using loadRealCOIEmails');
        window.loadRealCOIEmails();
    } else {
        console.log('🔥 Direct API call for emails');
        // Direct API call
        fetch('http://162-220-14-239.nip.io/api/gmail/messages?maxResults=20', {
            headers: {
                'Bypass-Tunnel-Reminder': 'true',
                'Cache-Control': 'no-cache'
            },
            cache: 'no-store'
        })
        .then(response => response.json())
        .then(emails => {
            displayRealEmailsWithButtons(emails);
        })
        .catch(error => {
            console.error('Error loading emails:', error);
            coiInbox.innerHTML = `<div style="color: red; padding: 20px;">Error loading emails: ${error.message}</div>`;
        });
    }
};

// Function to display real emails with buttons
function displayRealEmailsWithButtons(emails) {
    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    console.log(`🔥 Displaying ${emails.length} REAL emails with status buttons`);

    // Get stored statuses
    const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');

    coiInbox.innerHTML = `
        <div class="email-list">
            ${emails.map((email, index) => {
                const date = new Date(email.date);
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const fromMatch = email.from.match(/\"?([^\"<]+)\"?\s*<?/);
                const senderName = fromMatch ? fromMatch[1].trim() : email.from.split('@')[0];
                const emailId = email.id || `email_${index}`;
                const status = statuses[emailId];

                const bgStyle = status === 'handled' ?
                    'background: linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%); border-left: 4px solid #10b981;' :
                    status === 'unimportant' ?
                    'background: linear-gradient(to right, #fee2e2 0%, #fef2f2 100%); border-left: 4px solid #ef4444; opacity: 0.7;' :
                    'background: white;';

                return `
                    <div class="email-item unread"
                         style="cursor: pointer; padding: 15px; border-bottom: 1px solid #e5e7eb; position: relative; ${bgStyle}"
                         onclick="expandEmail('${emailId}')"
                         data-email-id="${emailId}">

                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <div style="margin-bottom: 5px;">
                                    <i class="fas fa-circle" style="color: #667eea; font-size: 8px; margin-right: 8px;"></i>
                                    <strong style="color: #1f2937;">${senderName}</strong>
                                </div>
                                <div style="color: #374151; font-weight: 500;">${email.subject || 'No Subject'}</div>
                                <div style="margin-top: 5px; font-size: 13px; color: #6b7280;">
                                    ${email.snippet ? email.snippet.substring(0, 100) + '...' : ''}
                                </div>
                                <div style="margin-top: 5px;">
                                    <span style="color: #9ca3af; font-size: 12px;">${dateStr}</span>
                                </div>
                            </div>

                            <!-- Status buttons ALWAYS included -->
                            <div class="status-buttons-forced" style="display: flex; gap: 8px; z-index: 1000;">
                                <button onclick="event.stopPropagation(); handleStatusClick('${emailId}', 'handled', this); return false;"
                                        style="background: white; border: 2px solid ${status === 'handled' ? '#10b981' : '#e5e7eb'};
                                               border-radius: 50%; width: 36px; height: 36px; cursor: pointer; padding: 0;
                                               display: flex; align-items: center; justify-content: center;">
                                    <i class="${status === 'handled' ? 'fas' : 'far'} fa-check-circle"
                                       style="font-size: 22px; color: ${status === 'handled' ? '#10b981' : '#9ca3af'};"></i>
                                </button>
                                <button onclick="event.stopPropagation(); handleStatusClick('${emailId}', 'unimportant', this); return false;"
                                        style="background: white; border: 2px solid ${status === 'unimportant' ? '#ef4444' : '#e5e7eb'};
                                               border-radius: 50%; width: 36px; height: 36px; cursor: pointer; padding: 0;
                                               display: flex; align-items: center; justify-content: center;">
                                    <i class="${status === 'unimportant' ? 'fas' : 'far'} fa-times-circle"
                                       style="font-size: 22px; color: ${status === 'unimportant' ? '#ef4444' : '#9ca3af'};"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    console.log('🔥 Real emails displayed with buttons!');
}

// Global handler for status button clicks
window.handleStatusClick = function(emailId, newStatus, button) {
    console.log(`🔥 Status click: ${emailId} -> ${newStatus}`);

    const emailElement = button.closest('.email-item');
    const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');
    const currentStatus = statuses[emailId];

    if (currentStatus === newStatus) {
        // Remove status
        delete statuses[emailId];
        emailElement.style.background = 'white';
        emailElement.style.borderLeft = '';
        emailElement.style.opacity = '1';
    } else {
        // Set new status
        statuses[emailId] = newStatus;

        if (newStatus === 'handled') {
            emailElement.style.background = 'linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%)';
            emailElement.style.borderLeft = '4px solid #10b981';
            emailElement.style.opacity = '1';
        } else if (newStatus === 'unimportant') {
            emailElement.style.background = 'linear-gradient(to right, #fee2e2 0%, #fef2f2 100%)';
            emailElement.style.borderLeft = '4px solid #ef4444';
            emailElement.style.opacity = '0.7';
        }
    }

    localStorage.setItem('coi_email_status', JSON.stringify(statuses));

    // Update button appearances
    const buttons = emailElement.querySelectorAll('.status-buttons-forced button');
    if (buttons[0]) { // Handled button
        const icon = buttons[0].querySelector('i');
        if (statuses[emailId] === 'handled') {
            buttons[0].style.borderColor = '#10b981';
            icon.className = 'fas fa-check-circle';
            icon.style.color = '#10b981';
        } else {
            buttons[0].style.borderColor = '#e5e7eb';
            icon.className = 'far fa-check-circle';
            icon.style.color = '#9ca3af';
        }
    }
    if (buttons[1]) { // Unimportant button
        const icon = buttons[1].querySelector('i');
        if (statuses[emailId] === 'unimportant') {
            buttons[1].style.borderColor = '#ef4444';
            icon.className = 'fas fa-times-circle';
            icon.style.color = '#ef4444';
        } else {
            buttons[1].style.borderColor = '#e5e7eb';
            icon.className = 'far fa-times-circle';
            icon.style.color = '#9ca3af';
        }
    }
};

// Also kill any future attempts to load fake emails
const originalLoadCOIInbox = window.loadCOIInbox;
Object.defineProperty(window, 'loadCOIInbox', {
    get: function() {
        return originalLoadCOIInbox;
    },
    set: function(newFunc) {
        console.log('🔥 BLOCKED attempt to override loadCOIInbox');
        // Don't allow it to be overridden
    },
    configurable: false
});

console.log('✅ FAKE EMAILS KILLED - loadCOIInbox now loads REAL emails with status buttons');
console.log('🔥 The flash you saw was app.js trying to load fake emails - now blocked!');