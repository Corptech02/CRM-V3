// Save to Profile functionality for COI templates
(function() {
    try {
        console.log('💾 Save to Profile functionality loading...');

        // Create a function to upload using XMLHttpRequest to bypass fetch overrides
        function uploadToBackend(url, payload) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', url, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
                // No timeout - allow unlimited time for large PDF uploads

                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve({ ok: true, json: () => Promise.resolve(response) });
                        } catch (e) {
                            reject(new Error('Invalid JSON response'));
                        }
                    } else {
                        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                    }
                };

                xhr.onerror = function() {
                    // Connection error to our local server
                    console.error('XHR Error connecting to local COI manager. Status:', xhr.status);
                    reject(new Error('Cannot connect to local COI manager on port 3003. Checking if server is running...'));
                };

                xhr.ontimeout = function() {
                    reject(new Error('Request timeout - server not responding'));
                };

                xhr.send(JSON.stringify(payload));
            });
        }

// Function to convert blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Save COI to Profile - uploads template to website backend
window.saveCOIToProfile = async function(policyId, buttonElement) {
    console.log('📤 Saving COI template to profile for policy:', policyId);

    const policy = window.currentCOIPolicy;
    if (!policy) {
        alert('Policy data not found. Please reload the page.');
        return;
    }

    // Get button element (either from parameter or window.event for IE compatibility)
    const saveBtn = buttonElement || (window.event && window.event.target) || null;
    const originalText = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving to Profile...';
    }

    try {
        // Use the REAL download function if it exists (it generates valid PDFs)
        let base64PDF;
        let filename;

        if (typeof window.realDownloadCOI === 'function') {
            console.log('📄 Using realDownloadCOI to get valid PDF...');

            // Temporarily override download behavior to capture the PDF
            const originalCreateElement = document.createElement;
            let capturedBlob = null;

            document.createElement = function(tagName) {
                const element = originalCreateElement.call(document, tagName);
                if (tagName === 'a') {
                    const originalClick = element.click;
                    element.click = function() {
                        // Capture the blob URL
                        if (element.href && element.href.startsWith('blob:')) {
                            // Don't actually click/download
                            console.log('Captured blob URL:', element.href);
                            return;
                        }
                        return originalClick.call(this);
                    };
                }
                return element;
            };

            // Try to get PDF from the current viewer - check multiple possible element IDs
            console.log('🔍 Looking for COI viewer elements...');

            let canvas = document.getElementById('realPdfCanvas');
            let overlay = document.getElementById('realFormOverlay');

            // If not found, try other common element IDs
            if (!canvas) {
                canvas = document.getElementById('pdfCanvas') ||
                        document.querySelector('canvas[id*="pdf"]') ||
                        document.querySelector('canvas[id*="COI"]') ||
                        document.querySelector('canvas[id*="acord"]');
                console.log('🔍 Canvas search result:', canvas ? canvas.id : 'none found');
            }

            if (!overlay) {
                overlay = document.getElementById('formOverlay') ||
                         document.getElementById('coiOverlay') ||
                         document.querySelector('[id*="overlay"]') ||
                         document.querySelector('[id*="form"]');
                console.log('🔍 Overlay search result:', overlay ? overlay.id : 'none found');
            }

            // Also try to find any visible COI container
            const coiContainer = document.querySelector('.acord-container') ||
                               document.querySelector('.coi-container') ||
                               document.querySelector('[class*="acord"]') ||
                               document.querySelector('[class*="coi"]');

            console.log('🔍 Available elements:', {
                canvas: canvas ? canvas.id : 'not found',
                overlay: overlay ? overlay.id : 'not found',
                container: coiContainer ? coiContainer.className : 'not found'
            });

            if (canvas && canvas.width > 0 && canvas.height > 0) {
                console.log('🎨 Getting PDF from ACORD viewer...', {
                    canvasSize: `${canvas.width}x${canvas.height}`,
                    hasOverlay: !!overlay
                });
                const pdfData = await generatePDFFromRealACORD(policy, canvas, overlay);
                base64PDF = await blobToBase64(pdfData.data);
                filename = pdfData.filename;
            } else {
                console.log('📝 No valid canvas found, generating simple PDF...');
                console.log('📝 Canvas details:', canvas ? `${canvas.width}x${canvas.height}` : 'null');
                const pdfData = await generateSimpleCOIPDF(policy);
                base64PDF = await blobToBase64(pdfData.data);
                filename = pdfData.filename;
            }

            // Restore original createElement
            document.createElement = originalCreateElement;

        } else {
            // Fallback to template generation
            console.log('📄 Generating COI template PDF...');
            const pdfData = await generateCOITemplate(policyId);

            if (!pdfData || !pdfData.data) {
                throw new Error('Failed to generate COI PDF');
            }

            base64PDF = await blobToBase64(pdfData.data);
            filename = pdfData.filename;
        }

        // Verify PDF is valid
        console.log('🔍 Verifying PDF validity...');
        console.log('   Base64 length:', base64PDF.length);
        console.log('   First 50 chars:', base64PDF.substring(0, 50));

        // Check if it's a valid PDF by checking the header
        const pdfHeader = atob(base64PDF.substring(0, 20));
        if (!pdfHeader.startsWith('%PDF')) {
            throw new Error('Generated PDF is invalid - missing PDF header');
        }

        console.log('✅ PDF is valid');

        // Prepare upload payload
        const uploadPayload = {
            policy_number: policy.policyNumber || policyId,
            pdf_base64: base64PDF,
            filename: filename || `COI_${policy.policyNumber || policyId}_${Date.now()}.pdf`,
            uploaded_by: "CRM System"
        };

        // Save to local CRM storage via main backend port 3001
        const localStorageUrl = '/api/coi/save-template';
        const uploadUrl = localStorageUrl;

        console.log('💾 Saving COI template to local CRM storage:', {
            url: uploadUrl,
            policy_number: uploadPayload.policy_number,
            filename: uploadPayload.filename,
            pdf_size: base64PDF.length
        });

        console.log('📤 Saving COI template locally in CRM...');

        let response;
        try {
            response = await uploadToBackend(uploadUrl, uploadPayload);
        } catch (error) {
            console.error('Upload error:', error);
            throw new Error(`Cannot connect to website backend: ${error.message}`);
        }

        const result = await response.json();

        if (response.ok && result.success) {
            console.log('✅ COI template saved to profile successfully:', result);

            // Show success message
            showLocalSaveSuccess(policy.policyNumber);

            // Restore button
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved to Profile';
                saveBtn.style.background = '#10b981';
                setTimeout(() => {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalText;
                    saveBtn.style.background = '';
                }, 3000);
            }
        } else {
            throw new Error(result.error || 'Failed to save to profile');
        }
    } catch (error) {
        console.error('❌ Error saving COI to profile:', error);

        // Check if it's a CORS error
        if (error.message.includes('CORS')) {
            // Show CORS error with instructions
            const message = `CORS Error - Cannot upload to website backend!\n\n` +
                `The website at https://frenzily-nonacculturated-collin.ngrok-free.dev needs to allow requests from ${window.location.origin}\n\n` +
                `Tell the other AI to add these CORS headers to their Express server:\n` +
                `app.use(cors({ origin: '${window.location.origin}', credentials: true }))\n\n` +
                `Would you like to download the COI template locally instead?`;

            const downloadLocally = confirm(message);

            if (downloadLocally) {
                try {
                    // Download the COI locally
                    console.log('📥 Downloading COI template locally...');
                    const url = URL.createObjectURL(pdfData.data);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = pdfData.filename || `COI_${policy.policyNumber}_template.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    alert('COI template downloaded!\n\nSave this file and upload it manually to the website.');

                    if (saveBtn) {
                        saveBtn.innerHTML = '<i class="fas fa-download"></i> Downloaded Locally';
                        saveBtn.style.background = '#f59e0b';
                        setTimeout(() => {
                            saveBtn.disabled = false;
                            saveBtn.innerHTML = originalText;
                            saveBtn.style.background = '';
                        }, 3000);
                    }
                    return;
                } catch (downloadError) {
                    console.error('Error downloading COI:', downloadError);
                    alert('Failed to download COI: ' + downloadError.message);
                }
            }
        } else if (error.message.includes('connect') || error.message.includes('timeout')) {
            // Offer to download the COI locally
            const downloadLocally = confirm(
                `Cannot connect to website backend.\n\n` +
                `${error.message}\n\n` +
                `Would you like to download the COI template to your computer instead?\n\n` +
                `You can manually upload it later when the website is available.`
            );

            if (downloadLocally) {
                try {
                    // Generate and download the COI
                    console.log('📥 Downloading COI template locally...');
                    const pdfData = await generateCOITemplate(policyId);

                    if (pdfData && pdfData.data) {
                        // Create download link
                        const url = URL.createObjectURL(pdfData.data);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = pdfData.filename || `COI_${policy.policyNumber}_template.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);

                        alert('COI template downloaded successfully!\n\nYou can upload it to the website later.');

                        // Update button to show success
                        if (saveBtn) {
                            saveBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded Locally';
                            saveBtn.style.background = '#f59e0b';
                            setTimeout(() => {
                                saveBtn.disabled = false;
                                saveBtn.innerHTML = originalText;
                                saveBtn.style.background = '';
                            }, 3000);
                        }
                        return;
                    }
                } catch (downloadError) {
                    console.error('Error downloading COI:', downloadError);
                    alert('Failed to download COI: ' + downloadError.message);
                }
            }
        } else {
            // Show error message for other errors
            alert(`Failed to save COI to profile: ${error.message}`);
        }

        // Restore button
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }
};

