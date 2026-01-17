// Debug script to identify why "Total To Do Tasks" shows 2 when all leads appear to have no tasks
console.log('🔍 Debugging To Do Tasks Count...');

// Get current user - SAME METHOD AS THE MAIN CODE
const userData = sessionStorage.getItem('vanguard_user');
let currentUser = '';
if (userData) {
    const user = JSON.parse(userData);
    currentUser = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
}
console.log('Current user:', currentUser);

// Get leads from localStorage
const leads = JSON.parse(localStorage.getItem('leads') || '[]');
console.log('Total leads in system:', leads.length);
console.log('All leads:', leads);

// Filter leads assigned to current user and not closed
const userLeads = leads.filter(lead => lead.assignedTo === currentUser && lead.stage !== 'closed');
console.log(`Leads assigned to ${currentUser} (not closed):`, userLeads.length);

// Analyze each lead for To Do status
let todoCount = 0;
const actionMap = {
    'new': 'Assign Stage',
    'contact_attempted': 'Reach out',
    'info_requested': 'Reach out to lead',
    'info_received': 'Prepare Quote',
    'loss_runs_requested': 'Reach out to lead',
    'loss_runs_received': 'Prepare app.',
    'app_prepared': 'Send application',
    'app_sent': '',
    'quoted': 'Email Quote, and make contact',
    'quote_sent': 'Reach out to lead',
    'quote-sent-unaware': 'Reach out to lead',
    'quote-sent-aware': 'Reach out',
    'sale': 'Process sale',
    'not-interested': 'Archive lead'
};

userLeads.forEach((lead, index) => {
    console.log(`\n--- LEAD ${index + 1}: ${lead.name} ---`);
    console.log('Stage:', lead.stage);
    console.log('Assigned To:', lead.assignedTo);

    const stage = lead.stage || 'new';
    const todoAction = actionMap.hasOwnProperty(stage) ? actionMap[stage] : 'Review lead';
    console.log('Base To Do Action:', todoAction);

    // Check if reach out is complete
    let isToDoEmpty = false;
    if (lead.reachOut && (stage === 'quoted' || stage === 'info_requested' || stage === 'contact_attempted' ||
        stage === 'loss_runs_requested' || stage === 'app_sent' || stage === 'quote_sent' || stage === 'sale')) {
        const ro = lead.reachOut;
        console.log('Reach Out data:', ro);

        // Reach out complete if: 1) Lead answered call (completedAt exists), or 2) All methods tried
        if (ro.completedAt || ro.callsConnected > 0 || (ro.callAttempts > 0 && ro.emailCount > 0 && ro.textCount > 0)) {
            isToDoEmpty = true;
            console.log('✅ Reach out is COMPLETE - To Do is empty');
        } else {
            console.log('❌ Reach out is NOT complete');
        }
    } else {
        console.log('No reach out data or not applicable for this stage');
    }

    // Determine if this lead contributes to To Do count
    if (!isToDoEmpty && todoAction) {
        todoCount++;
        console.log(`🔴 COUNTS AS TO DO: "${todoAction}"`);
    } else {
        console.log(`🟢 NO TO DO (empty: ${isToDoEmpty}, action: "${todoAction}")`);
    }
});

console.log(`\n📊 FINAL TO DO COUNT: ${todoCount}`);
console.log(`Expected in dashboard: ${todoCount}`);

// Also check for any stale data in other storage keys
console.log('\n🔍 Checking for other potential data sources...');
const storageKeys = [];
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('lead') || key.includes('task') || key.includes('todo'))) {
        storageKeys.push(key);
        try {
            const data = JSON.parse(localStorage.getItem(key));
            console.log(`${key}:`, data);
        } catch (e) {
            console.log(`${key}: (non-JSON)`, localStorage.getItem(key));
        }
    }
}

if (storageKeys.length === 0) {
    console.log('No lead/task/todo related keys found in localStorage besides "leads"');
}