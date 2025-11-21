// Email Status Tracker - Mark emails as handled (green) or unimportant (red)
console.log('📧 Email Status Tracker initialized');

// Store email statuses
const EMAIL_STATUS_KEY = 'coi_email_status';

// Get stored email statuses
function getEmailStatuses() {
    const stored = localStorage.getItem(EMAIL_STATUS_KEY);
    return stored ? JSON.parse(stored) : {};
}

// Save email status
function saveEmailStatus(emailId, status) {
    const statuses = getEmailStatuses();
    statuses[emailId] = status;
    localStorage.setItem(EMAIL_STATUS_KEY, JSON.stringify(statuses));
    console.log(`Email ${emailId} marked as ${status}`);
}

// Mark email as handled (green)
window.markEmailHandled = function(emailId, isHandled) {
    const statuses = getEmailStatuses();

    if (isHandled) {
        // Mark as handled (green)
        statuses[emailId] = 'handled';
    } else if (statuses[emailId] === 'handled') {
        // Remove handled status
        delete statuses[emailId];
    }

    localStorage.setItem(EMAIL_STATUS_KEY, JSON.stringify(statuses));
    updateEmailDisplay(emailId, statuses[emailId]);

    // Save current state
    saveInboxState();
};

// Mark email as unimportant (red)
window.markEmailUnimportant = function(emailId) {
    const statuses = getEmailStatuses();

    if (statuses[emailId] === 'unimportant') {
        // Toggle off if already marked
        delete statuses[emailId];
    } else {
        // Mark as unimportant
        statuses[emailId] = 'unimportant';
    }

    localStorage.setItem(EMAIL_STATUS_KEY, JSON.stringify(statuses));
    updateEmailDisplay(emailId, statuses[emailId]);

    // Save current state
    saveInboxState();
};

// Update email display with status
function updateEmailDisplay(emailId, status) {
    const emailElement = document.querySelector(`[onclick*="${emailId}"]`);
    if (!emailElement) return;

    // Remove existing status classes
    emailElement.classList.remove('email-handled', 'email-unimportant');
    emailElement.style.background = '';

    if (status === 'handled') {
        emailElement.classList.add('email-handled');
        emailElement.style.background = 'linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%)';
        emailElement.style.borderLeft = '4px solid #10b981';
    } else if (status === 'unimportant') {
        emailElement.classList.add('email-unimportant');
        emailElement.style.background = 'linear-gradient(to right, #fee2e2 0%, #fef2f2 100%)';
        emailElement.style.borderLeft = '4px solid #ef4444';
    }
}

// Apply statuses to email list
function applyEmailStatuses() {
    const statuses = getEmailStatuses();

    Object.keys(statuses).forEach(emailId => {
        updateEmailDisplay(emailId, statuses[emailId]);
    });
}

// Save inbox state for persistence
function saveInboxState() {
    const coiInbox = document.getElementById('coiInbox');
    if (coiInbox && coiInbox.querySelector('.email-list')) {
        window.savedInboxHTML = coiInbox.innerHTML;
    }
}

// Override the email display function to add status controls
const originalDisplayEmails = window.displayEmailsInInbox;
if (originalDisplayEmails) {
    window.displayEmailsInInbox = function(container, emails) {
        // Call original function first
        if (originalDisplayEmails) {
            originalDisplayEmails(container, emails);
        }

        // Add status controls to each email
        setTimeout(() => {
            addStatusControlsToEmails(emails);
            applyEmailStatuses();
        }, 100);
    };
}

