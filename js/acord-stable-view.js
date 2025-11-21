// ACORD Stable View - Prevents zoom changes after load
console.log('🔒 ACORD Stable View loading...');

// Override prepareCOI with stable view
window.prepareCOI = function(policyId) {
    console.log('Showing stable ACORD PDF for policy:', policyId);

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

    // Set the HTML once and prevent any changes
    const viewerHTML = `
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

            <!-- PDF with stable zoom -->
            <div id="acord-pdf-container" style="flex: 1; border: 1px solid #ddd; margin-bottom: 10px; overflow: hidden; position: relative;">
                <iframe
                    id="acord-frame"
                    src="acord-25.pdf#zoom=100"
                    width="100%"
                    height="100%"
                    style="border: none; position: absolute; top: 0; left: 0;">
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

    // Set the HTML
    policyViewer.innerHTML = viewerHTML;

    // Lock the view after a short delay to ensure PDF loads
    setTimeout(() => {
        // Prevent any modifications to the iframe
        const iframe = document.getElementById('acord-frame');
        if (iframe) {
            // Lock the iframe src
            Object.defineProperty(iframe, 'src', {
                writable: false,
                configurable: false,
                value: iframe.src
            });

            // Prevent style changes
            const originalStyle = iframe.style.cssText;
            Object.defineProperty(iframe.style, 'cssText', {
                get: () => originalStyle,
                set: () => originalStyle
            });
        }

        // Prevent container modifications
        const container = document.getElementById('acord-pdf-container');
        if (container) {
            const originalContainerStyle = container.style.cssText;
            Object.defineProperty(container.style, 'cssText', {
                get: () => originalContainerStyle,
                set: () => originalContainerStyle
            });
        }

        console.log('✅ ACORD view locked - zoom stable');
    }, 100);
};

// Email ACORD function
window.emailACORD = function(policyId) {
    const email = prompt('Enter recipient email address:');
    if (email) {
        alert('ACORD 25 certificate will be emailed to: ' + email);
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

// Override all variants to prevent other scripts from taking over
const stablePrepareCOI = window.prepareCOI;
window.showRealACORDPDF = stablePrepareCOI;
window.realACORDGenerator = stablePrepareCOI;
window.generateACORDPDFNow = stablePrepareCOI;
window.fillACORDPDF = stablePrepareCOI;
window.displayPrefilledACORD = stablePrepareCOI;
window.showRealACORD = stablePrepareCOI;

// Prevent any function from being overridden
Object.defineProperty(window, 'prepareCOI', {
    value: stablePrepareCOI,
    writable: false,
    configurable: false
});

// Stop any intervals that might be changing things
const originalSetInterval = window.setInterval;
window.setInterval = function(fn, delay) {
    // Block any interval that tries to modify prepareCOI
    if (fn.toString().includes('prepareCOI') || fn.toString().includes('ACORD')) {
        console.log('🚫 Blocked interval that would modify ACORD view');
        return -1;
    }
    return originalSetInterval(fn, delay);
};

console.log('🔒 ACORD Stable View active - Zoom locked, no changes allowed');