// Generate COI template (without certificate holder info)
async function generateCOITemplate(policyId) {
    console.log('📋 Generating COI template for policy:', policyId);

    const policy = window.currentCOIPolicy;
    if (!policy) {
        throw new Error('Policy not found');
    }

    // Check if we have the real ACORD viewer with improved detection
    console.log('🔍 [Template] Looking for COI viewer elements...');

    let canvas = document.getElementById('realPdfCanvas');
    let overlay = document.getElementById('realFormOverlay');

    // Try alternative selectors
    if (!canvas) {
        canvas = document.getElementById('pdfCanvas') ||
                document.querySelector('canvas[id*="pdf"]') ||
                document.querySelector('canvas[id*="COI"]') ||
                document.querySelector('canvas[id*="acord"]');
        console.log('🔍 [Template] Canvas search result:', canvas ? canvas.id : 'none found');
    }

    if (!overlay) {
        overlay = document.getElementById('formOverlay') ||
                 document.getElementById('coiOverlay') ||
                 document.querySelector('[id*="overlay"]') ||
                 document.querySelector('[id*="form"]');
        console.log('🔍 [Template] Overlay search result:', overlay ? overlay.id : 'none found');
    }

    console.log('🔍 [Template] Available elements:', {
        canvas: canvas ? canvas.id : 'not found',
        overlay: overlay ? overlay.id : 'not found',
        canvasSize: canvas ? `${canvas.width}x${canvas.height}` : 'n/a'
    });

    if (canvas && canvas.width > 0 && canvas.height > 0) {
        // Use the real ACORD viewer to generate PDF
        console.log('🎨 [Template] Using real ACORD viewer');
        return generatePDFFromRealACORD(policy, canvas, overlay);
    } else {
        // Fallback to simple HTML generation
        console.log('📝 [Template] Using simple PDF fallback');
        return generateSimpleCOIPDF(policy);
    }
}

