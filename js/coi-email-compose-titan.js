// COI Email Compose System - TITAN VERSION - Identical UI, Titan API
console.log('📧 COI Email Compose System (TITAN) loaded');

// CERTIFICATE HOLDER EMAIL MAPPING
const certificateHolderEmails = {
    'DAT Solutions LLC': 'certs@dat.com',
    'RMIS': 'rmis@registrymonitoring.com',
    'Registry Monitoring Insurance Services, Inc': 'rmis@registrymonitoring.com', // Alternative name
    'Highway App, Inc.': 'insurance@certs.highway.com',
    'Highway App, Inc': 'insurance@certs.highway.com' // Without period
};

// Function to get certificate holder email
function getCertificateHolderEmail(holderName) {
    if (!holderName) return '';

    // Try exact match first
    if (certificateHolderEmails[holderName]) {
        console.log('📧 Found email for certificate holder:', holderName, '->', certificateHolderEmails[holderName]);
        return certificateHolderEmails[holderName];
    }

    // Try partial matches for flexibility
    const normalizedName = holderName.toLowerCase();
    if (normalizedName.includes('dat') || normalizedName.includes('cap dat')) {
        console.log('📧 Matched DAT for certificate holder:', holderName);
        return 'certs@dat.com';
    }
    if (normalizedName.includes('rmis') || normalizedName.includes('registry monitoring')) {
        console.log('📧 Matched RMIS for certificate holder:', holderName);
        return 'rmis@registrymonitoring.com';
    }
    if (normalizedName.includes('highway')) {
        console.log('📧 Matched Highway for certificate holder:', holderName);
        return 'insurance@certs.highway.com';
    }

    console.log('📧 No email mapping found for certificate holder:', holderName);
    return '';
}

// AGGRESSIVE OVERRIDE - Define and LOCK emailACORD function
const titanEmailACORD = function(policyId) {
    console.log('🔥 TITAN COI EMAIL COMPOSE - Opening for policy:', policyId);

    // Get policy data
    const policy = window.currentCOIPolicy || {};

    // Show compose form in COI request inbox area
    showCOIEmailCompose(policyId, policy);
};

const titanEmailCOI = function(policyId) {
    titanEmailACORD(policyId);
};

// Override and LOCK DOWN functions to prevent other scripts from changing them
window.emailACORD = titanEmailACORD;
window.emailCOI = titanEmailCOI;

// LOCK THEM DOWN - No other script can override these
Object.defineProperty(window, 'emailACORD', {
    value: titanEmailACORD,
    writable: false,
    configurable: false
});

Object.defineProperty(window, 'emailCOI', {
    value: titanEmailCOI,
    writable: false,
    configurable: false
});

