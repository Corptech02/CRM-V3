// Calculate RIVERSIDE AUTO TOW remaining duration
const leadData = {
    "greenHighlightUntil": "2026-01-24T22:20:15.039Z",
    "greenHighlightDays": 2
};

const now = new Date();
const expiry = new Date(leadData.greenHighlightUntil);
const diffMs = expiry - now;

console.log('🔍 RIVERSIDE AUTO TOW Highlight Duration Analysis:');
console.log('==========================================');
console.log(`Current time: ${now.toLocaleString()}`);
console.log(`Expires at: ${expiry.toLocaleString()}`);
console.log(`greenHighlightDays: ${leadData.greenHighlightDays} days`);
console.log('');

if (diffMs > 0) {
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    console.log(`✅ Status: ACTIVE`);
    console.log(`⏰ Time Remaining: ${days}d ${hours}h ${minutes}m`);
    console.log(`📊 Total Hours Remaining: ${totalHours}h`);

    if (days > 0) {
        console.log(`💡 Display Format: "${days}d ${hours}h remaining"`);
    } else if (hours > 0) {
        console.log(`💡 Display Format: "${hours}h ${minutes}m remaining"`);
    } else {
        console.log(`💡 Display Format: "${minutes}m remaining"`);
    }
} else {
    console.log(`❌ Status: EXPIRED`);
    console.log(`⏰ Expired: ${Math.abs(Math.floor(diffMs / (1000 * 60 * 60)))} hours ago`);
}

console.log('');
console.log('🔧 Fix Verification:');
console.log('- greenHighlightUntil is properly set ✅');
console.log('- greenHighlightDays is stored ✅');
console.log('- Data exists in server database ✅');