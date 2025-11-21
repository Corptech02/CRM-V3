// FORCE ACORD PDF - Ultimate override to show real ACORD PDF
console.log('🔥 FORCE ACORD PDF LOADING...');

// Create the function that shows the real ACORD PDF
function showRealACORDPDF(policyId) {
    console.log('📄 SHOWING REAL ACORD PDF for:', policyId);

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

    const insuredName = policy?.clientName ||
                       policy?.insured?.['Name/Business Name'] ||
                       policy?.insured?.['Primary Named Insured'] ||
                       'Unknown';
    const policyNumber = policy?.policyNumber || policy?.id || 'N/A';
    const carrier = policy?.carrier || policy?.overview?.['Carrier'] || 'N/A';
    const effectiveDate = policy?.effectiveDate || policy?.overview?.['Effective Date'] || '';
    const expirationDate = policy?.expirationDate || policy?.overview?.['Expiration Date'] || '';

    // FORCE the PDF viewer HTML
    policyViewer.innerHTML = `
        <div style="padding: 20px; background: white;">
            <!-- Big Success Header -->
            <div style="background: #28a745; color: white; padding: 30px; text-align: center; font-size: 32px; font-weight: bold; margin-bottom: 20px; border-radius: 10px;">
                ✅ REAL ACORD® 25 CERTIFICATE - FILLABLE PDF
            </div>

            <!-- Policy Info -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px; border: 3px solid #007bff;">
                <h2 style="color: #007bff; margin: 0 0 15px 0;">Policy Information</h2>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; font-size: 16px;">
                    <div><strong>Insured:</strong> ${insuredName}</div>
                    <div><strong>Policy #:</strong> ${policyNumber}</div>
                    <div><strong>Carrier:</strong> ${carrier}</div>
                    <div><strong>Period:</strong> ${effectiveDate} to ${expirationDate}</div>
                </div>
            </div>

            <!-- Instructions -->
            <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
                <h3 style="color: #856404; margin: 0 0 10px 0;">📝 Instructions:</h3>
                <ol style="color: #856404; margin: 0; padding-left: 20px;">
                    <li>The ACORD 25 PDF is displayed below</li>
                    <li>Click in the PDF to fill in certificate holder information</li>
                    <li>Download or print when complete</li>
                </ol>
            </div>

            <!-- PDF Display Frame -->
            <div style="border: 3px solid #28a745; border-radius: 10px; padding: 10px; background: #e8f5e9;">
                <h3 style="text-align: center; color: #2e7d32; margin: 0 0 10px 0;">
                    📄 ACORD 25 Certificate of Liability Insurance
                </h3>

                <!-- Try multiple methods to display PDF -->
                <div style="width: 100%; height: 800px; background: white; position: relative;">
                    <!-- Method 1: iframe -->
                    <iframe
                        src="acord-25.pdf"
                        width="100%"
                        height="100%"
                        style="border: none;">
                    </iframe>

                    <!-- Fallback if iframe doesn't work -->
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; display: none;">
                        <p style="font-size: 18px; color: #333;">PDF viewer not available in browser</p>
                        <a href="acord-25.pdf" target="_blank"
                           style="display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 18px;">
                            Open ACORD 25 PDF
                        </a>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin-top: 30px; padding: 25px; background: #f8f9fa; border-radius: 10px;">
                <a href="acord-25.pdf" download="ACORD_25_${insuredName.replace(/\s+/g, '_')}.pdf"
                   style="display: inline-block; background: #28a745; color: white; padding: 20px 50px; text-decoration: none; font-size: 20px; font-weight: bold; border-radius: 8px; margin: 10px;">
                    <i class="fas fa-download"></i> Download ACORD 25
                </a>

                <a href="acord-25.pdf" target="_blank"
                   style="display: inline-block; background: #007bff; color: white; padding: 20px 50px; text-decoration: none; font-size: 20px; font-weight: bold; border-radius: 8px; margin: 10px;">
                    <i class="fas fa-external-link-alt"></i> Open in New Tab
                </a>

                <button onclick="window.print()"
                        style="background: #6c757d; color: white; padding: 20px 50px; border: none; font-size: 20px; font-weight: bold; border-radius: 8px; margin: 10px; cursor: pointer;">
                    <i class="fas fa-print"></i> Print
                </button>
            </div>

            <!-- Back Button -->
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="backToPolicyList()"
                        style="background: #dc3545; color: white; padding: 15px 40px; border: none; font-size: 18px; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-arrow-left"></i> Back to Policies
                </button>
            </div>

            <!-- Also try object tag as backup -->
            <object data="acord-25.pdf" type="application/pdf" width="100%" height="0" style="display: none;">
                <embed src="acord-25.pdf" type="application/pdf" />
            </object>
        </div>
    `;

    console.log('✅ ACORD PDF viewer HTML injected');
}

// AGGRESSIVELY OVERRIDE ALL FUNCTIONS
window.prepareCOI = showRealACORDPDF;
window.realACORDGenerator = showRealACORDPDF;
window.showRealACORD = showRealACORDPDF;
window.generateACORDPDFNow = showRealACORDPDF;
window.createRealPDF = showRealACORDPDF;

// Override every 100ms
setInterval(() => {
    window.prepareCOI = showRealACORDPDF;
    window.realACORDGenerator = showRealACORDPDF;
    window.showRealACORD = showRealACORDPDF;

    // Also check for any functions that might be overriding ours
    if (window.prepareCOI !== showRealACORDPDF) {
        console.log('⚠️ prepareCOI was overridden, fixing...');
        window.prepareCOI = showRealACORDPDF;
    }
}, 100);

// Intercept ALL clicks on prepare COI buttons
document.addEventListener('click', function(e) {
    const target = e.target;
    const onclick = target.getAttribute('onclick') || '';

    // Check if this is a prepare COI button
    if (onclick.includes('prepareCOI') ||
        onclick.includes('realACORD') ||
        onclick.includes('generateACORD') ||
        target.textContent.includes('Prepare COI') ||
        target.textContent.includes('ACORD')) {

        console.log('🎯 Intercepted COI button click');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Extract policy ID
        const match = onclick.match(/['"]([^'"]+)['"]/);
        const policyId = match ? match[1] : null;

        if (policyId) {
            showRealACORDPDF(policyId);
        }

        return false;
    }
}, true);

// Replace onclick attributes directly
setInterval(() => {
    document.querySelectorAll('[onclick*="prepareCOI"], [onclick*="ACORD"], [onclick*="realACORD"]').forEach(el => {
        const onclick = el.getAttribute('onclick');
        if (onclick) {
            const match = onclick.match(/\(['"]([^'"]+)['"]\)/);
            if (match && match[1]) {
                el.onclick = function(e) {
                    e.preventDefault();
                    showRealACORDPDF(match[1]);
                    return false;
                };
                console.log('✅ Replaced onclick for button');
            }
        }
    });
}, 500);

console.log('🔥 FORCE ACORD PDF ACTIVE - Real ACORD PDF will be shown!');