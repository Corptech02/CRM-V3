// Fix COI Gmail Overlay - Force Refresh
console.log('🔧 Fixing COI Gmail overlay...');

(function() {
    // Clear any cached email provider state
    localStorage.removeItem('coi_email_provider_cache');

    // Force Gmail as provider
    localStorage.setItem('coi_email_provider', 'GMAIL');

    // Override the loadRealEmails function to ensure it works
    const originalLoadRealEmails = window.loadRealEmails;

    window.loadRealEmails = async function() {
        console.log('📧 Force reloading emails (Gmail authenticated)...');

        // Call original function
        if (originalLoadRealEmails) {
            return await originalLoadRealEmails.call(this);
        }
    };

    // Force reload COI emails after a short delay
    setTimeout(() => {
        console.log('🔄 Force refreshing COI inbox...');
        if (window.loadRealEmails) {
            window.loadRealEmails();
        }
    }, 1000);

    // Also try to directly load emails if the function exists
    if (window.loadCOIEmails) {
        setTimeout(() => {
            console.log('🔄 Loading COI emails directly...');
            window.loadCOIEmails();
        }, 1500);
    }
})();

console.log('✅ COI Gmail overlay fix applied - refresh the page to see changes');