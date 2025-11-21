// ACORD 25 PDF Display - Opens in new window to bypass iframe issues
console.log('📄 ACORD 25 Window Display Module Loading...');

// Override the prepareCOI function to open PDF in new window
window.prepareCOI = function(policyId) {
    console.log('Opening ACORD 25 for policy:', policyId);

    // Get policy data
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId ||
        String(p.id) === String(policyId)
    );

    if (!policy) {
        console.error('Policy not found:', policyId);
        alert('Policy not found');
        return;
    }

    // Get the policy viewer element
    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) {
        console.error('Policy viewer not found');
        return;
    }

    // Create a display that shows the ACORD form with options
    policyViewer.innerHTML = `
        <div class="acord-container" style="height: 100%; display: flex; flex-direction: column; background: white;">
            <!-- Header with actions -->
            <div class="acord-header" style="padding: 20px; background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">
                    <i class="fas fa-file-contract"></i> ACORD 25 Certificate of Insurance
                </h2>
                <p style="margin: 0 0 15px 0; opacity: 0.9; font-size: 14px;">
                    Policy: ${policy.policyNumber || 'N/A'} | Carrier: ${policy.carrier || 'N/A'}
                </p>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <button onclick="openACORDInNewWindow()" class="btn-primary" style="background: white; color: #0066cc; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 15px;">
                        <i class="fas fa-external-link-alt"></i> Open ACORD Form
                    </button>
                    <button onclick="downloadACORDDirect()" class="btn-secondary" style="background: rgba(255,255,255,0.2); border: 2px solid white; color: white; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-download"></i> Download PDF
                    </button>
                    <button onclick="emailACORD('${policyId}')" class="btn-secondary" style="background: rgba(255,255,255,0.2); border: 2px solid white; color: white; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-envelope"></i> Email COI
                    </button>
                    <button onclick="backToPolicyView('${policyId}')" class="btn-secondary" style="background: rgba(255,255,255,0.1); border: 2px solid white; color: white; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-arrow-left"></i> Back to Policy
                    </button>
                </div>
            </div>

            <!-- Main Content Area -->
            <div style="flex: 1; padding: 40px; background: #f9fafb; text-align: center;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <i class="fas fa-file-pdf" style="font-size: 64px; color: #dc2626; margin-bottom: 20px;"></i>
                        <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 22px;">ACORD 25 Certificate Ready</h3>
                        <p style="color: #6b7280; margin-bottom: 30px; line-height: 1.6;">
                            The ACORD 25 Certificate of Liability Insurance form is ready to view.
                            Click the button below to open the fillable PDF form.
                        </p>

                        <button onclick="openACORDInNewWindow()" style="background: #0066cc; color: white; padding: 16px 32px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; display: inline-flex; align-items: center; gap: 10px;">
                            <i class="fas fa-external-link-alt"></i> Open ACORD 25 Form
                        </button>

                        <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                            <h4 style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">Policy Information</h4>
                            <div style="text-align: left; background: #f3f4f6; padding: 20px; border-radius: 8px;">
                                <div style="display: grid; gap: 10px; font-size: 14px; color: #4b5563;">
                                    <div><strong>Policy Number:</strong> ${policy.policyNumber || 'N/A'}</div>
                                    <div><strong>Carrier:</strong> ${policy.carrier || 'N/A'}</div>
                                    <div><strong>Type:</strong> ${policy.policyType ? policy.policyType.replace(/-/g, ' ').toUpperCase() : 'N/A'}</div>
                                    <div><strong>Effective:</strong> ${policy.effectiveDate || 'N/A'}</div>
                                    <div><strong>Expiration:</strong> ${policy.expirationDate || 'N/A'}</div>
                                    ${policy.premium ? `<div><strong>Premium:</strong> $${parseFloat(policy.premium).toLocaleString()}/yr</div>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Instructions -->
                    <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px; border: 1px solid #fbbf24;">
                        <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-info-circle"></i> How to Complete the ACORD Form
                        </h4>
                        <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #78350f; font-size: 13px; line-height: 1.8; text-align: left;">
                            <li>Click "Open ACORD 25 Form" to view the PDF</li>
                            <li>Fill in the certificate holder information</li>
                            <li>Verify all policy details are correct</li>
                            <li>Save or print the completed certificate</li>
                            <li>Send to the certificate holder as needed</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Store current policy for form filling
    window.currentCOIPolicy = policy;
};

