// ABSOLUTE FINAL: Only allow emails with check/X buttons
console.log('🎯 ENFORCING CHECK/X BUTTONS ONLY');

// Wait for DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforceCheckXButtons);
} else {
    enforceCheckXButtons();
}

function enforceCheckXButtons() {
    console.log('🔒 Enforcing check/X button layout...');

    // The ONLY function that should render emails
    const correctEmailFunction = async function() {
        console.log('✅ Loading emails WITH check/X buttons...');

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

            const emails = await response.json();
            console.log(`Loaded ${emails.length} emails`);

            // Get stored statuses
            const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');

            // Display emails WITH CHECK/X BUTTONS
            coiInbox.innerHTML = `
                <div class="email-list">
                    ${emails.map(email => {
                        const date = new Date(email.date);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const dateStr = isToday ?
                            date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                            date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                        const fromMatch = email.from.match(/"?([^"<]+)"?\s*<?/);
                        const senderName = fromMatch ? fromMatch[1].trim() : email.from.split('@')[0];

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

                                    <!-- CHECK AND X BUTTONS - ALWAYS VISIBLE -->
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

            console.log('✅ Emails loaded WITH CHECK/X BUTTONS');

        } catch (error) {
            console.error('Error loading emails:', error);
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
    };

    // Toggle handlers
    window.toggleHandled = function(emailId, button) {
        const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');
        const emailDiv = button.closest('.email-item');

        if (statuses[emailId] === 'handled') {
            delete statuses[emailId];
            button.style.background = 'white';
            button.style.borderColor = '#e5e7eb';
            button.querySelector('i').style.color = '#9ca3af';
            emailDiv.style.background = '';
            emailDiv.style.borderLeft = '';
        } else {
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

    window.toggleUnimportant = function(emailId, button) {
        const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');
        const emailDiv = button.closest('.email-item');

        if (statuses[emailId] === 'unimportant') {
            delete statuses[emailId];
            button.style.background = 'white';
            button.style.borderColor = '#e5e7eb';
            button.querySelector('i').style.color = '#9ca3af';
            emailDiv.style.background = '';
            emailDiv.style.borderLeft = '';
            emailDiv.style.opacity = '1';
        } else {
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

    // OVERRIDE EVERYTHING
    window.loadRealCOIEmails = correctEmailFunction;
    window.loadRealEmails = correctEmailFunction;
    window.loadCOIEmails = correctEmailFunction;
    window.loadGmailInbox = correctEmailFunction;
    window.displayGmailEmails = correctEmailFunction;
    // Don't override loadCOIView - let it create the structure first
    const originalLoadCOIView = window.loadCOIView;
    window.loadCOIView = function() {
        console.log('Loading COI view with check/X buttons...');
        // First call the original to create the structure
        if (originalLoadCOIView && typeof originalLoadCOIView === 'function') {
            originalLoadCOIView();
        }
        // Then load emails with buttons after a short delay
        setTimeout(() => {
            correctEmailFunction();
        }, 100);
    };

    // Back button always reloads with buttons
    window.backToInbox = function() {
        console.log('Back to inbox - loading with check/X buttons');
        correctEmailFunction();
    };

    // Auto-load if on COI page
    if (window.location.hash === '#coi') {
        setTimeout(() => {
            const coiInbox = document.getElementById('coiInbox');
            if (coiInbox) {
                const hasEmails = coiInbox.querySelector('.email-item');
                const hasButtons = coiInbox.querySelector('.status-btn-handled');

                if (!hasEmails || !hasButtons) {
                    console.log('🚀 Auto-loading emails with check/X buttons');
                    correctEmailFunction();
                }
            }
        }, 100);
    }

    console.log('✅ CHECK/X BUTTON ENFORCEMENT COMPLETE');
}