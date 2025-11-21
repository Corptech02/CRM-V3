// Authentication Check - Protects the main application
console.log('🔒 Authentication check active');

(function() {
    // Check authentication on page load
    function checkAuth() {
        const isLoggedIn = localStorage.getItem('vanguard_logged_in');
        const sessionExpiry = localStorage.getItem('vanguard_session_expiry');
        const userEmail = localStorage.getItem('vanguard_user_email');

        // Check if we're on login page
        if (window.location.pathname.includes('secure-login.html') || window.location.pathname.includes('login.html')) {
            // Already on login page, don't redirect
            return;
        }

        // Check if logged in and session is valid
        if (isLoggedIn === 'true' && sessionExpiry) {
            const now = new Date().getTime();
            if (now < parseInt(sessionExpiry)) {
                // Valid session - update UI with user info
                updateUserInterface(userEmail);
                return;
            } else {
                // Session expired
                console.log('Session expired, redirecting to login');
                clearSession();
            }
        } else {
            // Not logged in
            console.log('Not logged in, redirecting to login');
            redirectToLogin();
        }
    }

    function updateUserInterface(email) {
        // Update user info in the UI
        const userNameElements = document.querySelectorAll('.user-name');
        const userEmailElements = document.querySelectorAll('.user-email');

        userNameElements.forEach(el => {
            el.textContent = email.split('@')[0];
        });

        userEmailElements.forEach(el => {
            el.textContent = email;
        });

        // Add logout button if it doesn't exist
        addLogoutButton();
    }

    function addLogoutButton() {
        // Check if logout button already exists
        if (document.getElementById('logoutBtn')) {
            return;
        }

        // Find the header or appropriate location
        const headerActions = document.querySelector('.header-actions');
        const navbar = document.querySelector('.navbar');
        const sidebar = document.querySelector('.sidebar');

        // Create logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'btn-logout';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutBtn.style.cssText = `
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            margin-left: auto;
            transition: all 0.3s;
        `;

        logoutBtn.onmouseover = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
        };

        logoutBtn.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        };

        logoutBtn.onclick = function() {
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        };

        // Add to appropriate location
        if (headerActions) {
            headerActions.appendChild(logoutBtn);
        } else if (navbar) {
            navbar.appendChild(logoutBtn);
        } else if (sidebar) {
            // Add to bottom of sidebar
            const logoutContainer = document.createElement('div');
            logoutContainer.style.cssText = 'padding: 20px; margin-top: auto; border-top: 1px solid #e5e7eb;';
            logoutContainer.appendChild(logoutBtn);
            sidebar.appendChild(logoutContainer);
        } else {
            // Fallback - add to body
            logoutBtn.style.position = 'fixed';
            logoutBtn.style.top = '20px';
            logoutBtn.style.right = '20px';
            logoutBtn.style.zIndex = '9999';
            document.body.appendChild(logoutBtn);
        }
    }

    function logout() {
        console.log('Logging out...');
        clearSession();
        redirectToLogin();
    }

    function clearSession() {
        localStorage.removeItem('vanguard_logged_in');
        localStorage.removeItem('vanguard_session_expiry');
        localStorage.removeItem('vanguard_user_email');
    }

    function redirectToLogin() {
        window.location.href = 'secure-login.html';
    }

    // Session timeout check (every minute)
    setInterval(function() {
        const sessionExpiry = localStorage.getItem('vanguard_session_expiry');
        if (sessionExpiry) {
            const now = new Date().getTime();
            if (now >= parseInt(sessionExpiry)) {
                alert('Your session has expired. Please login again.');
                clearSession();
                redirectToLogin();
            }
        }
    }, 60000); // Check every minute

    // Activity-based session extension
    let lastActivity = new Date().getTime();

    function extendSession() {
        const now = new Date().getTime();

        // Only extend if user has been active in the last 5 minutes
        if (now - lastActivity < 5 * 60 * 1000) {
            const newExpiry = now + (24 * 60 * 60 * 1000); // Extend by 24 hours
            localStorage.setItem('vanguard_session_expiry', newExpiry.toString());
        }

        lastActivity = now;
    }

    // Track user activity
    document.addEventListener('click', extendSession);
    document.addEventListener('keypress', extendSession);
    document.addEventListener('scroll', extendSession);

    // Make logout function globally available
    window.logout = logout;

    // Check authentication on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAuth);
    } else {
        checkAuth();
    }

    console.log('✅ Authentication system initialized');
})();