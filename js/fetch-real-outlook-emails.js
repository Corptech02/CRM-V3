// FETCH REAL OUTLOOK EMAILS - Override all mock data
console.log('🔄 Fetching REAL emails from Outlook...');

(function() {
    'use strict';

    let authCode = null;

    // Extract auth code if we're on a callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code')) {
        authCode = urlParams.get('code');
        console.log('📨 Authorization code received!');

        // Store in localStorage
        localStorage.setItem('outlook_auth_code', authCode);

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        // Try to get from storage
        authCode = localStorage.getItem('outlook_auth_code');
    }

    // Function to fetch real emails
    async function fetchRealOutlookEmails() {
        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) return;

        try {
            // Show loading
            coiInbox.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #0078d4; margin-bottom: 16px;"></i>
                    <p style="color: #6b7280;">Fetching real emails from contact@vigagency.com...</p>
                </div>
            `;

            // Build request URL
            let apiUrl = '/api/outlook/real-emails';
            if (authCode) {
                apiUrl += '?code=' + authCode;
            }

            // Add client secret if available
            const clientSecret = localStorage.getItem('outlook_client_secret');
            if (clientSecret) {
                apiUrl += (authCode ? '&' : '?') + 'secret=' + clientSecret;
            }

            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.success && data.emails) {
                // Display real emails
                displayRealEmails(data.emails);
            } else if (data.authRequired) {
                // Need authorization
                displayAuthRequired(data.authUrl);
            } else {
                // Still show mock data as fallback
                displayMockEmails();
            }

        } catch (error) {
            console.error('Error fetching real emails:', error);
            displayMockEmails(); // Fallback to mock
        }
    }

    function displayRealEmails(emails) {
        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) return;

        let html = `
            <div style="background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%); padding: 25px; border-radius: 12px; color: white; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <i class="fab fa-microsoft" style="font-size: 40px;"></i>
                    <div>
                        <h3 style="margin: 0; font-size: 20px;">📧 Real Emails - contact@vigagency.com</h3>
                        <p style="margin: 4px 0 0 0; opacity: 0.9;">Connected via Microsoft Graph API</p>
                    </div>
                </div>
            </div>
            <div class="email-list">
        `;

        if (emails.length === 0) {
            html += `
                <div style="text-align: center; padding: 40px; background: white; border-radius: 8px;">
                    <i class="fas fa-inbox" style="font-size: 48px; color: #d1d5db; margin-bottom: 16px;"></i>
                    <p style="color: #6b7280;">No emails in your inbox</p>
                </div>
            `;
        } else {
            emails.forEach(email => {
                const date = new Date(email.date);
                const timeAgo = getTimeAgo(date);
                const isUnread = !email.isRead;

                html += `
                    <div class="email-item ${isUnread ? 'unread' : ''}"
                         onclick="expandEmail('${email.id}')"
                         style="background: white; padding: 20px; border-left: 4px solid ${isUnread ? '#0078d4' : '#e5e7eb'}; margin-bottom: 12px; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between;">
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 8px 0; color: ${isUnread ? '#1f2937' : '#6b7280'}; font-weight: ${isUnread ? '600' : '500'};">
                                    ${email.subject || '(No subject)'}
                                </h4>
                                <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
                                    From: ${email.from}
                                </p>
                                <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                                    ${email.snippet || ''}
                                </p>
                            </div>
                            <div style="text-align: right; min-width: 100px;">
                                <span style="color: #6b7280; font-size: 12px;">${timeAgo}</span>
                                ${isUnread ? `
                                    <div style="margin-top: 8px;">
                                        <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                                            NEW
                                        </span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        html += '</div>';
        coiInbox.innerHTML = html;
    }

    function displayAuthRequired(authUrl) {
        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) return;

        coiInbox.innerHTML = `
            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 30px; border-radius: 12px; text-align: center;">
                <i class="fas fa-key" style="font-size: 48px; color: #f59e0b; margin-bottom: 16px;"></i>
                <h3 style="color: #92400e; margin: 0 0 16px 0;">Authorization Required</h3>
                <p style="color: #78350f; margin: 0 0 20px 0;">
                    To fetch real emails, please authorize access to your Outlook account.
                </p>
                <button onclick="window.location.href='${authUrl}'"
                        style="background: #f59e0b; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-unlock"></i> Authorize Outlook Access
                </button>
                <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">
                    You'll be redirected to Microsoft to sign in
                </p>
            </div>
        `;
    }

    function displayMockEmails() {
        // Fallback to mock data
        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) return;

        coiInbox.innerHTML = `
            <div style="background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%); padding: 25px; border-radius: 12px; color: white; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <i class="fab fa-microsoft" style="font-size: 40px;"></i>
                    <div>
                        <h3 style="margin: 0; font-size: 20px;">Outlook - contact@vigagency.com</h3>
                        <p style="margin: 4px 0 0 0; opacity: 0.9;">Waiting for authorization...</p>
                    </div>
                </div>
            </div>
            <div style="text-align: center; padding: 40px; background: #f9fafb; border-radius: 8px;">
                <p style="color: #6b7280;">Mock data shown - authorize to see real emails</p>
            </div>
        `;
    }

    function getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    }

    // Override loadEmails
    window.loadEmails = fetchRealOutlookEmails;

    // Auto-load when COI view is opened
    const originalLoadCOIView = window.loadCOIView;
    window.loadCOIView = function() {
        if (originalLoadCOIView) originalLoadCOIView();
        setTimeout(fetchRealOutlookEmails, 100);
    };

    // Replace any mock content
    setInterval(() => {
        const coiInbox = document.getElementById('coiInbox');
        if (coiInbox && coiInbox.innerHTML.includes('Progressive Insurance')) {
            fetchRealOutlookEmails();
        }
    }, 1000);

    console.log('✅ Real Outlook email fetcher active');
})();