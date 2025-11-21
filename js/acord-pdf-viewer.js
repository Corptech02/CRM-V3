// ACORD PDF Viewer - Shows the real ACORD 25 fillable PDF
console.log('📄 ACORD PDF Viewer loading...');

// Override prepareCOI to show the real ACORD PDF
window.prepareCOI = function(policyId) {
    console.log('🎯 Showing REAL ACORD 25 PDF for policy:', policyId);

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

    // Extract policy details for display
    const insuredName = policy.clientName ||
                       policy.insured?.['Name/Business Name'] ||
                       policy.insured?.['Primary Named Insured'] ||
                       'Unknown';
    const policyNumber = policy.policyNumber || policy.id;
    const carrier = policy.carrier || policy.overview?.['Carrier'] || 'N/A';
    const effectiveDate = policy.effectiveDate || policy.overview?.['Effective Date'] || '';
    const expirationDate = policy.expirationDate || policy.overview?.['Expiration Date'] || '';

    // Display the real ACORD PDF with policy info
    policyViewer.innerHTML = `
        <div style="padding: 20px; background: white;">
            <!-- Header with Policy Info -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="margin: 0; font-size: 28px;">
                            <i class="fas fa-file-pdf"></i> Official ACORD® 25 Certificate
                        </h1>
                        <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.95;">Certificate of Liability Insurance</p>
                    </div>
                    <button onclick="backToPolicyList()"
                            style="background: white; color: #667eea; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px;">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                </div>
            </div>

            <!-- Policy Information Bar -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px; border-left: 5px solid #007bff;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                    <div>
                        <div style="color: #6c757d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Insured</div>
                        <div style="font-size: 18px; font-weight: bold; color: #212529;">${insuredName}</div>
                    </div>
                    <div>
                        <div style="color: #6c757d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Policy Number</div>
                        <div style="font-size: 18px; font-weight: bold; color: #212529;">${policyNumber}</div>
                    </div>
                    <div>
                        <div style="color: #6c757d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Carrier</div>
                        <div style="font-size: 18px; font-weight: bold; color: #212529;">${carrier}</div>
                    </div>
                    <div>
                        <div style="color: #6c757d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Policy Period</div>
                        <div style="font-size: 16px; color: #212529;">${effectiveDate} - ${expirationDate}</div>
                    </div>
                </div>
            </div>

            <!-- Instructions -->
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
                <i class="fas fa-info-circle" style="color: #0c5460; margin-right: 10px;"></i>
                <strong style="color: #0c5460;">Instructions:</strong>
                <span style="color: #0c5460;">This is the official ACORD 25 fillable PDF. You can fill in the certificate holder information directly in the PDF below, then download or print it.</span>
            </div>

            <!-- PDF Viewer -->
            <div style="border: 2px solid #dee2e6; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <iframe
                    src="acord-25.pdf"
                    width="100%"
                    height="900px"
                    style="border: none; display: block;">
                    <p>Your browser cannot display PDFs.
                       <a href="acord-25.pdf" download style="color: #007bff;">Download the ACORD 25 PDF</a>
                    </p>
                </iframe>
            </div>

            <!-- Action Buttons -->
            <div style="margin-top: 30px; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                <div style="margin-bottom: 15px;">
                    <i class="fas fa-exclamation-circle" style="color: #856404;"></i>
                    <span style="color: #856404; font-size: 14px;">Fill in the certificate holder information in the PDF above before downloading or printing</span>
                </div>
                <a href="acord-25.pdf" download="ACORD_25_${insuredName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf"
                   style="display: inline-block; background: #28a745; color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-size: 18px; font-weight: bold; margin: 10px;">
                    <i class="fas fa-download"></i> Download ACORD 25 PDF
                </a>
                <button onclick="window.print()"
                        style="background: #007bff; color: white; padding: 15px 40px; border: none; border-radius: 8px; font-size: 18px; font-weight: bold; cursor: pointer; margin: 10px;">
                    <i class="fas fa-print"></i> Print Certificate
                </button>
                <a href="https://github.com/Corptech02/LLCinfo/raw/main/ACORD%2025%20fillable.pdf" target="_blank"
                   style="display: inline-block; background: #6c757d; color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-size: 18px; font-weight: bold; margin: 10px;">
                    <i class="fas fa-external-link-alt"></i> Open in New Tab
                </a>
            </div>

            <!-- ACORD Notice -->
            <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 12px; color: #6c757d; text-align: center;">
                <strong>ACORD CERTIFICATE OF LIABILITY INSURANCE</strong><br>
                This certificate is issued as a matter of information only and confers no rights upon the certificate holder.<br>
                © 1988-2015 ACORD CORPORATION. All rights reserved.<br>
                ACORD 25 (2016/03) - The ACORD name and logo are registered marks of ACORD
            </div>
        </div>
    `;

    // Also load PDF.js to ensure PDF displays properly
    if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
            console.log('✅ PDF.js loaded for better PDF display');
        };
        document.head.appendChild(script);
    }
};

// Force override all variants
window.realACORDGenerator = window.prepareCOI;
window.showRealACORD = window.prepareCOI;
window.generateACORDPDFNow = window.prepareCOI;

// Override buttons continuously
setInterval(() => {
    document.querySelectorAll('[onclick*="prepareCOI"]').forEach(el => {
        const onclick = el.getAttribute('onclick');
        if (onclick && !onclick.includes('window.prepareCOI')) {
            el.setAttribute('onclick', onclick.replace('prepareCOI', 'window.prepareCOI'));
        }
    });
}, 500);

console.log('✅ ACORD PDF Viewer active - Real ACORD 25 fillable PDF will be displayed');