// Generate PDF from real ACORD viewer
async function generatePDFFromRealACORD(policy, canvas, overlay) {
    console.log('🎨 Generating PDF from ACORD viewer canvas');

    const today = new Date().toISOString().split('T')[0];

    return new Promise((resolve, reject) => {
        // Create combined canvas
        const combinedCanvas = document.createElement('canvas');
        combinedCanvas.width = canvas.width;
        combinedCanvas.height = canvas.height;
        const combinedCtx = combinedCanvas.getContext('2d');

        // Draw the PDF canvas
        combinedCtx.drawImage(canvas, 0, 0);

        // Draw form fields EXCEPT certificate holder fields
        const inputs = overlay.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            // Skip certificate holder fields
            const fieldName = input.name || input.id || '';
            if (fieldName.toLowerCase().includes('certificate') ||
                fieldName.toLowerCase().includes('holder')) {
                return; // Skip certificate holder fields
            }

            // Handle checkboxes
            if (input.type === 'checkbox' && input.checked) {
                const rect = input.getBoundingClientRect();
                const overlayRect = overlay.getBoundingClientRect();
                const x = rect.left - overlayRect.left;
                const y = rect.top - overlayRect.top;

                combinedCtx.font = 'bold 12px Arial';
                combinedCtx.fillStyle = '#000000';
                combinedCtx.fillText('X', x + 2, y + 10);
            }

            // Handle text inputs - PRESERVE SIGNATURE FONTS
            if ((input.type === 'text' || input.type === 'textarea') && input.value) {
                const rect = input.getBoundingClientRect();
                const overlayRect = overlay.getBoundingClientRect();
                const x = rect.left - overlayRect.left;
                const y = rect.top - overlayRect.top;

                const fontSize = parseInt(input.style.fontSize) || 10;
                const fontFamily = input.style.fontFamily || 'Arial';
                const fontWeight = input.style.fontWeight || 'normal';

                // Check if this is a signature field (Grant Corp) - PRESERVE ORIGINAL FONT
                const isSignatureField = input.value.toLowerCase().includes('grant corp') ||
                                       input.value.toLowerCase().includes('grant') ||
                                       fieldName.toLowerCase().includes('signature') ||
                                       fieldName.toLowerCase().includes('agent') ||
                                       fieldName.toLowerCase().includes('auth');

                if (isSignatureField) {
                    // Try to preserve the exact font from the original input element
                    const computedStyle = window.getComputedStyle(input);
                    const originalFontFamily = computedStyle.fontFamily;
                    const originalFontStyle = computedStyle.fontStyle;
                    const originalFontWeight = computedStyle.fontWeight;

                    console.log('🖋️ Preserving original signature font for:', input.value);
                    console.log('   Original font details:', {
                        fontFamily: originalFontFamily,
                        fontStyle: originalFontStyle,
                        fontWeight: originalFontWeight,
                        fontSize: fontSize
                    });

                    // Use the exact original font properties
                    combinedCtx.font = `${originalFontStyle} ${originalFontWeight} ${fontSize}px ${originalFontFamily}`;
                } else {
                    // Use regular font for other fields
                    combinedCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                }

                combinedCtx.fillStyle = '#000000';
                combinedCtx.fillText(input.value, x + 2, y + 12);
            }
        });

        // Convert to blob
        combinedCanvas.toBlob(async function(blob) {
            try {
                const { jsPDF } = window.jspdf || window;
                if (!jsPDF) {
                    throw new Error('jsPDF not available');
                }

                const pdf = new jsPDF('p', 'mm', 'letter');

                // Convert blob to data URL
                const reader = new FileReader();
                reader.onload = function() {
                    const imgData = reader.result;
                    const imgWidth = 216; // Letter width in mm
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

                    const pdfBlob = pdf.output('blob');
                    console.log('✅ PDF template generated - size:', pdfBlob.size, 'bytes');

                    resolve({
                        filename: `COI_${policy.policyNumber || 'Certificate'}_${today}.pdf`,
                        data: pdfBlob
                    });
                };
                reader.readAsDataURL(blob);
            } catch (error) {
                console.error('Error creating PDF:', error);
                reject(error);
            }
        }, 'image/png');
    });
}

