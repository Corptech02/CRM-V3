// COI Signature Modal Functions
console.log('📝 COI Signature Modal Loading...');

// Show signature modal for selecting authorized representative
window.showSignatureModal = function(policyId) {
    console.log('Opening signature modal for policy:', policyId);

    // Remove existing modal if it exists
    const existingModal = document.getElementById('signatureModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Get current authorized representative value
    const currentAuthRep = getPolicyAssigneeAuthorizedRep(policyId);

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'signatureModal';
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
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <h2 style="margin: 0 0 20px 0; color: #333; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-signature" style="color: #f59e0b;"></i>
                Sign COI Document
            </h2>
            <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
                Select the authorized representative to sign this Certificate of Insurance:
            </p>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
                    Authorized Representative:
                </label>
                <select id="signatureSelect" style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 6px; font-size: 16px; background: white;">
                    <option value="">Select Representative...</option>
                    <option value="Grant Corp" ${currentAuthRep === 'Grant Corp' ? 'selected' : ''}>Grant Corp</option>
                    <option value="Hunter Brooks" ${currentAuthRep === 'Hunter Brooks' ? 'selected' : ''}>Hunter Brooks</option>
                    <option value="Maureen Corp" ${currentAuthRep === 'Maureen Corp' ? 'selected' : ''}>Maureen Corp</option>
                </select>
            </div>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                <div style="display: flex; align-items: start; gap: 10px;">
                    <i class="fas fa-info-circle" style="color: #f59e0b; margin-top: 2px;"></i>
                    <div style="color: #92400e; font-size: 14px; line-height: 1.4;">
                        <strong>Signature Note:</strong> The selected name will appear in signature font style in the authorized representative field of the COI.
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="document.getElementById('signatureModal').remove()"
                        style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    Cancel
                </button>
                <button onclick="applySignature('${policyId}')"
                        style="padding: 12px 24px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    <i class="fas fa-signature"></i> Apply Signature
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Focus on the select dropdown
    setTimeout(() => {
        const selectElement = document.getElementById('signatureSelect');
        if (selectElement) {
            selectElement.focus();
        }
    }, 100);
};

// Apply signature to the COI
window.applySignature = function(policyId) {
    const selectElement = document.getElementById('signatureSelect');
    const selectedSignature = selectElement ? selectElement.value : '';

    if (!selectedSignature) {
        alert('Please select an authorized representative to sign the document.');
        return;
    }

    console.log('Applying signature:', selectedSignature, 'to policy:', policyId);

    // Check if Maureen Corp is selected to update producer name
    if (selectedSignature === 'Maureen Corp') {
        console.log('Maureen Corp selected - updating producer name to UNITED INSURANCE GROUP');

        // Set persistent flags to prevent reverting
        window.tempSelectedSignature = 'Maureen Corp';
        window.currentProducerName = 'UNITED INSURANCE GROUP';

        updateProducerName('UNITED INSURANCE GROUP');
    } else {
        // Clear the flags for other signatures
        delete window.tempSelectedSignature;
        delete window.currentProducerName;
    }

    // Debug: Log all form fields on the page
    const allInputs = document.querySelectorAll('input, textarea, select');
    console.log('All form fields found on page:', allInputs);
    console.log('Looking for authorized representative field...');

    // Try multiple ways to find and update the authorized representative field
    let authRepField = document.getElementById('authRep');

    // If not found by ID, try finding by the field ID pattern used in ACORD viewer
    if (!authRepField) {
        authRepField = document.getElementById('field_authRep');
    }

    // If not found by ID, try finding by name or other attributes
    if (!authRepField) {
        authRepField = document.querySelector('input[name="authorizedRep"]');
    }

    // Try finding any input field that might contain authorized rep data
    if (!authRepField) {
        const allInputs = document.querySelectorAll('input[type="text"]');
        for (let input of allInputs) {
            if (input.placeholder && input.placeholder.toLowerCase().includes('representative')) {
                authRepField = input;
                break;
            }
            if (input.value && (input.value.includes('Grant Corp') || input.value.includes('Hunter Brooks') || input.value.includes('Maureen Corp'))) {
                authRepField = input;
                break;
            }
        }
    }

    console.log('Found auth rep field:', authRepField);

    if (authRepField) {
        // Update the field value
        authRepField.value = selectedSignature;

        // Apply signature styling
        authRepField.style.fontFamily = 'Dancing Script, Brush Script MT, cursive';
        authRepField.style.fontStyle = 'italic';
        authRepField.style.fontSize = '16px';
        authRepField.style.fontWeight = 'bold';
        authRepField.style.color = '#1f2937';

        // Trigger multiple events to ensure the change is saved
        authRepField.dispatchEvent(new Event('input', { bubbles: true }));
        authRepField.dispatchEvent(new Event('change', { bubbles: true }));
        authRepField.dispatchEvent(new Event('blur', { bubbles: true }));

        console.log('Signature applied to field:', authRepField);
        console.log('Field value is now:', authRepField.value);
    } else {
        console.error('Could not find authorized representative field');
        alert('Could not find the authorized representative field to update. Please manually enter the signature.');
    }

    // Also try to update any form data in memory if it exists
    if (window.coiFormData && window.coiFormData[policyId]) {
        window.coiFormData[policyId].authorizedRep = selectedSignature;
        console.log('Updated coiFormData:', window.coiFormData[policyId]);
    }

    // SOLUTION: Refresh the ACORD form to ensure the signature is properly applied
    console.log('Refreshing ACORD form to apply signature...');

    // Try to find and trigger a form refresh
    if (typeof window.createRealFormFields === 'function') {
        // Get policy data for refresh
        const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
        const policy = policies.find(p =>
            p.policyNumber === policyId ||
            p.id === policyId ||
            String(p.id) === String(policyId)
        );

        if (policy) {
            console.log('Recreating form fields with updated signature...');
            // Temporarily store the selected signature to ensure it gets used
            window.tempSelectedSignature = selectedSignature;

            // Recreate the form fields
            setTimeout(() => {
                try {
                    window.createRealFormFields(policyId, policy);
                    console.log('Form fields recreated successfully');

                    // If Maureen Corp, update producer name again after form recreation
                    if (selectedSignature === 'Maureen Corp') {
                        setTimeout(() => {
                            console.log('Applying United Insurance Group after form recreation');
                            updateProducerName('UNITED INSURANCE GROUP');

                            // Also directly update the producer field if it exists
                            const producerField = document.getElementById('producer');
                            if (producerField) {
                                producerField.value = 'UNITED INSURANCE GROUP';
                                producerField.dispatchEvent(new Event('input', { bubbles: true }));
                                producerField.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }, 200); // Wait a bit after form recreation
                    }
                } catch (error) {
                    console.error('Error recreating form fields:', error);
                }
                // Only clean up temp variable if NOT Maureen Corp (need to keep it persistent)
                if (selectedSignature !== 'Maureen Corp') {
                    delete window.tempSelectedSignature;
                }
            }, 100);
        }
    } else if (typeof window.createRealACORDViewer === 'function') {
        // If form fields function isn't available, reload the entire viewer
        console.log('Reloading entire ACORD viewer...');
        setTimeout(() => {
            try {
                window.createRealACORDViewer(policyId);
                console.log('ACORD viewer reloaded successfully');
            } catch (error) {
                console.error('Error reloading ACORD viewer:', error);
            }
        }, 100);
    }

    // Close modal
    document.getElementById('signatureModal').remove();

    // Show success message
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 500;
    `;
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        Document signed by ${selectedSignature}
    `;
    document.body.appendChild(successDiv);

    // Remove success message after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
};

// Function to update producer name in the COI
function updateProducerName(newProducerName) {
    console.log('Updating producer name to:', newProducerName);

    // Try to find producer/agency name fields in various ways
    const producerSelectors = [
        'input[placeholder*="Producer"]',
        'input[placeholder*="Agency"]',
        'input[placeholder*="Broker"]',
        'input[id*="producer"]',
        'input[id*="agency"]',
        'input[name*="producer"]',
        'input[name*="agency"]',
        '.producer-display',
        '.agency-display'
    ];

    let producerField = null;

    // Try each selector
    for (const selector of producerSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            // Check if this field contains producer-like text
            if (element.value && (
                element.value.includes('GRANT CORP') ||
                element.value.includes('Grant Corp') ||
                element.value.includes('VANGUARD') ||
                element.value.includes('Vanguard')
            )) {
                producerField = element;
                console.log('Found producer field by content:', element);
                break;
            }
        }
        if (producerField) break;
    }

    // If not found by content, try to find by position/context
    if (!producerField) {
        const allInputs = document.querySelectorAll('input[type="text"], textarea');
        for (const input of allInputs) {
            const placeholder = input.placeholder?.toLowerCase() || '';
            const id = input.id?.toLowerCase() || '';
            const name = input.name?.toLowerCase() || '';

            if (placeholder.includes('producer') || placeholder.includes('agency') ||
                id.includes('producer') || id.includes('agency') ||
                name.includes('producer') || name.includes('agency')) {
                producerField = input;
                console.log('Found producer field by attributes:', input);
                break;
            }
        }
    }

    if (producerField) {
        // Update the producer name
        const oldValue = producerField.value;
        producerField.value = newProducerName;

        console.log('Producer field updated from:', oldValue, 'to:', newProducerName);

        // Trigger events to ensure change is registered
        producerField.dispatchEvent(new Event('input', { bubbles: true }));
        producerField.dispatchEvent(new Event('change', { bubbles: true }));
        producerField.dispatchEvent(new Event('blur', { bubbles: true }));

        // Also update any text content elements
        const textElements = document.querySelectorAll('.producer-display, .agency-display, span');
        textElements.forEach(element => {
            if (element.textContent && (
                element.textContent.includes('GRANT CORP') ||
                element.textContent.includes('Grant Corp') ||
                element.textContent.includes('VANGUARD')
            )) {
                console.log('Updating text element:', element.textContent, 'to:', newProducerName);
                element.textContent = element.textContent.replace(/GRANT CORP|Grant Corp|VANGUARD INSURANCE GROUP/g, newProducerName);
            }
        });

    } else {
        console.warn('Could not find producer name field to update');
        // Try using the existing COI customization function if available
        if (typeof updateCOIProducer === 'function') {
            console.log('Attempting to use updateCOIProducer function');
            updateCOIProducer();
        }
    }
}

console.log('✅ COI Signature Modal Ready');