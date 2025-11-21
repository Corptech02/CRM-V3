// ACORD 25 Overlay - Adds Grant Corp text overlay on the PDF
console.log('📝 ACORD 25 Overlay Module Loading...');

// Override the prepareCOI function to add overlay
const originalPrepareCOI = window.prepareCOI;
window.prepareCOI = function(policyId) {
    console.log('Preparing COI with overlay for policy:', policyId);

    // Get the policy viewer element
    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) {
        console.error('Policy viewer not found');
        return;
    }

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

    // Get client data if available
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const client = clients.find(c => c.id === policy.clientId) || {};

    // Create the ACORD 25 display with embedded PDF and overlay
    policyViewer.innerHTML = `
        <div class="acord-container" style="height: 100%; display: flex; flex-direction: column; background: white;">
            <!-- Header with actions -->
            <div class="acord-header" style="padding: 20px; background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div>
                    <h2 style="margin: 0; font-size: 24px; font-weight: 600;">
                        <i class="fas fa-file-contract"></i> ACORD 25 Certificate of Insurance
                    </h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">
                        Policy: ${policy.policyNumber || 'N/A'} | ${policy.carrier || 'N/A'}
                    </p>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button onclick="toggleOverlay()" class="btn-secondary" style="background: white; color: #0066cc; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-eye"></i> Toggle Prefill
                    </button>
                    <button onclick="downloadACORD()" class="btn-secondary" style="background: white; color: #0066cc; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button onclick="printACORD()" class="btn-secondary" style="background: white; color: #0066cc; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button onclick="emailACORD('${policyId}')" class="btn-primary" style="background: rgba(255,255,255,0.2); border: 2px solid white; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-envelope"></i> Email COI
                    </button>
                    <button onclick="backToPolicyView('${policyId}')" class="btn-secondary" style="background: rgba(255,255,255,0.1); border: 2px solid white; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                </div>
            </div>

            <!-- PDF Viewer with Overlay -->
            <div class="pdf-container" style="flex: 1; padding: 0; background: #f3f4f6; overflow: auto; position: relative;">
                <div style="width: 100%; height: 100%; background: white; overflow: hidden; min-height: 1000px; position: relative;">
                    <!-- PDF Embed -->
                    <embed
                        id="acordPdfEmbed"
                        src="ACORD_25_fillable.pdf#view=FitH&toolbar=1&navpanes=0&scrollbar=1&zoom=125"
                        type="application/pdf"
                        width="100%"
                        height="100%"
                        style="min-height: 1000px;">

                    <!-- Overlay for prefilled text -->
                    <div id="acordOverlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;">
                        <!-- Authorized Representative - Grant Corp (bottom right) -->
                        <div style="position: absolute; bottom: 110px; right: 280px; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; color: #000; pointer-events: none;">
                            Grant Corp
                        </div>

                        <!-- Producer Information (top left area) -->
                        <div style="position: absolute; top: 185px; left: 65px; font-family: Arial, sans-serif; font-size: 10px; color: #000; pointer-events: none;">
                            <div style="margin-bottom: 2px;">Vanguard Insurance Agency</div>
                            <div style="margin-bottom: 2px;">123 Insurance Blvd, Suite 100</div>
                            <div style="margin-bottom: 2px;">New York, NY 10001</div>
                        </div>

                        <!-- Producer Contact (next column) -->
                        <div style="position: absolute; top: 185px; left: 260px; font-family: Arial, sans-serif; font-size: 10px; color: #000; pointer-events: none;">
                            <div style="margin-bottom: 2px;">Phone: (555) 123-4567</div>
                            <div style="margin-bottom: 2px;">Fax: (555) 123-4568</div>
                            <div style="margin-bottom: 2px;">Email: coi@vanguard.com</div>
                        </div>

                        <!-- Insured Name (if available) -->
                        ${client.name || policy.clientName ? `
                        <div style="position: absolute; top: 305px; left: 65px; font-family: Arial, sans-serif; font-size: 10px; font-weight: bold; color: #000; pointer-events: none;">
                            ${client.name || policy.clientName}
                        </div>
                        ` : ''}

                        <!-- Insured Address (if available) -->
                        ${client.address ? `
                        <div style="position: absolute; top: 322px; left: 65px; font-family: Arial, sans-serif; font-size: 10px; color: #000; pointer-events: none;">
                            ${client.address}
                        </div>
                        ` : ''}

                        <!-- Insurance Company Name -->
                        ${policy.carrier ? `
                        <div style="position: absolute; top: 435px; left: 385px; font-family: Arial, sans-serif; font-size: 10px; color: #000; pointer-events: none;">
                            ${policy.carrier}
                        </div>
                        ` : ''}

                        <!-- Policy Number -->
                        ${policy.policyNumber ? `
                        <div style="position: absolute; top: 550px; left: 530px; font-family: Arial, sans-serif; font-size: 9px; color: #000; pointer-events: none;">
                            ${policy.policyNumber}
                        </div>
                        ` : ''}

                        <!-- Effective Date -->
                        ${policy.effectiveDate ? `
                        <div style="position: absolute; top: 550px; left: 640px; font-family: Arial, sans-serif; font-size: 9px; color: #000; pointer-events: none;">
                            ${policy.effectiveDate}
                        </div>
                        ` : ''}

                        <!-- Expiration Date -->
                        ${policy.expirationDate ? `
                        <div style="position: absolute; top: 550px; left: 720px; font-family: Arial, sans-serif; font-size: 9px; color: #000; pointer-events: none;">
                            ${policy.expirationDate}
                        </div>
                        ` : ''}

                        <!-- Today's Date (top right) -->
                        <div style="position: absolute; top: 135px; right: 80px; font-family: Arial, sans-serif; font-size: 10px; color: #000; pointer-events: none;">
                            ${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Status Bar -->
            <div style="padding: 15px 20px; background: white; border-top: 1px solid #e5e7eb; display: flex; justify-content: between; align-items: center;">
                <div style="flex: 1;">
                    <span style="color: #6b7280; font-size: 14px;">
                        <i class="fas fa-info-circle"></i>
                        ACORD 25 (2016/03) - Prefilled with Grant Corp as Authorized Representative
                    </span>
                </div>
                <div style="display: flex; gap: 20px; align-items: center;">
                    <span style="color: #10b981; font-size: 14px;">
                        <i class="fas fa-check-circle"></i> Prefilled & Ready
                    </span>
                </div>
            </div>
        </div>
    `;

    // Store current policy for form filling
    window.currentCOIPolicy = policy;

    console.log('✅ ACORD form displayed with Grant Corp overlay');
};

