// Sync contact phone number to client_phone field for MAVICS policy
// Copy and paste into vigagency.com admin console

console.log('🔧 Syncing contact phone to client_phone field...');

async function syncPhoneField() {
    try {
        // Get MAVICS policy
        const response = await fetch('/api/policies');
        const policies = await response.json();
        const mavicsPolicy = policies.find(p => p.policy_number === '9300258908');

        if (mavicsPolicy) {
            console.log('✅ Found MAVICS policy');
            console.log('📞 Contact phone:', mavicsPolicy.contact?.["Phone Number"]);
            console.log('📞 Client phone (current):', mavicsPolicy.client_phone);

            // Sync the phone number from contact to client_phone
            if (mavicsPolicy.contact?.["Phone Number"] && !mavicsPolicy.client_phone) {
                mavicsPolicy.client_phone = mavicsPolicy.contact["Phone Number"];
                console.log('📞 Syncing phone:', mavicsPolicy.client_phone);

                // Update the policy
                const updateResponse = await fetch(`/api/policies/${mavicsPolicy.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(mavicsPolicy)
                });

                if (updateResponse.ok) {
                    console.log('✅ Phone field synced successfully!');

                    // Show notification
                    const div = document.createElement('div');
                    div.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:15px;border-radius:5px;z-index:10000;font-family:Arial;';
                    div.innerHTML = '✅ Phone Synced!<br>Authentication should work now';
                    document.body.appendChild(div);
                    setTimeout(() => div.remove(), 3000);
                } else {
                    console.log('❌ Failed to update policy');
                }
            } else {
                console.log('⚠️ Phone already synced or contact phone missing');
            }
        } else {
            console.log('❌ MAVICS policy not found');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

syncPhoneField();