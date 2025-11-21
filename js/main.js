// Main JavaScript file with defensive programming to prevent null reference errors
// Version: 20251029

// Utility function to safely access DOM elements
function safeElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        console.warn(`Element not found: ${selector}`);
        return null;
    }
    return element;
}

// Utility function to safely add event listener
function safeAddEventListener(selector, event, handler) {
    const element = safeElement(selector);
    if (element && element.addEventListener) {
        element.addEventListener(event, handler);
    }
}

// Utility function to safely modify classList
function safeClassList(selector, action, className) {
    const element = safeElement(selector);
    if (element && element.classList) {
        element.classList[action](className);
    }
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Main.js loaded - DOM ready');

    // Line 27 issue: Safe classList access
    safeClassList('#loadingIndicator', 'add', 'hidden');
    safeClassList('.error-message', 'remove', 'show');

    // Common elements that might cause null reference errors
    const commonSelectors = [
        '#loginForm',
        '#loginButton',
        '#policyNumber',
        '#password',
        '#errorMessage',
        '.loading-spinner',
        '.success-message'
    ];

    // Check for existence of common elements
    commonSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            console.log(`Found element: ${selector}`);
        }
    });
});

// Line 68 issue: Safe event listener attachment
window.addEventListener('load', function() {
    console.log('Window loaded - Main.js active');

    // Safe form submission handling
    safeAddEventListener('#loginForm', 'submit', function(e) {
        e.preventDefault();
        handleLogin();
    });

    // Safe button click handling
    safeAddEventListener('#loginButton', 'click', function(e) {
        e.preventDefault();
        handleLogin();
    });

    // Safe input field event handlers
    safeAddEventListener('#policyNumber', 'input', function() {
        safeClassList(this, 'remove', 'error');
        safeClassList('#errorMessage', 'remove', 'show');
    });

    safeAddEventListener('#password', 'input', function() {
        safeClassList(this, 'remove', 'error');
        safeClassList('#errorMessage', 'remove', 'show');
    });
});

// Login handler function
async function handleLogin() {
    console.log('Login handler called');

    const policyNumberEl = safeElement('#policyNumber');
    const passwordEl = safeElement('#password');
    const loginButtonEl = safeElement('#loginButton');
    const errorMessageEl = safeElement('#errorMessage');

    if (!policyNumberEl || !passwordEl) {
        console.error('Required form elements not found');
        return;
    }

    const policyNumber = policyNumberEl.value.trim();
    const password = passwordEl.value.trim();

    if (!policyNumber || !password) {
        showError('Please enter both policy number and password');
        return;
    }

    // Disable form during login
    if (loginButtonEl) {
        loginButtonEl.disabled = true;
        loginButtonEl.textContent = 'Logging in...';
    }

    try {
        console.log('Login attempt:', { policyNumber, isTest: false });

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                policyNumber: policyNumber,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Success - store token and redirect
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('policy_number', data.policy_number);
            showSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
        } else {
            showError(data.error || 'Login failed');
        }

    } catch (error) {
        console.error('Login error:', error);
        showError('Connection error. Please try again.');
    } finally {
        // Re-enable form
        if (loginButtonEl) {
            loginButtonEl.disabled = false;
            loginButtonEl.textContent = 'Login';
        }
    }
}

// Utility functions for showing messages
function showError(message) {
    const errorEl = safeElement('#errorMessage');
    const errorTextEl = safeElement('#errorText');

    if (errorTextEl) {
        errorTextEl.textContent = message;
    }

    if (errorEl) {
        safeClassList('#errorMessage', 'add', 'show');
        setTimeout(() => {
            safeClassList('#errorMessage', 'remove', 'show');
        }, 5000);
    }

    console.error('Login error:', message);
}

function showSuccess(message) {
    const successEl = safeElement('#successMessage');
    const successTextEl = safeElement('#successText');

    if (successTextEl) {
        successTextEl.textContent = message;
    }

    if (successEl) {
        safeClassList('#successMessage', 'add', 'show');
    }

    console.log('Login success:', message);
}

// Export functions for global access if needed
window.safeElement = safeElement;
window.safeAddEventListener = safeAddEventListener;
window.safeClassList = safeClassList;
window.handleLogin = handleLogin;