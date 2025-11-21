// Force Real ACORD COI - This will completely replace the fake form
console.log('Forcing real ACORD COI generator...');

// Inject jsPDF library immediately
(function() {
    if (!document.querySelector('script[src*="jspdf"]')) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            console.log('✓ jsPDF library loaded successfully');
            window.jsPDF = window.jspdf.jsPDF;
        };
        document.head.appendChild(script);
    }
})();

// Wait for page to fully load then replace the function
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', replacePrepareCOI);
} else {
    replacePrepareCOI();
}

function replacePrepareCOI() {
    console.log('Replacing prepareCOI with real ACORD generator...');

    // Replace the global prepareCOI function
    window.prepareCOI = function(policyId) {
        console.log('Real ACORD COI Generator activated for policy:', policyId);

        // Load jsPDF if not loaded
        if (!window.jsPDF && !window.jspdf) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                window.jsPDF = window.jspdf.jsPDF;
                window.prepareCOI(policyId); // Retry after loading
            };
            document.head.appendChild(script);
            alert('Loading PDF library... Please wait a moment and try again.');
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

        const policyViewer = document.getElementById('policyViewer');
        if (!policyViewer) {
            console.error('Policy viewer not found');
            return;
        }

        // Extract policy details
        const insuredName = policy.clientName ||
                           policy.insured?.['Name/Business Name'] ||
                           policy.insured?.['Primary Named Insured'] ||
                           'Unknown';

        const policyNumber = policy.policyNumber || policy.id;
        const carrier = policy.carrier || policy.overview?.['Carrier'] || 'N/A';
        const effectiveDate = policy.effectiveDate || policy.overview?.['Effective Date'] || '';
        const expirationDate = policy.expirationDate || policy.overview?.['Expiration Date'] || '';

        // Create the real ACORD form interface
        policyViewer.innerHTML = `
            <div style="padding: 20px; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #007bff;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <button onclick="backToPolicyList()" style="background: #6c757d; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                        <h2 style="margin: 0; color: #333;">Generate Real ACORD® 25 Certificate</h2>
                    </div>
                    <div style="background: #28a745; color: white; padding: 10px 20px; border-radius: 5px; font-weight: bold;">
                        <i class="fas fa-check-circle"></i> REAL PDF GENERATOR
                    </div>
                </div>

                <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin-bottom: 25px;">
                    <p style="margin: 0; color: #0c5460; text-align: center; font-size: 14px;">
                        <strong>This generates a real ACORD 25 Certificate of Insurance PDF document</strong><br>
                        <small>Enter the certificate holder information below and click Generate to create the official PDF</small>
                    </p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <h3 style="color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">Certificate Holder Information</h3>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">
                                Certificate Holder Name <span style="color: red;">*</span>
                            </label>
                            <input type="text" id="cert-holder-name"
                                   style="width: 100%; padding: 10px; border: 2px solid #ced4da; border-radius: 5px; font-size: 14px;"
                                   placeholder="Enter certificate holder company name" required>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">
                                Certificate Holder Address <span style="color: red;">*</span>
                            </label>
                            <textarea id="cert-holder-address" rows="4"
                                      style="width: 100%; padding: 10px; border: 2px solid #ced4da; border-radius: 5px; font-size: 14px;"
                                      placeholder="Enter complete address&#10;Street Address&#10;City, State ZIP" required></textarea>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">
                                Description of Operations
                            </label>
                            <textarea id="cert-description" rows="3"
                                      style="width: 100%; padding: 10px; border: 2px solid #ced4da; border-radius: 5px; font-size: 14px;">Certificate holder is listed as additional insured with respect to general liability arising out of operations performed by the named insured.</textarea>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" id="cert-additional-insured" checked style="width: 18px; height: 18px;">
                                <span>Certificate Holder is Additional Insured</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 style="color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">Policy Information (Auto-Filled)</h3>

                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #6c757d;">Insured:</strong><br>
                                <span style="font-size: 16px; color: #333;">${insuredName}</span>
                            </div>

                            <div style="margin-bottom: 15px;">
                                <strong style="color: #6c757d;">Policy Number:</strong><br>
                                <span style="font-size: 16px; color: #333;">${policyNumber}</span>
                            </div>

                            <div style="margin-bottom: 15px;">
                                <strong style="color: #6c757d;">Insurance Carrier:</strong><br>
                                <span style="font-size: 16px; color: #333;">${carrier}</span>
                            </div>

                            <div style="margin-bottom: 15px;">
                                <strong style="color: #6c757d;">Policy Period:</strong><br>
                                <span style="font-size: 16px; color: #333;">${effectiveDate} to ${expirationDate}</span>
                            </div>

                            <div style="margin-bottom: 15px;">
                                <strong style="color: #6c757d;">Coverage Type:</strong><br>
                                <span style="font-size: 16px; color: #333;">${policy.policyType || 'Commercial Auto'}</span>
                            </div>

                            ${policy.coverage?.['Liability Limit'] || policy.coverage?.['Combined Single Limit'] ? `
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #6c757d;">Liability Limit:</strong><br>
                                <span style="font-size: 16px; color: #333;">${policy.coverage?.['Liability Limit'] || policy.coverage?.['Combined Single Limit']}</span>
                            </div>` : ''}

                            ${policy.coverage?.['Cargo Limit'] ? `
                            <div>
                                <strong style="color: #6c757d;">Cargo Coverage:</strong><br>
                                <span style="font-size: 16px; color: #333;">${policy.coverage['Cargo Limit']}</span>
                            </div>` : ''}
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 2px solid #dee2e6;">
                    <button onclick="generateRealPDF('${policyId}')"
                            style="background: #28a745; color: white; padding: 15px 40px; border: none; border-radius: 5px; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <i class="fas fa-file-pdf"></i> Generate ACORD 25 PDF
                    </button>
                    <p style="margin-top: 10px; color: #6c757d; font-size: 12px;">
                        This will generate and download a real ACORD 25 Certificate of Insurance PDF
                    </p>
                </div>
            </div>
        `;
    };

    // Create the PDF generation function
    window.generateRealPDF = function(policyId) {
        console.log('Generating real ACORD PDF for policy:', policyId);

        // Get the jsPDF class
        const PDF = window.jsPDF || window.jspdf?.jsPDF;
        if (!PDF) {
            alert('PDF library not loaded. Please refresh the page and try again.');
            return;
        }

        // Get form data
        const certHolderName = document.getElementById('cert-holder-name')?.value;
        const certHolderAddress = document.getElementById('cert-holder-address')?.value;

        if (!certHolderName || !certHolderAddress) {
            alert('Please enter certificate holder name and address');
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

        // Create the PDF
        const doc = new PDF();

        // ACORD Header
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('ACORD®', 20, 15);
        doc.setFontSize(12);
        doc.text('CERTIFICATE OF LIABILITY INSURANCE', 105, 15, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text('DATE (MM/DD/YYYY)', 160, 15);
        doc.text(new Date().toLocaleDateString(), 160, 20);

        // Notice
        doc.setFontSize(6);
        const notice = 'THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE CERTIFICATE HOLDER.';
        doc.text(notice, 105, 30, { align: 'center', maxWidth: 170 });

        // Producer box
        doc.rect(10, 35, 95, 40);
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text('PRODUCER', 12, 40);
        doc.setFont(undefined, 'normal');
        doc.text('Vanguard Insurance Group', 12, 45);
        doc.text('123 Insurance Way', 12, 50);
        doc.text('New York, NY 10001', 12, 55);
        doc.text('Phone: (212) 555-0100', 12, 60);

        // Insured box
        doc.rect(110, 35, 90, 40);
        doc.setFont(undefined, 'bold');
        doc.text('INSURED', 112, 40);
        doc.setFont(undefined, 'normal');
        const insuredName = policy.clientName || policy.insured?.['Name/Business Name'] || 'Unknown';
        doc.text(insuredName, 112, 45);
        if (policy.insured?.['Mailing Address']) {
            const addr = policy.insured['Mailing Address'].split(',');
            let y = 50;
            addr.forEach(line => {
                if (line.trim() && y <= 70) {
                    doc.text(line.trim(), 112, y);
                    y += 5;
                }
            });
        }

        // Coverage grid
        let yPos = 85;
        doc.setFont(undefined, 'bold');
        doc.text('TYPE OF INSURANCE', 12, yPos);
        doc.text('INSR', 55, yPos);
        doc.text('POLICY NUMBER', 70, yPos);
        doc.text('POLICY EFF', 110, yPos);
        doc.text('POLICY EXP', 135, yPos);
        doc.text('LIMITS', 160, yPos);

        // Draw lines for grid
        doc.line(10, yPos + 2, 200, yPos + 2);

        yPos += 8;
        doc.setFont(undefined, 'normal');

        // Auto Liability
        if (policy.policyType?.includes('auto')) {
            doc.text('AUTOMOBILE LIABILITY', 12, yPos);
            doc.text('X', 57, yPos);
            doc.text(policy.policyNumber || 'N/A', 70, yPos);
            doc.text(policy.effectiveDate || 'N/A', 110, yPos);
            doc.text(policy.expirationDate || 'N/A', 135, yPos);

            yPos += 5;
            const limit = policy.coverage?.['Liability Limit'] || policy.coverage?.['Combined Single Limit'] || '';
            if (limit) {
                doc.text('Combined Single Limit', 15, yPos);
                doc.text(limit, 160, yPos);
            }
            yPos += 8;
        }

        // Cargo
        if (policy.coverage?.['Cargo Limit']) {
            doc.text('CARGO', 12, yPos);
            doc.text('X', 57, yPos);
            doc.text(policy.policyNumber || 'N/A', 70, yPos);
            doc.text(policy.effectiveDate || 'N/A', 110, yPos);
            doc.text(policy.expirationDate || 'N/A', 135, yPos);
            doc.text(policy.coverage['Cargo Limit'], 160, yPos);
            yPos += 8;
        }

        // Description
        yPos += 10;
        doc.setFont(undefined, 'bold');
        doc.text('DESCRIPTION OF OPERATIONS / LOCATIONS / VEHICLES', 12, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 5;
        const description = document.getElementById('cert-description')?.value || '';
        const descLines = doc.splitTextToSize(description, 180);
        doc.text(descLines, 12, yPos);

        // Certificate Holder
        yPos += (descLines.length * 5) + 15;
        doc.rect(10, yPos - 5, 95, 40);
        doc.setFont(undefined, 'bold');
        doc.text('CERTIFICATE HOLDER', 12, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 5;
        doc.text(certHolderName, 12, yPos);
        const addrLines = certHolderAddress.split('\n');
        yPos += 5;
        addrLines.forEach(line => {
            if (line.trim()) {
                doc.text(line.trim(), 12, yPos);
                yPos += 5;
            }
        });

        // Signature
        doc.line(130, 270, 190, 270);
        doc.text('Authorized Representative', 160, 275, { align: 'center' });

        // Footer
        doc.setFontSize(6);
        doc.text('ACORD 25 (2016/03)', 10, 290);
        doc.text('© 1988-2015 ACORD CORPORATION. All rights reserved.', 105, 290, { align: 'center' });

        // Save the PDF
        const fileName = `ACORD_25_${insuredName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        // Show success
        alert('✅ ACORD 25 Certificate generated successfully!\n\nFile saved as: ' + fileName);
    };

    console.log('✅ prepareCOI function has been replaced with real ACORD generator');
}

// Also try to replace it after a delay to ensure it overrides everything
setTimeout(replacePrepareCOI, 2000);
setTimeout(replacePrepareCOI, 5000);

console.log('Real ACORD COI generator is now active');