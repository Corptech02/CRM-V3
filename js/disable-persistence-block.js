/**
 * Disable Persistence Block - Allow Vicidial imports to save
 */

(function() {
    console.log('🔓 Disabling persistence blocks for Vicidial imports...');
    
    // Clear any existing tracking that might block saves
    localStorage.removeItem('leadStatusTracker');
    
    // Override the localStorage override to allow Vicidial saves
    const originalSetItem = Object.getOwnPropertyDescriptor(Storage.prototype, 'setItem').value ||
                           Storage.prototype.setItem;
    
    localStorage.setItem = function(key, value) {
        // Always allow Vicidial lead saves
        if (key === 'leads') {
            try {
                const leads = JSON.parse(value);
                const hasVicidial = leads.some(l => l.source && l.source.includes('Vicidial'));
                
                if (hasVicidial) {
                    console.log('✅ Allowing Vicidial lead save - ' + leads.length + ' total leads');
                    // Clear tracker to prevent blocks
                    localStorage.removeItem('leadStatusTracker');
                    // Use original setItem
                    return originalSetItem.call(this, key, value);
                }
            } catch (e) {
                // If parse fails, just save normally
            }
        }
        
        // For non-Vicidial saves, use original
        return originalSetItem.call(this, key, value);
    };
    
    console.log('✅ Persistence blocks disabled for Vicidial imports');
})();