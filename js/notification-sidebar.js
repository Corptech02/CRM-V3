// Notification Sidebar Functionality
(function() {
    'use strict';

    console.log('📬 Loading Notification Sidebar...');

    // Notification data storage
    let notifications = [];
    let lastCheckTime = null;

    // Load notifications from API
    async function loadNotifications() {
        try {
            console.log('📬 Loading notifications from API...');
            const response = await fetch('/api/notifications');

            if (response.ok) {
                notifications = await response.json();
                console.log(`📬 Loaded ${notifications.length} notifications`);
                updateNotificationDisplay();
                updateNotificationBadge();
            } else {
                console.warn('⚠️ Failed to load notifications:', response.status);
            }
        } catch (error) {
            console.warn('⚠️ Error loading notifications:', error);
        }
    }

    // Update notification badge count
    function updateNotificationBadge() {
        const unreadCount = notifications.filter(n => !n.read_at && !n.dismissed_at).length;
        const notificationBtn = document.querySelector('.notification-btn');

        if (notificationBtn) {
            // Remove existing badge
            const existingBadge = notificationBtn.querySelector('.notification-badge');
            if (existingBadge) {
                existingBadge.remove();
            }

            // Add badge if there are unread notifications
            if (unreadCount > 0) {
                const badge = document.createElement('span');
                badge.className = 'notification-badge';
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #ef4444;
                    color: white;
                    border-radius: 50%;
                    min-width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: bold;
                    border: 2px solid white;
                `;
                notificationBtn.appendChild(badge);
            } else {
                // Ensure no animation is applied
                notificationBtn.style.animation = 'none';
            }
        }
    }

    // Update notification display in sidebar
    function updateNotificationDisplay() {
        const sidebarContent = document.querySelector('.notification-sidebar-content');
        if (!sidebarContent) return;

        const activeNotifications = notifications.filter(n => !n.dismissed_at);

        if (activeNotifications.length === 0) {
            sidebarContent.innerHTML = `
                <div class="notification-empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                    <small>You'll see important updates here</small>
                </div>
            `;
            return;
        }

        // Sort notifications by priority and date
        const sortedNotifications = activeNotifications.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority] || 1;
            const bPriority = priorityOrder[b.priority] || 1;

            if (aPriority !== bPriority) return bPriority - aPriority;
            return new Date(b.created_at) - new Date(a.created_at);
        });

        const notificationHTML = sortedNotifications.map(notification => {
            const isUnread = !notification.read_at;
            const timeAgo = getTimeAgo(new Date(notification.created_at));
            const priorityColor = getPriorityColor(notification.priority);

            return `
                <div class="notification-item ${isUnread ? 'unread' : ''}" data-notification-id="${notification.id}" style="position: relative; padding: 15px; padding-right: 35px;">
                    <div class="notification-indicator" style="background: ${priorityColor}"></div>
                    <button onclick="dismissNotification(${notification.id})" class="notification-close" style="
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        background: none;
                        border: none;
                        font-size: 16px;
                        color: #6b7280;
                        cursor: pointer;
                        width: 20px;
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        transition: all 0.2s ease;
                        z-index: 10;
                    " onmouseover="this.style.background='#f3f4f6'; this.style.color='#374151';" onmouseout="this.style.background='none'; this.style.color='#6b7280';">×</button>
                    <div class="notification-content">
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-meta">
                            <span class="notification-time">${timeAgo}</span>
                            ${(() => {
                                let assignedAgent = null;
                                if (notification.metadata) {
                                    try {
                                        const metadata = typeof notification.metadata === 'string' ? JSON.parse(notification.metadata) : notification.metadata;
                                        assignedAgent = metadata.assignedAgent;
                                    } catch (e) {
                                        // Ignore parsing errors
                                    }
                                }
                                if (assignedAgent) {
                                    let agentColor = '#e5e7eb'; // Default gray
                                    let textColor = '#374151';  // Default dark text

                                    // Set agent-specific colors
                                    switch (assignedAgent.toLowerCase()) {
                                        case 'carson':
                                            agentColor = '#dbeafe'; // Light blue
                                            textColor = '#1e40af';  // Blue text
                                            break;
                                        case 'hunter':
                                            agentColor = '#dcfce7'; // Light green
                                            textColor = '#166534';  // Green text
                                            break;
                                        default:
                                            // Keep default gray colors (including Grant)
                                            break;
                                    }

                                    return `<span class="notification-agent" style="
                                        margin-left: 8px;
                                        background: ${agentColor};
                                        color: ${textColor};
                                        padding: 2px 6px;
                                        border-radius: 12px;
                                        font-size: 10px;
                                        font-weight: 500;
                                    ">${assignedAgent}</span>`;
                                }
                                return '';
                            })()}
                        </div>
                        <div class="notification-actions" style="
                            display: flex !important;
                            flex-direction: row !important;
                            gap: 8px !important;
                            margin-top: 12px !important;
                            position: static !important;
                        ">
                            ${notification.lead_id ? `<button onclick="openLeadFromNotification('${notification.lead_id}')" class="btn-open-lead" style="
                                flex: 1;
                                background: #3b82f6;
                                color: white;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 6px;
                                font-size: 13px;
                                font-weight: 500;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            " onmouseover="this.style.background='#2563eb';" onmouseout="this.style.background='#3b82f6';">Open Lead</button>` : ''}
                            <button onclick="dismissNotification(${notification.id})" class="btn-dismiss" style="
                                flex: 1;
                                background: #6b7280;
                                color: white;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 6px;
                                font-size: 13px;
                                font-weight: 500;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            " onmouseover="this.style.background='#4b5563';" onmouseout="this.style.background='#6b7280';">Dismiss</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        sidebarContent.innerHTML = `
            <div class="notification-header">
                <h3>Notifications</h3>
                <button onclick="markAllAsRead()" class="btn-mark-all-read">Mark All Read</button>
            </div>
            <div class="notification-list">
                ${notificationHTML}
            </div>
        `;
    }

    // Helper functions
    function getPriorityColor(priority) {
        switch (priority) {
            case 'critical': return '#dc2626';
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    }

    function getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (seconds < 10) return 'Just now';
        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    // API functions
    window.dismissNotification = async function(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/dismiss`, {
                method: 'POST'
            });

            if (response.ok) {
                console.log(`📬 Dismissed notification ${notificationId}`);
                await loadNotifications(); // Refresh
            }
        } catch (error) {
            console.error('❌ Error dismissing notification:', error);
        }
    };

    window.markAllAsRead = async function() {
        try {
            const unreadNotifications = notifications.filter(n => !n.read_at && !n.dismissed_at);

            for (const notification of unreadNotifications) {
                await fetch(`/api/notifications/${notification.id}/read`, {
                    method: 'POST'
                });
            }

            console.log(`📬 Marked ${unreadNotifications.length} notifications as read`);
            await loadNotifications(); // Refresh
        } catch (error) {
            console.error('❌ Error marking notifications as read:', error);
        }
    };

    window.openLeadFromNotification = function(leadId) {
        console.log(`📬 Opening lead ${leadId} from notification`);
        closeNotificationSidebar();

        // Try to open the lead profile
        if (typeof viewLead === 'function') {
            viewLead(leadId);
        } else {
            console.warn('⚠️ viewLead function not available');
        }
    };

    // Update timestamps without full reload
    function updateTimestamps() {
        console.log('📬 Updating timestamps...', new Date().toLocaleTimeString());
        const timeElements = document.querySelectorAll('.notification-time');
        console.log(`📬 Found ${timeElements.length} timestamp elements`);

        timeElements.forEach(element => {
            const notificationItem = element.closest('.notification-item');
            if (notificationItem) {
                const notificationId = notificationItem.getAttribute('data-notification-id');
                const notification = notifications.find(n => n.id == notificationId);
                if (notification) {
                    const oldTime = element.textContent;
                    const timeAgo = getTimeAgo(new Date(notification.created_at));
                    element.textContent = timeAgo;
                    console.log(`📬 Updated notification ${notificationId}: "${oldTime}" → "${timeAgo}"`);
                } else {
                    console.warn(`📬 No notification found for ID: ${notificationId}`);
                }
            }
        });
    }

    // Auto-refresh notifications every 30 seconds
    function startNotificationPolling() {
        loadNotifications(); // Initial load
        setInterval(loadNotifications, 30000); // Refresh every 30 seconds

        // Update timestamps every 5 seconds (more frequently for testing)
        setInterval(updateTimestamps, 5000); // Update timestamps every 5 seconds

        console.log('📬 Started notification polling (30s interval)');
        console.log('📬 Started timestamp updates (5s interval)');
    }

    // Global notification functions
    window.openNotificationSidebar = function() {
        console.log('📬 Opening notification sidebar');
        const sidebar = document.getElementById('notificationSidebar');
        const overlay = document.getElementById('notificationOverlay');

        if (sidebar && overlay) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent body scroll when sidebar is open
        }
    };

    window.closeNotificationSidebar = function() {
        console.log('📬 Closing notification sidebar');
        const sidebar = document.getElementById('notificationSidebar');
        const overlay = document.getElementById('notificationOverlay');

        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = ''; // Restore body scroll
        }
    };

    // Toggle function
    window.toggleNotificationSidebar = function() {
        const sidebar = document.getElementById('notificationSidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            closeNotificationSidebar();
        } else {
            openNotificationSidebar();
        }
    };

    // Add click event listener to notification button
    function initializeNotificationButton() {
        console.log('📬 Initializing notification button...');

        const notificationBtn = document.querySelector('.notification-btn');
        if (notificationBtn) {
            // Remove any existing click listeners first
            notificationBtn.removeEventListener('click', openNotificationSidebar);

            // Add click event listener
            notificationBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('📬 Notification button clicked');
                openNotificationSidebar();
            });

            console.log('✅ Notification button initialized');
        } else {
            console.warn('⚠️ Notification button not found');
        }
    }

    // Add keyboard support (ESC to close)
    function initializeKeyboardSupport() {
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const sidebar = document.getElementById('notificationSidebar');
                if (sidebar && sidebar.classList.contains('active')) {
                    closeNotificationSidebar();
                }
            }
        });
    }

    // Initialize when DOM is ready
    function initialize() {
        console.log('📬 Initializing notification sidebar functionality...');

        initializeNotificationButton();
        initializeKeyboardSupport();
        startNotificationPolling(); // Start loading notifications

        console.log('✅ Notification sidebar functionality loaded');
    }

    // Initialize immediately if DOM is already loaded, otherwise wait for DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // Also initialize after a short delay to ensure all elements are loaded
    setTimeout(initialize, 500);

    // Re-initialize periodically to handle dynamically added elements
    setInterval(function() {
        const notificationBtn = document.querySelector('.notification-btn');
        if (notificationBtn && !notificationBtn.hasAttribute('data-notification-initialized')) {
            console.log('📬 Re-initializing notification button...');
            initializeNotificationButton();
            notificationBtn.setAttribute('data-notification-initialized', 'true');
        }
    }, 2000);

})();

console.log('📬 Notification Sidebar Script Loaded');