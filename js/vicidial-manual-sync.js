/**
 * ViciDial Manual Sync Button
 * Adds a sync button to manually pull leads from ViciDial
 */

// Add sync button to leads page
document.addEventListener('DOMContentLoaded', function() {
    // Wait for leads page to load
    const checkForLeadsPage = setInterval(() => {
        const leadsHeader = document.querySelector('.content-header h1');
        if (leadsHeader && leadsHeader.textContent.includes('Lead Management')) {
            clearInterval(checkForLeadsPage);
            addViciDialSyncButton();
        }
    }, 1000);
});

function addViciDialSyncButton() {
    // Find the header actions area
    const contentHeader = document.querySelector('.content-header');
    if (!contentHeader) return;

    // Check if button already exists
    if (document.getElementById('vicidial-sync-btn')) return;

    // Create sync button
    const syncButton = document.createElement('button');
    syncButton.id = 'vicidial-sync-btn';
    syncButton.className = 'btn-primary';
    syncButton.style.cssText = `
        margin-left: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    `;
    syncButton.innerHTML = `
        <i class="fas fa-sync-alt"></i>
        Sync ViciDial Sales
    `;

    // Add click handler
    syncButton.addEventListener('click', syncViciDialSales);

    // Insert button
    const headerButtons = contentHeader.querySelector('.header-actions') || contentHeader;
    if (headerButtons.tagName === 'H1') {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'header-actions';
        actionsDiv.style.cssText = 'display: inline-block; margin-left: 20px;';
        actionsDiv.appendChild(syncButton);
        headerButtons.appendChild(actionsDiv);
    } else {
        headerButtons.appendChild(syncButton);
    }
}

async function syncViciDialSales() {
    const button = document.getElementById('vicidial-sync-btn');
    if (!button) return;

    // Show loading state
    const originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        Checking ViciDial for sales...
    `;

    try {
        console.log('Starting ViciDial sync...');

        // First, check ViciDial connection
        showNotification(
            `🔍 Checking ViciDial`,
            `Connecting to ViciDial server at 204.13.233.29...`,
            'info'
        );

        // Call the backend sync endpoint
        const response = await fetch('http://localhost:3001/api/vicidial/sync-sales', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const result = await response.json();

            if (result.imported && result.imported > 0) {
                // Show success notification
                showNotification(
                    `✅ Sales Imported!`,
                    `Successfully imported ${result.imported} new sales from ViciDial`,
                    'success'
                );

                // Refresh the leads display immediately
                setTimeout(() => {
                    if (window.loadLeadsView) {
                        window.loadLeadsView();
                    }
                    // Also refresh the main data
                    if (window.DataSync) {
                        window.DataSync.loadAllData();
                    }
                }, 500);
            } else {
                // No new sales found
                showNotification(
                    `ℹ️ No New Sales`,
                    `ViciDial checked successfully but no new sales were found. Make sure leads are marked as SALE status in ViciDial.`,
                    'info'
                );
            }
        } else {
            const error = await response.json();
            showNotification(
                `⚠️ Sync Issue`,
                `Could not complete sync: ${error.error || 'Unknown error'}`,
                'warning'
            );
        }
    } catch (error) {
        console.error('Sync error:', error);
        showNotification(
            `❌ Connection Error`,
            `Could not connect to sync service. Error: ${error.message}`,
            'error'
        );
    } finally {
        // Restore button
        button.disabled = false;
        button.innerHTML = originalContent;
    }
}

async function alternativeSync() {
    // Alternative: Run Python script directly
    try {
        const response = await fetch('http://localhost:3001/api/run-sync', {
            method: 'POST'
        });

        if (response.ok) {
            showNotification(
                `✅ Sync Triggered`,
                `ViciDial sync process started. Check leads in a few seconds.`,
                'info'
            );

            // Reload leads after a delay
            setTimeout(() => {
                if (window.loadLeadsView) {
                    window.loadLeadsView();
                }
            }, 3000);
        } else {
            showNotification(
                `⚠️ Sync Issue`,
                `Could not connect to ViciDial. The sync service will retry automatically every 5 minutes.`,
                'warning'
            );
        }
    } catch (error) {
        showNotification(
            `ℹ️ Background Sync Active`,
            `ViciDial sync runs automatically every 5 minutes. New sales will appear shortly.`,
            'info'
        );
    }
}

function showNotification(title, message, type = 'info') {
    // Remove existing notifications
    const existing = document.getElementById('sync-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'sync-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 100000;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;

    notification.innerHTML = `
        <h4 style="margin: 0 0 5px 0; font-size: 16px;">${title}</h4>
        <p style="margin: 0; font-size: 14px;">${message}</p>
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        notification.style.animationFillMode = 'forwards';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Also add to window for manual testing
window.syncViciDialSales = syncViciDialSales;

console.log('ViciDial Manual Sync button initialized');