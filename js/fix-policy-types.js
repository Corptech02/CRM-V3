// Script to check and fix policy types in localStorage
(function() {
    console.log('=== Checking Policy Types ===');
    
    // Get all policies from localStorage
    const policies = JSON.parse(localStorage.getItem('insurance_policies') || '[]');
    
    console.log(`Found ${policies.length} policies`);
    
    // Check each policy
    policies.forEach((policy, index) => {
        console.log(`\nPolicy ${index + 1}:`);
        console.log('- ID:', policy.id);
        console.log('- Policy Number:', policy.policyNumber);
        console.log('- Policy Type:', policy.policyType);
        console.log('- Type:', policy.type);
        console.log('- Overview:', policy.overview);
        
        // Check if policy type is missing
        if (!policy.policyType) {
            console.log('⚠️ Missing policyType!');
            
            // Try to find type from other sources
            if (policy.type) {
                policy.policyType = policy.type;
                console.log('✅ Fixed using policy.type:', policy.type);
            } else if (policy.overview && policy.overview['Policy Type']) {
                // Convert display type to system type
                const displayType = policy.overview['Policy Type'];
                const typeMap = {
                    'Commercial Auto': 'commercial-auto',
                    'Personal Auto': 'personal-auto',
                    'Homeowners': 'homeowners',
                    'Commercial Property': 'commercial-property',
                    'General Liability': 'general-liability',
                    'Professional': 'professional-liability',
                    'Professional Liability': 'professional-liability',
                    'Workers Comp': 'workers-comp',
                    'Umbrella': 'umbrella',
                    'Life': 'life',
                    'Health': 'health'
                };
                policy.policyType = typeMap[displayType] || displayType.toLowerCase().replace(/\s+/g, '-');
                console.log('✅ Fixed using overview["Policy Type"]:', policy.policyType);
            } else {
                // Default to commercial-auto if no type found
                policy.policyType = 'commercial-auto';
                console.log('✅ Set default type: commercial-auto');
            }
        }
    });
    
    // Save the fixed policies back to localStorage
    localStorage.setItem('insurance_policies', JSON.stringify(policies));
    console.log('\n=== Policies Updated ===');
    console.log('Refresh the page to see the changes.');
    
    // Return the fixed policies for inspection
    return policies;
})();