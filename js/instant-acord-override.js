// INSTANT REAL ACORD - Immediately replaces prepareCOI on page load
console.log('🚀 INSTANT ACORD OVERRIDE LOADING...');

// Load jsPDF immediately
if (!document.querySelector('script[src*="jspdf"]')) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
        console.log('✅ jsPDF library loaded');
        window.jsPDF = window.jspdf.jsPDF;
    };
    document.head.appendChild(script);
}

// Define the REAL prepareCOI that shows immediately
function showRealACORD(policyId) {
    console.log('🎯 SHOWING REAL ACORD FORM for policy:', policyId);

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
        String(p.policyNumber) === String(policyId) ||
        String(p.id) === String(policyId)
    );

    if (!policy) {
        alert('Policy not found');
        return;
    }

    const insuredName = policy.clientName ||
                       policy.insured?.['Name/Business Name'] ||
                       policy.insured?.['Primary Named Insured'] ||
                       'Unknown';
    const policyNumber = policy.policyNumber || policy.id;
    const carrier = policy.carrier || policy.overview?.['Carrier'] || 'N/A';
    const effectiveDate = policy.effectiveDate || policy.overview?.['Effective Date'] || '';
    const expirationDate = policy.expirationDate || policy.overview?.['Expiration Date'] || '';

    // IMMEDIATELY show the real ACORD form
    policyViewer.innerHTML = `
        <div style="padding: 20px; background: white;">
            <!-- Big Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="margin: 0; font-size: 32px;">
                            <i class="fas fa-file-pdf"></i> Real ACORD® 25 Certificate
                        </h1>
                        <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.95;">Official Certificate of Liability Insurance Generator</p>
                    </div>
                    <button onclick="backToPolicyList()"
                            style="background: white; color: #667eea; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px;">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                </div>
            </div>

            <!-- Success Message -->
            <div style="background: #d4edda; border-left: 5px solid #28a745; padding: 20px; margin-bottom: 25px; border-radius: 5px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i class="fas fa-check-circle" style="font-size: 32px; color: #28a745;"></i>
                    <div>
                        <h3 style="margin: 0; color: #155724;">Real ACORD Form Ready!</h3>
                        <p style="margin: 5px 0 0 0; color: #155724;">Fill in the certificate holder information below and generate the official PDF.</p>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <!-- Left Side - Input Form -->
                <div>
                    <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; border: 2px solid #007bff;">
                        <h2 style="margin: 0 0 25px 0; color: #007bff; font-size: 24px;">
                            <i class="fas fa-edit"></i> Certificate Holder Details
                        </h2>

                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 10px; font-weight: bold; font-size: 16px; color: #333;">
                                Certificate Holder Name <span style="color: red;">*</span>
                            </label>
                            <input type="text" id="acord-cert-name"
                                   style="width: 100%; padding: 15px; border: 3px solid #007bff; border-radius: 8px; font-size: 16px;"
                                   placeholder="Enter company name requesting certificate"
                                   autofocus>
                        </div>

                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 10px; font-weight: bold; font-size: 16px; color: #333;">
                                Certificate Holder Address <span style="color: red;">*</span>
                            </label>
                            <textarea id="acord-cert-address" rows="4"
                                      style="width: 100%; padding: 15px; border: 3px solid #007bff; border-radius: 8px; font-size: 16px; font-family: inherit;"
                                      placeholder="123 Main Street&#10;Suite 100&#10;City, State 12345"></textarea>
                        </div>

                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 10px; font-weight: bold; font-size: 16px; color: #333;">
                                Description of Operations
                            </label>
                            <textarea id="acord-cert-desc" rows="3"
                                      style="width: 100%; padding: 15px; border: 2px solid #ced4da; border-radius: 8px; font-size: 16px; font-family: inherit;">Certificate holder is listed as additional insured with respect to general liability arising out of operations performed by the named insured.</textarea>
                        </div>

                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 2px solid #ffc107;">
                            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; font-size: 16px;">
                                <input type="checkbox" id="acord-additional-insured" checked
                                       style="width: 24px; height: 24px; cursor: pointer;">
                                <span style="font-weight: 500; color: #856404;">Certificate Holder is Additional Insured</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Right Side - Policy Info -->
                <div>
                    <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 25px; border-radius: 10px;">
                        <h2 style="margin: 0 0 25px 0; color: #1565c0; font-size: 24px;">
                            <i class="fas fa-file-contract"></i> Policy Information
                        </h2>

                        <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0;">
                                <div style="color: #757575; font-size: 14px; margin-bottom: 5px;">INSURED NAME</div>
                                <div style="font-size: 20px; font-weight: bold; color: #1565c0;">${insuredName}</div>
                            </div>

                            <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0;">
                                <div style="color: #757575; font-size: 14px; margin-bottom: 5px;">POLICY NUMBER</div>
                                <div style="font-size: 20px; font-weight: bold; color: #333;">${policyNumber}</div>
                            </div>

                            <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0;">
                                <div style="color: #757575; font-size: 14px; margin-bottom: 5px;">INSURANCE CARRIER</div>
                                <div style="font-size: 20px; font-weight: bold; color: #333;">${carrier}</div>
                            </div>

                            <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0;">
                                <div style="color: #757575; font-size: 14px; margin-bottom: 5px;">POLICY PERIOD</div>
                                <div style="font-size: 18px; color: #333;">
                                    <i class="fas fa-calendar-alt" style="color: #1565c0;"></i> ${effectiveDate} to ${expirationDate}
                                </div>
                            </div>

                            <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0;">
                                <div style="color: #757575; font-size: 14px; margin-bottom: 5px;">COVERAGE TYPE</div>
                                <div style="font-size: 18px; color: #333;">${policy.policyType || 'Commercial Auto'}</div>
                            </div>

                            ${policy.coverage?.['Liability Limit'] || policy.coverage?.['Combined Single Limit'] ? `
                            <div style="margin-bottom: 20px;">
                                <div style="color: #757575; font-size: 14px; margin-bottom: 5px;">LIABILITY LIMIT</div>
                                <div style="font-size: 22px; font-weight: bold; color: #28a745;">
                                    ${policy.coverage?.['Liability Limit'] || policy.coverage?.['Combined Single Limit']}
                                </div>
                            </div>` : ''}

                            ${policy.coverage?.['Cargo Limit'] ? `
                            <div>
                                <div style="color: #757575; font-size: 14px; margin-bottom: 5px;">CARGO COVERAGE</div>
                                <div style="font-size: 22px; font-weight: bold; color: #28a745;">
                                    ${policy.coverage['Cargo Limit']}
                                </div>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Big Generate Button -->
            <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 3px solid #e0e0e0;">
                <button onclick="generateACORDPDFNow('${policyId}')"
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px 80px; border: none; border-radius: 12px; font-size: 24px; font-weight: bold; cursor: pointer; box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4); transition: all 0.3s;"
                        onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 15px 50px rgba(102, 126, 234, 0.5)'"
                        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 10px 40px rgba(102, 126, 234, 0.4)'">
                    <i class="fas fa-file-pdf" style="margin-right: 10px;"></i> Generate Official ACORD 25 PDF
                </button>
                <p style="margin-top: 20px; color: #666; font-size: 16px;">
                    <i class="fas fa-info-circle"></i> Click to generate and download the official ACORD 25 Certificate of Insurance
                </p>
            </div>
        </div>
    `;

    // Focus on the first input
    setTimeout(() => {
        document.getElementById('acord-cert-name')?.focus();
    }, 100);
}

// IMMEDIATELY override prepareCOI
window.prepareCOI = showRealACORD;

// Create the PDF generation function
window.generateACORDPDFNow = function(policyId) {
    console.log('📄 Generating ACORD PDF...');

    const PDF = window.jsPDF || window.jspdf?.jsPDF;
    if (!PDF) {
        alert('PDF library is loading... Please wait a moment and try again.');
        return;
    }

    const certName = document.getElementById('acord-cert-name')?.value;
    const certAddress = document.getElementById('acord-cert-address')?.value;
    const certDesc = document.getElementById('acord-cert-desc')?.value;

    if (!certName || !certAddress) {
        alert('⚠️ Please enter certificate holder name and address');
        document.getElementById('acord-cert-name')?.focus();
        return;
    }

    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId ||
        String(p.policyNumber) === String(policyId) ||
        String(p.id) === String(policyId)
    );

    if (!policy) {
        alert('Policy not found');
        return;
    }

    // Create the PDF
    const doc = new PDF();

    // ACORD Header
    doc.setFontSize(10);
    doc.text('ACORD®', 10, 10);
    doc.setFontSize(14);
    doc.text('CERTIFICATE OF LIABILITY INSURANCE', 105, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text('DATE: ' + new Date().toLocaleDateString(), 165, 10);

    // Notice text
    doc.setFontSize(6);
    doc.text('THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY', 105, 20, { align: 'center' });

    // Producer box
    doc.rect(10, 30, 95, 30);
    doc.setFontSize(8);
    doc.text('PRODUCER', 12, 35);
    doc.text('Vanguard Insurance Group', 12, 40);
    doc.text('123 Insurance Way', 12, 44);
    doc.text('New York, NY 10001', 12, 48);

    // Insured box
    doc.rect(110, 30, 90, 30);
    doc.text('INSURED', 112, 35);
    const insuredName = policy.insured?.['Name/Business Name'] || policy.clientName || 'Unknown';
    doc.text(insuredName, 112, 40);

    // Coverage section
    let y = 70;
    doc.text('TYPE OF INSURANCE', 12, y);
    doc.text('POLICY NUMBER', 70, y);
    doc.text('POLICY DATES', 120, y);
    doc.text('LIMITS', 160, y);

    y += 10;
    if (policy.policyType?.includes('auto')) {
        doc.text('AUTOMOBILE LIABILITY', 12, y);
        doc.text(policy.policyNumber || 'N/A', 70, y);
        doc.text(`${policy.effectiveDate || 'N/A'} to ${policy.expirationDate || 'N/A'}`, 120, y);
        const limit = policy.coverage?.['Liability Limit'] || policy.coverage?.['Combined Single Limit'] || '$1,000,000';
        doc.text(limit, 160, y);
        y += 10;
    }

    if (policy.coverage?.['Cargo Limit']) {
        doc.text('CARGO', 12, y);
        doc.text(policy.policyNumber || 'N/A', 70, y);
        doc.text(`${policy.effectiveDate || 'N/A'} to ${policy.expirationDate || 'N/A'}`, 120, y);
        doc.text(policy.coverage['Cargo Limit'], 160, y);
        y += 10;
    }

    // Description
    y += 15;
    doc.text('DESCRIPTION OF OPERATIONS:', 12, y);
    y += 5;
    const lines = doc.splitTextToSize(certDesc || '', 180);
    lines.forEach(line => {
        doc.text(line, 12, y);
        y += 4;
    });

    // Certificate Holder
    y += 15;
    doc.rect(10, y, 95, 35);
    doc.text('CERTIFICATE HOLDER', 12, y + 5);
    doc.text(certName, 12, y + 10);
    const addrLines = certAddress.split('\n');
    let addrY = y + 15;
    addrLines.forEach(line => {
        if (line.trim()) {
            doc.text(line.trim(), 12, addrY);
            addrY += 4;
        }
    });

    // Signature
    doc.line(120, 270, 180, 270);
    doc.text('Authorized Representative', 150, 275, { align: 'center' });

    // Footer
    doc.setFontSize(6);
    doc.text('ACORD 25 (2016/03)', 10, 290);

    // Save
    const fileName = `ACORD_25_${insuredName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    // Success popup
    alert('✅ SUCCESS!\n\nACORD 25 Certificate Generated!\n\nFile: ' + fileName);
};

// Override every 500ms to make sure it sticks
setInterval(() => {
    if (window.prepareCOI !== showRealACORD) {
        window.prepareCOI = showRealACORD;
        console.log('✅ Re-applied ACORD override');
    }
}, 500);

console.log('✅ INSTANT ACORD OVERRIDE ACTIVE - prepareCOI will now show real ACORD form immediately!');