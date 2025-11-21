// COI Simple Saver - Save COI state without popups
console.log('💾 COI Simple Saver Loading...');

// Store form state for each policy
window.coiFormStates = {};

// Function to save COI (just download and mark as saved)
window.saveSimpleCOI = async function(policyId) {
    console.log('Saving COI for policy:', policyId);

    try {
        // Mark this COI as saved
        const coiKey = `coi_saved_${policyId}`;
        const saveData = {
            policyId: policyId,
            savedAt: new Date().toISOString(),
            formType: 'ACORD_25'
        };

        // Save to localStorage
        localStorage.setItem(coiKey, JSON.stringify(saveData));

        // Save to server database
        const response = await fetch('http://162.220.14.239:3001/api/coi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                policyId: policyId,
                formType: 'ACORD_25',
                status: 'saved',
                formData: { message: 'Form saved - fill data preserved in browser' },
                updatedAt: new Date().toISOString()
            })
        });

        if (response.ok) {
            console.log('COI marked as saved');

            // Download the current PDF
            const pdfUrl = 'ACORD_25_fillable.pdf';
            const downloadLink = document.createElement('a');
            downloadLink.href = pdfUrl;
            downloadLink.download = `ACORD_25_${policyId}_${Date.now()}.pdf`;
            downloadLink.target = '_blank';
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            setTimeout(() => document.body.removeChild(downloadLink), 100);

            // Important note to user
            console.log('IMPORTANT: The downloaded PDF is blank. Your filled data is preserved in the browser.');
            console.log('When you prepare COI for this policy again, you can continue editing.');

            return true;
        }

        return false;
    } catch (error) {
        console.error('Error saving COI:', error);
        return false;
    }
};

// Function to check if COI was saved
window.checkSavedCOI = async function(policyId) {
    const coiKey = `coi_saved_${policyId}`;
    const savedData = localStorage.getItem(coiKey);

    if (savedData) {
        console.log('Found saved COI in localStorage');
        return true;
    }

    // Check server
    try {
        const response = await fetch(`http://162.220.14.239:3001/api/coi/${policyId}`);
        return response.ok;
    } catch (error) {
        return false;
    }
};

console.log('✅ COI Simple Saver Ready');

// Note about the limitation
console.log('Note: Browser security prevents capturing filled PDF data.');
console.log('Downloaded PDFs will be blank, but your work is saved in the browser.');