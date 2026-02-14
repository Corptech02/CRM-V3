// Notification Sidebar Functionality
(function() {
    'use strict';

    console.log('📬 Loading Notification Sidebar...');

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