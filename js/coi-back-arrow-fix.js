// COI Back Arrow Ultimate Fix
console.log('🔧 COI Back Arrow Ultimate Fix loading...');

// Store the inbox HTML globally
window.savedInboxHTML = null;

// Intercept ALL email expansions to save the inbox
const originalExpandEmail = window.expandEmail;
window.expandEmail = async function(emailId) {
    console.log('📧 Expanding email, saving inbox first...');

    const coiInbox = document.getElementById('coiInbox');
    if (coiInbox) {
        // Save the current inbox HTML BEFORE expanding
        const currentHTML = coiInbox.innerHTML;
        if (currentHTML.includes('email-list') && !currentHTML.includes('Loading')) {
            window.savedInboxHTML = currentHTML;
            window.previousInboxContent = currentHTML;
            console.log('✅ Saved inbox HTML before expanding');
        }
    }

    // Call original function if it exists
    if (originalExpandEmail) {
        return originalExpandEmail.call(this, emailId);
    }
};

// Override backToInbox with a working version
window.backToInbox = function() {
    console.log('⬅️ Back to inbox clicked');

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) {
        console.error('COI inbox not found');
        return;
    }

    // Check for saved content
    const saved = window.savedInboxHTML || window.previousInboxContent;

    if (saved && saved.includes('email-list')) {
        console.log('✅ Restoring saved inbox');
        coiInbox.innerHTML = saved;

        // Re-enable clicking on emails
        setTimeout(() => {
            const emailItems = document.querySelectorAll('.email-item');
            emailItems.forEach(item => {
                item.style.cursor = 'pointer';
                item.onclick = function(e) {
                    if (!e.target.closest('.email-actions')) {
                        const emailId = this.getAttribute('data-email-id');
                        if (emailId) {
                            window.expandEmail(emailId);
                        }
                    }
                };
            });
            console.log('✅ Re-enabled click handlers for', emailItems.length, 'emails');
        }, 100);

        return; // Stop here, don't reload
    }

    console.log('⚠️ No saved inbox, reloading...');
    // Only reload if we absolutely have no saved content
    if (window.loadRealEmails) {
        window.loadRealEmails();
    } else if (window.loadRealCOIEmails) {
        window.loadRealCOIEmails();
    } else {
        // Last resort - just show a message
        coiInbox.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p>Please refresh the page to reload emails</p>
                <button class="btn-primary" onclick="location.reload()">
                    <i class="fas fa-refresh"></i> Refresh Page
                </button>
            </div>
        `;
    }
};

// Save inbox HTML whenever emails are successfully loaded
const originalLoadRealEmails = window.loadRealEmails;
if (originalLoadRealEmails) {
    window.loadRealEmails = async function() {
        const result = await originalLoadRealEmails.apply(this, arguments);

        // Save the inbox after emails load
        setTimeout(() => {
            const coiInbox = document.getElementById('coiInbox');
            if (coiInbox && coiInbox.querySelector('.email-list')) {
                window.savedInboxHTML = coiInbox.innerHTML;
                console.log('✅ Auto-saved inbox after loading emails');
            }
        }, 500);

        return result;
    };
}

// Monitor and save inbox state periodically
setInterval(() => {
    const coiInbox = document.getElementById('coiInbox');
    if (coiInbox) {
        const html = coiInbox.innerHTML;
        // Only save if showing email list (not loading, not email detail)
        if (html.includes('email-list') &&
            !html.includes('Loading') &&
            !html.includes('email-detail-view')) {
            window.savedInboxHTML = html;
        }
    }
}, 1000);

console.log('✅ COI Back Arrow Ultimate Fix active');