// Force PDF conversion for COI emails
// Copy and paste into client dashboard console when sending COI

console.log('🔧 Forcing PDF conversion for COI emails...');

// Create a function to convert PNG COI to PDF
window.convertPNGtoPDF = async function(pngDataUrl, filename) {
    try {
        console.log('📄 Converting PNG to PDF...');

        // Load jsPDF if not available
        if (!window.jspdf) {
            console.log('📚 Loading jsPDF...');
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        // Create new PDF document
        const pdf = new window.jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Calculate dimensions to fit A4 properly
        const pageWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm

        // Add the PNG image to PDF
        pdf.addImage(pngDataUrl, 'PNG', 0, 0, pageWidth, pageHeight);

        // Get PDF as blob
        const pdfBlob = pdf.output('blob');

        console.log('✅ PDF conversion complete, size:', pdfBlob.size, 'bytes');

        return {
            blob: pdfBlob,
            filename: filename || `COI_${Date.now()}.pdf`,
            dataUrl: pdf.output('dataurlstring')
        };

    } catch (error) {
        console.error('❌ PDF conversion error:', error);
        return null;
    }
};

// Override the COI send functionality to force PDF
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    // Intercept COI send requests
    if (url.includes('/api/coi/send-request') && options && options.method === 'POST') {
        console.log('🔍 Intercepting COI send request to force PDF conversion...');

        // Handle FormData
        if (options.body instanceof FormData) {
            const formData = options.body;

            // Check if there's a COI document being sent
            const coiFile = formData.get('coiDocument');
            if (coiFile && coiFile.type === 'image/png') {
                console.log('📄 Found PNG COI, converting to PDF...');

                return new Promise(async (resolve) => {
                    try {
                        // Read the PNG file
                        const reader = new FileReader();
                        reader.onload = async function() {
                            const pngDataUrl = reader.result;

                            // Convert to PDF
                            const pdfResult = await window.convertPNGtoPDF(pngDataUrl, 'COI_Certificate.pdf');

                            if (pdfResult) {
                                // Replace the PNG with PDF in FormData
                                formData.delete('coiDocument');
                                formData.append('coiDocument', pdfResult.blob, pdfResult.filename);

                                console.log('✅ Replaced PNG with PDF in FormData');

                                // Continue with original fetch
                                resolve(originalFetch.call(this, url, options));
                            } else {
                                console.log('❌ PDF conversion failed, sending original PNG');
                                resolve(originalFetch.call(this, url, options));
                            }
                        };
                        reader.readAsDataURL(coiFile);
                    } catch (error) {
                        console.error('❌ Error during PDF conversion:', error);
                        resolve(originalFetch.call(this, url, options));
                    }
                });
            }
        }
    }

    // For all other requests, use original fetch
    return originalFetch.call(this, url, options);
};

// Also create a simple function to manually send COI as PDF
window.sendCOIasPDF = async function(recipientEmail, customMessage) {
    try {
        console.log('📧 Sending COI as PDF to:', recipientEmail);

        const policyData = window.currentPolicy || {};
        const coiDocument = window.currentCOIDocument || window.coiDocument;

        if (!coiDocument || !coiDocument.dataUrl) {
            alert('❌ No COI document found');
            return;
        }

        // Convert PNG to PDF
        const pdfResult = await window.convertPNGtoPDF(
            coiDocument.dataUrl,
            `COI_${policyData.policy_number}_${new Date().toISOString().split('T')[0]}.pdf`
        );

        if (!pdfResult) {
            alert('❌ Failed to convert COI to PDF');
            return;
        }

        // Create FormData with PDF
        const formData = new FormData();
        formData.append('recipientEmail', recipientEmail);
        formData.append('policyNumber', policyData.policy_number || '');
        formData.append('insuredName', policyData.insured_name || '');
        formData.append('coiDocument', pdfResult.blob, pdfResult.filename);

        if (customMessage) {
            formData.append('message', customMessage);
        }

        // Send the request
        const response = await fetch('/api/coi/send-request', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert(`✅ COI PDF sent successfully to ${recipientEmail}`);
            console.log('✅ COI PDF sent successfully');
        } else {
            alert(`❌ Failed to send COI PDF: ${result.error}`);
            console.error('❌ COI send failed:', result.error);
        }

    } catch (error) {
        console.error('❌ Error sending COI as PDF:', error);
        alert(`❌ Error sending COI: ${error.message}`);
    }
};

// Replace any existing send COI buttons with PDF version
document.addEventListener('click', function(event) {
    const target = event.target;

    // Check if this is a COI send button
    if (target.matches('[data-action="send-coi"]') ||
        target.textContent.includes('Send COI') ||
        target.classList.contains('send-coi-btn')) {

        event.preventDefault();
        event.stopPropagation();

        const recipientEmail = prompt('📧 Enter recipient email address:');
        if (recipientEmail && recipientEmail.includes('@')) {
            const customMessage = prompt('💬 Enter custom message (optional):') || '';
            window.sendCOIasPDF(recipientEmail, customMessage);
        } else if (recipientEmail) {
            alert('❌ Please enter a valid email address');
        }
    }
});

// Load jsPDF library if not already loaded
if (!window.jspdf) {
    console.log('📚 Loading jsPDF library for PDF conversion...');
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(script);
    script.onload = () => console.log('✅ jsPDF library loaded successfully');
}

// Success notification
const notification = document.createElement('div');
notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border-left: 4px solid #45a049;
`;
notification.innerHTML = '📄 PDF Conversion Active!<br><small>COI emails will now be sent as PDF</small>';
document.body.appendChild(notification);

setTimeout(() => {
    if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
    }
}, 6000);

console.log('✅ PDF conversion fix applied!');
console.log('📋 COI emails will now be converted to PDF before sending');
console.log('🚀 Use window.sendCOIasPDF(email, message) for manual sending');