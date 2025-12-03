// FORCE SAVE BUTTON V2 - Guaranteed to add Save button
(function() {
    'use strict';

    console.log('FORCE SAVE BUTTON V2 loading...');

    // Main function to add save button
    function addSaveButton() {
        // Check if button already exists
        if (document.getElementById('quote-save-btn')) {
            return false;
        }

        console.log('Looking for Quote Application or Add Quote button...');

        // Find all buttons and check their text
        const allButtons = document.querySelectorAll('button');
        let targetButton = null;

        for (let btn of allButtons) {
            const text = btn.textContent.trim();
            console.log('Checking button:', text);

            // Look for exact matches
            if (text === 'Quote Application' ||
                text === 'Add Quote' ||
                text.includes('Quote Application') ||
                text.includes('Add Quote')) {
                targetButton = btn;
                console.log('✓ Found target button:', text);
                break;
            }
        }

        if (!targetButton) {
            console.log('Target button not found yet, will retry...');
            return false;
        }

        // Create Save button
        const saveBtn = document.createElement('button');
        saveBtn.id = 'quote-save-btn';
        saveBtn.textContent = 'Save';
        saveBtn.style.cssText = `
            background-color: #059669 !important;
            color: white !important;
            padding: 10px 20px !important;
            margin-right: 10px !important;
            border: none !important;
            border-radius: 6px !important;
            font-weight: bold !important;
            font-size: 16px !important;
            cursor: pointer !important;
            display: inline-block !important;
            vertical-align: middle !important;
        `;

        // Add hover effect
        saveBtn.onmouseover = function() {
            this.style.backgroundColor = '#047857 !important';
        };
        saveBtn.onmouseout = function() {
            this.style.backgroundColor = '#059669 !important';
        };

        // Add click handler
        saveBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Save button clicked!');

            // Try to call the universal capture function
            if (typeof window.universalQuoteCapture === 'function') {
                console.log('Using universal capture...');
                window.universalQuoteCapture();
            } else if (typeof window.captureAndSaveQuote === 'function') {
                console.log('Using direct capture...');
                window.captureAndSaveQuote();
            } else if (typeof window.saveQuotes === 'function') {
                window.saveQuotes();
            } else if (typeof window.exploreQuotes === 'function') {
                console.log('Running exploreQuotes...');
                const quotes = window.exploreQuotes();
                if (quotes && quotes.length > 0) {
                    console.log('Captured quotes:', quotes);
                    // Try to save them
                    saveQuotesToAPI(quotes);
                } else {
                    alert('No quote data found. Please fill in the quote form fields and try again.');
                }
            } else {
                console.error('No quote capture function available');
                alert('Quote system not loaded. Please refresh the page.');
            }
        };

        // Insert the Save button BEFORE the target button
        const parent = targetButton.parentElement || targetButton.parentNode;
        if (parent) {
            parent.insertBefore(saveBtn, targetButton);
            console.log('✅ Save button added successfully!');
            return true;
        } else {
            console.error('Could not find parent element for button insertion');
            return false;
        }
    }

    // Function to save quotes to API
    async function saveQuotesToAPI(quotes) {
        console.log('Saving quotes to API...', quotes);

        const leadId = window.currentLeadId || '88571';
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8897'
            : `http://${window.location.hostname}:8897`;

        try {
            let successCount = 0;

            for (const quote of quotes) {
                const quotePayload = {
                    lead_id: leadId,
                    application_id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    form_data: {
                        carrier_name: quote.carrier_name || 'Unknown Carrier',
                        premium: quote.premium || '0',
                        deductible: quote.deductible || '0',
                        coverage: quote.coverage || '',
                        effective_date: new Date().toISOString().split('T')[0],
                        notes: quote.notes || ''
                    },
                    status: 'quoted',
                    submitted_date: new Date().toISOString()
                };

                const response = await fetch(`${apiUrl}/api/quote-submissions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(quotePayload)
                });

                if (response.ok) {
                    successCount++;
                    console.log('Quote saved successfully');
                }
            }

            if (successCount > 0) {
                alert(`${successCount} quote(s) saved successfully!`);

                // Reload quotes display
                if (window.loadAndDisplayQuotes) {
                    setTimeout(() => {
                        window.loadAndDisplayQuotes(leadId);
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Error saving quotes:', error);
            alert('Error saving quotes: ' + error.message);
        }
    }

    // Try to add button immediately when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addSaveButton);
    } else {
        setTimeout(addSaveButton, 100);
    }

    // Keep trying every 500ms - DISABLED to prevent DOM manipulation flickering
    // const interval = setInterval(() => {
    //     if (addSaveButton()) {
    //         // Successfully added, can stop checking so frequently
    //         clearInterval(interval);
    //
    //         // But still check occasionally in case the UI gets rebuilt
    //         setInterval(() => {
    //             addSaveButton();
    //         }, 2000);
    //     }
    // }, 500);

    // Run once instead
    addSaveButton();

    // Also monitor for DOM changes
    const observer = new MutationObserver((mutations) => {
        // Check if Quote Application or Add Quote button was added
        for (let mutation of mutations) {
            if (mutation.type === 'childList') {
                for (let node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // Element node
                        // Check if it's a button or contains buttons
                        if (node.tagName === 'BUTTON' || (node.querySelectorAll && node.querySelectorAll('button').length > 0)) {
                            setTimeout(addSaveButton, 100);
                        }
                    }
                }
            }
        }
    });

    // Start observing when ready
    setTimeout(() => {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }, 1000);

    // Make save function globally available
    window.forceSaveButton = addSaveButton;

    console.log('FORCE SAVE BUTTON V2 loaded - Save button will be added automatically');
    console.log('You can also manually trigger it with: forceSaveButton()');
})();console.log("Testing Save button addition...");
setTimeout(() => {
    const buttons = document.querySelectorAll("button");
    console.log("All buttons on page:");
    buttons.forEach(btn => {
        console.log(" -", btn.textContent.trim());
    });
    
    if (window.forceSaveButton) {
        console.log("Forcing Save button addition...");
        window.forceSaveButton();
    }
}, 2000);
