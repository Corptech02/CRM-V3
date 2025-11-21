// Test PDF Generation Comparison
// This will help us compare the working download PDF vs the broken email PDF

// Add this to the browser console when viewing a COI to test both PDF generations

window.testPDFComparison = async function() {
    console.log('🧪 Testing PDF Generation Comparison');

    const policy = window.currentCOIPolicy;
    if (!policy) {
        console.error('❌ No policy loaded. Navigate to a COI first.');
        return;
    }

    const canvas = document.getElementById('realPdfCanvas');
    const overlay = document.getElementById('realFormOverlay');

    if (!canvas || !overlay) {
        console.error('❌ Canvas or overlay not found');
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Create the combined canvas (same for both)
    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = canvas.width;
    combinedCanvas.height = canvas.height;
    const combinedCtx = combinedCanvas.getContext('2d');

    // Draw the PDF canvas
    combinedCtx.drawImage(canvas, 0, 0);

    // Draw the form field values on top (same as both functions)
    const inputs = overlay.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            if (input.checked) {
                const rect = input.getBoundingClientRect();
                const overlayRect = overlay.getBoundingClientRect();
                const x = rect.left - overlayRect.left;
                const y = rect.top - overlayRect.top;
                combinedCtx.font = 'bold 12px Arial';
                combinedCtx.fillStyle = '#000000';
                combinedCtx.fillText('X', x + 2, y + 10);
            }
            return;
        }

        if (input.value) {
            const rect = input.getBoundingClientRect();
            const overlayRect = overlay.getBoundingClientRect();
            const x = rect.left - overlayRect.left;
            const y = rect.top - overlayRect.top;

            const fontSize = parseInt(input.style.fontSize) || 10;
            const fontFamily = input.style.fontFamily || 'Arial, sans-serif';
            const fontWeight = input.style.fontWeight || 'normal';

            combinedCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
            combinedCtx.fillStyle = '#000000';

            if (input.type === 'textarea') {
                const lines = input.value.split('\n');
                lines.forEach((line, index) => {
                    combinedCtx.fillText(line, x + 2, y + 12 + (index * 14));
                });
            } else {
                combinedCtx.fillText(input.value, x + 2, y + 12);
            }
        }
    });

    // Now test both PDF generation methods
    combinedCanvas.toBlob(async function(blob) {
        const { jsPDF } = window.jspdf || window;
        if (!jsPDF) {
            console.error('❌ jsPDF not available');
            return;
        }

        const reader = new FileReader();
        reader.onload = function() {
            const imgData = reader.result;
            const imgWidth = 216;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // TEST 1: Working Download Method
            console.log('📥 Testing WORKING download method...');
            const pdf1 = new jsPDF('p', 'mm', 'letter');
            pdf1.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            // This is how the working download saves it
            const workingPdfBlob = pdf1.output('blob');
            console.log('✅ Working PDF size:', workingPdfBlob.size, 'bytes');

            // Download for comparison
            const workingUrl = URL.createObjectURL(workingPdfBlob);
            const workingLink = document.createElement('a');
            workingLink.href = workingUrl;
            workingLink.download = `WORKING_PDF_${today}.pdf`;
            workingLink.click();

            // TEST 2: Email Attachment Method
            console.log('📧 Testing EMAIL attachment method...');
            const pdf2 = new jsPDF('p', 'mm', 'letter');
            pdf2.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            // This is how the email version creates it
            const emailPdfBlob = pdf2.output('blob');
            console.log('📧 Email PDF size:', emailPdfBlob.size, 'bytes');

            // Now convert to base64 like the email does
            const reader2 = new FileReader();
            reader2.onload = function() {
                const base64PDF = reader2.result.split(',')[1];
                console.log('📎 Base64 length:', base64PDF.length, 'characters');
                console.log('📎 Base64 starts with:', base64PDF.substring(0, 50));

                // Convert back to blob to test
                const binaryString = atob(base64PDF);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const reconstructedBlob = new Blob([bytes], { type: 'application/pdf' });
                console.log('🔄 Reconstructed PDF size:', reconstructedBlob.size, 'bytes');

                // Download reconstructed for comparison
                const reconstructedUrl = URL.createObjectURL(reconstructedBlob);
                const reconstructedLink = document.createElement('a');
                reconstructedLink.href = reconstructedUrl;
                reconstructedLink.download = `EMAIL_RECONSTRUCTED_PDF_${today}.pdf`;
                reconstructedLink.click();

                console.log('🏁 Test complete! Check the two downloaded PDFs:');
                console.log('   1. WORKING_PDF_*.pdf (should open fine)');
                console.log('   2. EMAIL_RECONSTRUCTED_PDF_*.pdf (this simulates the email attachment)');
            };
            reader2.readAsDataURL(emailPdfBlob);
        };
        reader.readAsDataURL(blob);
    }, 'image/png');
};

console.log('✅ PDF Comparison test loaded. Navigate to a COI and run: testPDFComparison()');