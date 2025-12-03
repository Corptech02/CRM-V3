// Simple test for highlighting logic
console.log('🧪 TESTING HIGHLIGHTING LOGIC');

// Test data
const testLeads = [
    {
        id: 1,
        name: 'Test Lead Yellow',
        assignedTo: 'John',
        stage: 'new',
        stageUpdatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    },
    {
        id: 2,
        name: 'Test Lead Orange',
        assignedTo: 'Sarah',
        stage: 'quoted',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    },
    {
        id: 3,
        name: 'Test Lead Red',
        assignedTo: 'Mike',
        stage: 'interested',
        created: '11/15/2025' // More than 7 days ago
    }
];

// Test timestamp logic for each lead
testLeads.forEach((lead, idx) => {
    console.log(`\n🧪 Testing lead ${idx + 1}: ${lead.name}`);

    // Find timestamp (same logic as app.js)
    let timestamp = null;
    if (lead.stageTimestamps && lead.stageTimestamps[lead.stage]) {
        timestamp = lead.stageTimestamps[lead.stage];
        console.log('  ✓ Using stageTimestamps');
    } else if (lead.stageUpdatedAt) {
        timestamp = lead.stageUpdatedAt;
        console.log('  ✓ Using stageUpdatedAt');
    } else if (lead.updatedAt) {
        timestamp = lead.updatedAt;
        console.log('  ✓ Using updatedAt');
    } else if (lead.createdAt) {
        timestamp = lead.createdAt;
        console.log('  ✓ Using createdAt');
    } else if (lead.created) {
        // Convert from MM/DD/YYYY format if needed
        const parts = lead.created.split('/');
        if (parts.length === 3) {
            timestamp = new Date(parts[2], parts[0] - 1, parts[1]).toISOString();
            console.log('  ✓ Using created (converted)');
        } else {
            timestamp = lead.created;
            console.log('  ✓ Using created (as-is)');
        }
    }

    if (timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffMs = todayStart - dateStart;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        console.log(`  📅 Timestamp: ${date.toDateString()}`);
        console.log(`  ⏰ Days old: ${diffDays}`);

        if (diffDays === 1) {
            console.log(`  🟡 Should be YELLOW`);
        } else if (diffDays > 1 && diffDays < 7) {
            console.log(`  🟠 Should be ORANGE`);
        } else if (diffDays >= 7) {
            console.log(`  🔴 Should be RED`);
        } else {
            console.log(`  ⚪ Should be NO COLOR (today or future)`);
        }
    } else {
        console.log('  ❌ No timestamp found');
    }
});

console.log('\n🧪 Test complete. Check if expected colors match actual highlighting in table.');