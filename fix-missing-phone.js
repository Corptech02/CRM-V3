// Fix missing phone number for policy authentication
// This updates the policy database to include the correct phone number

console.log('🔧 Fixing missing phone number for policy 9300258908...');

async function fixMissingPhone() {
    try {
        // Get the policy that needs fixing
        const response = await fetch('/api/policies');
        const policies = await response.json();

        // Find the policy
        const policyToFix = policies.find(p =>
            p.policy_number === '9300258908' ||
            p.policyNumber === '9300258908'
        );

        if (policyToFix) {
            console.log('✅ Found policy to fix:', policyToFix);

            // Check all possible phone number fields
            const phoneFields = [
                policyToFix.client_phone,
                policyToFix.phone,
                policyToFix.clientPhone,
                policyToFix.contact?.phone,
                policyToFix.contact?.["Phone Number"],
                policyToFix.contact?.phoneNumber
            ];

            console.log('📞 Current phone fields:', phoneFields);

            // If client_phone is empty, use the correct phone number
            if (!policyToFix.client_phone || policyToFix.client_phone.trim() === '') {
                console.log('🔧 Updating client_phone field...');

                // Update the policy with the correct phone number
                const updatedPolicy = {
                    ...policyToFix,
                    client_phone: '(216) 551-6363',
                    phone: '(216) 551-6363'
                };

                // If contact object exists, also update it
                if (policyToFix.contact) {
                    updatedPolicy.contact = {
                        ...policyToFix.contact,
                        "Phone Number": "(216) 551-6363",
                        phone: "(216) 551-6363"
                    };
                }

                console.log('📝 Updated policy:', updatedPolicy);

                // Try to update via API
                try {
                    const updateResponse = await fetch(`/api/policies/${policyToFix.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updatedPolicy)
                    });

                    if (updateResponse.ok) {
                        console.log('✅ Policy updated successfully via API');
                    } else {
                        console.log('⚠️ API update failed, trying direct database update...');
                    }
                } catch (apiError) {
                    console.log('⚠️ API not available, trying client-side fix...');
                }

                // Also update client-side if policyDB exists
                if (window.policyDB && window.policyDB.updatePolicy) {
                    await window.policyDB.updatePolicy(updatedPolicy);
                    console.log('✅ Client-side database updated');
                }
            }

            // Test authentication after fix
            console.log('🔐 Testing authentication after fix...');
            if (window.policyDB && window.policyDB.authenticateUser) {
                const testResult = await window.policyDB.authenticateUser('9300258908', '2165516363');
                console.log('🔐 Test authentication result:', testResult);

                if (testResult.success) {
                    console.log('✅ AUTHENTICATION FIX SUCCESSFUL!');

                    // Show success notification
                    const notification = document.createElement('div');
                    notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #4CAF50;
                        color: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        z-index: 10000;
                        font-family: Arial, sans-serif;
                        font-weight: bold;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    `;
                    notification.innerHTML = '✅ Phone Number Fixed!<br><small>Policy 9300258908 can now login</small>';
                    document.body.appendChild(notification);

                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 5000);
                }
            }

        } else {
            console.log('❌ Policy 9300258908 not found');
        }

    } catch (error) {
        console.error('❌ Error fixing phone number:', error);
    }
}

// Run the fix
fixMissingPhone();