// IMMEDIATE COI LOAD - Force emails to load with buttons on page refresh/load
console.log('🚀 Immediate COI load - ensuring emails load with buttons on refresh');

// Function to load COI emails immediately if on COI page
function immediatelyLoadCOI() {
    if (window.location.hash === '#coi') {
        console.log('🚀 On COI page - loading emails immediately');

        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) {
            console.log('🚀 Waiting for COI inbox element...');
            setTimeout(immediatelyLoadCOI, 100);
            return;
        }

        // Check if emails are already loaded
        const hasEmails = coiInbox.querySelector('.email-item') ||
                         coiInbox.querySelector('[onclick*="expandEmail"]');

        if (!hasEmails) {
            console.log('🚀 No emails found - loading now!');

            // Show loading state
            coiInbox.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
                    <p>Loading emails...</p>
                </div>
            `;

            // Load emails
            if (typeof window.loadRealCOIEmails === 'function') {
                window.loadRealCOIEmails();
            } else {
                // Fallback: direct API call
                fetch('http://162-220-14-239.nip.io/api/gmail/messages?maxResults=20', {
                    headers: {
                        'Bypass-Tunnel-Reminder': 'true',
                        'Cache-Control': 'no-cache'
                    },
                    cache: 'no-store'
                })
                .then(response => response.json())
                .then(emails => {
                    displayEmailsWithButtons(emails);
                })
                .catch(error => {
                    console.error('🚀 Error loading emails:', error);
                });
            }
        } else {
            console.log('🚀 Emails already present - adding buttons');
            // Emails exist but might not have buttons
            setTimeout(() => {
                if (typeof window.addStatusButtonsToEmails === 'function') {
                    window.addStatusButtonsToEmails();
                }
                if (typeof window.nuclearForceButtons === 'function') {
                    window.nuclearForceButtons();
                }
            }, 500);
        }
    }
}

// Function to display emails with buttons built-in
function displayEmailsWithButtons(emails) {
    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    console.log(`🚀 Displaying ${emails.length} emails with buttons`);

    // Get stored statuses
    const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');

    coiInbox.innerHTML = `
        <div class="email-list">
            ${emails.map((email, index) => {
                const date = new Date(email.date);
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const fromMatch = email.from.match(/\"?([^\"<]+)\"?\s*<?/);
                const senderName = fromMatch ? fromMatch[1].trim() : email.from.split('@')[0];
                const status = statuses[email.id] || statuses[`email_${index}`];

                const bgStyle = status === 'handled' ?
                    'background: linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%); border-left: 4px solid #10b981;' :
                    status === 'unimportant' ?
                    'background: linear-gradient(to right, #fee2e2 0%, #fef2f2 100%); border-left: 4px solid #ef4444; opacity: 0.7;' :
                    '';

                return `
                    <div class="email-item"
                         style="cursor: pointer; padding: 15px; border-bottom: 1px solid #e5e7eb; position: relative; ${bgStyle}"
                         onclick="expandEmail('${email.id}')"
                         data-email-id="${email.id}">

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

                            <!-- Status buttons built-in -->
                            <div class="status-buttons-final" style="display: flex; gap: 8px; z-index: 100;">
                                <button onclick="event.stopPropagation(); toggleEmailStatus('${email.id}', 'handled', this.parentElement.parentElement.parentElement); return false;"
                                        style="background: white; border: 2px solid ${status === 'handled' ? '#10b981' : '#e5e7eb'};
                                               border-radius: 50%; width: 36px; height: 36px; cursor: pointer; padding: 0;">
                                    <i class="${status === 'handled' ? 'fas' : 'far'} fa-check-circle"
                                       style="font-size: 22px; color: ${status === 'handled' ? '#10b981' : '#9ca3af'};"></i>
                                </button>
                                <button onclick="event.stopPropagation(); toggleEmailStatus('${email.id}', 'unimportant', this.parentElement.parentElement.parentElement); return false;"
                                        style="background: white; border: 2px solid ${status === 'unimportant' ? '#ef4444' : '#e5e7eb'};
                                               border-radius: 50%; width: 36px; height: 36px; cursor: pointer; padding: 0;">
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
}

// Global function to toggle email status
window.toggleEmailStatus = function(emailId, newStatus, emailElement) {
    console.log(`🚀 Toggling ${emailId} to ${newStatus}`);

    const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');
    const currentStatus = statuses[emailId];

    if (currentStatus === newStatus) {
        // Remove status
        delete statuses[emailId];
        emailElement.style.background = '';
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
    const buttons = emailElement.querySelectorAll('button');
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

// Run immediately when script loads
immediatelyLoadCOI();

// Also run on DOMContentLoaded
document.addEventListener('DOMContentLoaded', immediatelyLoadCOI);

// And on hash change
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#coi') {
        immediatelyLoadCOI();
    }
});

console.log('✅ Immediate COI load initialized - emails will load with buttons on refresh');