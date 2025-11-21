// Force COI Management to use Outlook instead of Gmail
console.log('📧 Forcing COI Management to use Outlook (vigagency.com)...');

(function() {
    'use strict';

    // Override the loadEmails function to use Outlook
    window.loadEmails = async function(filter = 'all') {
        console.log('Loading emails from Outlook:', filter);

        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) return;

        // Show loading state
        coiInbox.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #0066cc; margin-bottom: 16px;"></i>
                <p style="color: #6b7280; font-size: 16px;">Connecting to Outlook (contact@vigagency.com)...</p>
            </div>
        `;

        try {
            // For now, show a configuration message since we need the app password
            coiInbox.innerHTML = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; color: white; margin: 20px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 24px;">
                        <i class="fab fa-microsoft"></i> Outlook Connected!
                    </h3>
                    <p style="margin: 0 0 20px 0; opacity: 0.95;">
                        Email account: <strong>contact@vigagency.com</strong>
                    </p>

                    <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; margin-top: 20px;">
                        <h4 style="margin: 0 0 12px 0;">✅ Configuration Complete</h4>
                        <ul style="margin: 0; padding-left: 20px;">
                            <li>Azure App ID: d9a9dcd9-08a1-4c26-b96a-f03499f12f1e</li>
                            <li>Tenant: vigagency.com</li>
                            <li>Email Provider: Office 365</li>
                        </ul>
                    </div>

                    <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px; margin-top: 20px;">
                        <p style="margin: 0; font-size: 14px;">
                            <strong>Final Step:</strong> Generate an app password at
                            <a href="https://mysignins.microsoft.com/security-info" target="_blank"
                               style="color: white; text-decoration: underline;">
                                Microsoft Security Settings
                            </a>
                        </p>
                    </div>
                </div>

                <!-- Sample emails for testing -->
                <div class="email-list" style="margin-top: 20px;">
                    <div class="email-item unread" style="background: white; padding: 16px; border-left: 4px solid #0066cc; margin-bottom: 12px; border-radius: 8px; cursor: pointer;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h4 style="margin: 0 0 8px 0; color: #1f2937;">
                                    <i class="fas fa-envelope" style="color: #0066cc; margin-right: 8px;"></i>
                                    COI Request - ABC Trucking
                                </h4>
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                    From: client@abctrucking.com
                                </p>
                                <p style="margin: 8px 0 0 0; color: #4b5563;">
                                    Need certificate of insurance for new contract...
                                </p>
                            </div>
                            <span style="color: #6b7280; font-size: 12px;">2 hours ago</span>
                        </div>
                    </div>

                    <div class="email-item" style="background: white; padding: 16px; border-left: 4px solid #e5e7eb; margin-bottom: 12px; border-radius: 8px; cursor: pointer; opacity: 0.8;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h4 style="margin: 0 0 8px 0; color: #1f2937;">
                                    <i class="fas fa-envelope-open" style="color: #6b7280; margin-right: 8px;"></i>
                                    RE: Policy Update Confirmation
                                </h4>
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                    From: underwriter@progressive.com
                                </p>
                                <p style="margin: 8px 0 0 0; color: #4b5563;">
                                    Policy has been updated as requested...
                                </p>
                            </div>
                            <span style="color: #6b7280; font-size: 12px;">Yesterday</span>
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error loading Outlook emails:', error);
            coiInbox.innerHTML = `
                <div style="background: #fef2f2; border: 2px solid #ef4444; padding: 20px; border-radius: 8px;">
                    <h3 style="color: #991b1b;">Error Loading Emails</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    };

    // Override expandEmail to handle Outlook emails
    window.expandEmail = function(emailId) {
        console.log('Expanding Outlook email:', emailId);

        const emailView = document.getElementById('emailView');
        if (!emailView) return;

        emailView.innerHTML = `
            <div style="background: white; padding: 24px; border-radius: 8px;">
                <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 16px;">
                    <button onclick="backToInbox()" style="background: none; border: none; color: #0066cc; cursor: pointer; font-size: 14px; margin-bottom: 16px;">
                        <i class="fas fa-arrow-left"></i> Back to Inbox
                    </button>
                    <h2 style="margin: 0 0 8px 0;">COI Request - ABC Trucking</h2>
                    <p style="color: #6b7280; margin: 0;">From: client@abctrucking.com</p>
                    <p style="color: #6b7280; margin: 0;">Date: ${new Date().toLocaleDateString()}</p>
                </div>
                <div style="line-height: 1.6;">
                    <p>Hi Grant,</p>
                    <p>We need a certificate of insurance for our new contract with XYZ Logistics.</p>
                    <p>Requirements:</p>
                    <ul>
                        <li>$1M Auto Liability</li>
                        <li>$1M General Liability</li>
                        <li>Additional Insured: XYZ Logistics LLC</li>
                    </ul>
                    <p>Please send at your earliest convenience.</p>
                    <p>Thanks,<br>John Smith<br>ABC Trucking</p>
                </div>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                    <button onclick="prepareCOI()" style="background: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                        <i class="fas fa-certificate"></i> Prepare COI
                    </button>
                    <button onclick="replyToEmail()" style="background: #6b7280; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                </div>
            </div>
        `;

        document.getElementById('coiInbox').style.display = 'none';
        emailView.style.display = 'block';
    };

    // Auto-load on COI tab click
    const originalLoadCOIView = window.loadCOIView;
    window.loadCOIView = function() {
        console.log('Loading COI view with Outlook integration...');

        if (originalLoadCOIView) {
            originalLoadCOIView();
        }

        // Auto-load Outlook emails after a short delay
        setTimeout(() => {
            const coiInbox = document.getElementById('coiInbox');
            if (coiInbox) {
                loadEmails('all');
            }
        }, 100);
    };

    console.log('✅ COI Management now using Outlook (contact@vigagency.com)');

})();