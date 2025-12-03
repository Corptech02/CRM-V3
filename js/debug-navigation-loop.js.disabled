// DEBUG NAVIGATION LOOP - Find the real cause
console.log('🐛 Loading navigation loop debugger...');

// Track all navigation events
let navigationEvents = [];

function logEvent(event, details) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${event}: ${details}`;
    navigationEvents.push(logEntry);
    console.log(`🐛 ${logEntry}`);

    // Keep only last 20 events
    if (navigationEvents.length > 20) {
        navigationEvents.shift();
    }
}

// Monitor all function calls that might affect navigation
const functionsToMonitor = [
    'showCertificateHolders',
    'viewPolicyProfileCOI',
    'backToPolicyList',
    'viewPolicyProfile',
    'loadPolicyList'
];

functionsToMonitor.forEach(funcName => {
    if (window[funcName]) {
        const original = window[funcName];
        window[funcName] = function(...args) {
            logEvent(`FUNCTION_CALL`, `${funcName}(${args.map(a => JSON.stringify(a)).join(', ')})`);

            // Log current view before function call
            const policyViewer = document.getElementById('policyViewer');
            if (policyViewer) {
                const currentView = policyViewer.innerHTML.includes('certificate-holders-panel') ? 'Certificate Holders' :
                                 policyViewer.innerHTML.includes('Policy Profile') ? 'Policy Profile' :
                                 policyViewer.innerHTML.includes('policy-list') ? 'Policy List' : 'Unknown';
                logEvent(`BEFORE_${funcName}`, `Current view: ${currentView}`);
            }

            const result = original.apply(this, args);

            // Log view after function call
            setTimeout(() => {
                if (policyViewer) {
                    const newView = policyViewer.innerHTML.includes('certificate-holders-panel') ? 'Certificate Holders' :
                                  policyViewer.innerHTML.includes('Policy Profile') ? 'Policy Profile' :
                                  policyViewer.innerHTML.includes('policy-list') ? 'Policy List' : 'Unknown';
                    logEvent(`AFTER_${funcName}`, `New view: ${newView}`);
                }
            }, 100);

            return result;
        };
        logEvent(`MONITOR_SETUP`, `Monitoring ${funcName}`);
    }
});

// Monitor ALL button clicks in policy viewer
document.addEventListener('click', function(e) {
    const button = e.target.closest('button');
    if (!button) return;

    const policyViewer = document.getElementById('policyViewer');
    if (!policyViewer || !policyViewer.contains(button)) return;

    const buttonText = button.textContent?.trim() || '';
    const buttonClass = button.className || '';
    const buttonTitle = button.title || '';
    const buttonOnclick = button.getAttribute('onclick') || '';

    logEvent(`BUTTON_CLICK`, `Text: "${buttonText}", Class: "${buttonClass}", Title: "${buttonTitle}", Onclick: "${buttonOnclick.substring(0, 100)}..."`);

    // Log current view
    const currentView = policyViewer.innerHTML.includes('certificate-holders-panel') ? 'Certificate Holders' :
                       policyViewer.innerHTML.includes('Policy Profile') ? 'Policy Profile' :
                       policyViewer.innerHTML.includes('policy-list') ? 'Policy List' : 'Unknown';
    logEvent(`CLICK_CONTEXT`, `Current view: ${currentView}`);

}, true);

// Monitor DOM changes in policy viewer
if (window.MutationObserver) {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.target.id === 'policyViewer') {
                const newView = mutation.target.innerHTML.includes('certificate-holders-panel') ? 'Certificate Holders' :
                              mutation.target.innerHTML.includes('Policy Profile') ? 'Policy Profile' :
                              mutation.target.innerHTML.includes('policy-list') ? 'Policy List' : 'Unknown';
                logEvent(`DOM_CHANGE`, `Policy viewer changed to: ${newView}`);
            }
        });
    });

    const policyViewer = document.getElementById('policyViewer');
    if (policyViewer) {
        observer.observe(policyViewer, { childList: true, subtree: true });
        logEvent(`MONITOR_SETUP`, `Monitoring DOM changes in policyViewer`);
    }
}

// Monitor setTimeout/setInterval calls that might cause automatic navigation
const originalSetTimeout = window.setTimeout;
window.setTimeout = function(func, delay, ...args) {
    if (typeof func === 'function') {
        const funcString = func.toString();
        if (funcString.includes('showCertificateHolders') ||
            funcString.includes('viewPolicyProfile') ||
            funcString.includes('backToPolicyList')) {
            logEvent(`TIMEOUT_SET`, `Delay: ${delay}ms, Function contains navigation code`);
        }
    }
    return originalSetTimeout.call(this, func, delay, ...args);
};

// Monitor hash changes
window.addEventListener('hashchange', function(e) {
    logEvent(`HASH_CHANGE`, `From: ${e.oldURL} To: ${e.newURL}`);
});

// Monitor popstate events
window.addEventListener('popstate', function(e) {
    logEvent(`POPSTATE`, `State: ${JSON.stringify(e.state)}`);
});

// Add debug function to window for manual inspection
window.debugNavigation = function() {
    console.log('🐛 NAVIGATION DEBUG REPORT:');
    console.log('Recent events:');
    navigationEvents.forEach(event => console.log(event));

    const policyViewer = document.getElementById('policyViewer');
    if (policyViewer) {
        const currentView = policyViewer.innerHTML.includes('certificate-holders-panel') ? 'Certificate Holders' :
                           policyViewer.innerHTML.includes('Policy Profile') ? 'Policy Profile' :
                           policyViewer.innerHTML.includes('policy-list') ? 'Policy List' : 'Unknown';
        console.log(`Current view: ${currentView}`);
        console.log('Policy viewer HTML preview:', policyViewer.innerHTML.substring(0, 200) + '...');
    }

    console.log('Session storage:', Object.keys(sessionStorage).map(key => `${key}: ${sessionStorage.getItem(key)}`));
};

logEvent(`DEBUG_LOADED`, `Navigation loop debugger ready. Use debugNavigation() to see report.`);

console.log('🐛 NAVIGATION DEBUGGER LOADED');
console.log('🐛 Now reproduce the issue: Certificate Holders → Policy Profile → Back');
console.log('🐛 Then run: debugNavigation() to see what happened');