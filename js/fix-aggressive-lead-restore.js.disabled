// Fix Aggressive Lead Restore - Stop archived leads from being restored
console.log('🛑 Fixing aggressive lead restore from Vicidial backup...');

(function() {
    // Clear any existing intervals that might be restoring leads
    const originalSetInterval = window.setInterval;
    const intervalIds = [];

    // Track all intervals
    window.setInterval = function(callback, delay) {
        const id = originalSetInterval.call(this, callback, delay);
        intervalIds.push(id);

        // If this is the 5-second Vicidial protection interval, clear it
        if (delay === 5000 && callback.toString().includes('VICIDIAL_BACKUP_KEY')) {
            console.log('🚫 Blocked 5-second Vicidial restore interval');
            clearInterval(id);
            return id;
        }

        return id;
    };

    // Clear all existing short intervals (less than 10 seconds)
    setTimeout(() => {
        console.log('🧹 Clearing aggressive sync intervals...');

        // Try to clear intervals by ID range (usually sequential)
        for (let i = 1; i < 1000; i++) {
            try {
                const testFunc = () => {};
                const testId = originalSetInterval(testFunc, 999999);
                clearInterval(testId);

                // Clear any interval that might be syncing
                if (i < testId) {
                    clearInterval(i);
                }
            } catch (e) {
                // Ignore errors
            }
        }
    }, 1000);

    // Override the localStorage getItem to filter out archived leads from any restore
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) {
        const value = originalGetItem.call(this, key);

        // If getting leads data, filter out archived ones
        if (key === 'insurance_leads' || key === 'leads') {
            try {
                const data = JSON.parse(value || '[]');
                const permanentArchive = JSON.parse(originalGetItem.call(this, 'permanentArchive') || '[]');
                const archivedLeads = JSON.parse(originalGetItem.call(this, 'archivedLeads') || '[]');

                const archivedIds = new Set([
                    ...permanentArchive.map(id => String(id)),
                    ...archivedLeads.map(l => String(l.id))
                ]);

                // Filter out archived leads
                const filtered = data.filter(lead => {
                    const leadId = String(lead.id);
                    if (archivedIds.has(leadId)) {
                        console.log(`🚫 Blocking archived lead from restore: ${lead.name} (${leadId})`);
                        return false;
                    }
                    return !lead.archived;
                });

                if (filtered.length !== data.length) {
                    console.log(`♻️ Filtered ${data.length - filtered.length} archived leads from ${key}`);
                    return JSON.stringify(filtered);
                }
            } catch (e) {
                // Return original if parsing fails
            }
        }

        return value;
    };

    // Override the Vicidial protection restore function if it exists
    if (window.VicidialProtection) {
        console.log('🔧 Overriding VicidialProtection.restoreLeads...');
        const originalRestore = window.VicidialProtection.restoreLeads;

        window.VicidialProtection.restoreLeads = function() {
            console.log('🛡️ Vicidial restore intercepted - checking for archived leads');

            const permanentArchive = JSON.parse(localStorage.getItem('permanentArchive') || '[]');
            const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
            const archivedIds = new Set([
                ...permanentArchive.map(id => String(id)),
                ...archivedLeads.map(l => String(l.id))
            ]);

            // Get the backup
            const backup = JSON.parse(localStorage.getItem('VICIDIAL_BACKUP_20240318') || '[]');

            // Filter out archived leads from backup before restore
            const filteredBackup = backup.filter(lead => {
                const leadId = String(lead.id);
                return !archivedIds.has(leadId) && !lead.archived;
            });

            // Temporarily replace the backup
            localStorage.setItem('VICIDIAL_BACKUP_20240318', JSON.stringify(filteredBackup));

            // Call original restore
            const result = originalRestore.call(this);

            // Restore full backup (in case needed for other purposes)
            localStorage.setItem('VICIDIAL_BACKUP_20240318', JSON.stringify(backup));

            return result;
        };
    }

    // Create a more aggressive archive enforcement
    let archiveEnforcementInterval;

    function enforceArchiveStatus() {
        const permanentArchive = JSON.parse(localStorage.getItem('permanentArchive') || '[]');
        const archivedLeads = JSON.parse(localStorage.getItem('archivedLeads') || '[]');
        const archivedIds = new Set([
            ...permanentArchive.map(id => String(id)),
            ...archivedLeads.map(l => String(l.id))
        ]);

        // Check current leads
        const currentLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        let modified = false;

        const filteredLeads = currentLeads.filter(lead => {
            const leadId = String(lead.id);
            if (archivedIds.has(leadId) || lead.archived) {
                console.log(`🗑️ Removing restored archived lead: ${lead.name} (${leadId})`);
                modified = true;
                return false;
            }
            return true;
        });

        if (modified) {
            localStorage.setItem('insurance_leads', JSON.stringify(filteredLeads));
            console.log(`✅ Enforced archive status - removed ${currentLeads.length - filteredLeads.length} archived leads`);

            // Reload view if on leads page
            if (window.location.hash === '#leads' && typeof loadLeadsView === 'function') {
                loadLeadsView();
            }
        }
    }

    // Run enforcement every 2 seconds for the first 30 seconds after archive
    window.startArchiveEnforcement = function() {
        console.log('🔒 Starting aggressive archive enforcement...');

        // Clear any existing enforcement
        if (archiveEnforcementInterval) {
            clearInterval(archiveEnforcementInterval);
        }

        // Run every 2 seconds
        archiveEnforcementInterval = setInterval(enforceArchiveStatus, 2000);

        // Stop after 30 seconds
        setTimeout(() => {
            clearInterval(archiveEnforcementInterval);
            console.log('🔓 Archive enforcement period ended');
        }, 30000);
    };

    // Hook into archive function to start enforcement
    const originalArchive = window.archiveLead;
    window.archiveLead = function(leadId) {
        console.log('🗄️ Archive with enforcement triggered');

        // Call original
        if (originalArchive) {
            originalArchive.call(this, leadId);
        }

        // Start enforcement
        window.startArchiveEnforcement();
    };

    // Run initial enforcement
    enforceArchiveStatus();

    console.log('✅ Aggressive lead restore fix applied');
    console.log('📝 Archive enforcement will prevent leads from reappearing');
})();