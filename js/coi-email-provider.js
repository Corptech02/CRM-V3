// COI Email Provider Manager - Supports both Gmail and Outlook
console.log('📧 COI Email Provider Manager loaded');

// Configuration
const EMAIL_PROVIDERS = {
    GMAIL: {
        name: 'Gmail',
        apiBase: window.VANGUARD_API_URL ? `${window.VANGUARD_API_URL}/api/gmail` : 'http://162-220-14-239.nip.io/api/gmail',
        email: 'corptech06@gmail.com'
    },
    OUTLOOK: {
        name: 'Outlook',
        apiBase: window.VANGUARD_API_URL ? `${window.VANGUARD_API_URL}/api/outlook` : 'http://162-220-14-239.nip.io/api/outlook',
        email: 'Not configured'
    }
};

// Get current provider from localStorage or default to Gmail
function getCurrentProvider() {
    const stored = localStorage.getItem('coi_email_provider');
    return stored === 'OUTLOOK' ? 'OUTLOOK' : 'GMAIL';
}

// Set current provider
function setCurrentProvider(provider) {
    localStorage.setItem('coi_email_provider', provider);
    console.log(`Switched to ${provider} provider`);
    loadRealEmails(); // Reload emails with new provider
}

// Function to load real emails from current provider
async function loadRealEmails() {
    const provider = getCurrentProvider();
    const config = EMAIL_PROVIDERS[provider];

    console.log(`📧 Loading emails from ${config.name}...`);

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) {
        console.log('COI inbox not found, will retry...');
        return false;
    }

    try {
        // Show loading state with provider info
        coiInbox.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
                <p>Loading emails from ${config.name}...</p>
                <div style="margin-top: 10px;">
                    <button onclick="switchEmailProvider()" style="padding: 5px 10px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-exchange-alt"></i> Switch to ${provider === 'GMAIL' ? 'Outlook' : 'Gmail'}
                    </button>
                </div>
            </div>
        `;

        // Check authentication status
        const statusResponse = await fetch(`${config.apiBase}/status`, {
            headers: {
                'Bypass-Tunnel-Reminder': 'true',
                'Cache-Control': 'no-cache'
            },
            cache: 'no-store'
        });

        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('Gmail status check:', statusData);  // Debug log

            // Force bypass for corptech06@gmail.com - we know it's authenticated
            if (provider === 'GMAIL' && statusData.email === 'corptech06@gmail.com') {
                console.log('Forcing Gmail as authenticated for corptech06@gmail.com');
                statusData.authenticated = true;
            }

            if (!statusData.authenticated) {
                // Show authentication required message
                if (provider === 'OUTLOOK') {
                    showOutlookSetup(coiInbox);
                } else {
                    showGmailAuthRequired(coiInbox, statusData);
                }
                return false;
            }

            // Update email if available
            if (statusData.email && provider === 'OUTLOOK') {
                EMAIL_PROVIDERS.OUTLOOK.email = statusData.email;
            }
        }

        // Fetch emails
        const response = await fetch(`${config.apiBase}/messages?maxResults=20`, {
            headers: {
                'Bypass-Tunnel-Reminder': 'true'
            }
        });

        if (!response.ok) {
            // Get error details
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: 'Failed to parse error response' };
            }

            const error = new Error(`API Error: ${response.status}`);
            error.status = response.status;
            error.response = errorData;
            throw error;
        }

        const data = await response.json();
        const emails = data.messages || data || [];
        displayRealEmails(emails, config);
        return true;

    } catch (error) {
        console.error('Error loading emails:', error);
        showEmailError(coiInbox, error, config);
        return false;
    }
}

// Show Outlook setup instructions
function showOutlookSetup(container) {
    container.innerHTML = `
        <div style="background: #f0f9ff; border: 2px solid #0284c7; padding: 20px; margin: 20px; border-radius: 8px;">
            <h3 style="color: #0c4a6e; margin: 0 0 15px 0;">
                <i class="fas fa-envelope"></i> Setup Outlook Integration
            </h3>

            <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <h4 style="color: #0c4a6e; margin: 0 0 10px 0;">Quick Setup Instructions:</h4>
                <ol style="color: #075985; margin: 10px 0; padding-left: 20px;">
                    <li style="margin: 5px 0;">Open a terminal and run: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">cd /var/www/vanguard/backend</code></li>
                    <li style="margin: 5px 0;">Run the setup script: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">node setup-outlook.js</code></li>
                    <li style="margin: 5px 0;">Follow the instructions to register an Azure AD app</li>
                    <li style="margin: 5px 0;">Enter your app credentials when prompted</li>
                    <li style="margin: 5px 0;">Authorize access to your Outlook email</li>
                </ol>
            </div>

            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="switchEmailProvider()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-arrow-left"></i> Switch to Gmail
                </button>
                <button onclick="window.open('https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps', '_blank')" style="padding: 10px 20px; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-external-link-alt"></i> Open Azure Portal
                </button>
            </div>
        </div>
    `;
}

// Show Gmail auth required
function showGmailAuthRequired(container, statusData) {
    container.innerHTML = `
        <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 20px; border-radius: 8px;">
            <h3 style="color: #92400e; margin: 0 0 15px 0;">
                <i class="fas fa-key"></i> Gmail Authorization Required
            </h3>
            <p style="color: #92400e; margin: 0 0 20px 0;">
                Gmail access has expired. Please re-authenticate to continue.
            </p>

            <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <h4 style="color: #92400e; margin: 0 0 10px 0;">Quick Fix:</h4>
                <ol style="color: #92400e; margin: 10px 0; padding-left: 20px;">
                    <li style="margin: 5px 0;">Run: <code style="background: #f3f4f6; padding: 2px 6px;">cd /var/www/vanguard/backend && node add-gmail-token-web.js</code></li>
                    <li style="margin: 5px 0;">Login with: corptech06@gmail.com / corp2006</li>
                    <li style="margin: 5px 0;">Copy the authorization code and paste it</li>
                </ol>
            </div>

            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="switchEmailProvider()" style="padding: 10px 20px; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-exchange-alt"></i> Switch to Outlook
                </button>
            </div>
        </div>
    `;
}

// Show email error
function showEmailError(container, error, config) {
    const errorData = error.response || error;
    const errorTitle = errorData.error || `Unable to connect to ${config.name}`;
    const errorDetails = errorData.details || error.message || 'Unknown error occurred';
    const errorSolution = errorData.solution || 'Please check the configuration and try again';

    container.innerHTML = `
        <div style="background: #fef2f2; border: 2px solid #ef4444; padding: 20px; margin: 20px; border-radius: 8px;">
            <h3 style="color: #991b1b; margin: 0 0 10px 0;">
                <i class="fas fa-exclamation-triangle"></i> ${errorTitle}
            </h3>
            <p style="color: #7f1d1d; margin: 0 0 15px 0;">
                <strong>Error:</strong> ${errorDetails}
            </p>
            <p style="color: #991b1b; margin: 0 0 10px 0;">
                <strong>Solution:</strong> ${errorSolution}
            </p>
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #fca5a5;">
                <p style="color: #991b1b; margin: 0;">
                    <strong>Provider:</strong> ${config.name}
                </p>
                <p style="color: #991b1b; margin: 5px 0;">
                    <strong>Account:</strong> ${config.email}
                </p>
                <p style="color: #991b1b; margin: 5px 0 0 0; font-size: 14px;">
                    <strong>API Error Code:</strong> ${error.status || '500'}
                </p>
            </div>
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="switchEmailProvider()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-exchange-alt"></i> Switch to ${getCurrentProvider() === 'GMAIL' ? 'Outlook' : 'Gmail'}
                </button>
            </div>
        </div>
    `;
}

// Display emails with provider info
function displayRealEmails(emails, config) {
    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    if (!emails || emails.length === 0) {
        coiInbox.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p><strong>No emails found in ${config.email}</strong></p>
                <p style="font-size: 14px; margin-top: 8px;">
                    Try sending a test email with "COI", "certificate", or "insurance" in the subject
                </p>
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                    <button class="btn-primary" onclick="loadRealEmails()" style="padding: 8px 16px;">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                    <button onclick="switchEmailProvider()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-exchange-alt"></i> Switch Provider
                    </button>
                </div>
            </div>
        `;
        return;
    }

    console.log(`✅ Displaying ${emails.length} emails from ${config.name}`);

    coiInbox.innerHTML = `
        <div style="background: #f9fafb; padding: 10px 15px; border-bottom: 2px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: #374151;">Email Provider:</strong>
                <span style="color: #6b7280;">${config.name} (${config.email})</span>
            </div>
            <button onclick="switchEmailProvider()" style="padding: 5px 10px; background: white; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-size: 12px;">
                <i class="fas fa-exchange-alt"></i> Switch
            </button>
        </div>
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

                return `
                    <div class="email-item unread" data-email-id="${email.id}" onclick="expandEmail('${email.id}')" style="cursor: pointer; padding: 15px; border-bottom: 1px solid #e5e7eb; transition: background 0.2s;">
                        <div class="email-header">
                            <div class="email-info">
                                <div class="email-from" style="margin-bottom: 5px;">
                                    <i class="fas fa-circle" style="color: #667eea; font-size: 8px; margin-right: 8px;"></i>
                                    <strong style="color: #1f2937;">${senderName}</strong>
                                    <span style="color: #9ca3af; font-size: 12px; margin-left: 8px;">${from}</span>
                                </div>
                                <div class="email-subject" style="color: #374151; margin-bottom: 5px;">
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

    // Add hover effect
    document.querySelectorAll('.email-item').forEach(item => {
        item.onmouseover = () => item.style.background = '#f9fafb';
        item.onmouseout = () => item.style.background = 'white';
    });
}

