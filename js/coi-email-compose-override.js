// COI Email Compose Override - AGGRESSIVE override to ensure compose form is used
console.log('🔒 COI Email Compose Override - Enforcing integrated compose');

// Store the compose function
const showCOICompose = function(policyId) {
    console.log('🎯 Intercepted Email COI button click for policy:', policyId);

    // Get policy data
    const policy = window.currentCOIPolicy || {};

    // Find container for compose form
    let container = document.getElementById('coiInbox');

    // If no coiInbox, try other locations
    if (!container) {
        container = document.getElementById('policyDetail') ||
                   document.getElementById('coiRequestDetail') ||
                   document.querySelector('.policy-detail') ||
                   document.querySelector('.coi-detail-view') ||
                   document.querySelector('#acordContainer');
    }

    // If still no container, create modal
    if (!container) {
        createCOIComposeModal(policyId, policy);
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

This certificate evidences the insurance coverage described above and is issued as a matter of information only.

If you have any questions or need additional information, please don't hesitate to contact us.

Best regards,
Vanguard Insurance Team`;

    // Store current content
    window.previousCOIContent = container.innerHTML;

    // Show compose form
    container.innerHTML = `
        <div class="coi-email-compose" style="padding: 20px; max-width: 900px; margin: 0 auto;">
            <div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px; color: white;">
                <button onclick="closeCOICompose()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <h3 style="margin: 0; flex-grow: 1;">Send Certificate of Insurance</h3>
                <i class="fas fa-envelope" style="font-size: 20px;"></i>
            </div>

            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 25px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                <!-- Policy Info -->
                <div style="background: linear-gradient(to right, #f0f9ff, #e0f2fe); padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #0284c7;">
                    <div style="font-size: 14px; color: #0c4a6e;">
                        <strong>📋 Policy:</strong> ${policyNumber} |
                        <strong>👤 Insured:</strong> ${insuredName} |
                        <strong>📎 Attachment:</strong> ACORD 25 PDF
                    </div>
                </div>

                <!-- To Field -->
                <div style="margin-bottom: 20px;">
                    <label style="display: block; color: #1f2937; font-weight: 600; margin-bottom: 8px;">
                        To Email Address <span style="color: #ef4444;">*</span>
                    </label>
                    <input type="email" id="coiTo"
                           style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 15px; transition: border-color 0.2s;"
                           placeholder="recipient@example.com"
                           onfocus="this.style.borderColor='#667eea'"
                           onblur="this.style.borderColor='#e5e7eb'">
                </div>

                <!-- CC Field -->
                <div style="margin-bottom: 20px;">
                    <label style="display: block; color: #1f2937; font-weight: 600; margin-bottom: 8px;">
                        CC (optional)
                    </label>
                    <input type="text" id="coiCc"
                           style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 15px;"
                           placeholder="cc@example.com, another@example.com">
                </div>

                <!-- Subject -->
                <div style="margin-bottom: 20px;">
                    <label style="display: block; color: #1f2937; font-weight: 600; margin-bottom: 8px;">
                        Subject <span style="color: #ef4444;">*</span>
                    </label>
                    <input type="text" id="coiSubject" value="${defaultSubject.replace(/"/g, '&quot;')}"
                           style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 15px;">
                </div>

                <!-- Message -->
                <div style="margin-bottom: 20px;">
                    <label style="display: block; color: #1f2937; font-weight: 600; margin-bottom: 8px;">
                        Message <span style="color: #ef4444;">*</span>
                    </label>
                    <textarea id="coiBody"
                              style="width: 100%; min-height: 300px; padding: 12px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 15px; font-family: inherit; resize: vertical;">${defaultBody}</textarea>
                </div>

                <!-- Quick Options -->
                <div style="margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 6px;">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="sendMeCopy" checked style="width: 18px; height: 18px;">
                            <span style="color: #4b5563;">Send me a copy</span>
                        </label>
                        <span style="margin: 0 10px; color: #d1d5db;">|</span>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="markUrgent" style="width: 18px; height: 18px;">
                            <span style="color: #4b5563;">Mark as urgent</span>
                        </label>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; gap: 12px;">
                    <button onclick="sendCOI('${policyId}')" id="sendBtn"
                            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-paper-plane"></i> Send COI
                    </button>
                    <button onclick="saveCOIDraft('${policyId}')"
                            style="background: white; color: #4b5563; padding: 14px 28px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer;">
                        <i class="fas fa-save"></i> Save Draft
                    </button>
                </div>

                <!-- Status -->
                <div id="coiStatus" style="margin-top: 20px; padding: 12px; border-radius: 6px; display: none;"></div>
            </div>
        </div>
    `;

    // Focus on to field
    setTimeout(() => {
        const toField = document.getElementById('coiTo');
        if (toField) toField.focus();
    }, 100);
};

// Create modal version
function createCOIComposeModal(policyId, policy) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'coiComposeOverlay';
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
        animation: fadeIn 0.3s;
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: #f9fafb;
        border-radius: 12px;
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        animation: slideUp 0.3s;
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `;
    document.head.appendChild(style);

    // Use modal as container
    window.coiModalContainer = modal;
    showCOICompose(policyId);
    const content = document.querySelector('.coi-email-compose');
    if (content) {
        modal.appendChild(content);
    }

    // Close on overlay click
    overlay.onclick = function(e) {
        if (e.target === overlay) {
            closeCOICompose();
        }
    };
}

