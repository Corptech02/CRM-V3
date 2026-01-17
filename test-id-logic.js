// Test the ID detection logic
function testIdDetection(id) {
    const isExistingPolicy = id &&
                           id !== 'new' &&
                           !id.startsWith('POL-') &&
                           !id.startsWith('policy_') &&
                           !id.startsWith('policy-');

    const method = isExistingPolicy ? 'PUT' : 'POST';

    console.log(`ID: "${id}" -> isExisting: ${isExistingPolicy} -> Method: ${method}`);
}

console.log('Testing ID detection logic:');
console.log('=============================');

// Test various ID formats
testIdDetection('new');                           // Should be POST (new policy)
testIdDetection('policy_1767808614320_abc123');   // Should be POST (generated ID)
testIdDetection('policy-older-format');           // Should be POST (generated ID)
testIdDetection('POL-12345');                     // Should be POST (generated ID)
testIdDetection('12345');                         // Should be PUT (database ID)
testIdDetection('real-policy-id-from-db');        // Should be PUT (database ID)
testIdDetection('');                              // Should be POST (empty)
testIdDetection(null);                            // Should be POST (null)
testIdDetection(undefined);                       // Should be POST (undefined)