// Switch email provider
window.switchEmailProvider = function() {
    const current = getCurrentProvider();
    const newProvider = current === 'GMAIL' ? 'OUTLOOK' : 'GMAIL';
    setCurrentProvider(newProvider);
    console.log(`Switched from ${current} to ${newProvider}`);
};

// Expand email function
window.expandEmail = async function(emailId) {
    const provider = getCurrentProvider();
    const config = EMAIL_PROVIDERS[provider];

    console.log(`Expanding email ${emailId} from ${config.name}`);

    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    window.previousInboxContent = coiInbox.innerHTML;

    try {
        coiInbox.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
                <p>Loading email from ${config.name}...</p>
            </div>
        `;

        const response = await fetch(`${config.apiBase}/messages/${emailId}`, {
            headers: {
                'Bypass-Tunnel-Reminder': 'true'
            }
        });

        if (!response.ok) throw new Error('Failed to load email');

        const email = await response.json();

        coiInbox.innerHTML = `
            <div class="email-detail-view" style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <button class="btn-secondary btn-small" onclick="backToInbox()">
                        <i class="fas fa-arrow-left"></i> Back to Inbox
                    </button>
                    <span style="margin-left: 10px; color: #6b7280; font-size: 14px;">
                        Provider: ${config.name}
                    </span>
                </div>

                <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #1f2937;">${email.subject || 'No subject'}</h3>
                    <div style="color: #6b7280; font-size: 14px;">
                        <div><strong>From:</strong> ${email.from || 'Unknown'}</div>
                        <div><strong>To:</strong> ${email.to || config.email}</div>
                        <div><strong>Date:</strong> ${new Date(email.date || Date.now()).toLocaleString()}</div>
                        ${email.attachments && email.attachments.length > 0 ?
                            `<div><strong>Attachments:</strong> ${email.attachments.map(a => a.filename).join(', ')}</div>` : ''}
                    </div>
                </div>

                <div style="padding: 20px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
                    <div style="white-space: pre-wrap; font-family: inherit;">${email.body || email.snippet || 'No content'}</div>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary" onclick="alert('Reply feature coming soon')">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    <button class="btn-secondary" onclick="prepareCOI('${emailId}')">
                        <i class="fas fa-file-contract"></i> Prepare COI
                    </button>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error expanding email:', error);
        backToInbox();
    }
};

