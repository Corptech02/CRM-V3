// AGGRESSIVE Email Status Fix - Forces status controls to appear
console.log('🔨 AGGRESSIVE Email Status Fix - Forcing status controls...');

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
    if (status) {
        statuses[emailId] = status;
    } else {
        delete statuses[emailId];
    }
    localStorage.setItem(EMAIL_STATUS_KEY, JSON.stringify(statuses));
}

// Override loadRealCOIEmails to add status controls
if (window.loadRealCOIEmails) {
    const originalLoad = window.loadRealCOIEmails;
    window.loadRealCOIEmails = async function() {
        console.log('🎯 Intercepted loadRealCOIEmails');
        const result = await originalLoad.apply(this, arguments);

        // Wait for emails to render
        setTimeout(() => {
            injectStatusControls();
        }, 1000);

        return result;
    };
}

// Function to inject status controls into all email items
function injectStatusControls() {
    console.log('💉 Injecting status controls...');

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) {
        console.log('❌ No COI inbox found');
        return;
    }

    // Find all email items
    const emailItems = coiInbox.querySelectorAll('.email-item');
    console.log(`Found ${emailItems.length} email items`);

    const statuses = getEmailStatuses();

    emailItems.forEach((item, index) => {
        // Skip if controls already added
        if (item.querySelector('.email-status-controls-aggressive')) {
            return;
        }

        // Extract email ID from onclick
        const onclick = item.getAttribute('onclick') || '';
        let emailId = null;

        // Try different patterns to extract ID
        const patterns = [
            /expandEmail\(['"]([^'"]+)['"]\)/,
            /viewEmailDetails\(['"]([^'"]+)['"]\)/,
            /data-email-id=['"]([^'"]+)['"]/
        ];

        for (const pattern of patterns) {
            const match = onclick.match(pattern) || item.outerHTML.match(pattern);
            if (match) {
                emailId = match[1];
                break;
            }
        }

        // If still no ID, check data attribute
        if (!emailId) {
            emailId = item.getAttribute('data-email-id');
        }

        // If still no ID, generate one
        if (!emailId) {
            emailId = `email_${index}_${Date.now()}`;
            console.log(`Generated ID for email ${index}: ${emailId}`);
        }

        console.log(`Adding controls to email ${emailId}`);

        // Make item relative for positioning
        item.style.position = 'relative';

        // Create controls container
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'email-status-controls-aggressive';
        controlsDiv.style.cssText = `
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            gap: 10px;
            z-index: 100;
            background: white;
            padding: 5px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;

        // Create handled button (green check)
        const handledBtn = document.createElement('button');
        const isHandled = statuses[emailId] === 'handled';
        handledBtn.innerHTML = isHandled ?
            '<i class="fas fa-check-circle" style="color: #10b981; font-size: 24px;"></i>' :
            '<i class="far fa-check-circle" style="color: #9ca3af; font-size: 24px;"></i>';
        handledBtn.title = 'Mark as handled';
        handledBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 5px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Handled button click handler
        handledBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const currentStatus = getEmailStatuses()[emailId];
            const newIsHandled = currentStatus !== 'handled';

            if (newIsHandled) {
                saveEmailStatus(emailId, 'handled');
                item.style.background = 'linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%)';
                item.style.borderLeft = '4px solid #10b981';
                this.innerHTML = '<i class="fas fa-check-circle" style="color: #10b981; font-size: 24px;"></i>';

                // Clear unimportant if set
                const unimportantBtn = controlsDiv.querySelector('.unimportant-btn');
                if (unimportantBtn) {
                    unimportantBtn.innerHTML = '<i class="far fa-times-circle" style="color: #9ca3af; font-size: 24px;"></i>';
                }
            } else {
                saveEmailStatus(emailId, null);
                item.style.background = '';
                item.style.borderLeft = '';
                this.innerHTML = '<i class="far fa-check-circle" style="color: #9ca3af; font-size: 24px;"></i>';
            }

            return false;
        };

        // Create unimportant button (red X)
        const unimportantBtn = document.createElement('button');
        unimportantBtn.className = 'unimportant-btn';
        const isUnimportant = statuses[emailId] === 'unimportant';
        unimportantBtn.innerHTML = isUnimportant ?
            '<i class="fas fa-times-circle" style="color: #ef4444; font-size: 24px;"></i>' :
            '<i class="far fa-times-circle" style="color: #9ca3af; font-size: 24px;"></i>';
        unimportantBtn.title = 'Mark as unimportant';
        unimportantBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 5px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Unimportant button click handler
        unimportantBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const currentStatus = getEmailStatuses()[emailId];
            const newIsUnimportant = currentStatus !== 'unimportant';

            if (newIsUnimportant) {
                saveEmailStatus(emailId, 'unimportant');
                item.style.background = 'linear-gradient(to right, #fee2e2 0%, #fef2f2 100%)';
                item.style.borderLeft = '4px solid #ef4444';
                item.style.opacity = '0.7';
                this.innerHTML = '<i class="fas fa-times-circle" style="color: #ef4444; font-size: 24px;"></i>';

                // Clear handled if set
                handledBtn.innerHTML = '<i class="far fa-check-circle" style="color: #9ca3af; font-size: 24px;"></i>';
            } else {
                saveEmailStatus(emailId, null);
                item.style.background = '';
                item.style.borderLeft = '';
                item.style.opacity = '1';
                this.innerHTML = '<i class="far fa-times-circle" style="color: #9ca3af; font-size: 24px;"></i>';
            }

            return false;
        };

        // Add buttons to container
        controlsDiv.appendChild(handledBtn);
        controlsDiv.appendChild(unimportantBtn);

        // Add controls to email item
        item.appendChild(controlsDiv);

        // Apply initial status styling
        if (statuses[emailId] === 'handled') {
            item.style.background = 'linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%)';
            item.style.borderLeft = '4px solid #10b981';
        } else if (statuses[emailId] === 'unimportant') {
            item.style.background = 'linear-gradient(to right, #fee2e2 0%, #fef2f2 100%)';
            item.style.borderLeft = '4px solid #ef4444';
            item.style.opacity = '0.7';
        }
    });

    console.log('✅ Status controls injected');
}

// Monitor for COI inbox changes
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            // Check if COI inbox was updated
            const target = mutation.target;
            if (target.id === 'coiInbox' || target.closest('#coiInbox')) {
                // Check if email list was added
                if (document.querySelector('#coiInbox .email-item')) {
                    setTimeout(() => {
                        injectStatusControls();
                    }, 500);
                }
            }
        }
    }
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Add CSS
const style = document.createElement('style');
style.textContent = `
    .email-status-controls-aggressive {
        opacity: 0.8;
        transition: opacity 0.2s;
    }

    .email-item:hover .email-status-controls-aggressive {
        opacity: 1;
    }

    .email-status-controls-aggressive button:hover {
        transform: scale(1.2);
    }

    .email-item {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);

// Try to inject immediately if inbox already loaded
setTimeout(() => {
    if (document.querySelector('#coiInbox .email-item')) {
        injectStatusControls();
    }
}, 1000);

// Also inject on hash change to #coi
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#coi') {
        setTimeout(() => {
            injectStatusControls();
        }, 1500);
    }
});

