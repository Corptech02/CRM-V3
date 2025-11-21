// Real ACORD COI Generator with PDF Export
console.log('ACORD COI Generator loading...');

// Load jsPDF library dynamically if not already loaded
if (typeof window.jspdf === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
        console.log('jsPDF library loaded');
        window.jsPDF = window.jspdf.jsPDF;
    };
    document.head.appendChild(script);
}

// Override the prepareCOI function to generate real ACORD document
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

    // Display COI preparation form in the panel
    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) return;

    // Extract all policy data with proper field mapping
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

    const autoLiability = policy.coverage?.['Auto Liability'] ||
                         policy.coverage?.['Automobile Liability'] ||
                         liabilityLimit ||
                         '';

    const generalAggregate = policy.coverage?.['General Aggregate'] ||
                            policy.coverage?.generalAggregate ||
                            '';

    const productsOps = policy.coverage?.['Products/Operations'] ||
                       policy.coverage?.['Products-Comp/Op Agg'] ||
                       '';

    const personalAdv = policy.coverage?.['Personal & Adv Injury'] ||
                       policy.coverage?.personalAdvInjury ||
                       '';

    const eachOccurrence = policy.coverage?.['Each Occurrence'] ||
                          policy.coverage?.eachOccurrence ||
                          liabilityLimit ||
                          '';

    const medicalExpense = policy.coverage?.['Medical Payments'] ||
                          policy.coverage?.medicalPayments ||
                          '';

    const umbrellaLimit = policy.coverage?.['Umbrella Limit'] ||
                         policy.coverage?.umbrellaLimit ||
                         '';

    const workersComp = policy.coverage?.['Workers Compensation'] ||
                       policy.coverage?.workersComp ||
                       '';

    policyViewer.innerHTML = `
        <div class="coi-generator">
            <div class="coi-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button class="btn-back" onclick="backToPolicyList()" title="Back to Policy List">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2>ACORD® 25 Certificate of Liability Insurance</h2>
                </div>
                <div>
                    <button class="btn-primary" onclick="generateACORDPDF('${policyId}')">
                        <i class="fas fa-file-pdf"></i> Generate PDF
                    </button>
                    <button class="btn-secondary" onclick="previewACORD('${policyId}')">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                </div>
            </div>

            <div class="coi-form-body">
                <div class="acord-notice" style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <p style="font-size: 11px; color: #856404; text-align: center; margin: 0;">
                        THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE CERTIFICATE HOLDER. THIS
                        CERTIFICATE DOES NOT AFFIRMATIVELY OR NEGATIVELY AMEND, EXTEND OR ALTER THE COVERAGE AFFORDED BY THE POLICIES
                        BELOW. THIS CERTIFICATE OF INSURANCE DOES NOT CONSTITUTE A CONTRACT BETWEEN THE ISSUING INSURER(S), AUTHORIZED
                        REPRESENTATIVE OR PRODUCER, AND THE CERTIFICATE HOLDER.
                    </p>
                </div>


                <div class="form-section">
                    <h3>Description of Operations / Vehicles</h3>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="cert-description" class="form-control" rows="4"
                                  placeholder="Describe operations, locations, vehicles...">Certificate holder is listed as additional insured with respect to general liability arising out of operations performed by the named insured.</textarea>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Policy Information (Auto-Filled)</h3>
                    <div class="info-preview">
                        <div class="preview-grid">
                            <div class="preview-item">
                                <label>Insured:</label>
                                <span>${insuredName}</span>
                            </div>
                            <div class="preview-item">
                                <label>Policy Number:</label>
                                <span>${policyNumber}</span>
                            </div>
                            <div class="preview-item">
                                <label>Carrier:</label>
                                <span>${carrier}</span>
                            </div>
                            <div class="preview-item">
                                <label>Policy Period:</label>
                                <span>${effectiveDate} to ${expirationDate}</span>
                            </div>
                            <div class="preview-item">
                                <label>Liability Limit:</label>
                                <span>${liabilityLimit || 'N/A'}</span>
                            </div>
                            <div class="preview-item">
                                <label>Cargo Coverage:</label>
                                <span>${cargoLimit || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Additional Options</h3>
                    <div class="checkbox-group">
                        <label>
                            <input type="checkbox" id="cert-additional-insured" checked>
                            Certificate Holder is Additional Insured
                        </label>
                        <label>
                            <input type="checkbox" id="cert-waiver">
                            Waiver of Subrogation
                        </label>
                        <label>
                            <input type="checkbox" id="cert-primary">
                            Primary and Non-Contributory
                        </label>
                    </div>
                </div>

                <div class="form-actions" style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                    <button class="btn-primary" onclick="generateACORDPDF('${policyId}')" style="min-width: 200px;">
                        <i class="fas fa-file-pdf"></i> Generate ACORD 25 PDF
                    </button>
                    <button class="btn-secondary" onclick="emailCOI('${policyId}')">
                        <i class="fas fa-envelope"></i> Email Certificate
                    </button>
                    <button class="btn-secondary" onclick="saveCOIDraft('${policyId}')">
                        <i class="fas fa-save"></i> Save Draft
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add styles for the COI generator
    if (!document.getElementById('coi-generator-styles')) {
        const styles = document.createElement('style');
        styles.id = 'coi-generator-styles';
        styles.textContent = `
            .coi-generator {
                padding: 20px;
            }
            .coi-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e5e7eb;
            }
            .form-section {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .form-section h3 {
                margin: 0 0 15px 0;
                color: #495057;
                font-size: 16px;
            }
            .form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            .preview-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }
            .preview-item {
                display: flex;
                align-items: center;
                padding: 10px;
                background: white;
                border-radius: 5px;
            }
            .preview-item label {
                font-weight: 600;
                margin-right: 10px;
                color: #666;
                min-width: 120px;
            }
            .preview-item span {
                color: #333;
            }
            .checkbox-group {
                display: flex;
                gap: 30px;
                flex-wrap: wrap;
            }
            .checkbox-group label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
            }
            .form-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
            }
        `;
        document.head.appendChild(styles);
    }
};

// Function to generate the actual ACORD PDF
window.generateACORDPDF = function(policyId) {
    // Check if jsPDF is loaded
    if (typeof window.jsPDF === 'undefined') {
        alert('PDF library is still loading. Please try again in a moment.');
        return;
    }

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
    const doc = new jsPDF();

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
    doc.text(noticeText, 20, 45, { maxWidth: 170, align: 'justify' });

    // Producer Section
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('PRODUCER', 20, 65);
    doc.setFont(undefined, 'normal');
    doc.text('Vanguard Insurance Group', 20, 70);
    doc.text('123 Insurance Way', 20, 75);
    doc.text('New York, NY 10001', 20, 80);
    doc.text('Phone: (212) 555-0100', 20, 85);
    doc.text('Fax: (212) 555-0101', 20, 90);

    // Insured Section
    doc.setFont(undefined, 'bold');
    doc.text('INSURED', 20, 100);
    doc.setFont(undefined, 'normal');
    const insuredName = policy.clientName ||
                       policy.insured?.['Name/Business Name'] ||
                       policy.insured?.['Primary Named Insured'] ||
                       'Unknown';
    doc.text(insuredName, 20, 105);

    if (policy.insured?.['Mailing Address']) {
        const addressLines = policy.insured['Mailing Address'].split(',');
        let yPos = 110;
        addressLines.forEach(line => {
            doc.text(line.trim(), 20, yPos);
            yPos += 5;
        });
    }

    // Coverages Section
    doc.setFont(undefined, 'bold');
    doc.text('COVERAGES', 20, 130);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');

    // Table headers
    doc.text('TYPE OF INSURANCE', 20, 140);
    doc.text('INSURER', 70, 140);
    doc.text('POLICY NUMBER', 100, 140);
    doc.text('POLICY EFF DATE', 130, 140);
    doc.text('POLICY EXP DATE', 155, 140);
    doc.text('LIMITS', 180, 140);

    // Commercial General Liability
    let yPos = 150;
    if (policy.policyType?.includes('liability') || policy.coverage?.['General Aggregate']) {
        doc.text('COMMERCIAL GENERAL LIABILITY', 20, yPos);
        doc.text(policy.carrier || 'N/A', 70, yPos);
        doc.text(policy.policyNumber || 'N/A', 100, yPos);
        doc.text(policy.effectiveDate || 'N/A', 130, yPos);
        doc.text(policy.expirationDate || 'N/A', 155, yPos);

        yPos += 5;
        if (policy.coverage?.['Each Occurrence']) {
            doc.text('Each Occurrence: ' + policy.coverage['Each Occurrence'], 130, yPos);
            yPos += 5;
        }
        if (policy.coverage?.['General Aggregate']) {
            doc.text('General Aggregate: ' + policy.coverage['General Aggregate'], 130, yPos);
            yPos += 5;
        }
        yPos += 5;
    }

    // Commercial Auto
    if (policy.policyType?.includes('auto') || policy.policyType?.includes('commercial-auto')) {
        doc.text('AUTOMOBILE LIABILITY', 20, yPos);
        doc.text(policy.carrier || 'N/A', 70, yPos);
        doc.text(policy.policyNumber || 'N/A', 100, yPos);
        doc.text(policy.effectiveDate || 'N/A', 130, yPos);
        doc.text(policy.expirationDate || 'N/A', 155, yPos);

        yPos += 5;
        const liabilityLimit = policy.coverage?.['Liability Limit'] ||
                              policy.coverage?.['Combined Single Limit'] ||
                              '';
        if (liabilityLimit) {
            doc.text('Combined Single Limit: ' + liabilityLimit, 130, yPos);
            yPos += 5;
        }
        yPos += 5;
    }

    // Cargo
    if (policy.coverage?.['Cargo Limit']) {
        doc.text('CARGO', 20, yPos);
        doc.text(policy.carrier || 'N/A', 70, yPos);
        doc.text(policy.policyNumber || 'N/A', 100, yPos);
        doc.text(policy.effectiveDate || 'N/A', 130, yPos);
        doc.text(policy.expirationDate || 'N/A', 155, yPos);
        doc.text('Limit: ' + policy.coverage['Cargo Limit'], 130, yPos + 5);
        yPos += 15;
    }

    // Description of Operations
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text('DESCRIPTION OF OPERATIONS / LOCATIONS / VEHICLES', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    yPos += 5;
    doc.text(certDescription || '', 20, yPos, { maxWidth: 170 });

    // Certificate Holder
    yPos += 20;
    doc.setFont(undefined, 'bold');
    doc.text('CERTIFICATE HOLDER', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 5;
    doc.text(certHolderName, 20, yPos);
    yPos += 5;
    const addressLines = certHolderAddress.split('\n');
    addressLines.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 5;
    });

    // Authorized Representative
    yPos = 270;
    doc.line(120, yPos, 190, yPos);
    doc.text('Authorized Representative', 155, yPos + 5, { align: 'center' });

    // Save the PDF
    const fileName = `ACORD_25_${insuredName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    // Show success message
    const notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000;';
    notification.innerHTML = '<i class="fas fa-check-circle"></i> ACORD Certificate generated successfully!';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
};

