// Fix COI send request from client dashboard
// Copy and paste into vigagency.com client dashboard console

console.log('🔧 Fixing COI send request...');

// Override the sendCOIRequest function if it exists
if (typeof window.sendCOIRequest === 'function') {
    const originalSendCOI = window.sendCOIRequest;

    window.sendCOIRequest = function(recipientEmail, customMessage) {
        console.log('📧 Enhanced COI send request:', { recipientEmail, customMessage });

        if (!recipientEmail) {
            console.log('❌ No recipient email provided');
            alert('Please provide a recipient email address');
            return;
        }

        // Get current policy data
        const policyData = window.currentPolicy || {};
        console.log('📋 Using policy data:', policyData);

        // Prepare form data with proper structure
        const formData = new FormData();

        // Add required fields based on API error message
        formData.append('recipientEmail', recipientEmail);
        formData.append('policyNumber', policyData.policy_number || '');
        formData.append('insuredName', policyData.insured_name || policyData.clientName || '');

        if (customMessage) {
            formData.append('message', customMessage);
        }

        // Add policy data as JSON
        formData.append('policyData', JSON.stringify(policyData));

        // Check if there's a COI document to attach
        const coiDocument = window.currentCOIDocument || window.coiDocument;
        if (coiDocument && coiDocument.dataUrl) {
            // Convert base64 to blob for attachment
            const base64Data = coiDocument.dataUrl.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });

            formData.append('coiDocument', blob, `COI_${policyData.policy_number}_${new Date().toISOString().split('T')[0]}.png`);
            console.log('📎 COI document attached');
        }

        console.log('📤 Sending enhanced COI request...');

        // Send the request with proper error handling
        fetch('/api/coi/send-request', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            console.log('📥 COI response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📥 COI response data:', data);
            if (data.success) {
                console.log('✅ COI sent successfully!');
                alert(`✅ COI sent successfully to ${recipientEmail}`);
            } else {
                console.log('❌ COI send failed:', data.error);
                alert(`❌ Failed to send COI: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('❌ COI send error:', error);
            alert(`❌ Error sending COI: ${error.message}`);
        });
    };

    console.log('✅ COI send request function enhanced');
} else {
    console.log('⚠️ sendCOIRequest function not found, creating new one...');

    // Create the function if it doesn't exist
    window.sendCOIRequest = function(recipientEmail, customMessage) {
        console.log('📧 New COI send request:', { recipientEmail, customMessage });

        if (!recipientEmail) {
            alert('Please provide a recipient email address');
            return;
        }

        const policyData = window.currentPolicy || {};
        const formData = new FormData();

        formData.append('recipientEmail', recipientEmail);
        formData.append('policyNumber', policyData.policy_number || '');
        formData.append('insuredName', policyData.insured_name || '');
        if (customMessage) formData.append('message', customMessage);

        fetch('/api/coi/send-request', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`✅ COI sent successfully to ${recipientEmail}`);
            } else {
                alert(`❌ Failed to send COI: ${data.error}`);
            }
        })
        .catch(error => {
            alert(`❌ Error sending COI: ${error.message}`);
        });
    };
}

// Also fix any existing send buttons to include recipient email
document.addEventListener('click', function(event) {
    if (event.target.matches('[data-action="send-coi"]') ||
        event.target.matches('.send-coi-btn') ||
        event.target.textContent.includes('Send COI')) {

        event.preventDefault();

        const recipientEmail = prompt('Enter recipient email address:');
        if (recipientEmail && recipientEmail.includes('@')) {
            const customMessage = prompt('Enter custom message (optional):') || '';
            window.sendCOIRequest(recipientEmail, customMessage);
        } else if (recipientEmail) {
            alert('Please enter a valid email address');
        }
    }
});

// Success notification
const notification = document.createElement('div');
notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2196F3;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
`;
notification.innerHTML = '🔧 COI Send Request Fixed!<br><small>Now includes required email field</small>';
document.body.appendChild(notification);

setTimeout(() => {
    if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
    }
}, 5000);

console.log('✅ COI send request fix applied!');