// Add status controls to emails
function addStatusControlsToEmails(emails) {
    const statuses = getEmailStatuses();

    emails.forEach(email => {
        const emailElement = document.querySelector(`[onclick*="${email.id}"]`);
        if (!emailElement) return;

        // Check if controls already added
        if (emailElement.querySelector('.email-status-controls')) return;

        // Create status controls container
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'email-status-controls';
        controlsDiv.style.cssText = `
            position: absolute;
            right: 100px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            gap: 10px;
            z-index: 10;
        `;

        // Handled checkbox (green check)
        const handledBtn = document.createElement('button');
        const isHandled = statuses[email.id] === 'handled';
        handledBtn.innerHTML = isHandled ?
            '<i class="fas fa-check-circle" style="color: #10b981;"></i>' :
            '<i class="far fa-check-circle" style="color: #9ca3af;"></i>';
        handledBtn.title = 'Mark as handled';
        handledBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 5px;
            font-size: 20px;
            transition: all 0.2s;
        `;
        handledBtn.onclick = function(e) {
            e.stopPropagation();
            markEmailHandled(email.id, !isHandled);

            // Update button appearance
            const newIsHandled = getEmailStatuses()[email.id] === 'handled';
            this.innerHTML = newIsHandled ?
                '<i class="fas fa-check-circle" style="color: #10b981;"></i>' :
                '<i class="far fa-check-circle" style="color: #9ca3af;"></i>';
        };

        // Unimportant X mark (red X)
        const unimportantBtn = document.createElement('button');
        const isUnimportant = statuses[email.id] === 'unimportant';
        unimportantBtn.innerHTML = isUnimportant ?
            '<i class="fas fa-times-circle" style="color: #ef4444;"></i>' :
            '<i class="far fa-times-circle" style="color: #9ca3af;"></i>';
        unimportantBtn.title = 'Mark as unimportant';
        unimportantBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 5px;
            font-size: 20px;
            transition: all 0.2s;
        `;
        unimportantBtn.onclick = function(e) {
            e.stopPropagation();
            markEmailUnimportant(email.id);

            // Update button appearance
            const newIsUnimportant = getEmailStatuses()[email.id] === 'unimportant';
            this.innerHTML = newIsUnimportant ?
                '<i class="fas fa-times-circle" style="color: #ef4444;"></i>' :
                '<i class="far fa-times-circle" style="color: #9ca3af;"></i>';
        };

        // Add controls to container
        controlsDiv.appendChild(handledBtn);
        controlsDiv.appendChild(unimportantBtn);

        // Make email container relative for absolute positioning
        emailElement.style.position = 'relative';

        // Add controls to email
        emailElement.appendChild(controlsDiv);

        // Apply initial status
        if (statuses[email.id]) {
            updateEmailDisplay(email.id, statuses[email.id]);
        }
    });
}

// Watch for inbox loads
const observer = new MutationObserver(() => {
    const emailList = document.querySelector('.email-list');
    if (emailList && !emailList.dataset.statusControlsAdded) {
        emailList.dataset.statusControlsAdded = 'true';

        // Get all email items and add controls
        setTimeout(() => {
            const emailItems = document.querySelectorAll('.email-item');
            const emails = Array.from(emailItems).map(item => {
                const onclick = item.getAttribute('onclick') || '';
                const match = onclick.match(/['"]([^'"]+)['"]/);
                return { id: match ? match[1] : null };
            }).filter(e => e.id);

            if (emails.length > 0) {
                addStatusControlsToEmails(emails);
                applyEmailStatuses();
            }
        }, 500);
    }
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Add CSS for hover effects
const style = document.createElement('style');
style.textContent = `
    .email-status-controls button:hover {
        transform: scale(1.2);
    }

    .email-handled {
        background: linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%) !important;
        border-left: 4px solid #10b981 !important;
    }

    .email-unimportant {
        background: linear-gradient(to right, #fee2e2 0%, #fef2f2 100%) !important;
        border-left: 4px solid #ef4444 !important;
        opacity: 0.7;
    }

    .email-item {
        transition: all 0.3s ease;
    }

    .email-status-controls {
        opacity: 0.7;
        transition: opacity 0.2s;
    }

    .email-item:hover .email-status-controls {
        opacity: 1;
    }
`;
document.head.appendChild(style);

// Add summary stats function
window.getEmailStats = function() {
    const statuses = getEmailStatuses();
    const handled = Object.values(statuses).filter(s => s === 'handled').length;
    const unimportant = Object.values(statuses).filter(s => s === 'unimportant').length;
    const total = document.querySelectorAll('.email-item').length;

    console.log(`📊 Email Stats:
    Total: ${total}
    ✅ Handled: ${handled}
    ❌ Unimportant: ${unimportant}
    📬 Pending: ${total - handled - unimportant}`);

    return { total, handled, unimportant, pending: total - handled - unimportant };
};

// Clear all email statuses
window.clearEmailStatuses = function() {
    if (confirm('Clear all email status markings?')) {
        localStorage.removeItem(EMAIL_STATUS_KEY);
        document.querySelectorAll('.email-item').forEach(item => {
            item.classList.remove('email-handled', 'email-unimportant');
            item.style.background = '';
            item.style.borderLeft = '';
        });
        console.log('✅ All email statuses cleared');
    }
};

console.log('✅ Email Status Tracker ready - Use checkmark for handled (green), X for unimportant (red)');