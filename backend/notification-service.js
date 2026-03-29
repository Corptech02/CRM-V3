#!/usr/bin/env node

/**
 * Vanguard Notification Service
 * Runs continuously in the background to track callbacks, overdue leads, and generate notifications
 * Works independently of user login status
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const EmailService = require('./email-service');

// Database connection
const dbPath = path.join(__dirname, '../vanguard.db');
const db = new sqlite3.Database(dbPath);

// Configuration
const CHECK_INTERVAL = 60000; // Check every minute
const CALLBACK_WARNING_MINUTES = 30; // Warn 30 minutes before callback is due
const OVERDUE_THRESHOLD_MINUTES = 15; // Mark as overdue 15 minutes after due time
const ENABLE_EMAIL_NOTIFICATIONS = true; // Enable email notifications

// Email Configuration
const emailConfig = {
    provider: 'smtp',
    smtpHost: 'smtpout.secureserver.net',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: 'contact@vigagency.com',
    smtpPass: process.env.GODADDY_PASSWORD || '25nickc124!',
    fromEmail: 'contact@vigagency.com'
};

// Initialize email service
const emailService = new EmailService(emailConfig);

console.log('🚀 Vanguard Notification Service Starting...');
console.log(`📊 Check interval: ${CHECK_INTERVAL / 1000} seconds`);
console.log(`⏰ Callback warning time: ${CALLBACK_WARNING_MINUTES} minutes before due`);
console.log(`🚨 Overdue threshold: ${OVERDUE_THRESHOLD_MINUTES} minutes after due`);

// Create notifications table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    lead_id TEXT,
    callback_id TEXT,
    priority TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME NULL,
    dismissed_at DATETIME NULL,
    metadata TEXT
)`, (err) => {
    if (err) {
        console.error('❌ Error creating notifications table:', err);
    } else {
        console.log('✅ Notifications table ready');
    }
});

// Create todos table for notification tracking
db.run(`CREATE TABLE IF NOT EXISTS tracked_todos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    text TEXT NOT NULL,
    target_date DATETIME NOT NULL,
    completed INTEGER DEFAULT 0,
    todo_type TEXT DEFAULT 'personal',
    source TEXT DEFAULT 'manual',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (err) {
        console.error('❌ Error creating tracked_todos table:', err);
    } else {
        console.log('✅ Tracked todos table ready');
    }
});

// Store active notifications to avoid duplicates
const activeNotifications = new Set();
// Store sent email reminders to avoid duplicates
const sentEmailReminders = new Set();

// Helper function to create notification with deduplication
function createNotification(type, title, message, leadId = null, callbackId = null, priority = 'medium', metadata = {}) {
    // For callback overdue notifications, remove old notifications for the same lead
    if (type === 'callback_overdue' && leadId) {
        console.log(`🧹 DEDUPLICATION: Removing old callback_overdue notifications for lead ${leadId}`);

        // Remove old notifications for this lead from database
        const deleteStmt = db.prepare(`
            UPDATE notifications
            SET dismissed_at = CURRENT_TIMESTAMP
            WHERE type = 'callback_overdue' AND lead_id = ? AND dismissed_at IS NULL
        `);

        deleteStmt.run(leadId, (err) => {
            if (err) {
                console.error('❌ Error dismissing old notifications:', err);
            } else {
                console.log(`🧹 DEDUPLICATION: Dismissed old callback_overdue notifications for lead ${leadId}`);
            }
        });

        deleteStmt.finalize();

        // Also remove from active notifications set
        const oldNotificationKey = `callback_overdue_${leadId}_`;
        activeNotifications.delete(oldNotificationKey);
    }

    // For todo overdue notifications, remove old notifications for the same todo
    if (type === 'todo_overdue' && callbackId) {
        console.log(`🧹 DEDUPLICATION: Removing old todo_overdue notifications for todo ${callbackId}`);

        const deleteStmt = db.prepare(`
            UPDATE notifications
            SET dismissed_at = CURRENT_TIMESTAMP
            WHERE type = 'todo_overdue' AND callback_id = ? AND dismissed_at IS NULL
        `);

        deleteStmt.run(callbackId, (err) => {
            if (err) {
                console.error('❌ Error dismissing old todo notifications:', err);
            } else {
                console.log(`🧹 DEDUPLICATION: Dismissed old todo_overdue notifications for todo ${callbackId}`);
            }
        });

        deleteStmt.finalize();

        const oldNotificationKey = `todo_overdue_${callbackId}_`;
        activeNotifications.delete(oldNotificationKey);
    }

    // For event overdue notifications, remove old notifications for the same event
    if (type === 'event_overdue' && callbackId) {
        console.log(`🧹 DEDUPLICATION: Removing old event_overdue notifications for event ${callbackId}`);

        const deleteStmt = db.prepare(`
            UPDATE notifications
            SET dismissed_at = CURRENT_TIMESTAMP
            WHERE type = 'event_overdue' AND callback_id = ? AND dismissed_at IS NULL
        `);

        deleteStmt.run(callbackId, (err) => {
            if (err) {
                console.error('❌ Error dismissing old event notifications:', err);
            } else {
                console.log(`🧹 DEDUPLICATION: Dismissed old event_overdue notifications for event ${callbackId}`);
            }
        });

        deleteStmt.finalize();

        const oldNotificationKey = `event_overdue_${callbackId}_`;
        activeNotifications.delete(oldNotificationKey);
    }

    const notificationKey = `${type}_${leadId || ''}_${callbackId || ''}`;

    // For non-overdue notifications, still prevent immediate duplicates
    if (type !== 'callback_overdue' && activeNotifications.has(notificationKey)) {
        return;
    }

    const stmt = db.prepare(`
        INSERT INTO notifications (type, title, message, lead_id, callback_id, priority, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        type,
        title,
        message,
        leadId,
        callbackId,
        priority,
        JSON.stringify(metadata),
        (err) => {
            if (err) {
                console.error('❌ Error creating notification:', err);
            } else {
                console.log(`📢 Created ${priority} notification: ${title} (lead: ${leadId})`);
                activeNotifications.add(notificationKey);

                // Remove from active set after some time to allow future notifications
                // Shorter timeout for overdue notifications to allow updates
                const timeout = type === 'callback_overdue' ? 5 * 60 * 1000 : 60 * 60 * 1000; // 5 min vs 1 hour
                setTimeout(() => {
                    activeNotifications.delete(notificationKey);
                }, timeout);
            }
        }
    );

    stmt.finalize();
}

// Helper function to send email reminder
async function sendEmailReminder(callback, leadData) {
    if (!ENABLE_EMAIL_NOTIFICATIONS) return;

    const reminderKey = `email_${callback.lead_id}_${callback.callback_id}`;

    // Prevent duplicate email reminders
    if (sentEmailReminders.has(reminderKey)) {
        return;
    }

    try {
        // Get agent email from lead data or use default
        let agentEmail = 'grant@vigagency.com'; // Default fallback

        if (leadData && leadData.assignedTo) {
            // Map assigned agents to their emails
            const agentEmails = {
                'Grant': 'grant@vigagency.com',
                'Carson': 'carson@vigagency.com',
                'Hunter': 'hunter@vigagency.com'
            };

            const assignedAgent = leadData.assignedTo;
            if (agentEmails[assignedAgent]) {
                agentEmail = agentEmails[assignedAgent];
            }
        }

        // Prepare callback data for email
        const callbackData = {
            leadName: leadData ? (leadData.name || 'Unknown Lead') : 'Unknown Lead',
            leadPhone: leadData ? leadData.phone : null,
            dateTime: callback.date_time,
            notes: callback.notes || 'No notes provided'
        };

        console.log(`📧 Sending 30-minute callback reminder email to ${agentEmail} for ${callbackData.leadName}`);

        // Send email reminder
        const result = await emailService.sendCallbackReminderEmail(agentEmail, callbackData);

        if (result.success) {
            console.log(`✅ Email reminder sent successfully to ${agentEmail}: ${result.messageId}`);

            // Mark as sent to prevent duplicates
            sentEmailReminders.add(reminderKey);

            // Remove from sent set after 2 hours to allow re-sending if needed
            setTimeout(() => {
                sentEmailReminders.delete(reminderKey);
            }, 2 * 60 * 60 * 1000);

            // Create notification record of email sent
            createNotification(
                'email_sent',
                '📧 Reminder Email Sent',
                `30-minute callback reminder email sent to ${agentEmail} for ${callbackData.leadName}`,
                callback.lead_id,
                callback.callback_id,
                'low',
                {
                    emailRecipient: agentEmail,
                    messageId: result.messageId,
                    callbackTime: callback.date_time
                }
            );
        } else {
            console.error(`❌ Failed to send email reminder to ${agentEmail}:`, result.error);

            // Create notification of email failure
            createNotification(
                'email_failed',
                '📧 Email Reminder Failed',
                `Failed to send 30-minute callback reminder email to ${agentEmail} for ${callbackData.leadName}`,
                callback.lead_id,
                callback.callback_id,
                'medium',
                {
                    emailRecipient: agentEmail,
                    error: result.error,
                    callbackTime: callback.date_time
                }
            );
        }
    } catch (error) {
        console.error('❌ Error in sendEmailReminder:', error);
    }
}

// Helper function to get lead name
function getLeadName(leadId, callback) {
    // First try clients table (JSON storage)
    db.get('SELECT id, data FROM clients WHERE id = ?', [leadId], (err, row) => {
        if (row && row.data) {
            try {
                const clientData = JSON.parse(row.data);
                const displayName = clientData.businessName || clientData.name || clientData.fullName || 'Unknown Lead';
                callback(displayName, clientData);
                return;
            } catch (e) {
                console.warn('Error parsing client data:', e.message);
            }
        }

        // Try leads table (JSON storage)
        db.get('SELECT id, data FROM leads WHERE id = ?', [leadId], (err, row) => {
            if (row && row.data) {
                try {
                    const leadData = JSON.parse(row.data);
                    const displayName = leadData.businessName || leadData.name || leadData.fullName || 'Unknown Lead';
                    callback(displayName, leadData);
                    return;
                } catch (e) {
                    console.warn('Error parsing lead data:', e.message);
                }
            }

            // Final fallback - try insurance_leads (JSON storage in settings)
            db.get('SELECT value FROM settings WHERE key = ?', ['insurance_leads'], (err, row) => {
                if (row && row.value) {
                    try {
                        const leads = JSON.parse(row.value);
                        const lead = leads.find(l => String(l.id) === String(leadId));
                        if (lead) {
                            const displayName = lead.businessName || lead.name || lead.fullName || 'Unknown Lead';
                            callback(displayName, lead);
                            return;
                        }
                    } catch (e) {
                        console.warn('Error parsing insurance_leads:', e.message);
                    }
                }

                // No data found anywhere
                callback('Unknown Lead', null);
            });
        });
    });
}

// Main monitoring function
function checkCallbacks() {
    console.log('🔍 Checking callbacks and notifications...');

    const now = new Date();
    const warningTime = new Date(now.getTime() + (CALLBACK_WARNING_MINUTES * 60 * 1000));
    const overdueTime = new Date(now.getTime() - (OVERDUE_THRESHOLD_MINUTES * 60 * 1000));

    // Query all active callbacks
    db.all(`
        SELECT * FROM scheduled_callbacks
        WHERE completed = 0
        ORDER BY date_time ASC
    `, (err, callbacks) => {
        if (err) {
            console.error('❌ Error querying callbacks:', err);
            return;
        }

        console.log(`📋 Found ${callbacks.length} active callbacks`);

        callbacks.forEach(callback => {
            const callbackTime = new Date(callback.date_time);
            const leadId = callback.lead_id;
            const callbackId = callback.callback_id;

            // Check if overdue
            if (callbackTime < overdueTime) {
                getLeadName(leadId, (leadName, leadData) => {
                    // Skip creating notifications for unknown/missing leads
                    if (leadName === 'Unknown Lead' || !leadData) {
                        console.warn(`⚠️ Skipping notification for missing lead ID: ${leadId}`);
                        return;
                    }

                    createNotification(
                        'callback_overdue',
                        '🔴 Callback Overdue',
                        `Callback for ${leadName} was due ${Math.round((now - callbackTime) / (1000 * 60))} minutes ago`,
                        leadId,
                        callbackId,
                        'high',
                        {
                            dueTime: callback.date_time,
                            minutesOverdue: Math.round((now - callbackTime) / (1000 * 60)),
                            notes: callback.notes,
                            leadData: leadData,
                            assignedAgent: leadData ? leadData.assignedTo : null
                        }
                    );
                });
            }
            // Check if due soon (warning) - also send email if within 30 minutes
            else if (callbackTime <= warningTime && callbackTime > now) {
                getLeadName(leadId, (leadName, leadData) => {
                    // Skip creating notifications for unknown/missing leads
                    if (leadName === 'Unknown Lead' || !leadData) {
                        console.warn(`⚠️ Skipping due soon notification for missing lead ID: ${leadId}`);
                        return;
                    }

                    const minutesUntil = Math.round((callbackTime - now) / (1000 * 60));

                    // Create notification
                    createNotification(
                        'callback_due_soon',
                        '⚡ Callback Due Soon',
                        `Callback for ${leadName} is due in ${minutesUntil} minutes`,
                        leadId,
                        callbackId,
                        'medium',
                        {
                            dueTime: callback.date_time,
                            minutesUntil: minutesUntil,
                            notes: callback.notes,
                            leadData: leadData,
                            assignedAgent: leadData ? leadData.assignedTo : null
                        }
                    );

                    // Send email reminder if within 30 minutes
                    if (minutesUntil <= CALLBACK_WARNING_MINUTES) {
                        sendEmailReminder(callback, leadData);
                    }
                });
            }
            // Check if due right now (within 5 minutes) - High priority notifications
            else if (Math.abs(callbackTime - now) <= 5 * 60 * 1000) {
                getLeadName(leadId, (leadName, leadData) => {
                    // Skip creating notifications for unknown/missing leads
                    if (leadName === 'Unknown Lead' || !leadData) {
                        console.warn(`⚠️ Skipping due now notification for missing lead ID: ${leadId}`);
                        return;
                    }

                    const minutesFromDue = Math.round((callbackTime - now) / (1000 * 60));
                    let urgencyLevel = 'high';
                    let title = '🔔 Callback Due Now';
                    let message = `Callback for ${leadName} is due now!`;

                    // More specific messaging based on exact timing
                    if (minutesFromDue > 0) {
                        title = '🚨 Callback Due Very Soon';
                        message = `URGENT: Callback for ${leadName} is due in ${minutesFromDue} minute${minutesFromDue === 1 ? '' : 's'}!`;
                    } else if (minutesFromDue === 0) {
                        title = '🔴 CALLBACK DUE RIGHT NOW';
                        message = `⏰ IMMEDIATE ACTION REQUIRED: Callback for ${leadName} is due RIGHT NOW!`;
                        urgencyLevel = 'critical';
                    } else {
                        // Overdue but still within 5 minutes
                        const minutesOverdue = Math.abs(minutesFromDue);
                        title = '🚨 CALLBACK OVERDUE';
                        message = `URGENT: Callback for ${leadName} was due ${minutesOverdue} minute${minutesOverdue === 1 ? '' : 's'} ago!`;
                        urgencyLevel = 'critical';
                    }

                    createNotification(
                        'callback_due_now',
                        title,
                        message,
                        leadId,
                        callbackId,
                        urgencyLevel,
                        {
                            dueTime: callback.date_time,
                            minutesFromDue: minutesFromDue,
                            notes: callback.notes,
                            leadData: leadData,
                            assignedAgent: leadData ? leadData.assignedTo : null
                        }
                    );
                });
            }
        });
    });

    // Additional monitoring can be added here:
    // - Check for leads without recent activity
    // - Check for pending quote applications

    // Check todos and calendar events for notifications
    checkTodosAndEvents();
    // - Check for expired documents
    // - etc.

    console.log(`✅ Callback check completed at ${new Date().toISOString()}`);
}

// Check todos and calendar events for notifications
function checkTodosAndEvents() {
    console.log('📅 Checking todos and calendar events for notifications...');

    const now = new Date();
    const warningTime = new Date(now.getTime() + (CALLBACK_WARNING_MINUTES * 60 * 1000)); // 30 min warning
    const overdueTime = new Date(now.getTime() - (OVERDUE_THRESHOLD_MINUTES * 60 * 1000)); // 15 min overdue

    // Check tracked todos for notifications
    checkTrackedTodos(now, warningTime, overdueTime);

    // Check calendar events for notifications
    checkCalendarEvents(now, warningTime, overdueTime);
}

// Check tracked todos (synced from frontend localStorage)
function checkTrackedTodos(now, warningTime, overdueTime) {
    db.all(`
        SELECT * FROM tracked_todos
        WHERE completed = 0
        AND target_date IS NOT NULL
        ORDER BY target_date ASC
    `, (err, todos) => {
        if (err) {
            console.error('❌ Error querying tracked todos:', err);
            return;
        }

        console.log(`📋 Found ${todos.length} active tracked todos`);

        todos.forEach(todo => {
            const todoTime = new Date(todo.target_date);
            const todoId = todo.id;
            const userId = todo.user_id;

            // Check if overdue
            if (todoTime < overdueTime) {
                const minutesOverdue = Math.round((now - todoTime) / (1000 * 60));
                createNotification(
                    'todo_overdue',
                    '🔴 Todo Overdue',
                    `Todo "${todo.text}" was due ${minutesOverdue} minutes ago`,
                    null, // no lead_id for todos
                    todoId,
                    'high',
                    {
                        todoId: todoId,
                        userId: userId,
                        dueTime: todo.target_date,
                        minutesOverdue: minutesOverdue,
                        todoType: todo.todo_type,
                        source: todo.source
                    }
                );
            }
            // Check if due soon (warning)
            else if (todoTime <= warningTime && todoTime > now) {
                const minutesUntilDue = Math.round((todoTime - now) / (1000 * 60));
                createNotification(
                    'todo_due_soon',
                    '⏰ Todo Due Soon',
                    `Todo "${todo.text}" is due in ${minutesUntilDue} minutes`,
                    null,
                    todoId,
                    'medium',
                    {
                        todoId: todoId,
                        userId: userId,
                        dueTime: todo.target_date,
                        minutesUntilDue: minutesUntilDue,
                        todoType: todo.todo_type,
                        source: todo.source
                    }
                );
            }
        });
    });
}

// Check calendar events for notifications
function checkCalendarEvents(now, warningTime, overdueTime) {
    db.all(`
        SELECT * FROM calendar_events
        WHERE date IS NOT NULL
        ORDER BY date ASC, time ASC
    `, (err, events) => {
        if (err) {
            console.error('❌ Error querying calendar events:', err);
            return;
        }

        console.log(`📅 Found ${events.length} calendar events`);

        events.forEach(event => {
            // Combine date and time for comparison
            const eventDateTime = new Date(event.date + 'T' + (event.time || '09:00'));
            const eventId = event.id;
            const userId = event.created_by;

            // Check if overdue
            if (eventDateTime < overdueTime) {
                const minutesOverdue = Math.round((now - eventDateTime) / (1000 * 60));
                createNotification(
                    'event_overdue',
                    '🔴 Event Overdue',
                    `Event "${event.title}" was due ${minutesOverdue} minutes ago`,
                    null,
                    eventId.toString(),
                    'high',
                    {
                        eventId: eventId,
                        userId: userId,
                        dueTime: eventDateTime.toISOString(),
                        minutesOverdue: minutesOverdue,
                        description: event.description,
                        eventType: 'calendar_event'
                    }
                );
            }
            // Check if due soon (warning)
            else if (eventDateTime <= warningTime && eventDateTime > now) {
                const minutesUntilDue = Math.round((eventDateTime - now) / (1000 * 60));
                createNotification(
                    'event_due_soon',
                    '⏰ Event Due Soon',
                    `Event "${event.title}" is due in ${minutesUntilDue} minutes`,
                    null,
                    eventId.toString(),
                    'medium',
                    {
                        eventId: eventId,
                        userId: userId,
                        dueTime: eventDateTime.toISOString(),
                        minutesUntilDue: minutesUntilDue,
                        description: event.description,
                        eventType: 'calendar_event'
                    }
                );
            }
        });
    });
}

// Cleanup old notifications periodically (keep last 7 days)
function cleanupOldNotifications() {
    const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString();

    db.run(`DELETE FROM notifications WHERE created_at < ?`, [sevenDaysAgo], function(err) {
        if (err) {
            console.error('❌ Error cleaning up old notifications:', err);
        } else if (this.changes > 0) {
            console.log(`🧹 Cleaned up ${this.changes} old notifications`);
        }
    });
}

// API for external access (can be called from main server)
const NotificationService = {
    // Get all unread notifications
    getUnreadNotifications: (callback) => {
        db.all(`
            SELECT * FROM notifications
            WHERE read_at IS NULL AND dismissed_at IS NULL
            ORDER BY priority DESC, created_at DESC
        `, callback);
    },

    // Get notifications for specific lead
    getLeadNotifications: (leadId, callback) => {
        db.all(`
            SELECT * FROM notifications
            WHERE lead_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `, [leadId], callback);
    },

    // Mark notification as read
    markAsRead: (notificationId, callback) => {
        db.run(`
            UPDATE notifications
            SET read_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [notificationId], callback);
    },

    // Dismiss notification
    dismissNotification: (notificationId, callback) => {
        db.run(`
            UPDATE notifications
            SET dismissed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [notificationId], callback);
    },

    // Create manual notification
    createManualNotification: createNotification,

    // Get notification stats
    getStats: (callback) => {
        db.all(`
            SELECT
                priority,
                type,
                COUNT(*) as count,
                COUNT(CASE WHEN read_at IS NULL THEN 1 END) as unread_count
            FROM notifications
            WHERE dismissed_at IS NULL
            GROUP BY priority, type
        `, callback);
    }
};

// Start the monitoring service
console.log('⏰ Starting periodic callback monitoring...');
setInterval(checkCallbacks, CHECK_INTERVAL);

// Cleanup old notifications every hour
setInterval(cleanupOldNotifications, 60 * 60 * 1000);

// Initial check
setTimeout(checkCallbacks, 5000); // Start after 5 seconds

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down notification service...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    db.close();
    process.exit(0);
});

// Export for use as module
module.exports = NotificationService;

console.log('✅ Notification service initialized and running');