// Close compose
window.closeCOICompose = function() {
    // Remove modal if exists
    const overlay = document.getElementById('coiComposeOverlay');
    if (overlay) {
        overlay.remove();
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

// Send COI
window.sendCOI = async function(policyId) {
    const to = document.getElementById('coiTo').value.trim();
    const cc = document.getElementById('coiCc').value.trim();
    const subject = document.getElementById('coiSubject').value.trim();
    const body = document.getElementById('coiBody').value.trim();
    const sendCopy = document.getElementById('sendMeCopy').checked;
    const urgent = document.getElementById('markUrgent').checked;

    if (!to) {
        showStatus('Please enter recipient email', 'error');
        return;
    }

    const btn = document.getElementById('sendBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        // Get provider
        const provider = localStorage.getItem('coi_email_provider') === 'OUTLOOK' ? 'outlook' : 'gmail';
        const apiBase = `http://162-220-14-239.nip.io/api/${provider}`;

        // Add urgency marker if needed
        const finalSubject = urgent ? `[URGENT] ${subject}` : subject;

        // Send email
        const response = await fetch(`${apiBase}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify({
                to: to,
                cc: cc,
                bcc: sendCopy ? 'corptech06@gmail.com' : '',
                subject: finalSubject,
                body: body.replace(/\n/g, '<br>')
            })
        });

        if (!response.ok) throw new Error('Failed to send');

        showStatus('✅ COI sent successfully!', 'success');

        setTimeout(() => {
            closeCOICompose();
        }, 2000);

    } catch (error) {
        showStatus('Failed to send: ' + error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send COI';
    }
};

// Save draft
window.saveCOIDraft = function(policyId) {
    const drafts = JSON.parse(localStorage.getItem('coi_drafts') || '[]');
    drafts.push({
        policyId: policyId,
        to: document.getElementById('coiTo').value,
        cc: document.getElementById('coiCc').value,
        subject: document.getElementById('coiSubject').value,
        body: document.getElementById('coiBody').value,
        date: new Date().toISOString()
    });
    localStorage.setItem('coi_drafts', JSON.stringify(drafts));
    showStatus('✅ Draft saved!', 'success');
};

// Show status
function showStatus(msg, type) {
    const status = document.getElementById('coiStatus');
    if (!status) return;

    status.style.display = 'block';
    status.style.background = type === 'error' ? '#fef2f2' : '#f0fdf4';
    status.style.border = `1px solid ${type === 'error' ? '#ef4444' : '#10b981'}`;
    status.style.color = type === 'error' ? '#991b1b' : '#065f46';
    status.innerHTML = msg;
}

// AGGRESSIVE OVERRIDE - Replace all email functions
function overrideAllEmailFunctions() {
    // Override emailACORD
    window.emailACORD = function(policyId) {
        console.log('✅ emailACORD intercepted');
        showCOICompose(policyId);
        return false;
    };

    // Override emailCOI
    window.emailCOI = function(policyId) {
        console.log('✅ emailCOI intercepted');
        showCOICompose(policyId);
        return false;
    };

    // Make them non-configurable
    Object.defineProperty(window, 'emailACORD', {
        value: function(policyId) {
            showCOICompose(policyId);
            return false;
        },
        writable: false,
        configurable: false
    });

    Object.defineProperty(window, 'emailCOI', {
        value: function(policyId) {
            showCOICompose(policyId);
            return false;
        },
        writable: false,
        configurable: false
    });
}

// Apply overrides immediately
overrideAllEmailFunctions();

// Reapply every 500ms to catch late-loading scripts
// setInterval(overrideAllEmailFunctions, 500); // DISABLED - Causing flickering every 500ms

// Also intercept button clicks directly
document.addEventListener('click', function(e) {
    const target = e.target;

    // Check if it's an email button
    if (target.tagName === 'BUTTON' || target.parentElement?.tagName === 'BUTTON') {
        const btn = target.tagName === 'BUTTON' ? target : target.parentElement;
        const onclick = btn.getAttribute('onclick');

        if (onclick && (onclick.includes('emailACORD') || onclick.includes('emailCOI'))) {
            e.preventDefault();
            e.stopPropagation();

            // Extract policy ID from onclick
            const match = onclick.match(/['"]([^'"]+)['"]/);
            const policyId = match ? match[1] : 'unknown';

            console.log('🎯 Button click intercepted for policy:', policyId);
            showCOICompose(policyId);
            return false;
        }
    }
}, true); // Use capture phase

console.log('✅ COI Email Compose Override ACTIVE - All email buttons will show compose form');