// Public functions
window.getEmailStats = function() {
    const statuses = getEmailStatuses();
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

window.clearEmailStatuses = function() {
    if (confirm('Clear all email status markings?')) {
        localStorage.removeItem(EMAIL_STATUS_KEY);
        document.querySelectorAll('.email-item').forEach(item => {
            item.style.background = '';
            item.style.borderLeft = '';
            item.style.opacity = '1';
        });

        // Update all buttons
        document.querySelectorAll('.email-status-controls-aggressive button').forEach((btn, i) => {
            if (i % 2 === 0) {
                btn.innerHTML = '<i class="far fa-check-circle" style="color: #9ca3af; font-size: 24px;"></i>';
            } else {
                btn.innerHTML = '<i class="far fa-times-circle" style="color: #9ca3af; font-size: 24px;"></i>';
            }
        });

        console.log('✅ All email statuses cleared');
    }
};

// Force injection every 2 seconds for 10 seconds after page load
let injectCount = 0;
const forceInject = setInterval(() => {
    if (document.querySelector('#coiInbox .email-item')) {
        injectStatusControls();
        clearInterval(forceInject);
    }
    injectCount++;
    if (injectCount > 5) {
        clearInterval(forceInject);
    }
}, 2000);

console.log('✅ AGGRESSIVE Email Status Fix loaded - Controls will be forced onto emails');