// Function to open ACORD in new window
window.openACORDInNewWindow = function() {
    console.log('Opening ACORD 25 form...');

    // Check for selected certificate holder
    let selectedHolder = null;
    try {
        const holderData = sessionStorage.getItem('selected_certificate_holder');
        if (holderData) {
            selectedHolder = JSON.parse(holderData);
            console.log('Found selected certificate holder:', selectedHolder.name);
        }
    } catch (e) {
        console.warn('Error reading certificate holder data:', e);
    }

    // If we have a certificate holder, try to use the real ACORD viewer instead of static PDF
    if (selectedHolder && typeof window.createRealACORDViewer === 'function') {
        console.log('Using real ACORD viewer with certificate holder data');

        // Store the selected holder for form filling
        window.currentCertificateHolder = selectedHolder;

        // Use the real ACORD viewer which can pre-fill fields
        window.createRealACORDViewer(window.currentCOIPolicy?.policyNumber || window.currentCOIPolicy?.id);
    } else {
        // Fallback to static PDF if no certificate holder selected
        console.log('Opening static PDF - no certificate holder selected');
        const pdfWindow = window.open('ACORD_25_fillable.pdf', '_blank');

        if (!pdfWindow) {
            alert('Please allow popups to view the ACORD 25 form.');
        }
    }
};

// Function to download the ACORD PDF directly
window.downloadACORDDirect = function() {
    // Create a direct download link
    const link = document.createElement('a');
    link.href = 'ACORD_25_fillable.pdf';
    link.download = 'ACORD_25_Certificate.pdf';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Function to email the ACORD
window.emailACORD = function(policyId) {
    const policy = window.currentCOIPolicy;
    if (!policy) {
        alert('Policy data not available');
        return;
    }

    const subject = `Certificate of Insurance - Policy ${policy.policyNumber || policyId}`;
    const body = `Please find attached the Certificate of Insurance for policy ${policy.policyNumber || policyId}.\\n\\nPolicy Type: ${policy.policyType ? policy.policyType.replace(/-/g, ' ').toUpperCase() : 'N/A'}\\nCarrier: ${policy.carrier || 'N/A'}\\nEffective: ${policy.effectiveDate || 'N/A'} to ${policy.expirationDate || 'N/A'}`;

    // Try to open email client
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    alert('Note: Please attach the ACORD 25 PDF to your email before sending.');
};

// Function to go back to policy view
window.backToPolicyView = function(policyId) {
    // Find and click the policy in the list to go back
    const policyLinks = document.querySelectorAll('.policy-item');
    policyLinks.forEach(link => {
        if (link.textContent.includes(policyId)) {
            link.click();
            return;
        }
    });

    // Fallback - reload the policy view
    if (window.showCOIPolicyProfile) {
        window.showCOIPolicyProfile(policyId);
    }
};

// Ensure the function is globally available and overrides others
window.showRealACORDPDF = window.prepareCOI;
window.realACORDGenerator = window.prepareCOI;
window.generateACORDPDFNow = window.prepareCOI;
window.displayACORD = window.prepareCOI;

// Force override continuously to prevent other scripts from taking over
const enforceACORDDisplay = setInterval(() => {
    if (window.prepareCOI !== window.prepareCOI) {
        console.log('Re-enforcing ACORD display');
    }
}, 500);

console.log('✅ ACORD 25 Window Display Ready - Opens PDF in new window');