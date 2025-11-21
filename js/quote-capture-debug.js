// QUOTE CAPTURE DEBUG - Enhanced debugging to find why quotes aren't being captured
(function() {
    'use strict';

    console.log('QUOTE CAPTURE DEBUG loading...');

    let currentLeadId = null;
    let saveButtonAdded = false;

    // Add save button
    function addSaveButton() {
        if (saveButtonAdded) return;

        // Remove ALL existing save buttons to prevent duplicates
        document.querySelectorAll('#quote-save-btn, #final-save-btn, #unified-save-btn').forEach(btn => btn.remove());

        const buttons = Array.from(document.querySelectorAll('button'));
        let targetButton = buttons.find(btn =>
            btn.textContent.includes('Quote Application') ||
            btn.textContent.includes('Add Quote')
        );

        if (!targetButton) return;

        const saveBtn = document.createElement('button');
        saveBtn.id = 'quote-save-btn';
        saveBtn.innerHTML = 'Save';
        saveBtn.style.cssText = `
            background: #059669 !important;
            color: white !important;
            margin-right: 10px !important;
            font-weight: bold !important;
            padding: 10px 20px !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-size: 16px !important;
        `;

        saveBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            saveQuotes();
        };

        targetButton.parentElement.insertBefore(saveBtn, targetButton);
        saveButtonAdded = true;
        console.log('Save button added');
    }

    // DEBUG capture - extensive logging to see what's on the page
    function captureQuoteData() {
        console.log('=== QUOTE CAPTURE DEBUG ===');
        const quotes = [];

        // Debug 1: Check what elements exist on the page
        console.log('\n--- DEBUG: Checking page elements ---');
        console.log('Quote cards found:', document.querySelectorAll('.quote-card').length);
        console.log('Quote cards (not saved):', document.querySelectorAll('.quote-card:not([data-saved="true"])').length);
        console.log('All divs with "quote" in class:', document.querySelectorAll('[class*="quote"]').length);
        console.log('All forms on page:', document.querySelectorAll('form').length);
        console.log('All modals:', document.querySelectorAll('.modal, .popup, [role="dialog"]').length);

        // Debug 2: Show ALL visible inputs with values
        console.log('\n--- DEBUG: ALL VISIBLE INPUTS WITH VALUES ---');
        const allInputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
        let inputCounter = 0;

        allInputs.forEach((input, idx) => {
            if (input.value && input.value.trim() !== '') {
                const rect = input.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0 && input.offsetParent !== null;

                if (isVisible) {
                    inputCounter++;
                    const nearbyLabel = input.parentElement?.querySelector('label')?.textContent ||
                                       document.querySelector(`label[for="${input.id}"]`)?.textContent ||
                                       'No label';

                    console.log(`Input #${inputCounter}:`, {
                        type: input.type,
                        tagName: input.tagName,
                        value: input.value.substring(0, 100),
                        label: nearbyLabel,
                        placeholder: input.placeholder,
                        id: input.id,
                        className: input.className,
                        parentClass: input.parentElement?.className,
                        closestDivClass: input.closest('div')?.className
                    });
                }
            }
        });

        // Debug 3: Look for quote-related containers
        console.log('\n--- DEBUG: Looking for quote containers ---');

        // Check for elements that might contain the quote form
        const possibleContainers = [
            '.quote-card:not([data-saved="true"])',
            '.quote-form',
            '.add-quote-form',
            '[class*="quote-"]',
            '#quote-submissions-container .quote-card',
            '.modal:not([style*="display: none"])',
            '.popup:not([style*="display: none"])'
        ];

        possibleContainers.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`Found ${elements.length} elements matching: ${selector}`);

                elements.forEach((el, idx) => {
                    const inputs = el.querySelectorAll('input:not([type="hidden"]), textarea');
                    const inputsWithValues = Array.from(inputs).filter(i => i.value && i.value.trim() !== '');

                    if (inputsWithValues.length > 0) {
                        console.log(`  Container ${idx + 1} has ${inputsWithValues.length} inputs with values:`);
                        inputsWithValues.forEach(input => {
                            const label = el.querySelector(`label[for="${input.id}"]`)?.textContent ||
                                        input.parentElement?.querySelector('label')?.textContent ||
                                        'no label';
                            console.log(`    - ${label}: "${input.value.substring(0, 50)}"`);
                        });
                    }
                });
            }
        });

        // Debug 4: Try to find quote inputs by their content/context
        console.log('\n--- DEBUG: Looking for quote-like inputs ---');

        const quoteData = {};
        let foundQuoteInputs = false;

        allInputs.forEach(input => {
            if (!input.value || input.value.trim() === '') return;

            const value = input.value.trim();
            const rect = input.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 && input.offsetParent !== null;

            if (!isVisible) return;

            // Get all possible label text
            const directLabel = input.parentElement?.querySelector('label')?.textContent?.toLowerCase() || '';
            const forLabel = document.querySelector(`label[for="${input.id}"]`)?.textContent?.toLowerCase() || '';
            const prevSibling = input.previousElementSibling?.textContent?.toLowerCase() || '';
            const parentText = input.parentElement?.textContent?.toLowerCase() || '';
            const placeholder = (input.placeholder || '').toLowerCase();

            // Check if this looks like a quote field
            const allContext = directLabel + ' ' + forLabel + ' ' + prevSibling + ' ' + parentText + ' ' + placeholder;

            if (!quoteData.carrier_name &&
                (allContext.includes('insurance') && allContext.includes('company')) ||
                allContext.includes('carrier')) {
                quoteData.carrier_name = value;
                foundQuoteInputs = true;
                console.log('  Found Insurance Company:', value);
            }

            if (!quoteData.premium && allContext.includes('premium')) {
                quoteData.premium = value.replace(/[$,]/g, '');
                foundQuoteInputs = true;
                console.log('  Found Premium:', value);
            }

            if (!quoteData.deductible && allContext.includes('deductible')) {
                quoteData.deductible = value.replace(/[$,]/g, '');
                foundQuoteInputs = true;
                console.log('  Found Deductible:', value);
            }

            if (!quoteData.coverage &&
                (allContext.includes('coverage') && (allContext.includes('amount') || allContext.includes('limit')))) {
                if (value.length < 100) {  // Avoid transcript
                    quoteData.coverage = value;
                    foundQuoteInputs = true;
                    console.log('  Found Coverage:', value);
                }
            }
        });

        if (foundQuoteInputs && (quoteData.carrier_name || quoteData.premium)) {
            quotes.push(quoteData);
            console.log('\n✅ Quote captured from loose inputs:', quoteData);
        }

        // Debug 5: Check specific quote card structure
        const quoteCards = document.querySelectorAll('.quote-card:not([data-saved="true"])');
        if (quoteCards.length > 0) {
            console.log('\n--- DEBUG: Processing quote cards ---');
            quoteCards.forEach((card, idx) => {
                console.log(`\nQuote Card ${idx + 1}:`);
                const cardData = {};

                // Get all inputs in the card
                const inputs = card.querySelectorAll('input:not([type="file"]), textarea');
                inputs.forEach(input => {
                    if (!input.value || input.value.trim() === '') return;

                    // Find associated label
                    const label = card.querySelector(`label[for="${input.id}"]`) ||
                                input.parentElement?.querySelector('label') ||
                                input.previousElementSibling;

                    const labelText = label?.textContent?.toLowerCase() || '';
                    const value = input.value.trim();

                    console.log(`  Field: "${labelText}" = "${value.substring(0, 50)}"`);

                    if (labelText.includes('insurance') && labelText.includes('company')) {
                        cardData.carrier_name = value;
                    } else if (labelText.includes('premium')) {
                        cardData.premium = value.replace(/[$,]/g, '');
                    } else if (labelText.includes('deductible')) {
                        cardData.deductible = value.replace(/[$,]/g, '');
                    } else if (labelText.includes('coverage')) {
                        if (value.length < 100) {
                            cardData.coverage = value;
                        }
                    } else if (labelText.includes('notes') && value.length < 500) {
                        cardData.notes = value;
                    }
                });

                if (cardData.carrier_name || cardData.premium) {
                    quotes.push(cardData);
                    console.log('  ✅ Card data captured:', cardData);
                } else {
                    console.log('  ❌ No valid data found in this card');
                }
            });
        }

        console.log(`\n=== TOTAL QUOTES CAPTURED: ${quotes.length} ===`);
        if (quotes.length > 0) {
            console.log('Captured quotes:', quotes);
        } else {
            console.log('❌ NO QUOTES CAPTURED - Check the debug output above');
        }

        return quotes;
    }

    // Save quotes
    async function saveQuotes() {
        console.log('=== SAVING QUOTES (DEBUG) ===');

        let leadId = currentLeadId || window.currentLeadId || '88571';
        console.log('Lead ID:', leadId);

        const quotes = captureQuoteData();

        if (quotes.length === 0) {
            console.error('No quotes captured!');
            alert(`No quote data found.

Debug Info:
- Quote cards found: ${document.querySelectorAll('.quote-card').length}
- Unsaved quote cards: ${document.querySelectorAll('.quote-card:not([data-saved="true"])').length}
- All visible inputs: ${document.querySelectorAll('input:not([type="hidden"])').length}

Please check the browser console for detailed debug information.
Try clicking "Add Quote" first if you haven't already.`);
            return;
        }

        const saveBtn = document.getElementById('quote-save-btn');
        const originalText = saveBtn?.innerHTML;
        if (saveBtn) {
            saveBtn.innerHTML = 'Saving...';
            saveBtn.disabled = true;
        }

        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8897'
                : `http://${window.location.hostname}:8897`;

            let successCount = 0;

            for (const quote of quotes) {
                console.log('Saving quote:', quote);

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

            if (saveBtn) {
                saveBtn.innerHTML = 'Saved!';
                saveBtn.style.background = '#059669';
            }

            setTimeout(() => {
                if (window.loadAndDisplayQuotes) {
                    window.loadAndDisplayQuotes(leadId);
                }
                if (saveBtn) {
                    saveBtn.innerHTML = 'Save';
                    saveBtn.disabled = false;
                }
            }, 1500);

            if (successCount > 0) {
                alert(`${successCount} quote(s) saved successfully!`);
            }

        } catch (error) {
            console.error('Save error:', error);
            alert('Error saving quotes: ' + error.message);
            if (saveBtn) {
                saveBtn.innerHTML = 'Save';
                saveBtn.disabled = false;
            }
        }
    }

    // Initialize
    setInterval(() => {
        if (!document.getElementById('quote-save-btn')) {
            const hasQuoteButtons = Array.from(document.querySelectorAll('button')).some(btn =>
                btn.textContent.includes('Quote Application') ||
                btn.textContent.includes('Add Quote')
            );

            if (hasQuoteButtons) {
                saveButtonAdded = false;
                addSaveButton();
            }
        }
    }, 500);

    // Track lead ID
    const originalShow = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        currentLeadId = leadId;
        window.currentLeadId = leadId;
        saveButtonAdded = false;

        if (originalShow) {
            originalShow.apply(this, arguments);
        }
    };

    // Make function global for debugging
    window.debugCaptureQuotes = captureQuoteData;

    console.log('QUOTE CAPTURE DEBUG loaded - use debugCaptureQuotes() in console to test');
})();