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
            const stageClasses = {
                'new': 'stage-new',
                'contact_attempted': 'stage-contact-attempted',
                'info_requested': 'stage-info-requested',
                'info_received': 'stage-info-received',
                'loss_runs_requested': 'stage-loss-runs-requested',
                'loss_runs_received': 'stage-loss-runs-received',
                'quoted': 'stage-quoted',
                'quote_sent': 'stage-quote-sent',
                'quote-sent-unaware': 'stage-quote-sent-unaware',
                'quote-sent-aware': 'stage-quote-sent-aware',
                'interested': 'stage-interested',
                'not-interested': 'stage-not-interested',
                'closed': 'stage-closed',
                'contacted': 'stage-contacted',
                'reviewed': 'stage-reviewed',
                'converted': 'stage-converted',
                'qualified': 'stage-qualified',
                'negotiation': 'stage-negotiation',
                'qualification': 'stage-qualification',
                'lead': 'stage-lead'
            };

            const stageLabels = {
                'new': 'New',
                'contact_attempted': 'Contact Attempted',
                'info_requested': 'Info Requested',
                'info_received': 'Info Received',
                'loss_runs_requested': 'Loss Runs Requested',
                'loss_runs_received': 'Loss Runs Received',
                'quoted': 'Quoted',
                'quote_sent': 'Quote Sent',
                'quote-sent-unaware': 'Quote Sent (Unaware)',
                'quote-sent-aware': 'Quote Sent (Aware)',
                'interested': 'Interested',
                'not-interested': 'Not Interested',
                'closed': 'Closed',
                'contacted': 'Contacted',
                'reviewed': 'Reviewed',
                'converted': 'Converted',
                'qualified': 'Qualified',
                'negotiation': 'Negotiation',
                'qualification': 'Qualification',
                'lead': 'Lead'
            };

            const cssClass = stageClasses[stage] || 'stage-default';
            const label = stageLabels[stage] || stage || 'unknown';
            return `<span class="stage-badge ${cssClass}">${label}</span>`;
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