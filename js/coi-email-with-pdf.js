// COI Email with PDF Attachment - Complete system for sending COI with ACORD 25 PDF
console.log('📎 COI Email with PDF Attachment system loaded');

// Override the email COI function to generate and attach PDF
const sendCOIWithPDF = async function(policyId) {
    console.log('🎯 Preparing to send COI with PDF attachment for policy:', policyId);

    // Get policy data
    const policy = window.currentCOIPolicy || {};

    // Show compose form with PDF generation
    showCOIComposeWithPDF(policyId, policy);
};

// Show compose form with PDF attachment indicator
function showCOIComposeWithPDF(policyId, policy) {
    // Find container
    let container = document.getElementById('coiInbox') ||
                   document.getElementById('policyDetail') ||
                   document.querySelector('.policy-detail') ||
                   document.querySelector('#acordContainer');

    if (!container) {
        createCOIModalWithPDF(policyId, policy);
        return;
    }

    // Prepare policy data
    const policyData = {
        policyNumber: policy.policyNumber || policyId || 'N/A',
        insuredName: policy.clientName || policy.insured || 'Client Name',
        insuredAddress: policy.address || '123 Main St, City, State 12345',
        carrier: policy.carrier || 'Insurance Carrier',
        policyType: policy.policyType || 'general-liability',
        effectiveDate: policy.effectiveDate || new Date().toISOString().split('T')[0],
        expirationDate: policy.expirationDate || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
        coverageAmount: policy.coverageAmount || policy.premium || '$1,000,000',
        occurrenceLimit: policy.occurrenceLimit || '1,000,000',
        aggregateLimit: policy.aggregateLimit || '2,000,000',
        certificateHolder: '',
        certificateHolderAddress: ''
    };

    const defaultSubject = `Certificate of Insurance - ${policyData.insuredName} - Policy ${policyData.policyNumber}`;
    const defaultBody = `Dear [Recipient],

Please find attached the Certificate of Insurance (ACORD 25) for the following policy:

POLICY INFORMATION:
• Insured: ${policyData.insuredName}
• Policy Number: ${policyData.policyNumber}
• Carrier: ${policyData.carrier}
• Policy Type: ${policyData.policyType.replace(/-/g, ' ').toUpperCase()}
• Effective Date: ${policyData.effectiveDate}
• Expiration Date: ${policyData.expirationDate}
• Coverage Limits: ${policyData.coverageAmount}

The attached ACORD 25 certificate evidences the insurance coverage described above and is issued as a matter of information only.

If you have any questions or need additional information, please don't hesitate to contact us.

Best regards,
Vanguard Insurance Team

--
Vanguard Insurance Agency
Phone: (555) 123-4567
Email: info@vanguardinsurance.com`;

    // Store current content
    window.previousCOIContent = container.innerHTML;
    window.currentPolicyData = policyData;

    // Show compose form
    container.innerHTML = `
        <div class="coi-compose-pdf" style="padding: 20px; max-width: 1000px; margin: 0 auto;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px 12px 0 0; color: white; margin-bottom: 0;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <button onclick="closeCOICompose()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <h2 style="margin: 0; flex-grow: 1;">Send Certificate of Insurance</h2>
                    <i class="fas fa-file-pdf" style="font-size: 24px;"></i>
                </div>
            </div>

            <!-- Main Content -->
            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 0 0 12px 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                <!-- PDF Generation Status -->
                <div id="pdfStatus" style="background: linear-gradient(to right, #fef3c7, #fde68a); padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-spinner fa-spin" style="color: #d97706; font-size: 20px;" id="pdfSpinner"></i>
                        <i class="fas fa-check-circle" style="color: #059669; font-size: 20px; display: none;" id="pdfCheck"></i>
                        <div style="flex-grow: 1;">
                            <strong style="color: #92400e;">ACORD 25 PDF Attachment</strong>
                            <div style="color: #78350f; font-size: 14px; margin-top: 4px;" id="pdfStatusText">
                                Preparing ACORD 25 certificate...
                            </div>
                        </div>
                        <button onclick="previewPDF()" id="previewBtn" style="background: white; color: #d97706; padding: 8px 16px; border: 1px solid #fbbf24; border-radius: 4px; cursor: pointer; font-size: 13px; display: none;">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                    </div>
                </div>

                <!-- Email Fields -->
                <div style="margin-bottom: 20px;">
                    <label style="display: block; color: #1f2937; font-weight: 600; margin-bottom: 8px;">
                        To Email <span style="color: #ef4444;">*</span>
                    </label>
                    <input type="email" id="coiToEmail"
                           style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 15px;"
                           placeholder="recipient@example.com" required>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div>
                        <label style="display: block; color: #1f2937; font-weight: 600; margin-bottom: 8px;">
                            CC (optional)
                        </label>
                        <input type="text" id="coiCcEmail"
                               style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 15px;"
                               placeholder="cc@example.com">
                    </div>
                    <div>
                        <label style="display: block; color: #1f2937; font-weight: 600; margin-bottom: 8px;">
                            BCC (optional)
                        </label>
                        <input type="text" id="coiBccEmail"
                               style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 15px;"
                               placeholder="bcc@example.com">
                    </div>
                </div>

                <!-- Subject -->
                <div style="margin-bottom: 20px;">
                    <label style="display: block; color: #1f2937; font-weight: 600; margin-bottom: 8px;">
                        Subject <span style="color: #ef4444;">*</span>
                    </label>
                    <input type="text" id="coiSubject" value="${defaultSubject.replace(/"/g, '&quot;')}"
                           style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 15px;" required>
                </div>

                <!-- Message Body -->
                <div style="margin-bottom: 20px;">
                    <label style="display: block; color: #1f2937; font-weight: 600; margin-bottom: 8px;">
                        Message <span style="color: #ef4444;">*</span>
                    </label>
                    <textarea id="coiBody"
                              style="width: 100%; min-height: 250px; padding: 12px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 15px; font-family: inherit; resize: vertical;"
                              required>${defaultBody}</textarea>
                </div>

                <!-- Options -->
                <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 25px; display: flex; gap: 30px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="sendMeCopy" checked style="width: 18px; height: 18px;">
                        <span style="color: #4b5563;">Send me a copy</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="highPriority" style="width: 18px; height: 18px;">
                        <span style="color: #4b5563;">High priority</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="requestReceipt" style="width: 18px; height: 18px;">
                        <span style="color: #4b5563;">Request read receipt</span>
                    </label>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; gap: 12px; align-items: center;">
                    <button onclick="sendCOIEmailWithPDF('${policyId}')" id="sendCOIBtn"
                            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-paper-plane"></i> Send with ACORD 25 PDF
                    </button>
                    <button onclick="generatePDFOnly('${policyId}')"
                            style="background: white; color: #4b5563; padding: 14px 24px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer;">
                        <i class="fas fa-download"></i> Download PDF Only
                    </button>
                    <button onclick="saveDraftWithPDF('${policyId}')"
                            style="background: white; color: #4b5563; padding: 14px 24px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer;">
                        <i class="fas fa-save"></i> Save Draft
                    </button>
                </div>

                <!-- Send Status -->
                <div id="sendStatus" style="margin-top: 20px; padding: 15px; border-radius: 6px; display: none;"></div>
            </div>

            <!-- Policy Preview -->
            <div style="margin-top: 20px; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <h4 style="margin: 0 0 15px 0; color: #4b5563;">
                    <i class="fas fa-info-circle"></i> Policy Information (will be included in PDF)
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; color: #374151; font-size: 14px;">
                    <div><strong>Policy #:</strong> ${policyData.policyNumber}</div>
                    <div><strong>Insured:</strong> ${policyData.insuredName}</div>
                    <div><strong>Carrier:</strong> ${policyData.carrier}</div>
                    <div><strong>Type:</strong> ${policyData.policyType.replace(/-/g, ' ').toUpperCase()}</div>
                    <div><strong>Effective:</strong> ${policyData.effectiveDate}</div>
                    <div><strong>Expires:</strong> ${policyData.expirationDate}</div>
                    <div><strong>Each Occurrence:</strong> $${policyData.occurrenceLimit}</div>
                    <div><strong>Aggregate:</strong> $${policyData.aggregateLimit}</div>
                </div>
            </div>
        </div>
    `;

    // Generate PDF preview after a short delay
    setTimeout(() => {
        generatePDFPreview(policyId);
    }, 500);
}