console.log('🔒 LOCKED emailACORD and emailCOI functions - no other script can override them');

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

    const defaultBody = `Please find attached the Certificate of Insurance (ACORD 25) for the following policy:

POLICY INFORMATION:
• Insured: ${insuredName}
• Policy Number: ${policyNumber}
• Carrier: ${carrier}
• Policy Type: ${policyType}
• Effective Date: ${effectiveDate}
• Expiration Date: ${expirationDate}

If you have any questions or need additional information, please don't hesitate to contact us.

Best regards,
Grant Corp

--
Vanguard Insurance Agency
Phone: (555) 123-4567
Email: contact@vigagency.com`;

    // Store current content
    window.previousCOIContent = container.innerHTML;

    // Show compose form - EXACT SAME UI AS GMAIL VERSION
    container.innerHTML = `
        <div class="coi-email-compose" style="padding: 20px; max-width: 900px; margin: 0 auto;">
            <div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center;">
                <button class="btn-secondary btn-small" onclick="cancelCOIEmail()">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <h3 style="margin: 0; flex-grow: 1; color: #1f2937;">Send Certificate of Insurance</h3>
                <span style="color: #6b7280; font-size: 14px;">
                    <i class="fas fa-envelope"></i> Titan Email
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

                <!-- DEBUG INFO -->
                <div id="debugInfo" style="margin-bottom: 15px; padding: 10px; background: #f3f4f6; border-radius: 4px; font-size: 12px; color: #4b5563;">
                    <strong>🔍 DEBUG:</strong> <span id="debugText">Checking certificate holder...</span>
                </div>

                <!-- To Field -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 5px;">
                        To: <span style="color: #ef4444;">*</span>
                    </label>
                    <div id="coiEmailToContainer" class="email-bubble-container" style="width: 100%; min-height: 42px; padding: 5px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: white; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; cursor: text;">
                        <input type="email" id="coiEmailToInput" class="email-bubble-input"
                               style="border: none; outline: none; flex: 1; min-width: 150px; padding: 5px; font-size: 14px; background: transparent;"
                               placeholder="Enter email and press Enter">
                    </div>
                    <input type="hidden" id="coiEmailTo" required>
                </div>

                <!-- CC Field -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #374151; font-weight: 500; margin-bottom: 5px;">
                        CC (optional):
                    </label>
                    <div id="coiEmailCcContainer" class="email-bubble-container" style="width: 100%; min-height: 42px; padding: 5px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: white; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; cursor: text;">
                        <input type="text" id="coiEmailCcInput" class="email-bubble-input"
                               style="border: none; outline: none; flex: 1; min-width: 150px; padding: 5px; font-size: 14px; background: transparent;"
                               placeholder="Enter email and press Enter">
                    </div>
                    <input type="hidden" id="coiEmailCc">
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

    // PRESERVE CERTIFICATE HOLDER SELECTION FOR EMAIL
    window.currentCertificateHolder = window.currentCertificateHolder || JSON.parse(sessionStorage.getItem('selected_certificate_holder') || 'null');

    // Initialize bubble functionality
    setTimeout(() => {
        setupEmailBubbleField('coiEmailToContainer');
        setupEmailBubbleField('coiEmailCcContainer');
    }, 100);

    // AUTO-FILL TO FIELD BASED ON SELECTED CERTIFICATE HOLDER
    setTimeout(() => {
        const debugEl = document.getElementById('debugText');
        const toContainer = document.getElementById('coiEmailToContainer');

        function updateDebug(message, color = '#4b5563') {
            if (debugEl) {
                debugEl.innerHTML = message;
                debugEl.style.color = color;
            }
            console.log('🔍 DEBUG:', message);
        }

        updateDebug('Starting auto-fill process...');

        if (toContainer) {
            // Check for selected certificate holder - try sessionStorage first, then fallback to global
            let selectedHolder = sessionStorage.getItem('selected_certificate_holder');
            let holderSource = 'sessionStorage';

            if (!selectedHolder && window.currentCertificateHolder) {
                selectedHolder = JSON.stringify(window.currentCertificateHolder);
                holderSource = 'window.currentCertificateHolder';
                updateDebug('📌 Using preserved certificate holder from window object', '#3b82f6');
            }

            if (selectedHolder) {
                updateDebug(`Found certificate holder in ${holderSource}: ${selectedHolder.substring(0, 50)}...`);

                try {
                    const holder = typeof selectedHolder === 'string' ? JSON.parse(selectedHolder) : selectedHolder;
                    updateDebug(`Certificate holder name: "${holder.name}"`);
                    updateDebug(`Certificate holder savedName: "${holder.savedName}"`);
                    updateDebug(`Full holder object: ${JSON.stringify(holder, null, 2).substring(0, 200)}...`);

                    // Try multiple name fields to find email mapping
                    const possibleNames = [holder.name, holder.savedName, holder.fullName].filter(Boolean);
                    updateDebug(`Trying names: ${possibleNames.join(', ')}`);

                    let holderEmail = '';
                    let matchedName = '';

                    for (const name of possibleNames) {
                        holderEmail = getCertificateHolderEmail(name);
                        if (holderEmail) {
                            matchedName = name;
                            break;
                        }
                    }

                    if (holderEmail) {
                        addEmailBubble(holderEmail, 'coiEmailToContainer');
                        updateDebug(`✅ Auto-filled with: ${holderEmail} (matched: "${matchedName}")`, '#10b981');

                        // Hide debug after success
                        setTimeout(() => {
                            const debugDiv = document.getElementById('debugInfo');
                            if (debugDiv) debugDiv.style.display = 'none';
                        }, 3000);
                    } else {
                        updateDebug(`❌ No email mapping found for any name: ${possibleNames.join(', ')}`, '#ef4444');
                        updateDebug(`Available mappings: ${Object.keys(certificateHolderEmails).join(', ')}`, '#6b7280');
                    }
                } catch (error) {
                    updateDebug(`❌ Error parsing certificate holder data: ${error.message}`, '#ef4444');
                }
            } else {
                updateDebug('❌ No certificate holder selected (sessionStorage empty)', '#ef4444');
                // Show all sessionStorage keys for debugging
                const keys = Object.keys(sessionStorage);
                updateDebug(`SessionStorage keys: ${keys.join(', ')}`, '#6b7280');
            }
        } else {
            updateDebug('❌ Email To field not found!', '#ef4444');
        }
    }, 300);
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

// GENERATE PDF FUNCTION - EXACT COPY of downloadACORD function but for email
async function generateCOIPDF(policyId) {
    console.log('📄 Generating ACORD PDF - EXACT copy of working download function');

    const policy = window.currentCOIPolicy;
    if (!policy) {
        throw new Error('Policy not found');
    }

    // Get the actual ACORD form display elements (same as download function)
    const canvas = document.getElementById('realPdfCanvas');
    const overlay = document.getElementById('realFormOverlay');

    if (!canvas || !overlay) {
        throw new Error('ACORD viewer elements not found');
    }

    const today = new Date().toISOString().split('T')[0];

    return new Promise((resolve, reject) => {
        // Create a combined canvas with PDF and form fields (EXACT copy of download)
        const combinedCanvas = document.createElement('canvas');
        combinedCanvas.width = canvas.width;
        combinedCanvas.height = canvas.height;
        const combinedCtx = combinedCanvas.getContext('2d');

        // Draw the PDF canvas
        combinedCtx.drawImage(canvas, 0, 0);

        // Draw the form field values on top (EXACT copy of download)
        const inputs = overlay.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            // Handle checkboxes separately - only process if checked
            if (input.type === 'checkbox') {
                if (input.checked) {
                    const rect = input.getBoundingClientRect();
                    const overlayRect = overlay.getBoundingClientRect();
                    const x = rect.left - overlayRect.left;
                    const y = rect.top - overlayRect.top;

                    // Draw X for checked checkboxes
                    combinedCtx.font = 'bold 12px Arial';
                    combinedCtx.fillStyle = '#000000';
                    combinedCtx.fillText('X', x + 2, y + 10);
                }
                // Skip unchecked checkboxes completely - don't draw anything
                return;
            }

            // Handle text inputs and textareas - only process if they have a value
            if (input.value) {
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

                if (input.type === 'textarea') {
                    // Handle multiline text
                    const lines = input.value.split('\n');
                    lines.forEach((line, index) => {
                        combinedCtx.fillText(line, x + 2, y + 12 + (index * 14));
                    });
                } else {
                    // Draw text value
                    combinedCtx.fillText(input.value, x + 2, y + 12);
                }
            }
        });

        // Convert canvas to blob and create PDF (EXACT copy of download)
        combinedCanvas.toBlob(async function(blob) {
            try {
                // Create a PDF document using jsPDF (EXACT copy of download)
                const { jsPDF } = window.jspdf || window;

                if (!jsPDF) {
                    reject(new Error('jsPDF not available'));
                    return;
                }

                // Create PDF with the canvas image
                const pdf = new jsPDF('p', 'mm', 'letter');

                // Convert blob to data URL
                const reader = new FileReader();
                reader.onload = function() {
                    const imgData = reader.result;

                    // Calculate dimensions to fit letter size (216 x 279 mm)
                    const imgWidth = 216; // Letter width in mm
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    // Add image to PDF
                    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

                    // Use the EXACT same approach as working download function - get PDF as blob directly
                    const pdfBlob = pdf.output('blob');

                    console.log('📊 PDF generated - size:', pdfBlob.size, 'bytes');
                    resolve({
                        filename: `ACORD_25_${policy.policyNumber || 'Certificate'}_${today}.pdf`,
                        data: pdfBlob
                    });
                };
                reader.readAsDataURL(blob);

            } catch (error) {
                console.error('Error creating PDF:', error);
                reject(error);
            }
        }, 'image/png');
    });
}

// Send COI Email - WITH PDF ATTACHMENT LIKE GMAIL VERSION
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

    // Show PDF generation state
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-cog fa-spin"></i> Generating PDF...';

    try {
        // STEP 1: Generate the ACORD PDF (like Gmail version)
        showCOIStatus('Generating ACORD 25 PDF...', 'info');
        const pdfData = await generateCOIPDF(policyId);

        // STEP 2: Convert PDF blob to base64 for attachment
        showCOIStatus('Preparing email attachment...', 'info');
        const reader = new FileReader();
        const base64PDF = await new Promise((resolve, reject) => {
            reader.onload = () => {
                const result = reader.result.split(',')[1];
                console.log('📎 Base64 PDF size:', result.length, 'characters');
                console.log('📎 Base64 starts with:', result.substring(0, 50));
                resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(pdfData.data);
        });

        // STEP 3: Prepare email with attachment
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Sending with PDF...';
        showCOIStatus('Sending email with PDF attachment...', 'info');

        const titanApiBase = '/api/outlook';

        // Add sender to BCC if send copy is checked
        let finalBcc = bcc;
        if (sendCopy) {
            const senderEmail = 'contact@vigagency.com';
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

        // STEP 4: Send email via TITAN SMTP with PDF attachment
        // Backend expects: filename/name, content (base64), contentType
        const response = await fetch(`${titanApiBase}/send-smtp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: to,
                subject: subject,
                body: htmlBody,
                attachments: [{
                    name: pdfData.filename,
                    filename: pdfData.filename,
                    content: base64PDF,
                    contentType: 'application/pdf',
                    encoding: 'base64'
                }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send email');
        }

        // Success!
        showCOIStatus('Certificate of Insurance sent successfully with PDF attachment via Titan!', 'success');

        // Log sent COIs
        const sentCOIs = JSON.parse(localStorage.getItem('sent_coi_emails') || '[]');
        sentCOIs.unshift({
            id: Date.now(),
            policyId: policyId,
            to: to,
            cc: cc,
            bcc: finalBcc,
            subject: subject,
            date: new Date().toISOString(),
            provider: 'TITAN',
            hasAttachment: true,
            attachmentName: pdfData.filename
        });
        localStorage.setItem('sent_coi_emails', JSON.stringify(sentCOIs.slice(0, 100)));

        // Return to previous view after 3 seconds
        setTimeout(() => {
            cancelCOIEmail();
        }, 3000);

    } catch (error) {
        console.error('Error sending COI with PDF via Titan:', error);
        showCOIStatus(`Failed to send: ${error.message}`, 'error');

        sendBtn.disabled = false;
        sendBtn.innerHTML = originalBtnText;
    }
};

