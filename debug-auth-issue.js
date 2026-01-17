// Debug client authentication issue for policy 9300258908
// Copy and paste into console on vigagency.com/pages/login.html

console.log('🔍 DEBUG: Investigating authentication issue for policy 9300258908...');

// Function to check policy database
async function debugAuthenticationIssue() {
    try {
        // Check if policyDB exists
        if (typeof window.policyDB !== 'undefined') {
            console.log('✅ policyDB found:', window.policyDB);

            // Try to get all policies
            if (window.policyDB.getAllPolicies) {
                const allPolicies = await window.policyDB.getAllPolicies();
                console.log('📊 Total policies in database:', allPolicies.length);

                // Look for the specific policy
                const targetPolicy = allPolicies.find(p =>
                    p.policy_number === '9300258908' ||
                    p.policyNumber === '9300258908' ||
                    p.id === '9300258908'
                );

                if (targetPolicy) {
                    console.log('✅ Found target policy:', targetPolicy);
                    console.log('📞 Policy phone number variations:');
                    console.log('  - client_phone:', targetPolicy.client_phone);
                    console.log('  - phone:', targetPolicy.phone);
                    console.log('  - clientPhone:', targetPolicy.clientPhone);
                    console.log('  - contact.phone:', targetPolicy.contact?.phone);
                    console.log('  - contact["Phone Number"]:', targetPolicy.contact?.["Phone Number"]);

                    // Test phone number matching
                    const inputPhone = '2165516363';
                    const storedPhone = targetPolicy.client_phone || targetPolicy.phone || targetPolicy.clientPhone || targetPolicy.contact?.["Phone Number"] || '';

                    console.log('📞 Phone number comparison:');
                    console.log('  - Input phone (cleaned):', inputPhone.replace(/\D/g, ''));
                    console.log('  - Stored phone:', storedPhone);
                    console.log('  - Stored phone (cleaned):', storedPhone.replace(/\D/g, ''));
                    console.log('  - Match?:', inputPhone.replace(/\D/g, '') === storedPhone.replace(/\D/g, ''));

                } else {
                    console.log('❌ Policy 9300258908 not found in database');
                    console.log('📊 Available policy numbers:');
                    allPolicies.forEach((p, index) => {
                        console.log(`  ${index + 1}. ${p.policy_number || p.policyNumber || p.id} - ${p.client_name || p.clientName || p.insured_name}`);
                    });
                }
            }

            // Test the authentication function directly
            if (window.policyDB.authenticateUser) {
                console.log('🔐 Testing authentication function...');
                const authResult = await window.policyDB.authenticateUser('9300258908', '2165516363');
                console.log('🔐 Authentication result:', authResult);
            }

        } else {
            console.log('❌ policyDB not found on window object');
            console.log('🔍 Available objects:', Object.keys(window).filter(k => k.toLowerCase().includes('policy')));
        }

        // Check if we can fetch policies directly from API
        console.log('🌐 Checking API directly...');
        const response = await fetch('/api/policies');
        const apiData = await response.json();
        console.log('🌐 API response:', apiData);

        if (Array.isArray(apiData)) {
            const apiPolicy = apiData.find(p =>
                p.policy_number === '9300258908' ||
                p.policyNumber === '9300258908'
            );
            if (apiPolicy) {
                console.log('✅ Found policy in API:', apiPolicy);
            }
        }

    } catch (error) {
        console.error('❌ Debug error:', error);
    }
}

// Run the debug
debugAuthenticationIssue();