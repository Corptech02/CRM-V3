// ACORD 25 Prefill Module - Fills form fields with data
console.log('📝 ACORD 25 Prefill Module Loading...');

// Load PDF-lib library for PDF manipulation
if (!window.PDFLib) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
    script.onload = () => {
        console.log('✅ PDF-lib loaded successfully');
        window.PDFLib = PDFLib;
    };
    document.head.appendChild(script);
}

// Function to prefill the ACORD form
window.prefillACORDForm = async function(policyId) {
    console.log('Starting ACORD prefill for policy:', policyId);

    try {
        // Get policy data
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const policy = policies.find(p =>
            p.policyNumber === policyId ||
            p.id === policyId ||
            String(p.id) === String(policyId)
        );

        if (!policy) {
            console.error('Policy not found for prefill');
            return;
        }

        // Get client data if available
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const client = clients.find(c => c.id === policy.clientId) || {};

        // Fetch the ACORD PDF
        const existingPdfBytes = await fetch('ACORD_25_fillable.pdf').then(res => res.arrayBuffer());

        // Load the PDF with PDF-lib
        const { PDFDocument, rgb, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // Get the form
        const form = pdfDoc.getForm();

        // Try to get form fields to understand field names
        try {
            const fields = form.getFields();
            console.log('Available form fields:', fields.map(field => field.getName()));
        } catch (e) {
            console.log('Could not enumerate fields, will use text overlay method');
        }

        // Since we may not have exact field names, we'll add text directly
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Embed font
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Add "Grant Corp" as Authorized Representative (bottom right of form)
        // ACORD 25 typically has this field near bottom right
        firstPage.drawText('Grant Corp', {
            x: width - 200,  // Position from right edge
            y: 85,           // Position from bottom
            size: 10,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
        });

        // Add Producer information (top left area)
        const producerInfo = [
            'Vanguard Insurance Agency',
            '123 Insurance Blvd, Suite 100',
            'New York, NY 10001',
            'Phone: (555) 123-4567',
            'Fax: (555) 123-4568'
        ];

        let yPosition = height - 150; // Start position for producer info
        producerInfo.forEach(line => {
            firstPage.drawText(line, {
                x: 50,
                y: yPosition,
                size: 9,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
            yPosition -= 12;
        });

        // Add Insured information if available
        if (client.name || policy.clientName) {
            firstPage.drawText(client.name || policy.clientName || '', {
                x: 50,
                y: height - 280,
                size: 10,
                font: helveticaBoldFont,
                color: rgb(0, 0, 0),
            });

            if (client.address) {
                firstPage.drawText(client.address, {
                    x: 50,
                    y: height - 295,
                    size: 9,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });
            }
        }

        // Add policy information
        if (policy.policyNumber) {
            firstPage.drawText(policy.policyNumber, {
                x: 400,
                y: height - 380,
                size: 9,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        }

        // Add carrier information
        if (policy.carrier) {
            firstPage.drawText(policy.carrier, {
                x: 320,
                y: height - 340,
                size: 9,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        }

        // Serialize the PDF
        const pdfBytes = await pdfDoc.save();

        // Create blob and display
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        // Update the embedded PDF to show prefilled version
        const embed = document.getElementById('acordPdfEmbed');
        if (embed) {
            embed.src = url + '#view=FitH&toolbar=1&navpanes=0&scrollbar=1&zoom=125';
        } else {
            // If embed not found, try object/iframe
            const object = document.querySelector('object[data*="ACORD_25"]');
            if (object) {
                object.data = url + '#view=FitH&toolbar=1&navpanes=0&scrollbar=1&zoom=125';
            }
        }

        console.log('✅ ACORD form prefilled successfully');

        // Store the prefilled PDF for download
        window.prefilledACORDBlob = blob;
        window.prefilledACORDUrl = url;

    } catch (error) {
        console.error('Error prefilling ACORD form:', error);
        alert('Unable to prefill form. The blank form will be displayed.');
    }
};

// Override the fillACORDForm function to use prefilling
window.fillACORDForm = function(policyId) {
    console.log('Fill form clicked, starting prefill process...');

    // Show loading message
    const statusText = document.querySelector('.pdf-container');
    if (statusText) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'prefillLoading';
        loadingDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;';
        loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Prefilling form with data...';
        statusText.appendChild(loadingDiv);
    }

    // Wait for PDF-lib to load if needed
    const tryPrefill = () => {
        if (window.PDFLib) {
            prefillACORDForm(policyId).then(() => {
                // Remove loading message
                const loading = document.getElementById('prefillLoading');
                if (loading) loading.remove();

                // Show success message
                const successDiv = document.createElement('div');
                successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 20px; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 10000;';
                successDiv.innerHTML = '<i class="fas fa-check-circle"></i> Form prefilled with Grant Corp as Authorized Representative';
                document.body.appendChild(successDiv);
                setTimeout(() => successDiv.remove(), 3000);
            });
        } else {
            setTimeout(tryPrefill, 500);
        }
    };

    tryPrefill();
};

// Update download function to use prefilled version if available
const originalDownloadACORD = window.downloadACORD;
window.downloadACORD = function() {
    if (window.prefilledACORDBlob) {
        // Download the prefilled version
        const link = document.createElement('a');
        link.href = window.prefilledACORDUrl;
        link.download = 'ACORD_25_Prefilled.pdf';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 100);
    } else {
        // Fallback to original download
        originalDownloadACORD();
    }
};

// Auto-prefill when COI is prepared
const originalPrepareCOI = window.prepareCOI;
window.prepareCOI = function(policyId) {
    // Call original function to set up the display
    originalPrepareCOI(policyId);

    // Auto-prefill after a short delay to ensure PDF is loaded
    setTimeout(() => {
        console.log('Auto-prefilling ACORD form...');
        window.fillACORDForm(policyId);
    }, 1000);
};

console.log('✅ ACORD 25 Prefill Module Ready - Grant Corp will be added as Authorized Representative');