// COI Button Intercept - Directly fixes the back button
console.log('🎯 COI Button Intercept loading...');

// Intercept all button clicks
document.addEventListener('click', function(e) {
    // Check if it's the back button
    if (e.target.closest('button') &&
        (e.target.textContent.includes('Back') ||
         e.target.querySelector('.fa-arrow-left') ||
         e.target.closest('button').querySelector('.fa-arrow-left'))) {

        const button = e.target.closest('button');

        // Check if this is the back to inbox button
        if (button.onclick && button.onclick.toString().includes('backToInbox')) {
            console.log('🎯 Intercepted back button click');
            e.preventDefault();
            e.stopPropagation();

            const coiInbox = document.getElementById('coiInbox');
            if (!coiInbox) return;

            // Check for saved content
            const saved = window.savedInboxHTML || window.previousInboxContent;

            if (saved && saved.includes('email-list')) {
                console.log('✅ Restoring inbox from saved content');
                coiInbox.innerHTML = saved;

                // Re-enable email clicks
                setTimeout(() => {
                    document.querySelectorAll('.email-item').forEach(item => {
                        item.style.cursor = 'pointer';
                        const emailId = item.getAttribute('data-email-id');
                        if (emailId) {
                            item.onclick = () => window.expandEmail(emailId);
                        }
                    });
                }, 100);
            } else {
                console.log('⚠️ No saved content, showing refresh option');
                coiInbox.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-inbox" style="font-size: 48px; color: #667eea; margin-bottom: 20px;"></i>
                        <p style="margin-bottom: 20px;">Click below to reload emails</p>
                        <button class="btn-primary" onclick="location.hash='#coi'; location.reload()">
                            <i class="fas fa-refresh"></i> Reload Emails
                        </button>
                    </div>
                `;
            }

            return false;
        }
    }
}, true); // Use capture phase to intercept before other handlers

console.log('✅ COI Button Intercept active');