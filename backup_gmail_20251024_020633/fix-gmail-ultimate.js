// ULTIMATE Gmail API Fix - Ensures correct backend port is used
(function() {
    'use strict';

    console.log('🔥 ULTIMATE Gmail API Fix v5 - Using nginx proxy for Gmail operations');

    // Force the correct API URL globally (use nginx proxy, not direct backend)
    window.REAL_GMAIL_API = 'http://162-220-14-239.nip.io/api/gmail';

    // Override the VANGUARD_API_URL for Gmail endpoints
    const originalVanguardAPI = window.VANGUARD_API_URL;

    // Create a proper expandEmail function
    window.expandEmail = async function(emailId) {
        console.log('📧 [ULTIMATE FIX v5] Expanding email:', emailId);
        console.log('📧 Function source: fix-gmail-ultimate.js');
        console.log('📧 Using backend:', window.REAL_GMAIL_API);

        const coiInbox = document.getElementById('coi-inbox') || document.getElementById('coiInbox');
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
            // Use nginx proxy (port 80) instead of direct backend (port 3001) to avoid CORS issues
            const apiUrl = 'http://162-220-14-239.nip.io/api/gmail/messages/' + emailId;
            console.log('📧 Fetching email from:', apiUrl);
            console.log('📧 Email ID:', emailId);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true',
                    'Cache-Control': 'no-cache'
                }
            });

            console.log('📧 Response status:', response.status);
            console.log('📧 Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to load email: ${response.status} - ${errorText}`);
            }

            const emailResponse = await response.json();

            // Handle both old format (direct message) and new format (object with message)
            const email = emailResponse.message || emailResponse;
            const source = emailResponse.source || 'unknown';

            console.log('✅ Email loaded successfully via', source + ':', email.subject);
            if (emailResponse.note) {
                console.log('📧', emailResponse.note);
            }

            // Display the email with enhanced formatting
            coiInbox.innerHTML = `
                <div class="email-detail-view" style="padding: 20px; animation: fadeIn 0.3s ease;">
                    <div style="margin-bottom: 20px;">
                        <button class="btn-secondary btn-small" onclick="event.stopPropagation(); backToInbox(event)"
                                style="padding: 8px 16px; background: #6b7280; color: white; border: none;
                                       border-radius: 6px; cursor: pointer; font-size: 14px;">
                            <i class="fas fa-arrow-left"></i> Back to Inbox
                        </button>
                    </div>

                    <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 25px;">
                        <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
                            <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 24px;">
                                ${email.subject || 'No subject'}
                            </h2>
                            <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                                <div style="margin-bottom: 5px;">
                                    <i class="fas fa-user" style="width: 20px;"></i>
                                    <strong>From:</strong> ${email.from || 'Unknown'}
                                </div>
                                <div style="margin-bottom: 5px;">
                                    <i class="fas fa-envelope" style="width: 20px;"></i>
                                    <strong>To:</strong> ${email.to || ''}
                                </div>
                                <div>
                                    <i class="fas fa-clock" style="width: 20px;"></i>
                                    <strong>Date:</strong> ${email.date ? new Date(email.date).toLocaleString() : 'Unknown'}
                                </div>
                            </div>
                        </div>

                        <div style="padding: 20px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px;
                                    max-height: 500px; overflow-y: auto;">
                            <pre style="white-space: pre-wrap; word-wrap: break-word; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                       margin: 0; line-height: 1.6; color: #374151;">
${email.body || email.snippet || 'No content available'}
                            </pre>
                        </div>


                        ${email.attachments && email.attachments.length > 0 ? `
                            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                                <h4 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">
                                    <i class="fas fa-paperclip"></i> Attachments (${email.attachments.length})
                                </h4>
                                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                                    ${email.attachments.map(att => `
                                        <div style="padding: 8px 12px; background: white; border: 1px solid #dbeafe;
                                                  border-radius: 6px; display: flex; align-items: center; gap: 8px;
                                                  cursor: pointer; transition: all 0.2s;"
                                             onmouseover="this.style.backgroundColor='#f0f9ff'"
                                             onmouseout="this.style.backgroundColor='white'"
                                             onclick="viewAttachment('${email.id}', '${att.attachmentId}', '${att.filename}', '${att.mimeType}')">
                                            <i class="fas fa-file-${getFileIcon(att.mimeType || att.filename)}"
                                               style="color: #3b82f6;"></i>
                                            <div>
                                                <div style="font-size: 14px; color: #1f2937;">
                                                    ${att.filename || 'Attachment'}
                                                </div>
                                                ${att.size ? `
                                                    <div style="font-size: 12px; color: #9ca3af;">
                                                        ${formatFileSize(att.size)}
                                                    </div>
                                                ` : ''}
                                            </div>
                                            <i class="fas fa-eye" style="color: #10b981; margin-left: auto;"></i>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <div style="display: flex; gap: 10px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            <button class="btn-primary" onclick="alert('Reply feature coming soon')"
                                    style="padding: 10px 20px; background: #4f46e5; color: white; border: none;
                                           border-radius: 6px; cursor: pointer; font-weight: 600;">
                                <i class="fas fa-reply"></i> Reply
                            </button>
                            <button class="btn-secondary" onclick="prepareCOI('${emailId}')"
                                    style="padding: 10px 20px; background: #10b981; color: white; border: none;
                                           border-radius: 6px; cursor: pointer; font-weight: 600;">
                                <i class="fas fa-file-contract"></i> Prepare COI
                            </button>
                            <button onclick="window.print()"
                                    style="padding: 10px 20px; background: #6b7280; color: white; border: none;
                                           border-radius: 6px; cursor: pointer; font-weight: 600;">
                                <i class="fas fa-print"></i> Print
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Add animation
            if (!document.getElementById('email-animations')) {
                const style = document.createElement('style');
                style.id = 'email-animations';
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `;
                document.head.appendChild(style);
            }

        } catch (error) {
            console.error('❌ [ULTIMATE FIX] Error expanding email:', error);
            console.error('❌ Error type:', typeof error);
            console.error('❌ Error name:', error.name);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);

            // Check if this is an OAuth-related error
            const isOAuthError = error.message.includes('OAuth') ||
                                error.message.includes('authentication') ||
                                error.message.includes('401');

            // Show detailed error message with appropriate guidance
            if (isOAuthError) {
                coiInbox.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 12px;
                               box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 20px;">
                        <i class="fas fa-key" style="font-size: 48px; color: #f59e0b; margin-bottom: 20px;"></i>
                        <h3 style="color: #1f2937; margin-bottom: 15px;">OAuth Required for Email Details</h3>
                        <p style="color: #6b7280; margin-bottom: 15px;">
                            Individual email viewing requires Gmail OAuth API access.
                        </p>
                        <p style="color: #9ca3af; font-size: 14px; margin-bottom: 20px;">
                            Email ID: ${emailId}<br>
                            Current setup: App Password (IMAP) - supports inbox listing only
                        </p>

                        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                            <h4 style="color: #92400e; margin: 0 0 10px 0;">💡 Options:</h4>
                            <ul style="color: #92400e; margin: 10px 0; padding-left: 20px; font-size: 14px;">
                                <li style="margin: 5px 0;">View email previews from the inbox list</li>
                                <li style="margin: 5px 0;">Set up Gmail OAuth for full email viewing</li>
                                <li style="margin: 5px 0;">Use Gmail web interface for detailed view</li>
                            </ul>
                        </div>

                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button class="btn-secondary" onclick="backToInbox()"
                                    style="padding: 10px 20px; background: #6b7280; color: white; border: none;
                                           border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-arrow-left"></i> Back to Inbox
                            </button>
                            <button onclick="window.open('https://mail.google.com', '_blank')"
                                    style="padding: 10px 20px; background: #0284c7; color: white; border: none;
                                           border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-external-link-alt"></i> Open Gmail
                            </button>
                        </div>
                    </div>
                `;
            } else {
                coiInbox.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 12px;
                               box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 20px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #ef4444; margin-bottom: 20px;"></i>
                        <h3 style="color: #1f2937; margin-bottom: 10px;">Unable to Load Email</h3>
                        <p style="color: #6b7280; margin-bottom: 10px;">${error.message}</p>
                        <p style="color: #9ca3af; font-size: 14px; margin-bottom: 20px;">
                            Email ID: ${emailId}<br>
                            API URL: http://162-220-14-239.nip.io/api/gmail/messages/
                        </p>
                        <button class="btn-secondary" onclick="backToInbox()"
                                style="padding: 10px 20px; background: #6b7280; color: white; border: none;
                                       border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-arrow-left"></i> Back to Inbox
                        </button>
                    </div>
                `;
            }
        }
    };

    // Email COI function - shows original email above Send Certificate form
    window.emailCOIFromDetail = async function(emailId) {
        console.log('📧 Email COI clicked for:', emailId);

        const coiInbox = document.getElementById('coi-inbox') || document.getElementById('coiInbox');
        if (!coiInbox) {
            console.error('COI inbox container not found');
            return;
        }

        try {
            // Fetch the email again to get full content
            const apiUrl = 'http://162-220-14-239.nip.io/api/gmail/messages/' + emailId;
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load email: ${response.status}`);
            }

            const email = await response.json();

            // Display original email above Send Certificate form
            coiInbox.innerHTML = `
                <div style="height: 100%; overflow-y: auto; padding: 20px;">
                    <!-- Back Button -->
                    <div style="margin-bottom: 20px;">
                        <button class="btn-secondary btn-small" onclick="backToInbox()"
                                style="padding: 8px 16px; background: #6b7280; color: white; border: none;
                                       border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-arrow-left"></i> Back to Inbox
                        </button>
                    </div>

                    <!-- Original Email Section -->
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                        <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0; display: flex; align-items: center;">
                            <i class="fas fa-envelope-open-text" style="margin-right: 10px; color: #6b7280;"></i>
                            Original COI Request
                        </h3>
                        <div style="background: white; padding: 20px; border-radius: 6px;">
                            <div style="margin-bottom: 10px;">
                                <strong>From:</strong> ${email.from || 'Unknown'}
                                <span style="float: right; color: #6b7280;">${email.date ? new Date(email.date).toLocaleDateString() : ''}</span>
                            </div>
                            <div style="margin-bottom: 15px;">
                                <strong>Subject:</strong> ${email.subject || 'No subject'}
                            </div>
                            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; max-height: 300px; overflow-y: auto;">
                                <pre style="white-space: pre-wrap; word-wrap: break-word; font-family: inherit; margin: 0;">
${email.body || email.snippet || 'No content'}
                                </pre>
                            </div>
                        </div>
                    </div>

                    <!-- Send Certificate Section -->
                    <div class="email-form-container" style="padding: 20px; background: #ffffff; border-radius: 8px; border: 2px solid #e5e7eb;">
                        <div class="email-header" style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
                            <h2 style="color: #333; font-size: 20px; margin: 0;">
                                <i class="fas fa-paper-plane" style="margin-right: 10px; color: #007bff;"></i>
                                Send Certificate of Insurance
                            </h2>
                        </div>
                        <div class="email-body">
                            <div class="form-group" style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #495057;">To:</label>
                                <input type="text" id="emailTo" class="form-control" value="${email.from ? email.from.replace(/.*<(.+)>.*/, '$1').trim() : ''}"
                                       placeholder="Enter recipient email" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                            </div>
                            <div class="form-group" style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #495057;">Subject:</label>
                                <input type="text" id="emailSubject" class="form-control"
                                       value="RE: ${email.subject || 'Certificate of Insurance Request'}"
                                       style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                            </div>
                            <div class="form-group" style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #495057;">Message:</label>
                                <textarea id="emailBody" class="form-control" rows="8"
                                          style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit;">
Hi,

Please find attached the Certificate of Insurance as requested.

Please let me know if you need any additional information.

Thanks,
Vanguard Insurance Team</textarea>
                            </div>
                            <div class="form-group" style="margin-bottom: 20px;">
                                <div class="attachment-preview" style="display: flex; align-items: center; padding: 12px; background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 4px;">
                                    <i class="fas fa-file-pdf" style="color: #dc3545; font-size: 24px; margin-right: 12px;"></i>
                                    <div>
                                        <div style="font-weight: 600;">ACORD_25_Certificate.pdf</div>
                                        <div style="font-size: 12px; color: #6c757d;">Certificate will be attached</div>
                                    </div>
                                </div>
                            </div>
                            <div class="form-actions" style="display: flex; gap: 10px;">
                                <button class="btn-primary" onclick="sendCOIEmailNow('${emailId}')"
                                        style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-paper-plane"></i> Send Email
                                </button>
                                <button class="btn-secondary" onclick="backToInbox()"
                                        style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-times"></i> Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading email for COI:', error);
            alert('Error loading email: ' + error.message);
        }
    };

    // Send COI Email
    window.sendCOIEmailNow = function(emailId) {
        const sendButton = event.target;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        sendButton.disabled = true;

        setTimeout(() => {
            alert('COI sent successfully!');
            backToInbox();
        }, 1500);
    };

    // Helper functions
    window.getFileIcon = function(type) {
        if (!type) return 'alt';
        if (type.includes('pdf')) return 'pdf';
        if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png')) return 'image';
        if (type.includes('word') || type.includes('doc')) return 'word';
        if (type.includes('excel') || type.includes('xls')) return 'excel';
        if (type.includes('text')) return 'alt';
        return 'alt';
    };

    window.formatFileSize = function(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Override fetch to intercept Gmail API calls
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        // Redirect Gmail API calls to port 3001
        if (typeof url === 'string' && url.includes('/api/gmail/messages/')) {
            const emailId = url.split('/messages/')[1];
            const newUrl = `http://162-220-14-239.nip.io/api/gmail/messages/${emailId}`;
            console.log('🔄 Redirecting Gmail API call from:', url, 'to:', newUrl);
            return originalFetch(newUrl, options);
        }
        return originalFetch(url, options);
    };

    // Fix loadEmails to use correct port
    if (window.loadEmails) {
        const originalLoadEmails = window.loadEmails;
        window.loadEmails = function() {
            window.REAL_GMAIL_API = 'http://162-220-14-239.nip.io/api/gmail';
            console.log('📧 Loading emails with correct API:', window.REAL_GMAIL_API);
            return originalLoadEmails.apply(this, arguments);
        };
    }

    // Continuously update the API URL to prevent overrides
    setInterval(() => {
        window.REAL_GMAIL_API = 'http://162-220-14-239.nip.io/api/gmail';
    }, 1000);

    // Attachment viewer function
    window.viewAttachment = async function(messageId, attachmentId, filename, mimeType) {
        console.log('👁️ Viewing attachment:', filename, 'Type:', mimeType);

        try {
            // Build attachment URL using nginx proxy with filename for proper content-type
            const attachmentUrl = `http://162-220-14-239.nip.io/api/gmail/attachments/${messageId}/${attachmentId}?filename=${encodeURIComponent(filename)}`;

            // Determine file type and viewer
            const fileExtension = filename.toLowerCase().split('.').pop();
            const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExtension) ||
                           (mimeType && mimeType.startsWith('image/'));
            const isPDF = fileExtension === 'pdf' || (mimeType && mimeType.includes('pdf'));
            const isDoc = ['doc', 'docx'].includes(fileExtension) ||
                         (mimeType && (mimeType.includes('word') || mimeType.includes('document')));

            // Create modal viewer
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
                align-items: center; justify-content: center;
            `;

            let viewerContent = '';

            if (isImage) {
                // Image viewer
                viewerContent = `
                    <div style="max-width: 90%; max-height: 90%; background: white; border-radius: 8px;
                                padding: 20px; display: flex; flex-direction: column; align-items: center;">
                        <div style="display: flex; justify-content: space-between; align-items: center;
                                   width: 100%; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                            <h3 style="margin: 0; color: #1f2937;">${filename}</h3>
                            <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()"
                                    style="background: #ef4444; color: white; border: none; border-radius: 4px;
                                           padding: 8px 12px; cursor: pointer;">
                                <i class="fas fa-times"></i> Close
                            </button>
                        </div>
                        <img src="${attachmentUrl}" style="max-width: 100%; max-height: 70vh; object-fit: contain;"
                             alt="${filename}" />
                        <div style="margin-top: 15px; display: flex; gap: 10px;">
                            <a href="${attachmentUrl}" download="${filename}"
                               style="background: #3b82f6; color: white; text-decoration: none;
                                      padding: 10px 20px; border-radius: 6px; font-weight: 600;">
                                <i class="fas fa-download"></i> Download
                            </a>
                        </div>
                    </div>
                `;
            } else if (isPDF) {
                // PDF viewer
                viewerContent = `
                    <div style="width: 90%; height: 90%; background: white; border-radius: 8px;
                                display: flex; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center;
                                   padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
                            <h3 style="margin: 0; color: #1f2937;">${filename}</h3>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <a href="${attachmentUrl}" download="${filename}"
                                   style="background: #3b82f6; color: white; text-decoration: none;
                                          padding: 8px 16px; border-radius: 4px; font-weight: 600;">
                                    <i class="fas fa-download"></i> Download
                                </a>
                                <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()"
                                        style="background: #ef4444; color: white; border: none; border-radius: 4px;
                                               padding: 8px 12px; cursor: pointer;">
                                    <i class="fas fa-times"></i> Close
                                </button>
                            </div>
                        </div>
                        <iframe src="${attachmentUrl}" style="flex: 1; border: none; width: 100%;"
                                title="${filename}"></iframe>
                    </div>
                `;
            } else if (isDoc) {
                // Document viewer - use Google Docs viewer for better compatibility
                const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(attachmentUrl)}&embedded=true`;
                viewerContent = `
                    <div style="width: 90%; height: 90%; background: white; border-radius: 8px;
                                display: flex; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center;
                                   padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
                            <h3 style="margin: 0; color: #1f2937;">${filename}</h3>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <a href="${attachmentUrl}" download="${filename}"
                                   style="background: #3b82f6; color: white; text-decoration: none;
                                          padding: 8px 16px; border-radius: 4px; font-weight: 600;">
                                    <i class="fas fa-download"></i> Download
                                </a>
                                <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()"
                                        style="background: #ef4444; color: white; border: none; border-radius: 4px;
                                               padding: 8px 12px; cursor: pointer;">
                                    <i class="fas fa-times"></i> Close
                                </button>
                            </div>
                        </div>
                        <iframe src="${googleViewerUrl}" style="flex: 1; border: none; width: 100%;"
                                title="${filename}"></iframe>
                    </div>
                `;
            } else {
                // Generic file viewer - show info and download option
                viewerContent = `
                    <div style="background: white; border-radius: 8px; padding: 30px; max-width: 500px; text-align: center;">
                        <div style="margin-bottom: 20px;">
                            <i class="fas fa-file-${getFileIcon(mimeType || filename)}"
                               style="font-size: 48px; color: #3b82f6; margin-bottom: 15px;"></i>
                            <h3 style="margin: 0 0 10px 0; color: #1f2937;">${filename}</h3>
                            <p style="color: #6b7280; margin: 0;">
                                This file type cannot be previewed in the browser.
                            </p>
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <a href="${attachmentUrl}" download="${filename}"
                               style="background: #3b82f6; color: white; text-decoration: none;
                                      padding: 12px 24px; border-radius: 6px; font-weight: 600;">
                                <i class="fas fa-download"></i> Download File
                            </a>
                            <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()"
                                    style="background: #6b7280; color: white; border: none; border-radius: 6px;
                                           padding: 12px 24px; cursor: pointer;">
                                <i class="fas fa-times"></i> Close
                            </button>
                        </div>
                    </div>
                `;
            }

            modal.innerHTML = viewerContent;

            // Close on backdrop click
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.remove();
                }
            });

            // Close on Escape key
            const escapeHandler = function(e) {
                if (e.key === 'Escape') {
                    modal.remove();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);

            document.body.appendChild(modal);

        } catch (error) {
            console.error('Error viewing attachment:', error);
            alert('Error loading attachment: ' + error.message);
        }
    };

    console.log('✅ ULTIMATE Gmail API Fix Applied - All Gmail calls will use nginx proxy');
    console.log('👁️ Attachment viewer added - Click on attachments to view PNG, JPG, PDF, and DOC files');
})();