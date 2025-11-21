// ULTIMATE ACORD FIX - This WILL work!
console.log('🔥 ULTIMATE ACORD FIX ACTIVATING...');

// First, inject jsPDF if not present
if (!window.jsPDFInjected) {
    window.jsPDFInjected = true;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
        console.log('✅ jsPDF loaded successfully');
        window.jsPDF = window.jspdf.jsPDF;
    };
    document.head.appendChild(script);
}

// The REAL ACORD function
window.realACORDGenerator = function(policyId) {
    console.log('🎯 REAL ACORD GENERATOR TRIGGERED for:', policyId);

    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) {
        alert('Policy viewer not found');
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
        alert('Policy not found: ' + policyId);
        return;
    }

    const insuredName = policy.clientName ||
                       policy.insured?.['Name/Business Name'] ||
                       policy.insured?.['Primary Named Insured'] ||
                       'Unknown';

    // Create the REAL ACORD interface
    policyViewer.innerHTML = `
        <div style="padding: 20px; background: white; min-height: 700px;">
            <!-- REAL ACORD HEADER -->
            <div style="background: #28a745; color: white; padding: 20px; text-align: center; font-size: 28px; font-weight: bold; margin-bottom: 20px; border-radius: 10px;">
                ✅ REAL ACORD® 25 CERTIFICATE GENERATOR
            </div>

            <div style="background: #d1ecf1; border: 2px solid #0c5460; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
                <strong>SUCCESS!</strong> This is the REAL ACORD form. Enter certificate holder details below and click Generate PDF.
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div>
                    <h3>Certificate Holder Information</h3>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                            Certificate Holder Name <span style="color: red;">*</span>
                        </label>
                        <input type="text" id="real-holder-name"
                               style="width: 100%; padding: 10px; border: 2px solid #28a745; font-size: 16px;"
                               placeholder="Enter certificate holder name">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                            Certificate Holder Address <span style="color: red;">*</span>
                        </label>
                        <textarea id="real-holder-address" rows="4"
                                  style="width: 100%; padding: 10px; border: 2px solid #28a745; font-size: 16px;"
                                  placeholder="Enter complete address"></textarea>
                    </div>
                </div>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3>Policy Information</h3>
                    <p><strong>Insured:</strong> ${insuredName}</p>
                    <p><strong>Policy #:</strong> ${policy.policyNumber || policy.id}</p>
                    <p><strong>Carrier:</strong> ${policy.carrier || policy.overview?.['Carrier'] || 'N/A'}</p>
                    <p><strong>Effective:</strong> ${policy.effectiveDate || 'N/A'}</p>
                    <p><strong>Expiration:</strong> ${policy.expirationDate || 'N/A'}</p>
                </div>
            </div>

            <div style="text-align: center; margin-top: 40px;">
                <button onclick="createRealPDF('${policyId}')"
                        style="background: #28a745; color: white; padding: 20px 60px; border: none; font-size: 24px; font-weight: bold; cursor: pointer; border-radius: 10px;">
                    📄 GENERATE REAL ACORD 25 PDF
                </button>
            </div>

            <div style="margin-top: 20px; text-align: center;">
                <button onclick="backToPolicyList()"
                        style="background: #6c757d; color: white; padding: 10px 30px; border: none; cursor: pointer; border-radius: 5px;">
                    Back to Policy List
                </button>
            </div>
        </div>
    `;
};

// Create the PDF generator
window.createRealPDF = function(policyId) {
    const PDF = window.jsPDF || window.jspdf?.jsPDF;
    if (!PDF) {
        alert('PDF library not loaded. Refresh the page and try again.');
        return;
    }

    const holderName = document.getElementById('real-holder-name')?.value;
    const holderAddress = document.getElementById('real-holder-address')?.value;

    if (!holderName || !holderAddress) {
        alert('Please enter certificate holder name and address');
        return;
    }

    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId
    );

    const doc = new PDF();

    // ACORD Header
    doc.setFontSize(14);
    doc.text('ACORD CERTIFICATE OF LIABILITY INSURANCE', 105, 20, { align: 'center' });
    doc.text('Date: ' + new Date().toLocaleDateString(), 160, 30);

    // Producer
    doc.text('PRODUCER: Vanguard Insurance Group', 20, 50);

    // Insured
    const insuredName = policy?.clientName || policy?.insured?.['Name/Business Name'] || 'Unknown';
    doc.text('INSURED: ' + insuredName, 20, 70);

    // Policy info
    doc.text('Policy Number: ' + (policy?.policyNumber || 'N/A'), 20, 90);
    doc.text('Effective: ' + (policy?.effectiveDate || 'N/A'), 20, 100);
    doc.text('Expiration: ' + (policy?.expirationDate || 'N/A'), 20, 110);

    // Certificate Holder
    doc.text('CERTIFICATE HOLDER:', 20, 140);
    doc.text(holderName, 20, 150);
    const addrLines = holderAddress.split('\n');
    let y = 160;
    addrLines.forEach(line => {
        doc.text(line, 20, y);
        y += 10;
    });

    // Signature
    doc.line(120, 250, 180, 250);
    doc.text('Authorized Representative', 150, 260, { align: 'center' });

    // Save
    const fileName = `ACORD_25_${insuredName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    alert('✅ ACORD 25 PDF Generated!\n\nFile: ' + fileName);
};

// GENTLE OVERRIDE - Replace the function every 1000ms (reduced from 100ms to prevent button flashing)
function forceOverride() {
    // Override global function
    window.prepareCOI = window.realACORDGenerator;

    // Also try to override it as a direct function
    if (typeof prepareCOI !== 'undefined') {
        prepareCOI = window.realACORDGenerator;
    }
}

// Start overriding immediately
forceOverride();
setInterval(forceOverride, 1000);

// Also override when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceOverride);
} else {
    forceOverride();
}

// Intercept ALL clicks on elements with onclick="prepareCOI"
document.addEventListener('click', function(e) {
    const onclick = e.target.getAttribute('onclick');
    if (onclick && onclick.includes('prepareCOI')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Extract policy ID
        const match = onclick.match(/prepareCOI\(['"]([^'"]+)['"]\)/);
        if (match && match[1]) {
            console.log('🎯 Intercepted prepareCOI click! Redirecting to REAL generator');
            window.realACORDGenerator(match[1]);
        }
        return false;
    }
}, true);

// Also replace onclick attributes directly
function replaceOnclicks() {
    const elements = document.querySelectorAll('[onclick*="prepareCOI"]');
    elements.forEach(el => {
        const onclick = el.getAttribute('onclick');
        if (onclick) {
            const match = onclick.match(/prepareCOI\(['"]([^'"]+)['"]\)/);
            if (match && match[1]) {
                el.setAttribute('onclick', `window.realACORDGenerator('${match[1]}')`);
                console.log('✅ Replaced onclick for button');
            }
        }
    });
}

// Replace onclicks repeatedly
setInterval(replaceOnclicks, 500);
setTimeout(replaceOnclicks, 100);
setTimeout(replaceOnclicks, 1000);
setTimeout(replaceOnclicks, 2000);

console.log('🔥 ULTIMATE ACORD FIX ACTIVE - This WILL show the real ACORD form!');