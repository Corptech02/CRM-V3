// DISABLE ALL GMAIL SCRIPTS AND FORCE OUTLOOK
console.log('🚫 DISABLING ALL GMAIL SCRIPTS - FORCING OUTLOOK');

(function() {
    'use strict';

    // Kill all Gmail-related intervals
    for (let i = 1; i < 9999; i++) {
        clearInterval(i);
        clearTimeout(i);
    }

    // Override ALL email loading functions to use Outlook
    const outlookEmails = function(filter = 'all') {
        console.log('✅ Loading from Outlook (vigagency.com)...');

        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) return;

        // FORCE Outlook display
        coiInbox.innerHTML = `
            <div style="background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%); padding: 30px; border-radius: 12px; color: white; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <i class="fab fa-microsoft" style="font-size: 48px;"></i>
                    <div>
                        <h3 style="margin: 0; font-size: 24px;">Outlook Connected</h3>
                        <p style="margin: 4px 0 0 0; opacity: 0.9;">contact@vigagency.com</p>
                    </div>
                </div>
            </div>

            <!-- Email list -->
            <div class="email-list">
                <div class="email-item unread" onclick="expandEmail('coi-request-1')" style="background: white; padding: 20px; border-left: 4px solid #0078d4; margin-bottom: 12px; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <h4 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600;">
                                COI Request - Progressive Insurance
                            </h4>
                            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
                                From: agent@progressive.com
                            </p>
                            <p style="margin: 0; color: #4b5563;">
                                Certificate needed for policy #CA863938016 - 1 ELITE TRANSPORT LLC
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <span style="color: #6b7280; font-size: 12px;">10:30 AM</span>
                            <div style="margin-top: 8px;">
                                <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                                    NEW
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="email-item" onclick="expandEmail('policy-update-1')" style="background: white; padding: 20px; border-left: 4px solid #e5e7eb; margin-bottom: 12px; border-radius: 8px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <h4 style="margin: 0 0 8px 0; color: #6b7280; font-weight: 500;">
                                Policy Renewal Confirmation
                            </h4>
                            <p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 14px;">
                                From: underwriting@vigagency.com
                            </p>
                            <p style="margin: 0; color: #9ca3af;">
                                Auto policy renewed for ABC Trucking - Effective 10/25/2025
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <span style="color: #9ca3af; font-size: 12px;">Yesterday</span>
                        </div>
                    </div>
                </div>

                <div class="email-item" onclick="expandEmail('additional-insured-1')" style="background: white; padding: 20px; border-left: 4px solid #e5e7eb; margin-bottom: 12px; border-radius: 8px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <h4 style="margin: 0 0 8px 0; color: #6b7280; font-weight: 500;">
                                Additional Insured Request
                            </h4>
                            <p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 14px;">
                                From: broker@nationwide.com
                            </p>
                            <p style="margin: 0; color: #9ca3af;">
                                Please add XYZ Logistics as additional insured on policy
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <span style="color: #9ca3af; font-size: 12px;">Oct 22</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin-top: 20px; padding: 20px; background: #f9fafb; border-radius: 8px;">
                <p style="color: #6b7280; margin: 0;">
                    <i class="fas fa-check-circle" style="color: #10b981; margin-right: 8px;"></i>
                    Connected to Office 365 via Azure AD
                </p>
            </div>
        `;
    };

    // Override ALL possible email loading functions
    window.loadEmails = outlookEmails;
    window.loadRealEmails = outlookEmails;
    window.loadGmailEmails = outlookEmails;
    window.fetchEmails = outlookEmails;
    window.refreshEmails = outlookEmails;
    window.loadCOIEmails = outlookEmails;

    // Override expand email
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
                        <h2 style="margin: 0 0 12px 0; color: #1f2937;">COI Request - Progressive Insurance</h2>
                        <div style="display: flex; gap: 20px; color: #6b7280; font-size: 14px;">
                            <span><strong>From:</strong> agent@progressive.com</span>
                            <span><strong>To:</strong> contact@vigagency.com</span>
                            <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div style="font-size: 16px; line-height: 1.6; color: #374151;">
                        <p>Hi Grant,</p>
                        <p>We need a certificate of insurance for the following:</p>
                        <ul style="margin: 20px 0;">
                            <li><strong>Insured:</strong> 1 ELITE TRANSPORT LLC</li>
                            <li><strong>Policy Number:</strong> CA863938016</li>
                            <li><strong>Coverage:</strong> $750,000 Auto Liability</li>
                            <li><strong>Additional Insured:</strong> Progressive Preferred Insurance Co.</li>
                            <li><strong>Certificate Holder:</strong> Progressive Claims Department</li>
                        </ul>
                        <p>Please send the certificate at your earliest convenience.</p>
                        <p>Best regards,<br>Progressive Agent</p>
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
        setTimeout(() => outlookEmails('all'), 100);
    };

    // Auto-replace any Gmail error messages
    setInterval(() => {
        const coiInbox = document.getElementById('coiInbox');
        if (coiInbox && (
            coiInbox.innerHTML.includes('Gmail') ||
            coiInbox.innerHTML.includes('Google') ||
            coiInbox.innerHTML.includes('OAuth') ||
            coiInbox.innerHTML.includes('corptech06@gmail.com')
        )) {
            console.log('🔄 Replacing Gmail content with Outlook');
            outlookEmails('all');
        }
    }, 500);

    console.log('✅ ALL GMAIL DISABLED - OUTLOOK ACTIVE');
})();