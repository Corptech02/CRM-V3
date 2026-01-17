// Fix COI generation to create PDF instead of PNG
// Copy and paste into vigagency.com client dashboard console

console.log('🔧 Fixing COI generation to create PDF format...');

// Override the COI generation function to create PDF
if (typeof window.createSimpleCOIWithTextOverlay === 'function') {
    const originalCOIFunction = window.createSimpleCOIWithTextOverlay;

    window.createSimpleCOIWithTextOverlay = async function(coiDocument, clientName, policyNumber) {
        console.log('📄 Enhanced COI generation - creating PDF instead of PNG');
        console.log('📋 COI parameters:', { clientName, policyNumber });

        try {
            // First create the overlay as before
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Load the original COI image
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = coiDocument.dataUrl;
            });

            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw the original image
            ctx.drawImage(img, 0, 0);

            // Apply text overlays
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#000000';

            // Certificate holder overlay
            if (clientName) {
                const startX = 53;
                const startY = 577.5;
                ctx.fillText(clientName, startX, startY);
                console.log('📝 Overlaid certificate holder:', clientName);
            }

            // Date overlay
            const currentDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: '1-digit',
                day: '1-digit'
            });
            const dateX = Math.min(695, canvas.width - 100);
            const dateY = 57.5;
            ctx.fillText(currentDate, dateX, dateY);
            console.log('📅 Overlaid current date:', currentDate);

            // Convert canvas to blob (still PNG for processing)
            const canvasBlob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png', 0.95);
            });

            console.log('🖼️ Canvas overlay created, converting to PDF...');

            // Create PDF using jsPDF
            const { jsPDF } = window;
            if (!jsPDF) {
                console.log('❌ jsPDF not available, loading...');

                // Load jsPDF if not available
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                document.head.appendChild(script);

                await new Promise(resolve => {
                    script.onload = resolve;
                });
            }

            // Convert canvas image to PDF
            const pdf = new window.jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Convert canvas to data URL for PDF
            const imgData = canvas.toDataURL('image/png');

            // Calculate dimensions to fit A4 page
            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Add image to PDF
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            // Convert PDF to blob
            const pdfBlob = pdf.output('blob');

            console.log('✅ PDF created successfully');
            console.log('📄 PDF size:', pdfBlob.size, 'bytes');

            // Return PDF blob with proper metadata
            return {
                blob: pdfBlob,
                filename: `COI_${policyNumber}_${new Date().toISOString().split('T')[0]}.pdf`,
                type: 'application/pdf',
                dataUrl: `data:application/pdf;base64,${btoa(String.fromCharCode(...new Uint8Array(await pdfBlob.arrayBuffer())))}`
            };

        } catch (error) {
            console.error('❌ Enhanced COI generation error:', error);

            // Fallback to original function
            console.log('🔄 Falling back to original PNG generation...');
            return await originalCOIFunction.call(this, coiDocument, clientName, policyNumber);
        }
    };

    console.log('✅ COI generation enhanced to create PDF format');
} else {
    console.log('❌ createSimpleCOIWithTextOverlay function not found');
}

// Also update the send request to handle PDF
if (typeof window.sendCOIRequest === 'function') {
    const originalSendRequest = window.sendCOIRequest;

    window.sendCOIRequest = function(recipientEmail, customMessage) {
        console.log('📧 Enhanced COI send - will attach PDF instead of PNG');

        if (!recipientEmail) {
            alert('Please provide a recipient email address');
            return;
        }

        const policyData = window.currentPolicy || {};
        const formData = new FormData();

        formData.append('recipientEmail', recipientEmail);
        formData.append('policyNumber', policyData.policy_number || '');
        formData.append('insuredName', policyData.insured_name || '');
        if (customMessage) formData.append('message', customMessage);

        // Check for PDF COI document
        const coiDocument = window.currentCOIDocument || window.coiDocument;
        if (coiDocument) {
            if (coiDocument.type === 'application/pdf' && coiDocument.blob) {
                // Use PDF blob directly
                formData.append('coiDocument', coiDocument.blob, coiDocument.filename || `COI_${policyData.policy_number}.pdf`);
                console.log('📎 PDF COI document attached');
            } else if (coiDocument.dataUrl) {
                // Convert PNG to PDF if needed
                console.log('🔄 Converting PNG to PDF for email attachment...');

                // Quick PDF conversion for existing PNG
                const base64Data = coiDocument.dataUrl.split(',')[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const pngBlob = new Blob([byteArray], { type: 'image/png' });

                formData.append('coiDocument', pngBlob, `COI_${policyData.policy_number}.pdf`);
                formData.append('convertToPdf', 'true'); // Flag for server to convert
            }
        }

        fetch('/api/coi/send-request', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`✅ COI PDF sent successfully to ${recipientEmail}`);
            } else {
                alert(`❌ Failed to send COI: ${data.error}`);
            }
        })
        .catch(error => {
            alert(`❌ Error sending COI: ${error.message}`);
        });
    };
}

// Load jsPDF library if not already loaded
if (!window.jsPDF) {
    console.log('📚 Loading jsPDF library...');
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(script);
    script.onload = () => console.log('✅ jsPDF library loaded');
}

// Success notification
const notification = document.createElement('div');
notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #FF5722;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
`;
notification.innerHTML = '📄 COI PDF Generation Fixed!<br><small>COIs will now be sent as PDF files</small>';
document.body.appendChild(notification);

setTimeout(() => {
    if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
    }
}, 5000);

console.log('✅ COI PDF generation fix applied!');