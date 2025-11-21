// TITAN EMAILS ONLY - ABSOLUTELY NO MOCK DATA
console.log('🚫 TITAN EMAILS ONLY - KILLING ALL MOCK DATA');

// DEFINE GLOBAL FUNCTION FIRST - Outside IIFE so app.js can find it
async function loadCOIInbox() {
    console.log('🔥 LOADING TITAN EMAILS ONLY WITH CHECK/X BUTTONS');

    // Find COI inbox - try multiple element IDs
    let coiInbox = document.getElementById('coiInbox') ||
                  document.getElementById('coi-inbox') ||
                  document.querySelector('.coi-inbox') ||
                  document.querySelector('[id*="coi"]');

    if (!coiInbox) {
        console.log('❌ COI inbox element not found - creating one');
        // Create the element if it doesn't exist
        const coiContainer = document.querySelector('.coi-section') || document.body;
        coiInbox = document.createElement('div');
        coiInbox.id = 'coiInbox';
        coiContainer.appendChild(coiInbox);
    }

    // Show loading
    coiInbox.innerHTML = `
        <div style="padding: 20px; text-align: center;">
            <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
            <p style="margin-top: 10px; color: #667eea;">Fetching emails from Titan...</p>
        </div>
    `;

    try {
        // Force fresh fetch from Titan - get ALL emails, not just unread
        const response = await fetch('/api/outlook/emails?filter=ALL&_=' + Date.now(), {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        const data = await response.json();

        console.log('📬 Titan API Response:', data);

        if (!response.ok || data.error || data.success === false) {
            coiInbox.innerHTML = `
                <div style="padding: 20px; background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; margin: 10px;">
                    <h3 style="color: #dc2626; margin: 0 0 15px 0;">
                        <i class="fas fa-exclamation-triangle"></i> CONNECTION ERROR
                    </h3>
                    <p style="color: #991b1b; margin: 0;">
                        ${data.error || 'Failed to fetch emails'}
                    </p>
                </div>
            `;
            return;
        }

        const emails = data.emails || data || [];

        if (emails.length === 0) {
            coiInbox.innerHTML = `
                <div style="padding: 40px; text-align: center; background: #f0f9ff; border: 2px solid #0891b2; border-radius: 8px;">
                    <h2 style="color: #0891b2; margin: 0 0 20px 0;">
                        <i class="fas fa-check-circle"></i> TITAN EMAIL CONNECTED
                    </h2>
                    <i class="fas fa-inbox" style="font-size: 48px; color: #0891b2; margin-bottom: 20px;"></i>
                    <h3 style="color: #0c4a6e; margin: 0 0 10px 0;">No COI Emails Yet</h3>
                    <p style="color: #0c4a6e;">Your Titan inbox is empty or has no COI-related emails</p>
                    <p style="color: #0891b2; font-weight: bold; margin-top: 20px;">
                        Connected to: contact@vigagency.com (TITAN)
                    </p>
                    <p style="color: #065f46; margin-top: 10px; font-weight: bold;">
                        ✅ REAL EMAILS ONLY - NO MOCK DATA
                    </p>
                    <button onclick="loadCOIInbox()" style="margin-top: 20px; padding: 10px 20px; background: #0891b2; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
            `;
        } else {
            // Display real Titan emails WITH CHECK/X BUTTONS
            // ... rest of email display code will go here
            coiInbox.innerHTML = `
                <div style="padding: 15px; background: #f0f9ff; text-align: center; border-top: 2px solid #0891b2;">
                    <strong style="color: #0891b2;">TITAN EMAIL - ${emails.length} Real Email${emails.length !== 1 ? 's' : ''}</strong>
                    <br>
                    <small style="color: #0c4a6e;">contact@vigagency.com | NO MOCK DATA</small>
                </div>
            `;
        }

    } catch (error) {
        console.error('❌ Error:', error);
        coiInbox.innerHTML = `
            <div style="padding: 20px; background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px;">
                <h3 style="color: #dc2626;">Error Loading Emails</h3>
                <p style="color: #991b1b;">${error.message}</p>
                <button onclick="loadCOIInbox()" style="margin-top: 10px; padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Ensure function is available globally
window.loadCOIInbox = loadCOIInbox;

(function() {
    'use strict';

    // AGGRESSIVE CLEAR - Remove ALL Gmail and mock data
    console.log('🧹 AGGRESSIVE CLEAR - Removing ALL Gmail/mock data');
    const keysToRemove = [
        'outlook_real_emails',
        'coi_emails',
        'mock_emails',
        'gmail_emails',
        'gmail_real_emails',
        'real_emails',
        'coi_email_data',
        'gmail_auth_token',
        'gmail_messages',
        'cached_emails',
        'email_cache'
    ];

    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });

    // Block ALL Gmail API calls
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (url.includes('/api/gmail') || url.includes('gmail.com') || url.includes('googleapis.com')) {
            console.log('🚫 BLOCKED Gmail API call:', url);
            return Promise.reject(new Error('Gmail API blocked - using Titan only'));
        }
        return originalFetch.apply(this, arguments);
    };

    // AGGRESSIVE KILL - All Gmail and mock email functions
    const functionsToKill = [
        'originalLoadCOIInbox',
        'loadRealOutlookEmails',
        'displayRealEmails',
        'loadFromDatabase',
        'loadOutlookEmails',
        'loadGmailEmails',
        'expandEmail',
        'displayGmailEmails',
        'loadRealEmails',
        'loadEmailsFromAPI',
        'fetchGmailMessages',
        'loadCachedEmails',
        'displayCachedEmails',
        'showMockEmails',
        'loadMockData'
    ];

    functionsToKill.forEach(func => {
        if (window[func]) {
            delete window[func];
            console.log(`🗑️ Killed ${func}`);
        }
    });

    // Add toggle functions for check/X buttons
    window.toggleHandled = function(emailId, button) {
        const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');

        if (statuses[emailId] === 'handled') {
            delete statuses[emailId];
            button.style.background = 'white';
            button.querySelector('i').style.color = '#9ca3af';
            button.style.borderColor = '#e5e7eb';
        } else {
            statuses[emailId] = 'handled';
            button.style.background = '#10b981';
            button.querySelector('i').style.color = 'white';
            button.style.borderColor = '#10b981';

            // Unmark as unimportant if it was
            const xButton = button.parentElement.querySelector('.status-btn-unimportant');
            if (xButton) {
                xButton.style.background = 'white';
                xButton.querySelector('i').style.color = '#9ca3af';
                xButton.style.borderColor = '#e5e7eb';
            }
        }

        localStorage.setItem('coi_email_status', JSON.stringify(statuses));

        // Save to server
        fetch('/api/coi-email-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(statuses)
        }).catch(e => console.log('Failed to save status to server'));
    };

    window.toggleUnimportant = function(emailId, button) {
        const statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');

        if (statuses[emailId] === 'unimportant') {
            delete statuses[emailId];
            button.style.background = 'white';
            button.querySelector('i').style.color = '#9ca3af';
            button.style.borderColor = '#e5e7eb';
        } else {
            statuses[emailId] = 'unimportant';
            button.style.background = '#ef4444';
            button.querySelector('i').style.color = 'white';
            button.style.borderColor = '#ef4444';

            // Unmark as handled if it was
            const checkButton = button.parentElement.querySelector('.status-btn-handled');
            if (checkButton) {
                checkButton.style.background = 'white';
                checkButton.querySelector('i').style.color = '#9ca3af';
                checkButton.style.borderColor = '#e5e7eb';
            }
        }

        localStorage.setItem('coi_email_status', JSON.stringify(statuses));

        // Save to server
        fetch('/api/coi-email-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(statuses)
        }).catch(e => console.log('Failed to save status to server'));
    };

    window.expandEmail = function(emailId) {
        console.log('Expanding email:', emailId);
        // Email expansion can be implemented later
    };

    // IMMEDIATE GLOBAL OVERRIDE - Define loadCOIInbox in all scopes
    const titanLoadCOIInbox = async function() {
        console.log('🔥 LOADING TITAN EMAILS ONLY WITH CHECK/X BUTTONS');

        // Find COI inbox - try multiple element IDs
        let coiInbox = document.getElementById('coiInbox') ||
                      document.getElementById('coi-inbox') ||
                      document.querySelector('.coi-inbox') ||
                      document.querySelector('[id*="coi"]');

        if (!coiInbox) {
            console.log('❌ COI inbox element not found - creating one');
            // Create the element if it doesn't exist
            const coiContainer = document.querySelector('.coi-section') || document.body;
            coiInbox = document.createElement('div');
            coiInbox.id = 'coiInbox';
            coiContainer.appendChild(coiInbox);
        }

        // Show loading
        coiInbox.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #6c757d;"></i>
                <p style="margin-top: 10px; color: #6c757d;">Fetching emails from Titan...</p>
            </div>
        `;

        try {
            // Force fresh fetch from Titan - get ALL emails, not just unread
            const response = await fetch('/api/outlook/emails?filter=ALL&_=' + Date.now(), {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            const data = await response.json();

            console.log('📬 Titan API Response:', data);

            if (!response.ok || data.error || data.success === false) {
                coiInbox.innerHTML = `
                    <div style="padding: 20px; background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; margin: 10px;">
                        <h3 style="color: #dc2626; margin: 0 0 15px 0;">
                            <i class="fas fa-exclamation-triangle"></i> CONNECTION ERROR
                        </h3>
                        <p style="color: #991b1b; margin: 0;">
                            ${data.error || 'Failed to fetch emails'}
                        </p>
                    </div>
                `;
                return;
            }

            const emails = data.emails || data || [];

            if (emails.length === 0) {
                coiInbox.innerHTML = `
                    <div style="padding: 40px; text-align: center; background: #f0f9ff; border: 2px solid #0891b2; border-radius: 8px;">
                        <h2 style="color: #0891b2; margin: 0 0 20px 0;">
                            <i class="fas fa-check-circle"></i> TITAN EMAIL CONNECTED
                        </h2>
                        <i class="fas fa-inbox" style="font-size: 48px; color: #0891b2; margin-bottom: 20px;"></i>
                        <h3 style="color: #0c4a6e; margin: 0 0 10px 0;">No COI Emails Yet</h3>
                        <p style="color: #0c4a6e;">Your Titan inbox is empty or has no COI-related emails</p>
                        <p style="color: #0891b2; font-weight: bold; margin-top: 20px;">
                            Connected to: contact@vigagency.com (TITAN)
                        </p>
                        <p style="color: #065f46; margin-top: 10px; font-weight: bold;">
                            ✅ REAL EMAILS ONLY - NO MOCK DATA
                        </p>
                        <button onclick="window.loadCOIInbox()" style="margin-top: 20px; padding: 10px 20px; background: #0891b2; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>
                `;
            } else {
                // Get stored statuses for check/X buttons
                let statuses = {};
                try {
                    const statusResp = await fetch('/api/coi-email-status');
                    if (statusResp.ok) statuses = await statusResp.json();
                } catch (e) {
                    statuses = JSON.parse(localStorage.getItem('coi_email_status') || '{}');
                }

                // Display real Titan emails WITH CHECK/X BUTTONS (Gmail style)
                let html = '<div class="email-list">';

                emails.forEach(email => {
                    const date = new Date(email.date || email.receivedDateTime);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const dateStr = isToday ?
                        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    const senderName = email.fromName || email.from?.split('@')[0] || 'Unknown';
                    const status = statuses[email.id];

                    const bgColor = status === 'handled' ? 'background: linear-gradient(to right, #d1fae5 0%, #ecfdf5 100%); border-left: 4px solid #10b981;' :
                                   status === 'unimportant' ? 'background: linear-gradient(to right, #fee2e2 0%, #fef2f2 100%); border-left: 4px solid #ef4444; opacity: 0.7;' :
                                   email.isRead === false ? 'background: #f0f9ff; border-left: 4px solid #3b82f6;' : 'border-left: 4px solid transparent;';

                    html += `
                        <div class="email-item ${email.isRead === false ? 'unread' : ''}" data-email-id="${email.id}"
                             style="cursor: pointer; position: relative; padding: 15px; border-bottom: 1px solid #e5e7eb; ${bgColor}"
                             onclick="expandEmail('${email.id}')">

                            <!-- Email Content -->
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="flex: 1;">
                                    <div style="margin-bottom: 5px;">
                                        ${email.isRead === false ? '<i class="fas fa-circle" style="color: #667eea; font-size: 8px; margin-right: 8px;"></i>' : ''}
                                        <strong style="color: #1f2937;">${senderName}</strong>
                                    </div>
                                    <div style="color: #374151; font-weight: 500;">${email.subject || 'No Subject'}</div>
                                    <div style="margin-top: 5px; font-size: 13px; color: #6b7280;">
                                        ${email.preview ? email.preview.substring(0, 100).replace(/<[^>]*>/g, '') + '...' : ''}
                                    </div>
                                    <div style="margin-top: 5px;">
                                        ${email.hasAttachments ? '<i class="fas fa-paperclip" style="margin-right: 8px; color: #9ca3af;"></i>' : ''}
                                        <span style="color: #9ca3af; font-size: 12px;">${dateStr}</span>
                                    </div>
                                </div>

                                <!-- CHECK AND X BUTTONS - ALWAYS VISIBLE -->
                                <div style="display: flex; gap: 10px; margin-left: 20px;">
                                    <button class="status-btn-handled"
                                            data-email-id="${email.id}"
                                            style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid ${status === 'handled' ? '#10b981' : '#e5e7eb'};
                                                   background: ${status === 'handled' ? '#10b981' : 'white'}; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                                            onclick="event.stopPropagation(); toggleHandled('${email.id}', this); return false;">
                                        <i class="fas fa-check" style="color: ${status === 'handled' ? 'white' : '#9ca3af'}; font-size: 18px;"></i>
                                    </button>
                                    <button class="status-btn-unimportant"
                                            data-email-id="${email.id}"
                                            style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid ${status === 'unimportant' ? '#ef4444' : '#e5e7eb'};
                                                   background: ${status === 'unimportant' ? '#ef4444' : 'white'}; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                                            onclick="event.stopPropagation(); toggleUnimportant('${email.id}', this); return false;">
                                        <i class="fas fa-times" style="color: ${status === 'unimportant' ? 'white' : '#9ca3af'}; font-size: 18px;"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });

                html += '</div>';
                html += `
                    <div style="padding: 15px; background: #f0f9ff; text-align: center; border-top: 2px solid #0891b2;">
                        <strong style="color: #0891b2;">TITAN EMAIL - ${emails.length} Real Email${emails.length !== 1 ? 's' : ''}</strong>
                        <br>
                        <small style="color: #0c4a6e;">contact@vigagency.com | NO MOCK DATA</small>
                    </div>
                `;

                coiInbox.innerHTML = html;
            }

        } catch (error) {
            console.error('❌ Error:', error);
            coiInbox.innerHTML = `
                <div style="padding: 20px; background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px;">
                    <h3 style="color: #dc2626;">Error Loading Emails</h3>
                    <p style="color: #991b1b;">${error.message}</p>
                    <button onclick="window.loadCOIInbox()" style="margin-top: 10px; padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    };

    // ASSIGN TO GLOBAL SCOPE - Make sure both window and global have the function
    window.loadCOIInbox = titanLoadCOIInbox;
    if (typeof global !== 'undefined') global.loadCOIInbox = titanLoadCOIInbox;

    // Try to assign to the actual global scope (outside IIFE)
    try {
        eval('loadCOIInbox = titanLoadCOIInbox');
    } catch(e) {
        console.log('Could not assign to global loadCOIInbox:', e.message);
    }

    // ULTIMATE OVERRIDE - Block any attempts to override
    Object.defineProperty(window, 'loadCOIInbox', {
        writable: false,
        configurable: false
    });

    // Also override global function declaration
    if (typeof loadCOIInbox !== 'undefined' && loadCOIInbox !== window.loadCOIInbox) {
        console.log('🔥 FOUND AND KILLING GLOBAL loadCOIInbox');
        window.loadCOIInbox_ORIGINAL_MOCK = loadCOIInbox;
        loadCOIInbox = window.loadCOIInbox;
    }

    // NUCLEAR FORCE LOAD - Override everything and force Titan
    function forceLoadTitanEmails() {
        console.log('🔥 NUCLEAR FORCE LOADING Titan emails - overriding everything');

        // Kill any Gmail loading attempts
        if (window.loadRealEmails) delete window.loadRealEmails;

        // Force load multiple times with increasing delays
        const delays = [10, 50, 100, 200, 500, 1000, 2000];
        delays.forEach(delay => {
            setTimeout(() => {
                console.log(`🚀 Forcing Titan load at ${delay}ms`);
                window.loadCOIInbox();
            }, delay);
        });
    }

    // Load on COI tab immediately
    if (window.location.hash === '#coi') {
        forceLoadTitanEmails();
    }

    // Watch for hash changes to COI
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#coi') {
            console.log('🚀 COI tab activated - loading Titan emails');
            forceLoadTitanEmails();
        }
    });

    // Auto-refresh every 30 seconds
    setInterval(() => {
        if (window.location.hash === '#coi' && document.getElementById('coiInbox')) {
            console.log('🔄 Auto-refreshing Titan emails');
            window.loadCOIInbox();
        }
    }, 30000);

    console.log('✅ TITAN EMAILS ONLY - System ready');
    console.log('✅ loadCOIInbox function defined:', typeof window.loadCOIInbox);
    console.log('✅ Global loadCOIInbox function:', typeof loadCOIInbox);

    // SUPER AGGRESSIVE - Force load everywhere
    window.addEventListener('load', () => {
        console.log('🚀 Page loaded - forcing Titan emails everywhere');
        forceLoadTitanEmails();
    });

    // SUPER AGGRESSIVE OBSERVER - Watch for everything and force Titan
    const observer = new MutationObserver((mutations) => {
        // Check for COI inbox elements
        if (document.getElementById('coiInbox') || document.getElementById('coi-inbox')) {
            console.log('🎯 COI Inbox element detected - loading Titan emails');
            window.loadCOIInbox();
        }
        // Block Gmail error messages and force Titan
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'coiInbox' || mutation.target.id === 'coi-inbox') {
                const content = mutation.target.innerHTML;
                if (content.includes('No COI requests found') ||
                    content.includes('Connected to: Outlook') ||
                    content.includes('Unable to connect to Gmail') ||
                    content.includes('Gmail API blocked') ||
                    content.includes('corptech06@gmail.com')) {
                    console.log('🚫 BLOCKED Gmail/error message - loading Titan emails');
                    window.loadCOIInbox();
                }
            }
        });
    });

    // Start observing
    setTimeout(() => {
        const inbox = document.getElementById('coiInbox');
        if (inbox) {
            observer.observe(inbox, { childList: true, subtree: true });
        }
    }, 100);
})();