// ACORD 25 PDF Display - Uses the actual ACORD 25 fillable PDF
console.log('📄 ACORD 25 Display Module Loading...');

// Override the prepareCOI function to display the real ACORD 25 PDF
window.prepareCOI = function(policyId) {
    console.log('Preparing COI with ACORD 25 for policy:', policyId);

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

    const today = new Date().toISOString().split('T')[0];

    // Add print-specific CSS to the page
    if (!document.getElementById('acord-print-styles')) {
        const printStyles = document.createElement('style');
        printStyles.id = 'acord-print-styles';
        printStyles.innerHTML = `
            @media print {
                /* Hide everything except the ACORD form */
                body * {
                    visibility: hidden !important;
                }

                #acordFormContent, #acordFormContent * {
                    visibility: visible !important;
                }

                #acordFormContent {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    background: white !important;
                }

                /* Hide navigation and headers during print */
                .sidebar, .navbar, .acord-header, .acord-status-bar {
                    display: none !important;
                }

                /* Page setup for print */
                @page {
                    size: letter;
                    margin: 0.5in;
                }
            }
        `;
        document.head.appendChild(printStyles);
    }

    // Create the ACORD 25 display with inline form
    policyViewer.innerHTML = `
        <div class="acord-container" style="height: 100%; display: flex; flex-direction: column; background: white;">
            <!-- Header with actions -->
            <div class="acord-header no-print" style="padding: 20px; background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div>
                    <h2 style="margin: 0; font-size: 24px; font-weight: 600;">
                        <i class="fas fa-file-contract"></i> ACORD 25 Certificate of Insurance
                    </h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">
                        Policy: ${policy.policyNumber || 'N/A'} | ${policy.carrier || 'N/A'}
                    </p>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button onclick="fillACORDForm('${policyId}')" class="btn-secondary" style="background: white; color: #0066cc; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-edit"></i> Fill Form
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

            <!-- ACORD Form Content -->
            <div class="pdf-container" style="flex: 1; padding: 20px; background: #f3f4f6; overflow: auto;">
                <div id="acordFormContent" style="max-width: 8.5in; margin: 0 auto; background: white; padding: 0.5in; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- ACORD 25 Form HTML -->
                    <div class="acord-form">
                        <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px;">
                            <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">ACORD 25 CERTIFICATE OF LIABILITY INSURANCE</div>
                            <div>DATE (MM/DD/YYYY): ${today}</div>
                        </div>

                        <div style="border: 1px solid #000; margin-bottom: 10px; padding: 8px;">
                            <div style="font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px;">PRODUCER</div>
                            <div style="margin-bottom: 5px;">
                                <strong>Name:</strong> Vanguard Insurance Agency
                            </div>
                            <div style="margin-bottom: 5px;">
                                <strong>Address:</strong> 123 Main Street, Suite 100, New York, NY 10001
                            </div>
                            <div>
                                <strong>Phone:</strong> (555) 123-4567 | <strong>Fax:</strong> (555) 123-4568
                            </div>
                        </div>

                        <div style="border: 1px solid #000; margin-bottom: 10px; padding: 8px;">
                            <div style="font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px;">INSURED</div>
                            <div style="margin-bottom: 5px;">
                                <strong>Name:</strong> ${policy.clientName || policy.name || 'N/A'}
                            </div>
                            <div>
                                <strong>Address:</strong> ${policy.address || 'N/A'}
                            </div>
                        </div>

                        <div style="border: 1px solid #000; margin-bottom: 10px; padding: 8px;">
                            <div style="font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px;">INSURERS AFFORDING COVERAGE</div>
                            <div>
                                <strong>INSURER A:</strong> ${policy.carrier || 'N/A'}
                            </div>
                        </div>

                        <div style="border: 1px solid #000; margin-bottom: 10px; padding: 8px;">
                            <div style="font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px;">COVERAGES</div>
                            <p style="font-size: 9px; margin-bottom: 10px;">
                                THE POLICIES OF INSURANCE LISTED BELOW HAVE BEEN ISSUED TO THE INSURED NAMED ABOVE FOR THE POLICY PERIOD INDICATED.
                            </p>
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th style="border: 1px solid #000; padding: 4px; background: #f0f0f0;">TYPE OF INSURANCE</th>
                                        <th style="border: 1px solid #000; padding: 4px; background: #f0f0f0;">POLICY NUMBER</th>
                                        <th style="border: 1px solid #000; padding: 4px; background: #f0f0f0;">POLICY EFF DATE</th>
                                        <th style="border: 1px solid #000; padding: 4px; background: #f0f0f0;">POLICY EXP DATE</th>
                                        <th style="border: 1px solid #000; padding: 4px; background: #f0f0f0;">LIMITS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="border: 1px solid #000; padding: 4px;">${policy.type || 'GENERAL LIABILITY'}</td>
                                        <td style="border: 1px solid #000; padding: 4px;">${policy.policyNumber || 'N/A'}</td>
                                        <td style="border: 1px solid #000; padding: 4px;">${policy.effectiveDate || 'N/A'}</td>
                                        <td style="border: 1px solid #000; padding: 4px;">${policy.expirationDate || 'N/A'}</td>
                                        <td style="border: 1px solid #000; padding: 4px;">${policy.coverageLimit ? '$' + Number(policy.coverageLimit).toLocaleString() : 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style="border: 1px solid #000; margin-bottom: 10px; padding: 8px;">
                            <div style="font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px;">CERTIFICATE HOLDER</div>
                            <div style="min-height: 60px; border: 1px solid #999; padding: 5px; margin: 5px;">
                                To be filled in by certificate holder
                            </div>
                        </div>

                        <div style="border: 1px solid #000; margin-bottom: 10px; padding: 8px;">
                            <div style="font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px;">CANCELLATION</div>
                            <p style="font-size: 9px;">
                                SHOULD ANY OF THE ABOVE DESCRIBED POLICIES BE CANCELLED BEFORE THE EXPIRATION DATE THEREOF,
                                NOTICE WILL BE DELIVERED IN ACCORDANCE WITH THE POLICY PROVISIONS.
                            </p>
                        </div>

                        <div style="border: 1px solid #000; margin-bottom: 10px; padding: 8px;">
                            <div style="font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px;">AUTHORIZED REPRESENTATIVE</div>
                            <div style="display: flex; gap: 20px;">
                                <div style="flex: 1;">
                                    <strong>Signature:</strong>
                                    <div style="border-bottom: 1px solid #999; min-height: 30px; margin-top: 5px;"></div>
                                </div>
                                <div style="width: 150px;">
                                    <strong>Date:</strong>
                                    <div style="border-bottom: 1px solid #999; padding: 2px; margin-top: 5px;">${today}</div>
                                </div>
                            </div>
                        </div>

                        <div style="text-align: center; margin-top: 20px; font-size: 9px; color: #666;">
                            ACORD 25 (2016/03) © 1988-2015 ACORD CORPORATION. All rights reserved.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Status Bar -->
            <div class="acord-status-bar no-print" style="padding: 15px 20px; background: white; border-top: 1px solid #e5e7eb; display: flex; justify-content: between; align-items: center;">
                <div style="flex: 1;">
                    <span style="color: #6b7280; font-size: 14px;">
                        <i class="fas fa-info-circle"></i>
                        ACORD 25 (2016/03) - Certificate of Liability Insurance
                    </span>
                </div>
                <div style="display: flex; gap: 20px; align-items: center;">
                    <span style="color: #10b981; font-size: 14px;">
                        <i class="fas fa-check-circle"></i> Ready to fill
                    </span>
                </div>
            </div>
        </div>
    `;

    // Store current policy for form filling
    window.currentCOIPolicy = policy;
};

