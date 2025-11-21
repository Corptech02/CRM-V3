// Complete Calling System Test
console.log('🧪 Testing Complete Calling System...');
console.log('====================================');

// Check SIP configuration
const sipConfig = JSON.parse(localStorage.getItem('sipConfig') || '{}');
console.log('📋 SIP Configuration:');
console.log(`   Username: ${sipConfig.username || 'Not set'}`);
console.log(`   Domain: ${sipConfig.domain || 'Not set'}`);
console.log(`   Caller ID: ${sipConfig.callerId || 'Not set'}`);

// Check JsSIP availability
const hasJsSIP = typeof JsSIP !== 'undefined';
console.log(`📦 JsSIP Library: ${hasJsSIP ? 'Available' : 'Not available'}`);

// Check calling function availability
const hasMakeCall = typeof makeCall === 'function';
console.log(`📞 makeCall Function: ${hasMakeCall ? 'Available' : 'Not available'}`);

// Check backend connectivity
console.log('\n🌐 Testing Backend Connectivity...');

fetch('http://162-220-14-239.nip.io:3001/api/health', {
    headers: { 'Bypass-Tunnel-Reminder': 'true' }
})
.then(response => response.json())
.then(data => {
    console.log('✅ Backend Response:', data);
    console.log(`   Service: ${data.service}`);
    console.log(`   Status: ${data.status}`);
})
.catch(error => {
    console.error('❌ Backend connection failed:', error);
});

// Test the calling logic priority
console.log('\n🎯 Calling Logic Test:');
const hasSipConfig = sipConfig.username && sipConfig.password && sipConfig.domain;

if (hasSipConfig && hasJsSIP) {
    console.log('1️⃣ Will try SIP calling first');
    console.log('2️⃣ Will fall back to Voice API if SIP fails');
} else if (hasSipConfig) {
    console.log('1️⃣ Will use Twilio Voice API calling');
    console.log('   (SIP config found but JsSIP not available)');
} else {
    console.log('1️⃣ Will use fallback Telnyx API');
    console.log('   (No SIP configuration found)');
}

// Simulate a call test (without actually calling)
console.log('\n📞 Simulating Call Logic...');
console.log('Test number: 3302417570');

if (hasSipConfig && hasJsSIP) {
    console.log('🔊 Would attempt SIP calling first');
    console.log('   ↳ If SIP WebSocket fails, will try Voice API');
} else if (hasSipConfig) {
    console.log('📞 Would use Twilio Voice API directly');
    console.log(`   ↳ POST http://162-220-14-239.nip.io:3001/api/twilio/make-call`);
    console.log(`   ↳ Body: { to: "+13302417570", from: "${sipConfig.callerId}", callerName: "Unknown" }`);
} else {
    console.log('⚠️ Would fall back to Telnyx API (problematic)');
}

console.log('\n✅ System Analysis Complete!');
console.log('💡 Next: Try making an actual call to see the live behavior.');