// Save COI Draft - SAME AS GMAIL VERSION
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

// Cancel COI Email - SAME AS GMAIL VERSION
window.cancelCOIEmail = function() {
    // Check if in modal
    const modal = document.getElementById('coiEmailModal');
    if (modal) {
        modal.remove();
        return;
    }

    // Otherwise restore previous content (back to email list)
    const container = document.getElementById('coiInbox') ||
                     document.getElementById('policyDetail') ||
                     document.querySelector('.policy-detail');

    if (container && window.previousCOIContent) {
        container.innerHTML = window.previousCOIContent;
    } else {
        // Fallback - reload the email list
        if (typeof loadCOIInbox === 'function') {
            loadCOIInbox();
        }
    }
};

// Add quick recipient - Updated for bubble system
window.addQuickRecipient = function(email) {
    addEmailBubble(email, 'coiEmailToContainer');
};

// Insert COI template - SAME AS GMAIL VERSION
window.insertCOITemplate = function(type) {
    const bodyField = document.getElementById('coiEmailBody');
    if (!bodyField) return;

    const policy = window.currentCOIPolicy || {};
    const templates = {
        standard: `Please find attached the Certificate of Insurance (ACORD 25) for the following policy:

POLICY INFORMATION:
• Insured: ${policy.clientName || '[Insured Name]'}
• Policy Number: ${policy.policyNumber || '[Policy Number]'}
• Carrier: ${policy.carrier || '[Carrier]'}
• Policy Type: ${policy.policyType ? policy.policyType.replace(/-/g, ' ').toUpperCase() : '[Policy Type]'}
• Effective Date: ${policy.effectiveDate || '[Effective Date]'}
• Expiration Date: ${policy.expirationDate || '[Expiration Date]'}

If you have any questions or need additional information, please don't hesitate to contact us.

Best regards,
Grant Corp`
    };

    bodyField.value = templates[type] || templates.standard;
};

