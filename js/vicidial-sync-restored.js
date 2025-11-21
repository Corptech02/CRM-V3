// Vicidial Sync - Restored Functionality
// Syncs all sales leads from Vicidial and organizes them in the leads tab

console.log('🔄 Vicidial sync functionality restored');

// Main sync function
window.syncVicidialLeads = async function() {
    console.log('📞 Starting Vicidial sync...');

    // Show loading notification
    const notification = document.createElement('div');
    notification.id = 'vicidial-sync-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 100000;
        display: flex;
        align-items: center;
        gap: 15px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        animation: slideIn 0.3s ease;
    `;

    notification.innerHTML = `
        <div style="
            width: 24px;
            height: 24px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        "></div>
        <div>
            <h4 style="margin: 0 0 5px 0; font-size: 16px;">Connecting to Vicidial...</h4>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Server: 204.13.233.29</p>
        </div>
    `;

    // Add CSS animations
    if (!document.querySelector('#vicidial-sync-styles')) {
        const style = document.createElement('style');
        style.id = 'vicidial-sync-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    try {
        // Call the backend API to sync with Vicidial
        // Use the correct URL based on how the page was accessed
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001/api/vicidial/sync-sales'
            : `http://${window.location.hostname}:3001/api/vicidial/sync-sales`;

        console.log('Calling Vicidial sync API at:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            // Check if sync started successfully
            if (result.syncId) {
                // Update notification to show polling
                notification.innerHTML = `
                    <div style="
                        width: 24px;
                        height: 24px;
                        border: 3px solid rgba(255,255,255,0.3);
                        border-top: 3px solid white;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    "></div>
                    <div>
                        <h4 style="margin: 0 0 5px 0; font-size: 16px;">Syncing real leads...</h4>
                        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Getting data from Vicibox</p>
                    </div>
                `;

                // Poll for completion
                await pollForCompletion(notification);
                return;
            }
        }

        // Handle old format for backwards compatibility
        if (result.success && result.leads) {
            console.log(`✅ Synced ${result.leads.length} sales leads from Vicidial`);

            // Get existing leads from localStorage
            let existingLeads = [];
            try {
                existingLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
            } catch (e) {
                existingLeads = [];
            }

            // Add new leads, avoiding duplicates
            const existingIds = new Set(existingLeads.map(l => l.id));
            const newLeads = result.leads.filter(lead => !existingIds.has(lead.id));

            if (newLeads.length > 0) {
                // Add new leads to the beginning
                const updatedLeads = [...newLeads, ...existingLeads];

                // Save to localStorage
                localStorage.setItem('insurance_leads', JSON.stringify(updatedLeads));
                localStorage.setItem('leads', JSON.stringify(updatedLeads)); // Also save to alternate key

                // Update notification with success
                notification.innerHTML = `
                    <div style="
                        width: 24px;
                        height: 24px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">✓</div>
                    <div>
                        <h4 style="margin: 0 0 5px 0; font-size: 16px;">Sync Complete!</h4>
                        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Added ${newLeads.length} new sales from Vicidial</p>
                    </div>
                `;

                notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

                // Show the leads that were added
                if (newLeads.length > 0) {
                    const leadsList = document.createElement('div');
                    leadsList.style.cssText = `
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px solid rgba(255,255,255,0.2);
                    `;
                    leadsList.innerHTML = `
                        <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">New Sales:</div>
                        ${newLeads.slice(0, 3).map(lead => `
                            <div style="font-size: 13px; margin: 2px 0;">• ${lead.name} - $${(lead.premium || 0).toLocaleString()}</div>
                        `).join('')}
                        ${newLeads.length > 3 ? `<div style="font-size: 12px; opacity: 0.7; margin-top: 5px;">...and ${newLeads.length - 3} more</div>` : ''}
                    `;
                    notification.querySelector('div:last-child').appendChild(leadsList);
                }

                // Refresh the leads view if function exists
                if (typeof window.loadLeadsView === 'function') {
                    window.loadLeadsView();
                }
            } else {
                // No new leads
                notification.innerHTML = `
                    <div style="
                        width: 24px;
                        height: 24px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">✓</div>
                    <div>
                        <h4 style="margin: 0 0 5px 0; font-size: 16px;">Already Synced</h4>
                        <p style="margin: 0; font-size: 14px; opacity: 0.9;">All Vicidial sales are up to date</p>
                    </div>
                `;

                notification.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
            }

        } else {
            throw new Error('No leads data in response');
        }

    } catch (error) {
        console.error('Vicidial sync error:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });

        // Show detailed error notification
        const errorMessage = error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')
            ? 'Network connection error - check if backend is running'
            : error.message.includes('CORS')
            ? 'CORS error - cross-origin request blocked'
            : error.message || 'Unknown error';

        notification.innerHTML = `
            <div style="
                width: 24px;
                height: 24px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            ">⚠</div>
            <div>
                <h4 style="margin: 0 0 5px 0; font-size: 16px;">Connection Failed</h4>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">${errorMessage}</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">API: ${apiUrl}</p>
            </div>
        `;

        notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

        // Try to load some sample data as fallback
        console.log('Loading sample Vicidial data as fallback...');
        // Fallback implementation could go here
    }

    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
};

