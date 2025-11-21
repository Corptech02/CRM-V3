// ACORD 25 Embedded Display - Shows PDF directly in the box
console.log('📄 ACORD 25 Embedded Display Loading...');

// Override the prepareCOI function to display the ACORD PDF in the box
window.prepareCOI = async function(policyId) {
    console.log('Preparing COI with ACORD 25 for policy:', policyId);

    // Use REAL viewer if available - this is what we want!
    if (window.createRealACORDViewer) {
        console.log('Using REAL ACORD viewer with full control');
        await window.createRealACORDViewer(policyId);
        return;
    }

    // Fallback to simple display - removed as we want to use embedded view below
    // if (window.simplePrepareCOI) {
    //     console.log('Using simple ACORD display');
    //     window.simplePrepareCOI(policyId);
    //     return;
    // }

    // Get the policy viewer element
    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer) {
        console.error('Policy viewer not found');
        return;
    }

    // Show loading state immediately
    policyViewer.innerHTML = `
        <div style="height: 100%; display: flex; align-items: center; justify-content: center; background: white;">
            <div style="text-align: center;">
                <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #0066cc; margin-bottom: 20px;"></i>
                <h2 style="color: #333; margin: 0;">Loading ACORD 25 Form...</h2>
                <p style="color: #666; margin-top: 10px;">Please wait while we prepare the certificate</p>
            </div>
        </div>
    `;

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

    // Check if there's a saved COI for this policy
    let hasSaved = false;
    if (window.checkSavedCOI) {
        hasSaved = await window.checkSavedCOI(policyId);
        if (hasSaved) {
            console.log('Found saved COI for policy:', policyId);
        }
    }

    // Create the ACORD 25 display with embedded PDF - using the original layout style
    policyViewer.innerHTML = `
        <div class="acord-container" style="height: 100%; display: flex; flex-direction: column; background: white;">
            <!-- Header with actions -->
            <div class="acord-header" style="padding: 20px; background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div>
                    <h2 style="margin: 0; font-size: 24px; font-weight: 600;">
                        <i class="fas fa-file-contract"></i> ACORD 25 Certificate of Insurance
                    </h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">
                        Policy: ${policy.policyNumber || 'N/A'} | ${policy.carrier || 'N/A'}
                    </p>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button onclick="saveCOI('${policyId}', event)" class="btn-primary" style="background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        <i class="fas fa-save"></i> Save COI
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

            <!-- PDF Viewer - Maximized to fill width -->
            <div class="pdf-container" style="flex: 1; padding: 0; background: #f3f4f6; overflow: auto;">
                <div style="width: 100%; height: 100%; background: white; overflow: hidden; min-height: 1000px;">
                    <!-- Using embed tag with zoom to fit width - Load saved or fillable form -->
                    <embed
                        id="acordPdfEmbed"
                        src="${hasSaved ? 'http://162.220.14.239:3001/api/get-saved-coi/' + policyId : 'ACORD_25_fillable.pdf'}#view=FitH&toolbar=1&navpanes=0&scrollbar=1&zoom=125"
                        type="application/pdf"
                        width="100%"
                        height="100%"
                        style="min-height: 1000px;">
                </div>
            </div>

            <!-- Status Bar -->
            <div style="padding: 15px 20px; background: white; border-top: 1px solid #e5e7eb; display: flex; justify-content: between; align-items: center;">
                <div style="flex: 1;">
                    <span style="color: #6b7280; font-size: 14px;">
                        <i class="fas fa-info-circle"></i>
                        ACORD 25 (2016/03) - Certificate of Liability Insurance
                    </span>
                </div>
                <div style="display: flex; gap: 20px; align-items: center;">
                    <span style="color: #10b981; font-size: 14px;" id="coiStatus">
                        ${hasSaved ? '<i class="fas fa-edit"></i> Edit saved COI' : '<i class="fas fa-check-circle"></i> Ready to fill'}
                    </span>
                </div>
            </div>
        </div>
    `;

    // If embed doesn't work, fallback to object/iframe
    setTimeout(() => {
        const embed = document.getElementById('acordPdfEmbed');
        if (embed && !embed.contentDocument) {
            console.log('Embed failed, trying object tag...');
            const container = embed.parentElement;
            container.innerHTML = `
                <object
                    data="ACORD_25_fillable.pdf#view=FitH&toolbar=1&navpanes=0&scrollbar=1&zoom=125"
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    style="min-height: 1000px;">
                    <iframe
                        src="ACORD_25_fillable.pdf#view=FitH&toolbar=1&navpanes=0&scrollbar=1&zoom=125"
                        width="100%"
                        height="100%"
                        style="min-height: 1000px; border: none;">
                        <p>Your browser doesn't support embedded PDF viewing.
                        <a href="ACORD_25_fillable.pdf" target="_blank" style="color: #0066cc;">
                            Click here to open the ACORD 25 form.
                        </a></p>
                    </iframe>
                </object>
            `;
        }
    }, 500);

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

    // The form already has Grant Corp prefilled, just scroll to it
    console.log('Form already contains Grant Corp as Authorized Representative');

    // Scroll to the PDF
    const pdfContainer = document.querySelector('.pdf-container');
    if (pdfContainer) {
        pdfContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // Show a subtle success message
    const successDiv = document.createElement('div');
    successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 20px; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 10000;';
    successDiv.innerHTML = '<i class="fas fa-check-circle"></i> Grant Corp is prefilled as Authorized Representative';
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
};