// Function to email COI
window.emailCOI = function(policyId) {
    const certHolderName = document.getElementById('cert-holder-name')?.value;
    if (!certHolderName) {
        alert('Please enter certificate holder name first');
        return;
    }
    alert('Email functionality will be implemented with your email service integration');
};

// Function to save COI draft
window.saveCOIDraft = function(policyId) {
    const certHolderName = document.getElementById('cert-holder-name')?.value;
    const certHolderAddress = document.getElementById('cert-holder-address')?.value;
    const certDescription = document.getElementById('cert-description')?.value;

    const draft = {
        policyId,
        certHolderName,
        certHolderAddress,
        certDescription,
        timestamp: new Date().toISOString()
    };

    // Save to localStorage
    let drafts = JSON.parse(localStorage.getItem('coi_drafts') || '[]');
    drafts.push(draft);
    localStorage.setItem('coi_drafts', JSON.stringify(drafts));

    alert('COI draft saved successfully');
};

// Function to go back to policy list
window.backToPolicyList = function() {
    const policyViewer = document.getElementById('policyViewer');
    if (policyViewer) {
        // Clear the viewer and show policies list
        policyViewer.innerHTML = '';

        // Trigger a refresh of the policies display
        if (window.displayActivePolicies) {
            window.displayActivePolicies();
        } else {
            // Fallback: just clear and show message
            policyViewer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Select a policy to view details</div>';
        }
    }
};

// Function to preview ACORD form
window.previewACORD = function(policyId) {
    // Get the certificate holder info
    const certHolderName = document.getElementById('cert-holder-name')?.value || '';
    const certHolderAddress = document.getElementById('cert-holder-address')?.value || '';

    if (!certHolderName || !certHolderAddress) {
        alert('Please enter certificate holder information to preview');
        return;
    }

    // Show preview in modal
    alert('Preview feature - Your ACORD certificate will be generated with the entered information');
};

console.log('ACORD COI Generator ready - Real ACORD 25 certificates will be generated');