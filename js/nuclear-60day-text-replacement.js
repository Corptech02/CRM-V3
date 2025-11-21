// NUCLEAR Text Replacement - Force 60 Days Everywhere
console.log('☢️ NUCLEAR: Forcing 60-day text replacement everywhere...');

(function() {
    // Function to replace all text instances
    function replaceAll30With60() {
        // Replace in all text nodes
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            if (node.nodeValue) {
                // Replace various formats
                if (node.nodeValue.includes('30 Days') ||
                    node.nodeValue.includes('30 days') ||
                    node.nodeValue.includes('Month View') ||
                    node.nodeValue.includes('Monthly Renewals')) {

                    node.nodeValue = node.nodeValue
                        .replace(/Within 30 Days/gi, 'Within 60 Days')
                        .replace(/30 Days/gi, '60 Days')
                        .replace(/30 days/gi, '60 days')
                        .replace(/thirty days/gi, 'sixty days')
                        .replace(/Month View/gi, '60-Day View')
                        .replace(/Monthly Renewals/gi, '60-Day Renewals')
                        .replace(/Expiring This Month/gi, 'Expiring Next 60 Days');
                }
            }
        }

        // Also replace in specific elements
        document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button').forEach(elem => {
            if (elem.innerHTML && !elem.querySelector('script')) {
                const original = elem.innerHTML;
                const updated = original
                    .replace(/Within 30 Days/gi, 'Within 60 Days')
                    .replace(/30 Days/gi, '60 Days')
                    .replace(/30 days/gi, '60 days')
                    .replace(/Month View/gi, '60-Day View')
                    .replace(/Monthly Renewals/gi, '60-Day Renewals');

                if (original !== updated) {
                    elem.innerHTML = updated;
                }
            }
        });
    }

    // Intercept innerHTML assignments
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value) {
            // Replace text before setting
            if (typeof value === 'string') {
                value = value
                    .replace(/Renewals Due Within 30 Days/gi, 'Renewals Due Within 60 Days')
                    .replace(/Within 30 Days/gi, 'Within 60 Days')
                    .replace(/30 Days/gi, '60 Days')
                    .replace(/30 days/gi, '60 days')
                    .replace(/Month View(?!s)/gi, '60-Day View')
                    .replace(/Monthly Renewals/gi, '60-Day Renewals')
                    .replace(/Expiring This Month/gi, 'Expiring Next 60 Days')
                    .replace(/thirtyDaysFromNow/g, 'sixtyDaysFromNow')
                    .replace(/30 \* 24 \* 60 \* 60 \* 1000/g, '60 * 24 * 60 * 60 * 1000');
            }
            originalInnerHTML.set.call(this, value);

            // Also run replacement after setting
            setTimeout(replaceAll30With60, 10);
        },
        get: originalInnerHTML.get,
        configurable: true
    });

    // Override textContent setter too
    const originalTextContent = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
    Object.defineProperty(Node.prototype, 'textContent', {
        set: function(value) {
            if (typeof value === 'string') {
                value = value
                    .replace(/Renewals Due Within 30 Days/gi, 'Renewals Due Within 60 Days')
                    .replace(/Within 30 Days/gi, 'Within 60 Days')
                    .replace(/30 Days/gi, '60 Days')
                    .replace(/Month View/gi, '60-Day View')
                    .replace(/Monthly Renewals/gi, '60-Day Renewals');
            }
            originalTextContent.set.call(this, value);
        },
        get: originalTextContent.get,
        configurable: true
    });

    // Monitor DOM mutations
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                replaceAll30With60();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Run replacement continuously
    setInterval(replaceAll30With60, 200);

    // Also override specific functions if they exist
    if (window.generateMonthView) {
        const original = window.generateMonthView;
        window.generateMonthView = function() {
            let result = original.apply(this, arguments);
            if (typeof result === 'string') {
                result = result.replace(/30/g, '60');
            }
            return result;
        };
    }

    // Initial replacement
    setTimeout(replaceAll30With60, 100);
    setTimeout(replaceAll30With60, 500);
    setTimeout(replaceAll30With60, 1000);

    console.log('☢️ NUCLEAR text replacement active - ALL instances of 30 Days → 60 Days');
})();