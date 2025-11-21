// Simple ACORD Display - Ensures PDF shows properly
console.log('📋 Simple ACORD Display Loading...');

// Store original prepareCOI if exists
if (window.prepareCOI) {
    window.originalPrepareCOI = window.prepareCOI;
}

// Simple prepare COI that just shows the PDF
window.simplePrepareCOI = function(policyId) {
    console.log('Simple prepare COI for:', policyId);

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

    // Simple display with ACORD PDF
    policyViewer.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; background: white;">
            <!-- Header -->
            <div style="padding: 20px; background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="margin: 0; font-size: 24px; font-weight: 600;">
                            <i class="fas fa-file-contract"></i> ACORD 25 Certificate of Insurance
                        </h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">
                            Policy: ${policy?.policyNumber || 'N/A'} | ${policy?.carrier || 'N/A'}
                        </p>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button onclick="alert('Fill out form in PDF viewer, then use viewer menu to save')" style="background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                            <i class="fas fa-save"></i> Save COI
                        </button>
                        <button onclick="window.open('ACORD_25_fillable.pdf', '_blank')" style="background: white; color: #0066cc; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button onclick="backToPolicyView('${policyId}')" style="background: rgba(255,255,255,0.2); border: 2px solid white; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500;">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                    </div>
                </div>
            </div>

            <!-- PDF Display -->
            <div style="flex: 1; overflow: hidden;">
                <iframe
                    src="ACORD_25_fillable.pdf#view=FitH&zoom=125"
                    width="100%"
                    height="100%"
                    style="border: none; min-height: 800px;">
                </iframe>
            </div>

            <!-- Status -->
            <div style="padding: 15px 20px; background: white; border-top: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-size: 14px;">
                    <i class="fas fa-info-circle"></i>
                    Fill out the form directly in the PDF viewer above
                </span>
            </div>
        </div>
    `;
};

console.log('✅ Simple ACORD Display Ready');