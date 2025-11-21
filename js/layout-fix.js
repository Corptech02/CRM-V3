// LAYOUT FIX - Ensures Quote Submissions section maintains proper layout
(function() {
    'use strict';

    console.log('LAYOUT FIX loading...');

    // Function to fix the layout structure
    function fixQuoteSubmissionsLayout() {
        console.log('Fixing Quote Submissions layout...');

        // Find the Quote Submissions section
        const quoteSection = document.querySelector('.profile-section');
        if (!quoteSection) return;

        // Look for the header that contains "Quote Submissions"
        const header = Array.from(quoteSection.querySelectorAll('h3')).find(h =>
            h.textContent.includes('Quote Submissions')
        );

        if (!header) return;

        // Find the parent section
        const section = header.closest('.profile-section');
        if (!section) return;

        console.log('Found Quote Submissions section, applying layout fix...');

        // Ensure the section has proper flexbox layout
        section.style.cssText = `
            background: #f0f8ff !important;
            padding: 20px !important;
            border-radius: 8px !important;
            margin-bottom: 20px !important;
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
        `;

        // Find the header div with buttons
        const headerDiv = section.querySelector('div[style*="display: flex"]');
        if (headerDiv) {
            headerDiv.style.cssText = `
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 15px !important;
                width: 100% !important;
            `;

            // Find the button container
            const buttonContainer = headerDiv.querySelector('div[style*="gap"]');
            if (buttonContainer) {
                buttonContainer.style.cssText = `
                    display: flex !important;
                    gap: 10px !important;
                    flex-shrink: 0 !important;
                `;
            }
        }

        // Find the quote submissions container
        const container = document.getElementById('quote-submissions-container');
        if (container) {
            container.style.cssText = `
                width: 100% !important;
                display: block !important;
                margin-top: 10px !important;
            `;

            // Fix any quote cards to be full width
            const quoteCards = container.querySelectorAll('.quote-card');
            quoteCards.forEach(card => {
                card.style.cssText = `
                    border: 1px solid #e5e7eb !important;
                    border-radius: 8px !important;
                    padding: 20px !important;
                    margin: 15px 0 !important;
                    background: white !important;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                    display: block !important;
                `;
            });
        }
    }

    // Monitor for layout changes and fix them
    let layoutCheckInterval = setInterval(() => {
        // Check if we're in a lead profile
        const isInProfile = document.querySelector('h3')?.textContent?.includes('Quote Submissions');

        if (isInProfile) {
            fixQuoteSubmissionsLayout();
        }
    }, 1000);

    // Also use mutation observer to catch immediate changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                // Check if quote cards were added
                const addedNodes = Array.from(mutation.addedNodes);
                const hasQuoteCard = addedNodes.some(node =>
                    node.classList && node.classList.contains('quote-card')
                );

                if (hasQuoteCard) {
                    console.log('Quote card added, fixing layout...');
                    setTimeout(fixQuoteSubmissionsLayout, 100);
                }
            }
        });
    });

    // Observe the document for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Fix layout when save button is clicked
    document.addEventListener('click', function(e) {
        if (e.target.id === 'quote-save-btn' || e.target.innerHTML === 'Save') {
            console.log('Save button clicked, will fix layout after save...');
            setTimeout(fixQuoteSubmissionsLayout, 2000);
        }
    });

    console.log('LAYOUT FIX loaded - will maintain proper Quote Submissions layout');
})();