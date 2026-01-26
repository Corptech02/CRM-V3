// Simple Auto Refresh - Just wait 5 seconds and call loadLeadsView()
console.log('🔄 SIMPLE AUTO REFRESH: Script loaded');

// Wait 5 seconds after page load, then trigger refresh
setTimeout(() => {
    console.log('🔄 SIMPLE AUTO REFRESH: 5 seconds passed, triggering refresh...');

    if (window.loadLeadsView && typeof window.loadLeadsView === 'function') {
        console.log('🔄 SIMPLE AUTO REFRESH: Calling window.loadLeadsView()...');
        window.loadLeadsView();
        console.log('✅ SIMPLE AUTO REFRESH: loadLeadsView() called');
    } else {
        console.log('❌ SIMPLE AUTO REFRESH: window.loadLeadsView not available');
    }
}, 5000);

console.log('✅ SIMPLE AUTO REFRESH: Timer set for 5 seconds');