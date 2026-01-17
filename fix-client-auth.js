// Fix client authentication for vigagency.com
// This script ensures policies from admin dashboard are accessible for client login

console.log('🔧 Fixing client authentication access...');

// Enhanced authentication function that checks multiple phone number formats
if (window.policyDB && window.policyDB.authenticateUser) {
    const originalAuth = window.policyDB.authenticateUser;

    window.policyDB.authenticateUser = async function(policyNumber, phoneNumber) {
        console.log('🔐 Enhanced authentication attempt:', { policyNumber, phoneNumber });

        try {
            // First try the original authentication
            const originalResult = await originalAuth.call(this, policyNumber, phoneNumber);
            if (originalResult.success) {
                console.log('✅ Original authentication succeeded');
                return originalResult;
            }

            console.log('🔍 Original auth failed, trying enhanced search...');

            // Get all policies
            const allPolicies = await this.getAllPolicies();
            console.log('📊 Searching through', allPolicies.length, 'policies');

            // Find policy by number (try multiple formats)
            const targetPolicy = allPolicies.find(policy => {
                const policyNum = policy.policy_number || policy.policyNumber || policy.id || '';
                return policyNum === policyNumber || policyNum === policyNumber.toString();
            });

            if (!targetPolicy) {
                console.log('❌ Policy not found:', policyNumber);
                return { success: false, error: 'Policy not found' };
            }

            console.log('✅ Found target policy:', targetPolicy);

            // Check phone number using multiple possible field names and formats
            const phoneFields = [
                targetPolicy.client_phone,
                targetPolicy.phone,
                targetPolicy.clientPhone,
                targetPolicy.contact?.phone,
                targetPolicy.contact?.["Phone Number"],
                targetPolicy.contact?.phoneNumber,
                targetPolicy.insured?.phone,
                targetPolicy.insured?.["Phone Number"]
            ];

            console.log('📞 Checking phone fields:', phoneFields);

            // Clean input phone number
            const cleanInputPhone = phoneNumber.replace(/\D/g, '');
            console.log('📞 Clean input phone:', cleanInputPhone);

            // Check each phone field
            for (const phoneField of phoneFields) {
                if (phoneField) {
                    const cleanStoredPhone = phoneField.replace(/\D/g, '');
                    console.log(`📞 Comparing: "${cleanInputPhone}" === "${cleanStoredPhone}"`);

                    if (cleanInputPhone === cleanStoredPhone) {
                        console.log('✅ Phone number match found!');
                        return {
                            success: true,
                            policy: targetPolicy,
                            message: 'Authentication successful'
                        };
                    }
                }
            }

            console.log('❌ No phone number match found');
            return { success: false, error: 'Invalid policy number or phone number' };

        } catch (error) {
            console.error('❌ Enhanced authentication error:', error);
            return { success: false, error: 'Authentication system error' };
        }
    };

    console.log('✅ Enhanced authentication system applied');
} else {
    console.log('❌ policyDB.authenticateUser not found');
}

// Also ensure the policy database includes admin policies
if (window.policyDB && window.policyDB.getAllPolicies) {
    // Function to sync admin policies to client database
    window.syncAdminPolicies = async function() {
        try {
            console.log('🔄 Syncing admin policies to client database...');

            // Try to fetch from admin API
            const adminResponse = await fetch('/api/policies');
            if (adminResponse.ok) {
                const adminPolicies = await adminResponse.json();
                console.log('📊 Found', adminPolicies.length, 'admin policies');

                // Check current client policies
                const clientPolicies = await window.policyDB.getAllPolicies();
                console.log('📊 Current client policies:', clientPolicies.length);

                // Add missing admin policies to client database
                for (const adminPolicy of adminPolicies) {
                    const policyExists = clientPolicies.some(cp =>
                        (cp.policy_number || cp.policyNumber) === (adminPolicy.policy_number || adminPolicy.policyNumber)
                    );

                    if (!policyExists) {
                        console.log('➕ Adding missing policy to client database:', adminPolicy.policy_number || adminPolicy.policyNumber);

                        // Ensure proper format for client authentication
                        const clientPolicy = {
                            ...adminPolicy,
                            client_phone: adminPolicy.client_phone || adminPolicy.contact?.["Phone Number"] || adminPolicy.contact?.phone,
                            client_name: adminPolicy.client_name || adminPolicy.clientName || adminPolicy.insured?.["Name/Business Name"]
                        };

                        // Add to client database (if add method exists)
                        if (window.policyDB.addPolicy) {
                            await window.policyDB.addPolicy(clientPolicy);
                        }
                    }
                }

                console.log('✅ Policy sync completed');
            }
        } catch (error) {
            console.error('❌ Policy sync error:', error);
        }
    };

    // Auto-sync policies
    window.syncAdminPolicies();
}

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
    border-left: 4px solid #1976D2;
`;
notification.innerHTML = '🔧 Client Authentication Enhanced!<br><small>Admin policies now accessible for client login</small>';
document.body.appendChild(notification);

setTimeout(() => {
    if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
    }
}, 5000);

console.log('✅ Client authentication fix applied!');
console.log('📋 Try logging in again with:');
console.log('  Policy: 9300258908');
console.log('  Phone: 2165516363');