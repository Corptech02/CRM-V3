// COI PDF Saver - Save and load filled ACORD PDFs
console.log('💾 COI PDF Saver Loading...');

// Function to save the current PDF state
window.saveCOIPDF = async function(policyId) {
    console.log('Saving filled ACORD PDF for policy:', policyId);

    try {
        // Try multiple ways to get the PDF element
        let pdfElement = document.getElementById('acordPdfEmbed');

        // If not found by ID, try to find by tag
        if (!pdfElement) {
            pdfElement = document.querySelector('embed[src*="ACORD"]');
        }

        // If still not found, try object or iframe
        if (!pdfElement) {
            pdfElement = document.querySelector('object[data*="ACORD"]');
        }

        if (!pdfElement) {
            pdfElement = document.querySelector('iframe[src*="ACORD"]');
        }

        // Default to the standard ACORD form URL if no element found
        let pdfUrl = 'ACORD_25_fillable.pdf';

        if (pdfElement) {
            pdfUrl = pdfElement.src || pdfElement.data || 'ACORD_25_fillable.pdf';
            console.log('Found PDF element, URL:', pdfUrl);
        } else {
            console.log('No PDF element found, using default URL:', pdfUrl);
        }

        // Save metadata to localStorage and server
        const coiData = {
            policyId: policyId,
            pdfUrl: pdfUrl,
            savedAt: new Date().toISOString(),
            formType: 'ACORD_25'
        };

        // Save to localStorage
        const coiKey = `coi_pdf_${policyId}`;
        localStorage.setItem(coiKey, JSON.stringify(coiData));

        // Save to server
        const response = await fetch('http://162.220.14.239:3001/api/coi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                policyId: policyId,
                formType: 'ACORD_25',
                status: 'saved',
                formData: { savedPdfUrl: pdfUrl },
                updatedAt: new Date().toISOString()
            })
        });

        if (response.ok) {
            console.log('COI PDF metadata saved successfully');

            // Clean up the URL if it has extra parameters
            const cleanUrl = pdfUrl.split('#')[0];

            // Trigger download of the current PDF
            const downloadLink = document.createElement('a');
            downloadLink.href = cleanUrl;
            downloadLink.download = `ACORD_25_${policyId}_${Date.now()}.pdf`;
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            setTimeout(() => document.body.removeChild(downloadLink), 100);

            console.log('COI saved and downloaded successfully');
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error saving COI PDF:', error);
        return false;
    }
};

// Function to check if a saved COI exists
window.hasSavedCOI = async function(policyId) {
    try {
        // Check localStorage first
        const coiKey = `coi_pdf_${policyId}`;
        const localData = localStorage.getItem(coiKey);
        if (localData) {
            return true;
        }

        // Check server
        const response = await fetch(`http://162.220.14.239:3001/api/coi/${policyId}`);
        return response.ok;
    } catch (error) {
        console.error('Error checking for saved COI:', error);
        return false;
    }
};

// Function to load saved COI
window.loadSavedCOI = async function(policyId) {
    try {
        // Check localStorage first
        const coiKey = `coi_pdf_${policyId}`;
        const localData = localStorage.getItem(coiKey);
        if (localData) {
            const coiData = JSON.parse(localData);
            console.log('Found saved COI in localStorage:', coiData);
            return coiData;
        }

        // Check server
        const response = await fetch(`http://162.220.14.239:3001/api/coi/${policyId}`);
        if (response.ok) {
            const coiData = await response.json();
            console.log('Found saved COI on server:', coiData);
            return coiData;
        }

        return null;
    } catch (error) {
        console.error('Error loading saved COI:', error);
        return null;
    }
};

console.log('✅ COI PDF Saver Ready');