// Function to download the ACORD PDF
window.downloadACORD = function() {
    alert('Download button clicked!');
    console.log('downloadACORD function called');
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
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
};

// Function to print the ACORD PDF
window.printACORD = function() {
    // Try to print the embedded PDF
    const embed = document.getElementById('acordPdfEmbed');
    if (embed && embed.contentWindow) {
        embed.contentWindow.print();
    } else {
        // Fallback - open in new window for printing
        const printWindow = window.open('ACORD_25_fillable.pdf', '_blank');
        if (printWindow) {
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    }
};

// Function to email the ACORD
window.emailACORD = function(policyId) {
    const policy = window.currentCOIPolicy;
    const subject = `Certificate of Insurance - Policy ${policy.policyNumber || policyId}`;
    const body = `Please find attached the Certificate of Insurance for policy ${policy.policyNumber || policyId}.

Policy Details:
- Carrier: ${policy.carrier || 'N/A'}
- Type: ${policy.policyType ? policy.policyType.replace(/-/g, ' ').toUpperCase() : 'N/A'}
- Effective: ${policy.effectiveDate || 'N/A'} to ${policy.expirationDate || 'N/A'}

Note: Please download and attach the ACORD 25 PDF to this email.`;

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

// Function to go back to policy view
window.backToPolicyView = function(policyId) {
    console.log('Going back to policies list view');

    // Check if we stored the original HTML for back navigation
    if (window.originalPolicyListHTML) {
        console.log('Restoring original COI view');

        // Check if the stored HTML contains both policyList and policyViewer
        if (window.originalPolicyListHTML.includes('id="policyList"')) {
            // We have the full COI view, restore it to parent container
            const coiContainer = document.querySelector('.content-section.active');
            if (coiContainer) {
                coiContainer.innerHTML = window.originalPolicyListHTML;
            }
        } else {
            // Just restore policyViewer content
            const policyViewer = document.getElementById('policyViewer');
            if (policyViewer) {
                policyViewer.innerHTML = window.originalPolicyListHTML;
            }
        }

        // Clear the stored HTML
        window.originalPolicyListHTML = null;
        return;
    }

    // Fallback - reload the COI section
    console.log('No stored view, reloading COI section');
    const coiTab = document.querySelector('a[href="#coi"]');
    if (coiTab) {
        coiTab.click();
    }
};

// Quick save function - simpler approach
window.quickSaveCOI = async function(policyId, event) {
    console.log('Quick save COI for policy:', policyId);

    // Show instructions to use PDF viewer's save
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <h3 style="margin: 0 0 20px 0; color: #333;">
                <i class="fas fa-save" style="color: #10b981;"></i> Save Your Filled ACORD Form
            </h3>

            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0; font-weight: 500; color: #333;">Step 1: Save the filled PDF from viewer</p>
                <ol style="margin: 10px 0; padding-left: 20px; color: #555;">
                    <li>Look for the <strong>⋮ (three dots)</strong> menu in the PDF viewer above</li>
                    <li>Click it and select <strong>"Save"</strong> or <strong>"Download"</strong></li>
                    <li>Save the file (it will contain all your filled data)</li>
                </ol>
            </div>

            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0; font-weight: 500; color: #333;">Step 2: Upload to server</p>
                <p style="margin: 10px 0; color: #555;">After saving, click the button below to upload the filled PDF to the server</p>
            </div>

            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="this.closest('div').parentElement.remove()"
                        style="padding: 10px 20px; background: #e5e7eb; color: #333; border: none; border-radius: 6px; cursor: pointer;">
                    Cancel
                </button>
                <button onclick="selectAndUploadCOI('${policyId}', this.closest('div').parentElement)"
                        style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    <i class="fas fa-upload"></i> Select & Upload Saved PDF
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

// Function to select and upload the saved COI
window.selectAndUploadCOI = function(policyId, modal) {
    // Create hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.style.display = 'none';

    fileInput.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Show loading state
        if (modal) {
            const uploadBtn = modal.querySelector('button[onclick*="selectAndUploadCOI"]');
            if (uploadBtn) {
                uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
                uploadBtn.disabled = true;
            }
        }

        console.log('Uploading filled COI:', file.name);

        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('policyId', policyId);

        try {
            const response = await fetch('http://162.220.14.239:3001/api/upload-filled-coi', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Upload successful:', result);

                // Remove modal
                if (modal) modal.remove();

                // Show success message
                const successDiv = document.createElement('div');
                successDiv.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #10b981;
                    color: white;
                    padding: 15px 25px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                `;
                successDiv.innerHTML = `
                    <i class="fas fa-check-circle" style="font-size: 20px;"></i>
                    <div>
                        <strong>COI Saved Successfully!</strong><br>
                        <small>Your filled ACORD form has been saved to the server</small>
                    </div>
                `;
                document.body.appendChild(successDiv);
                setTimeout(() => successDiv.remove(), 4000);

                // Update status in the UI
                const statusText = document.querySelector('#coiStatus');
                if (statusText) {
                    statusText.innerHTML = '<i class="fas fa-check-circle"></i> Filled & Saved';
                    statusText.style.color = '#10b981';
                }

                // Update the PDF viewer to show the saved version
                const embedElement = document.getElementById('acordPdfEmbed');
                if (embedElement) {
                    // Add timestamp to force refresh
                    embedElement.src = `http://162.220.14.239:3001/api/get-saved-coi/${policyId}#view=FitH&toolbar=1&navpanes=0&scrollbar=1&zoom=125&t=${Date.now()}`;
                }
            } else {
                const error = await response.text();
                throw new Error(error);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload COI: ' + error.message);

            // Restore button state
            if (modal) {
                const uploadBtn = modal.querySelector('button[onclick*="selectAndUploadCOI"]');
                if (uploadBtn) {
                    uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Select & Upload Saved PDF';
                    uploadBtn.disabled = false;
                }
            }
        }
    };

    // Trigger file selection
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
};

// Simple direct save function
window.saveCOI = async function(policyId, event) {
    console.log('Saving COI for policy:', policyId);

    // Get button reference
    const saveButton = event ? event.currentTarget : null;
    let originalContent = '';
    if (saveButton) {
        originalContent = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveButton.disabled = true;
    }

    try {
        // Show instructions in status bar instead of popup
        const statusEl = document.getElementById('coiStatus');
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-info-circle"></i> Use PDF viewer menu (⋮) > Save to save your filled form, then reload to see saved version';
            statusEl.style.color = '#0066cc';
        }

        // Simulate save to update UI
        setTimeout(() => {
            if (statusEl) {
                statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Ready - Save form using viewer menu';
                statusEl.style.color = '#10b981';
            }

            if (saveButton) {
                saveButton.innerHTML = originalContent;
                saveButton.disabled = false;
            }
        }, 1500);

    } catch (error) {
        console.error('Error:', error);
        if (saveButton) {
            saveButton.innerHTML = originalContent;
            saveButton.disabled = false;
        }
    }
};

// Function to save COI with actual form field data (original complex version)
window.saveCOIComplex = async function(policyId, event) {
    console.log('Saving filled ACORD form for policy:', policyId);

    // Show loading state on save button
    const saveButton = event ? event.currentTarget : null;
    let originalContent = '';
    if (saveButton) {
        originalContent = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveButton.disabled = true;
    }

    try {
        // Get the PDF embed element
        const embedElement = document.getElementById('acordPdfEmbed');

        if (!embedElement) {
            throw new Error('PDF viewer not found');
        }

        // Get the current PDF URL (which might be a blob URL if user has filled and saved locally)
        const currentSrc = embedElement.src;

        // Method 1: Try to get the filled PDF data directly from the embed
        // This works if the browser allows access to the PDF plugin
        try {
            // For modern browsers, try to access the PDF through the embed's contentDocument
            if (embedElement.contentDocument || embedElement.contentWindow) {
                console.log('Attempting to capture filled PDF from viewer...');

                // Create a hidden iframe to trigger the browser's save mechanism
                const saveFrame = document.createElement('iframe');
                saveFrame.style.display = 'none';
                saveFrame.src = currentSrc;
                document.body.appendChild(saveFrame);

                setTimeout(() => {
                    // Trigger the save through the iframe
                    if (saveFrame.contentWindow) {
                        saveFrame.contentWindow.print();
                    }
                    document.body.removeChild(saveFrame);
                }, 500);
            }
        } catch (e) {
            console.log('Direct access not available, using alternative method...');
        }

        // Method 2: Instruct user to use the PDF viewer's save button
        // Create an instruction overlay
        const instructionDiv = document.createElement('div');
        instructionDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            z-index: 10001;
            max-width: 500px;
            text-align: center;
        `;

        instructionDiv.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #333;">
                <i class="fas fa-save" style="color: #10b981;"></i> Save Your Filled ACORD Form
            </h3>
            <p style="color: #666; margin-bottom: 20px;">
                To save your filled form with all entered data:
            </p>
            <ol style="text-align: left; color: #444; margin: 15px 0;">
                <li>Look for the <strong>three dots menu (⋮)</strong> in the PDF viewer toolbar above</li>
                <li>Click on it and select <strong>"Save"</strong> or <strong>"Download"</strong></li>
                <li>Save the file as <strong>ACORD_25_${policyId}_filled.pdf</strong></li>
                <li>Click the button below to upload the saved file to the server</li>
            </ol>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                <button onclick="this.parentElement.parentElement.remove()"
                        style="padding: 10px 20px; background: #e5e7eb; color: #333; border: none; border-radius: 6px; cursor: pointer;">
                    Cancel
                </button>
                <button onclick="uploadSavedCOI('${policyId}', this.parentElement.parentElement)"
                        style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-upload"></i> Upload Saved COI
                </button>
            </div>
        `;

        document.body.appendChild(instructionDiv);

        // Restore button
        if (saveButton) {
            saveButton.innerHTML = originalContent;
            saveButton.disabled = false;
        }

    } catch (error) {
        console.error('Error saving COI:', error);
        alert('To save your filled form, use the PDF viewer\'s save option (⋮ menu > Save)');

        if (saveButton) {
            saveButton.innerHTML = originalContent;
            saveButton.disabled = false;
        }
    }
};

// Function to upload a saved COI file
window.uploadSavedCOI = function(policyId, instructionDiv) {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.style.display = 'none';

    fileInput.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        console.log('Uploading saved COI:', file.name);

        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('policyId', policyId);

        try {
            const response = await fetch('http://162.220.14.239:3001/api/upload-filled-coi', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // Show success message
                const successDiv = document.createElement('div');
                successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 20px; border-radius: 6px; z-index: 10000;';
                successDiv.innerHTML = '<i class="fas fa-check-circle"></i> COI uploaded and saved successfully!';
                document.body.appendChild(successDiv);
                setTimeout(() => successDiv.remove(), 3000);

                // Update status
                const statusText = document.querySelector('#coiStatus');
                if (statusText) {
                    statusText.innerHTML = '<i class="fas fa-file-pdf"></i> Filled COI saved';
                }

                // Remove instruction div
                if (instructionDiv) instructionDiv.remove();

                // Reload the PDF to show the saved version
                const embedElement = document.getElementById('acordPdfEmbed');
                if (embedElement) {
                    embedElement.src = `http://162.220.14.239:3001/api/get-saved-coi/${policyId}?t=${Date.now()}`;
                }
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload COI. Please try again.');
        }
    };

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
};

// Ensure the function is globally available
window.showRealACORDPDF = window.prepareCOI;
window.realACORDGenerator = window.prepareCOI;
window.generateACORDPDFNow = window.prepareCOI;

console.log('✅ ACORD 25 Embedded Display Ready - PDF shows directly in the box');