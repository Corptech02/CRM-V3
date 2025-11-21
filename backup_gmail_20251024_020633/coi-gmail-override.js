// Create loadRealCOIEmails with status buttons
console.log('🔧 Creating loadRealCOIEmails with status buttons...');

// Define the function fresh (not as override)
window.loadRealCOIEmails = async function() {
    console.log('📧 Loading emails WITH status buttons...');

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    // Show loading state
    coiInbox.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
            <p>Loading emails from corptech06@gmail.com...</p>
        </div>
    `;

    try {
        // Fetch emails
        const response = await fetch('http://162-220-14-239.nip.io/api/gmail/messages?maxResults=20', {
            headers: {
                'Bypass-Tunnel-Reminder': 'true',
                'Cache-Control': 'no-cache'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch emails');
        }

        const emailResponse = await response.json();

        // Handle both old format (array) and new format (object with messages array)
        const emails = Array.isArray(emailResponse) ? emailResponse : emailResponse.messages || [];
        const source = emailResponse.source || 'unknown';

        console.log(`Loaded ${emails.length} emails via ${source}`);
        if (emailResponse.note) {
            console.log('📧', emailResponse.note);
        }

        // Get stored statuses
        const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');

        // Display emails with status buttons
        coiInbox.innerHTML = `
            <div class="email-list">
                ${emails.map(email => {
                    const date = new Date(email.date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const dateStr = isToday ?
                        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    // Extract sender name
                    const fromMatch = email.from.match(/"?([^"<]+)"?\s*<?/);
                    const senderName = fromMatch ? fromMatch[1].trim() : email.from.split('@')[0];

                    // Check status
                    const status = statuses[email.id];
                    const bgColor = status === 'handled' ? 'background: linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%); border-left: 4px solid #10b981;' :
                                   status === 'unimportant' ? 'background: linear-gradient(to right, #fee2e2 0%, #fef2f2 100%); border-left: 4px solid #ef4444; opacity: 0.7;' :
                                   '';

                    return `
                        <div class="email-item unread" data-email-id="${email.id}"
                             style="cursor: pointer; position: relative; padding: 15px; border-bottom: 1px solid #e5e7eb; ${bgColor}"
                             onclick="expandEmail('${email.id}')">

                            <!-- Email Content -->
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="flex: 1;">
                                    <div style="margin-bottom: 5px;">
                                        <i class="fas fa-circle" style="color: #667eea; font-size: 8px; margin-right: 8px;"></i>
                                        <strong style="color: #1f2937;">${senderName}</strong>
                                    </div>
                                    <div style="color: #374151; font-weight: 500;">${email.subject}</div>
                                    <div style="margin-top: 5px; font-size: 13px; color: #6b7280;">
                                        ${email.snippet ? email.snippet.substring(0, 100) + '...' : ''}
                                    </div>
                                    <div style="margin-top: 5px;">
                                        ${email.attachments && email.attachments.length > 0 ?
                                            '<i class="fas fa-paperclip" style="margin-right: 8px; color: #9ca3af;"></i>' : ''}
                                        <span style="color: #9ca3af; font-size: 12px;">${dateStr}</span>
                                    </div>
                                </div>

                                <!-- Status Buttons -->
                                <div style="display: flex; gap: 10px; margin-left: 20px;">
                                    <button class="status-btn-handled"
                                            data-email-id="${email.id}"
                                            style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid ${status === 'handled' ? '#10b981' : '#e5e7eb'};
                                                   background: ${status === 'handled' ? '#10b981' : 'white'}; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                                            onclick="event.stopPropagation(); toggleHandled('${email.id}', this); return false;">
                                        <i class="fas fa-check" style="color: ${status === 'handled' ? 'white' : '#9ca3af'}; font-size: 18px;"></i>
                                    </button>
                                    <button class="status-btn-unimportant"
                                            data-email-id="${email.id}"
                                            style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid ${status === 'unimportant' ? '#ef4444' : '#e5e7eb'};
                                                   background: ${status === 'unimportant' ? '#ef4444' : 'white'}; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                                            onclick="event.stopPropagation(); toggleUnimportant('${email.id}', this); return false;">
                                        <i class="fas fa-times" style="color: ${status === 'unimportant' ? 'white' : '#9ca3af'}; font-size: 18px;"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        console.log('✅ Emails loaded with status buttons');

    } catch (error) {
        console.error('Error loading emails:', error);

        // Check if error is likely authentication related
        const isAuthError = error.message.includes('Failed to fetch') ||
                           error.message.includes('401') ||
                           error.message.includes('Unauthorized') ||
                           error.message.includes('authentication') ||
                           error.message.includes('auth');

        if (isAuthError) {
            coiInbox.innerHTML = `
                <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 20px; border-radius: 8px;">
                    <div style="text-align: center; color: #92400e;">
                        <i class="fas fa-key" style="font-size: 48px; margin-bottom: 16px;"></i>
                        <h3 style="margin: 0 0 15px 0;">Gmail Authorization Required</h3>
                        <p style="margin: 0 0 20px 0;">Error loading emails: ${error.message}</p>

                        <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px; text-align: left;">
                            <h4 style="color: #92400e; margin: 0 0 10px 0;">Quick Fix:</h4>
                            <ol style="color: #92400e; margin: 10px 0; padding-left: 20px;">
                                <li style="margin: 5px 0;">Run: <code style="background: #f3f4f6; padding: 2px 6px;">cd /var/www/vanguard/backend && node add-gmail-token-web.js</code></li>
                                <li style="margin: 5px 0;">Login with: corptech06@gmail.com / corp2006</li>
                                <li style="margin: 5px 0;">Copy the authorization code and paste it</li>
                                <li style="margin: 5px 0;">Refresh this page</li>
                            </ol>
                        </div>

                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button onclick="loadRealCOIEmails()" style="padding: 10px 20px; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-sync"></i> Retry
                            </button>
                            <button onclick="window.open('/api/gmail/auth-url', '_blank')" style="padding: 10px 20px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-key"></i> Re-authenticate Gmail
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            coiInbox.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>Error loading emails: ${error.message}</p>
                    <button onclick="loadRealCOIEmails()" style="margin-top: 10px; padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }
};

// Toggle handled status
window.toggleHandled = function(emailId, button) {
    console.log('Toggle handled for:', emailId);

    const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');
    const emailDiv = button.closest('.email-item');

    if (statuses[emailId] === 'handled') {
        // Remove handled status
        delete statuses[emailId];
        button.style.background = 'white';
        button.style.borderColor = '#e5e7eb';
        button.querySelector('i').style.color = '#9ca3af';
        emailDiv.style.background = '';
        emailDiv.style.borderLeft = '';
    } else {
        // Set as handled, remove unimportant if set
        statuses[emailId] = 'handled';
        button.style.background = '#10b981';
        button.style.borderColor = '#10b981';
        button.querySelector('i').style.color = 'white';
        emailDiv.style.background = 'linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%)';
        emailDiv.style.borderLeft = '4px solid #10b981';
        emailDiv.style.opacity = '1';

        // Reset unimportant button
        const unimportantBtn = emailDiv.querySelector('.status-btn-unimportant');
        if (unimportantBtn) {
            unimportantBtn.style.background = 'white';
            unimportantBtn.style.borderColor = '#e5e7eb';
            unimportantBtn.querySelector('i').style.color = '#9ca3af';
        }
    }

    localStorage.setItem('coi_email_status', JSON.stringify(statuses));
};

// Toggle unimportant status
window.toggleUnimportant = function(emailId, button) {
    console.log('Toggle unimportant for:', emailId);

    const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');
    const emailDiv = button.closest('.email-item');

    if (statuses[emailId] === 'unimportant') {
        // Remove unimportant status
        delete statuses[emailId];
        button.style.background = 'white';
        button.style.borderColor = '#e5e7eb';
        button.querySelector('i').style.color = '#9ca3af';
        emailDiv.style.background = '';
        emailDiv.style.borderLeft = '';
        emailDiv.style.opacity = '1';
    } else {
        // Set as unimportant, remove handled if set
        statuses[emailId] = 'unimportant';
        button.style.background = '#ef4444';
        button.style.borderColor = '#ef4444';
        button.querySelector('i').style.color = 'white';
        emailDiv.style.background = 'linear-gradient(to right, #fee2e2 0%, #fef2f2 100%)';
        emailDiv.style.borderLeft = '4px solid #ef4444';
        emailDiv.style.opacity = '0.7';

        // Reset handled button
        const handledBtn = emailDiv.querySelector('.status-btn-handled');
        if (handledBtn) {
            handledBtn.style.background = 'white';
            handledBtn.style.borderColor = '#e5e7eb';
            handledBtn.querySelector('i').style.color = '#9ca3af';
        }
    }

    localStorage.setItem('coi_email_status', JSON.stringify(statuses));
};

// Add stats function
window.getEmailStats = function() {
    const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');
    const handled = Object.values(statuses).filter(s => s === 'handled').length;
    const unimportant = Object.values(statuses).filter(s => s === 'unimportant').length;
    const total = document.querySelectorAll('.email-item').length;

    const stats = {
        total,
        handled,
        unimportant,
        pending: total - handled - unimportant
    };

    console.log(`📊 Email Stats:
    Total: ${stats.total}
    ✅ Handled: ${stats.handled}
    ❌ Unimportant: ${stats.unimportant}
    📬 Pending: ${stats.pending}`);

    return stats;
};

// Clear all statuses
window.clearEmailStatuses = function() {
    if (confirm('Clear all email status markings?')) {
        localStorage.removeItem('coi_email_status');
        loadRealCOIEmails(); // Reload to refresh display
        console.log('✅ All email statuses cleared');
    }
};

// Auto-reload when navigating to #coi
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#coi') {
        setTimeout(() => {
            const coiInbox = document.getElementById('coiInbox');
            if (coiInbox && !coiInbox.querySelector('.email-item')) {
                loadRealCOIEmails();
            }
        }, 500);
    }
});

console.log('✅ Email status buttons integrated into loadRealCOIEmails');
console.log('📊 Use getEmailStats() to see statistics');
console.log('🗑️ Use clearEmailStatuses() to clear all markings');