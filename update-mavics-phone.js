// Update MAVICS GLOBAL SERVICES phone number for authentication
// Copy and paste into vigagency.com admin dashboard console

console.log('🔧 Updating MAVICS GLOBAL SERVICES phone number...');

async function updateMavicsPhone() {
    try {
        // Get current policies
        const response = await fetch('/api/policies');
        const policies = await response.json();

        // Find MAVICS policy
        const mavicsPolicy = policies.find(p =>
            p.policy_number === '9300258908' ||
            (p.insured_name && p.insured_name.includes('MAVICS'))
        );

        if (mavicsPolicy) {
            console.log('✅ Found MAVICS policy:', mavicsPolicy);
            console.log('📞 Current phone:', mavicsPolicy.client_phone);

            // Update the phone number
            const updatedPolicy = {
                ...mavicsPolicy,
                client_phone: '(216) 551-6363'
            };

            // If contact object exists, update it too
            if (mavicsPolicy.contact) {
                updatedPolicy.contact = {
                    ...mavicsPolicy.contact,
                    "Phone Number": "(216) 551-6363"
                };
            }

            console.log('📝 Updating policy with phone:', updatedPolicy.client_phone);

            // Update via API
            const updateResponse = await fetch(`/api/policies/${mavicsPolicy.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedPolicy)
            });

            if (updateResponse.ok) {
                console.log('✅ Policy phone number updated successfully!');

                // Show success notification
                const div = document.createElement('div');
                div.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:15px;border-radius:5px;z-index:10000;font-family:Arial;';
                div.innerHTML = '✅ MAVICS Phone Updated!<br>Login should work now';
                document.body.appendChild(div);
                setTimeout(() => div.remove(), 4000);

                // Verify the update worked
                setTimeout(async () => {
                    const checkResponse = await fetch('/api/policies');
                    const checkPolicies = await checkResponse.json();
                    const checkPolicy = checkPolicies.find(p => p.policy_number === '9300258908');
                    console.log('✅ Verification - Updated policy phone:', checkPolicy?.client_phone);
                }, 1000);

            } else {
                console.log('❌ Failed to update policy');
            }

        } else {
            console.log('❌ MAVICS policy not found');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

updateMavicsPhone();