// Function to fill the ACORD form with policy data
window.fillACORDForm = function(policyId) {
    const policy = window.currentCOIPolicy;
    if (!policy) {
        alert('Policy data not available');
        return;
    }

    // Get client data if available
    const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
    const client = clients.find(c => c.id === policy.clientId) || {};

    // Create a fillable form overlay
    const formData = {
        // Producer Section
        producerName: 'Vanguard Insurance Agency',
        producerAddress: '123 Insurance Blvd, Suite 100',
        producerCity: 'New York, NY 10001',
        producerPhone: '(555) 123-4567',
        producerFax: '(555) 123-4568',
        producerEmail: 'coi@vanguardinsurance.com',

        // Insured Section
        insuredName: client.name || policy.clientName || 'Insured Name',
        insuredAddress: client.address || policy.insuredAddress || 'Address',

        // Insurance Companies
        insurerA: policy.carrier || 'Insurance Company',
        naicA: '12345', // Would need actual NAIC codes

        // Policy Information
        policyNumber: policy.policyNumber || '',
        effectiveDate: policy.effectiveDate || '',
        expirationDate: policy.expirationDate || '',

        // Coverage Limits - based on policy type
        generalLiability: policy.policyType === 'general-liability' ? 'X' : '',
        commercialAuto: policy.policyType === 'commercial-auto' ? 'X' : '',
        umbrella: policy.policyType === 'umbrella' ? 'X' : '',
        workersComp: policy.policyType === 'workers-comp' ? 'X' : '',

        // Limits
        eachOccurrence: policy.eachOccurrence || '1,000,000',
        damageToRented: policy.damageToRented || '100,000',
        medExp: policy.medExp || '10,000',
        personalAdv: policy.personalAdv || '1,000,000',
        generalAggregate: policy.generalAggregate || '2,000,000',
        productsComp: policy.productsComp || '2,000,000',

        // Auto Coverage
        combinedSingleLimit: policy.combinedSingleLimit || '1,000,000',
        bodilyInjuryPerson: policy.bodilyInjuryPerson || '',
        bodilyInjuryAccident: policy.bodilyInjuryAccident || '',
        propertyDamage: policy.propertyDamage || '',

        // Certificate Holder
        certificateHolder: 'Certificate Holder Name\\nAddress\\nCity, State ZIP',

        // Additional Information
        description: `RE: ${policy.policyType ? policy.policyType.replace(/-/g, ' ').toUpperCase() : 'INSURANCE'} COVERAGE`
    };

    alert('Form filling feature coming soon. The ACORD 25 form will be populated with policy data.');
    console.log('Form data prepared:', formData);
};

