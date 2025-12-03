// Fix lead stage update issue
console.log('Fixing lead stage update...');

(function() {
    // Store the existing function (might be wrapped by persistence)
    const existingUpdateLeadStage = window.updateLeadStage;
    
    // Override updateLeadStage to work properly
    window.updateLeadStage = function(leadId, newStage) {
        console.log('Updating lead stage:', leadId, 'to', newStage);
        
        // Get leads from localStorage (correct key is 'insurance_leads')
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        
        // Find the lead - try multiple matching strategies
        let leadFound = false;
        for (let i = 0; i < leads.length; i++) {
            if (String(leads[i].id) === String(leadId)) {
                console.log('Found lead, updating stage from', leads[i].stage, 'to', newStage);
                leads[i].stage = newStage;
                leadFound = true;
                break;
            }
        }
        
        if (!leadFound) {
            console.error('Lead not found for stage update:', leadId);
            console.log('Available lead IDs:', leads.map(l => l.id));
            showNotification('Lead not found', 'error');
            return;
        }
        
        // Save back to localStorage using the original setItem to avoid issues
        const originalSetItem = localStorage.setItem.bind(localStorage);
        originalSetItem('insurance_leads', JSON.stringify(leads));

        // Also update the tracker if it exists
        const tracker = JSON.parse(localStorage.getItem('leadStatusTracker') || '{}');
        if (!tracker.modified) tracker.modified = {};
        if (!tracker.modified[String(leadId)]) tracker.modified[String(leadId)] = {};
        tracker.modified[String(leadId)].stage = newStage;
        originalSetItem('leadStatusTracker', JSON.stringify(tracker));

        // Persist to backend database with retry logic
        const updateDatabase = async (retryCount = 0) => {
            try {
                const response = await fetch('http://localhost:5001/api/update_lead', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        lead_id: leadId,
                        updates: { stage: newStage }
                    })
                });

                if (!response.ok && retryCount < 2) {
                    console.log('Retrying API call, attempt:', retryCount + 2);
                    setTimeout(() => updateDatabase(retryCount + 1), 1000);
                    return;
                }

                const data = await response.json();
                if (data.success) {
                    console.log('Lead stage persisted to database');
                    // Show success message
                    if (window.showNotification) {
                        showNotification('Lead stage updated to: ' + newStage, 'success');
                    }
                    // Refresh the view after successful save
                    setTimeout(() => {
                        if (window.loadLeadsView) {
                            window.loadLeadsView();
                        }
                    }, 500);
                } else {
                    console.error('Failed to persist stage:', data.error);
                    if (window.showNotification) {
                        showNotification('Stage updated locally', 'warning');
                    }
                }
            } catch (error) {
                console.error('Error updating lead stage:', error);
                if (retryCount < 2) {
                    console.log('Connection failed, retrying in 1 second...');
                    setTimeout(() => updateDatabase(retryCount + 1), 1000);
                } else {
                    // Even if database update fails, local update succeeded
                    if (window.showNotification) {
                        showNotification('Stage updated locally (server sync pending)', 'warning');
                    }
                }
            }
        };

        updateDatabase();

        // Don't refresh immediately - wait for API response
        // The view will be refreshed after successful save
        
        console.log('Stage update complete');
    };
    
    // Also fix updateLeadStatus
    window.updateLeadStatus = function(leadId, newStatus) {
        console.log('Updating lead status:', leadId, 'to', newStatus);
        
        // Get leads from localStorage (correct key is 'insurance_leads')
        let leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
        
        // Find the lead
        let leadFound = false;
        for (let i = 0; i < leads.length; i++) {
            if (String(leads[i].id) === String(leadId)) {
                console.log('Found lead, updating status from', leads[i].status, 'to', newStatus);
                leads[i].status = newStatus;
                leadFound = true;
                break;
            }
        }
        
        if (!leadFound) {
            console.error('Lead not found for status update:', leadId);
            showNotification('Lead not found', 'error');
            return;
        }
        
        // Save back to localStorage
        const originalSetItem = localStorage.setItem.bind(localStorage);
        originalSetItem('leads', JSON.stringify(leads));
        
        // Update tracker
        const tracker = JSON.parse(localStorage.getItem('leadStatusTracker') || '{}');
        if (!tracker.modified) tracker.modified = {};
        if (!tracker.modified[String(leadId)]) tracker.modified[String(leadId)] = {};
        tracker.modified[String(leadId)].status = newStatus;
        originalSetItem('leadStatusTracker', JSON.stringify(tracker));
        
        // Show success message
        if (window.showNotification) {
            showNotification('Lead status updated to: ' + newStatus, 'success');
        }
        
        // Refresh the view
        // DISABLED to prevent duplicate tables
        // setTimeout(() => {
        //     if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
        //         if (window.loadLeadsView) {
        //             window.loadLeadsView();
        //         }
        //     }
        // }, 500);
    };
    
    // Fix updateLeadPriority
    window.updateLeadPriority = function(leadId, newPriority) {
        console.log('Updating lead priority:', leadId, 'to', newPriority);
        
        let leads = JSON.parse(localStorage.getItem('leads') || '[]');
        
        let leadFound = false;
        for (let i = 0; i < leads.length; i++) {
            if (String(leads[i].id) === String(leadId)) {
                leads[i].priority = newPriority;
                leadFound = true;
                break;
            }
        }
        
        if (!leadFound) {
            console.error('Lead not found for priority update:', leadId);
            showNotification('Lead not found', 'error');
            return;
        }
        
        const originalSetItem = localStorage.setItem.bind(localStorage);
        originalSetItem('leads', JSON.stringify(leads));
        
        const tracker = JSON.parse(localStorage.getItem('leadStatusTracker') || '{}');
        if (!tracker.modified) tracker.modified = {};
        if (!tracker.modified[String(leadId)]) tracker.modified[String(leadId)] = {};
        tracker.modified[String(leadId)].priority = newPriority;
        originalSetItem('leadStatusTracker', JSON.stringify(tracker));
        
        if (window.showNotification) {
            showNotification('Lead priority updated to: ' + newPriority, 'success');
        }
    };
    
    // Fix updateLeadScore
    window.updateLeadScore = function(leadId, newScore) {
        console.log('Updating lead score:', leadId, 'to', newScore);
        
        let leads = JSON.parse(localStorage.getItem('leads') || '[]');
        
        let leadFound = false;
        for (let i = 0; i < leads.length; i++) {
            if (String(leads[i].id) === String(leadId)) {
                leads[i].leadScore = parseInt(newScore);
                leadFound = true;
                break;
            }
        }
        
        if (!leadFound) {
            console.error('Lead not found for score update:', leadId);
            showNotification('Lead not found', 'error');
            return;
        }
        
        const originalSetItem = localStorage.setItem.bind(localStorage);
        originalSetItem('leads', JSON.stringify(leads));
        
        const tracker = JSON.parse(localStorage.getItem('leadStatusTracker') || '{}');
        if (!tracker.modified) tracker.modified = {};
        if (!tracker.modified[String(leadId)]) tracker.modified[String(leadId)] = {};
        tracker.modified[String(leadId)].leadScore = parseInt(newScore);
        originalSetItem('leadStatusTracker', JSON.stringify(tracker));
        
        if (window.showNotification) {
            showNotification('Lead score updated to: ' + newScore + '%', 'success');
        }
        
        // Refresh if on leads page
        // DISABLED to prevent duplicate tables
        // setTimeout(() => {
        //     if (window.location.hash === '#leads' || window.location.hash === '#leads-management') {
        //         if (window.loadLeadsView) {
        //             window.loadLeadsView();
        //         }
        //     }
        // }, 500);
    };
    
    console.log('Lead stage/status update functions fixed');
})();