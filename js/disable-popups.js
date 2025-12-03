// Disable unwanted popup notifications
console.log('🚫 Disabling unwanted popup notifications');

// Override showNotification to prevent popups
const originalShowNotification = window.showNotification;
window.showNotification = function(message, type) {
    // Only log to console, don't show popup
    console.log(`[${type}] ${message}`);

    // Optionally allow certain critical notifications
    const allowedMessages = [
        'Gmail connected',
        'Error',
        'Failed'
    ];

    const shouldShow = allowedMessages.some(allowed =>
        message.toLowerCase().includes(allowed.toLowerCase())
    );

    if (shouldShow && originalShowNotification) {
        // Show only critical notifications
        originalShowNotification(message, type);
    }
};

// Remove any existing notification elements
function removeExistingNotifications() {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(n => n.remove());
}

// Clean up on load
document.addEventListener('DOMContentLoaded', removeExistingNotifications);

// Clean up periodically - DISABLED to prevent DOM manipulation flickering
// setInterval(removeExistingNotifications, 5000);

// Also hide notification styles if they're too intrusive
const style = document.createElement('style');
style.textContent = `
    .notification:not(.critical) {
        display: none !important;
    }
`;
document.head.appendChild(style);

console.log('✅ Popup notifications disabled');