// Disable Heavy Scripts for Performance
console.log('🔧 Disabling heavy background scripts...');

// List of scripts that cause performance issues
const heavyScripts = [
    'localStorage-interceptor.js',
    'nuclear-60day-text-replacement.js',
    'fix-60day-view-persistent.js',
    'coi-email-compose-override.js',
    'force-buttons-on-load.js',
    'fix-loading-overlay.js',
    'nuclear-checkbox-timestamp-fix.js',
    'finalize-renewal-green-card.js',
    'absolute-save-button.js',
    'add-save-button-properly.js',
    'save-button-in-profile.js',
    'force-save-button-v2.js',
    'add-sync-button.js',
    'make-fields-editable.js'
];

// Block these scripts from running their intervals
heavyScripts.forEach(script => {
    // Try to disable any global functions these scripts might have created
    const functionName = script.replace(/-/g, '_').replace('.js', '');
    if (window[functionName]) {
        console.log(`Disabled function: ${functionName}`);
        window[functionName] = function() { return; };
    }
});

// Specifically disable known problematic functions
const problematicFunctions = [
    'continuousCleanup',
    'replaceTextNodes',
    'updateTo60DayView',
    'overrideAllEmailFunctions',
    'forceButtonsOnLoad',
    'addSaveButtonContinuously',
    'monitorAndReplace',
    'continuouslyCheckRenewals',
    'syncButtonChecker'
];

problematicFunctions.forEach(fnName => {
    if (typeof window[fnName] === 'function') {
        console.log(`✅ Disabled heavy function: ${fnName}`);
        window[fnName] = function() { return; };
    }
});

console.log('✅ Heavy scripts disabled for better performance');