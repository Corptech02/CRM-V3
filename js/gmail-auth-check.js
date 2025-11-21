// Gmail Authentication Check - Server-side verification
console.log('Gmail Auth Check loading...');

// Check Gmail authentication status from server
async function checkGmailAuth() {
    // Use the main Vanguard API
    const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:8897'
        : `http://${window.location.hostname}:8897`;

    try {
        const response = await fetch(`${API_URL}/api/gmail/status`);
        if (response.ok) {
            const data = await response.json();
            if (data.connected) {
                // Set local flag for UI purposes only
                localStorage.setItem('gmail_connected', 'true');
                localStorage.setItem('gmail_email', data.email || 'corptech06@gmail.com');
                console.log('Gmail is authenticated on server:', data.email);
                return true;
            } else {
                console.log('Gmail not authenticated:', data.error);
            }
        }
    } catch (error) {
        console.error('Error checking Gmail auth:', error);
    }

    // Not authenticated
    localStorage.removeItem('gmail_connected');
    localStorage.removeItem('gmail_email');
    return false;
}

// Check on page load
window.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await checkGmailAuth();
    if (isAuthenticated) {
        console.log('Gmail integration ready');
    } else {
        console.log('Gmail needs authentication - visit /gmail-auth.html');
    }
});

// Export for use in other scripts
window.checkGmailAuth = checkGmailAuth;