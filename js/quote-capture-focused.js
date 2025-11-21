// QUOTE CAPTURE FOCUSED - More precise quote form detection avoiding transcript areas
(function() {
    'use strict';

    console.log('QUOTE CAPTURE FOCUSED loading...');

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

    // FOCUSED capture - only look at quote cards and specific quote form elements
    function captureQuoteData() {
        console.log('=== FOCUSED QUOTE CAPTURE ===');
        const quotes = [];

        // Method 1: Find NEW quote cards (not saved ones)
        const quoteCards = document.querySelectorAll('.quote-card:not([data-saved="true"])');
        console.log(`Found ${quoteCards.length} new quote cards`);

        if (quoteCards.length > 0) {
            quoteCards.forEach((card, cardIndex) => {
                console.log(`Processing quote card ${cardIndex}`);
                const quoteData = {};

                // Get all labels and their associated inputs in the card
                const labels = card.querySelectorAll('label');
                labels.forEach(label => {
                    const labelText = label.textContent.trim().toLowerCase();

                    // Find the input/textarea associated with this label
                    let input = label.nextElementSibling;
                    if (!input || (input.tagName !== 'INPUT' && input.tagName !== 'TEXTAREA')) {
                        // Try finding input in parent
                        const parent = label.parentElement;
                        input = parent.querySelector('input, textarea');
                    }

                    if (!input) return;

                    const value = input.value?.trim();
                    if (!value) return;

                    // Skip file inputs
                    if (input.type === 'file') return;

                    // Map based on label text - be very specific
                    if (labelText.includes('insurance company')) {
                        quoteData.carrier_name = value;
                        console.log('  → Insurance Company:', value);
                    }
                    else if (labelText.includes('premium')) {
                        quoteData.premium = value.replace(/[$,]/g, '');
                        console.log('  → Premium:', value);
                    }
                    else if (labelText.includes('deductible')) {
                        quoteData.deductible = value.replace(/[$,]/g, '');
                        console.log('  → Deductible:', value);
                    }
                    else if (labelText.includes('coverage amount') || labelText.includes('coverage limit')) {
                        // Only take short values for coverage
                        if (value.length < 50) {
                            quoteData.coverage = value;
                            console.log('  → Coverage:', value);
                        }
                    }
                    else if (labelText.includes('notes') && input.tagName === 'TEXTAREA') {
                        // Only take reasonable notes, not transcripts
                        if (value.length < 500) {
                            quoteData.notes = value;
                            console.log('  → Notes:', value);
                        }
                    }
                });

                // Only add if we have meaningful data
                if (quoteData.carrier_name || quoteData.premium) {
                    quotes.push(quoteData);
                    console.log(`Quote ${cardIndex + 1} captured:`, quoteData);
                }
            });
        }

        // Method 2: If no quote cards, check for a quote form modal/popup
        if (quotes.length === 0) {
            console.log('No new quote cards found, checking for quote form modal...');

            // Look for modals or forms that appear when "Add Quote" is clicked
            const modals = document.querySelectorAll('.modal, .popup, [role="dialog"]');
            modals.forEach(modal => {
                // Check if modal is visible
                const style = window.getComputedStyle(modal);
                if (style.display === 'none' || style.visibility === 'hidden') return;

                const quoteData = {};

                // Look for labeled inputs in the modal
                const labels = modal.querySelectorAll('label');
                labels.forEach(label => {
                    const labelText = label.textContent.trim().toLowerCase();
                    const input = modal.querySelector(`#${label.getAttribute('for')}`) ||
                                 label.parentElement.querySelector('input, textarea');

                    if (!input || !input.value) return;
                    const value = input.value.trim();

                    // Map fields based on label
                    if (labelText.includes('insurance') && labelText.includes('company')) {
                        quoteData.carrier_name = value;
                        console.log('Modal Insurance Company:', value);
                    }
                    else if (labelText.includes('premium') && !labelText.includes('annual')) {
                        quoteData.premium = value.replace(/[$,]/g, '');
                        console.log('Modal Premium:', value);
                    }
                    else if (labelText.includes('deductible')) {
                        quoteData.deductible = value.replace(/[$,]/g, '');
                        console.log('Modal Deductible:', value);
                    }
                    else if ((labelText.includes('coverage') && labelText.includes('amount')) ||
                             labelText.includes('coverage limit')) {
                        if (value.length < 50) {
                            quoteData.coverage = value;
                            console.log('Modal Coverage:', value);
                        }
                    }
                });

                if (quoteData.carrier_name || quoteData.premium) {
                    quotes.push(quoteData);
                    console.log('Modal quote captured:', quoteData);
                }
            });
        }

        // Method 3: Check for dynamically added quote form elements
        if (quotes.length === 0) {
            console.log('Checking for dynamic quote form elements...');

            // Find groups of inputs that look like a quote form
            // Look for containers with multiple quote-related inputs
            const containers = document.querySelectorAll('.form-group, .field-group, .input-group');
            const potentialQuoteForms = [];

            containers.forEach(container => {
                const inputs = container.querySelectorAll('input:not([type="hidden"]):not([type="file"]), textarea');
                if (inputs.length >= 2) {
                    // Check if this looks like a quote form
                    const containerText = container.textContent.toLowerCase();
                    if (containerText.includes('insurance') ||
                        containerText.includes('premium') ||
                        containerText.includes('deductible') ||
                        containerText.includes('coverage')) {
                        potentialQuoteForms.push(container);
                    }
                }
            });

            if (potentialQuoteForms.length > 0) {
                console.log(`Found ${potentialQuoteForms.length} potential quote forms`);
                const quoteData = {};

                potentialQuoteForms.forEach(form => {
                    const inputs = form.querySelectorAll('input, textarea');
                    inputs.forEach(input => {
                        if (input.type === 'file' || !input.value) return;

                        const value = input.value.trim();
                        const placeholder = (input.placeholder || '').toLowerCase();

                        // Try to identify by placeholder
                        if (!quoteData.carrier_name &&
                            (placeholder.includes('insurance') || placeholder.includes('carrier'))) {
                            quoteData.carrier_name = value;
                            console.log('Form carrier:', value);
                        }
                        else if (!quoteData.premium && placeholder.includes('premium')) {
                            quoteData.premium = value.replace(/[$,]/g, '');
                            console.log('Form premium:', value);
                        }
                        else if (!quoteData.deductible && placeholder.includes('deductible')) {
                            quoteData.deductible = value.replace(/[$,]/g, '');
                            console.log('Form deductible:', value);
                        }
                        else if (!quoteData.coverage && placeholder.includes('coverage') && value.length < 50) {
                            quoteData.coverage = value;
                            console.log('Form coverage:', value);
                        }
                    });
                });

                if (quoteData.carrier_name || quoteData.premium) {
                    quotes.push(quoteData);
                    console.log('Form quote captured:', quoteData);
                }
            }
        }

        console.log(`\n=== TOTAL QUOTES CAPTURED: ${quotes.length} ===`);
        return quotes;
    }

    // Save quotes
    async function saveQuotes() {
        console.log('=== SAVING QUOTES (FOCUSED) ===');

        let leadId = currentLeadId || window.currentLeadId || '88571';
        console.log('Lead ID:', leadId);

        const quotes = captureQuoteData();

        if (quotes.length === 0) {
            console.error('No quotes captured!');

            // More helpful error message
            alert(`No quote data found. Please make sure you've filled in the quote form fields.

Look for fields labeled:
- Insurance Company
- Premium ($)
- Deductible ($)
- Coverage Amount

If you're still having issues, try clicking "Add Quote" first to open the quote form.`);
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

                // Ensure we have at least a carrier name or premium
                if (!quote.carrier_name && !quote.premium) {
                    console.warn('Skipping quote with no carrier or premium');
                    continue;
                }

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

                    // Mark the card as saved
                    const newCards = document.querySelectorAll('.quote-card:not([data-saved="true"])');
                    if (newCards[0]) {
                        newCards[0].setAttribute('data-saved', 'true');
                    }
                } else {
                    const error = await response.text();
                    console.error('Failed to save quote:', error);
                }
            }

            if (saveBtn) {
                saveBtn.innerHTML = 'Saved!';
                saveBtn.style.background = '#059669';
            }

            // Reload quotes
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
    window.debugCaptureFocused = captureQuoteData;

    console.log('QUOTE CAPTURE FOCUSED loaded - use debugCaptureFocused() in console to test');
})();console.log('Scripts loaded. Test with debugCaptureFocused() in console');