// Fallback: Generate simple COI PDF
async function generateSimpleCOIPDF(policy) {
    console.log('📝 Generating simple COI PDF template');

    const { jsPDF } = window.jspdf || window;
    if (!jsPDF) {
        throw new Error('jsPDF not available');
    }

    const pdf = new jsPDF();
    const today = new Date().toISOString().split('T')[0];

    // Add content
    pdf.setFontSize(16);
    pdf.text('ACORD 25 CERTIFICATE OF LIABILITY INSURANCE', 105, 20, { align: 'center' });

    pdf.setFontSize(10);
    pdf.text(`DATE: ${today}`, 20, 35);

    // Producer section
    pdf.setFontSize(12);
    pdf.text('PRODUCER', 20, 50);
    pdf.setFontSize(10);
    pdf.text('Vanguard Insurance Agency', 20, 60);
    pdf.text('123 Main Street, Suite 100', 20, 65);
    pdf.text('New York, NY 10001', 20, 70);
    pdf.text('Phone: (555) 123-4567', 20, 75);

    // Insured section
    pdf.setFontSize(12);
    pdf.text('INSURED', 20, 90);
    pdf.setFontSize(10);
    pdf.text(policy.clientName || policy.name || 'N/A', 20, 100);
    pdf.text(policy.address || 'N/A', 20, 105);

    // Policy details
    pdf.setFontSize(12);
    pdf.text('COVERAGES', 20, 120);
    pdf.setFontSize(10);
    pdf.text(`Policy Number: ${policy.policyNumber || 'N/A'}`, 20, 130);
    pdf.text(`Carrier: ${policy.carrier || 'N/A'}`, 20, 135);
    pdf.text(`Type: ${policy.policyType || 'GENERAL LIABILITY'}`, 20, 140);
    pdf.text(`Effective: ${policy.effectiveDate || 'N/A'} to ${policy.expirationDate || 'N/A'}`, 20, 145);
    pdf.text(`Coverage Limit: ${policy.coverageLimit ? '$' + Number(policy.coverageLimit).toLocaleString() : 'N/A'}`, 20, 150);

    // Certificate holder placeholder
    pdf.setFontSize(12);
    pdf.text('CERTIFICATE HOLDER', 20, 170);
    pdf.setFontSize(10);
    pdf.rect(20, 175, 170, 40); // Empty box for certificate holder
    pdf.text('[Certificate holder information will be added when requested]', 25, 195);

    const pdfBlob = pdf.output('blob');

    return {
        filename: `COI_${policy.policyNumber || 'Certificate'}_${today}.pdf`,
        data: pdfBlob
    };
}

