// COI Email Integration - Auto-switches between Gmail and Outlook
console.log('📧 COI Email Integration loading...');

(function() {
    'use strict';

    // Check which email provider is available
    async function detectEmailProvider() {
        // Force use Outlook since we just configured it
        console.log('✅ Using Outlook (vigagency.com) for COI emails');
        return 'outlook';

        /* Original detection logic - keeping for reference
        try {
            // Try Outlook first (since we just set it up)
            const outlookResponse = await fetch('/api/outlook/auth/status');
            const outlookData = await outlookResponse.json();

            if (outlookData.configured && outlookData.authenticated) {
                console.log('✅ Using Outlook for COI emails');
                return 'outlook';
            }
        } catch (e) {
            console.log('Outlook not available, checking Gmail...');
        }
        */

        try {
            // Fall back to Gmail
            const gmailResponse = await fetch('/api/gmail/auth/status');
            const gmailData = await gmailResponse.json();

            if (gmailData.authenticated) {
                console.log('✅ Using Gmail for COI emails');
                return 'gmail';
            }
        } catch (e) {
            console.log('Gmail not available');
        }

        console.warn('⚠️ No email provider configured');
        return null;
    }

    // Unified email fetching
    async function fetchEmails(provider = null) {
        if (!provider) {
            provider = await detectEmailProvider();
        }

        if (!provider) {
            return {
                success: false,
                emails: [],
                error: 'No email provider configured'
            };
        }

        try {
            const endpoint = provider === 'outlook'
                ? '/api/outlook/emails'
                : '/api/gmail/emails';

            const response = await fetch(endpoint);
            const data = await response.json();

            // Normalize the response
            if (provider === 'outlook' && data.emails) {
                return {
                    success: true,
                    emails: data.emails,
                    provider: 'outlook'
                };
            } else if (provider === 'gmail' && Array.isArray(data)) {
                return {
                    success: true,
                    emails: data,
                    provider: 'gmail'
                };
            }

            return {
                success: false,
                emails: [],
                error: data.error || 'Failed to fetch emails'
            };

        } catch (error) {
            console.error('Error fetching emails:', error);
            return {
                success: false,
                emails: [],
                error: error.message
            };
        }
    }

    // Unified email sending
    async function sendEmail(to, subject, body, attachments = []) {
        const provider = await detectEmailProvider();

        if (!provider) {
            throw new Error('No email provider configured');
        }

        const endpoint = provider === 'outlook'
            ? '/api/outlook/send'
            : '/api/gmail/send';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to,
                subject,
                body,
                attachments
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send email');
        }

        return await response.json();
    }

    // Override the loadCOIInbox function to use real emails
    const originalLoadCOIInbox = window.loadCOIInbox;
    window.loadCOIInbox = async function() {
        console.log('🔄 Loading real COI inbox...');

        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) {
            if (originalLoadCOIInbox) {
                return originalLoadCOIInbox();
            }
            return;
        }

        // Show loading state
        coiInbox.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #6c757d;"></i>
                <p style="margin-top: 10px; color: #6c757d;">Loading emails...</p>
            </div>
        `;

        // Fetch real emails
        const emailData = await fetchEmails();

        if (!emailData.success) {
            coiInbox.innerHTML = `
                <div style="padding: 20px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; margin: 10px;">
                    <h4 style="color: #dc2626; margin: 0 0 10px 0;">
                        <i class="fas fa-exclamation-triangle"></i> Email Not Connected
                    </h4>
                    <p style="color: #7f1d1d; margin: 0 0 15px 0;">${emailData.error}</p>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="window.setupOutlookEmail()" class="btn-primary" style="background: #0078d4;">
                            <i class="fas fa-envelope"></i> Connect Outlook
                        </button>
                        <button onclick="window.location.href='/gmail-auth.html'" class="btn-secondary">
                            <i class="fas fa-envelope"></i> Connect Gmail
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // Display emails
        const emails = emailData.emails;
        const provider = emailData.provider;

        if (emails.length === 0) {
            coiInbox.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #6c757d;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 20px; opacity: 0.3;"></i>
                    <p>No COI requests found</p>
                    <small>Connected to: ${provider === 'outlook' ? 'Outlook' : 'Gmail'}</small>
                </div>
            `;
            return;
        }

        // Build email list HTML
        let inboxHTML = `
            <div style="padding: 10px; background: #f0f9ff; border-bottom: 1px solid #bfdbfe;">
                <small style="color: #1e40af;">
                    <i class="fas fa-check-circle"></i> Connected to ${provider === 'outlook' ? 'Outlook' : 'Gmail'}
                </small>
            </div>
        `;

        emails.forEach((email, index) => {
            const emailDate = new Date(email.date);
            const dateStr = emailDate.toLocaleDateString() + ' ' + emailDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

            inboxHTML += `
                <div class="email-item ${email.isRead ? '' : 'unread'}" onclick="viewEmail('${email.id || email.messageId}', '${provider}')" style="cursor: pointer; padding: 15px; border-bottom: 1px solid #e5e7eb; ${!email.isRead ? 'background: #f0f9ff;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <div style="font-weight: ${email.isRead ? 'normal' : 'bold'}; color: #111827; margin-bottom: 5px;">
                                ${email.fromName || email.from || 'Unknown Sender'}
                            </div>
                            <div style="color: #374151; font-size: 14px; margin-bottom: 5px;">
                                ${email.subject || 'No Subject'}
                            </div>
                            <div style="color: #6b7280; font-size: 13px;">
                                ${email.preview || ''}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 12px; color: #6b7280; white-space: nowrap;">
                                ${dateStr}
                            </div>
                            ${email.hasAttachments ? '<i class="fas fa-paperclip" style="color: #6b7280; margin-top: 5px;"></i>' : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        coiInbox.innerHTML = inboxHTML;
    };

    // Function to view email details
    window.viewEmail = async function(emailId, provider) {
        console.log('Opening email:', emailId, 'from', provider);

        // You can implement a modal or panel to show full email content
        alert(`Email viewer not yet implemented.\nEmail ID: ${emailId}\nProvider: ${provider}`);
    };

    // Setup Outlook email (guide user through password setup)
    window.setupOutlookEmail = function() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;">
                <h2 style="margin: 0 0 20px 0;">Connect Outlook Email</h2>

                <p style="margin-bottom: 20px;">To connect your Outlook email, you need to update the password in the server configuration.</p>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <strong>Quick Setup:</strong>
                    <ol style="margin: 10px 0 0 20px; padding: 0;">
                        <li>SSH into the server</li>
                        <li>Run: <code>cd /var/www/vanguard/backend</code></li>
                        <li>Edit: <code>nano .env</code></li>
                        <li>Update: <code>OUTLOOK_PASSWORD=your_password</code></li>
                        <li>Save and restart: <code>pm2 restart vanguard-backend</code></li>
                    </ol>
                </div>

                <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <strong>⚠️ Important:</strong> If you have 2FA enabled, you'll need to use an App Password instead of your regular password.
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Close
                    </button>
                    <button onclick="window.location.reload()" style="padding: 10px 20px; background: #0078d4; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        I've Updated It - Refresh
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    };

    // Make functions globally available
    window.COIEmailIntegration = {
        detectProvider: detectEmailProvider,
        fetchEmails: fetchEmails,
        sendEmail: sendEmail
    };

    // Auto-refresh inbox every 30 seconds when on COI tab
    setInterval(() => {
        if (window.location.hash === '#coi' && document.getElementById('coiInbox')) {
            console.log('🔄 Auto-refreshing COI inbox...');
            window.loadCOIInbox();
        }
    }, 30000);

    console.log('✅ COI Email Integration ready');
})();