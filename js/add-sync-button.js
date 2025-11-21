/**
 * Add Sync Vicidial Button - Ensures button is always visible
 */

// Function to add the sync button if it doesn't exist
function ensureSyncButton() {
    // Check if we're on the Lead Management page
    const leadsView = document.querySelector('.leads-view');
    if (!leadsView) return;
    
    const headerActions = leadsView.querySelector('.header-actions');
    if (!headerActions) return;
    
    // Check if button already exists and remove any with onclick attributes
    const existingButtons = Array.from(headerActions.querySelectorAll('button')).filter(
        btn => btn.textContent.includes('Sync Vicidial')
    );

    // Remove any existing buttons (especially ones with onclick attributes)
    existingButtons.forEach(btn => {
        console.log('Removing existing sync button with onclick:', btn.onclick);
        btn.remove();
    });
    
    // Create the sync button (ensure no onclick attribute)
    const syncButton = document.createElement('button');
    syncButton.className = 'btn-primary';
    syncButton.style.cssText = 'background: #10b981; border-color: #10b981; margin-right: 10px;';
    syncButton.innerHTML = '<i class="fas fa-sync"></i> Sync Vicidial Now';

    // Ensure no onclick attribute exists
    syncButton.removeAttribute('onclick');

    // Use addEventListener instead of onclick to avoid reference errors
    syncButton.addEventListener('click', function() {
        console.log('🔄 Sync button clicked, checking for function...');
        // Wait for the selective sync to be loaded and call it properly
        if (typeof window.syncVicidialLeads === 'function') {
            console.log('✅ Found syncVicidialLeads function, calling it');
            window.syncVicidialLeads();
        } else {
            console.log('⏳ Waiting for syncVicidialLeads to load...');
            // Try waiting a bit and retry
            setTimeout(() => {
                if (typeof window.syncVicidialLeads === 'function') {
                    console.log('✅ Found syncVicidialLeads after wait, calling it');
                    window.syncVicidialLeads();
                } else {
                    console.error('❌ syncVicidialLeads function still not found after wait');
                    alert('ViciDial sync module is still loading. Please try again in a moment or refresh the page.');
                }
            }, 1000);
        }
    });

    // Defensively override any onclick that might be set by other scripts
    Object.defineProperty(syncButton, 'onclick', {
        get: function() { return null; },
        set: function(value) {
            console.warn('Attempted to set onclick on sync button - blocked:', value);
            return false;
        }
    });

    // Add mutation observer to prevent onclick attributes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'onclick') {
                console.warn('Detected onclick attribute being set, removing it');
                syncButton.removeAttribute('onclick');
            }
        });
    });

    observer.observe(syncButton, {
        attributes: true,
        attributeFilter: ['onclick']
    });

    // Insert as first button
    headerActions.insertBefore(syncButton, headerActions.firstChild);

    // Periodic cleanup of onclick attributes
    setInterval(() => {
        if (syncButton && syncButton.hasAttribute('onclick')) {
            console.warn('Found onclick attribute on sync button, removing it');
            syncButton.removeAttribute('onclick');
        }
    }, 100);

    console.log('✅ Sync button created with protection against onclick attributes');

    console.log('✅ Sync Vicidial button added to Lead Management');
}

// Check for button on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initial check
    setTimeout(ensureSyncButton, 1000);
    
    // Check periodically in case the view changes
    setInterval(ensureSyncButton, 2000);
});

// Also check when clicking on Lead Management
document.addEventListener('click', function(e) {
    if (e.target.textContent && e.target.textContent.includes('Lead Management')) {
        setTimeout(ensureSyncButton, 500);
    }
});

// Create a temporary global function to prevent ReferenceError
// This will be overridden by the real function from selective-vicidial-sync-clean.js
if (typeof window.syncVicidialLeads === 'undefined') {
    window.syncVicidialLeads = function() {
        console.log('🔄 Temporary syncVicidialLeads called, checking for real function...');

        // Check immediately first
        if (typeof window.syncVicidialLeads === 'function' && window.syncVicidialLeads !== arguments.callee) {
            console.log('✅ Found real syncVicidialLeads function immediately, calling it');
            window.syncVicidialLeads();
            return;
        }

        console.log('⏳ Real function not ready, waiting 2 seconds...');
        // Wait longer and try to call the real function
        setTimeout(() => {
            console.log('🔍 Checking again for real syncVicidialLeads function...');
            console.log('Current function:', typeof window.syncVicidialLeads, window.syncVicidialLeads === arguments.callee ? 'still temporary' : 'real function found');

            if (typeof window.syncVicidialLeads === 'function' && window.syncVicidialLeads !== arguments.callee) {
                console.log('✅ Found real syncVicidialLeads function after wait, calling it');
                window.syncVicidialLeads();
            } else {
                console.error('❌ Real syncVicidialLeads function not loaded after wait');
                console.log('All available functions:', Object.keys(window).filter(key => key.toLowerCase().includes('sync')));
                alert('ViciDial sync module failed to load. Please refresh the page and try again.');
            }
        }, 2000);
    };
    console.log('📝 Temporary syncVicidialLeads function created');
}

console.log('✅ Sync button helper loaded - Button will appear in Lead Management');