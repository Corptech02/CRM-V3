// COI Email Compose System - Integrated compose for sending COI
console.log('📧 COI Email Compose System loaded');

// Override the emailACORD function to show compose form instead of mailto
window.emailACORD = function(policyId) {
    console.log('Opening COI email compose for policy:', policyId);

    // Get policy data
    const policy = window.currentCOIPolicy || {};

    // Show compose form in COI request inbox area
    showCOIEmailCompose(policyId, policy);
};

// Also override emailCOI function
window.emailCOI = function(policyId) {
    window.emailACORD(policyId);
};

// Function to show COI email compose form
function showCOIEmailCompose(policyId, policy) {
    // Find the COI request inbox or main content area
    let container = document.getElementById('coiInbox');

    // If no coiInbox, try to find the policy detail area
    if (!container) {
        container = document.getElementById('policyDetail') ||
                   document.getElementById('coiRequestDetail') ||
                   document.querySelector('.policy-detail') ||
                   document.querySelector('.coi-detail-view');
    }

    // If still no container, create a modal
    if (!container) {
        createCOIEmailModal(policyId, policy);
        return;
    }

    // Prepare email content
    const policyNumber = policy.policyNumber || policyId || 'N/A';
    const insuredName = policy.clientName || policy.insured || 'Client';
    const carrier = policy.carrier || 'Insurance Carrier';
    const policyType = policy.policyType ? policy.policyType.replace(/-/g, ' ').toUpperCase() : 'GENERAL LIABILITY';
    const effectiveDate = policy.effectiveDate || 'N/A';
    const expirationDate = policy.expirationDate || 'N/A';

    const defaultSubject = `Certificate of Insurance - ${insuredName} - Policy ${policyNumber}`;

    const defaultBody = `Dear [Recipient],

Please find attached the Certificate of Insurance (ACORD 25) for the following policy:

POLICY INFORMATION:
• Insured: ${insuredName}
• Policy Number: ${policyNumber}
• Carrier: ${carrier}
• Policy Type: ${policyType}
• Effective Date: ${effectiveDate}
• Expiration Date: ${expirationDate}

This certificate evidences the insurance coverage described above and is issued as a matter of information only. It confers no rights upon the certificate holder and imposes no liability on the insurer.

If you have any questions or need additional information, please don't hesitate to contact us.

Best regards,
Vanguard Insurance Team

--
Vanguard Insurance Agency
Phone: (555) 123-4567
Email: info@vanguardinsurance.com`;

    // Store current content
    window.previousCOIContent = container.innerHTML;

    // Get current email provider
    const provider = typeof getCurrentProvider !== 'undefined' ? getCurrentProvider() : 'GMAIL';
    const providerConfig = typeof EMAIL_PROVIDERS !== 'undefined' ?
        EMAIL_PROVIDERS[provider] :
        { name: 'Email', email: 'corptech06@gmail.com' };

    // Show compose form
    container.innerHTML = `
        <div class="coi-email-compose" style="padding: 20px; max-width: 900px; margin: 0 auto;">
            <div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center;">
                <button class="btn-secondary btn-small" onclick="cancelCOIEmail()">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <h3 style="margin: 0; flex-grow: 1; color: #1f2937;">Send Certificate of Insurance</h3>
                <span style="color: #6b7280; font-size: 14px;">
                    <i class="fas fa-envelope"></i> ${providerConfig.name}
                </span>
            </div>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">

                <!-- Policy Info Bar -->
                <div style="background: #f9fafb; padding: 12px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #374151;">Policy:</strong>
                            <span style="color: #6b7280;">${policyNumber}</span>
                            <span style="margin: 0 10px; color: #d1d5db;">|</span>
                            <strong style="color: #374151;">Insured:</strong>
                            <span style="color: #6b7280;">${insuredName}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; color: #10b981;">
                            <i class="fas fa-paperclip"></i>
                            <span style="font-size: 14px;">ACORD 25 PDF will be attached</span>
                        </div>
                    </div>
                </div>

                <!-- To Field -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 5px;">
                        To: <span style="color: #ef4444;">*</span>
                    </label>
                    <input type="email" id="coiEmailTo"
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;"
                           placeholder="recipient@example.com" required>
                </div>

                <!-- CC Field -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 5px;">
                        CC (optional):
                    </label>
                    <input type="text" id="coiEmailCc"
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;"
                           placeholder="cc1@example.com, cc2@example.com">
                </div>

                <!-- BCC Field -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 5px;">
                        BCC (optional):
                    </label>
                    <input type="text" id="coiEmailBcc"
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;"
                           placeholder="bcc@example.com">
                </div>

                <!-- Subject Field -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 5px;">
                        Subject: <span style="color: #ef4444;">*</span>
                    </label>
                    <input type="text" id="coiEmailSubject" value="${defaultSubject.replace(/"/g, '&quot;')}"
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;" required>
                </div>

                <!-- Message Body -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 5px;">
                        Message: <span style="color: #ef4444;">*</span>
                    </label>
                    <textarea id="coiEmailBody"
                              style="width: 100%; min-height: 350px; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; font-family: inherit; resize: vertical;"
                              required>${defaultBody}</textarea>
                </div>

                <!-- Quick Recipients -->
                <div style="margin-bottom: 20px; padding: 12px; background: #f9fafb; border-radius: 4px; border: 1px solid #e5e7eb;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 10px;">
                        <i class="fas fa-users"></i> Quick Recipients:
                    </label>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        <button onclick="addQuickRecipient('certificates@example.com')"
                                style="padding: 6px 12px; background: white; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-size: 13px;">
                            <i class="fas fa-plus-circle"></i> Certificate Holder
                        </button>
                        <button onclick="addQuickRecipient('vendor@example.com')"
                                style="padding: 6px 12px; background: white; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-size: 13px;">
                            <i class="fas fa-plus-circle"></i> Vendor
                        </button>
                        <button onclick="addQuickRecipient('compliance@example.com')"
                                style="padding: 6px 12px; background: white; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-size: 13px;">
                            <i class="fas fa-plus-circle"></i> Compliance Dept
                        </button>
                        <button onclick="insertCOITemplate('standard')"
                                style="padding: 6px 12px; background: white; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-size: 13px; margin-left: auto;">
                            <i class="fas fa-file-alt"></i> Reset to Template
                        </button>
                    </div>
                </div>

                <!-- Send Options -->
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button class="btn-primary" onclick="sendCOIEmail('${policyId}')" id="sendCOIBtn"
                            style="padding: 12px 24px; font-size: 16px;">
                        <i class="fas fa-paper-plane"></i> Send COI
                    </button>
                    <button class="btn-secondary" onclick="saveCOIDraft('${policyId}')"
                            style="padding: 12px 24px;">
                        <i class="fas fa-save"></i> Save Draft
                    </button>
                    <label style="margin-left: auto; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="sendCopy" checked>
                        <span style="color: #6b7280; font-size: 14px;">Send me a copy</span>
                    </label>
                </div>

                <!-- Status Message -->
                <div id="coiEmailStatus" style="margin-top: 15px; padding: 10px; border-radius: 4px; display: none;"></div>
            </div>

            <!-- Policy Preview -->
            <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="color: #6b7280; font-size: 12px; margin-bottom: 10px;">
                    <strong>Certificate Preview:</strong>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; color: #374151; font-size: 14px;">
                    <div><strong>Policy Number:</strong> ${policyNumber}</div>
                    <div><strong>Carrier:</strong> ${carrier}</div>
                    <div><strong>Type:</strong> ${policyType}</div>
                    <div><strong>Effective:</strong> ${effectiveDate}</div>
                    <div><strong>Expires:</strong> ${expirationDate}</div>
                    <div><strong>Limits:</strong> ${policy.coverageAmount || '$1,000,000'}</div>
                </div>
            </div>
        </div>
    `;

    // Focus on the To field
    setTimeout(() => {
        const toField = document.getElementById('coiEmailTo');
        if (toField) toField.focus();
    }, 100);
}

