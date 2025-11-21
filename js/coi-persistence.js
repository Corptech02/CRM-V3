// COI Persistence - Save and Load ACORD form data
console.log('📁 COI Persistence Module Loading...');

// Function to collect form data from user input
window.collectCOIFormData = function() {
    const formData = {};

    // Prompt user for key ACORD 25 fields
    // Since we can't directly read PDF form fields from browser, we'll use a modal

    formData.producer = prompt('Producer (Agency Name):', 'Vanguard Insurance Agency') || 'Vanguard Insurance Agency';
    formData.producerAddress = prompt('Producer Address:', '123 Insurance Blvd, Suite 100, New York, NY 10001') || '';
    formData.producerPhone = prompt('Producer Phone:', '(555) 123-4567') || '';

    formData.insuredName = prompt('Insured Name:', '') || '';
    formData.insuredAddress = prompt('Insured Address:', '') || '';

    formData.insurerA = prompt('Insurer A Name:', '') || '';
    formData.insurerANAIC = prompt('Insurer A NAIC #:', '') || '';

    formData.generalLiability = confirm('General Liability Coverage?');
    if (formData.generalLiability) {
        formData.glPolicyNumber = prompt('GL Policy Number:', '') || '';
        formData.glEffDate = prompt('GL Effective Date (MM/DD/YYYY):', '') || '';
        formData.glExpDate = prompt('GL Expiration Date (MM/DD/YYYY):', '') || '';
        formData.glEachOccurrence = prompt('GL Each Occurrence Limit:', '1000000') || '';
        formData.glGeneralAggregate = prompt('GL General Aggregate Limit:', '2000000') || '';
    }

    formData.autoLiability = confirm('Auto Liability Coverage?');
    if (formData.autoLiability) {
        formData.alPolicyNumber = prompt('Auto Policy Number:', '') || '';
        formData.alEffDate = prompt('Auto Effective Date (MM/DD/YYYY):', '') || '';
        formData.alExpDate = prompt('Auto Expiration Date (MM/DD/YYYY):', '') || '';
        formData.alCombinedLimit = prompt('Auto Combined Single Limit:', '1000000') || '';
    }

    formData.authorizedRep = prompt('Authorized Representative:', 'Grant Corp') || 'Grant Corp';
    formData.certificateDate = new Date().toLocaleDateString('en-US');

    return formData;
};

// Function to save COI form data
window.saveCOIFormData = async function(policyId) {
    console.log('Saving COI form data for policy:', policyId);

    try {
        // Collect form data
        const formData = collectCOIFormData();

        // Get policy data
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const policy = policies.find(p =>
            p.policyNumber === policyId ||
            p.id === policyId ||
            String(p.id) === String(policyId)
        );

        if (!policy) {
            throw new Error('Policy not found');
        }

        // Prepare COI data
        const coiData = {
            policyId: policyId,
            policyNumber: policy.policyNumber,
            carrier: policy.carrier,
            clientId: policy.clientId,
            formType: 'ACORD_25',
            formData: formData,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save to localStorage for immediate access
        const coiKey = `coi_${policyId}`;
        localStorage.setItem(coiKey, JSON.stringify(coiData));

        // Save to server
        const response = await fetch('http://162.220.14.239:3001/api/coi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(coiData)
        });

        if (response.ok) {
            console.log('COI saved successfully');
            return true;
        } else {
            throw new Error('Failed to save to server');
        }
    } catch (error) {
        console.error('Error saving COI:', error);
        alert('Failed to save COI: ' + error.message);
        return false;
    }
};

// Function to load COI form data
window.loadCOIFormData = async function(policyId) {
    console.log('Loading COI form data for policy:', policyId);

    try {
        // First check localStorage
        const coiKey = `coi_${policyId}`;
        const localData = localStorage.getItem(coiKey);
        if (localData) {
            console.log('Found COI data in localStorage');
            return JSON.parse(localData);
        }

        // Then check server
        const response = await fetch(`http://162.220.14.239:3001/api/coi/${policyId}`);
        if (response.ok) {
            const coiData = await response.json();
            console.log('Found COI data on server');

            // Cache in localStorage
            localStorage.setItem(coiKey, JSON.stringify(coiData));
            return coiData;
        }

        console.log('No existing COI data found');
        return null;
    } catch (error) {
        console.error('Error loading COI:', error);
        return null;
    }
};

// Function to display COI data on ACORD form
window.displayCOIData = function(coiData) {
    if (!coiData || !coiData.formData) {
        console.log('No COI data to display');
        return;
    }

    const formData = coiData.formData;
    console.log('Displaying COI data:', formData);

    // Create an overlay with the saved data
    const overlay = document.createElement('div');
    overlay.id = 'coiDataOverlay';
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
        font-family: Arial, sans-serif;
        font-size: 10px;
        color: #000;
    `;

    // Add producer information
    if (formData.producer) {
        overlay.innerHTML += `
            <div style="position: absolute; top: 185px; left: 65px;">
                ${formData.producer}
            </div>
        `;
    }
    if (formData.producerAddress) {
        overlay.innerHTML += `
            <div style="position: absolute; top: 200px; left: 65px; font-size: 9px;">
                ${formData.producerAddress}
            </div>
        `;
    }
    if (formData.producerPhone) {
        overlay.innerHTML += `
            <div style="position: absolute; top: 185px; left: 260px;">
                ${formData.producerPhone}
            </div>
        `;
    }

    // Add insured information
    if (formData.insuredName) {
        overlay.innerHTML += `
            <div style="position: absolute; top: 305px; left: 65px; font-weight: bold;">
                ${formData.insuredName}
            </div>
        `;
    }
    if (formData.insuredAddress) {
        overlay.innerHTML += `
            <div style="position: absolute; top: 322px; left: 65px;">
                ${formData.insuredAddress}
            </div>
        `;
    }

    // Add insurer information
    if (formData.insurerA) {
        overlay.innerHTML += `
            <div style="position: absolute; top: 435px; left: 385px;">
                ${formData.insurerA}
            </div>
        `;
    }

    // Add policy details
    if (formData.glPolicyNumber) {
        overlay.innerHTML += `
            <div style="position: absolute; top: 550px; left: 530px; font-size: 9px;">
                ${formData.glPolicyNumber}
            </div>
        `;
    }
    if (formData.glEffDate) {
        overlay.innerHTML += `
            <div style="position: absolute; top: 550px; left: 640px; font-size: 9px;">
                ${formData.glEffDate}
            </div>
        `;
    }
    if (formData.glExpDate) {
        overlay.innerHTML += `
            <div style="position: absolute; top: 550px; left: 720px; font-size: 9px;">
                ${formData.glExpDate}
            </div>
        `;
    }

    // Add authorized representative
    if (formData.authorizedRep) {
        overlay.innerHTML += `
            <div style="position: absolute; bottom: 180px; right: 340px; font-weight: bold; font-size: 11px;">
                ${formData.authorizedRep}
            </div>
        `;
    }

    // Add certificate date
    overlay.innerHTML += `
        <div style="position: absolute; top: 135px; right: 80px;">
            ${formData.certificateDate || new Date().toLocaleDateString('en-US')}
        </div>
    `;

    // Add overlay to PDF container
    const pdfContainer = document.querySelector('.pdf-container > div');
    if (pdfContainer) {
        // Remove any existing overlay
        const existingOverlay = document.getElementById('coiDataOverlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        pdfContainer.appendChild(overlay);
    }
};

console.log('✅ COI Persistence Module Ready');