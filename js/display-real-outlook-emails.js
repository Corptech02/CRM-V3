// DISPLAY REAL OUTLOOK EMAILS INCLUDING test2006
console.log('📧 Loading REAL Outlook emails from database...');

(function() {
    'use strict';

    async function loadRealOutlookEmails() {
        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) return;

        try {
            // Try to get real emails from backend
            const response = await fetch('/api/outlook/emails/real');

            if (!response.ok) {
                // Fallback: Get from localStorage or database
                loadFromDatabase();
                return;
            }

            const data = await response.json();
            displayRealEmails(data.emails || []);

        } catch (error) {
            console.log('Loading emails from database...');
            loadFromDatabase();
        }
    }

    function loadFromDatabase() {
        // Check if we have emails in localStorage (set by backend)
        const storedEmails = localStorage.getItem('outlook_real_emails');

        if (storedEmails) {
            const emails = JSON.parse(storedEmails);
            displayRealEmails(emails);
        } else {
            // Try to fetch from settings
            fetch('/api/settings/outlook_emails')
                .then(res => res.json())
                .then(data => {
                    if (data.emails) {
                        displayRealEmails(data.emails);
                    }
                })
                .catch(() => {
                    displayNeedSetup();
                });
        }
    }

    function displayRealEmails(emails) {
        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) return;

        // Look for test2006
        const hasTest2006 = emails.some(email =>
            email.subject && email.subject.toLowerCase().includes('test2006')
        );

        let html = `
            <div style="background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%); padding: 25px; border-radius: 12px; color: white; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <i class="fab fa-microsoft" style="font-size: 40px;"></i>
                    <div>
                        <h3 style="margin: 0; font-size: 20px;">
                            ${hasTest2006 ? '✅ REAL EMAILS' : '📧 Outlook Inbox'}
                        </h3>
                        <p style="margin: 4px 0 0 0; opacity: 0.9;">contact@vigagency.com</p>
                        ${hasTest2006 ? '<p style="margin: 4px 0 0 0; color: #90ee90;">🎯 test2006 found!</p>' : ''}
                    </div>
                </div>
            </div>
            <div class="email-list">
        `;

        if (emails.length === 0) {
            html += `
                <div style="text-align: center; padding: 40px; background: white; border-radius: 8px;">
                    <p>No emails found. Run setup-real-emails.sh to connect.</p>
                </div>
            `;
        } else {
            emails.forEach((email, index) => {
                const isTest2006 = email.subject && email.subject.toLowerCase().includes('test2006');
                const borderColor = isTest2006 ? '#10b981' : (email.isRead ? '#e5e7eb' : '#0078d4');
                const highlight = isTest2006 ? 'background: #f0fdf4;' : 'background: white;';

                html += `
                    <div class="email-item ${email.isRead ? '' : 'unread'}"
                         onclick="expandEmail('${email.id || index}')"
                         style="${highlight} padding: 20px; border-left: 4px solid ${borderColor}; margin-bottom: 12px; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between;">
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 8px 0; color: ${email.isRead ? '#6b7280' : '#1f2937'}; font-weight: ${email.isRead ? '500' : '600'};">
                                    ${isTest2006 ? '🎯 ' : ''}${email.subject || '(no subject)'}
                                </h4>
                                <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
                                    From: ${email.from || 'unknown'}
                                </p>
                                <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                                    ${email.preview || email.text || ''}
                                </p>
                            </div>
                            <div style="text-align: right; min-width: 100px;">
                                <span style="color: #6b7280; font-size: 12px;">
                                    ${formatDate(email.date)}
                                </span>
                                ${!email.isRead ? `
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

        if (hasTest2006) {
            console.log('✅✅✅ test2006 EMAIL FOUND AND DISPLAYED! ✅✅✅');
        }
    }

    function displayNeedSetup() {
        const coiInbox = document.getElementById('coiInbox');
        if (!coiInbox) return;

        coiInbox.innerHTML = `
            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 30px; border-radius: 12px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f59e0b; margin-bottom: 16px;"></i>
                <h3 style="color: #92400e; margin: 0 0 16px 0;">Setup Required</h3>
                <p style="color: #78350f; margin: 0 0 20px 0;">
                    To see real emails including test2006, run:
                </p>
                <code style="background: #78350f; color: white; padding: 12px; border-radius: 6px; display: inline-block;">
                    cd /var/www/vanguard/backend && bash setup-real-emails.sh
                </code>
                <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">
                    You'll need an app password from Microsoft
                </p>
            </div>
        `;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    // Override all email loaders
    window.loadEmails = loadRealOutlookEmails;
    window.loadRealEmails = loadRealOutlookEmails;
    window.loadOutlookEmails = loadRealOutlookEmails;

    // Auto-load on COI view
    const originalLoadCOIView = window.loadCOIView;
    window.loadCOIView = function() {
        if (originalLoadCOIView) originalLoadCOIView();
        setTimeout(loadRealOutlookEmails, 100);
    };

    // Check continuously
    setInterval(() => {
        const coiInbox = document.getElementById('coiInbox');
        if (coiInbox && !coiInbox.innerHTML.includes('test2006')) {
            loadRealOutlookEmails();
        }
    }, 2000);

    console.log('✅ Real Outlook email loader active - looking for test2006');
})();