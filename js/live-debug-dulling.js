// Live Debug Script for Lead Dulling - 162.220.14.239
console.log('🔧 Live debug script loaded on 162.220.14.239');

// Test what user info is available
window.testUserDetection = function() {
    console.log('\n🔍 USER DETECTION TEST - LIVE SERVER');

    // Check all possible user sources
    const userInfo = localStorage.getItem('userInfo');
    const authToken = localStorage.getItem('authToken');
    const simulatedUser = localStorage.getItem('simulatedUser');

    console.log('1. userInfo:', userInfo);
    console.log('2. authToken:', authToken);
    console.log('3. simulatedUser:', simulatedUser);
    console.log('4. window.authService:', window.authService);

    if (window.authService && window.authService.getCurrentUser) {
        const user = window.authService.getCurrentUser();
        console.log('5. authService.getCurrentUser():', user);
    }

    // Check what leads exist
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    console.log('\n📋 LEADS DATA:');
    console.log(`Total leads: ${leads.length}`);

    if (leads.length > 0) {
        console.log('\nLead assignments:');
        leads.forEach(lead => {
            console.log(`- ${lead.name}: ${lead.assignedTo}`);
        });
    }

    return {userInfo, authToken, simulatedUser, leadsCount: leads.length};
};

// Simulate login function
window.simulateLogin = function(username) {
    localStorage.setItem('simulatedUser', username);
    console.log(`🔐 Simulated login as: ${username}`);

    // Force refresh the leads table to apply dulling
    setTimeout(() => {
        console.log('🔄 Forcing leads table refresh...');

        // Method 1: Try loadLeadsView if it exists
        if (window.loadLeadsView) {
            console.log('📋 Using loadLeadsView()...');
            window.loadLeadsView();
        }
        // Method 2: Try direct table regeneration
        else if (window.generateSimpleLeadRows) {
            console.log('📋 Using generateSimpleLeadRows...');
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const tableBody = document.getElementById('leadsTableBody');
            if (tableBody && leads.length > 0) {
                tableBody.innerHTML = window.generateSimpleLeadRows(leads);
                console.log('✅ Table regenerated with dulling');
            }
        }
        // Method 3: Force page reload if nothing else works
        else {
            console.log('🔄 Force reloading page...');
            window.location.reload();
        }
    }, 100);

    return username;
};

// Reset function
window.resetDulling = function() {
    localStorage.removeItem('simulatedUser');
    const rows = document.querySelectorAll('#leadsTableBody tr');
    rows.forEach(row => {
        row.style.opacity = '1';
    });
    console.log('✅ Reset complete');
};

// Check current state
window.checkCurrentState = function() {
    console.log('\n📊 CURRENT STATE:');
    const rows = document.querySelectorAll('#leadsTableBody tr');
    console.log(`Found ${rows.length} lead rows`);

    rows.forEach((row, i) => {
        const nameCell = row.cells[1];
        const assignedCell = row.cells[7];
        if (nameCell && assignedCell) {
            console.log(`${i+1}. ${nameCell.textContent.trim()} (${assignedCell.textContent.trim()}) - opacity: ${row.style.opacity || '1'}`);
        }
    });
};

// Force table refresh function
window.forceTableRefresh = function() {
    console.log('🔄 FORCING TABLE REFRESH...');

    if (window.loadLeadsView) {
        console.log('📋 Using loadLeadsView()...');
        window.loadLeadsView();
    } else if (window.generateSimpleLeadRows) {
        console.log('📋 Regenerating table with current user...');
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        const tableBody = document.getElementById('leadsTableBody');
        if (tableBody && leads.length > 0) {
            tableBody.innerHTML = window.generateSimpleLeadRows(leads);
            console.log('✅ Table regenerated');
        } else {
            console.log('❌ No table body or leads found');
        }
    } else {
        console.log('❌ No refresh functions available');
    }
};

console.log('✅ Live debug functions loaded:');
console.log('   • testUserDetection() - Check what user info exists');
console.log('   • simulateLogin("Hunter") - Test as Hunter');
console.log('   • simulateLogin("Grant") - Test as Grant');
console.log('   • forceTableRefresh() - Manually refresh table');
console.log('   • resetDulling() - Clear all dulling');
console.log('   • checkCurrentState() - See current lead states');
console.log('\n💡 Start with: testUserDetection()');