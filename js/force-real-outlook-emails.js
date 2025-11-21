// FORCE REAL OUTLOOK EMAILS - NO MOCK DATA ALLOWED
console.log('🚫 DISABLING ALL MOCK DATA - FORCING REAL EMAILS ONLY');

(function() {
    'use strict';

    // CLEAR ALL MOCK DATA FROM LOCALSTORAGE
    localStorage.removeItem('outlook_real_emails');
    localStorage.removeItem('coi_emails');
    localStorage.removeItem('mock_emails');
    console.log('🗑️ Cleared all localStorage email data');

    // Override the loadCOIInbox function completely
    window.loadCOIInbox = async function() {
        console.log('🔥 LOADING REAL OUTLOOK EMAILS - NO MOCK DATA');

        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) {
            console.error('❌ COI inbox element not found');
            return;
        }

        // Show loading state
        coiInbox.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #6c757d;"></i>
                <p style="margin-top: 10px; color: #6c757d;">Fetching REAL emails from Outlook...</p>
            </div>
        `;

        try {
            console.log('📧 Fetching from Titan Email via /api/outlook/emails...');

            // Force a fresh fetch - no cache
            const response = await fetch('/api/outlook/emails?_=' + Date.now(), {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            const data = await response.json();

            console.log('📬 Outlook API Response:', data);

            // Check if authentication failed
            if (!response.ok || data.error || data.success === false) {
                console.error('❌ OUTLOOK AUTH ERROR:', data.error);

                // Show the ACTUAL error
                coiInbox.innerHTML = `
                    <div style="padding: 20px; background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; margin: 10px;">
                        <h3 style="color: #dc2626; margin: 0 0 15px 0;">
                            <i class="fas fa-exclamation-triangle"></i> OUTLOOK CONNECTION FAILED
                        </h3>
                        <p style="color: #991b1b; margin: 0 0 10px 0; font-weight: bold;">
                            Error: ${data.error || 'Authentication failed'}
                        </p>
                        <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                            ${data.help ? `<pre style="margin: 0; color: #374151; white-space: pre-wrap; font-family: monospace; font-size: 13px;">${data.help}</pre>` : `
                            <p style="margin: 0 0 10px 0; color: #374151;">
                                You need an app password for Outlook IMAP access.
                            </p>
                            <strong>To fix this:</strong>
                            <ol style="margin: 10px 0 0 20px; color: #4b5563;">
                                <li>Go to: <a href="https://account.live.com/proofs/AppPassword" target="_blank">https://account.live.com/proofs/AppPassword</a></li>
                                <li>Sign in with grant@vigagency.com</li>
                                <li>Create app password named "Vanguard COI"</li>
                                <li>Update password in server .env file</li>
                                <li>Restart: pm2 restart vanguard-backend</li>
                            </ol>`}
                        </div>
                        <button onclick="window.loadCOIInbox()" class="btn-primary" style="background: #dc2626; margin-top: 10px;">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </div>
                `;
                return;
            }

            // Get the emails array
            const emails = data.emails || data || [];

            console.log(`✅ Got ${emails.length} real emails`);

            if (!Array.isArray(emails)) {
                throw new Error('Invalid response format - expected array of emails');
            }

            if (emails.length === 0) {
                coiInbox.innerHTML = `
                    <div style="padding: 40px; text-align: center; background: #f9fafb; border-radius: 8px;">
                        <h2 style="color: #10b981; margin: 0 0 20px 0;">✅ TITAN EMAIL CONNECTED</h2>
                        <i class="fas fa-inbox" style="font-size: 48px; color: #d1d5db; margin-bottom: 20px;"></i>
                        <h3 style="color: #6b7280; margin: 0 0 10px 0;">No COI Emails Found</h3>
                        <p style="color: #9ca3af;">Your Titan inbox has no COI-related emails</p>
                        <p style="color: #10b981; font-weight: bold; margin-top: 20px;">
                            📧 Connected to: contact@vigagency.com (TITAN)
                        </p>
                        <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
                            This is REAL - NO MOCK DATA
                        </p>
                        <button onclick="window.loadCOIInbox()" class="btn-secondary" style="margin-top: 20px;">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>
                `;
                return;
            }

            // Display REAL emails
            let emailHTML = '<div class="email-list">';

            emails.forEach((email, index) => {
                const emailDate = new Date(email.date || email.receivedDateTime);
                const dateStr = emailDate.toLocaleDateString() + ' ' + emailDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                emailHTML += `
                    <div class="email-item ${email.isRead === false ? 'unread' : ''}"
                         style="padding: 15px; border-bottom: 1px solid #e5e7eb; cursor: pointer; ${email.isRead === false ? 'background: #f0f9ff;' : ''}"
                         onclick="viewRealEmail('${email.id || email.messageId || index}')">
                        <div style="display: flex; justify-content: space-between;">
                            <div style="flex: 1;">
                                <div style="font-weight: ${email.isRead === false ? 'bold' : 'normal'}; color: #111827; margin-bottom: 5px;">
                                    ${email.isRead === false ? '<i class="fas fa-circle" style="color: #3b82f6; font-size: 8px; margin-right: 8px;"></i>' : ''}
                                    ${email.fromName || email.from || 'Unknown'}
                                </div>
                                <div style="color: #374151; font-size: 14px; margin-bottom: 5px;">
                                    ${email.subject || 'No Subject'}
                                </div>
                                <div style="color: #6b7280; font-size: 13px;">
                                    ${email.preview || email.bodyPreview || ''}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 12px; color: #6b7280;">
                                    ${dateStr}
                                </div>
                                ${email.hasAttachments ? '<i class="fas fa-paperclip" style="color: #6b7280; margin-top: 5px;"></i>' : ''}
                            </div>
                        </div>
                    </div>
                `;
            });

            emailHTML += '</div>';

            emailHTML += `
                <div style="padding: 10px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <small style="color: #6b7280;">
                        📧 Real emails from: grant@vigagency.com |
                        ${emails.length} COI-related emails |
                        <a href="#" onclick="window.loadCOIInbox(); return false;">Refresh</a>
                    </small>
                </div>
            `;

            coiInbox.innerHTML = emailHTML;

        } catch (error) {
            console.error('❌ CRITICAL ERROR:', error);

            coiInbox.innerHTML = `
                <div style="padding: 20px; background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; margin: 10px;">
                    <h3 style="color: #dc2626; margin: 0 0 15px 0;">
                        <i class="fas fa-times-circle"></i> ERROR LOADING EMAILS
                    </h3>
                    <p style="color: #991b1b; margin: 0 0 10px 0;">
                        ${error.message}
                    </p>
                    <pre style="background: white; padding: 10px; border-radius: 5px; overflow: auto; color: #374151;">
${error.stack}
                    </pre>
                    <button onclick="window.loadCOIInbox()" class="btn-primary" style="background: #dc2626; margin-top: 10px;">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    };

    // Function to view real email details
    window.viewRealEmail = function(emailId) {
        console.log('📧 Viewing real email:', emailId);
        alert(`Viewing real email ID: ${emailId}\n\nFull email viewer not yet implemented.\nThis is a REAL email from your Outlook inbox.`);
    };

    // Kill any other functions that might load mock data
    if (window.originalLoadCOIInbox) {
        console.log('🚫 Killed originalLoadCOIInbox');
        delete window.originalLoadCOIInbox;
    }

    // Kill display-real-outlook-emails functions
    if (window.loadRealOutlookEmails) {
        console.log('🚫 Killed loadRealOutlookEmails');
        delete window.loadRealOutlookEmails;
    }

    // Override any other email loading functions
    window.displayRealEmails = function() {
        console.log('🚫 Blocked displayRealEmails - using loadCOIInbox instead');
        window.loadCOIInbox();
    };

    window.loadFromDatabase = function() {
        console.log('🚫 Blocked loadFromDatabase - using real API instead');
        window.loadCOIInbox();
    };

    // Auto-refresh every 30 seconds
    setInterval(() => {
        if (window.location.hash === '#coi' && document.getElementById('coiInbox')) {
            console.log('🔄 Auto-refreshing real Outlook emails...');
            window.loadCOIInbox();
        }
    }, 30000);

    // Load immediately if on COI tab
    if (window.location.hash === '#coi') {
        setTimeout(() => {
            console.log('🚀 Initial load of real Outlook emails');
            window.loadCOIInbox();
        }, 1000);
    }

    console.log('✅ FORCE REAL OUTLOOK EMAILS ACTIVE - NO MOCK DATA ALLOWED');
})();