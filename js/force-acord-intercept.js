// FORCE REAL ACORD - Intercept ALL prepareCOI calls
console.log('🚨 FORCING REAL ACORD COI - Intercepting all prepareCOI calls...');

// Load jsPDF immediately
if (!window.jsPDFLoaded) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
        console.log('✅ jsPDF loaded');
        window.jsPDF = window.jspdf.jsPDF;
        window.jsPDFLoaded = true;
    };
    document.head.appendChild(script);
}

// Define the REAL prepareCOI function
function realPrepareCOI(policyId) {
    console.log('🎯 REAL ACORD GENERATOR ACTIVATED for policy:', policyId);

    // Get the policy viewer
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

    // Extract details
    const insuredName = policy.clientName ||
                       policy.insured?.['Name/Business Name'] ||
                       policy.insured?.['Primary Named Insured'] ||
                       'Unknown';
    const policyNumber = policy.policyNumber || policy.id;
    const carrier = policy.carrier || policy.overview?.['Carrier'] || 'N/A';
    const effectiveDate = policy.effectiveDate || policy.overview?.['Effective Date'] || '';
    const expirationDate = policy.expirationDate || policy.overview?.['Expiration Date'] || '';

    // Create the REAL ACORD interface
    policyViewer.innerHTML = `
        <div style="padding: 20px; background: white; min-height: 600px;">
            <!-- Header with clear indication this is REAL -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="margin: 0; font-size: 28px;">
                            <i class="fas fa-file-pdf"></i> Real ACORD® 25 Certificate Generator
                        </h1>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Generate Official ACORD Certificate of Liability Insurance</p>
                    </div>
                    <button onclick="backToPolicyList()" style="background: rgba(255,255,255,0.2); color: white; border: 2px solid white; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                </div>
            </div>

            <!-- Success Alert -->
            <div style="background: #d4edda; border: 2px solid #28a745; color: #155724; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i class="fas fa-check-circle" style="font-size: 24px;"></i>
                    <div>
                        <strong style="font-size: 16px;">Real ACORD PDF Generator Active!</strong>
                        <p style="margin: 5px 0 0 0;">This will create an official ACORD 25 Certificate PDF that you can send to certificate holders.</p>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <!-- Left Column - Input -->
                <div>
                    <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; border: 1px solid #dee2e6;">
                        <h2 style="margin: 0 0 20px 0; color: #495057; font-size: 20px;">
                            <i class="fas fa-edit"></i> Certificate Holder Information
                        </h2>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #212529;">
                                Certificate Holder Name <span style="color: #dc3545;">*</span>
                            </label>
                            <input type="text" id="real-cert-holder-name"
                                   style="width: 100%; padding: 12px; border: 2px solid #007bff; border-radius: 6px; font-size: 15px; background: white;"
                                   placeholder="Enter the company requesting the certificate"
                                   required>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #212529;">
                                Certificate Holder Address <span style="color: #dc3545;">*</span>
                            </label>
                            <textarea id="real-cert-holder-address" rows="4"
                                      style="width: 100%; padding: 12px; border: 2px solid #007bff; border-radius: 6px; font-size: 15px; background: white; resize: vertical;"
                                      placeholder="123 Main Street&#10;Suite 100&#10;City, State 12345"
                                      required></textarea>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #212529;">
                                Description of Operations
                            </label>
                            <textarea id="real-cert-description" rows="3"
                                      style="width: 100%; padding: 12px; border: 2px solid #ced4da; border-radius: 6px; font-size: 15px; background: white; resize: vertical;">Certificate holder is listed as additional insured with respect to general liability arising out of operations performed by the named insured.</textarea>
                        </div>

                        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 6px;">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin: 0;">
                                <input type="checkbox" id="real-cert-additional-insured" checked
                                       style="width: 20px; height: 20px; cursor: pointer;">
                                <span style="color: #856404; font-weight: 500;">Certificate Holder is Additional Insured</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Right Column - Policy Info -->
                <div>
                    <div style="background: #e7f3ff; padding: 25px; border-radius: 10px; border: 1px solid #b3d7ff;">
                        <h2 style="margin: 0 0 20px 0; color: #004085; font-size: 20px;">
                            <i class="fas fa-file-contract"></i> Policy Information
                        </h2>

                        <div style="background: white; padding: 20px; border-radius: 8px;">
                            <div style="margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #dee2e6;">
                                <div style="color: #6c757d; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">Insured Name</div>
                                <div style="font-size: 18px; font-weight: 600; color: #212529;">${insuredName}</div>
                            </div>

                            <div style="margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #dee2e6;">
                                <div style="color: #6c757d; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">Policy Number</div>
                                <div style="font-size: 18px; font-weight: 600; color: #212529;">${policyNumber}</div>
                            </div>

                            <div style="margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #dee2e6;">
                                <div style="color: #6c757d; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">Insurance Carrier</div>
                                <div style="font-size: 18px; font-weight: 600; color: #212529;">${carrier}</div>
                            </div>

                            <div style="margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #dee2e6;">
                                <div style="color: #6c757d; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">Policy Period</div>
                                <div style="font-size: 16px; color: #212529;">
                                    <i class="fas fa-calendar"></i> ${effectiveDate} to ${expirationDate}
                                </div>
                            </div>

                            <div style="margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #dee2e6;">
                                <div style="color: #6c757d; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">Coverage Type</div>
                                <div style="font-size: 16px; color: #212529;">${policy.policyType || 'Commercial Auto'}</div>
                            </div>

                            ${policy.coverage?.['Liability Limit'] || policy.coverage?.['Combined Single Limit'] ? `
                            <div style="margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #dee2e6;">
                                <div style="color: #6c757d; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">Liability Limit</div>
                                <div style="font-size: 18px; font-weight: 600; color: #28a745;">
                                    ${policy.coverage?.['Liability Limit'] || policy.coverage?.['Combined Single Limit']}
                                </div>
                            </div>` : ''}

                            ${policy.coverage?.['Cargo Limit'] ? `
                            <div>
                                <div style="color: #6c757d; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">Cargo Coverage</div>
                                <div style="font-size: 18px; font-weight: 600; color: #28a745;">
                                    ${policy.coverage['Cargo Limit']}
                                </div>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Generate Button -->
            <div style="text-align: center; margin-top: 40px;">
                <button onclick="window.generateRealACORDNow('${policyId}')"
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px 60px; border: none; border-radius: 10px; font-size: 20px; font-weight: bold; cursor: pointer; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4); transition: transform 0.3s;"
                        onmouseover="this.style.transform='scale(1.05)'"
                        onmouseout="this.style.transform='scale(1)'">
                    <i class="fas fa-file-pdf"></i> Generate Official ACORD 25 PDF
                </button>
                <p style="margin-top: 15px; color: #6c757d;">
                    <i class="fas fa-info-circle"></i> This will create and download a real ACORD 25 Certificate of Insurance PDF document
                </p>
            </div>
        </div>
    `;
}

// Override the prepareCOI function globally
window.prepareCOI = realPrepareCOI;

// Also create the generate function
window.generateRealACORDNow = function(policyId) {
    console.log('📄 Generating REAL ACORD PDF...');

    // Check jsPDF
    const PDF = window.jsPDF || window.jspdf?.jsPDF;
    if (!PDF) {
        alert('Loading PDF library... Please wait a moment and try again.');
        if (!window.jsPDFLoaded) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                window.jsPDF = window.jspdf.jsPDF;
                window.jsPDFLoaded = true;
                alert('PDF library loaded! Please click Generate again.');
            };
            document.head.appendChild(script);
        }
        return;
    }

    // Get inputs
    const certHolderName = document.getElementById('real-cert-holder-name')?.value;
    const certHolderAddress = document.getElementById('real-cert-holder-address')?.value;
    const certDescription = document.getElementById('real-cert-description')?.value;

    if (!certHolderName || !certHolderAddress) {
        alert('⚠️ Please enter certificate holder name and address');
        return;
    }

    // Get policy
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

    // Create PDF
    const doc = new PDF();

    // ACORD Header
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('ACORD®', 10, 10);
    doc.setFontSize(14);
    doc.text('CERTIFICATE OF LIABILITY INSURANCE', 105, 10, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('DATE (MM/DD/YYYY)', 165, 10);
    doc.text(new Date().toLocaleDateString(), 165, 15);

    // Notice
    doc.setFontSize(6);
    doc.text('THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE CERTIFICATE HOLDER. THIS', 105, 22, { align: 'center' });
    doc.text('CERTIFICATE DOES NOT AFFIRMATIVELY OR NEGATIVELY AMEND, EXTEND OR ALTER THE COVERAGE AFFORDED BY THE POLICIES', 105, 26, { align: 'center' });
    doc.text('BELOW. THIS CERTIFICATE OF INSURANCE DOES NOT CONSTITUTE A CONTRACT BETWEEN THE ISSUING INSURER(S), AUTHORIZED', 105, 30, { align: 'center' });
    doc.text('REPRESENTATIVE OR PRODUCER, AND THE CERTIFICATE HOLDER.', 105, 34, { align: 'center' });

    // Producer
    doc.rect(10, 40, 95, 35);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('PRODUCER', 12, 45);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text('Vanguard Insurance Group', 12, 50);
    doc.text('123 Insurance Way', 12, 54);
    doc.text('New York, NY 10001', 12, 58);
    doc.text('Phone: (212) 555-0100  Fax: (212) 555-0101', 12, 62);
    doc.text('Email: coi@vanguardins.com', 12, 66);

    // Insured
    doc.rect(110, 40, 90, 35);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('INSURED', 112, 45);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    const insuredName = policy.clientName || policy.insured?.['Name/Business Name'] || policy.insured?.['Primary Named Insured'] || 'Unknown';
    doc.text(insuredName, 112, 50);
    if (policy.insured?.['Mailing Address']) {
        const addr = policy.insured['Mailing Address'].split(',');
        let y = 54;
        addr.forEach(line => {
            if (line.trim() && y <= 70) {
                doc.text(line.trim(), 112, y);
                y += 4;
            }
        });
    }

    // Insurers
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text('INSURERS AFFORDING COVERAGE', 12, 82);
    doc.text('NAIC #', 185, 82);
    doc.setFont(undefined, 'normal');
    doc.text('INSURER A: ' + (policy.carrier || policy.overview?.['Carrier'] || 'N/A'), 12, 87);

    // Coverage Table Headers
    let y = 95;
    doc.setFontSize(6);
    doc.setFont(undefined, 'bold');
    doc.rect(10, y, 190, 8);
    doc.text('TYPE OF INSURANCE', 12, y + 5);
    doc.text('ADDL', 48, y + 3);
    doc.text('INSR', 48, y + 6);
    doc.text('SUBR', 58, y + 3);
    doc.text('WVD', 58, y + 6);
    doc.text('POLICY NUMBER', 70, y + 5);
    doc.text('POLICY EFF', 105, y + 3);
    doc.text('DATE (MM/DD/YY)', 105, y + 6);
    doc.text('POLICY EXP', 125, y + 3);
    doc.text('DATE (MM/DD/YY)', 125, y + 6);
    doc.text('LIMITS', 165, y + 5);

    // Coverage rows
    y = 103;
    doc.setFont(undefined, 'normal');

    // Commercial Auto
    if (policy.policyType?.includes('auto') || policy.policyType?.includes('commercial-auto')) {
        doc.rect(10, y, 190, 20);
        doc.text('COMMERCIAL AUTO', 12, y + 4);
        doc.text('X', 50, y + 8); // Additional Insured
        doc.text(policy.policyNumber || 'N/A', 70, y + 8);
        doc.text(policy.effectiveDate || 'N/A', 105, y + 8);
        doc.text(policy.expirationDate || 'N/A', 125, y + 8);

        doc.text('COMBINED SINGLE LIMIT', 147, y + 4);
        const limit = policy.coverage?.['Liability Limit'] || policy.coverage?.['Combined Single Limit'] || '$1,000,000';
        doc.text(limit, 147, y + 8);

        y += 20;
    }

    // Cargo
    if (policy.coverage?.['Cargo Limit']) {
        doc.rect(10, y, 190, 15);
        doc.text('CARGO', 12, y + 4);
        doc.text('X', 50, y + 8);
        doc.text(policy.policyNumber || 'N/A', 70, y + 8);
        doc.text(policy.effectiveDate || 'N/A', 105, y + 8);
        doc.text(policy.expirationDate || 'N/A', 125, y + 8);
        doc.text('CARGO LIMIT', 147, y + 4);
        doc.text(policy.coverage['Cargo Limit'], 147, y + 8);
        y += 15;
    }

    // Description
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.text('DESCRIPTION OF OPERATIONS / LOCATIONS / VEHICLES', 12, y);
    doc.setFont(undefined, 'normal');
    y += 5;
    const descLines = doc.splitTextToSize(certDescription || '', 180);
    descLines.forEach(line => {
        doc.text(line, 12, y);
        y += 4;
    });

    // Certificate Holder
    y += 10;
    doc.rect(10, y, 95, 35);
    doc.setFont(undefined, 'bold');
    doc.text('CERTIFICATE HOLDER', 12, y + 5);
    doc.setFont(undefined, 'normal');
    doc.text(certHolderName, 12, y + 10);
    const addrLines = certHolderAddress.split('\n');
    let addrY = y + 14;
    addrLines.forEach(line => {
        if (line.trim() && addrY < y + 32) {
            doc.text(line.trim(), 12, addrY);
            addrY += 4;
        }
    });

    // Cancellation clause
    doc.setFontSize(6);
    y += 40;
    doc.text('CANCELLATION', 12, y);
    y += 4;
    doc.text('SHOULD ANY OF THE ABOVE DESCRIBED POLICIES BE CANCELLED BEFORE THE EXPIRATION DATE THEREOF, NOTICE WILL BE', 12, y);
    y += 3;
    doc.text('DELIVERED IN ACCORDANCE WITH THE POLICY PROVISIONS.', 12, y);

    // Signature
    y += 10;
    doc.line(120, y, 180, y);
    doc.text('AUTHORIZED REPRESENTATIVE', 150, y + 4, { align: 'center' });

    // Footer
    doc.setFontSize(5);
    doc.text('ACORD 25 (2016/03)', 10, 285);
    doc.text('© 1988-2015 ACORD CORPORATION. All rights reserved.', 105, 285, { align: 'center' });
    doc.text('The ACORD name and logo are registered marks of ACORD', 105, 288, { align: 'center' });

    // Save
    const fileName = `ACORD_25_${insuredName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    // Success message
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px 50px;
        border-radius: 15px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 999999;
        text-align: center;
    `;
    successDiv.innerHTML = `
        <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
        <h2 style="margin: 0 0 10px 0;">Success!</h2>
        <p style="margin: 0;">ACORD 25 Certificate Generated</p>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">${fileName}</p>
    `;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
};

// Intercept all onclick events
document.addEventListener('click', function(e) {
    const target = e.target;
    const onclick = target.getAttribute('onclick');
    if (onclick && onclick.includes('prepareCOI')) {
        e.preventDefault();
        e.stopPropagation();
        const match = onclick.match(/prepareCOI\(['"]([^'"]+)['"]\)/);
        if (match) {
            console.log('🎯 Intercepted prepareCOI call, redirecting to REAL generator');
            realPrepareCOI(match[1]);
        }
    }
}, true);

// Override multiple times to ensure it sticks
setInterval(() => {
    if (window.prepareCOI !== realPrepareCOI) {
        console.log('🔄 Re-overriding prepareCOI function');
        window.prepareCOI = realPrepareCOI;
    }
}, 1000);

console.log('✅ REAL ACORD GENERATOR IS NOW ACTIVE - All prepareCOI calls intercepted!');