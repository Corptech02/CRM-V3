// Critical Performance Fix - Stop aggressive intervals
console.log('🚀 Applying critical performance fixes...');

(function() {
    // Track and clear all intervals
    const originalSetInterval = window.setInterval;
    const activeIntervals = new Set();

    // Override setInterval to track all intervals
    window.setInterval = function(callback, delay, ...args) {
        // Block aggressive intervals (anything under 1000ms)
        if (delay < 1000) {
            console.warn(`⚠️ Blocked aggressive interval with ${delay}ms delay`);
            // Increase to minimum 5 seconds for non-critical operations
            delay = 5000;
        }

        const intervalId = originalSetInterval.call(window, callback, delay, ...args);
        activeIntervals.add(intervalId);
        console.log(`Interval registered: ${intervalId} with ${delay}ms delay`);
        return intervalId;
    };

    // Clear existing aggressive intervals
    function clearAggressiveIntervals() {
        // Get all possible interval IDs (usually sequential)
        for (let i = 1; i < 1000; i++) {
            try {
                clearInterval(i);
            } catch(e) {}
        }
        console.log('✅ Cleared all existing intervals');
    }

    // Debounce DOM updates
    const domUpdateQueue = new Map();
    const processDOMUpdates = _.debounce(() => {
        domUpdateQueue.forEach((update, key) => {
            try {
                update();
            } catch(e) {
                console.error('DOM update error:', e);
            }
        });
        domUpdateQueue.clear();
    }, 100);

    window.queueDOMUpdate = function(key, updateFn) {
        domUpdateQueue.set(key, updateFn);
        processDOMUpdates();
    };

    // Optimize localStorage access
    const localStorageCache = new Map();
    let cacheTimer = null;

    const originalGetItem = localStorage.getItem;
    const originalSetItem = localStorage.setItem;

    localStorage.getItem = function(key) {
        if (localStorageCache.has(key)) {
            return localStorageCache.get(key);
        }
        const value = originalGetItem.call(localStorage, key);
        localStorageCache.set(key, value);

        // Clear cache after 2 seconds
        if (cacheTimer) clearTimeout(cacheTimer);
        cacheTimer = setTimeout(() => localStorageCache.clear(), 2000);

        return value;
    };

    localStorage.setItem = function(key, value) {
        localStorageCache.set(key, value);
        return originalSetItem.call(localStorage, key, value);
    };

    // Throttle expensive operations
    const throttledFunctions = new Map();
    window.throttleFunction = function(name, fn, delay = 1000) {
        if (!throttledFunctions.has(name)) {
            throttledFunctions.set(name, _.throttle(fn, delay, {
                leading: true,
                trailing: true
            }));
        }
        return throttledFunctions.get(name);
    };

    // Fix specific performance killers
    function fixPerformanceKillers() {
        // Disable continuous text replacement
        if (window.replaceTextNodes) {
            window.replaceTextNodes = function() {
                // Disabled - was running continuously
                return;
            };
        }

        // Fix 60-day view updates
        if (window.updateTo60DayView) {
            const original = window.updateTo60DayView;
            window.updateTo60DayView = _.throttle(original, 5000);
        }

        // Fix localStorage cleanup
        if (window.continuousCleanup) {
            window.continuousCleanup = _.throttle(window.continuousCleanup, 10000);
        }

        // Fix email function overrides
        if (window.overrideAllEmailFunctions) {
            const original = window.overrideAllEmailFunctions;
            window.overrideAllEmailFunctions = _.once(original);
        }
    }

    // Apply fixes after page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                clearAggressiveIntervals();
                fixPerformanceKillers();
            }, 1000);
        });
    } else {
        setTimeout(() => {
            clearAggressiveIntervals();
            fixPerformanceKillers();
        }, 100);
    }

    // Monitor performance
    let lastCheck = Date.now();
    setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastCheck;
        if (elapsed > 1100) {
            console.warn(`⚠️ Main thread blocked for ${elapsed - 1000}ms`);
        }
        lastCheck = now;
    }, 1000);

    console.log('✅ Performance fixes applied');
})();