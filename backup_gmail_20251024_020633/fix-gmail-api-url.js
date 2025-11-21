// Fix Gmail API URL to use correct backend port
(function() {
    'use strict';

    console.log('🔧 Fixing Gmail API URL to use backend on port 3001...');

    // Update the REAL_GMAIL_API constant to use the correct backend
    window.REAL_GMAIL_API = 'http://162-220-14-239.nip.io:3001/api/gmail';

    // Override expandEmail to use the correct API
    const originalExpandEmail = window.expandEmail;

    window.expandEmail = async function(emailId) {
        console.log('📧 Expanding email:', emailId, 'using backend:', window.REAL_GMAIL_API);

        const coiInbox = document.getElementById('coi-inbox');
        if (!coiInbox) {
            console.error('COI inbox container not found');
            return;
        }

        // Show loading state
        coiInbox.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
                <p>Loading email...</p>
            </div>
        `;

        try {
            // Fetch from the correct backend endpoint
            const response = await fetch(`${window.REAL_GMAIL_API}/messages/${emailId}`, {
                headers: {
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load email: ${response.status} ${response.statusText}`);
            }

            const email = await response.json();
            console.log('✅ Email loaded successfully:', email.subject);

            // Display the email
            coiInbox.innerHTML = `
                <div class="email-detail-view" style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <button class="btn-secondary btn-small" onclick="backToInbox()">
                            <i class="fas fa-arrow-left"></i> Back to Inbox
                        </button>
                    </div>

                    <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 15px 0; color: #1f2937;">${email.subject || 'No subject'}</h3>
                        <div style="color: #6b7280; font-size: 14px;">
                            <div><strong>From:</strong> ${email.from || 'Unknown'}</div>
                            <div><strong>To:</strong> ${email.to || ''}</div>
                            <div><strong>Date:</strong> ${new Date(email.date || Date.now()).toLocaleString()}</div>
                        </div>
                    </div>

                    <div style="padding: 20px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
                        <pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${email.body || email.snippet || 'No content'}</pre>
                    </div>

                    ${email.attachments && email.attachments.length > 0 ? `
                        <div style="margin-bottom: 20px;">
                            <h4 style="color: #4b5563; margin-bottom: 10px;">
                                <i class="fas fa-paperclip"></i> Attachments (${email.attachments.length})
                            </h4>
                            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                                ${email.attachments.map(att => `
                                    <div style="padding: 10px; background: white; border: 1px solid #e5e7eb;
                                              border-radius: 6px; display: flex; align-items: center; gap: 8px;">
                                        <i class="fas fa-file"></i>
                                        <span>${att.filename || 'Attachment'}</span>
                                        ${att.size ? `<span style="color: #9ca3af; font-size: 12px;">(${(att.size/1024).toFixed(1)}KB)</span>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div style="display: flex; gap: 10px;">
                        <button class="btn-primary" onclick="alert('Reply feature coming soon')">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                        <button class="btn-secondary" onclick="prepareCOI('${emailId}')">
                            <i class="fas fa-file-contract"></i> Prepare COI
                        </button>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('❌ Error expanding email:', error);

            // Show error message
            coiInbox.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #ef4444; margin-bottom: 20px;"></i>
                    <h3 style="color: #1f2937; margin-bottom: 10px;">Unable to Load Email</h3>
                    <p style="color: #6b7280; margin-bottom: 20px;">${error.message}</p>
                    <button class="btn-secondary" onclick="backToInbox()">
                        <i class="fas fa-arrow-left"></i> Back to Inbox
                    </button>
                </div>
            `;
        }
    };

    // Also fix loadEmails if it exists
    if (window.loadEmails) {
        const originalLoadEmails = window.loadEmails;
        window.loadEmails = function() {
            // Update API URL before loading
            window.REAL_GMAIL_API = 'http://162-220-14-239.nip.io:3001/api/gmail';
            return originalLoadEmails.apply(this, arguments);
        };
    }

    console.log('✅ Gmail API URL fixed to use port 3001');
})();