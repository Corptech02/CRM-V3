// Change company name to United Insurance Group when Maureen Corp is selected
console.log('🏢 Maureen United Insurance Group handler loading...');

// Store original applySignature function
const originalApplySignature = window.applySignature;

// Override applySignature to handle Maureen Corp selection
window.applySignature = function(policyId) {
    const selectElement = document.getElementById('signatureSelect');
    const selectedSignature = selectElement ? selectElement.value : '';

    console.log('Selected signature:', selectedSignature);

    // Check if Maureen Corp is selected
    if (selectedSignature === 'Maureen Corp') {
        console.log('Maureen Corp selected - changing to United Insurance Group');

        // Update producer name field
        const producerField = document.getElementById('producerInfo');
        if (producerField) {
            const currentValue = producerField.value;
            const updatedValue = currentValue.replace(/VANGUARD INSURANCE GROUP(?: LLC)?/gi, 'UNITED INSURANCE GROUP');
            producerField.value = updatedValue;
            console.log('Updated producer info to United Insurance Group');
        }

        // Update any static text elements showing the company name
        document.querySelectorAll('*').forEach(element => {
            if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
                const text = element.childNodes[0].textContent;
                if (text && text.includes('VANGUARD INSURANCE GROUP')) {
                    element.childNodes[0].textContent = text.replace(/VANGUARD INSURANCE GROUP(?: LLC)?/gi, 'UNITED INSURANCE GROUP');
                }
            }
        });

        // Store the company name change for this session
        window.currentProducerName = 'UNITED INSURANCE GROUP';
    } else {
        // Reset to Vanguard Insurance Group for other signatures
        console.log('Other signature selected - using Vanguard Insurance Group');

        const producerField = document.getElementById('producerInfo');
        if (producerField && !producerField.value.includes('VANGUARD INSURANCE GROUP')) {
            const currentValue = producerField.value;
            const updatedValue = currentValue.replace(/UNITED INSURANCE GROUP/gi, 'VANGUARD INSURANCE GROUP LLC');
            producerField.value = updatedValue;
            console.log('Reset producer info to Vanguard Insurance Group');
        }

        window.currentProducerName = 'VANGUARD INSURANCE GROUP LLC';
    }

    // Call original function
    if (originalApplySignature) {
        originalApplySignature.call(this, policyId);
    }
};

// Override getUserAgencyInfo to use the correct company name
const originalGetUserAgencyInfo = window.getUserAgencyInfo;
window.getUserAgencyInfo = function() {
    const result = originalGetUserAgencyInfo ? originalGetUserAgencyInfo() : null;

    // Check if Maureen Corp is the current signature
    const authRepField = document.getElementById('authRep') ||
                        document.getElementById('field_authRep') ||
                        document.querySelector('input[value*="Maureen Corp"]');

    if (authRepField && authRepField.value === 'Maureen Corp') {
        if (result) {
            result.producerName = 'UNITED INSURANCE GROUP';
            result.agencyName = 'UNITED INSURANCE GROUP';
        }
        return result || {
            producerName: 'UNITED INSURANCE GROUP',
            agencyName: 'UNITED INSURANCE GROUP',
            address: '2888 Nationwide Pkwy',
            city: 'Brunswick',
            state: 'OH',
            zip: '44212',
            phone: '330-241-7570',
            fax: '330-281-4025',
            email: 'Grant@Vigagency.com'
        };
    }

    return result || {
        producerName: 'VANGUARD INSURANCE GROUP LLC',
        agencyName: 'VANGUARD INSURANCE GROUP LLC',
        address: '2888 Nationwide Pkwy',
        city: 'Brunswick',
        state: 'OH',
        zip: '44212',
        phone: '330-241-7570',
        fax: '330-281-4025',
        email: 'Grant@Vigagency.com'
    };
};

// Also update when signature select changes
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'signatureSelect') {
        const selectedSignature = e.target.value;
        console.log('Signature selection changed to:', selectedSignature);

        // Preview the producer name change
        const producerField = document.getElementById('producerInfo');
        if (producerField) {
            if (selectedSignature === 'Maureen Corp') {
                const currentValue = producerField.value;
                const previewValue = currentValue.replace(/VANGUARD INSURANCE GROUP(?: LLC)?/gi, 'UNITED INSURANCE GROUP');
                producerField.style.backgroundColor = '#fef3c7';
                producerField.title = 'Will change to: UNITED INSURANCE GROUP';

                // Show preview text
                const previewDiv = document.getElementById('producerPreview') || document.createElement('div');
                previewDiv.id = 'producerPreview';
                previewDiv.style.cssText = 'color: #92400e; font-size: 12px; margin-top: 5px;';
                previewDiv.textContent = 'Will change to: UNITED INSURANCE GROUP';
                if (!document.getElementById('producerPreview')) {
                    producerField.parentNode.appendChild(previewDiv);
                }
            } else {
                producerField.style.backgroundColor = '';
                producerField.title = '';
                const previewDiv = document.getElementById('producerPreview');
                if (previewDiv) previewDiv.remove();
            }
        }
    }
});

console.log('✅ Maureen United Insurance Group handler ready');