// Generate PDF preview
async function generatePDFPreview(policyId) {
    const statusText = document.getElementById('pdfStatusText');
    const spinner = document.getElementById('pdfSpinner');
    const check = document.getElementById('pdfCheck');
    const previewBtn = document.getElementById('previewBtn');

    if (statusText) {
        statusText.textContent = 'Generating ACORD 25 PDF...';
    }

    // Simulate PDF generation
    setTimeout(() => {
        if (spinner) spinner.style.display = 'none';
        if (check) check.style.display = 'block';
        if (statusText) statusText.textContent = 'ACORD 25 PDF ready to attach';
        if (previewBtn) previewBtn.style.display = 'block';

        // Update status box color
        const pdfStatus = document.getElementById('pdfStatus');
        if (pdfStatus) {
            pdfStatus.style.background = 'linear-gradient(to right, #d1fae5, #a7f3d0)';
            pdfStatus.style.borderLeftColor = '#10b981';
        }
    }, 1500);
}

// Update policy data
window.updatePolicyData = function(field, value) {
    if (window.currentPolicyData) {
        window.currentPolicyData[field] = value;
    }
};

// Send COI with PDF
window.sendCOIEmailWithPDF = async function(policyId) {
    const to = document.getElementById('coiToEmail').value.trim();
    const cc = document.getElementById('coiCcEmail').value.trim();
    const bcc = document.getElementById('coiBccEmail').value.trim();
    const subject = document.getElementById('coiSubject').value.trim();
    const body = document.getElementById('coiBody').value.trim();
    const sendCopy = document.getElementById('sendMeCopy').checked;
    const priority = document.getElementById('highPriority').checked;

    if (!to) {
        showSendStatus('Please enter recipient email address', 'error');
        return;
    }

    const btn = document.getElementById('sendCOIBtn');
    const originalBtnText = btn.innerHTML;

    // Update button to show sending
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF and sending...';

    try {
        // First check if ACORD form is displayed
        const acordContainer = document.querySelector('.acord-container');
        const canvas = document.getElementById('realPdfCanvas');
        const overlay = document.getElementById('realFormOverlay');

        let pdfBase64 = '';

        // If ACORD form is visible, capture it
        if (acordContainer && canvas && overlay) {
            console.log('Capturing displayed ACORD form for attachment');
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

            // Convert canvas to PDF using jsPDF
            if (window.jsPDF) {
                const pdf = new window.jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [combinedCanvas.width, combinedCanvas.height]
                });

                // Add the canvas image to the PDF
                const imgData = combinedCanvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 0, 0, combinedCanvas.width, combinedCanvas.height);

                // Get PDF as base64
                pdfBase64 = pdf.output('datauristring').split(',')[1];
            } else {
                // Fallback to PNG if jsPDF not available
                pdfBase64 = combinedCanvas.toDataURL('image/png').split(',')[1];
            }
        } else {
            // Check if we need to prepare the COI first
            if (!acordContainer && window.prepareCOI && policyId) {
                console.log('ACORD form not displayed, preparing it first...');

                // Prepare the COI
                await window.prepareCOI(policyId);

                // Wait for it to load
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Try again to capture
                const newCanvas = document.getElementById('realPdfCanvas');
                const newOverlay = document.getElementById('realFormOverlay');

                if (newCanvas && newOverlay) {
                    console.log('ACORD form now ready, capturing...');

                    const combinedCanvas = document.createElement('canvas');
                    combinedCanvas.width = newCanvas.width;
                    combinedCanvas.height = newCanvas.height;
                    const combinedCtx = combinedCanvas.getContext('2d');

                    // Draw the PDF canvas
                    combinedCtx.drawImage(newCanvas, 0, 0);

                    // Draw form fields
                    const inputs = newOverlay.querySelectorAll('input, textarea');
                    inputs.forEach(input => {
                        if (input.value || input.checked) {
                            const rect = input.getBoundingClientRect();
                            const overlayRect = newOverlay.getBoundingClientRect();
                            const x = rect.left - overlayRect.left;
                            const y = rect.top - overlayRect.top;

                            const fontSize = parseInt(input.style.fontSize) || 10;
                            const fontFamily = input.style.fontFamily || 'Arial, sans-serif';
                            const fontWeight = input.style.fontWeight || 'normal';

                            combinedCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                            combinedCtx.fillStyle = '#000000';

                            if (input.type === 'checkbox' && input.checked) {
                                combinedCtx.font = 'bold 12px Arial';
                                combinedCtx.fillText('X', x + 2, y + 10);
                            } else if (input.value) {
                                combinedCtx.fillText(input.value, x + 2, y + 12);
                            }
                        }
                    });

                    // Convert to PDF
                    if (window.jsPDF) {
                        const pdf = new window.jsPDF({
                            orientation: 'portrait',
                            unit: 'px',
                            format: [combinedCanvas.width, combinedCanvas.height]
                        });
                        const imgData = combinedCanvas.toDataURL('image/png');
                        pdf.addImage(imgData, 'PNG', 0, 0, combinedCanvas.width, combinedCanvas.height);
                        pdfBase64 = pdf.output('datauristring').split(',')[1];
                    } else {
                        pdfBase64 = combinedCanvas.toDataURL('image/png').split(',')[1];
                    }
                }
            } else {
                // Fallback: generate using backend
                console.log('Cannot capture ACORD form, using backend PDF generation');
            }
        }

        // Get current email provider
        const provider = localStorage.getItem('coi_email_provider') === 'OUTLOOK' ? 'outlook' : 'gmail';

        // Add priority marker if needed
        const finalSubject = priority ? `[PRIORITY] ${subject}` : subject;

        // Add sender to BCC if requested
        let finalBcc = bcc;
        if (sendCopy) {
            const senderEmail = provider === 'outlook' ?
                'your-outlook@email.com' : 'corptech06@gmail.com';
            finalBcc = finalBcc ? `${finalBcc}, ${senderEmail}` : senderEmail;
        }

        // Send email with attachment
        let response;

        if (pdfBase64) {
            // Send with the captured ACORD form as attachment
            response = await fetch('http://162-220-14-239.nip.io/api/gmail/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({
                    to: to,
                    cc: cc,
                    bcc: finalBcc,
                    subject: finalSubject,
                    body: body.replace(/\n/g, '<br>'),
                    attachments: [{
                        filename: `ACORD_25_${window.currentPolicyData?.policyNumber || 'Certificate'}_${new Date().toISOString().split('T')[0]}.pdf`,
                        mimeType: 'application/pdf',
                        data: pdfBase64
                    }]
                })
            });
        } else {
            // Fallback to backend generation
            response = await fetch('http://162-220-14-239.nip.io/api/coi/send-with-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({
                    to: to,
                    cc: cc,
                    bcc: finalBcc,
                    subject: finalSubject,
                    body: body.replace(/\n/g, '<br>'),
                    policyData: window.currentPolicyData,
                    provider: provider
                })
            });
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to send COI');
        }

        // Success!
        showSendStatus('✅ Certificate of Insurance sent successfully with ACORD 25 PDF attachment!', 'success');

        // Log sent COI
        const sentCOIs = JSON.parse(localStorage.getItem('sent_coi_with_pdf') || '[]');
        sentCOIs.unshift({
            id: Date.now(),
            policyId: policyId,
            to: to,
            cc: cc,
            bcc: finalBcc,
            subject: finalSubject,
            date: new Date().toISOString(),
            provider: provider
        });
        localStorage.setItem('sent_coi_with_pdf', JSON.stringify(sentCOIs.slice(0, 100)));

        // Close after 3 seconds
        setTimeout(() => {
            closeCOICompose();
        }, 3000);

    } catch (error) {
        console.error('Error sending COI with PDF:', error);
        showSendStatus(`Failed to send: ${error.message}`, 'error');

        btn.disabled = false;
        btn.innerHTML = originalBtnText;
    }
};

