// COI Email Expansion Fix - Ensures email clicking works
console.log('COI Email Fix loading...');

// Use event delegation to handle all email clicks
document.addEventListener('click', function(event) {
    // Check if action button was clicked
    const actionBtn = event.target.closest('.email-action-btn');
    if (actionBtn) {
        event.preventDefault();
        event.stopPropagation();

        const action = actionBtn.getAttribute('data-action');
        const emailId = actionBtn.getAttribute('data-email-id');

        if (action === 'read') {
            window.markAsRead(emailId);
        } else if (action === 'process') {
            window.processGmailCOI(emailId);
        }
        return;
    }

    // Check if clicked element is within an email-item
    const emailItem = event.target.closest('.email-item');
    if (emailItem && !event.target.closest('.email-actions')) {
        const emailId = emailItem.getAttribute('data-email-id');
        if (emailId) {
            console.log('Email clicked with ID:', emailId);
            event.preventDefault();
            event.stopPropagation();
            window.expandEmail(emailId);
        }
    }
});

// Make expandEmail function available globally and add debugging
window.expandEmail = function(emailId) {
    console.log('expandEmail called with ID:', emailId);

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) {
        console.error('coiInbox element not found!');
        return;
    }

    // Store current content
    if (!window.originalInboxHTML) {
        window.originalInboxHTML = coiInbox.innerHTML;
    }

    // Show loading
    coiInbox.innerHTML = `
        <div style="padding: 20px;">
            <div style="margin-bottom: 20px;">
                <button class="btn-secondary btn-small" onclick="backToInbox()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-arrow-left"></i> Back to Inbox
                </button>
            </div>
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
                <p>Loading email...</p>
            </div>
        </div>
    `;

    // Fetch email details
    const API_URL = window.VANGUARD_API_URL ? `${window.VANGUARD_API_URL}/api/gmail` : 'http://162-220-14-239.nip.io/api/gmail';

    fetch(`${API_URL}/messages/${emailId}`, {
        headers: {
            'Bypass-Tunnel-Reminder': 'true'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to load email');
        return response.json();
    })
    .then(email => {
        // Display the email
        coiInbox.innerHTML = `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <button class="btn-secondary btn-small" onclick="backToInbox()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-arrow-left"></i> Back to Inbox
                    </button>
                </div>

                <div style="background: white; padding: 20px; border-radius: 8px;">
                    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">${email.subject || 'No Subject'}</h2>

                    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
                        <div style="color: #6b7280; font-size: 14px;">
                            <div style="margin-bottom: 8px;"><strong>From:</strong> ${email.from || 'Unknown'}</div>
                            <div style="margin-bottom: 8px;"><strong>To:</strong> ${email.to || 'Unknown'}</div>
                            <div><strong>Date:</strong> ${new Date(email.date).toLocaleString()}</div>
                        </div>
                    </div>

                    <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                        <pre style="white-space: pre-wrap; word-wrap: break-word; font-family: inherit; margin: 0; line-height: 1.6;">
${email.body || email.snippet || 'No content available'}
                        </pre>
                    </div>

                    ${email.attachments && email.attachments.length > 0 ? `
                        <div style="margin-bottom: 20px;">
                            <strong>Attachments:</strong>
                            ${email.attachments.map(att => `
                                <span style="display: inline-block; margin: 4px; padding: 4px 8px; background: #e5e7eb; border-radius: 4px; font-size: 12px;">
                                    <i class="fas fa-paperclip"></i> ${att.filename}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}

                    <div style="display: flex; gap: 10px;">
                        <button class="btn-primary" onclick="alert('Reply feature coming soon')" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                        <button class="btn-secondary" onclick="alert('Forward feature coming soon')" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-share"></i> Forward
                        </button>
                    </div>
                </div>
            </div>
        `;
    })
    .catch(error => {
        console.error('Error loading email:', error);
        coiInbox.innerHTML = `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <button class="btn-secondary btn-small" onclick="backToInbox()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-arrow-left"></i> Back to Inbox
                    </button>
                </div>
                <div style="text-align: center; padding: 40px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>Error loading email: ${error.message}</p>
                </div>
            </div>
        `;
    });
};

// Back to inbox function
window.backToInbox = function() {
    console.log('Going back to inbox...');
    const coiInbox = document.getElementById('coiInbox');

    if (coiInbox && window.originalInboxHTML) {
        coiInbox.innerHTML = window.originalInboxHTML;
    } else if (window.loadRealCOIEmails) {
        window.loadRealCOIEmails();
    } else {
        console.error('Cannot restore inbox - no original content or loadRealCOIEmails function');
    }
};

// Test function to verify it's working
window.testEmailClick = function() {
    console.log('Test: expandEmail function exists?', typeof window.expandEmail === 'function');
    console.log('Test: backToInbox function exists?', typeof window.backToInbox === 'function');

    // Find first email and try to expand it
    const firstEmail = document.querySelector('.email-item');
    if (firstEmail) {
        const emailId = firstEmail.getAttribute('data-email-id');
        console.log('Test: Found email with ID:', emailId);
        if (emailId) {
            window.expandEmail(emailId);
        }
    } else {
        console.log('Test: No email items found on page');
    }
};

console.log('COI Email Fix ready - expandEmail and backToInbox functions available');
console.log('Run testEmailClick() in console to test');