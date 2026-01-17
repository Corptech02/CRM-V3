// EMERGENCY: Clear all localStorage and force reload to stop Unknown Company multiplication
console.log('🚨 EMERGENCY CACHE CLEAR - Removing all localStorage data');

// Clear ALL localStorage data
localStorage.clear();
sessionStorage.clear();

console.log('✅ All cached data cleared');
console.log('🔄 Force reloading page...');

// Force reload the page
window.location.reload(true);