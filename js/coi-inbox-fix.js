// COI Inbox Back Arrow Fix - Ensures back arrow works correctly
console.log('🔧 COI Inbox Back Arrow Fix loading...');

// Store the email list HTML when emails are displayed
let savedEmailListHTML = null;

// Override the displayRealEmails function to save the HTML
const originalDisplayRealEmails = window.displayRealEmails;
if (originalDisplayRealEmails) {
    window.displayRealEmails = function(emails) {
        originalDisplayRealEmails.apply(this, arguments);
        // Save the inbox HTML after emails are displayed
        setTimeout(() => {
            const coiInbox = document.getElementById('coiInbox');
            if (coiInbox && coiInbox.querySelector('.email-list')) {
                savedEmailListHTML = coiInbox.innerHTML;
                console.log('✅ Saved email list HTML for back navigation');
            }
        }, 100);
    };
}

// Override expandEmail to properly save the inbox state
const originalExpandEmail = window.expandEmail;
window.expandEmail = async function(emailId) {
    console.log('📧 Expanding email and saving inbox state...');

    const coiInbox = document.getElementById('coiInbox');
    if (coiInbox) {
        // Save the current inbox HTML before expanding
        if (coiInbox.querySelector('.email-list')) {
            savedEmailListHTML = coiInbox.innerHTML;
            window.previousInboxContent = coiInbox.innerHTML;
            console.log('✅ Saved inbox state before expanding email');
        }
    }

    // Call the original expand function
    if (originalExpandEmail) {
        return originalExpandEmail.apply(this, arguments);
    }
};

// Fixed backToInbox function that restores saved content
window.backToInbox = function() {
    console.log('⬅️ Going back to inbox...');

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) {
        console.error('COI inbox element not found');
        return;
    }

    // Try multiple sources for saved content
    const savedContent = window.previousInboxContent || savedEmailListHTML;

    if (savedContent) {
        console.log('✅ Restoring saved inbox content');
        coiInbox.innerHTML = savedContent;

        // Re-attach hover effects to email items
        const emailItems = coiInbox.querySelectorAll('.email-item');
        emailItems.forEach(item => {
            // Remove any existing handlers
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);

            // Add hover effect
            newItem.addEventListener('mouseenter', () => {
                newItem.style.background = '#f9fafb';
            });
            newItem.addEventListener('mouseleave', () => {
                newItem.style.background = 'white';
            });

            // Re-attach click handler
            newItem.addEventListener('click', (e) => {
                if (!e.target.closest('.email-actions')) {
                    const emailId = newItem.getAttribute('data-email-id');
                    if (emailId) {
                        window.expandEmail(emailId);
                    }
                }
            });
        });

        console.log('✅ Inbox restored with event handlers');
    } else {
        console.log('⚠️ No saved content found, loading fresh emails');
        // Only reload if we really don't have saved content
        if (window.loadRealEmails) {
            window.loadRealEmails();
        } else if (window.loadRealCOIEmails) {
            window.loadRealCOIEmails();
        }
    }
};

// Monitor for email list changes and save them
setInterval(() => {
    const coiInbox = document.getElementById('coiInbox');
    if (coiInbox && coiInbox.querySelector('.email-list') && !coiInbox.querySelector('.email-detail-view')) {
        // We're showing the email list, save it
        const currentHTML = coiInbox.innerHTML;
        if (currentHTML !== savedEmailListHTML && !currentHTML.includes('Loading')) {
            savedEmailListHTML = currentHTML;
            console.log('📧 Auto-saved email list state');
        }
    }
}, 2000);

console.log('✅ COI Inbox Back Arrow Fix active');