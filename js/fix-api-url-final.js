// FINAL FIX for API URL Configuration
// This ensures the correct backend URL is always used
console.log('🔧 Applying FINAL API URL fix...');

// Force correct API URL
window.VANGUARD_API_URL = "http://162-220-14-239.nip.io:3001";

// Override EMAIL_PROVIDERS to ensure correct URLs
window.EMAIL_PROVIDERS = {
    GMAIL: {
        name: 'Gmail',
        apiBase: 'http://162-220-14-239.nip.io:3001/api/gmail',
        email: 'corptech06@gmail.com'
    },
    OUTLOOK: {
        name: 'Outlook',
        apiBase: 'http://162-220-14-239.nip.io:3001/api/outlook',
        email: 'Not configured'
    }
};

// Fix any functions that might be using wrong URL
if (window.expandEmail) {
    const originalExpandEmail = window.expandEmail;
    window.expandEmail = async function(emailId) {
        console.log('Fixed expandEmail called for:', emailId);

        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) {
            console.error('COI inbox not found');
            return;
        }

        window.previousInboxContent = coiInbox.innerHTML;

        coiInbox.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
                <p>Loading email...</p>
            </div>
        `;

        try {
            // Always use correct API URL
            const API_URL = 'http://162-220-14-239.nip.io:3001/api/gmail';
            console.log('Fetching from:', `${API_URL}/messages/${emailId}`);

            const response = await fetch(`${API_URL}/messages/${emailId}`, {
                headers: {
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load email: ${response.status} ${response.statusText}`);
            }

            const email = await response.json();
            window.currentEmailData = email;

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

            coiInbox.innerHTML = `
                <div class="email-detail-view" style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <button class="btn-secondary btn-small" onclick="backToInbox()"
                                style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
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
                            <button onclick="window.replyToEmail ? replyToEmail('${emailId}') : alert('Reply feature')"
                                    class="btn-primary" style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-reply"></i> Reply
                            </button>
                            <button onclick="window.showCOIWithPDF ? showCOIWithPDF('${emailId}') : alert('Send COI')"
                                    class="btn-primary" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-file-alt"></i> Send COI
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Mark as read
            fetch(`${API_URL}/messages/${emailId}/read`, {
                method: 'POST',
                headers: {
                    'Bypass-Tunnel-Reminder': 'true'
                }
            }).catch(err => console.log('Could not mark as read:', err));

        } catch (error) {
            console.error('Error expanding email:', error);
            coiInbox.innerHTML = `
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <button class="btn-secondary btn-small" onclick="backToInbox()"
                                style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-arrow-left"></i> Back to Inbox
                        </button>
                    </div>
                    <div style="text-align: center; padding: 40px; color: #ef4444;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                        <p>Error loading email: ${error.message}</p>
                        <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
                            API URL: http://162-220-14-239.nip.io:3001/api/gmail<br>
                            Email ID: ${emailId}
                        </p>
                    </div>
                </div>
            `;
        }
    };
}

// Also fix viewEmailDetails if it exists
if (!window.viewEmailDetails || window.viewEmailDetails.toString().includes('modal')) {
    window.viewEmailDetails = window.expandEmail;
}

console.log('✅ API URL fixed to use correct backend: http://162-220-14-239.nip.io:3001');
console.log('✅ Email expansion should now work properly');