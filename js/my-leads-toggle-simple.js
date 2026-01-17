// My Leads Toggle - Simple CSS-based approach
console.log('🚀 Simple My Leads Toggle loading...');

// Global toggle state
window.myLeadsOnlyActive = false;

// Get current user
function getCurrentUser() {
    try {
        const userData = sessionStorage.getItem('vanguard_user');
        if (userData) {
            const user = JSON.parse(userData);
            return user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
        }
    } catch (e) {
        console.warn('Error getting user:', e);
    }
    return '';
}

// Simple toggle function using CSS injection
window.toggleMyLeadsFilter = function(enabled) {
    console.log('🔄 SIMPLE TOGGLE: My Leads Filter:', enabled ? 'ENABLED' : 'DISABLED');
    window.myLeadsOnlyActive = enabled;

    const currentUser = getCurrentUser();
    console.log('👤 Current user:', currentUser);

    // Remove existing style
    const existingStyle = document.getElementById('myLeadsToggleStyle');
    if (existingStyle) {
        existingStyle.remove();
    }

    if (enabled) {
        // Create CSS to hide other users' leads
        const style = document.createElement('style');
        style.id = 'myLeadsToggleStyle';

        // Hide content that comes after other users' headers but before current user's header
        let css = `
            /* Hide content after Carson's header until next header */
            body:has([data-user="Carson"]) [data-user="Carson"] ~ *:not([data-user]):not([data-user="Grant"]):not([data-user="Closed"]) {
                display: none !important;
            }

            /* Hide content after Hunter's header until next header */
            body:has([data-user="Hunter"]) [data-user="Hunter"] ~ *:not([data-user]):not([data-user="Grant"]):not([data-user="Closed"]) {
                display: none !important;
            }
        `;

        // Try a different approach - hide based on text content containing other users' names
        css += `
            /* Hide elements containing Carson's assignments */
            *:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6) {
                &:has-text("Carson"):not(:has-text("Grant")):not(:has-text("${currentUser}")) {
                    display: none !important;
                }
            }

            /* Hide elements containing Hunter's assignments */
            *:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6) {
                &:has-text("Hunter"):not(:has-text("Grant")):not(:has-text("${currentUser}")) {
                    display: none !important;
                }
            }
        `;

        style.textContent = css;
        document.head.appendChild(style);
        console.log('✅ CSS filters applied to hide other users\' leads');
    } else {
        console.log('📋 Showing all leads');
    }

    updateToggleUI(enabled);
};

// Update toggle visual state
function updateToggleUI(enabled) {
    const checkbox = document.getElementById('myLeadsToggle');
    if (checkbox) {
        checkbox.checked = enabled;
    }

    const slider = document.querySelector('#myLeadsToggle + span');
    const dot = slider?.querySelector('span');
    if (slider && dot) {
        if (enabled) {
            slider.style.backgroundColor = '#3b82f6';
            dot.style.transform = 'translateX(16px)';
        } else {
            slider.style.backgroundColor = '#ccc';
            dot.style.transform = 'translateX(0)';
        }
    }
}

// Create toggle HTML
function createToggleHTML() {
    return `
        <div style="display: flex; align-items: center; gap: 6px; margin-right: 8px;">
            <label style="position: relative; display: inline-block; width: 32px; height: 16px;">
                <input type="checkbox" id="myLeadsToggle" onchange="window.toggleMyLeadsFilter(this.checked)"
                       style="opacity: 0; width: 0; height: 0;">
                <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                           background-color: #ccc; border-radius: 16px; transition: .3s;">
                    <span style="position: absolute; content: ''; height: 12px; width: 12px; left: 2px; bottom: 2px;
                               background-color: white; border-radius: 50%; transition: .3s;"></span>
                </span>
            </label>
            <span style="font-size: 0.75rem; color: #374151; white-space: nowrap;">
                <i class="fas fa-user" style="color: #3b82f6; margin-right: 2px;"></i>Mine Only
            </span>
        </div>
    `;
}

// DISABLED - Simple toggle disabled to prevent conflicts with direct toggle
function insertToggle() {
    console.log('⚠️ SIMPLE TOGGLE DISABLED - Using my-leads-toggle-direct.js instead');
    return false;
}

// Start insertion
setTimeout(() => {
    insertToggle();

    // Keep trying if failed
    let attempts = 0;
    const retry = setInterval(() => {
        if (insertToggle() || attempts++ > 10) {
            clearInterval(retry);
        }
    }, 1000);
}, 1000);

// Test function
window.testSimpleToggle = function() {
    console.log('🧪 Testing Simple Toggle');
    console.log('Current user:', getCurrentUser());
    console.log('Toggle active:', window.myLeadsOnlyActive);

    // Try toggling
    window.toggleMyLeadsFilter(!window.myLeadsOnlyActive);
};

console.log('🎯 Simple Toggle loaded - try window.testSimpleToggle()');