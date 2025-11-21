// COI Email Reply System
console.log('📧 COI Reply System loaded');

// Store current email data for replies
window.currentEmailData = null;

// Get current provider function (if not already defined)
if (typeof getCurrentProvider === 'undefined') {
    window.getCurrentProvider = function() {
        const stored = localStorage.getItem('coi_email_provider');
        return stored === 'OUTLOOK' ? 'OUTLOOK' : 'GMAIL';
    };
}

// Get EMAIL_PROVIDERS (if not already defined)
if (typeof EMAIL_PROVIDERS === 'undefined') {
    window.EMAIL_PROVIDERS = {
        GMAIL: {
            name: 'Gmail',
            apiBase: window.VANGUARD_API_URL ? `${window.VANGUARD_API_URL}/api/gmail` : 'http://162-220-14-239.nip.io/api/gmail',
            email: 'corptech06@gmail.com'
        },
        OUTLOOK: {
            name: 'Outlook',
            apiBase: window.VANGUARD_API_URL ? `${window.VANGUARD_API_URL}/api/outlook` : 'http://162-220-14-239.nip.io/api/outlook',
            email: 'Not configured'
        }
    };
}

// Reply to email function
window.replyToEmail = function(emailId) {
    const email = window.currentEmailData;
    if (!email) {
        console.error('No email data available for reply');
        return;
    }

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    // Extract sender email
    const fromEmail = email.from.match(/<(.+)>/) ?
        email.from.match(/<(.+)>/)[1] :
        email.from;

    // Prepare reply subject
    const replySubject = email.subject && !email.subject.startsWith('Re:') ?
        `Re: ${email.subject}` :
        email.subject || 'Re: Your message';

    // Create quoted original message
    const originalDate = new Date(email.date || Date.now()).toLocaleString();
    const quotedMessage = `\n\n\n-----Original Message-----\nFrom: ${email.from}\nDate: ${originalDate}\nSubject: ${email.subject || 'No subject'}\n\n${email.body || email.snippet || ''}`;

    // Show reply compose form
    coiInbox.innerHTML = `
        <div class="reply-compose" style="padding: 20px;">
            <div style="margin-bottom: 20px; display: flex; gap: 10px;">
                <button class="btn-secondary btn-small" onclick="cancelReply()">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <h3 style="margin: 0; flex-grow: 1; color: #1f2937;">Compose Reply</h3>
            </div>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <!-- To Field -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 5px;">To:</label>
                    <input type="email" id="replyTo" value="${fromEmail}"
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;"
                           placeholder="recipient@example.com">
                </div>

                <!-- CC Field -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 5px;">CC (optional):</label>
                    <input type="text" id="replyCc"
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;"
                           placeholder="cc@example.com, another@example.com">
                </div>

                <!-- Subject Field -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 5px;">Subject:</label>
                    <input type="text" id="replySubject" value="${replySubject.replace(/"/g, '&quot;')}"
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
                </div>

                <!-- Message Body -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 5px;">Message:</label>
                    <textarea id="replyBody"
                              style="width: 100%; min-height: 300px; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; font-family: inherit; resize: vertical;"
                              placeholder="Type your reply here...">${quotedMessage}</textarea>
                </div>

                <!-- Quick Templates -->
                <div style="margin-bottom: 15px; padding: 10px; background: #f9fafb; border-radius: 4px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 10px;">Quick Templates:</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        <button onclick="insertTemplate('received')"
                                style="padding: 5px 10px; background: white; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            📋 COI Received
                        </button>
                        <button onclick="insertTemplate('missing')"
                                style="padding: 5px 10px; background: white; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            ⚠️ Missing Info
                        </button>
                        <button onclick="insertTemplate('approved')"
                                style="padding: 5px 10px; background: white; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            ✅ COI Approved
                        </button>
                        <button onclick="insertTemplate('followup')"
                                style="padding: 5px 10px; background: white; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            🔄 Follow Up
                        </button>
                    </div>
                </div>

                <!-- Send Button and Status -->
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button class="btn-primary" onclick="sendReply()" id="sendReplyBtn" style="padding: 12px 24px;">
                        <i class="fas fa-paper-plane"></i> Send Reply
                    </button>
                    <button class="btn-secondary" onclick="saveDraft()" style="padding: 12px 24px;">
                        <i class="fas fa-save"></i> Save Draft
                    </button>
                    <div id="replyStatus" style="margin-left: 15px; color: #6b7280; font-size: 14px;"></div>
                </div>
            </div>

            <!-- Original Message Preview -->
            <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="color: #6b7280; font-size: 12px; margin-bottom: 10px;">
                    <strong>Original Message:</strong>
                </div>
                <div style="color: #374151; font-size: 14px;">
                    <div><strong>From:</strong> ${email.from}</div>
                    <div><strong>Subject:</strong> ${email.subject || 'No subject'}</div>
                    <div style="margin-top: 10px; white-space: pre-wrap; max-height: 200px; overflow-y: auto;">
                        ${(email.body || email.snippet || '').substring(0, 500)}${(email.body || email.snippet || '').length > 500 ? '...' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Focus on the message body
    setTimeout(() => {
        const bodyField = document.getElementById('replyBody');
        if (bodyField) {
            bodyField.focus();
            bodyField.setSelectionRange(0, 0); // Move cursor to beginning
        }
    }, 100);
};

// Insert email template
window.insertTemplate = function(type) {
    const bodyField = document.getElementById('replyBody');
    if (!bodyField) return;

    const templates = {
        received: `Thank you for submitting your Certificate of Insurance (COI).

We have received your documentation and will review it shortly. You should expect to hear back from us within 1-2 business days.

If we need any additional information, we will contact you directly.

Best regards,
Vanguard Insurance Team`,

        missing: `Thank you for your COI submission.

After reviewing your documentation, we need the following additional information:

• [Please specify what's missing]
• [Additional requirement]

Please provide the missing information at your earliest convenience so we can complete the processing of your COI.

Thank you for your cooperation.

Best regards,
Vanguard Insurance Team`,

        approved: `Good news!

Your Certificate of Insurance (COI) has been reviewed and approved.

All requirements have been met and your coverage is now on file. If you need any confirmation documentation or have questions, please don't hesitate to reach out.

Thank you for your business!

Best regards,
Vanguard Insurance Team`,

        followup: `Hello,

I'm following up on the COI request we sent earlier.

We still need your Certificate of Insurance to proceed. Please submit it at your earliest convenience to avoid any delays.

If you have any questions or need assistance, please let me know.

Best regards,
Vanguard Insurance Team`
    };

    // Get current position
    const start = bodyField.selectionStart;
    const end = bodyField.selectionEnd;
    const currentText = bodyField.value;

    // Insert template at cursor position
    const newText = currentText.substring(0, start) +
                    templates[type] +
                    currentText.substring(end);

    bodyField.value = newText;

    // Set cursor after inserted text
    const newPosition = start + templates[type].length;
    bodyField.setSelectionRange(newPosition, newPosition);
    bodyField.focus();
};

// Send reply
window.sendReply = async function() {
    const to = document.getElementById('replyTo').value.trim();
    const cc = document.getElementById('replyCc').value.trim();
    const subject = document.getElementById('replySubject').value.trim();
    const body = document.getElementById('replyBody').value.trim();

    if (!to) {
        alert('Please enter a recipient email address');
        return;
    }

    if (!body) {
        alert('Please enter a message');
        return;
    }

    const sendBtn = document.getElementById('sendReplyBtn');
    const status = document.getElementById('replyStatus');

    // Show sending state
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    status.innerHTML = 'Sending email...';

    try {
        // Determine which provider to use
        const provider = getCurrentProvider();
        const config = EMAIL_PROVIDERS[provider];

        // Convert plain text to HTML for better formatting
        const htmlBody = body.replace(/\n/g, '<br>');

        // Send via the appropriate API
        const response = await fetch(`${config.apiBase}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify({
                to: to,
                cc: cc,
                subject: subject,
                body: htmlBody
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send email');
        }

        // Success!
        status.innerHTML = '<span style="color: #10b981;"><i class="fas fa-check-circle"></i> Email sent successfully!</span>';

        // Store sent email in localStorage
        const sentEmails = JSON.parse(localStorage.getItem('coi_sent_emails') || '[]');
        sentEmails.unshift({
            id: Date.now(),
            to: to,
            cc: cc,
            subject: subject,
            body: body,
            date: new Date().toISOString(),
            inReplyTo: window.currentEmailData?.id,
            provider: provider
        });
        localStorage.setItem('coi_sent_emails', JSON.stringify(sentEmails.slice(0, 100))); // Keep last 100

        // Return to inbox after 2 seconds
        setTimeout(() => {
            backToInbox();
        }, 2000);

    } catch (error) {
        console.error('Error sending email:', error);
        status.innerHTML = `<span style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i> ${error.message}</span>`;

        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reply';
    }
};

// Save draft
window.saveDraft = function() {
    const to = document.getElementById('replyTo').value.trim();
    const cc = document.getElementById('replyCc').value.trim();
    const subject = document.getElementById('replySubject').value.trim();
    const body = document.getElementById('replyBody').value.trim();

    const drafts = JSON.parse(localStorage.getItem('coi_email_drafts') || '[]');

    drafts.unshift({
        id: Date.now(),
        to: to,
        cc: cc,
        subject: subject,
        body: body,
        date: new Date().toISOString(),
        inReplyTo: window.currentEmailData?.id
    });

    // Keep only last 50 drafts
    localStorage.setItem('coi_email_drafts', JSON.stringify(drafts.slice(0, 50)));

    const status = document.getElementById('replyStatus');
    status.innerHTML = '<span style="color: #10b981;"><i class="fas fa-check"></i> Draft saved!</span>';

    setTimeout(() => {
        status.innerHTML = '';
    }, 3000);
};

// Cancel reply and go back
window.cancelReply = function() {
    if (window.currentEmailData) {
        // Go back to email view
        expandEmail(window.currentEmailData.id);
    } else {
        // Go back to inbox
        backToInbox();
    }
};

// Override the expandEmail function to store email data
const originalExpandEmail = window.expandEmail;
window.expandEmail = async function(emailId) {
    const provider = getCurrentProvider();
    const config = EMAIL_PROVIDERS[provider];

    console.log(`Expanding email ${emailId} from ${config.name}`);

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    window.previousInboxContent = coiInbox.innerHTML;

    try {
        coiInbox.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
                <p>Loading email from ${config.name}...</p>
            </div>
        `;

        const response = await fetch(`${config.apiBase}/messages/${emailId}`, {
            headers: {
                'Bypass-Tunnel-Reminder': 'true'
            }
        });

        if (!response.ok) throw new Error('Failed to load email');

        const email = await response.json();

        // Store email data for reply
        window.currentEmailData = email;

        coiInbox.innerHTML = `
            <div class="email-detail-view" style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <button class="btn-secondary btn-small" onclick="backToInbox()">
                        <i class="fas fa-arrow-left"></i> Back to Inbox
                    </button>
                    <span style="margin-left: 10px; color: #6b7280; font-size: 14px;">
                        Provider: ${config.name}
                    </span>
                </div>

                <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #1f2937;">${email.subject || 'No subject'}</h3>
                    <div style="color: #6b7280; font-size: 14px;">
                        <div><strong>From:</strong> ${email.from || 'Unknown'}</div>
                        <div><strong>To:</strong> ${email.to || config.email}</div>
                        <div><strong>Date:</strong> ${new Date(email.date || Date.now()).toLocaleString()}</div>
                        ${email.attachments && email.attachments.length > 0 ?
                            `<div><strong>Attachments:</strong> ${email.attachments.map(a => a.filename).join(', ')}</div>` : ''}
                    </div>
                </div>

                <div style="padding: 20px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
                    <div style="white-space: pre-wrap; font-family: inherit;">${email.body || email.snippet || 'No content'}</div>
                </div>

                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-primary" onclick="replyToEmail('${emailId}')">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    <button class="btn-secondary" onclick="replyAllToEmail('${emailId}')">
                        <i class="fas fa-reply-all"></i> Reply All
                    </button>
                    <button class="btn-secondary" onclick="forwardEmail('${emailId}')">
                        <i class="fas fa-share"></i> Forward
                    </button>
                    <button class="btn-secondary" onclick="prepareCOI('${emailId}')">
                        <i class="fas fa-file-contract"></i> Prepare COI
                    </button>
                    <button class="btn-secondary" onclick="showSentEmails()" style="margin-left: auto;">
                        <i class="fas fa-paper-plane"></i> Sent Mail
                    </button>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error expanding email:', error);
        backToInbox();
    }
};

// Reply All function
window.replyAllToEmail = function(emailId) {
    replyToEmail(emailId);

    // Add CC recipients if available
    setTimeout(() => {
        const ccField = document.getElementById('replyCc');
        if (ccField && window.currentEmailData) {
            // Parse all recipients from the original email
            const allRecipients = [];

            // Add original sender
            const fromEmail = window.currentEmailData.from.match(/<(.+)>/) ?
                window.currentEmailData.from.match(/<(.+)>/)[1] :
                window.currentEmailData.from;

            // Add other recipients if available
            if (window.currentEmailData.to) {
                const toEmails = window.currentEmailData.to.split(',').map(e => e.trim());
                allRecipients.push(...toEmails.filter(e => e && !e.includes(getCurrentProvider() === 'GMAIL' ? 'corptech06' : EMAIL_PROVIDERS.OUTLOOK.email)));
            }

            ccField.value = allRecipients.join(', ');
        }
    }, 100);
};

// Forward email function
window.forwardEmail = function(emailId) {
    const email = window.currentEmailData;
    if (!email) return;

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    const fwdSubject = email.subject && !email.subject.startsWith('Fwd:') ?
        `Fwd: ${email.subject}` :
        email.subject || 'Fwd: Your message';

    const originalDate = new Date(email.date || Date.now()).toLocaleString();
    const forwardedMessage = `\n\n\n---------- Forwarded message ----------\nFrom: ${email.from}\nDate: ${originalDate}\nSubject: ${email.subject || 'No subject'}\n\n${email.body || email.snippet || ''}`;

    coiInbox.innerHTML = `
        <div class="forward-compose" style="padding: 20px;">
            <div style="margin-bottom: 20px; display: flex; gap: 10px;">
                <button class="btn-secondary btn-small" onclick="cancelReply()">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <h3 style="margin: 0; flex-grow: 1; color: #1f2937;">Forward Email</h3>
            </div>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 5px;">To:</label>
                    <input type="email" id="replyTo"
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;"
                           placeholder="forward-to@example.com">
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 5px;">CC (optional):</label>
                    <input type="text" id="replyCc"
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;"
                           placeholder="cc@example.com">
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 5px;">Subject:</label>
                    <input type="text" id="replySubject" value="${fwdSubject.replace(/"/g, '&quot;')}"
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 5px;">Add a message:</label>
                    <textarea id="replyBody"
                              style="width: 100%; min-height: 300px; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; font-family: inherit; resize: vertical;"
                              placeholder="Add a note (optional)...">${forwardedMessage}</textarea>
                </div>

                <div style="display: flex; gap: 10px; align-items: center;">
                    <button class="btn-primary" onclick="sendReply()" id="sendReplyBtn" style="padding: 12px 24px;">
                        <i class="fas fa-share"></i> Forward
                    </button>
                    <div id="replyStatus" style="margin-left: 15px; color: #6b7280; font-size: 14px;"></div>
                </div>
            </div>
        </div>
    `;
};

// Show sent emails
window.showSentEmails = function() {
    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    const sentEmails = JSON.parse(localStorage.getItem('coi_sent_emails') || '[]');

    if (sentEmails.length === 0) {
        coiInbox.innerHTML = `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <button class="btn-secondary btn-small" onclick="backToInbox()">
                        <i class="fas fa-arrow-left"></i> Back to Inbox
                    </button>
                </div>
                <div style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-paper-plane" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p><strong>No sent emails yet</strong></p>
                </div>
            </div>
        `;
        return;
    }

    coiInbox.innerHTML = `
        <div style="padding: 20px;">
            <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <button class="btn-secondary btn-small" onclick="backToInbox()">
                    <i class="fas fa-arrow-left"></i> Back to Inbox
                </button>
                <h3 style="margin: 0; color: #1f2937;">Sent Emails</h3>
            </div>

            <div class="email-list" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                ${sentEmails.map(email => {
                    const date = new Date(email.date);
                    const dateStr = date.toLocaleString();

                    return `
                        <div class="sent-email-item" style="padding: 15px; border-bottom: 1px solid #e5e7eb; background: white; cursor: pointer;"
                             onclick="viewSentEmail(${email.id})">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <strong style="color: #1f2937;">To: ${email.to}</strong>
                                <span style="color: #6b7280; font-size: 12px;">${dateStr}</span>
                            </div>
                            <div style="color: #374151; margin-bottom: 5px;">${email.subject}</div>
                            <div style="color: #9ca3af; font-size: 14px;">
                                ${email.body.replace(/<br>/g, ' ').substring(0, 100)}...
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
};

// View sent email
window.viewSentEmail = function(emailId) {
    const sentEmails = JSON.parse(localStorage.getItem('coi_sent_emails') || '[]');
    const email = sentEmails.find(e => e.id === emailId);

    if (!email) return;

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    coiInbox.innerHTML = `
        <div style="padding: 20px;">
            <div style="margin-bottom: 20px;">
                <button class="btn-secondary btn-small" onclick="showSentEmails()">
                    <i class="fas fa-arrow-left"></i> Back to Sent
                </button>
            </div>

            <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937;">${email.subject}</h3>
                <div style="color: #6b7280; font-size: 14px;">
                    <div><strong>To:</strong> ${email.to}</div>
                    ${email.cc ? `<div><strong>CC:</strong> ${email.cc}</div>` : ''}
                    <div><strong>Sent:</strong> ${new Date(email.date).toLocaleString()}</div>
                    <div><strong>Provider:</strong> ${email.provider || 'Unknown'}</div>
                </div>
            </div>

            <div style="padding: 20px; background: #f9fafb; border-radius: 8px;">
                <div style="white-space: pre-wrap; font-family: inherit;">${email.body.replace(/<br>/g, '\n')}</div>
            </div>
        </div>
    `;
};

console.log('✅ COI Reply System active - Full email functionality enabled');