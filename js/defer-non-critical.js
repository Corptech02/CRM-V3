// Defer Non-Critical Scripts for Better Performance
console.log('⏱️ Deferring non-critical scripts...');

(function() {
    // List of scripts that can be loaded after page is interactive
    const deferredScripts = [
        'js/fix-notification-alignment.js',
        'js/fix-notification-colors.js',
        'js/fix-notification-style.js',
        'js/coi-hover-fix.js',
        'js/coi-inline-style-fix.js',
        'js/email-status-fix-aggressive.js',
        'js/fix-60day-complete-override.js',
        'js/fix-60day-view-persistent.js',
        'js/hide-60day-tab-fully.js',
        'js/hide-log-section.js'
    ];

    // Load scripts after window load
    window.addEventListener('load', () => {
        setTimeout(() => {
            console.log('Loading deferred scripts...');

            deferredScripts.forEach((src, index) => {
                setTimeout(() => {
                    // Check if script already exists
                    const existing = document.querySelector(`script[src="${src}"]`);
                    if (existing) {
                        return;
                    }

                    const script = document.createElement('script');
                    script.src = src;
                    script.async = true;
                    document.body.appendChild(script);
                }, index * 100); // Stagger loading by 100ms
            });
        }, 1000); // Wait 1 second after load
    });

    // Optimize image loading
    const lazyLoadImages = () => {
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            if (!img.complete) {
                img.loading = 'lazy';
            }
        });
    };

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', lazyLoadImages);
    } else {
        lazyLoadImages();
    }

    console.log('✅ Deferred loading configured');
})();