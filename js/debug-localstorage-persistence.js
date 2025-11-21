// Debug localStorage persistence for appSubmissions
(function() {
    'use strict';

    console.log('🔍 DEBUG: Checking localStorage persistence...');

    // Check current appSubmissions data
    const checkAppSubmissions = () => {
        const data = localStorage.getItem('appSubmissions');
        console.log('🗂️ Current appSubmissions localStorage data:');
        console.log('  - Exists:', data !== null);
        console.log('  - Length:', data ? data.length : 0);
        console.log('  - Content preview:', data ? data.substring(0, 200) + '...' : 'null');

        if (data) {
            try {
                const parsed = JSON.parse(data);
                console.log('  - Parsed length:', parsed.length);
                console.log('  - Lead IDs:', parsed.map(app => app.leadId));
            } catch (e) {
                console.error('  - Parse error:', e.message);
            }
        }
    };

    // Check immediately
    checkAppSubmissions();

    // Monitor for changes to appSubmissions
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        if (key === 'appSubmissions') {
            console.log('📝 localStorage.setItem("appSubmissions") called');
            console.log('  - New value length:', value.length);
            console.log('  - New value preview:', value.substring(0, 200) + '...');

            try {
                const parsed = JSON.parse(value);
                console.log('  - New parsed length:', parsed.length);
                console.log('  - New lead IDs:', parsed.map(app => app.leadId));
            } catch (e) {
                console.error('  - New value parse error:', e.message);
            }
        }
        return originalSetItem.call(this, key, value);
    };

    // Also monitor any clears or removes
    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = function(key) {
        if (key === 'appSubmissions') {
            console.log('🗑️ localStorage.removeItem("appSubmissions") called');
            console.trace('Remove called from:');
        }
        return originalRemoveItem.call(this, key);
    };

    const originalClear = localStorage.clear;
    localStorage.clear = function() {
        console.log('💥 localStorage.clear() called');
        console.trace('Clear called from:');
        return originalClear.call(this);
    };

    // Check again after a delay to see if anything changes
    setTimeout(() => {
        console.log('🔍 DEBUG: Checking localStorage after 5 seconds...');
        checkAppSubmissions();
    }, 5000);

    console.log('✅ localStorage monitoring active');

})();