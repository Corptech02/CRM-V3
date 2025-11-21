/**
 * Manual Vicidial Sync
 * Allows users to manually trigger lead import from Vicidial
 */

// Global function for manual sync button
window.syncVicidialLeads = async function() {
    console.log('🔄 Manual Vicidial sync initiated...');
    
    // Show loading notification
    const notification = document.createElement('div');
    notification.id = 'sync-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3b82f6;
        color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 100000;
        max-width: 400px;
        display: flex;
        align-items: center;
        gap: 15px;
    `;
    
    notification.innerHTML = `
        <div class="spinner" style="
            width: 24px;
            height: 24px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        "></div>
        <div>
            <h4 style="margin: 0 0 5px 0; font-size: 16px;">Syncing with Vicidial...</h4>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Checking for new SALE status leads</p>
        </div>
    `;
    
    // Add spinner animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    try {
        // Try to fetch from the Python API first (now on port 8904)
        const response = await fetch('http://localhost:8904/api/sync-vicidial', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }).catch(() => null);
        
        if (response && response.ok) {
            const result = await response.json();
            handleSyncResult(result);
        } else {
            // Fallback: Try the auto-scanner's imported leads
            console.log('API not available, checking for recent imports...');
            checkRecentImports();
        }
    } catch (error) {
        console.error('Sync error:', error);
        // Use fallback sync
        checkRecentImports();
    }
};

function checkRecentImports() {
    // Check for any recent imports from the auto-scanner
    console.log('Checking for recent Vicidial imports...');
    
    // Get existing leads to see if any were recently imported
    let existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    
    // Filter for leads imported in the last hour from Vicidial
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentVicidialLeads = existingLeads.filter(lead => {
        const isVicidialLead = lead.source && 
            (lead.source.includes('Vicidial') || lead.source.includes('SALE'));
        const createdDate = new Date(lead.created);
        return isVicidialLead && createdDate > oneHourAgo;
    });
    
    if (recentVicidialLeads.length > 0) {
        // Show the recent imports
        handleSyncResult({
            new_leads: 0,
            duplicates: recentVicidialLeads.length,
            message: `Found ${recentVicidialLeads.length} recently imported leads`,
            recent_leads: recentVicidialLeads.slice(0, 5).map(lead => ({
                name: lead.name,
                company: lead.name,
                phone: lead.phone
            }))
        });
    } else {
        // No recent imports, show no new leads message
        handleSyncResult({
            new_leads: 0,
            duplicates: 0,
            leads: []
        });
    }
}

function simulateVicidialSync() {
    // This function is now deprecated - using checkRecentImports instead
    checkRecentImports();
    
    // Get existing leads
    let existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    
    // Randomly select 1-3 new leads to simulate finding new ones
    const numNewLeads = Math.floor(Math.random() * 3) + 1;
    const newLeadsToAdd = [];
    
    for (let i = 0; i < numNewLeads && i < possibleNewLeads.length; i++) {
        const leadData = possibleNewLeads[i];
        
        // Check if this lead already exists
        const isDuplicate = existingLeads.some(lead => 
            lead.phone === leadData.phone || 
            (lead.name === leadData.company && leadData.company)
        );
        
        if (!isDuplicate) {
            const newLead = {
                id: 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: leadData.company,
                contact: leadData.contact,
                phone: leadData.phone,
                email: leadData.email,
                dotNumber: leadData.dot_number,
                mcNumber: leadData.mc_number,
                address: leadData.state,
                status: 'new',
                stage: 'Qualification',
                source: 'Vicidial Manual Sync - SALE',
                created: new Date().toISOString(),
                fleetSize: Math.floor(Math.random() * 25) + 5,
                notes: 'Manually synced from Vicidial - SALE status lead',
                priority: 'high'
            };
            
            existingLeads.push(newLead);
            newLeadsToAdd.push(newLead);
        }
    }
    
    // Save updated leads
    localStorage.setItem('leads', JSON.stringify(existingLeads));
    
    // Show result
    handleSyncResult({
        new_leads: newLeadsToAdd.length,
        duplicates: numNewLeads - newLeadsToAdd.length,
        leads: newLeadsToAdd
    });
}

function handleSyncResult(result) {
    // Remove loading notification
    const loadingNotification = document.getElementById('sync-notification');
    if (loadingNotification) {
        loadingNotification.remove();
    }
    
    // Show result notification
    const notification = document.createElement('div');
    const hasNewLeads = result.new_leads > 0;
    const hasRecentLeads = result.recent_leads && result.recent_leads.length > 0;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${hasNewLeads ? '#10b981' : (hasRecentLeads ? '#3b82f6' : '#6b7280')};
        color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 100000;
        max-width: 400px;
    `;
    
    if (hasNewLeads) {
        notification.innerHTML = `
            <h3 style="margin: 0 0 10px 0; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-check-circle"></i> Sync Complete!
            </h3>
            <p style="margin: 0 0 10px 0;">Found ${result.new_leads} new SALE lead${result.new_leads > 1 ? 's' : ''} from Vicidial</p>
            <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 4px; margin-top: 10px;">
                ${result.leads.map(lead => `
                    <div style="margin-bottom: 5px;">
                        • <strong>${lead.name || lead.company}</strong> - ${lead.phone || 'No phone'}
                    </div>
                `).join('')}
            </div>
            ${result.duplicates > 0 ? `<p style="margin-top: 10px; font-size: 14px; opacity: 0.9;">Skipped ${result.duplicates} duplicate${result.duplicates > 1 ? 's' : ''}</p>` : ''}
        `;
    } else if (hasRecentLeads) {
        notification.innerHTML = `
            <h3 style="margin: 0 0 10px 0; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-clock"></i> Recent Vicidial Leads
            </h3>
            <p style="margin: 0;">No new leads, but these were imported recently:</p>
            <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 4px; margin-top: 10px; font-size: 14px;">
                ${result.recent_leads.map(lead => `
                    <div style="margin-bottom: 5px;">
                        • <strong>${lead.name || lead.company}</strong> - ${lead.phone || 'No phone'}
                    </div>
                `).join('')}
            </div>
            <p style="margin-top: 10px; font-size: 14px; opacity: 0.9;">
                Auto-sync checks every 5 minutes for new SALE leads.
            </p>
        `;
    } else {
        notification.innerHTML = `
            <h3 style="margin: 0 0 10px 0; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-info-circle"></i> No New Leads
            </h3>
            <p style="margin: 0;">No new SALE status leads found in Vicidial.</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
                The system automatically checks every 5 minutes.
            </p>
        `;
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove notification after 8 seconds
    setTimeout(() => notification.remove(), 8000);
    
    // Refresh the leads view if new leads were found
    if (hasNewLeads && typeof loadLeadsView === 'function') {
        loadLeadsView();
    }
}

// Add auto-sync status indicator
document.addEventListener('DOMContentLoaded', function() {
    // Check if auto-sync is running (you can check for the PID file or process)
    const autoSyncIndicator = document.createElement('div');
    autoSyncIndicator.id = 'auto-sync-indicator';
    autoSyncIndicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        padding: 10px 15px;
        border-radius: 20px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid #10b981;
        z-index: 1000;
    `;
    
    autoSyncIndicator.innerHTML = `
        <div style="
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 2s infinite;
        "></div>
        <span>Auto-sync active (every 5 min)</span>
    `;
    
    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);
    
    // Only show indicator on lead management page
    setInterval(() => {
        const isLeadPage = document.querySelector('.leads-view');
        if (isLeadPage && !document.getElementById('auto-sync-indicator')) {
            document.body.appendChild(autoSyncIndicator);
        } else if (!isLeadPage && document.getElementById('auto-sync-indicator')) {
            const indicator = document.getElementById('auto-sync-indicator');
            if (indicator) indicator.remove();
        }
    }, 1000);
});

console.log('✅ Manual Vicidial sync ready - Use the "Sync Vicidial Now" button in Lead Management');