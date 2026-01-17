// DEBUG: Find all call logs and their durations
console.log('🔍 Debugging all call logs...');

const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
const callLogs = [];

leads.forEach(lead => {
    if (lead.reachOut && lead.reachOut.callLogs) {
        lead.reachOut.callLogs.forEach(log => {
            callLogs.push({
                leadId: lead.id,
                leadName: lead.name,
                duration: log.duration,
                notes: log.notes,
                timestamp: log.timestamp
            });
        });
    }
});

console.log(`Found ${callLogs.length} call logs:`);

// Group by duration to see patterns
const durationCounts = {};
callLogs.forEach(log => {
    const duration = log.duration || 'null/undefined';
    durationCounts[duration] = (durationCounts[duration] || 0) + 1;
});

console.log('Duration breakdown:');
Object.entries(durationCounts).forEach(([duration, count]) => {
    console.log(`  "${duration}": ${count} calls`);
});

// Show specific "20 sec" entries
const twentySecCalls = callLogs.filter(log => log.duration === '20 sec');
if (twentySecCalls.length > 0) {
    console.log(`\n🚨 Found ${twentySecCalls.length} calls with "20 sec" duration:`);
    twentySecCalls.forEach(log => {
        console.log(`  Lead ${log.leadId} (${log.leadName}): ${log.duration} - ${log.notes}`);
    });
}

// Return data for further inspection
window.debugCallLogs = callLogs;