// COI Document Extraction and Migration Script
// Run this script in the CRM browser console to extract and migrate real COI documents

console.log('🔄 Starting COI document extraction and migration...');

// Get all policies from localStorage
let policies = [];
try {
    policies = JSON.parse(localStorage.getItem('policies') || '[]');
    console.log('📋 Found', policies.length, 'policies in localStorage');
} catch (e) {
    console.error('❌ Error parsing policies from localStorage:', e);
}

// Find policies with COI documents
const policiesWithCOI = policies.filter(p => p.coiDocuments && p.coiDocuments.length > 0);
console.log('✅ Found', policiesWithCOI.length, 'policies with COI documents');

if (policiesWithCOI.length === 0) {
    console.log('❌ No policies with COI documents found. Check if COI documents exist in localStorage.');
} else {
    // Process each policy with COI documents
    policiesWithCOI.forEach((policy, index) => {
        console.log(`\n📄 Policy ${index + 1}:`, policy.policy_number || policy.policyNumber, '-', policy.insured_name);
        console.log('   COI Documents:', policy.coiDocuments.length);

        policy.coiDocuments.forEach((coiDoc, docIndex) => {
            console.log(`   Document ${docIndex + 1}:`, coiDoc.name);
            console.log('   ID:', coiDoc.id);
            console.log('   Data URL length:', coiDoc.dataUrl ? coiDoc.dataUrl.length : 'No dataUrl');
            console.log('   Upload date:', coiDoc.uploadDate);
        });
    });

    // Find the specific Grant Corp policy (32432432)
    const grantCorpPolicy = policiesWithCOI.find(p =>
        p.policy_number === '32432432' ||
        p.policyNumber === '32432432' ||
        (p.insured_name && p.insured_name.toLowerCase().includes('grant'))
    );

    if (grantCorpPolicy && grantCorpPolicy.coiDocuments.length > 0) {
        console.log('\n🎯 Found Grant Corp policy with COI documents!');
        const coiDoc = grantCorpPolicy.coiDocuments[0];

        console.log('📄 COI Document details:');
        console.log('  - ID:', coiDoc.id);
        console.log('  - Name:', coiDoc.name);
        console.log('  - Type:', coiDoc.type);
        console.log('  - Data URL length:', coiDoc.dataUrl ? coiDoc.dataUrl.length : 'Missing');
        console.log('  - Upload date:', coiDoc.uploadDate);

        if (coiDoc.dataUrl && coiDoc.dataUrl.length > 1000) {
            console.log('\n🚀 Migrating real COI document to database...');

            const migrationData = {
                documents: [{
                    id: coiDoc.id + '-real',
                    name: coiDoc.name,
                    type: coiDoc.type,
                    uploadDate: coiDoc.uploadDate,
                    dataUrl: coiDoc.dataUrl, // Real base64 image data
                    formData: {
                        policyNumber: grantCorpPolicy.policy_number || grantCorpPolicy.policyNumber || '32432432'
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
                console.log('✅ Migration completed:', result);
                if (result.success) {
                    console.log('🎉 Successfully migrated', result.successful, 'COI document(s)');
                    console.log('💡 The client portal should now show the real COI document!');
                    console.log('🔗 Test at: https://vigagency.com/pages/login.html (login with test@example.com / test123)');
                } else {
                    console.log('❌ Migration had errors:', result.errors);
                }
            })
            .catch(error => {
                console.error('❌ Migration failed:', error);
            });
        } else {
            console.log('❌ COI document is missing valid image data');
        }
    } else {
        console.log('❌ Grant Corp policy with COI documents not found');
        console.log('Available policies with COI:');
        policiesWithCOI.forEach(p => {
            console.log(' -', p.policy_number || p.policyNumber, ':', p.insured_name);
        });
    }
}