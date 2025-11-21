// COI Gmail Integration
console.log('Initializing COI Gmail Integration...');

// Backend API URL - Now using HTTPS tunnel via localtunnel
const GMAIL_API_URL = window.VANGUARD_API_URL ? `${window.VANGUARD_API_URL}/api/gmail` : 'http://162-220-14-239.nip.io/api/gmail';

// DISABLED: Now handled by coi-gmail-override.js
// Override the loadCOIView function to use real Gmail data (this is what app.js calls)
// const originalLoadCOIView = window.loadCOIView;

window.loadCOIViewDisabled = async function() {
    console.log('Loading COI View with Gmail integration...');

    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

    // Check if Gmail is connected
    const gmailConnected = localStorage.getItem('gmail_connected') === 'true';

    dashboardContent.innerHTML = `
        <div class="coi-management">
            <header class="content-header">
                <h1>COI Management</h1>
                <div class="header-actions">
                    ${!gmailConnected ? `
                        <button class="btn-secondary" onclick="window.location.href='gmail-setup.html'">
                            <i class="fas fa-envelope"></i> Connect Gmail
                        </button>
                    ` : `
                        <button class="btn-secondary" onclick="syncGmailEmails()">
                            <i class="fas fa-sync"></i> Sync Emails
                        </button>
                    `}
                    <button class="btn-primary" onclick="showNewCOIRequest()">
                        <i class="fas fa-plus"></i> New Request
                    </button>
                </div>
            </header>

            <div class="coi-tabs">
                <button class="tab-btn active" onclick="switchCOITab('inbox')">
                    <i class="fas fa-inbox"></i> Request Inbox
                    <span class="badge" id="inbox-count">0</span>
                </button>
                <button class="tab-btn" onclick="switchCOITab('tracking')">
                    <i class="fas fa-clock"></i> Tracking
                </button>
                <button class="tab-btn" onclick="switchCOITab('completed')">
                    <i class="fas fa-check-circle"></i> Completed
                </button>
                <button class="tab-btn" onclick="switchCOITab('templates')">
                    <i class="fas fa-file-alt"></i> Templates
                </button>
            </div>

            <div id="coi-content" class="coi-content">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i> Loading emails...
                </div>
            </div>
        </div>
    `;

    // Load Gmail emails if connected
    if (gmailConnected) {
        await loadGmailInbox();
    } else {
        // Show demo data with connection prompt
        loadDemoInbox();
    }
};

