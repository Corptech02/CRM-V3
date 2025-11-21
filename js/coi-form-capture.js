// COI Form Capture - Capture actual form field input
console.log('📝 COI Form Capture Loading...');

// Function to create a form overlay that captures input
window.setupCOIFormCapture = function(policyId) {
    console.log('Setting up form capture for policy:', policyId);

    // Store form data in memory
    if (!window.coiFormData) {
        window.coiFormData = {};
    }

    if (!window.coiFormData[policyId]) {
        window.coiFormData[policyId] = {
            producer: 'Vanguard Insurance Agency',
            producerAddress: '123 Insurance Blvd, Suite 100, New York, NY 10001',
            producerPhone: '(555) 123-4567',
            insured: '',
            insuredAddress: '',
            carrier: '',
            policyNumber: policyId,
            effectiveDate: '',
            expirationDate: '',
            generalLiability: false,
            glPolicyNumber: '',
            glEachOccurrence: '',
            glGeneralAggregate: '',
            autoLiability: false,
            alPolicyNumber: '',
            alCombinedLimit: '',
            authorizedRep: 'Grant Corp',
            certificateHolder: '',
            description: ''
        };
    }

    // Load saved data if exists
    const savedData = localStorage.getItem(`coi_form_${policyId}`);
    if (savedData) {
        window.coiFormData[policyId] = JSON.parse(savedData);
    }

    return window.coiFormData[policyId];
};

// Function to show input form modal
window.showCOIInputForm = function(policyId) {
    const formData = window.coiFormData[policyId] || {};

    const modal = document.createElement('div');
    modal.id = 'coiInputModal';
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
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; max-height: 90vh; overflow-y: auto; width: 90%;">
            <h2 style="margin: 0 0 20px 0; color: #333;">
                <i class="fas fa-edit"></i> Fill ACORD 25 Form Data
            </h2>

            <form id="coiDataForm" style="display: grid; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Insured Name:</label>
                    <input type="text" name="insured" value="${formData.insured || ''}"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>

                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Insured Address:</label>
                    <input type="text" name="insuredAddress" value="${formData.insuredAddress || ''}"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>

                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Insurance Carrier:</label>
                    <input type="text" name="carrier" value="${formData.carrier || ''}"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>

                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Policy Number:</label>
                    <input type="text" name="policyNumber" value="${formData.policyNumber || policyId}"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Effective Date:</label>
                        <input type="date" name="effectiveDate" value="${formData.effectiveDate || ''}"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Expiration Date:</label>
                        <input type="date" name="expirationDate" value="${formData.expirationDate || ''}"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </div>

                <fieldset style="border: 1px solid #ddd; border-radius: 4px; padding: 10px;">
                    <legend style="font-weight: 500;">Coverage Types</legend>

                    <div style="margin-bottom: 10px;">
                        <label style="display: flex; align-items: center;">
                            <input type="checkbox" name="generalLiability" ${formData.generalLiability ? 'checked' : ''}
                                   style="margin-right: 8px;">
                            General Liability
                        </label>
                        <div style="margin-left: 25px; margin-top: 5px;">
                            <input type="text" name="glPolicyNumber" placeholder="GL Policy Number"
                                   value="${formData.glPolicyNumber || ''}"
                                   style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 5px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                <input type="text" name="glEachOccurrence" placeholder="Each Occurrence Limit"
                                       value="${formData.glEachOccurrence || '1000000'}"
                                       style="padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                                <input type="text" name="glGeneralAggregate" placeholder="General Aggregate"
                                       value="${formData.glGeneralAggregate || '2000000'}"
                                       style="padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                        </div>
                    </div>

                    <div>
                        <label style="display: flex; align-items: center;">
                            <input type="checkbox" name="autoLiability" ${formData.autoLiability ? 'checked' : ''}
                                   style="margin-right: 8px;">
                            Automobile Liability
                        </label>
                        <div style="margin-left: 25px; margin-top: 5px;">
                            <input type="text" name="alPolicyNumber" placeholder="Auto Policy Number"
                                   value="${formData.alPolicyNumber || ''}"
                                   style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                    </div>
                </fieldset>

                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Certificate Holder:</label>
                    <textarea name="certificateHolder" rows="3"
                              style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">${formData.certificateHolder || ''}</textarea>
                </div>

                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Description of Operations:</label>
                    <textarea name="description" rows="3"
                              style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">${formData.description || ''}</textarea>
                </div>

                <div style="background: #f3f4f6; padding: 10px; border-radius: 4px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Authorized Representative:</label>
                    <input type="text" name="authorizedRep" value="${formData.authorizedRep || 'Grant Corp'}"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-weight: bold;">
                </div>
            </form>

            <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                <button onclick="document.getElementById('coiInputModal').remove()"
                        style="padding: 10px 20px; background: #e5e7eb; color: #333; border: none; border-radius: 6px; cursor: pointer;">
                    Cancel
                </button>
                <button onclick="saveCOIFormData('${policyId}')"
                        style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-save"></i> Save & Generate PDF
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

// Function to save form data and generate PDF
window.saveCOIFormData = async function(policyId) {
    console.log('Saving COI form data for policy:', policyId);

    const form = document.getElementById('coiDataForm');
    if (!form) {
        console.error('Form not found');
        return false;
    }

    const formData = new FormData(form);

    // Convert to object and handle checkboxes
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // Handle checkboxes explicitly (they don't appear in FormData if unchecked)
    const glCheckbox = form.querySelector('input[name="generalLiability"]');
    const alCheckbox = form.querySelector('input[name="autoLiability"]');
    data.generalLiability = glCheckbox ? glCheckbox.checked : false;
    data.autoLiability = alCheckbox ? alCheckbox.checked : false;

    console.log('Form data collected:', data);

    // Store in memory and localStorage
    window.coiFormData[policyId] = data;
    localStorage.setItem(`coi_form_${policyId}`, JSON.stringify(data));

    // Close modal
    const modal = document.getElementById('coiInputModal');
    if (modal) modal.remove();

    // Generate filled PDF with the actual data
    try {
        console.log('Sending request to generate PDF...');

        const response = await fetch('http://162.220.14.239:3001/api/generate-filled-coi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                policyId: policyId,
                formData: data
            })
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            console.log('Converting response to blob...');
            const blob = await response.blob();
            console.log('Blob size:', blob.size);

            const url = window.URL.createObjectURL(blob);

            // Download the filled PDF
            const link = document.createElement('a');
            link.href = url;
            link.download = `ACORD_25_${policyId}_filled.pdf`;
            link.style.display = 'none';
            document.body.appendChild(link);

            console.log('Triggering download...');
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            // Show success message
            const successDiv = document.createElement('div');
            successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 20px; border-radius: 6px; z-index: 10000;';
            successDiv.innerHTML = '<i class="fas fa-check-circle"></i> COI saved with your data!';
            document.body.appendChild(successDiv);
            setTimeout(() => successDiv.remove(), 3000);

            // Update status
            const statusText = document.querySelector('#coiStatus');
            if (statusText) {
                statusText.innerHTML = '<i class="fas fa-edit"></i> Edit saved COI';
            }

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
                    formData: data,
                    updatedAt: new Date().toISOString()
                })
            });

            return true;
        } else {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            throw new Error(`Server error: ${response.status}`);
        }
    } catch (error) {
        console.error('Error saving COI:', error);
        alert('Failed to save COI: ' + error.message);

        // Re-show the modal so user doesn't lose their data
        const modal = document.getElementById('coiInputModal');
        if (!modal) {
            window.showCOIInputForm(policyId);
        }
    }

    return false;
};

console.log('✅ COI Form Capture Ready');