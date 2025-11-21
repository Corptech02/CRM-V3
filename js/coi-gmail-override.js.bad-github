// COI Gmail Override - Forces real Gmail data in COI Management
console.log('COI Gmail Override loading...');

// Backend API URL - Using HTTPS tunnel
const GMAIL_API_URL = 'https://vanguard-gmail-backend.onrender.com/api/gmail';

// Override immediately after script loads (don't wait for DOM)
(function() {
    console.log('Overriding COI functions...');

    // Store original function if it exists
    const originalLoadCOIView = window.loadCOIView;

    // Override loadCOIView - this is what gets called when navigating to #coi
    window.loadCOIView = function() {
        console.log('COI View Override: Loading with restored layout...');

        const dashboardContent = document.querySelector('.dashboard-content');
        if (!dashboardContent) return;

        dashboardContent.innerHTML = `
            <div class="coi-management">
                <div class="page-header">
                    <h1>COI Management</h1>
                    <p>Manage Certificates of Insurance requests and policies</p>
                </div>
                <div class="coi-container">
                    <!-- Left Panel - Policy Profile Viewer -->
                    <div class="coi-left-panel">
                        <div class="panel-header">
                            <h3><i class="fas fa-file-contract"></i> Policy Profiles</h3>
                            <button class="btn-primary btn-small" onclick="refreshPolicies()">
                                <i class="fas fa-sync"></i> Refresh
                            </button>
                        </div>
                        <div id="policyViewer" class="policy-viewer">
                            <div class="policy-list" id="policyList">
                                <!-- Policy list will be populated here -->
                            </div>
                        </div>
                    </div>
                    <!-- Right Panel - COI Email Inbox -->
                    <div class="coi-right-panel">
                        <div class="panel-header">
                            <h3><i class="fas fa-inbox"></i> COI Request Inbox</h3>
                            <div class="inbox-actions">
                                <button class="btn-secondary btn-small" onclick="filterCOIEmails('unread')">
                                    <i class="fas fa-envelope"></i> Unread
                                </button>
                                <button class="btn-secondary btn-small" onclick="filterCOIEmails('all')">
                                    <i class="fas fa-list"></i> All
                                </button>
                            </div>
                        </div>
                        <div class="coi-inbox" id="coiInbox">
                            <div style="text-align: center; padding: 20px;">
                                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
                                <p>Loading emails from corptech02@gmail.com...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Load the real policy list from localStorage
        if (window.loadRealPolicyList) {
            window.loadRealPolicyList();
        } else if (window.loadPolicyList) {
            window.loadPolicyList();
        }

        // Load real Gmail emails
        loadRealCOIEmails();
    };

    // Function to load real emails from Gmail
    window.loadRealCOIEmails = async function() {
        console.log('Fetching real emails from corptech02@gmail.com...');

        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) return;

        try {
            // Search for COI-related emails
            const response = await fetch(`${GMAIL_API_URL}/search-coi?days=30`, {
                headers: {
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const emails = await response.json();
            console.log(`Received ${emails.length} real emails from Gmail`);

            if (emails.length === 0) {
                coiInbox.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #6b7280;">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
                        <p>No COI-related emails found in corptech02@gmail.com</p>
                        <p style="font-size: 14px; margin-top: 8px;">
                            Searching for: COI, certificate, insurance, ACORD
                        </p>
                        <button class="btn-primary" onclick="window.location.href='test-real-emails.html'" style="margin-top: 16px;">
                            Test Gmail Connection
                        </button>
                    </div>
                `;
                return;
            }

            // Display real emails in the original format
            coiInbox.innerHTML = `
                <div class="email-list">
                    ${emails.map(email => {
                        const date = new Date(email.date);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const dateStr = isToday ?
                            date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                            date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                        // Extract sender name from email
                        const fromMatch = email.from.match(/"?([^"<]+)"?\s*<?/);
                        const senderName = fromMatch ? fromMatch[1].trim() : email.from.split('@')[0];

                        return `
                            <div class="email-item unread" data-email-id="${email.id}" style="cursor: pointer;">
                                <div class="email-header">
                                    <div class="email-info">
                                        <div class="email-from">
                                            <i class="fas fa-circle" style="color: var(--primary-blue); font-size: 8px; margin-right: 8px;"></i>
                                            <strong>${senderName}</strong>
                                        </div>
                                        <div class="email-subject">${email.subject}</div>
                                        <div class="email-meta">
                                            ${email.attachments && email.attachments.length > 0 ?
                                                '<i class="fas fa-paperclip" style="margin-right: 8px;"></i>' : ''}
                                            <span class="email-date">${dateStr}</span>
                                        </div>
                                    </div>
                                    <div class="email-actions">
                                        <button class="btn-icon email-action-btn" data-action="read" data-email-id="${email.id}" title="Mark as Read">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn-icon email-action-btn" data-action="process" data-email-id="${email.id}" title="Process COI">
                                            <i class="fas fa-file-contract"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

        } catch (error) {
            console.error('Error loading real emails:', error);
            coiInbox.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>Error loading emails from Gmail</p>
                    <p style="font-size: 14px; margin-top: 8px;">${error.message}</p>
                    <div style="margin-top: 16px;">
                        <button class="btn-primary" onclick="window.location.href='gmail-setup.html'">
                            Setup Gmail
                        </button>
                        <button class="btn-secondary" onclick="loadRealCOIEmails()" style="margin-left: 8px;">
                            Retry
                        </button>
                    </div>
                </div>
            `;
        }
    };

    // Sync Gmail emails function
    window.syncGmailEmails = function() {
        console.log('Syncing Gmail emails...');
        const btn = event.target.closest('button');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
        btn.disabled = true;

        loadRealCOIEmails().finally(() => {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        });
    };
})();

// Define expand email function globally (outside the IIFE)
window.expandEmail = async function(emailId) {
        console.log('Expanding email:', emailId);

        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) return;

        // Store the current inbox content so we can go back
        window.previousInboxContent = coiInbox.innerHTML;

        try {
            // Show loading state
            coiInbox.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
                    <p>Loading email...</p>
                </div>
            `;

            // Fetch full email details
            const response = await fetch(`${GMAIL_API_URL}/messages/${emailId}`, {
                headers: {
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const email = await response.json();

            // Display email in the inbox panel (not a modal)
            coiInbox.innerHTML = `
                <div class="email-detail-view" style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <button class="btn-secondary btn-small" onclick="backToInbox()">
                            <i class="fas fa-arrow-left"></i> Back to Inbox
                        </button>
                    </div>

                    <div class="email-detail-header" style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 15px 0; color: #1f2937;">${email.subject}</h3>

                        <div style="display: flex; gap: 20px; flex-wrap: wrap; color: #6b7280; font-size: 14px;">
                            <div>
                                <strong>From:</strong> ${email.from}
                            </div>
                            <div>
                                <strong>Date:</strong> ${new Date(email.date).toLocaleString()}
                            </div>
                        </div>

                        ${email.attachments && email.attachments.length > 0 ? `
                            <div style="margin-top: 10px;">
                                <i class="fas fa-paperclip"></i>
                                ${email.attachments.map(att => `
                                    <span style="margin-left: 8px; padding: 2px 6px; background: #f3f4f6; border-radius: 4px; font-size: 12px;">
                                        ${att.filename} (${(att.size / 1024).toFixed(1)}KB)
                                    </span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <div class="email-detail-body" style="padding: 20px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
                        <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; line-height: 1.6;">${email.body || email.snippet}</pre>
                    </div>

                    <div class="email-detail-actions" style="display: flex; gap: 10px;">
                        <button class="btn-primary" onclick="replyToEmail('${emailId}')">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                        <button class="btn-secondary" onclick="forwardEmail('${emailId}')">
                            <i class="fas fa-share"></i> Forward
                        </button>
                        <button class="btn-secondary" onclick="processGmailCOI('${emailId}')">
                            <i class="fas fa-file-contract"></i> Process COI
                        </button>
                        <button class="btn-secondary" onclick="markAsRead('${emailId}'); backToInbox();">
                            <i class="fas fa-check"></i> Mark as Read
                        </button>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error expanding email:', error);
            coiInbox.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>Error loading email: ${error.message}</p>
                    <button class="btn-primary" onclick="backToInbox()" style="margin-top: 16px;">
                        <i class="fas fa-arrow-left"></i> Back to Inbox
                    </button>
                </div>
            `;
        }
};

// Function to go back to inbox
window.backToInbox = function() {
        const coiInbox = document.getElementById('coiInbox');
        if (coiInbox && window.previousInboxContent) {
            coiInbox.innerHTML = window.previousInboxContent;
        } else {
            // If no previous content, reload the emails
            loadRealCOIEmails();
        }
};

// Forward email function
window.forwardEmail = function(emailId) {
        console.log('Forward email:', emailId);
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #667eea; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000;';
        notification.innerHTML = '<i class="fas fa-share"></i> Opening forward composer...';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
};

// Mark email as read
window.markAsRead = async function(emailId) {
        console.log('Marking email as read:', emailId);
        try {
            await fetch(`${GMAIL_API_URL}/messages/${emailId}/read`, {
                method: 'POST',
                headers: {
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });
            // Update UI to show email as read
            const emailItem = document.querySelector(`[data-email-id="${emailId}"]`);
            if (emailItem) {
                emailItem.classList.remove('unread');
                const dot = emailItem.querySelector('.fa-circle');
                if (dot) dot.style.display = 'none';
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
};

// Process COI from Gmail
window.processGmailCOI = async function(emailId) {
        console.log('Processing COI:', emailId);
        // For now, just show a notification
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000;';
        notification.innerHTML = '<i class="fas fa-check-circle"></i> Processing COI request...';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
};

// Reply to email
window.replyToEmail = async function(emailId) {
        console.log('Reply to email:', emailId);
        // For now, just show a notification
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #667eea; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000;';
        notification.innerHTML = '<i class="fas fa-envelope"></i> Opening reply composer...';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
};

// Also handle hash changes
window.addEventListener('hashchange', function() {
    if (window.location.hash === '#coi') {
        console.log('Hash changed to #coi, loading real emails...');
        setTimeout(() => {
            if (window.loadRealCOIEmails) {
                window.loadRealCOIEmails();
            }
        }, 100);
    }
})();

console.log('COI Gmail Override ready');