// Load real Gmail inbox
async function loadGmailInbox() {
    console.log('Fetching Gmail COI emails...');

    try {
        // Fetch COI-related emails
        const response = await fetch(`${GMAIL_API_URL}/search-coi?days=30`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const emails = await response.json();
        console.log(`Fetched ${emails.length} COI emails`);

        // Update inbox count
        document.getElementById('inbox-count').textContent = emails.length;

        // Display emails
        displayGmailEmails(emails);

    } catch (error) {
        console.error('Error fetching Gmail emails:', error);

        // Show error message with retry option
        document.getElementById('coi-content').innerHTML = `
            <div class="error-message" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ef4444; margin-bottom: 16px;"></i>
                <h3>Unable to load emails</h3>
                <p style="color: #6b7280; margin: 16px 0;">${error.message}</p>
                <button class="btn-primary" onclick="loadGmailInbox()">
                    <i class="fas fa-redo"></i> Retry
                </button>
                <button class="btn-secondary" onclick="loadDemoInbox()">
                    View Demo Data
                </button>
            </div>
        `;
    }
}

// Display Gmail emails in the interface
function displayGmailEmails(emails) {
    const content = document.getElementById('coi-content');

    if (emails.length === 0) {
        content.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 60px;">
                <i class="fas fa-inbox" style="font-size: 64px; color: #d1d5db; margin-bottom: 16px;"></i>
                <h3 style="color: #6b7280; margin-bottom: 8px;">No COI requests found</h3>
                <p style="color: #9ca3af;">Emails containing COI, certificates, or ACORD will appear here</p>
                <button class="btn-primary" onclick="syncGmailEmails()" style="margin-top: 16px;">
                    <i class="fas fa-sync"></i> Check for New Emails
                </button>
            </div>
        `;
        return;
    }

    content.innerHTML = `
        <div class="data-table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 40px;">
                            <input type="checkbox" id="selectAll" onchange="toggleSelectAll()">
                        </th>
                        <th>From</th>
                        <th>Subject</th>
                        <th>Client/Policy</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${emails.map(email => generateEmailRow(email)).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Generate row for each email
function generateEmailRow(email) {
    // Extract sender name from email
    const fromMatch = email.from.match(/^([^<]+)/);
    const senderName = fromMatch ? fromMatch[1].trim() : email.from.split('@')[0];

    // Format date
    const date = new Date(email.date);
    const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Detect client name from subject or body
    const clientName = extractClientName(email.subject, email.snippet);

    // Check for attachments
    const hasAttachments = email.attachments && email.attachments.length > 0;

    // Determine status based on labels
    const status = email.labelIds && email.labelIds.includes('UNREAD') ? 'New' : 'Read';
    const statusClass = status === 'New' ? 'status-new' : 'status-pending';

    return `
        <tr data-email-id="${email.id}">
            <td>
                <input type="checkbox" class="email-checkbox" value="${email.id}">
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="avatar-small" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        ${senderName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight: 500;">${senderName}</div>
                        <div style="font-size: 12px; color: #6b7280;">${email.from.match(/<(.+)>/)?.[1] || email.from}</div>
                    </div>
                </div>
            </td>
            <td>
                <div style="font-weight: ${status === 'New' ? '600' : '400'};">
                    ${email.subject}
                    ${hasAttachments ? '<i class="fas fa-paperclip" style="margin-left: 8px; color: #6b7280;"></i>' : ''}
                </div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                    ${email.snippet.substring(0, 100)}${email.snippet.length > 100 ? '...' : ''}
                </div>
            </td>
            <td>${clientName || '-'}</td>
            <td>${dateStr}</td>
            <td>
                <span class="status ${statusClass}">${status}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="viewGmailEmail('${email.id}')" title="View Email">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="processGmailCOI('${email.id}')" title="Process COI">
                        <i class="fas fa-file-contract"></i>
                    </button>
                    <button class="btn-icon" onclick="replyToEmail('${email.id}')" title="Reply">
                        <i class="fas fa-reply"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Extract client name from email content
function extractClientName(subject, snippet) {
    // Common patterns for client names in COI requests
    const patterns = [
        /COI.*?for\s+([A-Z][^,.\n]+)/i,
        /Certificate.*?for\s+([A-Z][^,.\n]+)/i,
        /Client:\s*([^,.\n]+)/i,
        /Insured:\s*([^,.\n]+)/i,
        /Company:\s*([^,.\n]+)/i,
        /RE:\s*([^-,.\n]+)/i
    ];

    for (const pattern of patterns) {
        const match = subject.match(pattern) || snippet.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }

    return null;
}

// Redirect to expandEmail (no modal)
function viewGmailEmail(emailId) {
    if (window.expandEmail) {
        window.expandEmail(emailId);
    }
}

// View Gmail email details - DISABLED (now handled by expandEmail in coi-gmail-override.js)
async function viewGmailEmailDisabled(emailId) {
    try {
        const response = await fetch(`${GMAIL_API_URL}/messages/${emailId}`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } });
        const email = await response.json();

        // Create modal to display email
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>Email Details</h2>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px;">
                        <label style="font-weight: 600;">From:</label>
                        <p>${email.from}</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="font-weight: 600;">Subject:</label>
                        <p>${email.subject}</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="font-weight: 600;">Date:</label>
                        <p>${new Date(email.date).toLocaleString()}</p>
                    </div>
                    ${email.attachments && email.attachments.length > 0 ? `
                        <div style="margin-bottom: 20px;">
                            <label style="font-weight: 600;">Attachments:</label>
                            <div style="margin-top: 8px;">
                                ${email.attachments.map(att => `
                                    <div style="display: inline-block; margin-right: 12px; margin-bottom: 8px;">
                                        <button class="btn-secondary" onclick="downloadAttachment('${email.id}', '${att.attachmentId}', '${att.filename}')">
                                            <i class="fas fa-download"></i> ${att.filename}
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div style="margin-bottom: 20px;">
                        <label style="font-weight: 600;">Message:</label>
                        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 8px; max-height: 400px; overflow-y: auto;">
                            ${email.body.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="processGmailCOI('${email.id}')">
                        <i class="fas fa-file-contract"></i> Process COI
                    </button>
                    <button class="btn-secondary" onclick="replyToEmail('${email.id}')">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    <button class="btn-secondary" onclick="markAsRead('${email.id}')">
                        <i class="fas fa-check"></i> Mark as Read
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Mark as read
        await fetch(`${GMAIL_API_URL}/messages/${emailId}/read`, { method: 'POST' });

    } catch (error) {
        console.error('Error viewing email:', error);
        showNotification('Error loading email details', 'error');
    }
}

// Process COI from Gmail
async function processGmailCOI(emailId) {
    try {
        const response = await fetch(`${GMAIL_API_URL}/messages/${emailId}`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } });
        const email = await response.json();

        // Extract client information
        const clientName = extractClientName(email.subject, email.body) || 'Unknown Client';

        // Create COI processing modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Process COI Request</h2>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Client Name</label>
                        <input type="text" id="coi-client-name" value="${clientName}" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Certificate Holder</label>
                        <input type="text" id="coi-holder" placeholder="Enter certificate holder name" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Policy Type</label>
                        <select id="coi-policy-type" class="form-control">
                            <option>General Liability</option>
                            <option>Commercial Auto</option>
                            <option>Workers Compensation</option>
                            <option>Professional Liability</option>
                            <option>Property</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Priority</label>
                        <select id="coi-priority" class="form-control">
                            <option>Normal</option>
                            <option>High</option>
                            <option>Urgent</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="coi-notes" class="form-control" rows="3">${email.snippet}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="saveCOIRequest('${emailId}')">
                        <i class="fas fa-save"></i> Create COI Request
                    </button>
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

    } catch (error) {
        console.error('Error processing COI:', error);
        showNotification('Error processing COI request', 'error');
    }
}

// Reply to email
async function replyToEmail(emailId) {
    try {
        const response = await fetch(`${GMAIL_API_URL}/messages/${emailId}`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } });
        const email = await response.json();

        // Create reply modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2>Reply to Email</h2>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>To:</label>
                        <input type="email" id="reply-to" value="${email.from}" class="form-control" readonly>
                    </div>
                    <div class="form-group">
                        <label>Subject:</label>
                        <input type="text" id="reply-subject" value="Re: ${email.subject}" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Message:</label>
                        <textarea id="reply-body" class="form-control" rows="10" placeholder="Type your reply here..."></textarea>
                    </div>
                    <div style="margin-top: 16px; padding: 12px; background: #f9fafb; border-radius: 8px;">
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Original Message:</div>
                        <div style="font-size: 14px; color: #4b5563;">
                            ${email.snippet}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="sendReply('${emailId}')">
                        <i class="fas fa-paper-plane"></i> Send Reply
                    </button>
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

    } catch (error) {
        console.error('Error creating reply:', error);
        showNotification('Error creating reply', 'error');
    }
}

// Send reply email
async function sendReply(originalEmailId) {
    const to = document.getElementById('reply-to').value;
    const subject = document.getElementById('reply-subject').value;
    const body = document.getElementById('reply-body').value;

    if (!body.trim()) {
        showNotification('Please enter a message', 'error');
        return;
    }

    try {
        const response = await fetch(`${GMAIL_API_URL}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: to,
                subject: subject,
                body: body
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Reply sent successfully', 'success');
            document.querySelector('.modal-overlay').remove();

            // Add label to original email
            await fetch(`${GMAIL_API_URL}/messages/${originalEmailId}/label`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ label: 'COI_Replied' })
            });

            // Refresh inbox
            loadGmailInbox();
        } else {
            throw new Error(result.error || 'Failed to send reply');
        }

    } catch (error) {
        console.error('Error sending reply:', error);
        showNotification('Error sending reply: ' + error.message, 'error');
    }
}

// Sync Gmail emails
async function syncGmailEmails() {
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
    btn.disabled = true;

    try {
        await loadGmailInbox();
        showNotification('Emails synced successfully', 'success');
    } catch (error) {
        showNotification('Error syncing emails', 'error');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

// Download attachment
async function downloadAttachment(messageId, attachmentId, filename) {
    try {
        const response = await fetch(`${GMAIL_API_URL}/attachments/${messageId}/${attachmentId}`);
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showNotification(`Downloaded ${filename}`, 'success');
    } catch (error) {
        console.error('Error downloading attachment:', error);
        showNotification('Error downloading attachment', 'error');
    }
}

// Mark email as read
async function markAsRead(emailId) {
    try {
        await fetch(`${GMAIL_API_URL}/messages/${emailId}/read`, {
            method: 'POST'
        });

        showNotification('Marked as read', 'success');

        // Update UI
        const row = document.querySelector(`tr[data-email-id="${emailId}"]`);
        if (row) {
            const statusCell = row.querySelector('.status');
            if (statusCell) {
                statusCell.textContent = 'Read';
                statusCell.className = 'status status-pending';
            }
        }

    } catch (error) {
        console.error('Error marking as read:', error);
        showNotification('Error marking email as read', 'error');
    }
}

// Save COI request
async function saveCOIRequest(emailId) {
    const clientName = document.getElementById('coi-client-name').value;
    const holder = document.getElementById('coi-holder').value;
    const policyType = document.getElementById('coi-policy-type').value;
    const priority = document.getElementById('coi-priority').value;
    const notes = document.getElementById('coi-notes').value;

    // Create COI request object
    const coiRequest = {
        id: 'coi_' + Date.now(),
        emailId: emailId,
        clientName: clientName,
        certificateHolder: holder,
        policyType: policyType,
        priority: priority,
        notes: notes,
        status: 'Processing',
        createdDate: new Date().toISOString()
    };

    // Save to localStorage
    const coiRequests = JSON.parse(localStorage.getItem('coi_requests') || '[]');
    coiRequests.push(coiRequest);
    localStorage.setItem('coi_requests', JSON.stringify(coiRequests));

    // Add label to email
    try {
        await fetch(`${GMAIL_API_URL}/messages/${emailId}/label`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ label: 'COI_Processing' })
        });
    } catch (error) {
        console.error('Error adding label:', error);
    }

    showNotification('COI request created successfully', 'success');
    document.querySelector('.modal-overlay').remove();

    // Switch to tracking tab
    switchCOITab('tracking');
}

