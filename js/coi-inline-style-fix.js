// COI INLINE STYLE FIX - Forces inline styles for email items
console.log('💪 COI INLINE STYLE FIX LOADING...');

// Override the function that displays emails to add inline styles
function fixEmailDisplay() {
    // Find where emails are displayed and override it
    const originalDisplayRealEmails = window.displayRealEmails;

    window.displayRealEmails = function(emails) {
        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) return;

        if (!emails || emails.length === 0) {
            coiInbox.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p><strong>No emails found in corptech02@gmail.com</strong></p>
                    <button class="btn-primary" onclick="loadRealEmails()" style="margin-top: 16px;">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
            `;
            return;
        }

        // Get read emails list
        const readEmails = localStorage.getItem('coi_read_emails');
        const readList = readEmails ? JSON.parse(readEmails) : [];

        console.log('✅ Displaying emails with inline styles. Read emails:', readList);

        coiInbox.innerHTML = `
            <div class="email-list">
                ${emails.map(email => {
                    const date = new Date(email.date || email.internalDate || Date.now());
                    const isToday = date.toDateString() === new Date().toDateString();
                    const dateStr = isToday ?
                        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    const from = email.from || 'Unknown Sender';
                    const fromMatch = from.match(/"?([^"<]+)"?\s*<?/);
                    const senderName = fromMatch ? fromMatch[1].trim() : from.split('@')[0];

                    // Check if this email has been read
                    const isRead = readList.includes(email.id);

                    // INLINE STYLES BASED ON READ STATUS
                    const itemStyle = isRead ?
                        'background: #f9fafb; opacity: 0.6; border-left: 4px solid #d1d5db; padding: 15px; border-bottom: 1px solid #e5e7eb; cursor: pointer; transition: all 0.2s;' :
                        'background: #ffffff; border-left: 4px solid #3b82f6; padding: 15px; border-bottom: 1px solid #e5e7eb; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: all 0.2s;';

                    const textStyle = isRead ?
                        'color: #9ca3af; font-weight: normal;' :
                        'color: #1f2937; font-weight: bold;';

                    const subjectStyle = isRead ?
                        'color: #9ca3af; font-weight: normal;' :
                        'color: #111827; font-weight: 600;';

                    const dotDisplay = isRead ? 'display: none;' : 'color: #3b82f6; font-size: 8px; margin-right: 8px;';

                    return `
                        <div class="email-item ${isRead ? 'read' : 'unread'}"
                             data-email-id="${email.id}"
                             style="${itemStyle}"
                             onmouseover="this.style.background = '${isRead ? '#f3f4f6' : '#eff6ff'}'; ${!isRead ? "this.style.transform = 'translateX(2px)'; this.style.borderLeft = '4px solid #3b82f6';" : "this.style.opacity = '0.7';"}"
                             onmouseout="this.style.background = '${isRead ? '#f9fafb' : '#ffffff'}'; ${!isRead ? "this.style.transform = 'translateX(0)'; this.style.borderLeft = '4px solid #3b82f6';" : "this.style.opacity = '0.6';"}"
                             onclick="if(!event.target.closest('.email-actions')) {
                                 // Mark as read
                                 const readEmails = JSON.parse(localStorage.getItem('coi_read_emails') || '[]');
                                 if (!readEmails.includes('${email.id}')) {
                                     readEmails.push('${email.id}');
                                     localStorage.setItem('coi_read_emails', JSON.stringify(readEmails));
                                 }
                                 // Update styling immediately
                                 this.style.background = '#f9fafb';
                                 this.style.opacity = '0.6';
                                 this.style.borderLeft = '4px solid #d1d5db';
                                 const dot = this.querySelector('.fa-circle');
                                 if (dot) dot.style.display = 'none';
                                 const strong = this.querySelector('.email-from strong');
                                 if (strong) { strong.style.color = '#9ca3af'; strong.style.fontWeight = 'normal'; }
                                 const subject = this.querySelector('.email-subject');
                                 if (subject) { subject.style.color = '#9ca3af'; subject.style.fontWeight = 'normal'; }
                                 // Expand email
                                 window.expandEmail('${email.id}');
                             }">
                            <div class="email-header">
                                <div class="email-info">
                                    <div class="email-from" style="margin-bottom: 5px;">
                                        <i class="fas fa-circle" style="${dotDisplay}"></i>
                                        <strong style="${textStyle}">${senderName}</strong>
                                        <span style="color: #9ca3af; font-size: 12px; margin-left: 8px;">corptech02@gmail.com</span>
                                        ${isRead ? '<span style="position: absolute; right: 15px; top: 15px; font-size: 10px; color: #9ca3af; letter-spacing: 1px;">READ</span>' : ''}
                                    </div>
                                    <div class="email-subject" style="${subjectStyle}; margin-bottom: 5px;">
                                        ${email.subject || 'No subject'}
                                    </div>
                                    <div class="email-meta" style="color: #9ca3af; font-size: 12px;">
                                        ${email.attachments && email.attachments.length > 0 ?
                                            '<i class="fas fa-paperclip" style="margin-right: 8px;"></i>' : ''}
                                        <span class="email-date">${dateStr}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="padding: 10px; text-align: center; background: #f3f4f6;">
                <button class="btn-secondary btn-small" onclick="loadRealEmails()">
                    <i class="fas fa-sync"></i> Refresh Inbox
                </button>
            </div>
        `;

        // Update unread count
        const unreadCount = emails.filter(e => !readList.includes(e.id)).length;
        console.log(`📊 Emails: ${unreadCount} unread, ${emails.length - unreadCount} read`);
    };

    // If displayRealEmails doesn't exist, try to override other functions
    if (!originalDisplayRealEmails && window.loadRealEmails) {
        const originalLoadRealEmails = window.loadRealEmails;
        window.loadRealEmails = async function() {
            const result = await originalLoadRealEmails.apply(this, arguments);
            // Apply our display function after loading
            setTimeout(() => {
                const coiInbox = document.getElementById('coiInbox');
                if (coiInbox && coiInbox.querySelector('.email-list')) {
                    console.log('Applying inline styles to loaded emails...');
                    fixEmailDisplay();
                }
            }, 100);
            return result;
        };
    }
}

// Apply fix immediately and repeatedly
fixEmailDisplay();
// setInterval(fixEmailDisplay, 1000); // DISABLED - Causing flickering every 1000ms

// Also monitor for changes
document.addEventListener('DOMContentLoaded', fixEmailDisplay);
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#coi') {
        setTimeout(fixEmailDisplay, 500);
    }
});

console.log('✅ COI INLINE STYLE FIX ACTIVE - Emails will have inline styles!');