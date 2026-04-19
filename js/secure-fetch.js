// Secure Fetch Wrapper — injects JWT into all API requests
// Must be loaded BEFORE app.js in index.html
(function() {
    'use strict';
    const TOKEN_KEY = 'vanguard_jwt';
    const originalFetch = window.fetch;

    window.fetch = function(url, options) {
        options = options || {};
        const token = sessionStorage.getItem(TOKEN_KEY);
        const urlStr = typeof url === 'string' ? url : (url instanceof Request ? url.url : '');

        // Only inject auth header for our own API calls
        if (token && urlStr.includes('/api/') && !urlStr.includes('/api/auth/login')) {
            if (options.headers instanceof Headers) {
                if (!options.headers.has('Authorization')) {
                    options.headers.set('Authorization', 'Bearer ' + token);
                }
            } else {
                options.headers = Object.assign({}, options.headers || {});
                if (!options.headers['Authorization']) {
                    options.headers['Authorization'] = 'Bearer ' + token;
                }
            }
        }

        return originalFetch.call(this, url, options).then(function(response) {
            // Auto-redirect to login on 401 from any API call
            if (response.status === 401 && urlStr.includes('/api/') && !urlStr.includes('/api/auth/')) {
                console.warn('🔒 Session expired — redirecting to login');
                sessionStorage.removeItem(TOKEN_KEY);
                sessionStorage.removeItem('vanguard_user');
                var portal = localStorage.getItem('vanguard_login_portal');
                window.location.href = (portal === 'united') ? '/login-united.html' : '/login.html';
            }
            return response;
        });
    };

    // Auto-refresh token every 30 minutes if active
    setInterval(function() {
        var token = sessionStorage.getItem(TOKEN_KEY);
        if (!token) return;
        originalFetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        }).then(function(res) { return res.json(); })
          .then(function(data) {
              if (data.token) sessionStorage.setItem(TOKEN_KEY, data.token);
          })
          .catch(function() { /* silent — next API call will trigger re-login if expired */ });
    }, 30 * 60 * 1000);
})();
