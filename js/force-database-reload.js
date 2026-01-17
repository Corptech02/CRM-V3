// Force reload leads from database to get updated call logs
console.log('🔄 Force reloading leads from database...');

if (window.loadLeadsFromDatabase) {
    window.loadLeadsFromDatabase().then(() => {
        console.log('✅ Leads reloaded from database');

        // If we're on the leads page, refresh the view
        if (window.location.hash === '#leads' && window.loadLeadsView) {
            window.loadLeadsView();
        }
    });
} else {
    console.log('❌ loadLeadsFromDatabase function not available');
}