// Load demo inbox (fallback)
function loadDemoInbox() {
    const content = document.getElementById('coi-content');
    content.innerHTML = `
        <div class="info-message" style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <i class="fas fa-info-circle" style="color: #f59e0b;"></i>
            <span style="margin-left: 8px;">Showing demo data. <a href="gmail-setup.html" style="color: #3b82f6;">Connect Gmail</a> to see real emails.</span>
        </div>
        <div class="data-table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 40px;">
                            <input type="checkbox" id="selectAll">
                        </th>
                        <th>From</th>
                        <th>Subject</th>
                        <th>Client/Policy</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><input type="checkbox"></td>
                        <td>Sarah Agent</td>
                        <td>COI Request - ABC Construction</td>
                        <td>ABC Construction</td>
                        <td>Today, 10:30 AM</td>
                        <td><span class="status status-new">New</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-icon"><i class="fas fa-eye"></i></button>
                                <button class="btn-icon"><i class="fas fa-file-contract"></i></button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

// Override the loadCOIInbox function to use real Gmail data from corptech02@gmail.com
const originalLoadCOIInbox = window.loadCOIInbox;

window.loadCOIInbox = async function() {
    console.log('Loading COI Inbox with real Gmail data from corptech02@gmail.com...');

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    // Check if Gmail is connected
    const gmailConnected = localStorage.getItem('gmail_connected') === 'true';

    if (gmailConnected) {
        // Show loading state
        coiInbox.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i> Loading emails from Gmail...
            </div>
        `;

        try {
            // Fetch COI-related emails
            const response = await fetch(`${GMAIL_API_URL}/search-coi?days=30`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const emails = await response.json();
            console.log(`Fetched ${emails.length} COI emails from Gmail`);

            // Display real emails
            displayEmailsInInbox(coiInbox, emails);

        } catch (error) {
            console.error('Error fetching Gmail emails:', error);
            // Fall back to demo data
            loadDemoDataInInbox(coiInbox);
        }
    } else {
        // Show demo data with connection prompt
        loadDemoDataInInbox(coiInbox);
    }
};

