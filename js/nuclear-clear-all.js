// NUCLEAR OPTION: Clear ALL leads data completely (PRESERVE AUTH)
console.log('🚨 NUCLEAR CLEAR: Removing ALL leads data (preserving authentication)');

// PRESERVE authentication data before clearing
const authData = sessionStorage.getItem('vanguard_user');
const sessionData = sessionStorage.getItem('sessionData');
const loginTime = sessionStorage.getItem('loginTime');

// Clear ALL localStorage keys related to leads
localStorage.removeItem('insurance_leads');
localStorage.removeItem('leads');
localStorage.removeItem('DELETED_LEAD_IDS');
localStorage.removeItem('insurance_policies');
localStorage.removeItem('leadHighlighting');
localStorage.removeItem('insurance_clients');

// Clear sessionStorage but restore auth data
sessionStorage.clear();
if (authData) sessionStorage.setItem('vanguard_user', authData);
if (sessionData) sessionStorage.setItem('sessionData', sessionData);
if (loginTime) sessionStorage.setItem('loginTime', loginTime);

console.log('💥 ALL LEADS DATA NUKED! (Auth preserved)');
console.log('🔄 Reloading page...');

// Force reload
setTimeout(() => {
    window.location.reload(true);
}, 1000);