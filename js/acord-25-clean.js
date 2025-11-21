// ACORD 25 Clean Display - No embedding, just direct access to PDF
console.log('📄 ACORD 25 Clean Display Loading...');

// Override the prepareCOI function
window.prepareCOI = function(policyId) {
    console.log('Preparing ACORD 25 for policy:', policyId);

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

    // Get client data if available
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const client = clients.find(c => c.id === policy.clientId) || {};

    // Stop any background processes that might interfere
    if (window.stopDashboardRefresh) {
        window.stopDashboardRefresh();
    }

    // Create a clean display without any embedding
    policyViewer.innerHTML = `
        <div class="acord-container" style="height: 100%; background: linear-gradient(to bottom, #f9fafb, #ffffff);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white; padding: 30px;">
                <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 600;">
                    <i class="fas fa-file-contract"></i> ACORD 25 Certificate of Insurance
                </h2>
                <p style="margin: 0; opacity: 0.9;">
                    Generate a Certificate of Liability Insurance for this policy
                </p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px;">
                <!-- Policy Summary Card -->
                <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 30px;">
                    <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                        Policy Information
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Policy Number</label>
                            <p style="margin: 0; font-size: 16px; color: #111827; font-weight: 500;">${policy.policyNumber || 'N/A'}</p>
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Carrier</label>
                            <p style="margin: 0; font-size: 16px; color: #111827; font-weight: 500;">${policy.carrier || 'N/A'}</p>
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Policy Type</label>
                            <p style="margin: 0; font-size: 16px; color: #111827; font-weight: 500;">${policy.policyType ? policy.policyType.replace(/-/g, ' ').toUpperCase() : 'N/A'}</p>
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Insured</label>
                            <p style="margin: 0; font-size: 16px; color: #111827; font-weight: 500;">${client.name || policy.clientName || 'N/A'}</p>
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Effective Date</label>
                            <p style="margin: 0; font-size: 16px; color: #111827; font-weight: 500;">${policy.effectiveDate || 'N/A'}</p>
                        </div>
                        <div>
                            <label style="display: block; font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Expiration Date</label>
                            <p style="margin: 0; font-size: 16px; color: #111827; font-weight: 500;">${policy.expirationDate || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <!-- ACORD Actions Card -->
                <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                        Certificate Options
                    </h3>

                    <!-- Primary Actions -->
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 30px;">
                        <button onclick="window.open('ACORD_25_fillable.pdf', '_blank')" style="flex: 1; min-width: 200px; background: #0066cc; color: white; padding: 16px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s;">
                            <i class="fas fa-file-pdf" style="font-size: 20px;"></i>
                            View ACORD 25 Form
                        </button>

                        <button onclick="downloadACORDForm()" style="flex: 1; min-width: 200px; background: #10b981; color: white; padding: 16px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s;">
                            <i class="fas fa-download" style="font-size: 18px;"></i>
                            Download PDF
                        </button>
                    </div>

                    <!-- Instructions -->
                    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px;">
                        <h4 style="margin: 0 0 15px 0; color: #374151; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-info-circle" style="color: #6b7280;"></i>
                            How to Complete the Certificate
                        </h4>
                        <ol style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
                            <li>Click "View ACORD 25 Form" to open the PDF in your browser</li>
                            <li>Fill in the certificate holder information</li>
                            <li>Verify all policy limits and coverage details</li>
                            <li>Add any additional insured or special provisions</li>
                            <li>Save the completed PDF or print for your records</li>
                            <li>Email or deliver to the certificate holder</li>
                        </ol>
                    </div>

                    <!-- Additional Options -->
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px 0;">Additional Options:</p>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button onclick="printACORDForm()" style="background: white; color: #374151; padding: 10px 20px; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                                <i class="fas fa-print"></i> Print
                            </button>
                            <button onclick="emailCOI('${policyId}')" style="background: white; color: #374151; padding: 10px 20px; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                                <i class="fas fa-envelope"></i> Email Template
                            </button>
                            <button onclick="backToPolicyList()" style="background: white; color: #374151; padding: 10px 20px; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                                <i class="fas fa-arrow-left"></i> Back to Policies
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Store current policy for reference
    window.currentCOIPolicy = policy;
};

// Download function
window.downloadACORDForm = function() {
    const link = document.createElement('a');
    link.href = 'ACORD_25_fillable.pdf';
    link.download = 'ACORD_25_Certificate.pdf';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 100);
};

// Print function
window.printACORDForm = function() {
    window.open('ACORD_25_fillable.pdf', '_blank');
    setTimeout(() => {
        alert('Use your browser\'s print function (Ctrl+P or Cmd+P) to print the PDF.');
    }, 1000);
};

// Email template function
window.emailCOI = function(policyId) {
    const policy = window.currentCOIPolicy;
    if (!policy) return;

    const subject = `Certificate of Insurance - Policy ${policy.policyNumber}`;
    const body = `Dear [Certificate Holder],

Attached please find the Certificate of Insurance as requested.

Policy Details:
- Policy Number: ${policy.policyNumber || 'N/A'}
- Carrier: ${policy.carrier || 'N/A'}
- Policy Type: ${policy.policyType ? policy.policyType.replace(/-/g, ' ').toUpperCase() : 'N/A'}
- Effective Dates: ${policy.effectiveDate || 'N/A'} to ${policy.expirationDate || 'N/A'}

Please let us know if you need any additional information.

Best regards,
Vanguard Insurance Agency`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
};

// Back to policy list
window.backToPolicyList = function() {
    // Try to find and click a policy link
    const policyLinks = document.querySelectorAll('.policy-item');
    if (policyLinks.length > 0) {
        policyLinks[0].click();
    } else if (window.showCOIPolicyProfile) {
        // Fallback to showing first policy
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        if (policies.length > 0) {
            window.showCOIPolicyProfile(policies[0].id || policies[0].policyNumber);
        }
    }
};

// Override all variations to ensure this version is used
window.showRealACORDPDF = window.prepareCOI;
window.realACORDGenerator = window.prepareCOI;
window.generateACORDPDFNow = window.prepareCOI;
window.displayACORD = window.prepareCOI;
window.showACORD = window.prepareCOI;

// Prevent other scripts from overriding
Object.defineProperty(window, 'prepareCOI', {
    value: window.prepareCOI,
    writable: false,
    configurable: false
});

console.log('✅ ACORD 25 Clean Display Ready - Direct PDF access, no embedding');