// Toggle overlay visibility
window.toggleOverlay = function() {
    const overlay = document.getElementById('acordOverlay');
    if (overlay) {
        if (overlay.style.display === 'none') {
            overlay.style.display = 'block';
            console.log('Overlay shown');
        } else {
            overlay.style.display = 'none';
            console.log('Overlay hidden');
        }
    }
};

// The rest of the functions remain the same
window.downloadACORD = function() {
    const link = document.createElement('a');
    link.href = 'ACORD_25_fillable.pdf';
    link.download = 'ACORD_25_Certificate.pdf';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 100);
};

window.printACORD = function() {
    const embed = document.getElementById('acordPdfEmbed');
    if (embed && embed.contentWindow) {
        embed.contentWindow.print();
    } else {
        const printWindow = window.open('ACORD_25_fillable.pdf', '_blank');
        if (printWindow) {
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    }
};

window.emailACORD = function(policyId) {
    const policy = window.currentCOIPolicy;
    const subject = `Certificate of Insurance - Policy ${policy.policyNumber || policyId}`;
    const body = `Please find attached the Certificate of Insurance for policy ${policy.policyNumber || policyId}.

Policy Details:
- Carrier: ${policy.carrier || 'N/A'}
- Type: ${policy.policyType ? policy.policyType.replace(/-/g, ' ').toUpperCase() : 'N/A'}
- Effective: ${policy.effectiveDate || 'N/A'} to ${policy.expirationDate || 'N/A'}

Authorized Representative: Grant Corp

Note: Please download and attach the ACORD 25 PDF to this email.`;

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

window.backToPolicyView = function(policyId) {
    const policyLinks = document.querySelectorAll('.policy-item');
    policyLinks.forEach(link => {
        if (link.textContent.includes(policyId)) {
            link.click();
            return;
        }
    });

    if (window.showCOIPolicyProfile) {
        window.showCOIPolicyProfile(policyId);
    }
};

console.log('✅ ACORD 25 Overlay Ready - Grant Corp automatically appears as Authorized Representative');