// Show local save success message
function showLocalSaveSuccess(policyNumber) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #10b981;
        color: white;
        padding: 20px 30px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10001;
        text-align: center;
        animation: slideIn 0.3s ease-out;
    `;
    successDiv.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">
            <i class="fas fa-check-circle"></i>
        </div>
        <h3 style="margin: 0 0 10px 0; font-size: 20px;">COI Template Saved!</h3>
        <p style="margin: 0 0 15px 0; opacity: 0.95;">
            Policy ${policyNumber} COI template saved to CRM.
        </p>
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">
            Ready to process certificate holder requests!
        </p>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">
                ✅ Template stored locally in CRM<br>
                ✅ Can add certificate holder overlay on request<br>
                ✅ Will email via our Titan system
            </p>
        </div>
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translate(-50%, -60%);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%);
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(successDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        successDiv.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => successDiv.remove(), 300);
    }, 5000);
}

// Add Save to Profile button to existing UI
function addSaveToProfileButton() {
    console.log('🔧 Adding Save to Profile button to UI');

    // Find existing button containers
    const buttonContainers = document.querySelectorAll('.acord-header > div:last-child');

    buttonContainers.forEach(container => {
        // Check if button already exists
        if (container.querySelector('[onclick*="saveCOIToProfile"]')) {
            return;
        }

        // Find the save button to add our button after it
        const saveBtn = container.querySelector('[onclick*="saveACORD"]');
        if (saveBtn) {
            // Create Save to Profile button
            const profileBtn = document.createElement('button');
            profileBtn.className = 'btn-primary';
            profileBtn.style.cssText = 'background: #8b5cf6; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;';
            profileBtn.innerHTML = '<i class="fas fa-user-circle"></i> Save to Profile';
            profileBtn.onclick = function() {
                const policyId = window.currentCOIPolicyId || (window.currentCOIPolicy && window.currentCOIPolicy.policyNumber);
                if (policyId) {
                    saveCOIToProfile(policyId, this);
                } else {
                    alert('No policy selected');
                }
            };

            // Insert after save button
            saveBtn.parentNode.insertBefore(profileBtn, saveBtn.nextSibling);
        }
    });
}

// Auto-add button when ACORD viewer loads
const observer = new MutationObserver(() => {
    if (document.querySelector('.acord-header')) {
        addSaveToProfileButton();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Also add button immediately if viewer already exists
if (document.querySelector('.acord-header')) {
    addSaveToProfileButton();
}

console.log('✅ Save to Profile functionality ready');

    } catch (error) {
        console.error('❌ Error loading Save to Profile functionality:', error);
        console.error('Error stack:', error.stack);
    }
})();