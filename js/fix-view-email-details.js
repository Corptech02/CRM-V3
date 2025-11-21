// Fix for viewEmailDetails function - maps to expandEmail from coi-email-fix.js
console.log('📧 Fixing viewEmailDetails function to work with Gmail integration');

// Map viewEmailDetails to expandEmail function
window.viewEmailDetails = function(emailId) {
    console.log('viewEmailDetails called for:', emailId);

    // If expandEmail exists, use it
    if (typeof window.expandEmail === 'function') {
        console.log('Using expandEmail function');
        window.expandEmail(emailId);
    } else {
        console.log('expandEmail not found, implementing inline');

        // Inline implementation as fallback
        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) {
            console.error('COI inbox container not found');
            return;
        }

        // Store current inbox content
        window.savedInboxHTML = coiInbox.innerHTML;
        console.log('Saved inbox HTML for back navigation');

        // Show loading state
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
            if (!response.ok) {
                throw new Error('Failed to fetch email');
            }
            return response.json();
        })
        .then(email => {
            console.log('Fetched email:', email);

            // Format date
            const formatDate = (dateStr) => {
                const date = new Date(dateStr);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            };

            // Build attachments HTML
            let attachmentsHtml = '';
            if (email.attachments && email.attachments.length > 0) {
                attachmentsHtml = `
                    <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
                        <h4 style="margin: 0 0 10px 0; color: #374151;">Attachments:</h4>
                        ${email.attachments.map(att => `
                            <div style="padding: 8px; background: white; border-radius: 4px; margin-bottom: 8px;">
                                <i class="fas fa-paperclip" style="color: #6b7280; margin-right: 8px;"></i>
                                ${att.filename} (${(att.size / 1024).toFixed(1)} KB)
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            // Display email content
            coiInbox.innerHTML = `
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <button class="btn-secondary btn-small" onclick="backToInbox()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-arrow-left"></i> Back to Inbox
                        </button>
                    </div>

                    <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <h2 style="margin: 0 0 20px 0; color: #111827;">${email.subject || 'No Subject'}</h2>

                        <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <div>
                                    <strong>From:</strong> ${email.from || 'Unknown'}
                                </div>
                                <div style="color: #6b7280; font-size: 14px;">
                                    ${formatDate(email.date)}
                                </div>
                            </div>
                            <div><strong>To:</strong> ${email.to || 'Unknown'}</div>
                        </div>

                        <div style="padding: 20px; background: #f9fafb; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word;">
                            ${email.body || email.snippet || 'No content'}
                        </div>

                        ${attachmentsHtml}

                        <div style="margin-top: 20px; display: flex; gap: 10px;">
                            <button onclick="window.showCOIWithPDF ? showCOIWithPDF('${emailId}') : alert('Email COI feature')"
                                    style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-reply"></i> Reply with COI
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
    }
};

// Ensure backToInbox function exists
if (typeof window.backToInbox !== 'function') {
    window.backToInbox = function() {
        console.log('Going back to inbox...');
        const coiInbox = document.getElementById('coiInbox');
        if (coiInbox && window.savedInboxHTML) {
            coiInbox.innerHTML = window.savedInboxHTML;
            console.log('Restored inbox view');
        } else {
            // Reload COI inbox if saved HTML not available
            if (typeof window.loadRealCOIEmails === 'function') {
                window.loadRealCOIEmails();
            } else if (typeof window.loadCOIInbox === 'function') {
                window.loadCOIInbox();
            }
        }
    };
}

console.log('✅ viewEmailDetails function is now properly mapped to fetch real Gmail data');