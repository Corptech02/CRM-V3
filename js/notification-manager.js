/**
 * Vanguard Notification Manager
 * Handles real-time notification display and management
 */

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.badge = null;
        this.isVisible = false;
        this.checkInterval = null;
        this.init();
    }

    init() {
        console.log('🔔 Initializing Notification Manager...');
        this.createNotificationUI();
        this.startPeriodicCheck();
        this.loadNotifications();
    }

    createNotificationUI() {
        // Create notification bell icon in header
        const header = document.querySelector('header') || document.querySelector('.header') || document.body;

        // Create notification bell container
        const bellContainer = document.createElement('div');
        bellContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            cursor: pointer;
        `;

        bellContainer.innerHTML = `
            <div id="notification-bell" style="
                position: relative;
                width: 50px;
                height: 50px;
                background: #3b82f6;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 20px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
            ">
                <i class="fas fa-bell"></i>
                <div id="notification-badge" style="
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #ef4444;
                    color: white;
                    border-radius: 50%;
                    min-width: 20px;
                    height: 20px;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    line-height: 1;
                ">0</div>
            </div>
        `;

        header.appendChild(bellContainer);

        // Create notification panel
        this.container = document.createElement('div');
        this.container.id = 'notification-panel';
        this.container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            width: 400px;
            max-height: 500px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 999;
            display: none;
            overflow: hidden;
        `;

        this.container.innerHTML = `
            <div style="padding: 15px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #374151;">Notifications</h3>
                    <button id="clear-all-notifications" style="
                        background: none;
                        border: none;
                        color: #6b7280;
                        cursor: pointer;
                        font-size: 12px;
                        text-decoration: underline;
                    ">Clear All</button>
                </div>
            </div>
            <div id="notification-list" style="
                max-height: 400px;
                overflow-y: auto;
            "></div>
            <div id="no-notifications" style="
                padding: 40px 20px;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                display: none;
            ">
                <i class="fas fa-bell-slash" style="font-size: 24px; margin-bottom: 10px; opacity: 0.5;"></i>
                <div>No notifications</div>
            </div>
        `;

        document.body.appendChild(this.container);

        // Get references
        this.badge = document.getElementById('notification-badge');

        // Add event listeners
        bellContainer.addEventListener('click', () => this.togglePanel());
        document.getElementById('clear-all-notifications').addEventListener('click', () => this.clearAllNotifications());

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!bellContainer.contains(e.target) && !this.container.contains(e.target)) {
                this.hidePanel();
            }
        });

        console.log('✅ Notification UI created');
    }

    async loadNotifications() {
        try {
            const response = await fetch('/api/notifications');
            if (response.ok) {
                this.notifications = await response.json();
                this.updateUI();
                console.log(`📬 Loaded ${this.notifications.length} notifications`);
            }
        } catch (error) {
            console.warn('Failed to load notifications:', error);
        }
    }

    updateUI() {
        this.updateBadge();
        this.renderNotifications();
    }

    updateBadge() {
        const unreadCount = this.notifications.filter(n => !n.read_at && !n.dismissed_at).length;

        if (unreadCount > 0) {
            this.badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            this.badge.style.display = 'flex';

            // Add pulsing animation for critical/high priority notifications
            const hasCriticalPriority = this.notifications.some(n => n.priority === 'critical' && !n.read_at && !n.dismissed_at);
            const hasHighPriority = this.notifications.some(n => n.priority === 'high' && !n.read_at && !n.dismissed_at);
            const bell = document.getElementById('notification-bell');

            if (hasCriticalPriority) {
                bell.style.animation = 'pulse 1s infinite';
                bell.style.background = '#dc2626'; // Critical red
            } else if (hasHighPriority) {
                bell.style.animation = 'pulse 2s infinite';
                bell.style.background = '#ef4444'; // High priority red
            } else {
                bell.style.animation = 'none';
                bell.style.background = '#3b82f6'; // Default blue
            }
        } else {
            this.badge.style.display = 'none';
            const bell = document.getElementById('notification-bell');
            bell.style.animation = 'none';
            bell.style.background = '#6b7280';
        }
    }

    renderNotifications() {
        const listContainer = document.getElementById('notification-list');
        const noNotificationsDiv = document.getElementById('no-notifications');

        const activeNotifications = this.notifications.filter(n => !n.dismissed_at);

        if (activeNotifications.length === 0) {
            listContainer.innerHTML = '';
            noNotificationsDiv.style.display = 'block';
            return;
        }

        noNotificationsDiv.style.display = 'none';

        listContainer.innerHTML = activeNotifications.map(notification => {
            const isUnread = !notification.read_at;
            const createdAt = new Date(notification.created_at);
            const timeAgo = this.getTimeAgo(createdAt);

            return `
                <div class="notification-item" data-id="${notification.id}" style="
                    padding: 12px 15px;
                    border-bottom: 1px solid #f3f4f6;
                    cursor: pointer;
                    background: ${isUnread ? '#fef3c7' : 'white'};
                    position: relative;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='${isUnread ? '#fef3c7' : 'white'}'">

                    ${isUnread ? '<div style="position: absolute; left: 5px; top: 50%; transform: translateY(-50%); width: 3px; height: 20px; background: #f59e0b; border-radius: 2px;"></div>' : ''}

                    <div style="margin-left: ${isUnread ? '15px' : '0'};">
                        <div style="display: flex; justify-content: between; align-items: flex-start; margin-bottom: 5px;">
                            <div style="font-weight: 600; color: #374151; font-size: 14px; flex: 1; line-height: 1.3;">
                                ${notification.title}
                            </div>
                            <div style="font-size: 11px; color: #6b7280; white-space: nowrap; margin-left: 10px;">
                                ${timeAgo}
                            </div>
                        </div>

                        <div style="color: #6b7280; font-size: 13px; line-height: 1.4; margin-bottom: 8px;">
                            ${notification.message}
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="
                                display: inline-block;
                                background: ${this.getPriorityColor(notification.priority)};
                                color: white;
                                padding: 2px 8px;
                                border-radius: 12px;
                                font-size: 10px;
                                font-weight: 500;
                                text-transform: uppercase;
                            ">${notification.priority}</div>

                            <div style="display: flex; gap: 5px;">
                                ${notification.lead_id ? `<button onclick="event.stopPropagation(); notificationManager.openLead('${notification.lead_id}')" style="
                                    background: #3b82f6;
                                    color: white;
                                    border: none;
                                    padding: 4px 8px;
                                    border-radius: 4px;
                                    font-size: 10px;
                                    cursor: pointer;
                                ">Open Lead</button>` : ''}

                                <button onclick="event.stopPropagation(); notificationManager.dismissNotification(${notification.id})" style="
                                    background: #6b7280;
                                    color: white;
                                    border: none;
                                    padding: 4px 8px;
                                    border-radius: 4px;
                                    font-size: 10px;
                                    cursor: pointer;
                                ">Dismiss</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners for notifications
        listContainer.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    const notificationId = item.getAttribute('data-id');
                    this.markAsRead(notificationId);
                }
            });
        });
    }

    getPriorityColor(priority) {
        switch (priority) {
            case 'critical': return '#dc2626'; // Darker red for critical
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    togglePanel() {
        if (this.isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    showPanel() {
        this.container.style.display = 'block';
        this.isVisible = true;

        // Mark all as read when panel is opened
        setTimeout(() => {
            this.markAllAsRead();
        }, 1000);
    }

    hidePanel() {
        this.container.style.display = 'none';
        this.isVisible = false;
    }

    async markAsRead(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST'
            });

            if (response.ok) {
                const notification = this.notifications.find(n => n.id == notificationId);
                if (notification) {
                    notification.read_at = new Date().toISOString();
                    this.updateUI();
                }
            }
        } catch (error) {
            console.warn('Failed to mark notification as read:', error);
        }
    }

    async markAllAsRead() {
        const unreadNotifications = this.notifications.filter(n => !n.read_at && !n.dismissed_at);

        for (const notification of unreadNotifications) {
            await this.markAsRead(notification.id);
        }
    }

    async dismissNotification(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/dismiss`, {
                method: 'POST'
            });

            if (response.ok) {
                const notification = this.notifications.find(n => n.id == notificationId);
                if (notification) {
                    notification.dismissed_at = new Date().toISOString();
                    this.updateUI();
                }
            }
        } catch (error) {
            console.warn('Failed to dismiss notification:', error);
        }
    }

    async clearAllNotifications() {
        if (!confirm('Are you sure you want to dismiss all notifications?')) return;

        const activeNotifications = this.notifications.filter(n => !n.dismissed_at);

        for (const notification of activeNotifications) {
            await this.dismissNotification(notification.id);
        }
    }

    openLead(leadId) {
        console.log(`🔍 Opening lead: ${leadId}`);

        // Close notification panel
        this.hidePanel();

        // Try to find and click the existing lead or trigger viewLead function
        if (typeof viewLead === 'function') {
            viewLead(leadId);
        } else {
            // Alternative: scroll to lead in table if visible
            const leadRow = document.querySelector(`[data-lead-id="${leadId}"]`);
            if (leadRow) {
                leadRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                leadRow.style.backgroundColor = '#fef3c7';
                setTimeout(() => {
                    leadRow.style.backgroundColor = '';
                }, 3000);
            }
        }
    }

    startPeriodicCheck() {
        // Check for new notifications every 30 seconds
        this.checkInterval = setInterval(() => {
            this.loadNotifications();
        }, 30000);

        console.log('⏰ Started periodic notification check (30s interval)');
    }

    stopPeriodicCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    // Public API for manual refresh
    refresh() {
        this.loadNotifications();
    }

    // Get notification stats
    getStats() {
        const total = this.notifications.filter(n => !n.dismissed_at).length;
        const unread = this.notifications.filter(n => !n.read_at && !n.dismissed_at).length;
        const high = this.notifications.filter(n => n.priority === 'high' && !n.dismissed_at).length;

        return { total, unread, high };
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }

    .notification-item:hover {
        transform: translateX(-2px);
    }
`;
document.head.appendChild(style);

// Initialize notification manager when page loads
let notificationManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        notificationManager = new NotificationManager();
    });
} else {
    notificationManager = new NotificationManager();
}

// Export for global use
window.notificationManager = notificationManager;