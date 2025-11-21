// SMS Persistence Test Script
console.log('=== SMS PERSISTENCE TEST ===');

// Check if localStorage.setItem is being overridden
console.log('localStorage.setItem is overridden:', localStorage.setItem.toString().includes('originalSetItem'));

// Test saving to localStorage
console.log('\n1. Testing localStorage.setItem:');
try {
    localStorage.setItem('testKey', 'testValue');
    const retrieved = localStorage.getItem('testKey');
    console.log('  - Test save/retrieve:', retrieved === 'testValue' ? 'PASS' : 'FAIL');
    localStorage.removeItem('testKey');
} catch (e) {
    console.error('  - localStorage test failed:', e);
}

// Check SMS messages
console.log('\n2. Current SMS Messages:');
const smsMessages = localStorage.getItem('smsMessages');
if (smsMessages) {
    const parsed = JSON.parse(smsMessages);
    console.log('  - Total messages:', parsed.length);
    console.log('  - Messages:', parsed);
} else {
    console.log('  - No SMS messages found');
}

// Test saving SMS message
console.log('\n3. Testing SMS save:');
const testMessage = {
    id: Date.now(),
    phoneNumber: '+15551234567',
    name: 'Test Contact',
    body: 'Test message at ' + new Date().toISOString(),
    direction: 'outbound',
    timestamp: new Date().toISOString(),
    read: true
};

try {
    const existing = JSON.parse(localStorage.getItem('smsMessages') || '[]');
    existing.push(testMessage);
    localStorage.setItem('smsMessages', JSON.stringify(existing));
    
    // Verify it was saved
    const saved = JSON.parse(localStorage.getItem('smsMessages') || '[]');
    const found = saved.find(m => m.id === testMessage.id);
    console.log('  - Test message saved:', found ? 'SUCCESS' : 'FAILED');
    if (found) {
        console.log('  - Saved message:', found);
    }
} catch (e) {
    console.error('  - Failed to save test message:', e);
}

// Check getSMSConversations function
console.log('\n4. Testing getSMSConversations:');
if (typeof getSMSConversations === 'function') {
    try {
        const conversations = getSMSConversations();
        console.log('  - Conversations returned:', conversations.length);
        console.log('  - Conversations:', conversations);
    } catch (e) {
        console.error('  - getSMSConversations failed:', e);
    }
} else {
    console.log('  - getSMSConversations function not found');
}

console.log('\n=== END TEST ===');