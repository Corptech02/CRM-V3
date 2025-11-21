// Ensure required functions exist for lead profile
(function() {
    'use strict';

    // Ensure showNotification exists
    if (!window.showNotification) {
        window.showNotification = function(message, type) {
            console.log(`[${type || 'info'}] ${message}`);

            // Create a simple notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                z-index: 999999;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                animation: slideIn 0.3s ease-out;
            `;
            notification.textContent = message;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        };
    }

    // Ensure getStageHtml exists
    if (!window.getStageHtml) {
        window.getStageHtml = function(stage) {
            const stageColors = {
                'new': '#3b82f6',
                'info_requested': '#fb923c',
                'info_received': '#10b981',
                'quoted': '#a855f7',
                'quote_sent': '#3b82f6',
                'interested': '#f59e0b',
                'not-interested': '#ef4444',
                'closed': '#6b7280'
            };

            const stageLabels = {
                'new': 'New',
                'info_requested': 'Info Requested',
                'info_received': 'Info Received',
                'quoted': 'Quoted',
                'quote_sent': 'Quote Sent',
                'interested': 'Interested',
                'not-interested': 'Not Interested',
                'closed': 'Closed'
            };

            const color = stageColors[stage] || '#6b7280';
            const label = stageLabels[stage] || stage || 'unknown';
            return `<span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">${label}</span>`;
        };
    }

    // Add animation styles if not present
    if (!document.getElementById('notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.innerHTML = `
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

    console.log('✅ Required functions ensured');
})();