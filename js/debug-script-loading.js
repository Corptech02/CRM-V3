// Debug Script Loading Test
console.log('🔍 DEBUG-SCRIPT-LOADING: Starting script loading test...');

// Test 1: Check if functions exist immediately
setTimeout(() => {
    console.log('🔍 IMMEDIATE CHECK:', {
        'window.createEnhancedProfile': typeof window.createEnhancedProfile,
        'window.showLeadProfile': typeof window.showLeadProfile,
        'window.openEmailDocumentation': typeof window.openEmailDocumentation,
        'window.checkFilesAndOpenEmail': typeof window.checkFilesAndOpenEmail,
        'window.openLossRunsUpload': typeof window.openLossRunsUpload
    });
}, 100);

// Test 2: Check if DOM is ready
setTimeout(() => {
    console.log('🔍 DOM READY CHECK:', {
        'document.readyState': document.readyState,
        'window.createEnhancedProfile': typeof window.createEnhancedProfile,
        'window.showLeadProfile': typeof window.showLeadProfile
    });
}, 500);

// Test 3: Check if all scripts loaded
setTimeout(() => {
    console.log('🔍 FINAL CHECK:', {
        'window.createEnhancedProfile': typeof window.createEnhancedProfile,
        'window.showLeadProfile': typeof window.showLeadProfile,
        'window.openEmailDocumentation': typeof window.openEmailDocumentation,
        'window.checkFilesAndOpenEmail': typeof window.checkFilesAndOpenEmail,
        'window.openLossRunsUpload': typeof window.openLossRunsUpload
    });

    // Try to manually create the enhanced profile function if it's missing
    if (typeof window.createEnhancedProfile === 'undefined') {
        console.log('🚨 CRITICAL: createEnhancedProfile is undefined - attempting to reload');

        // Try to manually load the script
        const script = document.createElement('script');
        script.src = 'js/final-profile-fix.js?v=' + Date.now();
        script.onload = () => {
            console.log('🔄 MANUAL RELOAD: Script loaded');
            setTimeout(() => {
                console.log('🔄 MANUAL RELOAD CHECK:', {
                    'window.createEnhancedProfile': typeof window.createEnhancedProfile,
                    'window.showLeadProfile': typeof window.showLeadProfile
                });
            }, 100);
        };
        script.onerror = () => {
            console.log('❌ MANUAL RELOAD: Script failed to load');
        };
        document.head.appendChild(script);
    }
}, 2000);

console.log('🔍 DEBUG-SCRIPT-LOADING: Test script loaded');