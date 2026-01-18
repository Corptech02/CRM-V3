// Fix ViciDial leads being filtered out as "deleted" after import
(function() {
    'use strict';

    console.log('🔧 ViciDial deleted filter fix loading...');

    // Function to clear ViciDial leads from deleted list
    function clearViciDialFromDeletedList() {
        const deletedLeads = JSON.parse(localStorage.getItem('deletedLeadIds') || '[]');
        const originalCount = deletedLeads.length;

        // ViciDial leads typically have IDs in the 131000-135000 range
        const filteredDeleted = deletedLeads.filter(id => {
            const num = parseInt(id);
            return num < 131000 || num > 135000;
        });

        localStorage.setItem('deletedLeadIds', JSON.stringify(filteredDeleted));

        const cleared = originalCount - filteredDeleted.length;
        if (cleared > 0) {
            console.log(`🧹 Cleared ${cleared} ViciDial leads from deleted list`);
        }

        return cleared;
    }

    // Clear on page load
    window.addEventListener('DOMContentLoaded', () => {
        clearViciDialFromDeletedList();
    });

    // Also clear immediately if DOM is already loaded
    if (document.readyState === 'loading') {
        // DOM hasn't loaded yet
    } else {
        clearViciDialFromDeletedList();
    }

    // Expose function globally for manual use
    window.clearViciDialFromDeletedList = clearViciDialFromDeletedList;

    console.log('✅ ViciDial deleted filter fix loaded');
})();