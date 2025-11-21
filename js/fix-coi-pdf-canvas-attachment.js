// Fix COI PDF Canvas Attachment - Use actual ACORD form canvas for email
console.log('🎯 Fixing COI email to use actual ACORD form canvas...');

// Function to capture the actual ACORD form as displayed
async function captureACORDCanvas() {
    console.log('📸 Capturing actual ACORD form canvas...');

    // Get the actual ACORD form display elements
    const canvas = document.getElementById('realPdfCanvas');
    const overlay = document.getElementById('realFormOverlay');

    if (!canvas || !overlay) {
        console.error('ACORD viewer elements not found');
        throw new Error('ACORD form not loaded');
    }

    // Create a combined canvas with PDF and form fields
    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = canvas.width;
    combinedCanvas.height = canvas.height;
    const combinedCtx = combinedCanvas.getContext('2d');

    // Draw the PDF canvas
    combinedCtx.drawImage(canvas, 0, 0);

    // Draw the form field values on top
    const inputs = overlay.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        if (input.value || input.checked) {
            const rect = input.getBoundingClientRect();
            const overlayRect = overlay.getBoundingClientRect();
            const x = rect.left - overlayRect.left;
            const y = rect.top - overlayRect.top;

            // Set proper font
            const fontSize = parseInt(input.style.fontSize) || 10;
            const fontFamily = input.style.fontFamily || 'Arial, sans-serif';
            const fontWeight = input.style.fontWeight || 'normal';

            combinedCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
            combinedCtx.fillStyle = '#000000';

            if (input.type === 'checkbox' && input.checked) {
                // Draw X for checked checkboxes
                combinedCtx.font = 'bold 12px Arial';
                combinedCtx.fillText('X', x + 2, y + 10);
            } else if (input.type === 'textarea') {
                // Handle multiline text
                const lines = input.value.split('\n');
                lines.forEach((line, index) => {
                    combinedCtx.fillText(line, x + 2, y + 12 + (index * 14));
                });
            } else if (input.value) {
                // Draw text value
                combinedCtx.fillText(input.value, x + 2, y + 12);
            }
        }
    });

    // Convert canvas to base64
    return new Promise((resolve) => {
        combinedCanvas.toBlob(function(blob) {
            const reader = new FileReader();
            reader.onloadend = function() {
                // Remove data:image/png;base64, prefix
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.readAsDataURL(blob);
        }, 'image/png');
    });
}

// Override the sendWithPDF function to use canvas capture
window.sendWithPDF = async function(policyId) {
    console.log('🚀 Sending email with actual ACORD form canvas capture...');

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
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Capturing form and sending...';
    }

    showStatus('Capturing ACORD 25 form...', 'info');

    try {
        // Capture the actual ACORD canvas
        const canvasBase64 = await captureACORDCanvas();

        showStatus('Attaching form to email...', 'info');

        // Get policy data
        const policy = window.currentCOIPolicy || window.coiPolicyData || {};
        const policyNumber = policy.policyNumber || policyId || 'COI';

        // Determine email provider
        const provider = localStorage.getItem('coi_email_provider') === 'OUTLOOK' ? 'outlook' : 'gmail';

        // Send with actual canvas capture as attachment
        const response = await fetch('http://162.220.14.239:3001/api/coi/send-with-canvas', {
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
                attachment: {
                    filename: `ACORD_25_${policyNumber}_${new Date().toISOString().split('T')[0]}.png`,
                    mimeType: 'image/png',
                    data: canvasBase64
                },
                provider: provider
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Email sent successfully with actual ACORD form:', data);
            showStatus('✅ Email sent successfully with ACORD 25 form attached!', 'success');

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
        console.error('❌ Error sending email with canvas:', error);

        // Fallback: Try to send with generated PDF
        try {
            showStatus('Attempting alternative method...', 'info');

            // Get policy data for fallback
            const policy = window.currentCOIPolicy || window.coiPolicyData || {};
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
                certificateHolder: document.getElementById('certHolder')?.value || 'Certificate Holder',
                certificateHolderAddress: document.getElementById('certAddress')?.value || 'Certificate Holder Address'
            };

            const provider = localStorage.getItem('coi_email_provider') === 'OUTLOOK' ? 'outlook' : 'gmail';

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
                    body: body.replace(/\n/g, '<br>'),
                    policyData: policyData,
                    provider: provider
                })
            });

            const data = await response.json();

            if (response.ok) {
                showStatus('✅ Email sent successfully!', 'success');
                setTimeout(() => {
                    closeCompose();
                }, 3000);
            } else {
                throw new Error(data.error || 'Failed to send email');
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

console.log('✅ COI Canvas attachment fix applied - Emails will now include actual ACORD form');