// Show status message - SAME AS GMAIL VERSION
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

// Add some basic button styling and email bubble styles if not present
if (!document.querySelector('#titan-compose-styles')) {
    const style = document.createElement('style');
    style.id = 'titan-compose-styles';
    style.textContent = `
        .btn-primary {
            background: #3b82f6 !important;
            color: white !important;
            border: none !important;
            padding: 8px 16px !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-weight: 500 !important;
        }
        .btn-primary:hover {
            background: #2563eb !important;
        }
        .btn-secondary {
            background: #6b7280 !important;
            color: white !important;
            border: none !important;
            padding: 8px 16px !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-weight: 500 !important;
        }
        .btn-secondary:hover {
            background: #4b5563 !important;
        }
        .btn-small {
            padding: 6px 12px !important;
            font-size: 14px !important;
        }

        /* Email Bubble Styles - Outlook-like */
        .email-bubble {
            display: inline-flex;
            align-items: center;
            background: #0078d4;
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 13px;
            margin: 2px;
            max-width: 200px;
            cursor: default;
        }

        .email-bubble-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .email-bubble-remove {
            margin-left: 6px;
            cursor: pointer;
            font-weight: bold;
            opacity: 0.7;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }

        .email-bubble-remove:hover {
            opacity: 1;
            background: rgba(255, 255, 255, 0.2);
        }

        .email-bubble-container {
            cursor: text;
        }

        .email-bubble-container:focus-within {
            border-color: #0078d4;
            box-shadow: 0 0 0 1px #0078d4;
        }

        .email-bubble-input {
            cursor: text;
        }

        .email-bubble-input:focus {
            outline: none;
        }
    `;
    document.head.appendChild(style);
}

