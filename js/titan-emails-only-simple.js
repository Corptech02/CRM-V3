// TITAN EMAILS ONLY - SIMPLE VERSION - ABSOLUTELY NO MOCK DATA
console.log('🔥 TITAN EMAILS ONLY - SIMPLE VERSION LOADING');

// DEFINE GLOBAL FUNCTION - Outside any scope so app.js can find it
async function loadCOIInbox() {
    console.log('🚀 LOADING TITAN EMAILS - SIMPLE VERSION');

    // Find COI inbox element
    let coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) {
        console.log('❌ COI inbox element not found');
        return;
    }

    // Show loading
    coiInbox.innerHTML = `
        <div style="padding: 20px; text-align: center;">
            <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
            <p style="margin-top: 10px; color: #667eea;">Loading Titan emails...</p>
        </div>
    `;

    try {
        // Fetch real emails from Titan API with longer timeout (60 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch('/api/outlook/emails?filter=ALL&_=' + Date.now(), {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        console.log('📧 Titan API Response:', data);

        if (!response.ok || !data.success) {
            let errorMessage = data.error || 'Failed to fetch emails';
            let errorColor = '#dc2626';
            let bgColor = '#fef2f2';
            let title = 'API Error';

            // Handle specific error types
            if (data.errorType === 'authentication') {
                title = '🔐 Email Authentication Required';
                errorMessage = 'The email connection requires updated authentication. Please contact support to configure email access.';
                errorColor = '#d97706';
                bgColor = '#fef3c7';
            } else if (data.errorType === 'timeout') {
                title = '⏰ Connection Timeout';
                errorMessage = 'Email server is taking too long to respond. Please try again in a moment.';
                errorColor = '#0891b2';
                bgColor = '#f0f9ff';
            }

            coiInbox.innerHTML = `
                <div style="padding: 20px; background: ${bgColor}; border: 2px solid ${errorColor}; border-radius: 8px;">
                    <h3 style="color: ${errorColor};">${title}</h3>
                    <p style="color: #374151; margin-bottom: 15px;">${errorMessage}</p>
                    ${data.notice ? `<p style="color: #6b7280; font-size: 14px; font-style: italic;">${data.notice}</p>` : ''}
                    <button onclick="loadCOIInbox()" style="margin-top: 15px; padding: 10px 20px; background: ${errorColor}; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-refresh"></i> Try Again
                    </button>
                </div>
            `;
            return;
        }

        const allEmails = data.emails || [];

        // Filter out delivery failure emails and other non-COI emails
        const emails = allEmails.filter(email => {
            const subject = (email.subject || '').toLowerCase();
            const from = (email.from || '').toLowerCase();

            // Filter out delivery failures
            if (subject.includes('message delivery failure') ||
                subject.includes('delivery failure') ||
                subject.includes('mail delivery failed') ||
                subject.includes('undelivered mail') ||
                from.includes('mailer-daemon') ||
                from.includes('mail-daemon') ||
                from.includes('postmaster')) {
                return false;
            }

            // Filter out system emails
            if (subject.includes('out of office') ||
                subject.includes('automatic reply') ||
                subject.includes('auto-reply')) {
                return false;
            }

            return true;
        });

        if (emails.length === 0) {
            coiInbox.innerHTML = `
                <div style="padding: 40px; text-align: center; background: #f0f9ff; border: 2px solid #0891b2; border-radius: 8px;">
                    <h3 style="color: #0891b2;">No COI Request Emails Found</h3>
                    <p style="color: #0c4a6e;">Connected to Titan (${allEmails.length} total emails, ${allEmails.length - emails.length} filtered out)</p>
                </div>
            `;
            return;
        }

        if (allEmails.length > emails.length) {
            console.log(`📧 Filtered out ${allEmails.length - emails.length} non-COI emails (delivery failures, etc.)`);
        }

        // Get stored statuses for check/X buttons
        let statuses = {};
        try {
            const statusResp = await fetch('/api/coi-email-status');
            if (statusResp.ok) statuses = await statusResp.json();
        } catch (e) {
            statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');
        }


        // Sort emails by date - newest first (normal inbox order)
        emails.sort((a, b) => {
            try {
                const dateA = new Date(a.date || a.receivedDateTime);
                const dateB = new Date(b.date || b.receivedDateTime);

                // If date parsing fails, fall back to string comparison
                if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                    const dateStringA = a.date || a.receivedDateTime || '';
                    const dateStringB = b.date || b.receivedDateTime || '';
                    return dateStringB.localeCompare(dateStringA);
                }

                return dateB - dateA;
            } catch (error) {
                console.log('Date sorting error:', error);
                return 0;
            }
        });

        // Store emails data globally for expansion
        window.coiEmailsData = emails.reduce((acc, email) => {
            acc[email.id] = email;
            return acc;
        }, {});

        // Display emails with Gmail-style check/X buttons and click to expand
        let html = '<div class="email-list">';

        emails.forEach(email => {
            const date = new Date(email.date || email.receivedDateTime);
            const isToday = date.toDateString() === new Date().toDateString();
            const dateStr = isToday ?
                date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const senderName = email.fromName || email.from?.split('@')[0] || 'Unknown';
            const status = statuses[email.id];


            const bgColor = status === 'handled' ? 'background: linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%); border-left: 4px solid #10b981;' :
                           status === 'unimportant' ? 'background: linear-gradient(to right, #fee2e2 0%, #fef2f2 100%); border-left: 4px solid #ef4444; opacity: 0.7;' :
                           email.isRead === false ? 'background: #f0f9ff; border-left: 4px solid #3b82f6;' : 'border-left: 4px solid transparent;';

            html += `
                <div class="email-item ${email.isRead === false ? 'unread' : ''}" data-email-id="${email.id}"
                     style="cursor: pointer; position: relative; padding: 15px; border-bottom: 1px solid #e5e7eb; ${bgColor}"
                     onclick="expandEmail('${email.id}')">

                    <!-- Email Content -->
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <div style="margin-bottom: 5px;">
                                ${email.isRead === false ? '<i class="fas fa-circle" style="color: #667eea; font-size: 8px; margin-right: 8px;"></i>' : ''}
                                <strong style="color: #1f2937;">${senderName}</strong>
                            </div>
                            <div style="color: #374151; font-weight: 500;">${email.subject || 'No Subject'}</div>
                            <div style="margin-top: 5px; font-size: 13px; color: #6b7280;">
                                ${email.preview ? email.preview.substring(0, 100).replace(/<[^>]*>/g, '') + '...' : ''}
                            </div>
                            <div style="margin-top: 5px;">
                                ${email.hasAttachments ? '<i class="fas fa-paperclip" style="margin-right: 8px; color: #9ca3af;"></i>' : ''}
                                <span style="color: #9ca3af; font-size: 12px;">${dateStr}</span>
                            </div>
                        </div>

                        <!-- CHECK AND X BUTTONS - Gmail Style -->
                        <div style="display: flex; gap: 10px; margin-left: 20px;">
                            <button class="status-btn-handled"
                                    data-email-id="${email.id}"
                                    style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid ${status === 'handled' ? '#10b981' : '#e5e7eb'};
                                           background: ${status === 'handled' ? '#10b981' : 'white'}; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                                    onclick="event.stopPropagation(); toggleHandled('${email.id}', this); return false;">
                                <i class="${status === 'handled' ? 'fas' : 'fas'} fa-check" style="color: ${status === 'handled' ? 'white' : '#9ca3af'}; font-size: 18px;"></i>
                            </button>
                            <button class="status-btn-unimportant"
                                    data-email-id="${email.id}"
                                    style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid ${status === 'unimportant' ? '#ef4444' : '#e5e7eb'};
                                           background: ${status === 'unimportant' ? '#ef4444' : 'white'}; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                                    onclick="event.stopPropagation(); toggleUnimportant('${email.id}', this); return false;">
                                <i class="${status === 'unimportant' ? 'fas' : 'fas'} fa-times" style="color: ${status === 'unimportant' ? 'white' : '#9ca3af'}; font-size: 18px;"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        html += `
            <div style="padding: 15px; background: #f0f9ff; text-align: center; border-top: 2px solid #0891b2;">
                <strong style="color: #0891b2;">TITAN EMAIL - ${emails.length} Real Email${emails.length !== 1 ? 's' : ''}</strong>
                <br>
                <small style="color: #0c4a6e;">contact@vigagency.com | NO MOCK DATA</small>
            </div>
        `;

        coiInbox.innerHTML = html;

    } catch (error) {
        console.error('❌ Error loading Titan emails:', error);

        // Don't show timeout errors, just keep the loading state
        if (error.name === 'AbortError') {
            console.log('📧 Email loading timed out, keeping loading state...');
            // Keep the loading spinner - don't show error
            return;
        }

        // Only show error for actual API errors, not timeouts
        let errorMessage = error.message;
        coiInbox.innerHTML = `
            <div style="padding: 20px; background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px;">
                <h3 style="color: #dc2626;">Connection Error</h3>
                <p style="color: #991b1b;">${errorMessage}</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
                    This may be due to email authentication issues or network problems.
                </p>
                <button onclick="loadCOIInbox()" style="margin-top: 15px; padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-retry"></i> Retry
                </button>
            </div>
        `;
    }
}

// ADD TOGGLE FUNCTIONS FOR CHECK/X BUTTONS (from Gmail code)
window.toggleHandled = function(emailId, button) {
    const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');
    const emailRow = button.closest('.email-item');

    if (statuses[emailId] === 'handled') {
        // Remove handled status
        delete statuses[emailId];

        // Reset button
        button.style.background = 'white';
        button.querySelector('i').style.color = '#9ca3af';
        button.style.borderColor = '#e5e7eb';

        // Reset email row background
        emailRow.style.background = '';
        emailRow.style.borderLeft = '4px solid transparent';

        // Delete from server
        fetch(`/api/coi-email-status/${emailId}`, {
            method: 'DELETE'
        }).catch(e => console.log('Failed to delete status from server:', e));
    } else {
        // Mark as handled
        statuses[emailId] = 'handled';

        // Update button
        button.style.background = '#10b981';
        button.querySelector('i').style.color = 'white';
        button.style.borderColor = '#10b981';

        // Highlight entire email row in green
        emailRow.style.background = 'linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%)';
        emailRow.style.borderLeft = '4px solid #10b981';

        // Unmark as unimportant if it was
        const xButton = button.parentElement.querySelector('.status-btn-unimportant');
        if (xButton) {
            xButton.style.background = 'white';
            xButton.querySelector('i').style.color = '#9ca3af';
            xButton.style.borderColor = '#e5e7eb';
        }
    }

    localStorage.setItem('coi_email_status', JSON.stringify(statuses));

    // Save to server
    fetch('/api/coi-email-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            emailId: emailId,
            status: statuses[emailId] || null,
            updatedBy: 'user'
        })
    }).catch(e => console.log('Failed to save status to server:', e));
};

window.toggleUnimportant = function(emailId, button) {
    const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');
    const emailRow = button.closest('.email-item');

    if (statuses[emailId] === 'unimportant') {
        // Remove unimportant status
        delete statuses[emailId];

        // Reset button
        button.style.background = 'white';
        button.querySelector('i').style.color = '#9ca3af';
        button.style.borderColor = '#e5e7eb';

        // Reset email row background
        emailRow.style.background = '';
        emailRow.style.borderLeft = '4px solid transparent';
        emailRow.style.opacity = '1';

        // Delete from server
        fetch(`/api/coi-email-status/${emailId}`, {
            method: 'DELETE'
        }).catch(e => console.log('Failed to delete status from server:', e));
    } else {
        // Mark as unimportant
        statuses[emailId] = 'unimportant';

        // Update button
        button.style.background = '#ef4444';
        button.querySelector('i').style.color = 'white';
        button.style.borderColor = '#ef4444';

        // Highlight entire email row in red
        emailRow.style.background = 'linear-gradient(to right, #fee2e2 0%, #fef2f2 100%)';
        emailRow.style.borderLeft = '4px solid #ef4444';
        emailRow.style.opacity = '0.7';

        // Unmark as handled if it was
        const checkButton = button.parentElement.querySelector('.status-btn-handled');
        if (checkButton) {
            checkButton.style.background = 'white';
            checkButton.querySelector('i').style.color = '#9ca3af';
            checkButton.style.borderColor = '#e5e7eb';
        }
    }

    localStorage.setItem('coi_email_status', JSON.stringify(statuses));

    // Save to server
    fetch('/api/coi-email-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            emailId: emailId,
            status: statuses[emailId] || null,
            updatedBy: 'user'
        })
    }).catch(e => console.log('Failed to save status to server:', e));
};

// ADD EMAIL EXPANSION FUNCTION - Uses cached data instead of API call
window.expandEmail = function(emailId) {
    console.log('📧 Expanding email:', emailId);

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    // Get email from cached data
    const email = window.coiEmailsData ? window.coiEmailsData[emailId] : null;

    if (!email) {
        coiInbox.innerHTML = `
            <div style="padding: 20px; background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; text-align: center;">
                <h3 style="color: #dc2626;">Email Not Found</h3>
                <p style="color: #991b1b;">Email data not available</p>
                <button onclick="loadCOIInbox()" style="margin-top: 10px; padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Back to Inbox
                </button>
            </div>
        `;
        return;
    }

    // Display email details
    const date = new Date(email.date || email.receivedDateTime);
    const formattedDate = date.toLocaleString();

    // Extract sender name from email address if needed
    const senderName = email.fromName || email.from || 'Unknown Sender';
    const senderEmail = email.from || '';

    coiInbox.innerHTML = `
        <div style="background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 20px 0;">
            <div style="background: #f8fafc; padding: 20px; border-bottom: 1px solid #e5e7eb; border-radius: 8px 8px 0 0;">
                <button onclick="loadCOIInbox()" style="float: right; background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    ← Back to Inbox
                </button>
                <h3 style="color: #1f2937; margin: 0 0 10px 0;">${email.subject || 'No Subject'}</h3>
                <div style="color: #6b7280; font-size: 14px;">
                    <strong>From:</strong> ${senderName} ${senderEmail ? `&lt;${senderEmail}&gt;` : ''}<br>
                    <strong>To:</strong> ${email.to || 'contact@vigagency.com'}<br>
                    <strong>Date:</strong> ${formattedDate}
                </div>
            </div>
            <div style="padding: 30px; line-height: 1.6;">
                ${(() => {
                    const content = email.body || email.snippet || email.preview || '';
                    if (content.trim()) {
                        // Clean up content - remove excessive whitespace and format nicely
                        return content
                            .replace(/\n\s*\n\s*\n/g, '\n\n')  // Reduce multiple line breaks
                            .replace(/(.{100})/g, '$1\n')     // Add line breaks for readability
                            .replace(/\n/g, '<br>');          // Convert to HTML breaks
                    } else {
                        return '<em style="color: #6b7280;">This email appears to have no text content. It may contain only attachments or be a system-generated email.</em>';
                    }
                })()}
                ${email.hasAttachments ? '<br><br><div style="background: #f3f4f6; padding: 10px; border-radius: 5px; margin-top: 15px;"><i class="fas fa-paperclip" style="color: #6b7280;"></i> <strong>This email has attachments</strong></div>' : ''}
            </div>
            <div style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <button onclick="loadCOIInbox()" style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                    <i class="fas fa-arrow-left"></i> Back to Inbox
                </button>
                <button onclick="alert('Reply functionality coming soon!')" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-reply"></i> Reply
                </button>
            </div>
        </div>
    `;
};

// Ensure functions are available globally and PROTECTED from override
window.loadCOIInbox = loadCOIInbox;

// LOCK DOWN expandEmail function to prevent other scripts from overriding it
Object.defineProperty(window, 'expandEmail', {
    value: window.expandEmail,
    writable: false,
    configurable: false
});

// Also lock down toggle functions
Object.defineProperty(window, 'toggleHandled', {
    value: window.toggleHandled,
    writable: false,
    configurable: false
});

Object.defineProperty(window, 'toggleUnimportant', {
    value: window.toggleUnimportant,
    writable: false,
    configurable: false
});

console.log('✅ TITAN loadCOIInbox function ready:', typeof loadCOIInbox);
console.log('✅ Window loadCOIInbox function ready:', typeof window.loadCOIInbox);
console.log('✅ Toggle functions ready and LOCKED:', typeof window.toggleHandled, typeof window.toggleUnimportant);
console.log('✅ Expand function ready and LOCKED:', typeof window.expandEmail);