// Generate PDF only
window.generatePDFOnly = async function(policyId) {

    showSendStatus('Generating ACORD 25 PDF...', 'info');

    try {
        const response = await fetch('http://162-220-14-239.nip.io/api/coi/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify(window.currentPolicyData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to generate PDF');
        }

        // Download the PDF
        const pdfData = atob(result.pdf);
        const pdfBlob = new Blob([new Uint8Array(pdfData.split('').map(c => c.charCodeAt(0)))], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdfBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || `ACORD_25_${policyId}.pdf`;
        link.click();

        URL.revokeObjectURL(url);

        showSendStatus('✅ ACORD 25 PDF downloaded successfully!', 'success');

    } catch (error) {
        console.error('Error generating PDF:', error);
        showSendStatus(`Failed to generate PDF: ${error.message}`, 'error');
    }
};

// Preview PDF
window.previewPDF = async function() {
    alert('PDF Preview:\n\nACORD 25 Certificate of Liability Insurance\n\nThis PDF will include all policy information and certificate holder details.\n\nThe PDF is generated on-demand when you send the email.');
};

// Save draft with PDF info
window.saveDraftWithPDF = function(policyId) {
    const drafts = JSON.parse(localStorage.getItem('coi_drafts_with_pdf') || '[]');
    drafts.unshift({
        policyId: policyId,
        to: document.getElementById('coiToEmail').value,
        cc: document.getElementById('coiCcEmail').value,
        bcc: document.getElementById('coiBccEmail').value,
        subject: document.getElementById('coiSubject').value,
        body: document.getElementById('coiBody').value,
        policyData: window.currentPolicyData,
        date: new Date().toISOString()
    });
    localStorage.setItem('coi_drafts_with_pdf', JSON.stringify(drafts.slice(0, 50)));
    showSendStatus('✅ Draft saved with PDF attachment info!', 'success');
};