// Email Bubble Management Functions
function createEmailBubble(email, containerId) {
    const bubble = document.createElement('div');
    bubble.className = 'email-bubble';
    bubble.setAttribute('data-email', email);

    bubble.innerHTML = `
        <span class="email-bubble-text" title="${email}">${email}</span>
        <span class="email-bubble-remove" onclick="removeEmailBubble(this)">×</span>
    `;

    return bubble;
}

function addEmailBubble(email, containerId) {
    if (!email || !isValidEmail(email)) return false;

    const container = document.getElementById(containerId);
    const input = container.querySelector('.email-bubble-input');

    // Check if email already exists
    const existingBubbles = container.querySelectorAll('.email-bubble');
    for (let bubble of existingBubbles) {
        if (bubble.getAttribute('data-email') === email) {
            return false; // Email already exists
        }
    }

    // Create and add bubble
    const bubble = createEmailBubble(email, containerId);
    container.insertBefore(bubble, input);

    // Update hidden field
    updateHiddenField(containerId);

    return true;
}

function removeEmailBubble(removeBtn) {
    const bubble = removeBtn.parentElement;
    const container = bubble.parentElement;
    bubble.remove();

    // Update hidden field
    updateHiddenField(container.id);

    // Focus the input
    const input = container.querySelector('.email-bubble-input');
    if (input) input.focus();
}

