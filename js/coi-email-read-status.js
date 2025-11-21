// COI Email Read Status Manager - Tracks and styles read/unread emails
console.log('📧 COI Email Read Status Manager loading...');

// Get read emails from localStorage (persists across sessions and users)
function getReadEmails() {
    const readEmails = localStorage.getItem('coi_read_emails');
    return readEmails ? JSON.parse(readEmails) : [];
}

// Save read email to localStorage
function markEmailAsRead(emailId) {
    const readEmails = getReadEmails();
    if (!readEmails.includes(emailId)) {
        readEmails.push(emailId);
        localStorage.setItem('coi_read_emails', JSON.stringify(readEmails));
        console.log('✅ Marked email as read:', emailId);
    }
    updateEmailStyles();
}

// Apply distinct styling to emails based on read status
function updateEmailStyles() {
    const readEmails = getReadEmails();

    document.querySelectorAll('.email-item').forEach(item => {
        const emailId = item.getAttribute('data-email-id');
        if (!emailId) return;

        if (readEmails.includes(emailId)) {
            // READ EMAIL STYLING - Much more subdued
            item.style.cssText = `
                background: #f9fafb !important;
                opacity: 0.6 !important;
                border-left: 4px solid #d1d5db !important;
                padding: 15px !important;
                border-bottom: 1px solid #e5e7eb !important;
                transition: all 0.3s !important;
            `;

            // Make text lighter for read emails
            const fromElement = item.querySelector('.email-from strong');
            if (fromElement) {
                fromElement.style.cssText = 'color: #9ca3af !important; font-weight: normal !important;';
            }

            const subjectElement = item.querySelector('.email-subject');
            if (subjectElement) {
                subjectElement.style.cssText = 'color: #9ca3af !important;';
            }

            // Remove or hide the unread indicator dot
            const dot = item.querySelector('.fa-circle');
            if (dot) {
                dot.style.display = 'none';
            }

            item.classList.remove('unread');
            item.classList.add('read');

        } else {
            // UNREAD EMAIL STYLING - Bold and prominent
            item.style.cssText = `
                background: #ffffff !important;
                border-left: 4px solid #3b82f6 !important;
                padding: 15px !important;
                border-bottom: 1px solid #e5e7eb !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                transition: all 0.3s !important;
            `;

            // Make text bold for unread emails
            const fromElement = item.querySelector('.email-from strong');
            if (fromElement) {
                fromElement.style.cssText = 'color: #1f2937 !important; font-weight: bold !important;';
            }

            const subjectElement = item.querySelector('.email-subject');
            if (subjectElement) {
                subjectElement.style.cssText = 'color: #111827 !important; font-weight: 600 !important;';
            }

            // Show blue dot for unread
            let dot = item.querySelector('.fa-circle');
            if (!dot) {
                const fromDiv = item.querySelector('.email-from');
                if (fromDiv) {
                    dot = document.createElement('i');
                    dot.className = 'fas fa-circle';
                    dot.style.cssText = 'color: #3b82f6; font-size: 8px; margin-right: 8px;';
                    fromDiv.insertBefore(dot, fromDiv.firstChild);
                }
            } else {
                dot.style.cssText = 'color: #3b82f6; font-size: 8px; margin-right: 8px; display: inline;';
            }

            item.classList.add('unread');
            item.classList.remove('read');
        }

        // Add hover effects - keep unread styling on hover
        item.onmouseenter = function() {
            if (this.classList.contains('read')) {
                // For read emails, slightly darker on hover
                this.style.background = '#f3f4f6 !important';
                this.style.opacity = '0.7 !important';
            } else {
                // For unread emails, keep them prominent with light blue tint
                this.style.background = '#eff6ff !important';
                this.style.transform = 'translateX(2px)';
                // Keep the blue border and bold text
                this.style.borderLeft = '4px solid #3b82f6 !important';
                // Keep the blue dot visible
                const dot = this.querySelector('.fa-circle');
                if (dot) {
                    dot.style.display = 'inline';
                    dot.style.color = '#3b82f6';
                }
            }
        };

        item.onmouseleave = function() {
            if (this.classList.contains('read')) {
                // Return to read styling
                this.style.background = '#f9fafb !important';
                this.style.opacity = '0.6 !important';
            } else {
                // Return to unread styling - keep everything prominent
                this.style.background = '#ffffff !important';
                this.style.transform = 'translateX(0)';
                this.style.borderLeft = '4px solid #3b82f6 !important';
                // Keep the blue dot visible
                const dot = this.querySelector('.fa-circle');
                if (dot) {
                    dot.style.display = 'inline';
                    dot.style.color = '#3b82f6';
                }
            }
        };
    });

    // Update unread count
    updateUnreadCount();
}

