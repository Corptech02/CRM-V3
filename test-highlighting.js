// Test script for lead highlighting functionality
console.log('🔥 TESTING LEAD HIGHLIGHTING FUNCTIONALITY');

// Check if we have leads data
const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
console.log('📊 Found', leads.length, 'leads in localStorage');

if (leads.length > 0) {
    console.log('🔍 Sample lead data:');
    const sampleLead = leads[0];
    console.log('Lead 0 data structure:', Object.keys(sampleLead));

    // Check timestamp fields
    console.log('Timestamp fields in lead 0:');
    console.log('  stageTimestamps:', sampleLead.stageTimestamps);
    console.log('  stageUpdatedAt:', sampleLead.stageUpdatedAt);
    console.log('  updatedAt:', sampleLead.updatedAt);
    console.log('  createdAt:', sampleLead.createdAt);
    console.log('  created:', sampleLead.created);
    console.log('  stage:', sampleLead.stage);

    // Calculate days old based on available timestamps
    let timestamp = null;
    if (sampleLead.stageTimestamps && sampleLead.stageTimestamps[sampleLead.stage]) {
        timestamp = sampleLead.stageTimestamps[sampleLead.stage];
        console.log('📅 Using stageTimestamps:', timestamp);
    } else if (sampleLead.stageUpdatedAt) {
        timestamp = sampleLead.stageUpdatedAt;
        console.log('📅 Using stageUpdatedAt:', timestamp);
    } else if (sampleLead.updatedAt) {
        timestamp = sampleLead.updatedAt;
        console.log('📅 Using updatedAt:', timestamp);
    } else if (sampleLead.createdAt) {
        timestamp = sampleLead.createdAt;
        console.log('📅 Using createdAt:', timestamp);
    } else if (sampleLead.created) {
        const parts = sampleLead.created.split('/');
        if (parts.length === 3) {
            timestamp = new Date(parts[2], parts[0] - 1, parts[1]).toISOString();
            console.log('📅 Using created (converted):', timestamp);
        }
    }

    if (timestamp) {
        const stageDate = new Date(timestamp);
        const now = new Date();
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const compareDate = new Date(stageDate.getFullYear(), stageDate.getMonth(), stageDate.getDate());
        const diffTime = nowDate - compareDate;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        console.log('⏰ Lead age calculation:');
        console.log('  Timestamp date:', stageDate.toDateString());
        console.log('  Today date:', nowDate.toDateString());
        console.log('  Days old:', diffDays);

        if (diffDays === 1) {
            console.log('🟡 Should be YELLOW (1 day old)');
        } else if (diffDays > 1 && diffDays < 7) {
            console.log('🟠 Should be ORANGE (' + diffDays + ' days old)');
        } else if (diffDays >= 7) {
            console.log('🔴 Should be RED (' + diffDays + ' days old)');
        } else {
            console.log('⚪ Should be NO COLOR (today or future)');
        }
    } else {
        console.log('❌ No valid timestamp found for this lead');
    }
}

// Check if forceAllHighlighting function exists
if (typeof window.forceAllHighlighting === 'function') {
    console.log('✅ forceAllHighlighting function exists');
} else {
    console.log('❌ forceAllHighlighting function NOT found');
}

// Check if table exists
const table = document.getElementById('leadsTableBody');
if (table) {
    const rows = table.querySelectorAll('tr');
    console.log('📋 Found table with', rows.length, 'rows');

    if (rows.length > 0) {
        const firstRow = rows[0];
        const cells = firstRow.querySelectorAll('td');
        console.log('📝 First row has', cells.length, 'cells');

        if (cells.length >= 7) {
            const todoCell = cells[6];
            const todoText = (todoCell.textContent || '').trim();
            console.log('📄 First row TO DO text: "' + todoText + '"');
        }
    }
} else {
    console.log('❌ No leadsTableBody table found');
}

console.log('🔚 Testing complete');