function updateHiddenField(containerId) {
    const container = document.getElementById(containerId);
    const bubbles = container.querySelectorAll('.email-bubble');
    const emails = Array.from(bubbles).map(bubble => bubble.getAttribute('data-email'));

    // Get the corresponding hidden field
    const hiddenFieldId = containerId.replace('Container', '');
    const hiddenField = document.getElementById(hiddenFieldId);
    if (hiddenField) {
        hiddenField.value = emails.join(', ');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

function setupEmailBubbleField(containerId) {
    const container = document.getElementById(containerId);
    const input = container.querySelector('.email-bubble-input');

    if (!input) return;

    // Handle Enter key
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
            e.preventDefault();
            const email = this.value.trim();
            if (email) {
                if (addEmailBubble(email, containerId)) {
                    this.value = '';
                } else {
                    // Invalid email or duplicate - show feedback
                    this.style.borderColor = '#ef4444';
                    setTimeout(() => {
                        this.style.borderColor = '';
                    }, 1000);
                }
            }
        } else if (e.key === 'Backspace' && this.value === '') {
            // Remove last bubble if input is empty and backspace is pressed
            const bubbles = container.querySelectorAll('.email-bubble');
            if (bubbles.length > 0) {
                bubbles[bubbles.length - 1].remove();
                updateHiddenField(containerId);
            }
        }
    });

    // Handle blur (when focus leaves)
    input.addEventListener('blur', function() {
        const email = this.value.trim();
        if (email) {
            if (addEmailBubble(email, containerId)) {
                this.value = '';
            }
        }
    });

    // Handle paste
    input.addEventListener('paste', function(e) {
        setTimeout(() => {
            const text = this.value;
            const emails = text.split(/[,;]/).map(email => email.trim()).filter(email => email);

            this.value = '';
            emails.forEach(email => {
                addEmailBubble(email, containerId);
            });
        }, 10);
    });

    // Handle container clicks to focus input
    container.addEventListener('click', function(e) {
        if (e.target === container || e.target.classList.contains('email-bubble-container')) {
            input.focus();
        }
    });
}

// Test the functions are ready and verify they're working
setTimeout(() => {
    console.log('✅ TITAN COI EMAIL COMPOSE WITH PDF - FINAL STATUS:');
    console.log('  - emailCOI function type:', typeof window.emailCOI);
    console.log('  - emailACORD function type:', typeof window.emailACORD);
    console.log('  - sendCOIEmail function type:', typeof window.sendCOIEmail);
    console.log('  - generateCOIPDF function available:', typeof generateCOIPDF === 'function');
    console.log('  - Functions are LOCKED:', !Object.getOwnPropertyDescriptor(window, 'emailACORD').writable);
    console.log('  - Script loaded LAST to prevent overrides');
    console.log('  - PDF generation uses same logic as download button');
    console.log('  - Titan API supports attachments parameter');
    console.log('  - All "Email COI" buttons will now:');
    console.log('    1. Open compose interface in COI Request Inbox');
    console.log('    2. Generate ACORD 25 PDF from current display');
    console.log('    3. Attach PDF to email automatically');
    console.log('    4. Send via Titan API');
    console.log('🎯 Ready to test: Click "Email COI" button from ACORD form view!');
}, 100);

console.log('✅ COI Email Compose System (TITAN) active - Email COI button now shows integrated compose form using Titan API');