// Poll for sync completion
async function pollForCompletion(notification) {
    const pollInterval = setInterval(async () => {
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3001/api/vicidial/sync-status'
                : `http://${window.location.hostname}:3001/api/vicidial/sync-status`;

            const statusResponse = await fetch(apiUrl);

            if (statusResponse.ok) {
                const statusResult = await statusResponse.json();
                const status = statusResult.status;

                if (status.status === 'running') {
                    // Update notification with progress
                    const percentage = status.percentage || 0;
                    notification.innerHTML = `
                        <div style="
                            width: 24px;
                            height: 24px;
                            border: 3px solid rgba(255,255,255,0.3);
                            border-top: 3px solid white;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                        "></div>
                        <div>
                            <h4 style="margin: 0 0 5px 0; font-size: 16px;">Syncing ${percentage}%</h4>
                            <p style="margin: 0; font-size: 14px; opacity: 0.9;">${status.message}</p>
                        </div>
                    `;
                } else if (status.status === 'completed') {
                    clearInterval(pollInterval);

                    const leadsFound = status.leadsFound || 0;

                    if (leadsFound > 0) {
                        // Get the leads from the API and store them
                        const leadsUrl = window.location.hostname === 'localhost'
                            ? 'http://localhost:3001/api/vicidial/leads'
                            : `http://${window.location.hostname}:3001/api/vicidial/leads`;

                        try {
                            const leadsResponse = await fetch(leadsUrl);
                            const leadsResult = await leadsResponse.json();

                            if (leadsResult.success && leadsResult.leads) {
                                // Store leads in localStorage
                                let existingLeads = [];
                                try {
                                    existingLeads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                                } catch (e) {
                                    existingLeads = [];
                                }

                                // Add new leads, avoiding duplicates
                                const existingIds = new Set(existingLeads.map(l => l.id));
                                const newLeads = leadsResult.leads.filter(lead => !existingIds.has(lead.id));

                                if (newLeads.length > 0) {
                                    const updatedLeads = [...newLeads, ...existingLeads];
                                    localStorage.setItem('insurance_leads', JSON.stringify(updatedLeads));
                                    localStorage.setItem('leads', JSON.stringify(updatedLeads));

                                    // Trigger refresh of leads view
                                    if (window.loadLeadsView) {
                                        window.loadLeadsView();
                                    }
                                    if (window.DataSync && window.DataSync.loadAllData) {
                                        window.DataSync.loadAllData();
                                    }
                                }
                            }
                        } catch (e) {
                            console.error('Error fetching leads after sync:', e);
                        }

                        // Show success notification
                        notification.innerHTML = `
                            <div style="
                                width: 24px;
                                height: 24px;
                                background: rgba(255,255,255,0.2);
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">✅</div>
                            <div>
                                <h4 style="margin: 0 0 5px 0; font-size: 16px;">Sync Complete!</h4>
                                <p style="margin: 0; font-size: 14px; opacity: 0.9;">${leadsFound} real leads imported from Vicibox</p>
                            </div>
                        `;
                        notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    } else {
                        // No leads found
                        notification.innerHTML = `
                            <div style="
                                width: 24px;
                                height: 24px;
                                background: rgba(255,255,255,0.2);
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">ℹ️</div>
                            <div>
                                <h4 style="margin: 0 0 5px 0; font-size: 16px;">No Sales Found</h4>
                                <p style="margin: 0; font-size: 14px; opacity: 0.9;">No SALE leads in active Vicibox lists</p>
                            </div>
                        `;
                        notification.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                    }

                    // Remove notification after 5 seconds
                    setTimeout(() => {
                        notification.style.animation = 'slideOut 0.3s ease';
                        setTimeout(() => notification.remove(), 300);
                    }, 5000);

                } else if (status.status === 'error') {
                    clearInterval(pollInterval);

                    // Show error notification
                    notification.innerHTML = `
                        <div style="
                            width: 24px;
                            height: 24px;
                            background: rgba(255,255,255,0.2);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">❌</div>
                        <div>
                            <h4 style="margin: 0 0 5px 0; font-size: 16px;">Sync Failed</h4>
                            <p style="margin: 0; font-size: 14px; opacity: 0.9;">${status.error || status.message}</p>
                        </div>
                    `;
                    notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

                    setTimeout(() => {
                        notification.style.animation = 'slideOut 0.3s ease';
                        setTimeout(() => notification.remove(), 300);
                    }, 5000);
                }
            }
        } catch (error) {
            console.error('Status polling error:', error);
        }
    }, 1000);

    // Safety timeout
    setTimeout(() => {
        clearInterval(pollInterval);
    }, 300000);
}

// Ensure the button exists and is properly connected
function ensureSyncButton() {
    // Look for the sync button
    const existingButton = document.querySelector('button[onclick*="syncVicidialLeads"]');
    if (existingButton) {
        console.log('✅ Sync button found and connected');
        return;
    }

    // If no button exists, wait for the leads view to load
    const observer = new MutationObserver((mutations) => {
        const headerActions = document.querySelector('.header-actions');
        if (headerActions && !document.querySelector('button[onclick*="syncVicidialLeads"]')) {
            // Button might have been removed, check if we're in the leads view
            const leadsView = document.querySelector('.leads-view, #leads-section');
            if (leadsView) {
                console.log('🔧 Sync button missing, will be added by app.js');
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureSyncButton);
} else {
    ensureSyncButton();
}

console.log('✅ Vicidial sync functionality ready');
console.log('📞 Click "Sync Vicidial Now" button to import sales leads from 204.13.233.29');