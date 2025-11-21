// FINAL FIX - Fix API URL and add status buttons to actual email structure
console.log('🔥 FINAL FIX - Fixing API and adding status buttons to actual emails');

// FIRST: Fix the API URL immediately
window.VANGUARD_API_URL = "http://162-220-14-239.nip.io";
window.EMAIL_PROVIDERS = {
    GMAIL: {
        name: 'Gmail',
        apiBase: 'http://162-220-14-239.nip.io/api/gmail',
        email: 'corptech06@gmail.com'
    },
    OUTLOOK: {
        name: 'Outlook',
        apiBase: 'http://162-220-14-239.nip.io/api/outlook',
        email: 'Not configured'
    }
};

// Override expandEmail to use correct URL
if (window.expandEmail) {
    const originalExpandEmail = window.expandEmail;
    window.expandEmail = async function(emailId) {
        console.log('🔧 Fixed expandEmail using correct URL for:', emailId);

        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) return;

        window.previousInboxContent = coiInbox.innerHTML;

        coiInbox.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
                <p>Loading email...</p>
            </div>
        `;

        try {
            // ALWAYS use correct URL
            const response = await fetch(`http://162-220-14-239.nip.io/api/gmail/messages/${emailId}`, {
                headers: {
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });

            if (!response.ok) throw new Error('Failed to load email');

            const email = await response.json();
            window.currentEmailData = email;

            // Display email content
            const formatDate = (dateStr) => {
                const date = new Date(dateStr);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            };

            coiInbox.innerHTML = `
                <div class="email-detail-view" style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <button class="btn-secondary btn-small" onclick="backToInbox()"
                                style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-arrow-left"></i> Back to Inbox
                        </button>
                    </div>

                    <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <h2 style="margin: 0 0 20px 0; color: #111827;">${email.subject || 'No Subject'}</h2>

                        <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <div><strong>From:</strong> ${email.from || 'Unknown'}</div>
                                <div style="color: #6b7280; font-size: 14px;">${formatDate(email.date)}</div>
                            </div>
                            <div><strong>To:</strong> ${email.to || 'Unknown'}</div>
                        </div>

                        <div style="padding: 20px; background: #f9fafb; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word;">
                            ${email.body || email.snippet || 'No content'}
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error:', error);
            coiInbox.innerHTML = `
                <div style="padding: 20px;">
                    <button onclick="backToInbox()" style="margin-bottom: 20px; padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px;">
                        <i class="fas fa-arrow-left"></i> Back to Inbox
                    </button>
                    <div style="text-align: center; color: #ef4444;">
                        <p>Error loading email: ${error.message}</p>
                    </div>
                </div>
            `;
        }
    };
}

// Function to add status buttons to emails with blue dots
function addStatusButtonsToEmails() {
    console.log('💉 Adding status buttons to emails with blue dots...');

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    // Multiple strategies to find emails
    // 1. Look for blue dots with any color format
    let blueDots = coiInbox.querySelectorAll('.fas.fa-circle, .far.fa-circle, i.fa-circle');
    console.log(`Found ${blueDots.length} potential dot elements`);

    // Filter for blue-ish colors
    blueDots = Array.from(blueDots).filter(dot => {
        const style = window.getComputedStyle(dot);
        const color = style.color;
        // Check if it's blue-ish (includes #667eea, rgb variants, etc)
        return color.includes('102') || color.includes('126') || color.includes('234') ||
               color.includes('667eea') || color.includes('primary') || color.includes('blue') ||
               style.fontSize === '8px'; // The user mentioned 8px dots
    });

    // 2. Also look for any clickable email items
    const clickableEmails = coiInbox.querySelectorAll('[onclick*="Email"], [onclick*="expand"], .email-item, div[style*="cursor: pointer"][style*="padding"]');
    console.log(`Found ${blueDots.length} blue dots and ${clickableEmails.length} clickable elements`);

    // Process blue dots first
    blueDots.forEach((dot, index) => {
        // Find the parent email container - go up more levels if needed
        let emailContainer = dot.parentElement;
        let maxLevels = 5;
        while (emailContainer && maxLevels > 0 && emailContainer !== coiInbox) {
            if (emailContainer.getAttribute('onclick') ||
                emailContainer.style.cursor === 'pointer' ||
                emailContainer.classList.contains('email-item')) {
                break;
            }
            emailContainer = emailContainer.parentElement;
            maxLevels--;
        }

        if (!emailContainer) {
            // Try going up the tree
            let parent = dot.parentElement;
            while (parent && parent !== coiInbox) {
                if (parent.getAttribute('onclick') && parent.getAttribute('onclick').includes('expandEmail')) {
                    emailContainer = parent;
                    break;
                }
                parent = parent.parentElement;
            }
        }

        if (emailContainer && emailContainer !== coiInbox && !emailContainer.querySelector('.status-buttons-final')) {
            console.log(`Adding buttons to email ${index + 1}:`, emailContainer);

            // Extract email ID
            const onclick = emailContainer.getAttribute('onclick') || '';
            const match = onclick.match(/(?:expand|view)Email[^'"]*\(['"]([^'"]+)['"]\)/);
            const emailId = match ? match[1] : `email_${index}_${Date.now()}`;

            // Make container relative for positioning
            emailContainer.style.position = 'relative';
            emailContainer.style.minHeight = '60px'; // Ensure minimum height

            // Get stored status
            const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');
            const status = statuses[emailId];

            // Apply status styling
            if (status === 'handled') {
                emailContainer.style.background = 'linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%)';
                emailContainer.style.borderLeft = '4px solid #10b981';
            } else if (status === 'unimportant') {
                emailContainer.style.background = 'linear-gradient(to right, #fee2e2 0%, #fef2f2 100%)';
                emailContainer.style.borderLeft = '4px solid #ef4444';
                emailContainer.style.opacity = '0.7';
            }

            // Create status buttons container with enhanced visibility
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'status-buttons-final';
            buttonsDiv.style.cssText = `
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                gap: 8px;
                z-index: 9999;
                background: white;
                padding: 4px;
                border-radius: 6px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            `;

            // Use helper functions to create buttons
            const handledBtn = createHandledButton(emailId, emailContainer, status);
            const unimportantBtn = createUnimportantButton(emailId, emailContainer, status);

            buttonsDiv.appendChild(handledBtn);
            buttonsDiv.appendChild(unimportantBtn);
            emailContainer.appendChild(buttonsDiv);
        }

    });

    // Process any remaining clickable emails that weren't caught by blue dots
    clickableEmails.forEach((emailContainer, index) => {
        if (!emailContainer.querySelector('.status-buttons-final')) {
            console.log(`Adding buttons to clickable email ${index + 1}`);

            const onclick = emailContainer.getAttribute('onclick') || '';
            const match = onclick.match(/(?:expand|view)Email[^'"]*\(['"]([^'"]+)['"]\)/);
            const emailId = match ? match[1] : `clickable_${index}_${Date.now()}`;

            emailContainer.style.position = 'relative';
            emailContainer.style.minHeight = '60px';

            const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');
            const status = statuses[emailId];

            if (status === 'handled') {
                emailContainer.style.background = 'linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%)';
                emailContainer.style.borderLeft = '4px solid #10b981';
            } else if (status === 'unimportant') {
                emailContainer.style.background = 'linear-gradient(to right, #fee2e2 0%, #fef2f2 100%)';
                emailContainer.style.borderLeft = '4px solid #ef4444';
                emailContainer.style.opacity = '0.7';
            }

            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'status-buttons-final';
            buttonsDiv.style.cssText = `
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                gap: 8px;
                z-index: 9999;
                background: white;
                padding: 4px;
                border-radius: 6px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            `;

            const handledBtn = createHandledButton(emailId, emailContainer, statuses[emailId]);
            const unimportantBtn = createUnimportantButton(emailId, emailContainer, statuses[emailId]);

            buttonsDiv.appendChild(handledBtn);
            buttonsDiv.appendChild(unimportantBtn);
            emailContainer.appendChild(buttonsDiv);
        }
    });

    const totalButtonsAdded = document.querySelectorAll('.status-buttons-final').length;
    console.log(`✅ Status buttons added to ${totalButtonsAdded} emails`);
}

// Helper function to create handled button
function createHandledButton(emailId, emailContainer, currentStatus) {
    const handledBtn = document.createElement('button');
    handledBtn.innerHTML = currentStatus === 'handled' ?
        '<i class="fas fa-check-circle" style="font-size: 22px; color: #10b981;"></i>' :
        '<i class="far fa-check-circle" style="font-size: 22px; color: #9ca3af;"></i>';
    handledBtn.style.cssText = `
        background: white;
        border: 2px solid ${currentStatus === 'handled' ? '#10b981' : '#e5e7eb'};
        border-radius: 50%;
        width: 36px;
        height: 36px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: all 0.2s;
    `;
    handledBtn.onclick = function(e) {
        e.stopPropagation();
        e.preventDefault();

        const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');

        if (statuses[emailId] === 'handled') {
            delete statuses[emailId];
            this.innerHTML = '<i class="far fa-check-circle" style="font-size: 22px; color: #9ca3af;"></i>';
            this.style.borderColor = '#e5e7eb';
            emailContainer.style.background = '';
            emailContainer.style.borderLeft = '';
        } else {
            statuses[emailId] = 'handled';
            this.innerHTML = '<i class="fas fa-check-circle" style="font-size: 22px; color: #10b981;"></i>';
            this.style.borderColor = '#10b981';
            emailContainer.style.background = 'linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%)';
            emailContainer.style.borderLeft = '4px solid #10b981';
            emailContainer.style.opacity = '1';

            // Reset unimportant button
            const xBtn = emailContainer.querySelector('.unimportant-btn');
            if (xBtn) {
                xBtn.innerHTML = '<i class="far fa-times-circle" style="font-size: 22px; color: #9ca3af;"></i>';
                xBtn.style.borderColor = '#e5e7eb';
            }
        }

        localStorage.setItem('coi_email_status', JSON.stringify(statuses));
        return false;
    };
    return handledBtn;
}

// Helper function to create unimportant button
function createUnimportantButton(emailId, emailContainer, currentStatus) {
    const unimportantBtn = document.createElement('button');
    unimportantBtn.className = 'unimportant-btn';
    unimportantBtn.innerHTML = currentStatus === 'unimportant' ?
        '<i class="fas fa-times-circle" style="font-size: 22px; color: #ef4444;"></i>' :
        '<i class="far fa-times-circle" style="font-size: 22px; color: #9ca3af;"></i>';
    unimportantBtn.style.cssText = `
        background: white;
        border: 2px solid ${currentStatus === 'unimportant' ? '#ef4444' : '#e5e7eb'};
        border-radius: 50%;
        width: 36px;
        height: 36px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: all 0.2s;
    `;
    unimportantBtn.onclick = function(e) {
        e.stopPropagation();
        e.preventDefault();

        const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');

        if (statuses[emailId] === 'unimportant') {
            delete statuses[emailId];
            this.innerHTML = '<i class="far fa-times-circle" style="font-size: 22px; color: #9ca3af;"></i>';
            this.style.borderColor = '#e5e7eb';
            emailContainer.style.background = '';
            emailContainer.style.borderLeft = '';
            emailContainer.style.opacity = '1';
        } else {
            statuses[emailId] = 'unimportant';
            this.innerHTML = '<i class="fas fa-times-circle" style="font-size: 22px; color: #ef4444;"></i>';
            this.style.borderColor = '#ef4444';
            emailContainer.style.background = 'linear-gradient(to right, #fee2e2 0%, #fef2f2 100%)';
            emailContainer.style.borderLeft = '4px solid #ef4444';
            emailContainer.style.opacity = '0.7';

            // Reset handled button
            const checkBtn = emailContainer.querySelector('button:not(.unimportant-btn)');
            if (checkBtn) {
                checkBtn.innerHTML = '<i class="far fa-check-circle" style="font-size: 22px; color: #9ca3af;"></i>';
                checkBtn.style.borderColor = '#e5e7eb';
            }
        }

        localStorage.setItem('coi_email_status', JSON.stringify(statuses));
        return false;
    };
    return unimportantBtn;
}

// Monitor for emails being loaded
const observer = new MutationObserver(() => {
    // Look for blue dots that indicate emails
    if (document.querySelector('.fas.fa-circle[style*="667eea"]')) {
        setTimeout(addStatusButtonsToEmails, 300);
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Try to add buttons immediately if emails are already loaded
setTimeout(addStatusButtonsToEmails, 1000);
setTimeout(addStatusButtonsToEmails, 2000);
setTimeout(addStatusButtonsToEmails, 3000);

// Add buttons when navigating to COI
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#coi') {
        setTimeout(addStatusButtonsToEmails, 1000);
    }
});

// Manual function to force add buttons
window.forceStatusButtons = function() {
    addStatusButtonsToEmails();
    console.log('Forced status buttons to be added');
};

console.log('✅ FINAL FIX loaded:');
console.log('   - API URL fixed to: http://162-220-14-239.nip.io');
console.log('   - Status buttons will be added to emails with blue dots');
console.log('   - Run forceStatusButtons() to manually add buttons');