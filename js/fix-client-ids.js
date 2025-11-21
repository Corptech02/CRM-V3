// Fix Client IDs - Clears and reimports clients with proper IDs
(function() {
    console.log('🔧 Fixing client IDs to prevent JavaScript errors...');
    
    // Clear existing clients to reimport with correct IDs
    window.fixClientIds = function() {
        console.log('Clearing existing clients with problematic IDs...');
        localStorage.removeItem('insurance_clients');
        
        console.log('Clients cleared. The bulk import will now reimport them with correct IDs.');
        
        // Force the bulk import to run again with the fixed IDs
        if (window.bulkImportClients) {
            console.log('Re-importing clients with fixed IDs...');
            const result = window.bulkImportClients();
            console.log('Import complete:', result);
            
            // Reload the view if on clients page
            if (window.location.hash === '#clients') {
                if (window.loadClientsView) {
                    window.loadClientsView();
                }
            }
            
            return result;
        }
    };
    
    // Auto-fix on page load
    document.addEventListener('DOMContentLoaded', function() {
        // Check if we have clients with problematic IDs
        const clients = JSON.parse(localStorage.getItem('insurance_clients') || '[]');
        const hasProblematicIds = clients.some(c => c.id && c.id.includes('1757692118'));
        
        if (hasProblematicIds) {
            console.log('⚠️ Found clients with problematic IDs. Fixing...');
            setTimeout(() => {
                window.fixClientIds();
            }, 2000); // Wait for bulk import script to load
        }
    });
    
    console.log('✅ Client ID fixer loaded');
    console.log('   Run fixClientIds() to manually fix client IDs');
})();