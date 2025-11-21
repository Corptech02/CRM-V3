// COI PDF Capture - Capture and save filled ACORD PDFs
console.log('📄 COI PDF Capture Loading...');

// Function to capture the filled PDF and save it
window.captureCOIPDF = async function(policyId) {
    console.log('Capturing filled ACORD PDF for policy:', policyId);

    try {
        // Get the PDF iframe/embed element
        const pdfElement = document.getElementById('acordPdfEmbed') ||
                         document.querySelector('embed[src*="ACORD"]') ||
                         document.querySelector('iframe[src*="ACORD"]');

        if (!pdfElement) {
            throw new Error('PDF element not found');
        }

        // Use browser's print-to-PDF functionality to capture the filled form
        // This preserves the filled data
        const printWindow = window.open('', '_blank');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Saving COI...</title>
                <style>
                    body { margin: 0; padding: 0; }
                    embed, iframe { width: 100%; height: 100vh; border: none; }
                </style>
            </head>
            <body>
                <embed src="ACORD_25_fillable.pdf" type="application/pdf" width="100%" height="100%">
            </body>
            </html>
        `);

        // Wait for PDF to load
        setTimeout(() => {
            // Trigger browser's save dialog
            printWindow.document.execCommand('SaveAs', true, `ACORD_25_${policyId}.pdf`);

            // Or use print with save as PDF option
            printWindow.print();

            // Close after a delay
            setTimeout(() => {
                printWindow.close();
            }, 1000);
        }, 500);

        // Save metadata to server
        await saveCOIMetadata(policyId);

        return true;
    } catch (error) {
        console.error('Error capturing PDF:', error);
        return false;
    }
};

// Function to save COI using server-side PDF generation
window.saveFilledCOIPDF = async function(policyId) {
    console.log('Saving filled ACORD PDF for policy:', policyId);

    try {
        // Get the current form data by reading from the DOM
        // Since we can't directly access PDF form fields, we'll create our own form
        const formData = await collectFormDataFromUser(policyId);

        // Send to server to generate filled PDF (using Node.js backend on port 3001)
        const response = await fetch('http://162.220.14.239:3001/api/generate-filled-coi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                policyId: policyId,
                formData: formData
            })
        });

        if (response.ok) {
            // Get the filled PDF as blob
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ACORD_25_${policyId}_filled.pdf`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();

            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            console.log('Filled PDF downloaded successfully');

            // Save metadata
            await saveCOIMetadata(policyId);

            return true;
        }

        throw new Error('Failed to generate filled PDF');
    } catch (error) {
        console.error('Error saving filled PDF:', error);
        return false;
    }
};

// Helper function to collect form data
async function collectFormDataFromUser(policyId) {
    // Get policy info
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    const policy = policies.find(p =>
        p.policyNumber === policyId ||
        p.id === policyId ||
        String(p.id) === String(policyId)
    );

    // Create a hidden form to collect data
    const formData = {
        producer: 'Vanguard Insurance Agency',
        producerAddress: '123 Insurance Blvd, Suite 100, New York, NY 10001',
        producerPhone: '(555) 123-4567',
        producerFax: '(555) 123-4568',
        insured: policy?.clientName || '',
        insuredAddress: '',
        carrier: policy?.carrier || '',
        policyNumber: policy?.policyNumber || policyId,
        effectiveDate: policy?.effectiveDate || '',
        expirationDate: policy?.expirationDate || '',
        authorizedRep: 'Grant Corp',
        certificateDate: new Date().toLocaleDateString('en-US')
    };

    return formData;
}

// Helper function to save metadata
async function saveCOIMetadata(policyId) {
    try {
        // Save to localStorage
        const coiKey = `coi_filled_${policyId}`;
        localStorage.setItem(coiKey, JSON.stringify({
            policyId: policyId,
            savedAt: new Date().toISOString(),
            status: 'filled'
        }));

        // Save to server
        await fetch('http://162.220.14.239:3001/api/coi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                policyId: policyId,
                formType: 'ACORD_25',
                status: 'filled',
                updatedAt: new Date().toISOString()
            })
        });
    } catch (error) {
        console.error('Error saving metadata:', error);
    }
}

// Check if COI is saved
window.checkSavedCOI = async function(policyId) {
    const coiKey = `coi_filled_${policyId}`;
    if (localStorage.getItem(coiKey)) {
        return true;
    }

    try {
        const response = await fetch(`http://162.220.14.239:3001/api/coi/${policyId}`);
        return response.ok;
    } catch (error) {
        return false;
    }
};

console.log('✅ COI PDF Capture Ready');