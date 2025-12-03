// Session Timeout Manager - Auto-logout after 20 minutes of inactivity
// This helps reduce server load by stopping background processes for inactive users

console.log('Session Timeout Manager: Loading...');

(function() {
    'use strict';

    const TIMEOUT_DURATION = 20 * 60 * 1000; // 20 minutes in milliseconds
    const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before timeout

    let timeoutTimer = null;
    let warningTimer = null;
    let warningModal = null;
    let lastActivity = Date.now();

    // Track all the timers and intervals we need to clear on logout
    const originalSetInterval = window.setInterval;
    const originalSetTimeout = window.setTimeout;
    const activeTimers = new Set();
    const activeIntervals = new Set();

    // Override timer functions to track them
    window.setInterval = function(fn, delay) {
        const id = originalSetInterval.call(window, fn, delay);
        activeIntervals.add(id);
        return id;
    };

    window.setTimeout = function(fn, delay) {
        const id = originalSetTimeout.call(window, fn, delay);
        activeTimers.add(id);
        return id;
    };

    // Activities that reset the timeout
    const activityEvents = [
        'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
    ];

    function resetTimeout() {
        lastActivity = Date.now();

        // Clear existing timers
        if (timeoutTimer) {
            clearTimeout(timeoutTimer);
        }
        if (warningTimer) {
            clearTimeout(warningTimer);
        }

        // Close warning modal if open
        if (warningModal) {
            warningModal.remove();
            warningModal = null;
        }

        // Set warning timer (2 minutes before logout)
        warningTimer = setTimeout(showWarningModal, TIMEOUT_DURATION - WARNING_TIME);

        // Set logout timer (20 minutes)
        timeoutTimer = setTimeout(performLogout, TIMEOUT_DURATION);
    }

    function showWarningModal() {
        console.log('⏰ Showing inactivity warning');

        // Remove any existing warning modal
        if (warningModal) {
            warningModal.remove();
        }

        warningModal = document.createElement('div');
        warningModal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.8) !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 999999 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        `;

        const timeLeft = Math.ceil(WARNING_TIME / 1000);
        let countdown = timeLeft;

        warningModal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
                <div style="color: #f59e0b; font-size: 48px; margin-bottom: 15px;">⏰</div>
                <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 20px;">Session Timeout Warning</h3>
                <p style="color: #6b7280; margin-bottom: 20px; line-height: 1.5;">
                    Your session will expire in <strong id="countdown-timer">${countdown}</strong> seconds due to inactivity.
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="stay-logged-in" style="
                        background: #3b82f6; color: white; border: none; padding: 10px 20px;
                        border-radius: 6px; cursor: pointer; font-weight: 500;
                    ">Stay Logged In</button>
                    <button id="logout-now" style="
                        background: #ef4444; color: white; border: none; padding: 10px 20px;
                        border-radius: 6px; cursor: pointer; font-weight: 500;
                    ">Logout Now</button>
                </div>
            </div>
        `;

        document.body.appendChild(warningModal);

        // Countdown timer
        const countdownEl = warningModal.querySelector('#countdown-timer');
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdownEl) {
                countdownEl.textContent = countdown;
            }
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                performLogout();
            }
        }, 1000);

        // Button handlers
        warningModal.querySelector('#stay-logged-in').addEventListener('click', () => {
            clearInterval(countdownInterval);
            resetTimeout();
            console.log('👤 User chose to stay logged in');
        });

        warningModal.querySelector('#logout-now').addEventListener('click', () => {
            clearInterval(countdownInterval);
            performLogout();
            console.log('👤 User chose to logout now');
        });
    }

    function performLogout() {
        console.log('🔒 Performing automatic logout due to inactivity');

        // Clear all timers and intervals to stop background processes
        activeTimers.forEach(id => clearTimeout(id));
        activeIntervals.forEach(id => clearInterval(id));
        activeTimers.clear();
        activeIntervals.clear();

        // Clear timeout timers
        if (timeoutTimer) clearTimeout(timeoutTimer);
        if (warningTimer) clearTimeout(warningTimer);

        // Clear localStorage session data (but preserve important data)
        const preserveKeys = ['insurance_leads', 'insurance_clients', 'insurance_policies'];
        const dataToPreserve = {};
        preserveKeys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                dataToPreserve[key] = data;
            }
        });

        // Clear session-related localStorage
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
            if (!preserveKeys.includes(key)) {
                localStorage.removeItem(key);
            }
        });

        // Show logout modal
        showLogoutModal();
    }

    function showLogoutModal() {
        // Remove any existing modals
        document.querySelectorAll('[id*="modal"], .modal').forEach(modal => modal.remove());

        const logoutModal = document.createElement('div');
        logoutModal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: #1f2937 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 9999999 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        `;

        logoutModal.innerHTML = `
            <div style="background: white; padding: 40px; border-radius: 12px; max-width: 450px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                <div style="color: #ef4444; font-size: 64px; margin-bottom: 20px;">🔒</div>
                <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 24px;">Session Expired</h2>
                <p style="color: #6b7280; margin-bottom: 25px; line-height: 1.6; font-size: 16px;">
                    Your session has ended due to <strong>20 minutes</strong> of inactivity.
                    This helps reduce server load and protect your data.
                </p>
                <button onclick="window.location.reload()" style="
                    background: #3b82f6; color: white; border: none; padding: 12px 24px;
                    border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 16px;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                ">Click Here to Log Back In</button>
                <p style="color: #9ca3af; font-size: 12px; margin-top: 15px;">
                    Your data has been preserved and will be available after login.
                </p>
            </div>
        `;

        document.body.innerHTML = '';
        document.body.appendChild(logoutModal);
    }

    // Initialize activity tracking
    function initializeActivityTracking() {
        activityEvents.forEach(eventType => {
            document.addEventListener(eventType, resetTimeout, true);
        });

        // Start the initial timeout
        resetTimeout();

        console.log('✅ Session timeout initialized - 20 minute inactivity logout enabled');
    }

    // Start tracking when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeActivityTracking);
    } else {
        initializeActivityTracking();
    }

    // Expose function to manually extend session (for API calls, etc.)
    window.extendSession = function() {
        resetTimeout();
        console.log('🔄 Session extended by user activity');
    };

    console.log('Session Timeout Manager: Loaded successfully');
})();