// Create modal version for when no container is found
function createCOIEmailModal(policyId, policy) {
    // Remove any existing modal
    const existingModal = document.getElementById('coiEmailModal');
    if (existingModal) existingModal.remove();

    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'coiEmailModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    // Create modal content container
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 8px;
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Use the modal content as container
    showCOIEmailCompose(policyId, policy);

    // Move the content to modal
    const composeContent = document.querySelector('.coi-email-compose');
    if (composeContent) {
        modalContent.appendChild(composeContent);
    }
}

// Send COI Email
window.sendCOIEmail = async function(policyId) {
    const to = document.getElementById('coiEmailTo').value.trim();
    const cc = document.getElementById('coiEmailCc').value.trim();
    const bcc = document.getElementById('coiEmailBcc').value.trim();
    const subject = document.getElementById('coiEmailSubject').value.trim();
    const body = document.getElementById('coiEmailBody').value.trim();
    const sendCopy = document.getElementById('sendCopy').checked;

    if (!to) {
        showCOIStatus('Please enter a recipient email address', 'error');
        return;
    }

    if (!subject) {
        showCOIStatus('Please enter a subject', 'error');
        return;
    }

    if (!body) {
        showCOIStatus('Please enter a message', 'error');
        return;
    }

    const sendBtn = document.getElementById('sendCOIBtn');
    const originalBtnText = sendBtn.innerHTML;

    // Show sending state
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        // Get provider configuration
        const provider = typeof getCurrentProvider !== 'undefined' ? getCurrentProvider() : 'GMAIL';
        const config = typeof EMAIL_PROVIDERS !== 'undefined' ?
            EMAIL_PROVIDERS[provider] :
            { apiBase: 'http://162-220-14-239.nip.io/api/gmail' };

        // Add sender to BCC if send copy is checked
        let finalBcc = bcc;
        if (sendCopy) {
            const senderEmail = config.email || 'corptech06@gmail.com';
            finalBcc = finalBcc ? `${finalBcc}, ${senderEmail}` : senderEmail;
        }

        // Convert to HTML format
        const htmlBody = `
            ${body.replace(/\n/g, '<br>')}
            <br><br>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                <strong>Attachment:</strong> ACORD 25 Certificate of Insurance - Policy ${policyId}<br>
                <em>This certificate is issued as a matter of information only and confers no rights upon the certificate holder.</em>
            </div>
        `;

        // Send email via API
        const response = await fetch(`${config.apiBase}/send`, {
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
                body: htmlBody
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send email');
        }

        // Success!
        showCOIStatus('Certificate of Insurance sent successfully!', 'success');

        // Log sent COI
        const sentCOIs = JSON.parse(localStorage.getItem('sent_coi_emails') || '[]');
        sentCOIs.unshift({
            id: Date.now(),
            policyId: policyId,
            to: to,
            cc: cc,
            bcc: finalBcc,
            subject: subject,
            date: new Date().toISOString(),
            provider: provider
        });
        localStorage.setItem('sent_coi_emails', JSON.stringify(sentCOIs.slice(0, 100)));

        // Return to previous view after 2 seconds
        setTimeout(() => {
            cancelCOIEmail();
        }, 2000);

    } catch (error) {
        console.error('Error sending COI:', error);
        showCOIStatus(`Failed to send: ${error.message}`, 'error');

        sendBtn.disabled = false;
        sendBtn.innerHTML = originalBtnText;
    }
};

