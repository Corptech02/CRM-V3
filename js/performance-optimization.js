// Performance Optimization Script
console.log('⚡ Applying performance optimizations...');

(function() {
    // 1. Remove duplicate event listeners
    const cleanupDuplicateListeners = () => {
        // Get all elements with onclick attributes
        const elements = document.querySelectorAll('[onclick]');
        const uniqueHandlers = new Map();

        elements.forEach(el => {
            const handler = el.getAttribute('onclick');
            const key = el.tagName + handler;

            if (uniqueHandlers.has(key)) {
                // Remove duplicate
                el.removeAttribute('onclick');
            } else {
                uniqueHandlers.set(key, true);
            }
        });
    };

    // 2. Debounce frequently called functions
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // 3. Optimize localStorage access
    const cacheStorage = new Map();
    const originalGetItem = localStorage.getItem;
    const originalSetItem = localStorage.setItem;

    localStorage.getItem = function(key) {
        if (cacheStorage.has(key)) {
            return cacheStorage.get(key);
        }
        const value = originalGetItem.call(this, key);
        cacheStorage.set(key, value);
        return value;
    };

    localStorage.setItem = function(key, value) {
        cacheStorage.set(key, value);
        return originalSetItem.call(this, key, value);
    };

    // 4. Batch DOM updates
    let pendingUpdates = [];
    let updateScheduled = false;

    window.batchDOMUpdate = function(updateFn) {
        pendingUpdates.push(updateFn);

        if (!updateScheduled) {
            updateScheduled = true;
            requestAnimationFrame(() => {
                pendingUpdates.forEach(fn => fn());
                pendingUpdates = [];
                updateScheduled = false;
            });
        }
    };

    // 5. Clean up after page load
    window.addEventListener('load', () => {
        // Remove loading indicators
        const loadingElements = document.querySelectorAll('.loading, .spinner, [class*="loading"]');
        loadingElements.forEach(el => {
            if (el.style.display !== 'none') {
                el.style.display = 'none';
            }
        });

        // Clean up duplicate listeners
        cleanupDuplicateListeners();

        // Clear old console logs
        if (console.clear) {
            console.clear();
        }

        console.log('✅ Performance optimizations applied');
    });

    // 6. Prevent memory leaks from multiple viewLead overrides
    const cleanupViewLeadOverrides = () => {
        // Keep only the last override
        const lastViewLead = window.viewLead;

        // Clear all stored references
        window.originalViewLead = undefined;
        window.enhancedViewLead = undefined;
        window.fixedViewLead = undefined;

        // Set the final version
        window.viewLead = lastViewLead;
    };

    setTimeout(cleanupViewLeadOverrides, 2000);

})();

console.log('⚡ Performance optimization script loaded');