// Show unread count in the header
function updateUnreadCount() {
    const readEmails = getReadEmails();
    const totalEmails = document.querySelectorAll('.email-item').length;
    const unreadCount = Array.from(document.querySelectorAll('.email-item')).filter(item => {
        const emailId = item.getAttribute('data-email-id');
        return emailId && !readEmails.includes(emailId);
    }).length;

    // Find or create unread counter
    let counter = document.querySelector('.unread-counter');
    if (!counter) {
        const inboxHeader = document.querySelector('.panel-header h3');
        if (inboxHeader && inboxHeader.textContent.includes('COI Request Inbox')) {
            counter = document.createElement('span');
            counter.className = 'unread-counter';
            inboxHeader.appendChild(counter);
        }
    }

    if (counter) {
        if (unreadCount > 0) {
            counter.style.cssText = `
                background: #ef4444;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                margin-left: 10px;
                font-weight: bold;
            `;
            counter.textContent = unreadCount;
        } else {
            counter.style.display = 'none';
        }
    }

    console.log(`📊 Emails: ${unreadCount} unread, ${totalEmails - unreadCount} read`);
}

// Mark email as read ONLY when expanded (clicked to open)
const originalExpandEmail = window.expandEmail;
window.expandEmail = async function(emailId) {
    console.log('📖 Opening email:', emailId);

    // Mark as read immediately when opened
    markEmailAsRead(emailId);

    // Update the specific email item immediately
    const emailItem = document.querySelector(`[data-email-id="${emailId}"]`);
    if (emailItem) {
        // Remove unread styling immediately
        emailItem.classList.remove('unread');
        emailItem.classList.add('read');

        // Apply read styling
        emailItem.style.cssText = `
            background: #f9fafb !important;
            opacity: 0.6 !important;
            border-left: 4px solid #d1d5db !important;
            padding: 15px !important;
            border-bottom: 1px solid #e5e7eb !important;
        `;

        // Remove the blue dot
        const dot = emailItem.querySelector('.fa-circle');
        if (dot) {
            dot.style.display = 'none';
        }

        // Update text styling
        const fromElement = emailItem.querySelector('.email-from strong');
        if (fromElement) {
            fromElement.style.cssText = 'color: #9ca3af !important; font-weight: normal !important;';
        }

        const subjectElement = emailItem.querySelector('.email-subject');
        if (subjectElement) {
            subjectElement.style.cssText = 'color: #9ca3af !important;';
        }
    }

    // Call original function
    if (originalExpandEmail) {
        return originalExpandEmail.call(this, emailId);
    }
};

// Apply styles whenever emails are loaded
const originalDisplayRealEmails = window.displayRealEmails;
if (originalDisplayRealEmails) {
    window.displayRealEmails = function(emails) {
        const result = originalDisplayRealEmails.apply(this, arguments);
        setTimeout(updateEmailStyles, 100);
        return result;
    };
}

// Monitor for new emails being displayed
const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.addedNodes.length) {
            const hasEmails = Array.from(mutation.addedNodes).some(node => {
                return node.nodeType === 1 &&
                       (node.classList?.contains('email-item') ||
                        node.querySelector?.('.email-item'));
            });
            if (hasEmails) {
                setTimeout(updateEmailStyles, 100);
            }
        }
    }
});

// Start observing when COI inbox exists
const startObserving = () => {
    const coiInbox = document.getElementById('coiInbox');
    if (coiInbox) {
        observer.observe(coiInbox, { childList: true, subtree: true });
        updateEmailStyles();
    }
};

// Start observing on page load and hash changes
document.addEventListener('DOMContentLoaded', startObserving);
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#coi') {
        setTimeout(startObserving, 500);
    }
});

// Apply styles periodically to catch any changes
setInterval(() => {
    if (window.location.hash === '#coi' && document.querySelector('.email-item')) {
        updateEmailStyles();
    }
}, 2000);

// Add CSS for additional visual distinction
const style = document.createElement('style');
style.textContent = `
    /* Unread emails - prominent styling */
    .email-item.unread {
        position: relative;
        font-weight: bold !important;
    }

    .email-item.unread::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
    }

    /* Read emails - subdued styling */
    .email-item.read {
        position: relative;
    }

    .email-item.read::after {
        content: 'READ';
        position: absolute;
        right: 15px;
        top: 15px;
        font-size: 10px;
        color: #9ca3af;
        font-weight: normal;
        letter-spacing: 1px;
    }

    /* Unread badge animation */
    .email-item.unread .fa-circle {
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
`;
document.head.appendChild(style);

console.log('✅ COI Email Read Status Manager active');