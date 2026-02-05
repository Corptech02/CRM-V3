// Simple COI Migration Script - Run in CRM Browser Console
// This will extract the real COI document from localStorage and migrate it

console.log('🔄 Extracting real COI document...');

// Get policies from localStorage
const policies = JSON.parse(localStorage.getItem('policies') || '[]');
console.log('Found', policies.length, 'policies');

// Find policy with COI documents
const policyWithCOI = policies.find(p => p.coiDocuments && p.coiDocuments.length > 0);

if (policyWithCOI) {
    const coiDoc = policyWithCOI.coiDocuments[0];
    console.log('Found COI document:', coiDoc.name);
    console.log('Data URL length:', coiDoc.dataUrl.length);

    if (coiDoc.dataUrl.length > 1000) {
        console.log('🚀 Migrating real COI document...');

        // Migrate with correct policy number
        fetch('/api/coi/migrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documents: [{
                    id: coiDoc.id + '-real',
                    name: coiDoc.name,
                    type: coiDoc.type,
                    uploadDate: coiDoc.uploadDate,
                    dataUrl: coiDoc.dataUrl,
                    formData: { policyNumber: '32432432' }
                }]
            })
        })
        .then(r => r.json())
        .then(result => {
            console.log('✅ Migration result:', result);
            console.log('🎉 Real COI document is now available!');
            console.log('Test at: https://vigagency.com/pages/login.html');
        });
    } else {
        console.log('❌ COI document data seems incomplete');
    }
} else {
    console.log('❌ No COI documents found in localStorage');
}