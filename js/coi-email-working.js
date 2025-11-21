// COI Email WORKING System - Actually sends emails through the backend
console.log('📧 COI Email Working System - Real email sending enabled');

// Function to actually send the email
window.actualSendEmail = async function(policyId) {
    const to = document.getElementById('emailTo').value.trim();
    const cc = document.getElementById('emailCc').value.trim();
    const bcc = document.getElementById('emailBcc').value.trim();
    const subject = document.getElementById('emailSubject').value.trim();
    const body = document.getElementById('emailBody').value.trim();
    const certHolder = document.getElementById('certHolder')?.value.trim() || '';
    const certAddress = document.getElementById('certAddress')?.value.trim() || '';
    const sendCopy = document.getElementById('sendCopy')?.checked || false;

    if (!to) {
        showStatus('Please enter recipient email address', 'error');
        return;
    }

    if (!subject) {
        showStatus('Please enter a subject', 'error');
        return;
    }

    if (!body) {
        showStatus('Please enter a message', 'error');
        return;
    }

    const btn = document.getElementById('sendBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending email...';
    }

    showStatus('Connecting to email service...', 'info');

    try {
        // Determine provider
        const provider = localStorage.getItem('coi_email_provider') === 'OUTLOOK' ? 'outlook' : 'gmail';

        // Prepare policy data for PDF
        const policy = window.currentCOIPolicy || window.coiPolicyData || {};
        const policyData = {
            policyNumber: policy.policyNumber || policyId || 'N/A',
            insuredName: policy.clientName || policy.insured || 'Client',
            insuredAddress: policy.address || '123 Main St, City, State 12345',
            carrier: policy.carrier || 'Insurance Carrier',
            policyType: policy.policyType || 'general-liability',
            effectiveDate: policy.effectiveDate || new Date().toISOString().split('T')[0],
            expirationDate: policy.expirationDate || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
            coverageAmount: policy.coverageAmount || '$1,000,000',
            occurrenceLimit: '1,000,000',
            aggregateLimit: '2,000,000',
            certificateHolder: certHolder || 'Certificate Holder',
            certificateHolderAddress: certAddress || ''
        };

        // Add sender to BCC if needed
        let finalBcc = bcc;
        if (sendCopy) {
            const senderEmail = 'corptech06@gmail.com';
            finalBcc = finalBcc ? `${finalBcc}, ${senderEmail}` : senderEmail;
        }

        console.log('Sending COI email with PDF to:', to);
        console.log('Using provider:', provider);

        // Try to send with PDF attachment
        let response = await fetch('http://162-220-14-239.nip.io/api/coi/send-with-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify({
                to: to,
                cc: cc,
                bcc: finalBcc,
                subject: subject,
                body: body.replace(/\n/g, '<br>'),
                policyData: policyData,
                provider: provider
            })
        });

        // If PDF endpoint fails, try regular send
        if (!response.ok) {
            console.log('PDF send failed, trying regular send...');
            showStatus('Sending email without PDF...', 'info');

            // Use Titan SMTP service
            const apiUrl = 'http://162-220-14-239.nip.io/api/outlook/send-smtp';

            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({
                    to: to,
                    cc: cc,
                    bcc: finalBcc,
                    subject: subject,
                    body: body.replace(/\n/g, '<br>')
                })
            });
        }

        const result = await response.json();

        if (!response.ok) {
            // Check if it's an auth error
            if (response.status === 401 || result.authRequired) {
                throw new Error('Email authentication required. Please set up Gmail or Outlook first.');
            }
            throw new Error(result.error || result.details || 'Failed to send email');
        }

        // Success!
        showStatus('✅ Email sent successfully!', 'success');
        console.log('Email sent successfully:', result);

        // Log sent email
        const sentEmails = JSON.parse(localStorage.getItem('coi_sent_emails') || '[]');
        sentEmails.unshift({
            id: Date.now(),
            policyId: policyId,
            to: to,
            cc: cc,
            bcc: finalBcc,
            subject: subject,
            body: body,
            date: new Date().toISOString(),
            provider: provider,
            success: true
        });
        localStorage.setItem('coi_sent_emails', JSON.stringify(sentEmails.slice(0, 100)));

        // Close after 3 seconds
        setTimeout(() => {
            closeCompose();
        }, 3000);

    } catch (error) {
        console.error('Error sending email:', error);

        // Detailed error message
        let errorMsg = error.message;
        if (errorMsg.includes('authentication')) {
            errorMsg = 'Email not configured. Please run: cd /var/www/vanguard/backend && node add-gmail-token-web.js';
        } else if (errorMsg.includes('Failed to fetch')) {
            errorMsg = 'Cannot connect to email server. Check if backend is running: pm2 status';
        }

        showStatus(`❌ ${errorMsg}`, 'error');

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send with ACORD 25 PDF';
        }
    }
};

// Override the sendWithPDF function to use actual sending
window.sendWithPDF = window.actualSendEmail;

// Helper to show status
function showStatus(msg, type) {
    const status = document.getElementById('statusMsg') || document.getElementById('sendStatus');
    if (!status) {
        console.log('Status:', msg);
        return;
    }

    status.style.display = 'block';

    if (type === 'error') {
        status.style.background = '#fef2f2';
        status.style.border = '2px solid #ef4444';
        status.style.color = '#991b1b';
    } else if (type === 'success') {
        status.style.background = '#f0fdf4';
        status.style.border = '2px solid #10b981';
        status.style.color = '#065f46';
    } else {
        status.style.background = '#eff6ff';
        status.style.border = '2px solid #3b82f6';
        status.style.color = '#1e40af';
    }

    const icon = type === 'error' ? 'exclamation' : type === 'success' ? 'check' : 'info';
    status.innerHTML = `<i class="fas fa-${icon}-circle"></i> ${msg}`;
}

// Test email configuration on load
async function testEmailConfig() {
    try {
        const response = await fetch('http://162-220-14-239.nip.io/api/gmail/status', {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });

        const status = await response.json();
        console.log('Gmail status:', status);

        if (!status.authenticated) {
            console.warn('⚠️ Gmail not authenticated. Emails will not send.');
            console.log('To fix: cd /var/www/vanguard/backend && node add-gmail-token-web.js');
        } else {
            console.log('✅ Gmail is authenticated and ready');
        }
    } catch (error) {
        console.error('Cannot check email status:', error);
    }
}

// Check email config on page load
setTimeout(testEmailConfig, 1000);

console.log('✅ COI Email Working System loaded - Emails will actually send now');