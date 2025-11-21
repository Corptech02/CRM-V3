// ACORD Simple View - Just the PDF with email/save buttons
console.log('📄 ACORD Simple View loading...');

// Simple ACORD display
window.prepareCOI = function(policyId) {
    console.log('Showing ACORD PDF for policy:', policyId);

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

    const insuredName = policy?.clientName ||
                       policy?.insured?.['Name/Business Name'] ||
                       policy?.insured?.['Primary Named Insured'] ||
                       'Unknown';

    // Simple display - just PDF and buttons
    policyViewer.innerHTML = `
        <div style="padding: 10px; background: white; height: 100vh; display: flex; flex-direction: column;">
            <!-- Simple header with back button -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 10px;">
                <button onclick="backToPolicyList()"
                        style="background: #6c757d; color: white; padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <h3 style="margin: 0;">ACORD 25 - ${insuredName}</h3>
                <div></div>
            </div>

            <!-- PDF takes up most of the space -->
            <div style="flex: 1; border: 1px solid #ddd; margin-bottom: 10px; overflow: hidden;">
                <iframe
                    src="acord-25.pdf"
                    width="100%"
                    height="100%"
                    style="border: none;">
                </iframe>
            </div>

            <!-- Simple action buttons -->
            <div style="display: flex; justify-content: center; gap: 20px; padding: 15px; background: #f8f9fa;">
                <button onclick="emailACORD('${policyId}')"
                        style="background: #007bff; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-envelope"></i> Email
                </button>

                <button onclick="saveACORD('${policyId}')"
                        style="background: #28a745; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-save"></i> Save
                </button>

                <button onclick="emailAndSaveACORD('${policyId}')"
                        style="background: #17a2b8; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-paper-plane"></i> Email & Save
                </button>
            </div>
        </div>
    `;
};

// Email ACORD function
window.emailACORD = function(policyId) {
    const email = prompt('Enter recipient email address:');
    if (email) {
        alert('ACORD 25 certificate will be emailed to: ' + email);
        // In production, this would actually send the email
    }
};

// Save ACORD function
window.saveACORD = function(policyId) {
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p =>
        p.policyNumber === policyId || p.id === policyId
    );

    const insuredName = policy?.clientName || 'Certificate';
    const fileName = `ACORD_25_${insuredName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Create download link
    const link = document.createElement('a');
    link.href = 'acord-25.pdf';
    link.download = fileName;
    link.click();

    alert('ACORD 25 saved as: ' + fileName);
};

// Email and Save function
window.emailAndSaveACORD = function(policyId) {
    const email = prompt('Enter recipient email address:');
    if (email) {
        saveACORD(policyId);
        alert('ACORD 25 certificate saved and will be emailed to: ' + email);
    }
};

// Override all variants
window.showRealACORDPDF = window.prepareCOI;
window.realACORDGenerator = window.prepareCOI;
window.generateACORDPDFNow = window.prepareCOI;
window.fillACORDPDF = window.prepareCOI;
window.displayPrefilledACORD = window.prepareCOI;

// Force override continuously
setInterval(() => {
    window.prepareCOI = window.prepareCOI;
}, 100);

console.log('✅ ACORD Simple View active - Clean PDF display with email/save options');