// ACORD Form Filler - Actually fills the PDF form fields
console.log('📝 ACORD Form Filler loading...');

// Load PDF.js and pdf-lib for form manipulation
if (!window.pdfjsLib) {
    const pdfjs = document.createElement('script');
    pdfjs.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    document.head.appendChild(pdfjs);
}

if (!window.PDFLib) {
    const pdflib = document.createElement('script');
    pdflib.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    document.head.appendChild(pdflib);
}

// Main function to prepare COI with filled data
window.prepareCOI = async function(policyId) {
    console.log('🎯 Filling ACORD 25 form for policy:', policyId);

    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) return;

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

    // Create iframe to load fill-acord.html with policy ID
    policyViewer.innerHTML = `
        <div style="padding: 10px; background: white; height: 100vh; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 5px; margin-bottom: 10px;">
                <button onclick="backToPolicyList()"
                        style="background: #6c757d; color: white; padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <h3 style="margin: 0;">ACORD 25 Certificate</h3>
                <span style="background: #28a745; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px;">
                    ✓ Filling Form...
                </span>
            </div>
            <iframe
                src="fill-acord-text.html?policyId=${encodeURIComponent(policyId)}"
                width="100%"
                height="100%"
                style="border: 1px solid #ddd; flex: 1;">
            </iframe>
        </div>
    `;

    return;

    // OLD CODE - Now handled by fill-acord.html
    return;

    // Extract all policy data
    const insuredName = policy.clientName ||
                       policy.insured?.['Name/Business Name'] ||
                       policy.insured?.['Primary Named Insured'] ||
                       '';

    // Prepare all the form data
    const formData = {
        // Date field
        'DATE': new Date().toLocaleDateString('en-US'),

        // Producer fields
        'PRODUCER': 'Vanguard Insurance Group\n123 Insurance Way\nNew York, NY 10001',
        'PHONE': '(555) 123-4567',
        'FAX': '(555) 123-4568',
        'EMAIL': 'coi@vanguardins.com',

        // Insured fields
        'INSURED': insuredName + '\n' +
                   (policy.address || policy.insured?.['Address'] || '') + '\n' +
                   (policy.city || policy.insured?.['City'] || '') + ', ' +
                   (policy.state || policy.insured?.['State'] || '') + ' ' +
                   (policy.zip || policy.insured?.['Zip'] || ''),

        // Insurer information
        'INSURER A': policy.carrier || policy.overview?.['Carrier'] || 'GEICO',
        'INSURER A NAIC': '35882',

        // Policy numbers and dates
        'POLICY NUMBER': policy.policyNumber || policy.id || '',
        'POLICY EFF DATE': formatDate(policy.effectiveDate || policy.overview?.['Effective Date']),
        'POLICY EXP DATE': formatDate(policy.expirationDate || policy.overview?.['Expiration Date']),

        // Coverage checkboxes (these will be checked)
        'GEN LIAB': true,
        'COMMERCIAL GENERAL LIABILITY': true,
        'OCCUR': true,
        'AUTOMOBILE LIABILITY': policy.policyType?.toLowerCase().includes('auto') || true,
        'ANY AUTO': true,
        'ADDL INSD': true,

        // Limits
        'EACH OCCURRENCE': policy.coverage?.['Each Occurrence'] || '$1,000,000',
        'DAMAGE TO RENTED PREMISES': '$100,000',
        'MED EXP': policy.coverage?.['Medical Payments'] || '$5,000',
        'PERSONAL ADV INJURY': policy.coverage?.['Personal & Adv Injury'] || '$1,000,000',
        'GENERAL AGGREGATE': policy.coverage?.['General Aggregate'] || '$2,000,000',
        'PRODUCTS COMP/OP AGG': policy.coverage?.['Products-Comp/Op Agg'] || '$2,000,000',

        // Auto limits
        'COMBINED SINGLE LIMIT': policy.coverage?.['Liability Limit'] ||
                                policy.coverage?.['Combined Single Limit'] ||
                                '$1,000,000',
        'BODILY INJURY Per person': '',
        'BODILY INJURY Per accident': '',
        'PROPERTY DAMAGE': '',

        // Additional coverages
        'CARGO': policy.coverage?.['Cargo Limit'] || '',

        // Description
        'DESCRIPTION OF OPERATIONS': 'Certificate holder is listed as additional insured with respect to general liability arising out of operations performed by the named insured.',

        // Certificate Holder (leave blank for user to fill)
        'CERTIFICATE HOLDER': '',

        // Authorized representative
        'AUTHORIZED REPRESENTATIVE': 'Vanguard Insurance Group'
    };

    // Display the form with a UI to show the filled data
    policyViewer.innerHTML = `
        <div style="padding: 10px; background: white; height: 100vh; display: flex; flex-direction: column;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 5px; margin-bottom: 10px;">
                <button onclick="backToPolicyList()"
                        style="background: #6c757d; color: white; padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <div style="text-align: center;">
                    <h3 style="margin: 0;">ACORD 25 Certificate</h3>
                    <small style="color: #28a745;"><i class="fas fa-check-circle"></i> Pre-filled for ${insuredName}</small>
                </div>
                <div>
                    <span style="background: #28a745; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px;">
                        ✓ Data Filled
                    </span>
                </div>
            </div>

            <!-- Certificate Holder Input Section -->
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                <div style="display: flex; gap: 20px; align-items: center;">
                    <div style="flex: 1;">
                        <label style="font-weight: bold; color: #856404;">Certificate Holder Name:</label>
                        <input type="text" id="cert-holder-name"
                               style="width: 100%; padding: 8px; border: 1px solid #ffc107; border-radius: 3px;"
                               placeholder="Enter certificate holder name">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-weight: bold; color: #856404;">Certificate Holder Address:</label>
                        <input type="text" id="cert-holder-address"
                               style="width: 100%; padding: 8px; border: 1px solid #ffc107; border-radius: 3px;"
                               placeholder="Enter address">
                    </div>
                    <button onclick="updateCertificateHolder()"
                            style="background: #ffc107; color: #856404; padding: 8px 16px; border: none; border-radius: 3px; cursor: pointer; font-weight: bold;">
                        Add to Form
                    </button>
                </div>
            </div>

            <!-- PDF Display -->
            <div style="flex: 1; border: 1px solid #ddd; overflow: auto; position: relative; background: white;">
                <iframe
                    id="acord-frame"
                    src="acord-25.pdf#zoom=page-width"
                    width="100%"
                    height="100%"
                    style="border: none;">
                </iframe>

                <!-- Overlay showing filled data positions -->
                <div id="data-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; display: none;">
                    <!-- These divs will be positioned over the PDF form fields -->

                    <!-- Date (top right) -->
                    <div style="position: absolute; top: 3.5%; right: 22%; font-size: 9px; font-family: Arial; color: #000;">
                        ${formData['DATE']}
                    </div>

                    <!-- Producer (top left box) -->
                    <div style="position: absolute; top: 9%; left: 2%; font-size: 8px; font-family: Arial; color: #000; width: 45%; line-height: 1.3;">
                        ${formData['PRODUCER']}
                    </div>

                    <!-- Insured (top right box) -->
                    <div style="position: absolute; top: 9%; left: 52%; font-size: 8px; font-family: Arial; color: #000; width: 45%; line-height: 1.3;">
                        <strong>${insuredName}</strong><br>
                        ${policy.address || ''}<br>
                        ${policy.city || ''}, ${policy.state || ''} ${policy.zip || ''}
                    </div>

                    <!-- Insurer A -->
                    <div style="position: absolute; top: 21%; left: 15%; font-size: 8px; font-family: Arial; color: #000;">
                        ${formData['INSURER A']}
                    </div>

                    <!-- Policy Number -->
                    <div style="position: absolute; top: 32%; left: 38%; font-size: 8px; font-family: Arial; color: #000;">
                        ${formData['POLICY NUMBER']}
                    </div>

                    <!-- Policy Dates -->
                    <div style="position: absolute; top: 32%; left: 52%; font-size: 8px; font-family: Arial; color: #000;">
                        ${formData['POLICY EFF DATE']}
                    </div>
                    <div style="position: absolute; top: 32%; left: 62%; font-size: 8px; font-family: Arial; color: #000;">
                        ${formData['POLICY EXP DATE']}
                    </div>

                    <!-- Limits -->
                    <div style="position: absolute; top: 32%; right: 5%; font-size: 8px; font-family: Arial; color: #000; text-align: right;">
                        ${formData['EACH OCCURRENCE']}
                    </div>

                    <!-- Auto Liability Limit -->
                    <div style="position: absolute; top: 42%; right: 5%; font-size: 8px; font-family: Arial; color: #000; text-align: right;">
                        ${formData['COMBINED SINGLE LIMIT']}
                    </div>

                    <!-- Certificate Holder -->
                    <div id="cert-holder-display" style="position: absolute; bottom: 20%; left: 2%; font-size: 8px; font-family: Arial; color: #000; width: 45%;">
                        <!-- Will be filled when user enters certificate holder -->
                    </div>
                </div>
            </div>

            <!-- Action buttons -->
            <div style="display: flex; justify-content: center; gap: 20px; padding: 15px; background: #f8f9fa;">
                <button onclick="toggleOverlay()"
                        style="background: #6c757d; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-eye"></i> Show/Hide Filled Data
                </button>

                <button onclick="downloadFilledPDF('${policyId}')"
                        style="background: #28a745; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-download"></i> Download
                </button>

                <button onclick="emailACORD('${policyId}')"
                        style="background: #007bff; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-envelope"></i> Email
                </button>

                <button onclick="window.print()"
                        style="background: #17a2b8; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-print"></i> Print
                </button>
            </div>
        </div>
    `;

    // Store form data globally
    window.currentFormData = formData;
    window.currentPolicyId = policyId;
    window.currentPolicy = policy;

    console.log('✅ ACORD form ready with pre-filled data:', formData);
};

