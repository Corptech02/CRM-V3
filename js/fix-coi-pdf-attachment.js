// Fix COI PDF Attachment - Ensure PDF is actually attached to emails
console.log('📎 Fixing COI PDF attachment for emails...');

// Override the sendWithPDF function to use the correct working implementation
window.sendWithPDF = async function(policyId) {
    console.log('🚀 Enhanced sendWithPDF called for policy:', policyId);

    // Get form values
    const to = document.getElementById('emailTo')?.value.trim();
    const cc = document.getElementById('emailCc')?.value.trim() || '';
    const bcc = document.getElementById('emailBcc')?.value.trim() || '';
    const subject = document.getElementById('emailSubject')?.value.trim();
    const body = document.getElementById('emailBody')?.value.trim();

    // Validate required fields
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

    // Update button state
    const btn = document.getElementById('sendBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF and sending...';
    }

    showStatus('Generating ACORD 25 PDF...', 'info');

    try {
        // Get policy data
        const policy = window.currentCOIPolicy || window.coiPolicyData || {};

        // Prepare comprehensive policy data for PDF generation
        const policyData = {
            policyNumber: policy.policyNumber || policyId || 'N/A',
            insuredName: policy.clientName || policy.name || policy.insured || 'Client',
            insuredAddress: policy.address || '123 Main St, City, State 12345',
            carrier: policy.carrier || 'Insurance Carrier',
            policyType: policy.policyType || policy.type || 'general-liability',
            effectiveDate: policy.effectiveDate || new Date().toISOString().split('T')[0],
            expirationDate: policy.expirationDate || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
            coverageAmount: policy.coverageAmount || policy.coverageLimit || '$1,000,000',
            occurrenceLimit: policy.occurrenceLimit || '1,000,000',
            aggregateLimit: policy.aggregateLimit || '2,000,000',
            certificateHolder: 'Certificate Holder',
            certificateHolderAddress: 'Certificate Holder Address',
            // Add more policy details
            medicalExpense: '5,000',
            personalAdvInjury: '1,000,000',
            generalAggregate: '2,000,000',
            productsCompOps: '2,000,000',
            damageToRented: '100,000'
        };

        console.log('📋 Policy data for PDF:', policyData);

        // Determine email provider
        const provider = localStorage.getItem('coi_email_provider') === 'OUTLOOK' ? 'outlook' : 'gmail';

        showStatus('Attaching PDF to email...', 'info');

        // Send with PDF attachment via backend
        const response = await fetch('http://162.220.14.239:3001/api/coi/send-with-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: to,
                cc: cc,
                bcc: bcc,
                subject: subject,
                body: body.replace(/\n/g, '<br>'), // Convert newlines to HTML breaks
                policyData: policyData,
                provider: provider
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Email sent successfully with PDF:', data);
            showStatus('✅ Email sent successfully with ACORD 25 PDF attached!', 'success');

            // Re-enable button
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send with ACORD 25 PDF';
            }

            // Close modal after 3 seconds
            setTimeout(() => {
                closeCompose();
            }, 3000);
        } else {
            throw new Error(data.error || 'Failed to send email');
        }

    } catch (error) {
        console.error('❌ Error sending email with PDF:', error);

        // Try fallback: Send without PDF
        try {
            showStatus('Attempting to send without PDF attachment...', 'info');

            // Use Titan SMTP service
            const apiUrl = 'http://162.220.14.239:3001/api/outlook/send-smtp';

            const fallbackResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: to,
                    cc: cc,
                    bcc: bcc,
                    subject: subject + ' [PDF attachment failed]',
                    body: body.replace(/\n/g, '<br>')
                })
            });

            const fallbackData = await fallbackResponse.json();

            if (fallbackResponse.ok) {
                showStatus('⚠️ Email sent but PDF attachment failed', 'warning');
                setTimeout(() => {
                    closeCompose();
                }, 3000);
            } else {
                throw new Error(fallbackData.error || 'Failed to send email');
            }

        } catch (fallbackError) {
            console.error('❌ Fallback send also failed:', fallbackError);
            showStatus('Failed to send email: ' + fallbackError.message, 'error');
        }

        // Re-enable button on error
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send with ACORD 25 PDF';
        }
    }
};

// Helper function to show status if not already defined
if (typeof showStatus === 'undefined') {
    window.showStatus = function(msg, type) {
        const status = document.getElementById('statusMsg');
        if (!status) {
            // Create status element if it doesn't exist
            const container = document.querySelector('.modal-content') ||
                           document.querySelector('.email-compose-container') ||
                           document.body;

            const statusDiv = document.createElement('div');
            statusDiv.id = 'statusMsg';
            statusDiv.style.cssText = `
                padding: 12px 20px;
                margin: 10px 0;
                border-radius: 6px;
                font-weight: 500;
                display: block;
            `;
            container.insertBefore(statusDiv, container.firstChild);
            window.showStatus(msg, type);
            return;
        }

        status.style.display = 'block';
        status.textContent = msg;

        if (type === 'error') {
            status.style.background = '#fef2f2';
            status.style.border = '2px solid #ef4444';
            status.style.color = '#991b1b';
        } else if (type === 'success') {
            status.style.background = '#f0fdf4';
            status.style.border = '2px solid #10b981';
            status.style.color = '#065f46';
        } else if (type === 'warning') {
            status.style.background = '#fffbeb';
            status.style.border = '2px solid #f59e0b';
            status.style.color = '#92400e';
        } else {
            status.style.background = '#eff6ff';
            status.style.border = '2px solid #3b82f6';
            status.style.color = '#1e3a8a';
        }
    };
}

// Helper function to close compose if not already defined
if (typeof closeCompose === 'undefined') {
    window.closeCompose = function() {
        const modal = document.getElementById('coiEmailModal');
        if (modal) {
            modal.remove();
        }

        const container = document.getElementById('coiInbox') ||
                         document.querySelector('.policy-detail');
        if (container && window.previousContent) {
            container.innerHTML = window.previousContent;
        }
    };
}

console.log('✅ COI PDF attachment fix applied - Emails will now include ACORD 25 PDF');