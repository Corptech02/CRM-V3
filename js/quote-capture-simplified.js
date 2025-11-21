// QUOTE CAPTURE SIMPLIFIED - More reliable quote form detection
(function() {
    'use strict';

    console.log('QUOTE CAPTURE SIMPLIFIED loading...');

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

    // Simplified capture - just get ALL inputs and filter intelligently
    function captureQuoteData() {
        console.log('=== SIMPLIFIED QUOTE CAPTURE ===');
        const quotes = [];

        // First, let's see ALL inputs on the page with values
        console.log('ALL INPUTS WITH VALUES:');
        const allInputs = document.querySelectorAll('input, textarea, select');
        const inputsWithValues = [];

        allInputs.forEach((input, index) => {
            if (input.value && input.value.trim() !== '' && input.type !== 'checkbox') {
                // Skip transcript areas
                if (input.id && input.id.includes('transcript')) {
                    console.log(`Skipping transcript input ${index}`);
                    return;
                }
                if (input.closest('.transcript-section, .call-notes-section')) {
                    console.log(`Skipping input in transcript section ${index}`);
                    return;
                }
                // Skip very long text areas (likely transcripts)
                if (input.tagName === 'TEXTAREA' && input.value.length > 500) {
                    console.log(`Skipping large textarea ${index} (${input.value.length} chars)`);
                    return;
                }

                const info = {
                    index: index,
                    tag: input.tagName,
                    type: input.type,
                    value: input.value.substring(0, 100), // Limit logged value length
                    placeholder: input.placeholder,
                    id: input.id,
                    className: input.className,
                    parentText: input.parentElement?.textContent?.substring(0, 50)
                };
                console.log(`Input ${index}:`, info);
                inputsWithValues.push({ input, info });
            }
        });

        // Now let's find quote-specific patterns
        console.log('\n=== LOOKING FOR QUOTE PATTERNS ===');

        // Method 1: Find inputs that are in a quote card structure
        const quoteCards = document.querySelectorAll('.quote-card:not([data-saved="true"])');
        console.log(`Found ${quoteCards.length} new quote cards`);

        if (quoteCards.length > 0) {
            quoteCards.forEach((card, cardIndex) => {
                console.log(`Processing quote card ${cardIndex}`);
                const quoteData = {};

                const inputs = card.querySelectorAll('input, textarea');
                inputs.forEach(input => {
                    // Skip file inputs and transcript-looking content
                    if (input.type === 'file') return;
                    if (input.tagName === 'TEXTAREA' && input.value.length > 500) {
                        console.log('    Skipping large textarea in card');
                        return;
                    }

                    const value = input.value?.trim();
                    if (!value) return;

                    // Look at surrounding text to determine field type
                    const container = input.closest('div');
                    const labelText = container?.querySelector('label')?.textContent || '';
                    const allText = container?.textContent || '';

                    console.log(`  Input in card: label="${labelText}", value="${value}"`);

                    if (labelText.match(/insurance|company|carrier/i) ||
                        allText.match(/insurance company/i)) {
                        quoteData.carrier_name = value;
                        console.log('    → Insurance Company:', value);
                    }
                    else if (labelText.match(/premium/i) || allText.match(/premium/i)) {
                        quoteData.premium = value.replace(/[$,]/g, '');
                        console.log('    → Premium:', value);
                    }
                    else if (labelText.match(/deductible/i) || allText.match(/deductible/i)) {
                        quoteData.deductible = value.replace(/[$,]/g, '');
                        console.log('    → Deductible:', value);
                    }
                    else if (labelText.match(/coverage/i) || allText.match(/coverage/i)) {
                        // Only capture if it's a reasonable coverage amount
                        if (value.length < 100) {
                            quoteData.coverage = value;
                            console.log('    → Coverage:', value);
                        }
                    }
                    else if (input.tagName === 'TEXTAREA' && value.length < 500) {
                        // Only small textareas as notes, not transcripts
                        quoteData.notes = value;
                        console.log('    → Notes:', value);
                    }
                });

                if (Object.keys(quoteData).length > 0) {
                    quotes.push(quoteData);
                    console.log('Quote captured from card:', quoteData);
                }
            });
        }

        // Method 2: If no quote cards found, look for a group of inputs that look like a quote form
        if (quotes.length === 0) {
            console.log('No quote cards found, looking for quote form pattern...');

            // Look for inputs with specific placeholders or nearby text
            let potentialQuoteData = {};
            let foundQuotePattern = false;

            inputsWithValues.forEach(({ input, info }) => {
                const value = input.value?.trim();
                if (!value) return;

                // Extra check - skip if value looks like a transcript
                if (value.includes('Hello, thank you for calling') ||
                    value.includes('Have a great day') ||
                    value.includes('Is there anything else') ||
                    value.includes('How may I assist you') ||
                    value.includes('Thank you for your time') ||
                    value.length > 1000) {
                    console.log('Skipping value that looks like transcript');
                    return;
                }

                const placeholder = (input.placeholder || '').toLowerCase();
                const parentText = (input.parentElement?.textContent || '').toLowerCase();

                // Skip if this is clearly a transcript or call notes
                if (input.tagName === 'TEXTAREA' && value.length > 500) {
                    console.log('Skipping large textarea (likely transcript)');
                    return;
                }

                // Check if this looks like insurance company
                if (!potentialQuoteData.carrier_name) {
                    if (placeholder.includes('carrier') ||
                        placeholder.includes('insurance') ||
                        placeholder.includes('company name') ||
                        parentText.includes('insurance company')) {
                        potentialQuoteData.carrier_name = value;
                        foundQuotePattern = true;
                        console.log('Found potential carrier name:', value);
                    }
                    // Also check if value looks like an insurance company
                    else if (value.match(/insurance|mutual|geico|progressive|state farm|allstate|nationwide/i) ||
                             (value.length < 100 && value.length > 2 && !value.includes('@') && isNaN(value))) {
                        // Could be a company name
                        if (!potentialQuoteData.carrier_name && !value.match(/\d{4,}/) && !value.match(/^\d+$/)) {
                            potentialQuoteData.carrier_name = value;
                            console.log('Found potential carrier by pattern:', value);
                        }
                    }
                }

                // Check for premium (usually a larger number)
                if (!potentialQuoteData.premium && input.type === 'number' || input.type === 'text') {
                    const numValue = parseFloat(value.replace(/[$,]/g, ''));
                    if (!isNaN(numValue) && numValue >= 100 && numValue < 1000000) {
                        if (placeholder.includes('premium') || parentText.includes('premium')) {
                            potentialQuoteData.premium = value.replace(/[$,]/g, '');
                            foundQuotePattern = true;
                            console.log('Found premium:', value);
                        } else if (numValue >= 1000) {
                            // Likely premium if it's a big number
                            potentialQuoteData.premium = value.replace(/[$,]/g, '');
                            console.log('Found potential premium by size:', value);
                        }
                    }
                }

                // Check for deductible (usually smaller than premium)
                if (!potentialQuoteData.deductible && (input.type === 'number' || input.type === 'text')) {
                    const numValue = parseFloat(value.replace(/[$,]/g, ''));
                    if (!isNaN(numValue) && numValue > 0 && numValue < 50000) {
                        if (placeholder.includes('deductible') || parentText.includes('deductible')) {
                            potentialQuoteData.deductible = value.replace(/[$,]/g, '');
                            foundQuotePattern = true;
                            console.log('Found deductible:', value);
                        }
                    }
                }

                // Check for coverage (must be a reasonable coverage amount, not transcript)
                if (!potentialQuoteData.coverage && value.length < 100) {
                    if (placeholder.includes('coverage') ||
                        placeholder.includes('1,000,000') ||
                        parentText.includes('coverage')) {
                        potentialQuoteData.coverage = value;
                        foundQuotePattern = true;
                        console.log('Found coverage:', value);
                    }
                }
            });

            if (foundQuotePattern && Object.keys(potentialQuoteData).length > 0) {
                quotes.push(potentialQuoteData);
                console.log('Quote captured from form pattern:', potentialQuoteData);
            }
        }

        // Method 3: Last resort - check if Add Quote button was clicked and form is visible
        if (quotes.length === 0) {
            console.log('Checking for any visible form after Add Quote click...');

            // Look for any new inputs that appeared after clicking Add Quote
            const visibleInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"])')).filter(input => {
                const rect = input.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && input.offsetParent !== null;
            });

            console.log(`Found ${visibleInputs.length} visible inputs`);

            // Group inputs that are close together (likely part of same form)
            let currentQuote = {};
            visibleInputs.forEach(input => {
                const value = input.value?.trim();
                if (!value) return;

                // Skip if this is clearly not a quote field
                if (input.id && (input.id.includes('lead-') || input.id.includes('search'))) return;

                console.log(`Visible input: value="${value}", placeholder="${input.placeholder}"`);

                // Try to categorize based on value
                if (!currentQuote.carrier_name && isNaN(value) && value.length > 2 && value.length < 100) {
                    // Extra check - make sure it's not transcript text
                    if (!value.includes('Hello') && !value.includes('thank you') && !value.includes('calling')) {
                        currentQuote.carrier_name = value;
                        console.log('  → Assigned as carrier name');
                    }
                } else if (!currentQuote.premium && !isNaN(value.replace(/[$,]/g, '')) && parseFloat(value.replace(/[$,]/g, '')) >= 100) {
                    currentQuote.premium = value.replace(/[$,]/g, '');
                    console.log('  → Assigned as premium');
                } else if (!currentQuote.coverage && value.length < 50 && (value.includes('$') || value.includes(',000'))) {
                    currentQuote.coverage = value;
                    console.log('  → Assigned as coverage');
                }
            });

            if (Object.keys(currentQuote).length > 0) {
                quotes.push(currentQuote);
                console.log('Quote captured from visible inputs:', currentQuote);
            }
        }

        console.log(`\n=== TOTAL QUOTES CAPTURED: ${quotes.length} ===`);
        return quotes;
    }

    // Save quotes
    async function saveQuotes() {
        console.log('=== SAVING QUOTES ===');

        let leadId = currentLeadId || window.currentLeadId || '88571';
        console.log('Lead ID:', leadId);

        const quotes = captureQuoteData();

        if (quotes.length === 0) {
            console.error('No quotes captured!');

            // More helpful error message
            const visibleInputCount = document.querySelectorAll('input:not([type="hidden"])').length;
            alert(`No quote data found. Please make sure you've filled in the quote form fields.\n\nDebugging info: ${visibleInputCount} inputs found on page.\n\nLook for fields labeled:\n- Insurance Company\n- Premium\n- Deductible\n- Coverage`);
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
    window.debugCaptureQuotes = captureQuoteData;

    console.log('QUOTE CAPTURE SIMPLIFIED loaded - use debugCaptureQuotes() in console to test');
})();