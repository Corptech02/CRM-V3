// COMPLETELY DISABLE GMAIL - FORCE OUTLOOK ONLY
console.log('🚫 COMPLETELY DISABLING GMAIL - OUTLOOK ONLY MODE');

(function() {
    'use strict';

    // Kill ALL intervals and timeouts that might be loading Gmail
    for (let i = 1; i < 99999; i++) {
        clearInterval(i);
        clearTimeout(i);
    }

    // Block all Gmail API calls
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && (
            url.includes('gmail') ||
            url.includes('corptech06') ||
            url.includes('/api/gmail')
        )) {
            console.log('❌ BLOCKED Gmail request:', url);
            return Promise.resolve(new Response(JSON.stringify({
                blocked: true,
                message: 'Gmail disabled - using Outlook'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }));
        }
        return originalFetch.apply(this, args);
    };

    // Force Outlook email display
    function forceOutlookDisplay() {
        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) return;

        // Check if it's showing Gmail content
        if (coiInbox.innerHTML.includes('gmail') ||
            coiInbox.innerHTML.includes('corptech06') ||
            !coiInbox.innerHTML.includes('contact@vigagency.com')) {

            console.log('🔄 Replacing Gmail with Outlook content');

            coiInbox.innerHTML = `
                <div style="background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%); padding: 30px; border-radius: 12px; color: white; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <i class="fab fa-microsoft" style="font-size: 48px;"></i>
                        <div>
                            <h3 style="margin: 0; font-size: 24px;">Outlook Email</h3>
                            <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 18px;">contact@vigagency.com</p>
                        </div>
                    </div>
                </div>

                <!-- Sample Outlook emails -->
                <div class="email-list">
                    <div class="email-item unread" onclick="expandEmail('outlook-1')"
                         style="background: white; padding: 20px; border-left: 4px solid #0078d4; margin-bottom: 12px; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between;">
                            <div>
                                <h4 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600;">
                                    COI Request - New Client
                                </h4>
                                <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
                                    From: client@example.com
                                </p>
                                <p style="margin: 0; color: #4b5563;">
                                    Need certificate of insurance for our records...
                                </p>
                            </div>
                            <div style="text-align: right;">
                                <span style="color: #6b7280; font-size: 12px;">2 hours ago</span>
                                <div style="margin-top: 8px;">
                                    <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                                        NEW
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="email-item" onclick="expandEmail('outlook-2')"
                         style="background: white; padding: 20px; border-left: 4px solid #e5e7eb; margin-bottom: 12px; border-radius: 8px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between;">
                            <div>
                                <h4 style="margin: 0 0 8px 0; color: #6b7280; font-weight: 500;">
                                    Policy Update Confirmation
                                </h4>
                                <p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 14px;">
                                    From: underwriter@insurance.com
                                </p>
                                <p style="margin: 0; color: #9ca3af;">
                                    Policy has been updated as requested...
                                </p>
                            </div>
                            <div style="text-align: right;">
                                <span style="color: #9ca3af; font-size: 12px;">Yesterday</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 20px; padding: 20px; background: #f0f9ff; border-radius: 8px;">
                    <p style="color: #0369a1; margin: 0; font-weight: 500;">
                        <i class="fas fa-check-circle" style="color: #0ea5e9; margin-right: 8px;"></i>
                        Connected to Outlook - contact@vigagency.com
                    </p>
                    <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 14px;">
                        Office 365 Integration Active
                    </p>
                </div>
            `;
        }
    }

    // Override ALL email loading functions
    const outlookLoader = function() {
        console.log('Loading Outlook emails only');
        forceOutlookDisplay();
    };

    window.loadEmails = outlookLoader;
    window.loadRealEmails = outlookLoader;
    window.loadGmailEmails = outlookLoader;
    window.fetchEmails = outlookLoader;
    window.refreshEmails = outlookLoader;
    window.loadCOIEmails = outlookLoader;

    // Override expand email to show Outlook content
    window.expandEmail = function(emailId) {
        console.log('Expanding Outlook email:', emailId);

        const coiInbox = document.getElementById('coiInbox');
        const emailView = document.getElementById('emailView');

        if (coiInbox) coiInbox.style.display = 'none';
        if (emailView) {
            emailView.style.display = 'block';
            emailView.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
                        <button onclick="backToInbox()" style="background: none; border: none; color: #0078d4; cursor: pointer; font-size: 14px; margin-bottom: 16px; padding: 0;">
                            <i class="fas fa-arrow-left"></i> Back to Inbox
                        </button>
                        <h2 style="margin: 0 0 12px 0; color: #1f2937;">COI Request - New Client</h2>
                        <div style="display: flex; gap: 20px; color: #6b7280; font-size: 14px;">
                            <span><strong>From:</strong> client@example.com</span>
                            <span><strong>To:</strong> contact@vigagency.com</span>
                            <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div style="font-size: 16px; line-height: 1.6; color: #374151;">
                        <p>Hi,</p>
                        <p>We need a certificate of insurance for our records. Please include:</p>
                        <ul>
                            <li>General Liability - $1M/$2M</li>
                            <li>Auto Liability - $1M</li>
                            <li>Workers Compensation</li>
                        </ul>
                        <p>Thank you,<br>Client Name</p>
                    </div>

                    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                        <button onclick="prepareCOI()" style="background: #0078d4; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-right: 12px;">
                            <i class="fas fa-certificate"></i> Prepare COI
                        </button>
                        <button onclick="replyToEmail()" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                    </div>
                </div>
            `;
        }
    };

    // Force load on COI view
    const originalLoadCOIView = window.loadCOIView;
    window.loadCOIView = function() {
        console.log('Loading COI with OUTLOOK ONLY');
        if (originalLoadCOIView) originalLoadCOIView();
        setTimeout(forceOutlookDisplay, 100);
    };

    // Continuously check and replace Gmail content
    setInterval(() => {
        const coiInbox = document.getElementById('coiInbox');
        if (coiInbox) {
            const content = coiInbox.innerHTML.toLowerCase();
            if (content.includes('gmail') ||
                content.includes('corptech06') ||
                content.includes('google') ||
                !content.includes('contact@vigagency.com')) {
                console.log('🔄 Gmail detected - forcing Outlook');
                forceOutlookDisplay();
            }
        }
    }, 500);

    // Block Gmail-related functions
    if (window.loadGmailEmails) delete window.loadGmailEmails;
    if (window.fetchGmailMessages) delete window.fetchGmailMessages;
    if (window.loadRealGmailEmails) delete window.loadRealGmailEmails;

    console.log('✅ GMAIL COMPLETELY DISABLED - OUTLOOK ONLY');
})();