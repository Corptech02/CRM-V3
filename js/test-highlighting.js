// Simple test highlighting script
console.log('🧪 TEST HIGHLIGHTING SCRIPT LOADING');

// Immediate function definition
window.forceHighlightNow = function() {
    console.log('🔥 TEST: forceHighlightNow called!');

    const table = document.getElementById('leadsTableBody');
    if (!table) {
        console.log('❌ No table found');
        return;
    }

    console.log('✅ Table found, applying test highlighting');

    const rows = table.querySelectorAll('tr');
    let count = 0;

    rows.forEach((row, idx) => {
        // Simple test highlighting - just make all rows light yellow
        row.style.setProperty('background-color', '#fef3c7', 'important');
        row.style.setProperty('border-left', '4px solid #f59e0b', 'important');
        count++;
    });

    console.log(`✅ TEST: Applied highlighting to ${count} rows`);
    return count;
};

// Test function to verify script loaded
window.testScriptLoaded = function() {
    console.log('✅ TEST: Script definitely loaded');
    return 'LOADED';
};

console.log('✅ TEST SCRIPT: Functions defined');