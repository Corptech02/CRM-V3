// Force quote application modals to appear in front of lead profile
console.log('🎯 FORCE QUOTE MODAL FRONT - Loading...');

(function() {
    'use strict';

    // Override the createQuoteApplicationSimple to ensure maximum z-index
    const originalCreateQuoteApplicationSimple = window.createQuoteApplicationSimple;

    if (originalCreateQuoteApplicationSimple) {
        window.createQuoteApplicationSimple = function(leadId) {
            console.log('🎯 FORCE FRONT - Intercepting createQuoteApplicationSimple for lead:', leadId);

            // Call the original function
            const result = originalCreateQuoteApplicationSimple(leadId);

            // Force the highest z-index after creation
            setTimeout(() => {
                const modal = document.getElementById('quote-application-modal') ||
                            document.getElementById('test-quote-modal');

                if (modal) {
                    modal.style.zIndex = '99999999';
                    console.log('🎯 FORCE FRONT - Set quote modal z-index to 99999999');

                    // Also force it to be visible
                    modal.style.display = 'flex';
                    modal.style.opacity = '1';

                    // Force modal content to be 80% of screen
                    const modalContent = modal.querySelector('div');
                    if (modalContent) {
                        modalContent.style.width = '80vw';
                        modalContent.style.height = '80vh';
                        console.log('📏 FORCE SIZE - Set quote modal to 80% of screen');
                    }
                } else {
                    console.warn('🎯 FORCE FRONT - Quote modal not found after creation');
                }
            }, 100);

            return result;
        };

        console.log('✅ createQuoteApplicationSimple intercepted for maximum z-index');
    }

    // Also intercept any other quote application functions
    const originalShowQuoteApplication = window.showQuoteApplication;

    if (originalShowQuoteApplication) {
        window.showQuoteApplication = function(leadId) {
            console.log('🎯 FORCE FRONT - Intercepting showQuoteApplication for lead:', leadId);

            // Call the original function
            const result = originalShowQuoteApplication(leadId);

            // Force the highest z-index after creation
            setTimeout(() => {
                const modal = document.getElementById('quote-application-modal');

                if (modal) {
                    modal.style.zIndex = '99999999';
                    console.log('🎯 FORCE FRONT - Set quote application modal z-index to 99999999');

                    // Also force it to be visible
                    modal.style.display = 'flex';
                    modal.style.opacity = '1';

                    // Force modal content to be 80% of screen
                    const modalContent = modal.querySelector('div');
                    if (modalContent) {
                        modalContent.style.width = '80vw';
                        modalContent.style.height = '80vh';
                        console.log('📏 FORCE SIZE - Set quote application modal to 80% of screen');
                    }
                } else {
                    console.warn('🎯 FORCE FRONT - Quote application modal not found after creation');
                }
            }, 100);

            return result;
        };

        console.log('✅ showQuoteApplication intercepted for maximum z-index');
    }

    console.log('🎯 FORCE QUOTE MODAL FRONT - Ready');
})();