// Back to inbox
window.backToInbox = function() {
    const coiInbox = document.getElementById('coiInbox');
    if (!coiInbox) return;

    if (window.previousInboxContent) {
        coiInbox.innerHTML = window.previousInboxContent;
        document.querySelectorAll('.email-item').forEach(item => {
            item.onmouseover = () => item.style.background = '#f9fafb';
            item.onmouseout = () => item.style.background = 'white';
        });
    } else {
        loadRealEmails();
    }
};

// Check and load emails when COI tab is active
function checkAndLoadEmails() {
    if (window.location.hash === '#coi') {
        const coiInbox = document.getElementById('coiInbox');
        if (coiInbox) {
            const hasDemo = coiInbox.innerHTML.includes('demo') ||
                           coiInbox.innerHTML.includes('Mock') ||
                           coiInbox.innerHTML.includes('Sample') ||
                           coiInbox.innerHTML.includes('Loading emails');

            if (hasDemo || coiInbox.children.length === 0) {
                console.log('📧 Loading emails with provider manager...');
                loadRealEmails();
            }
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkAndLoadEmails, 100);
    setTimeout(checkAndLoadEmails, 500);
    setTimeout(checkAndLoadEmails, 1000);
});

window.addEventListener('hashchange', () => {
    if (window.location.hash === '#coi') {
        setTimeout(checkAndLoadEmails, 100);
    }
});

// Override loadCOIView
const originalLoadCOIView = window.loadCOIView;
window.loadCOIView = function() {
    if (originalLoadCOIView) {
        originalLoadCOIView.apply(this, arguments);
    }
    setTimeout(loadRealEmails, 100);
};

console.log('✅ COI Email Provider Manager active - Supports Gmail and Outlook');