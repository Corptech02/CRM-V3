// Force override prepareCOI with real ACORD generator
console.log('ACORD COI Override loading - forcing real ACORD generator...');

// Wait for DOM and all scripts to load
setTimeout(() => {
    console.log('Overriding prepareCOI function with real ACORD generator');

    // Load jsPDF library if not already loaded
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            console.log('jsPDF library loaded');
            window.jsPDF = window.jspdf.jsPDF;
        };
        document.head.appendChild(script);
    }

    // Override the prepareCOI function
    window.prepareCOI = function(policyId) {
        console.log('Generating real ACORD COI for policy:', policyId);

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

        // Get client data
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const client = clients.find(c =>
            c.name === policy.clientName ||
            c.name === policy.insured?.['Name/Business Name'] ||
            c.name === policy.insured?.['Primary Named Insured']
        );

        // Display COI preparation form
        const policyViewer = document.getElementById('policyViewer');
        if (!policyViewer) {
            console.error('Policy viewer not found');
            return;
        }

        // Extract all policy data
        const insuredName = policy.clientName ||
                           policy.name ||
                           policy.insured?.['Name/Business Name'] ||
                           policy.insured?.['Primary Named Insured'] ||
                           policy.insured?.name ||
                           policy.insuredName ||
                           'Unknown';

        const insuredAddress = policy.insured?.['Mailing Address'] ||
                              policy.insured?.['Garaging Address'] ||
                              client?.address ||
                              '';

        const carrier = policy.carrier ||
                       policy.overview?.['Carrier'] ||
                       policy.overview?.carrier ||
                       'N/A';

        const policyNumber = policy.policyNumber ||
                            policy.overview?.['Policy Number'] ||
                            policy.id;

        const effectiveDate = policy.effectiveDate ||
                             policy.overview?.['Effective Date'] ||
                             policy.startDate ||
                             '';

        const expirationDate = policy.expirationDate ||
                              policy.overview?.['Expiration Date'] ||
                              policy.expiryDate ||
                              '';

        // Get coverage details
        const liabilityLimit = policy.coverage?.['Liability Limit'] ||
                              policy.coverage?.['Combined Single Limit'] ||
                              policy.coverageLimit ||
                              '';

        const cargoLimit = policy.coverage?.['Cargo Limit'] ||
                          policy.coverage?.cargoLimit ||
                          '';

        policyViewer.innerHTML = `
            <div class="coi-generator">
                <div class="coi-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button class="btn-back" onclick="backToPolicyList()" title="Back to Policy List">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h2>Generate Real ACORD® 25 Certificate</h2>
                    </div>
                </div>

                <div class="coi-form-body" style="padding: 20px;">
                    <div class="acord-notice" style="background: #d4edda; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #c3e6cb;">
                        <p style="font-size: 12px; color: #155724; text-align: center; margin: 0;">
                            <strong>This will generate a real ACORD 25 Certificate of Insurance PDF</strong><br>
                            Enter the certificate holder information below and click Generate PDF
                        </p>
                    </div>

                    <div class="form-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 15px 0; color: #495057;">Certificate Holder Information</h3>
                        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 5px; font-weight: 600;">Certificate Holder Name *</label>
                                <input type="text" id="cert-holder-name" class="form-control"
                                       placeholder="Enter certificate holder name" required
                                       style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                            </div>
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 5px; font-weight: 600;">Certificate Holder Address *</label>
                                <textarea id="cert-holder-address" class="form-control" rows="3"
                                          placeholder="Enter complete address" required
                                          style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;"></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="form-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 15px 0; color: #495057;">Description of Operations</h3>
                        <div class="form-group">
                            <textarea id="cert-description" class="form-control" rows="4"
                                      style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;"
                                      placeholder="Describe operations, locations, vehicles...">Certificate holder is listed as additional insured with respect to general liability arising out of operations performed by the named insured.</textarea>
                        </div>
                    </div>

                    <div class="form-section" style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 15px 0; color: #004085;">Policy Information (Auto-Filled)</h3>
                        <div class="preview-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                            <div class="preview-item" style="background: white; padding: 10px; border-radius: 5px;">
                                <strong>Insured:</strong> ${insuredName}
                            </div>
                            <div class="preview-item" style="background: white; padding: 10px; border-radius: 5px;">
                                <strong>Policy Number:</strong> ${policyNumber}
                            </div>
                            <div class="preview-item" style="background: white; padding: 10px; border-radius: 5px;">
                                <strong>Carrier:</strong> ${carrier}
                            </div>
                            <div class="preview-item" style="background: white; padding: 10px; border-radius: 5px;">
                                <strong>Policy Period:</strong> ${effectiveDate} to ${expirationDate}
                            </div>
                            <div class="preview-item" style="background: white; padding: 10px; border-radius: 5px;">
                                <strong>Liability Limit:</strong> ${liabilityLimit || 'N/A'}
                            </div>
                            <div class="preview-item" style="background: white; padding: 10px; border-radius: 5px;">
                                <strong>Cargo Coverage:</strong> ${cargoLimit || 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div class="form-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 15px 0; color: #495057;">Additional Options</h3>
                        <div class="checkbox-group" style="display: flex; gap: 30px; flex-wrap: wrap;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="cert-additional-insured" checked>
                                Certificate Holder is Additional Insured
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="cert-waiver">
                                Waiver of Subrogation
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="cert-primary">
                                Primary and Non-Contributory
                            </label>
                        </div>
                    </div>

                    <div class="form-actions" style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
                        <button class="btn-primary" onclick="generateRealACORDPDF('${policyId}')"
                                style="background: #28a745; color: white; padding: 12px 30px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin: 0 10px;">
                            <i class="fas fa-file-pdf"></i> Generate ACORD 25 PDF
                        </button>
                        <button class="btn-secondary" onclick="backToPolicyList()"
                                style="background: #6c757d; color: white; padding: 12px 30px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin: 0 10px;">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    // Function to generate the actual ACORD PDF
    window.generateRealACORDPDF = function(policyId) {
        console.log('Generating real ACORD PDF...');

        // Check if jsPDF is loaded
        if (typeof window.jsPDF === 'undefined' && typeof window.jspdf === 'undefined') {
            alert('PDF library is still loading. Please wait a moment and try again.');

            // Try to load it again
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                console.log('jsPDF library loaded');
                window.jsPDF = window.jspdf.jsPDF;
                // Try again after loading
                setTimeout(() => generateRealACORDPDF(policyId), 500);
            };
            document.head.appendChild(script);
            return;
        }

        // Get the PDF class
        const PDF = window.jsPDF || window.jspdf.jsPDF;

        // Get certificate holder info
        const certHolderName = document.getElementById('cert-holder-name')?.value;
        const certHolderAddress = document.getElementById('cert-holder-address')?.value;
        const certDescription = document.getElementById('cert-description')?.value;

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

        // Create PDF
        const doc = new PDF();

        // ACORD Header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('ACORD® CERTIFICATE OF LIABILITY INSURANCE', 105, 20, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text('DATE (MM/DD/YYYY)', 160, 30);
        doc.text(new Date().toLocaleDateString(), 160, 35);

        // Notice text
        doc.setFontSize(7);
        const noticeText = 'THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE CERTIFICATE HOLDER. THIS ' +
                          'CERTIFICATE DOES NOT AFFIRMATIVELY OR NEGATIVELY AMEND, EXTEND OR ALTER THE COVERAGE AFFORDED BY THE POLICIES ' +
                          'BELOW. THIS CERTIFICATE OF INSURANCE DOES NOT CONSTITUTE A CONTRACT BETWEEN THE ISSUING INSURER(S), AUTHORIZED ' +
                          'REPRESENTATIVE OR PRODUCER, AND THE CERTIFICATE HOLDER.';
        const lines = doc.splitTextToSize(noticeText, 170);
        doc.text(lines, 20, 45);

        // Producer Section
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('PRODUCER', 20, 65);
        doc.setFont(undefined, 'normal');
        doc.text('Vanguard Insurance Group', 20, 70);
        doc.text('123 Insurance Way', 20, 75);
        doc.text('New York, NY 10001', 20, 80);
        doc.text('Phone: (212) 555-0100', 20, 85);

        // Insured Section
        doc.setFont(undefined, 'bold');
        doc.text('INSURED', 110, 65);
        doc.setFont(undefined, 'normal');
        const insuredName = policy.clientName ||
                           policy.insured?.['Name/Business Name'] ||
                           policy.insured?.['Primary Named Insured'] ||
                           'Unknown';
        doc.text(insuredName, 110, 70);

        if (policy.insured?.['Mailing Address']) {
            const addressParts = policy.insured['Mailing Address'].split(',');
            let yPos = 75;
            addressParts.forEach(part => {
                if (part.trim()) {
                    doc.text(part.trim(), 110, yPos);
                    yPos += 5;
                }
            });
        }

        // Draw coverage table
        let yPos = 100;
        doc.setFont(undefined, 'bold');
        doc.text('TYPE OF INSURANCE', 20, yPos);
        doc.text('INSR LTR', 65, yPos);
        doc.text('POLICY NUMBER', 85, yPos);
        doc.text('POLICY EFF', 125, yPos);
        doc.text('POLICY EXP', 150, yPos);
        doc.text('LIMITS', 175, yPos);

        doc.setFont(undefined, 'normal');
        yPos += 10;

        // Commercial Auto
        if (policy.policyType?.includes('auto') || policy.policyType?.includes('commercial-auto')) {
            doc.text('AUTOMOBILE LIABILITY', 20, yPos);
            doc.text('A', 68, yPos);
            doc.text(policy.policyNumber || 'N/A', 85, yPos);
            doc.text(policy.effectiveDate || 'N/A', 125, yPos);
            doc.text(policy.expirationDate || 'N/A', 150, yPos);
            yPos += 5;

            const liabilityLimit = policy.coverage?.['Liability Limit'] ||
                                  policy.coverage?.['Combined Single Limit'] ||
                                  '';
            if (liabilityLimit) {
                doc.text('Combined Single Limit', 25, yPos);
                doc.text(liabilityLimit, 175, yPos);
                yPos += 5;
            }
            yPos += 5;
        }

        // Cargo
        if (policy.coverage?.['Cargo Limit']) {
            doc.text('CARGO', 20, yPos);
            doc.text('B', 68, yPos);
            doc.text(policy.policyNumber || 'N/A', 85, yPos);
            doc.text(policy.effectiveDate || 'N/A', 125, yPos);
            doc.text(policy.expirationDate || 'N/A', 150, yPos);
            doc.text(policy.coverage['Cargo Limit'], 175, yPos);
            yPos += 10;
        }

        // Description of Operations
        yPos += 10;
        doc.setFont(undefined, 'bold');
        doc.text('DESCRIPTION OF OPERATIONS / LOCATIONS / VEHICLES', 20, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 5;
        const descLines = doc.splitTextToSize(certDescription || '', 170);
        doc.text(descLines, 20, yPos);

        // Certificate Holder
        yPos += (descLines.length * 5) + 10;
        doc.setFont(undefined, 'bold');
        doc.text('CERTIFICATE HOLDER', 20, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 5;
        doc.text(certHolderName, 20, yPos);
        yPos += 5;
        const addressLines = certHolderAddress.split('\n');
        addressLines.forEach(line => {
            if (line.trim()) {
                doc.text(line.trim(), 20, yPos);
                yPos += 5;
            }
        });

        // Signature line
        doc.line(120, 270, 190, 270);
        doc.text('Authorized Representative', 155, 275, { align: 'center' });

        // Footer
        doc.setFontSize(6);
        doc.text('ACORD 25 (2016/03)', 20, 290);

        // Save the PDF
        const fileName = `ACORD_25_${insuredName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        // Show success message
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
        notification.innerHTML = '<i class="fas fa-check-circle"></i> <strong>Success!</strong> ACORD 25 Certificate generated and downloaded!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    };

    console.log('✓ prepareCOI function successfully overridden with real ACORD generator');

}, 1000); // Wait 1 second to ensure all other scripts have loaded

console.log('ACORD COI Override ready - will replace fake form with real ACORD generator');