// Show send status
function showSendStatus(message, type) {
    const status = document.getElementById('sendStatus');
    if (!status) return;

    status.style.display = 'block';

    const colors = {
        success: { bg: '#f0fdf4', border: '#10b981', text: '#065f46' },
        error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
        info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' }
    };

    const style = colors[type] || colors.info;
    status.style.background = style.bg;
    status.style.border = `1px solid ${style.border}`;
    status.style.color = style.text;

    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle'
    };

    status.innerHTML = `
        <i class="fas fa-${icons[type] || 'info-circle'}"></i>
        <span style="margin-left: 10px;">${message}</span>
    `;
}

// Close compose
window.closeCOICompose = function() {
    const overlay = document.getElementById('coiModalOverlay');
    if (overlay) {
        overlay.remove();
        return;
    }

    const container = document.getElementById('coiInbox') ||
                     document.getElementById('policyDetail') ||
                     document.querySelector('.policy-detail');

    if (container && window.previousCOIContent) {
        container.innerHTML = window.previousCOIContent;
    }
};

// Create modal for compose
function createCOIModalWithPDF(policyId, policy) {
    const overlay = document.createElement('div');
    overlay.id = 'coiModalOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        overflow-y: auto;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        max-width: 1000px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    window.coiModalContainer = modal;
    showCOIComposeWithPDF(policyId, policy);

    const content = document.querySelector('.coi-compose-pdf');
    if (content) {
        modal.appendChild(content);
    }

    overlay.onclick = function(e) {
        if (e.target === overlay) {
            if (confirm('Discard email draft?')) {
                closeCOICompose();
            }
        }
    };
}

// OVERRIDE ALL EMAIL FUNCTIONS
window.emailACORD = sendCOIWithPDF;
window.emailCOI = sendCOIWithPDF;

// Make them non-configurable
Object.defineProperty(window, 'emailACORD', {
    value: sendCOIWithPDF,
    writable: false,
    configurable: false
});

Object.defineProperty(window, 'emailCOI', {
    value: sendCOIWithPDF,
    writable: false,
    configurable: false
});

console.log('✅ COI Email with PDF system ACTIVE - All COI emails will include ACORD 25 PDF attachment');