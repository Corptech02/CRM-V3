// ANTI-BLINKING SYSTEM - Prevents rapid style changes that cause blinking
(function() {
    'use strict';

    console.log('🚫 Anti-Blinking System loading...');

    // DISABLE ALL MOUSE EVENT HANDLERS THAT CAUSE BLINKING
    const originalAddEventListener = Element.prototype.addEventListener;
    Element.prototype.addEventListener = function(type, listener, options) {
        // Block mouse events that cause rapid style changes
        if (type === 'mouseover' || type === 'mouseout' || type === 'mouseenter' || type === 'mouseleave') {
            console.log(`🚫 Blocked ${type} event listener to prevent blinking`);
            return;
        }
        return originalAddEventListener.call(this, type, listener, options);
    };

    // Override onmouseover/onmouseout properties to prevent blinking
    Object.defineProperty(Element.prototype, 'onmouseover', {
        set: function(value) {
            console.log('🚫 Blocked onmouseover assignment to prevent blinking');
            // Do nothing - don't assign the handler
        },
        get: function() {
            return null;
        }
    });

    Object.defineProperty(Element.prototype, 'onmouseout', {
        set: function(value) {
            console.log('🚫 Blocked onmouseout assignment to prevent blinking');
            // Do nothing - don't assign the handler
        },
        get: function() {
            return null;
        }
    });

    Object.defineProperty(Element.prototype, 'onmouseenter', {
        set: function(value) {
            console.log('🚫 Blocked onmouseenter assignment to prevent blinking');
            return;
        },
        get: function() {
            return null;
        }
    });

    Object.defineProperty(Element.prototype, 'onmouseleave', {
        set: function(value) {
            console.log('🚫 Blocked onmouseleave assignment to prevent blinking');
            return;
        },
        get: function() {
            return null;
        }
    });

    // Track when elements were last styled to prevent rapid changes
    const lastStyleTime = new WeakMap();
    const STYLE_COOLDOWN = 100; // Minimum time between style changes (ms)

    // Store original style setters
    const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
    const originalRemoveProperty = CSSStyleDeclaration.prototype.removeProperty;
    const originalAddClass = Element.prototype.classList.add;
    const originalRemoveClass = Element.prototype.classList.remove;
    const originalToggleClass = Element.prototype.classList.toggle;

    // Override style.setProperty to prevent rapid changes
    CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
        const element = this.parentNode || this.parentElement;
        if (!element) return originalSetProperty.call(this, property, value, priority);

        const now = Date.now();
        const lastTime = lastStyleTime.get(element) || 0;

        // Skip if too soon since last style change (prevents blinking)
        if (now - lastTime < STYLE_COOLDOWN) {
            console.log(`🚫 Blocked rapid style change on element:`, element);
            return;
        }

        lastStyleTime.set(element, now);
        return originalSetProperty.call(this, property, value, priority);
    };

    // Override classList methods to prevent rapid class changes
    Element.prototype.classList.add = function(...classNames) {
        const now = Date.now();
        const lastTime = lastStyleTime.get(this) || 0;

        if (now - lastTime < STYLE_COOLDOWN) {
            console.log(`🚫 Blocked rapid class addition on element:`, this);
            return;
        }

        lastStyleTime.set(this, now);
        return originalAddClass.apply(this, classNames);
    };

    Element.prototype.classList.remove = function(...classNames) {
        const now = Date.now();
        const lastTime = lastStyleTime.get(this) || 0;

        if (now - lastTime < STYLE_COOLDOWN) {
            console.log(`🚫 Blocked rapid class removal on element:`, this);
            return;
        }

        lastStyleTime.set(this, now);
        return originalRemoveClass.apply(this, classNames);
    };

    Element.prototype.classList.toggle = function(className, force) {
        const now = Date.now();
        const lastTime = lastStyleTime.get(this) || 0;

        if (now - lastTime < STYLE_COOLDOWN) {
            console.log(`🚫 Blocked rapid class toggle on element:`, this);
            return false;
        }

        lastStyleTime.set(this, now);
        return originalToggleClass.call(this, className, force);
    };

    // Additional protection: Override setAttribute for style changes
    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, value) {
        if (name === 'style') {
            const now = Date.now();
            const lastTime = lastStyleTime.get(this) || 0;

            if (now - lastTime < STYLE_COOLDOWN) {
                console.log(`🚫 Blocked rapid style attribute change on element:`, this);
                return;
            }

            lastStyleTime.set(this, now);
        }

        return originalSetAttribute.call(this, name, value);
    };

    // Remove existing mouse handlers and stabilize elements
    setTimeout(() => {
        // Remove all existing mouse handlers that cause blinking
        document.querySelectorAll('*').forEach(element => {
            element.onmouseover = null;
            element.onmouseout = null;
            element.onmouseenter = null;
            element.onmouseleave = null;

            // Remove inline mouse handlers
            element.removeAttribute('onmouseover');
            element.removeAttribute('onmouseout');
            element.removeAttribute('onmouseenter');
            element.removeAttribute('onmouseleave');
        });

        const highlightedElements = document.querySelectorAll([
            '.reach-out-complete',
            '.force-green-highlight',
            '.timestamp-highlight',
            '.priority-lead',
            '[style*="background-color"]',
            '.btn-icon',
            'th'
        ].join(','));

        highlightedElements.forEach(element => {
            // Mark these as stable to prevent future rapid changes
            lastStyleTime.set(element, Date.now() - STYLE_COOLDOWN - 1);
            element.dataset.stabilized = 'true';
        });

        console.log(`✅ Removed mouse handlers and stabilized ${highlightedElements.length} elements to prevent blinking`);
    }, 1000);

    console.log('✅ Anti-Blinking System loaded - Style changes throttled to prevent blinking');
})();