// Save COI Draft
window.saveCOIDraft = function(policyId) {
    const to = document.getElementById('coiEmailTo').value.trim();
    const cc = document.getElementById('coiEmailCc').value.trim();
    const bcc = document.getElementById('coiEmailBcc').value.trim();
    const subject = document.getElementById('coiEmailSubject').value.trim();
    const body = document.getElementById('coiEmailBody').value.trim();

    const drafts = JSON.parse(localStorage.getItem('coi_email_drafts') || '[]');
    drafts.unshift({
        id: Date.now(),
        policyId: policyId,
        to: to,
        cc: cc,
        bcc: bcc,
        subject: subject,
        body: body,
        date: new Date().toISOString()
    });

    localStorage.setItem('coi_email_drafts', JSON.stringify(drafts.slice(0, 50)));
    showCOIStatus('Draft saved successfully!', 'success');
};

// Cancel COI Email
window.cancelCOIEmail = function() {
    // Check if in modal
    const modal = document.getElementById('coiEmailModal');
    if (modal) {
        modal.remove();
        return;
    }

    // Otherwise restore previous content
    const container = document.getElementById('coiInbox') ||
                     document.getElementById('policyDetail') ||
                     document.querySelector('.policy-detail');

    if (container && window.previousCOIContent) {
        container.innerHTML = window.previousCOIContent;
    }
};

// Add quick recipient
window.addQuickRecipient = function(email) {
    const toField = document.getElementById('coiEmailTo');
    if (toField) {
        if (toField.value) {
            toField.value += ', ' + email;
        } else {
            toField.value = email;
        }
    }
};

// Insert COI template
window.insertCOITemplate = function(type) {
    const bodyField = document.getElementById('coiEmailBody');
    if (!bodyField) return;

    const policy = window.currentCOIPolicy || {};
    const templates = {
        standard: `Dear [Recipient],

Please find attached the Certificate of Insurance (ACORD 25) for the following policy:

POLICY INFORMATION:
• Insured: ${policy.clientName || '[Insured Name]'}
• Policy Number: ${policy.policyNumber || '[Policy Number]'}
• Carrier: ${policy.carrier || '[Carrier]'}
• Policy Type: ${policy.policyType ? policy.policyType.replace(/-/g, ' ').toUpperCase() : '[Policy Type]'}
• Effective Date: ${policy.effectiveDate || '[Effective Date]'}
• Expiration Date: ${policy.expirationDate || '[Expiration Date]'}

This certificate evidences the insurance coverage described above and is issued as a matter of information only.

Best regards,
Vanguard Insurance Team`
    };

    bodyField.value = templates[type] || templates.standard;
};

// Show status message
function showCOIStatus(message, type) {
    const statusDiv = document.getElementById('coiEmailStatus');
    if (!statusDiv) return;

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };

    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle'
    };

    statusDiv.style.display = 'block';
    statusDiv.style.background = type === 'error' ? '#fef2f2' : '#f0fdf4';
    statusDiv.style.border = `1px solid ${colors[type] || colors.info}`;
    statusDiv.style.color = colors[type] || colors.info;

    statusDiv.innerHTML = `
        <i class="fas fa-${icons[type] || icons.info}"></i>
        <span style="margin-left: 8px;">${message}</span>
    `;

    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

console.log('✅ COI Email Compose System active - Email COI button now shows integrated compose form');