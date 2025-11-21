// Fix lead persistence - prevent converted/deleted leads from reappearing
console.log('Fixing lead persistence system...');

// Create a tracking system for lead status
(function() {
    // Store original localStorage.setItem before overriding (needs to be at the top)
    const originalSetItem = localStorage.setItem.bind(localStorage);
    
    // Flag to prevent infinite loops
    let isUpdatingLeads = false;
    
    // Initialize tracking storage if not exists
    if (!localStorage.getItem('leadStatusTracker')) {
        originalSetItem('leadStatusTracker', JSON.stringify({
            converted: [], // IDs of converted leads
            deleted: [],   // IDs of deleted leads
            modified: {}   // Modified lead data (status changes, etc.)
        }));
    }
    
    // Get the original Vicidial leads data
    const getOriginalVicidialLeads = function() {
        return [
            {
                id: '43554',
                name: 'HOGGIN DA LANES LLC',
                contact: 'DAMIEN ROBERTS',
                phone: '(216) 633-9985',
                email: 'DROBERTS@HOGGINDALANES.COM',
                product: 'Commercial Auto',
                stage: 'qualified',
                status: 'hot_lead',
                // ... rest of lead data
            },
            {
                id: '43635',
                name: 'CHARLES V MUMFORD JR',
                contact: 'Charles Mumford',
                phone: '(513) 405-9463',
                email: 'mumfordfarms@aol.com',
                product: 'Commercial Auto',
                stage: 'qualified',
                status: 'hot_lead',
                // ... rest of lead data
            },
            {
                id: '43923',
                name: 'KENN TRANSPORT LLC',
                contact: 'MELVIN KENNEDY',
                phone: '(817) 542-8635',
                email: 'DISPATCH@KENNTRANSPORT.COM',
                product: 'Commercial Auto - Fleet',
                stage: 'qualified',
                status: 'hot_lead',
                // ... rest of lead data
            }
        ];
    };
    
    // Smart lead loading function that respects conversions and deletions
    window.loadLeadsSmartly = function() {
        console.log('Smart loading leads...');
        
        const tracker = JSON.parse(localStorage.getItem('leadStatusTracker') || '{}');
        const currentLeads = JSON.parse(localStorage.getItem('leads') || '[]');
        const originalLeads = getOriginalVicidialLeads();
        
        // Build the final leads list
        const finalLeads = [];
        
        originalLeads.forEach(originalLead => {
            const leadId = String(originalLead.id);
            
            // Skip if converted or deleted
            if (tracker.converted && tracker.converted.includes(leadId)) {
                console.log(`Skipping converted lead: ${leadId}`);
                return;
            }
            if (tracker.deleted && tracker.deleted.includes(leadId)) {
                console.log(`Skipping deleted lead: ${leadId}`);
                return;
            }
            
            // Check if we have a modified version
            let leadToAdd = { ...originalLead };
            
            // Apply any modifications from tracker
            if (tracker.modified && tracker.modified[leadId]) {
                leadToAdd = { ...leadToAdd, ...tracker.modified[leadId] };
                console.log(`Applied modifications to lead ${leadId}`);
            }
            
            // Check if there's a current version with changes
            const currentVersion = currentLeads.find(l => String(l.id) === leadId);
            if (currentVersion) {
                // Preserve any changes made to the lead
                leadToAdd = { ...leadToAdd, ...currentVersion };
            }
            
            finalLeads.push(leadToAdd);
        });
        
        // Add any new leads that aren't from Vicidial (manually added)
        currentLeads.forEach(lead => {
            const leadId = String(lead.id);
            const isVicidialLead = originalLeads.some(ol => String(ol.id) === leadId);
            
            if (!isVicidialLead && !tracker.deleted?.includes(leadId)) {
                finalLeads.push(lead);
                console.log(`Keeping manually added lead: ${leadId}`);
            }
        });
        
        // Save the final leads list (using flag to prevent infinite loop)
        isUpdatingLeads = true;
        originalSetItem('leads', JSON.stringify(finalLeads));
        isUpdatingLeads = false;
        console.log(`Loaded ${finalLeads.length} leads (respecting conversions/deletions)`);
        
        return finalLeads;
    };
    
    // Override the convertLead function to track conversions
    const originalConvertLead = window.confirmConvertLead;
    window.confirmConvertLead = function(leadId) {
        console.log('Tracking lead conversion:', leadId);
        
        // Call original function
        if (originalConvertLead) {
            originalConvertLead(leadId);
        }
        
        // Track the conversion
        const tracker = JSON.parse(localStorage.getItem('leadStatusTracker') || '{}');
        if (!tracker.converted) tracker.converted = [];
        if (!tracker.converted.includes(String(leadId))) {
            tracker.converted.push(String(leadId));
            localStorage.setItem('leadStatusTracker', JSON.stringify(tracker));
            console.log('Lead conversion tracked:', leadId);
        }
    };
    
    // Override deleteLead function to track deletions - but don't duplicate the confirmation
    const originalDeleteLead = window.deleteLead;
    window.deleteLead = function(leadId) {
        console.log('Enhanced delete lead called:', leadId);
        
        // Track the deletion in our tracker
        const tracker = JSON.parse(localStorage.getItem('leadStatusTracker') || '{}');
        if (!tracker.deleted) tracker.deleted = [];
        
        const leadIdString = String(leadId);
        
        // Check if lead exists before trying to delete
        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
        const leadExists = leads.some(l => String(l.id) === leadIdString);
        
        if (!leadExists) {
            console.error('Lead not found for deletion:', leadId);
            if (window.showNotification) {
                window.showNotification('Lead not found', 'error');
            }
            return;
        }
        
        // Add to deletion tracker if not already there
        if (!tracker.deleted.includes(leadIdString)) {
            tracker.deleted.push(leadIdString);
            localStorage.setItem('leadStatusTracker', JSON.stringify(tracker));
            console.log('Lead marked for deletion in tracker:', leadIdString);
        }
        
        // Call the original delete function if it exists
        if (originalDeleteLead) {
            originalDeleteLead.call(this, leadId);
        }
    };
    
    // Override lead status/stage update functions to track changes
    const originalUpdateLeadStage = window.updateLeadStage;
    window.updateLeadStage = function(leadId, newStage) {
        console.log('Tracking stage change:', leadId, newStage);
        
        // Track the modification
        const tracker = JSON.parse(localStorage.getItem('leadStatusTracker') || '{}');
        if (!tracker.modified) tracker.modified = {};
        if (!tracker.modified[String(leadId)]) tracker.modified[String(leadId)] = {};
        tracker.modified[String(leadId)].stage = newStage;
        localStorage.setItem('leadStatusTracker', JSON.stringify(tracker));
        
        // Call original function
        if (originalUpdateLeadStage) {
            originalUpdateLeadStage(leadId, newStage);
        }
    };
    
    const originalUpdateLeadStatus = window.updateLeadStatus;
    window.updateLeadStatus = function(leadId, newStatus) {
        console.log('Tracking status change:', leadId, newStatus);
        
        // Track the modification
        const tracker = JSON.parse(localStorage.getItem('leadStatusTracker') || '{}');
        if (!tracker.modified) tracker.modified = {};
        if (!tracker.modified[String(leadId)]) tracker.modified[String(leadId)] = {};
        tracker.modified[String(leadId)].status = newStatus;
        localStorage.setItem('leadStatusTracker', JSON.stringify(tracker));
        
        // Call original function
        if (originalUpdateLeadStatus) {
            originalUpdateLeadStatus(leadId, newStatus);
        }
    };
    
    // Disable the automatic lead reloading from load-vicidial-leads.js
    localStorage.setItem = function(key, value) {
        // Debug SMS saves
        if (key === 'smsMessages' || key === 'smsContactNames') {
            console.log(`Saving ${key} with ${value ? value.length : 0} chars of data`);
        }
        
        // If we're already updating leads, just use the original function
        if (isUpdatingLeads) {
            return originalSetItem(key, value);
        }
        
        // Only intercept 'leads' key, let everything else through
        if (key === 'leads') {
            const currentLeads = localStorage.getItem('leads');
            if (currentLeads) {
                const tracker = JSON.parse(localStorage.getItem('leadStatusTracker') || '{}');
                
                // Only allow overwrite if there are no tracked changes
                if (tracker.converted?.length > 0 || tracker.deleted?.length > 0 || Object.keys(tracker.modified || {}).length > 0) {
                    console.log('Preventing lead overwrite - tracked changes exist');
                    // Don't call loadLeadsSmartly here to avoid infinite loop
                    return;
                }
            }
        }
        
        // Call original setItem for ALL cases (including smsMessages, smsContactNames, etc.)
        const result = originalSetItem(key, value);
        
        // Verify SMS saves
        if (key === 'smsMessages') {
            const saved = localStorage.getItem('smsMessages');
            console.log('SMS messages actually saved:', saved ? 'YES' : 'NO');
        }
        
        return result;
    };
    
    // Run smart load on page load
    if (localStorage.getItem('leads')) {
        loadLeadsSmartly();
    }
    
    // Add a function to reset tracking (for debugging)
    window.resetLeadTracking = function() {
        if (confirm('This will reset all lead tracking. Converted and deleted leads will reappear. Continue?')) {
            localStorage.removeItem('leadStatusTracker');
            localStorage.removeItem('leads');
            location.reload();
        }
    };
    
    console.log('Lead persistence system initialized');
    console.log('Use resetLeadTracking() to clear all tracking data');
})();