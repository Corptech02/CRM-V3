// Correct COI Migration Script - Run in CRM Browser Console
// This extracts from the correct localStorage key: insurance_policies

console.log('🔄 Starting correct COI migration...');

// Get data from the correct localStorage key
const insurancePoliciesData = localStorage.getItem('insurance_policies');

if (insurancePoliciesData) {
    console.log('✅ Found insurance_policies data:', insurancePoliciesData.length, 'characters');

    try {
        const parsed = JSON.parse(insurancePoliciesData);
        console.log('📄 Parsed insurance policies. Type:', typeof parsed);

        // Check if it's an array or object
        if (Array.isArray(parsed)) {
            console.log('📋 Insurance policies is an array with', parsed.length, 'items');

            // Look for COI documents in each policy
            parsed.forEach((policy, idx) => {
                console.log(`Policy ${idx}:`, policy.policy_number || policy.policyNumber || policy.id, '-', policy.insured_name || policy.name);

                if (policy.coiDocuments && policy.coiDocuments.length > 0) {
                    console.log(`  ✅ Found COI documents: ${policy.coiDocuments.length}`);

                    policy.coiDocuments.forEach((doc, docIdx) => {
                        console.log(`    Doc ${docIdx}: ${doc.name} (${doc.dataUrl ? doc.dataUrl.length : 0} chars)`);

                        // If this is a real document (not a placeholder), migrate it
                        if (doc.dataUrl && doc.dataUrl.length > 10000) {
                            console.log('🚀 Migrating real COI document...');

                            const migrationData = {
                                documents: [{
                                    id: doc.id + '-migrated',
                                    name: doc.name,
                                    type: doc.type,
                                    uploadDate: doc.uploadDate,
                                    dataUrl: doc.dataUrl, // Real base64 data
                                    formData: {
                                        policyNumber: '32432432' // Map to Grant Corp policy
                                    }
                                }]
                            };

                            // Call migration API
                            fetch('/api/coi/migrate', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(migrationData)
                            })
                            .then(response => response.json())
                            .then(result => {
                                console.log('✅ Migration result:', result);
                                if (result.success) {
                                    console.log('🎉 Real COI document migrated! Client portal should now show the full certificate.');
                                }
                            })
                            .catch(error => console.error('❌ Migration failed:', error));
                        }
                    });
                }
            });
        } else {
            console.log('📋 Insurance policies is an object. Keys:', Object.keys(parsed));
            // Handle object structure if needed
            Object.values(parsed).forEach((policy, idx) => {
                if (policy && typeof policy === 'object') {
                    console.log(`Policy object ${idx}:`, policy.policy_number || policy.policyNumber, policy.insured_name);
                    // Add similar COI extraction logic here if needed
                }
            });
        }

    } catch (e) {
        console.error('❌ Error parsing insurance_policies:', e);
    }
} else {
    console.log('❌ No insurance_policies found in localStorage');
}