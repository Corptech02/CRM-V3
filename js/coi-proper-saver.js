// COI Proper Saver - Guide users to save filled PDFs correctly
console.log('💾 COI Proper Saver Loading...');

// Function to save COI properly
window.saveProperCOI = async function(policyId) {
    console.log('Saving COI for policy:', policyId);

    try {
        // Mark this COI as saved in our database
        const saveData = {
            policyId: policyId,
            savedAt: new Date().toISOString(),
            formType: 'ACORD_25',
            status: 'saved'
        };

        // Save to localStorage
        const coiKey = `coi_saved_${policyId}`;
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
                formData: saveData,
                updatedAt: new Date().toISOString()
            })
        });

        if (response.ok) {
            console.log('COI marked as saved in database');

            // Guide user to save the filled PDF properly
            showSaveInstructions(policyId);

            return true;
        }

        return false;
    } catch (error) {
        console.error('Error saving COI:', error);
        return false;
    }
};

// Function to show save instructions
function showSaveInstructions(policyId) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'saveInstructionsModal';
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
        z-index: 10000;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">
                <i class="fas fa-save" style="color: #10b981;"></i> Save Your Filled COI
            </h2>

            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                To save your filled ACORD form with all the data you've entered:
            </p>

            <ol style="color: #555; line-height: 1.8; margin-left: 20px; margin-bottom: 20px;">
                <li><strong>Right-click</strong> on the PDF form below</li>
                <li>Select <strong>"Save as..."</strong> or <strong>"Download"</strong></li>
                <li>Name it: <strong>ACORD_25_${policyId}.pdf</strong></li>
                <li>Choose your download location</li>
            </ol>

            <p style="color: #777; font-size: 14px; margin-bottom: 20px; padding: 10px; background: #f3f4f6; border-radius: 6px;">
                <i class="fas fa-info-circle"></i> <strong>Alternative:</strong> Press <strong>Ctrl+S</strong> (Windows) or <strong>Cmd+S</strong> (Mac) while the PDF is selected
            </p>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="document.getElementById('saveInstructionsModal').remove()"
                    style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;">
                    <i class="fas fa-check"></i> Got it!
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Auto-close after 30 seconds
    setTimeout(() => {
        if (document.getElementById('saveInstructionsModal')) {
            modal.remove();
        }
    }, 30000);

    // Also update the status to show it's saved
    const statusText = document.querySelector('#coiStatus');
    if (statusText) {
        statusText.innerHTML = '<i class="fas fa-check-circle"></i> Saved - Ready to download';
    }
}

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

console.log('✅ COI Proper Saver Ready');