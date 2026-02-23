// Callback Notifications - 30-minute notification system
(function() {
    'use strict';

    console.log('🔔 Loading Callback Notifications System...');

    // Notification storage
    let callbackNotifications = JSON.parse(localStorage.getItem('callbackNotifications') || '[]');
    let notificationCheckInterval = null;

    // Notification functions
    const CallbackNotifications = {

        // Initialize the notification system
        init: function() {
            console.log('🔔 Initializing callback notification system...');
            this.cleanupOldNotifications();
            this.startNotificationMonitoring();
            this.updateNotificationDisplay();
            this.updateNotificationBadge();
        },

        // Start monitoring for callbacks due in 30 minutes
        startNotificationMonitoring: function() {
            // Clear any existing interval
            if (notificationCheckInterval) {
                clearInterval(notificationCheckInterval);
            }

            // Check every minute for callbacks due in 30 minutes
            notificationCheckInterval = setInterval(() => {
                this.checkForUpcomingCallbacks();
            }, 60000); // Check every minute

            // Also check immediately
            this.checkForUpcomingCallbacks();

            console.log('🔔 Callback notification monitoring started');
        },

        // Check for callbacks due in 30 minutes and callbacks that are actually due now
        checkForUpcomingCallbacks: function() {
            try {
                const now = new Date();
                // EXPANDED WINDOW: Check for callbacks 25-35 minutes from now (10-minute window instead of 1-minute)
                const thirtyFiveMinutesFromNow = new Date(now.getTime() + (35 * 60 * 1000));
                const twentyFiveMinutesFromNow = new Date(now.getTime() + (25 * 60 * 1000));

                // Get all scheduled callbacks
                const callbacks = JSON.parse(localStorage.getItem('scheduled_callbacks') || '{}');
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');

                Object.keys(callbacks).forEach(leadId => {
                    const leadCallbacks = callbacks[leadId] || [];
                    const lead = leads.find(l => String(l.id) === String(leadId));

                    if (!lead) return;

                    leadCallbacks.forEach(callback => {
                        if (callback.completed) return;

                        const callbackTime = new Date(callback.dateTime);

                        // Check if callback is due in approximately 30 minutes (25-35 minutes window)
                        if (callbackTime >= twentyFiveMinutesFromNow && callbackTime <= thirtyFiveMinutesFromNow) {
                            this.createCallbackNotification(leadId, lead, callback, '30min');
                        }

                        // Check if callback is due NOW (overdue by up to 5 minutes)
                        const fiveMinutesAgo = new Date(now.getTime() - (5 * 60 * 1000));
                        if (callbackTime >= fiveMinutesAgo && callbackTime <= now) {
                            this.createCallbackNotification(leadId, lead, callback, 'due');
                        }
                    });
                });

            } catch (error) {
                console.error('❌ Error checking for upcoming callbacks:', error);
            }
        },

        // Create a notification for callback reminders (30-minute or due now)
        createCallbackNotification: function(leadId, lead, callback, notificationType = '30min') {
            const notificationId = `callback_${leadId}_${callback.id || Date.now()}_${notificationType}`;

            // Check if notification already exists
            const existingNotification = callbackNotifications.find(n => n.id === notificationId);
            if (existingNotification) {
                console.log(`🔔 Notification already exists for lead ${leadId} (${notificationType})`);
                return;
            }

            const callbackTime = new Date(callback.dateTime);
            const formattedTime = callbackTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            // Determine notification title and urgency based on type
            const isUrgent = notificationType === 'due';
            const title = isUrgent ? '🔥 CALL DUE NOW!' : 'Call Due in 30 Minutes';
            const messagePrefix = isUrgent ? 'URGENT: Call now with' : 'Scheduled call with';

            const notification = {
                id: notificationId,
                type: isUrgent ? 'callback_due' : 'callback_reminder',
                title: title,
                message: `${messagePrefix} ${lead.name}`,
                leadId: leadId,
                leadName: lead.name,
                leadPhone: lead.phone,
                assignedAgent: lead.assignedTo || 'Unassigned',
                callbackTime: callback.dateTime,
                callbackTimeFormatted: formattedTime,
                callbackNotes: callback.notes,
                createdAt: new Date().toISOString(),
                read: false,
                actionable: true,
                urgent: isUrgent
            };

            console.log(`🔔 Creating ${notificationType} notification for ${lead.name} (${formattedTime})`);

            // Add to notifications array
            callbackNotifications.push(notification);

            // Save to localStorage
            this.saveNotifications();

            // Update UI
            this.updateNotificationDisplay();
            this.updateNotificationBadge();

            // Show popup notification at top of page
            this.showPopupNotification(notification);

            // Play sound notification
            this.playNotificationSound(notification);

            // Send email reminder (if configured)
            this.sendEmailReminder(notification);
        },

        // Send email reminder for 30-minute callback
        sendEmailReminder: function(notification) {
            // Get current user info to get their email
            const sessionData = JSON.parse(sessionStorage.getItem('vanguard_user') || '{}');
            const userEmail = sessionData.email;

            if (!userEmail) {
                console.log('🔔 No user email found, skipping email reminder');
                return;
            }

            const callbackData = {
                leadName: notification.leadName,
                leadPhone: notification.leadPhone,
                dateTime: notification.callbackTime,
                notes: notification.callbackNotes
            };

            // Send email via API
            fetch('/api/send-callback-reminder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: userEmail,
                    subject: `🔔 Callback Reminder - ${notification.leadName} in 30 minutes`,
                    html: this.generateEmailHTML(callbackData)
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log(`✅ Email reminder sent for ${notification.leadName}`);
                } else {
                    console.error('❌ Failed to send email reminder:', data.error);
                }
            })
            .catch(error => {
                console.error('❌ Error sending email reminder:', error);
            });
        },

        // Generate HTML for email reminder
        generateEmailHTML: function(callbackData) {
            const callbackTime = new Date(callbackData.dateTime);
            const formattedTime = callbackTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            return `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 20px; text-align: center;">
                        <h1>🔔 Callback Reminder</h1>
                        <p style="font-size: 18px; margin: 0;">30 Minutes Until Scheduled Call</p>
                    </div>
                    <div style="padding: 30px; background: #f9fafb;">
                        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin-bottom: 20px;">
                            <h2 style="margin-top: 0; color: #1f2937;">Callback Details</h2>
                            <ul style="list-style: none; padding: 0;">
                                <li style="margin-bottom: 10px;"><strong>📋 Lead:</strong> ${callbackData.leadName}</li>
                                <li style="margin-bottom: 10px;"><strong>📞 Phone:</strong> ${callbackData.leadPhone || 'Not provided'}</li>
                                <li style="margin-bottom: 10px;"><strong>🕒 Scheduled Time:</strong> ${formattedTime}</li>
                                <li style="margin-bottom: 10px;"><strong>📝 Notes:</strong> ${callbackData.notes || 'No notes provided'}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        },

        // Show popup notification at top of page
        showPopupNotification: function(notification) {
            try {
                // Remove any existing popup
                const existingPopup = document.querySelector('.callback-popup-notification');
                if (existingPopup) {
                    existingPopup.remove();
                }

                // Create popup element
                const popup = document.createElement('div');
                popup.className = 'callback-popup-notification';
                popup.innerHTML = `
                    <div class="popup-content ${notification.urgent ? 'urgent' : ''}">
                        <div class="popup-icon">
                            <i class="fas fa-phone" style="color: ${notification.urgent ? '#dc2626' : '#059669'};"></i>
                        </div>
                        <div class="popup-text">
                            <div class="popup-title">${notification.title}</div>
                            <div class="popup-message">${notification.message}</div>
                            <div class="popup-time">${notification.callbackTimeFormatted}</div>
                        </div>
                        <div class="popup-actions">
                            <button class="popup-call-btn" onclick="CallbackNotifications.handleCallNow('${notification.leadId}', '${notification.leadPhone}')">
                                <i class="fas fa-phone"></i> CALL
                            </button>
                            <button class="popup-dismiss-btn" onclick="CallbackNotifications.dismissPopup()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;

                // Add to top of page
                document.body.insertBefore(popup, document.body.firstChild);

                // Auto-dismiss after 15 seconds for non-urgent, 30 seconds for urgent
                const dismissTime = notification.urgent ? 30000 : 15000;
                setTimeout(() => {
                    if (document.querySelector('.callback-popup-notification')) {
                        this.dismissPopup();
                    }
                }, dismissTime);

                console.log(`🔔 Popup notification shown for ${notification.leadName}`);
            } catch (error) {
                console.error('❌ Error showing popup notification:', error);
            }
        },

        // Dismiss popup notification
        dismissPopup: function() {
            const popup = document.querySelector('.callback-popup-notification');
            if (popup) {
                popup.style.transform = 'translateY(-100%)';
                setTimeout(() => popup.remove(), 300);
            }
        },

        // Play notification sound
        playNotificationSound: function(notification) {
            try {
                // Create audio element if it doesn't exist
                let audio = document.querySelector('#callback-notification-audio');
                if (!audio) {
                    audio = document.createElement('audio');
                    audio.id = 'callback-notification-audio';
                    audio.preload = 'auto';
                    document.body.appendChild(audio);
                }

                // Set audio source to the ringtone
                audio.src = 'https://github.com/Corptech02/LLCinfo/blob/main/strong-minded-ringtone.ogg?raw=true';

                // Play different patterns for urgent vs normal notifications
                if (notification.urgent) {
                    // Play 3 times for urgent notifications
                    let playCount = 0;
                    const playUrgent = () => {
                        audio.play().catch(err => console.warn('Audio play failed:', err));
                        playCount++;
                        if (playCount < 3) {
                            setTimeout(playUrgent, 1500); // Play every 1.5 seconds
                        }
                    };
                    playUrgent();
                } else {
                    // Play once for normal notifications
                    audio.play().catch(err => console.warn('Audio play failed:', err));
                }

                console.log(`🔊 Playing ${notification.urgent ? 'urgent' : 'normal'} notification sound`);
            } catch (error) {
                console.error('❌ Error playing notification sound:', error);
            }
        },

        // Update the notification sidebar display
        updateNotificationDisplay: function() {
            const sidebarContent = document.querySelector('.notification-sidebar-content');
            if (!sidebarContent) return;

            // Clean up old notifications first
            this.cleanupOldNotifications();

            const activeNotifications = callbackNotifications.filter(n => !this.isNotificationExpired(n));

            if (activeNotifications.length === 0) {
                // Show empty state
                sidebarContent.innerHTML = `
                    <div class="notification-empty-state">
                        <i class="fas fa-bell-slash"></i>
                        <p>No notifications yet</p>
                        <small>You'll see important updates here</small>
                    </div>
                `;
            } else {
                // Show notifications
                const notificationsHTML = activeNotifications.map(notification =>
                    this.generateNotificationHTML(notification)
                ).join('');

                sidebarContent.innerHTML = `
                    <div class="notifications-list">
                        ${notificationsHTML}
                    </div>
                `;

                // Add click handlers
                this.addNotificationClickHandlers();
            }
        },

        // Generate HTML for a single notification
        generateNotificationHTML: function(notification) {
            const timeAgo = this.getTimeAgo(new Date(notification.createdAt));
            const readClass = notification.read ? 'read' : 'unread';

            // FALLBACK: If notification doesn't have assignedAgent, look it up from lead data
            let assignedAgent = notification.assignedAgent;
            if (!assignedAgent && notification.leadId) {
                const leads = JSON.parse(localStorage.getItem('insurance_leads') || '[]');
                const lead = leads.find(l => String(l.id) === String(notification.leadId));
                assignedAgent = lead ? (lead.assignedTo || 'Unassigned') : 'Unknown';
            }

            return `
                <div class="notification-item ${readClass} ${notification.urgent ? 'urgent-notification' : ''}" data-notification-id="${notification.id}">
                    <button class="dismiss-btn-top-right" onclick="CallbackNotifications.dismissNotification('${notification.id}')" title="Dismiss">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="notification-icon">
                        <i class="fas fa-phone" style="color: ${notification.urgent ? '#dc2626' : '#059669'};"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-details">
                            <span class="callback-time">${notification.callbackTimeFormatted}</span>
                            ${notification.leadPhone ? `<span class="lead-phone">${notification.leadPhone}</span>` : ''}
                            ${assignedAgent ? `<span class="assigned-agent">Assigned: ${assignedAgent}</span>` : ''}
                        </div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                    <div class="notification-actions">
                        <button class="view-lead-btn" onclick="CallbackNotifications.handleViewLead('${notification.leadId}')" title="View Lead">
                            <i class="fas fa-user"></i>
                        </button>
                    </div>
                </div>
            `;
        },

        // Add click handlers for notification interactions
        addNotificationClickHandlers: function() {
            document.querySelectorAll('.notification-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    // Only mark as read if clicking the main notification area, not action buttons or dismiss button
                    if (!e.target.closest('.notification-actions') && !e.target.closest('.dismiss-btn-top-right')) {
                        const notificationId = item.getAttribute('data-notification-id');
                        this.markAsRead(notificationId);
                    }
                });
            });
        },

        // Handle call now action
        handleCallNow: function(leadId, phone) {
            console.log(`🔔 Call now action for lead ${leadId}: ${phone}`);

            // Call the existing handleReachOutCall function if available
            if (typeof handleReachOutCall === 'function') {
                handleReachOutCall(leadId, phone);
            } else {
                // Fallback: open tel: link
                window.open(`tel:${phone}`, '_self');
            }

            // Close notification sidebar
            if (typeof closeNotificationSidebar === 'function') {
                closeNotificationSidebar();
            }
        },

        // Handle view lead action
        handleViewLead: function(leadId) {
            console.log(`🔔 View lead action for lead ${leadId}`);

            // Call the existing viewLead function if available
            if (typeof viewLead === 'function') {
                viewLead(leadId);
            }

            // Close notification sidebar
            if (typeof closeNotificationSidebar === 'function') {
                closeNotificationSidebar();
            }
        },

        // Dismiss a notification
        dismissNotification: function(notificationId) {
            console.log(`🔔 Dismissing notification ${notificationId}`);

            // Remove from array
            callbackNotifications = callbackNotifications.filter(n => n.id !== notificationId);

            // Save and update display
            this.saveNotifications();
            this.updateNotificationDisplay();
            this.updateNotificationBadge();
        },

        // Mark notification as read
        markAsRead: function(notificationId) {
            const notification = callbackNotifications.find(n => n.id === notificationId);
            if (notification && !notification.read) {
                notification.read = true;
                this.saveNotifications();
                this.updateNotificationBadge();

                // Update the visual state
                const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
                if (notificationElement) {
                    notificationElement.classList.remove('unread');
                    notificationElement.classList.add('read');
                }
            }
        },

        // Update notification badge count
        updateNotificationBadge: function() {
            const unreadCount = callbackNotifications.filter(n => !n.read && !this.isNotificationExpired(n)).length;

            // Find notification button and update badge
            const notificationBtn = document.querySelector('.notification-btn');
            if (notificationBtn) {
                let badge = notificationBtn.querySelector('.notification-badge');

                if (unreadCount > 0) {
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'notification-badge';
                        notificationBtn.appendChild(badge);
                    }
                    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                    badge.style.display = 'inline-block';
                } else if (badge) {
                    badge.style.display = 'none';
                }
            }
        },

        // Clean up old/expired notifications
        cleanupOldNotifications: function() {
            const originalCount = callbackNotifications.length;
            callbackNotifications = callbackNotifications.filter(notification => !this.isNotificationExpired(notification));

            if (callbackNotifications.length !== originalCount) {
                this.saveNotifications();
                console.log(`🔔 Cleaned up ${originalCount - callbackNotifications.length} expired notifications`);
            }
        },

        // Check if a notification is expired (older than 2 hours or callback time has passed)
        isNotificationExpired: function(notification) {
            const now = new Date();
            const callbackTime = new Date(notification.callbackTime);
            const createdTime = new Date(notification.createdAt);

            // Remove if callback time has passed by more than 1 hour
            const oneHourAfterCallback = new Date(callbackTime.getTime() + (60 * 60 * 1000));
            if (now > oneHourAfterCallback) {
                return true;
            }

            // Remove if notification is older than 24 hours
            const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
            if (createdTime < twentyFourHoursAgo) {
                return true;
            }

            return false;
        },

        // Get time ago string for display
        getTimeAgo: function(date) {
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            return date.toLocaleDateString();
        },

        // Save notifications to localStorage
        saveNotifications: function() {
            localStorage.setItem('callbackNotifications', JSON.stringify(callbackNotifications));
        },

        // Public method to add custom notification
        addNotification: function(notification) {
            notification.id = notification.id || `custom_${Date.now()}`;
            notification.createdAt = notification.createdAt || new Date().toISOString();
            notification.read = notification.read || false;

            callbackNotifications.push(notification);
            this.saveNotifications();
            this.updateNotificationDisplay();
            this.updateNotificationBadge();

            console.log('🔔 Custom notification added:', notification.title);
        }
    };

    // Make CallbackNotifications globally available
    window.CallbackNotifications = CallbackNotifications;

    // Initialize when DOM is ready
    function initialize() {
        CallbackNotifications.init();
    }

    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    console.log('✅ Callback Notifications System Loaded');

})();