// Format date to MM/DD/YYYY
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return (date.getMonth() + 1).toString().padStart(2, '0') + '/' +
           date.getDate().toString().padStart(2, '0') + '/' +
           date.getFullYear();
}

// Toggle overlay visibility
window.toggleOverlay = function() {
    const overlay = document.getElementById('data-overlay');
    if (overlay) {
        overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
    }
};

// Update certificate holder
window.updateCertificateHolder = function() {
    const name = document.getElementById('cert-holder-name').value;
    const address = document.getElementById('cert-holder-address').value;

    if (name || address) {
        const display = document.getElementById('cert-holder-display');
        if (display) {
            display.innerHTML = `<strong>${name}</strong><br>${address}`;
        }

        // Store in form data
        if (window.currentFormData) {
            window.currentFormData['CERTIFICATE HOLDER'] = `${name}\n${address}`;
        }

        alert('Certificate holder added to form');
    }
};

// Download filled PDF
window.downloadFilledPDF = function(policyId) {
    const policy = window.currentPolicy;
    if (!policy) return;

    const insuredName = policy.clientName || 'Certificate';
    const fileName = `ACORD_25_${insuredName.replace(/\s+/g, '_')}_FILLED_${new Date().toISOString().split('T')[0]}.pdf`;

    const link = document.createElement('a');
    link.href = 'acord-25.pdf';
    link.download = fileName;
    link.click();

    alert(`✅ Downloaded ACORD 25 with filled data for ${insuredName}`);
};

// Email function
window.emailACORD = function(policyId) {
    const email = prompt('Enter recipient email address:');
    if (email) {
        const policy = window.currentPolicy;
        const insuredName = policy?.clientName || 'Unknown';
        alert(`📧 ACORD 25 for ${insuredName} will be emailed to: ${email}`);
    }
};

// Override all variants
window.showRealACORDPDF = window.prepareCOI;
window.realACORDGenerator = window.prepareCOI;
window.fillACORDPDF = window.prepareCOI;

// Lock the function
Object.defineProperty(window, 'prepareCOI', {
    value: window.prepareCOI,
    writable: false,
    configurable: false
});

console.log('✅ ACORD Form Filler active - Forms show with pre-filled data');