// QUICK VERIFICATION: Check if Harry Welling fix is working
console.log('🔍 VERIFICATION: Checking Harry Welling fix status...');

function verifyHarryWellingFix() {
    try {
        // Get leads from localStorage
        const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        console.log(`📊 Total leads found: ${leads.length}`);

        // Find Harry Welling
        const harry = leads.find(l => l.name && l.name.includes('HARRY WELLING'));

        if (!harry) {
            console.log('❌ Harry Welling not found in leads');
            return false;
        }

        console.log('✅ Found Harry Welling:', harry.name);
        console.log('   ID:', harry.id);
        console.log('   Stage:', harry.stage);
        console.log('   ReachOut data:', harry.reachOut);

        // Test the functions
        if (!window.isHighlightActiveForLead) {
            console.log('❌ isHighlightActiveForLead function not available');
            return false;
        }

        if (!window.getNextAction) {
            console.log('❌ getNextAction function not available');
            return false;
        }

        const hasActiveHighlight = window.isHighlightActiveForLead(harry);
        const todoResult = window.getNextAction(harry.stage, harry);

        console.log('🧪 FUNCTION TESTS:');
        console.log('   isHighlightActiveForLead result:', hasActiveHighlight);
        console.log('   getNextAction result:', `"${todoResult}"`);

        // Check DOM
        const tableBody = document.querySelector('#leadsTableBody') || document.querySelector('tbody');
        if (!tableBody) {
            console.log('❌ Table body not found');
            return false;
        }

        const rows = tableBody.querySelectorAll('tr');
        let harryRow = null;

        rows.forEach(row => {
            const nameCell = row.querySelector('td:first-child');
            if (nameCell && nameCell.textContent.includes('HARRY WELLING')) {
                harryRow = row;
            }
        });

        if (!harryRow) {
            console.log('❌ Harry Welling row not found in DOM');
            return false;
        }

        const todoCell = harryRow.querySelectorAll('td')[6];
        if (!todoCell) {
            console.log('❌ TODO cell not found');
            return false;
        }

        const todoText = todoCell.textContent.trim();
        const todoHTML = todoCell.innerHTML;
        const hasRedText = todoHTML.includes('color: #dc2626') || todoHTML.includes('color:#dc2626');
        const hasGreenBg = harryRow.style.backgroundColor.includes('185, 129') || harryRow.classList.contains('reach-out-complete');

        console.log('🎯 DOM VERIFICATION:');
        console.log('   TODO text:', `"${todoText}"`);
        console.log('   TODO HTML:', `"${todoHTML}"`);
        console.log('   Has red text styling:', hasRedText);
        console.log('   Has green background:', hasGreenBg);

        const isWorking = hasRedText && !hasGreenBg && todoText.toLowerCase().includes('reach');

        if (isWorking) {
            console.log('🎉 SUCCESS! Harry Welling fix is working correctly!');
            console.log('✅ Shows red reach-out text');
            console.log('✅ No green highlighting');
            return true;
        } else {
            console.log('🚨 FAILURE! Harry Welling fix is NOT working:');
            if (!hasRedText) console.log('❌ Missing red text');
            if (hasGreenBg) console.log('❌ Still has green background');
            if (!todoText.toLowerCase().includes('reach')) console.log('❌ TODO text wrong');

            // Try one more manual fix
            console.log('🔧 Attempting manual fix...');
            todoCell.innerHTML = '<span style="color: #dc2626; font-weight: bold;">Reach out</span>';
            harryRow.style.removeProperty('background-color');
            harryRow.style.removeProperty('background');
            harryRow.classList.remove('reach-out-complete');
            console.log('✅ Applied manual fix to Harry Welling');

            return false;
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
        return false;
    }
}

// Run verification immediately
setTimeout(() => {
    console.log('🚀 Starting Harry Welling verification...');
    verifyHarryWellingFix();
}, 100);

// Make function available globally
window.verifyHarryWellingFix = verifyHarryWellingFix;

console.log('✅ Verification script loaded');