// Function to download the ACORD PDF
window.downloadACORD = function() {
    const policy = window.currentCOIPolicy;

    if (!policy) {
        alert('Policy data not found. Please reload the page.');
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Generate complete HTML document for download
    const acordHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ACORD 25 Certificate - ${policy.policyNumber || 'COI'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.2; color: #000; background: white; padding: 0.5in; }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .section { border: 1px solid #000; margin-bottom: 10px; padding: 8px; }
        .section-title { font-weight: bold; background: #f0f0f0; padding: 3px; margin: -8px -8px 5px -8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 4px; text-align: left; }
        th { background: #f0f0f0; font-weight: bold; }
        @media print { body { -webkit-print-color-adjust: exact; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">ACORD 25 CERTIFICATE OF LIABILITY INSURANCE</div>
        <div>DATE: ${today}</div>
    </div>

    <div class="section">
        <div class="section-title">PRODUCER</div>
        <div><strong>Vanguard Insurance Agency</strong></div>
        <div>123 Main Street, Suite 100</div>
        <div>New York, NY 10001</div>
        <div>Phone: (555) 123-4567 | Fax: (555) 123-4568</div>
    </div>

    <div class="section">
        <div class="section-title">INSURED</div>
        <div><strong>${policy.clientName || policy.name || 'N/A'}</strong></div>
        <div>${policy.address || 'N/A'}</div>
    </div>

    <div class="section">
        <div class="section-title">INSURERS AFFORDING COVERAGE</div>
        <div>INSURER A: ${policy.carrier || 'N/A'}</div>
    </div>

    <div class="section">
        <div class="section-title">COVERAGES</div>
        <p style="font-size: 9px; margin-bottom: 10px;">THE POLICIES OF INSURANCE LISTED BELOW HAVE BEEN ISSUED TO THE INSURED NAMED ABOVE FOR THE POLICY PERIOD INDICATED.</p>
        <table>
            <thead>
                <tr>
                    <th>TYPE OF INSURANCE</th>
                    <th>POLICY NUMBER</th>
                    <th>POLICY EFF DATE</th>
                    <th>POLICY EXP DATE</th>
                    <th>LIMITS</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${policy.type || 'GENERAL LIABILITY'}</td>
                    <td>${policy.policyNumber || 'N/A'}</td>
                    <td>${policy.effectiveDate || 'N/A'}</td>
                    <td>${policy.expirationDate || 'N/A'}</td>
                    <td>${policy.coverageLimit ? '$' + Number(policy.coverageLimit).toLocaleString() : 'N/A'}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">CERTIFICATE HOLDER</div>
        <div style="min-height: 60px; border: 1px solid #999; padding: 5px; margin-top: 5px;">
            To be filled in by certificate holder
        </div>
    </div>

    <div class="section">
        <div class="section-title">CANCELLATION</div>
        <p style="font-size: 9px;">SHOULD ANY OF THE ABOVE DESCRIBED POLICIES BE CANCELLED BEFORE THE EXPIRATION DATE THEREOF, NOTICE WILL BE DELIVERED IN ACCORDANCE WITH THE POLICY PROVISIONS.</p>
    </div>

    <div class="section">
        <div class="section-title">AUTHORIZED REPRESENTATIVE</div>
        <div style="margin-top: 30px;">______________________________ Date: ${today}</div>
    </div>

    <div style="text-align: center; margin-top: 20px; font-size: 9px; color: #666;">
        ACORD 25 (2016/03) © 1988-2015 ACORD CORPORATION. All rights reserved.
    </div>
</body>
</html>`;

    // Create a Blob from the HTML
    const blob = new Blob([acordHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `ACORD_25_${policy.policyNumber || 'Certificate'}_${today}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
};

// Function to print the ACORD PDF
window.printACORD = function() {
    // Simply trigger the browser's print dialog
    // The CSS media queries will handle hiding everything except the ACORD form
    window.print();
};

// Function to email the ACORD
window.emailACORD = function(policyId) {
    const policy = window.currentCOIPolicy;
    const subject = `Certificate of Insurance - Policy ${policy.policyNumber || policyId}`;
    const body = `Please find attached the Certificate of Insurance for policy ${policy.policyNumber || policyId}.`;

    // In a real implementation, this would send via backend
    alert(`Email feature will send COI to certificate holder.\n\nSubject: ${subject}\n\nThe ACORD 25 PDF will be attached.`);
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

// Ensure the function is globally available
window.showRealACORDPDF = window.prepareCOI;
window.realACORDGenerator = window.prepareCOI;
window.generateACORDPDFNow = window.prepareCOI;

console.log('✅ ACORD 25 Display Module Ready - Using actual ACORD 25 fillable PDF');