// Display real emails in the COI inbox
function displayEmailsInInbox(container, emails) {
    if (emails.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 60px;">
                <i class="fas fa-inbox" style="font-size: 64px; color: #d1d5db; margin-bottom: 16px;"></i>
                <h3 style="color: #6b7280; margin-bottom: 8px;">No COI requests found</h3>
                <p style="color: #9ca3af;">Emails containing COI, certificates, or ACORD will appear here</p>
            </div>
        `;
        return;
    }

    // Build email list HTML
    let html = '<div class="email-list">';

    emails.forEach(email => {
        const fromMatch = email.from.match(/^([^<]+)/);
        const senderName = fromMatch ? fromMatch[1].trim() : email.from.split('@')[0];
        const senderEmail = email.from.match(/<(.+)>/)?.[1] || email.from;

        const date = new Date(email.date);
        const dateStr = date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });

        const isUnread = email.labelIds && email.labelIds.includes('UNREAD');
        const hasAttachments = email.attachments && email.attachments.length > 0;

        html += `
            <div class="email-item ${isUnread ? 'unread' : ''}" onclick="viewGmailEmail('${email.id}')">
                <div class="email-checkbox">
                    <input type="checkbox" onclick="event.stopPropagation()">
                </div>
                <div class="email-from">
                    <strong>${senderName}</strong>
                    <br>
                    <small>${senderEmail}</small>
                </div>
                <div class="email-subject">
                    ${email.subject}
                    ${hasAttachments ? '<i class="fas fa-paperclip" style="margin-left: 8px;"></i>' : ''}
                </div>
                <div class="email-date">${dateStr}</div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Load demo data as fallback
function loadDemoDataInInbox(container) {
    container.innerHTML = `
        <div class="info-message" style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <i class="fas fa-info-circle" style="color: #f59e0b;"></i>
            <span style="margin-left: 8px;">Showing demo data. <a href="gmail-setup.html" style="color: #3b82f6;">Connect Gmail</a> to see real emails.</span>
        </div>
        <div class="email-list">
            <div class="email-item unread">
                <div class="email-checkbox">
                    <input type="checkbox">
                </div>
                <div class="email-from">
                    <strong>Dispatch</strong><br>
                    <small>dispatch@walmart.com</small>
                </div>
                <div class="email-subject">
                    COI Required - Walmart Distribution Center Access
                </div>
                <div class="email-date">09/14/2025</div>
            </div>
            <div class="email-item">
                <div class="email-checkbox">
                    <input type="checkbox">
                </div>
                <div class="email-from">
                    <strong>Broker</strong><br>
                    <small>broker@chrobinson.com</small>
                </div>
                <div class="email-subject">
                    Insurance Certificate - Load #78234
                </div>
                <div class="email-date">09/13/2025</div>
            </div>
        </div>
    `;
}

// Check Gmail connection status on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check URL parameters for Gmail connection status
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('gmail') === 'connected') {
        localStorage.setItem('gmail_connected', 'true');
        showNotification('Gmail connected successfully!', 'success');

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }

    // If we're on the COI management page, reload the inbox
    if (window.location.hash === '#coi-management') {
        setTimeout(() => {
            if (window.loadCOIInbox) {
                window.loadCOIInbox();
            }
        }, 500);
    }
});

console.log('COI Gmail Integration loaded');