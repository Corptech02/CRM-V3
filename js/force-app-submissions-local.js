// Force App Submissions to load from localStorage when server is down
(function() {
    'use strict';

    console.log('🔧 Force App Submissions Local loading...');

    // Wait for appSubmissions to be available
    const waitForAppSubmissions = () => {
        if (window.appSubmissions && window.appSubmissions.loadSubmissions) {
            console.log('📦 AppSubmissions found, overriding loadSubmissions...');

            // Store original function
            const originalLoadSubmissions = window.appSubmissions.loadSubmissions.bind(window.appSubmissions);

            // Override to skip server and use localStorage
            window.appSubmissions.loadSubmissions = async function() {
                console.log('🔄 Loading submissions from localStorage (server bypassed)...');

                try {
                    // Load directly from localStorage
                    this.submissions = JSON.parse(localStorage.getItem('appSubmissions') || '[]');
                    console.log('✅ Loaded from localStorage:', this.submissions.length, 'submissions');

                    return Promise.resolve();
                } catch (error) {
                    console.error('❌ Error loading from localStorage:', error);
                    this.submissions = [];
                    return Promise.reject(error);
                }
            };

            console.log('✅ App Submissions now loads from localStorage only');
        } else {
            // Try again in a bit
            setTimeout(waitForAppSubmissions, 100);
        }
    };

    waitForAppSubmissions();

})();