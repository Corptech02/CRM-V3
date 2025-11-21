// QUOTE CAPTURE CLEAN - Excludes transcript contamination
(function() {
    'use strict';

    console.log('QUOTE CAPTURE CLEAN loading...');

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

    // Check if a value is transcript text
    function isTranscriptText(value) {
        if (!value) return false;

        // Check for obvious transcript patterns
        const transcriptPatterns = [
            'Agent:',
            'Customer:',
            'Hello? Hey. How are you doing',
            'I\'m doing well myself',
            'giving you a call from',
            'trucking insurance',
            'how much are you currently paying',
            'I\'m paying a lot',
            'Take care. Bye'
        ];

        for (const pattern of transcriptPatterns) {
            if (value.includes(pattern)) {
                console.log('  ❌ Detected transcript text, skipping');
                return true;
            }
        }

        // Also check if it's suspiciously long (transcripts are usually very long)
        if (value.length > 200) {
            console.log('  ❌ Text too long (>200 chars), likely transcript');
            return true;
        }

        return false;
    }

    // CLEAN capture - only get actual quote form fields
    function captureQuoteData() {
        console.log('=== CLEAN QUOTE CAPTURE ===');
        const quotes = [];

        // Method 1: Find NEW quote cards only
        const quoteCards = document.querySelectorAll('.quote-card:not([data-saved="true"])');
        console.log(`Found ${quoteCards.length} new quote cards`);

        if (quoteCards.length > 0) {
            quoteCards.forEach((card, cardIndex) => {
                console.log(`\nProcessing quote card ${cardIndex + 1}`);
                const quoteData = {};

                // Look for specific labeled fields ONLY
                const labels = card.querySelectorAll('label');

                labels.forEach(label => {
                    const labelText = label.textContent.trim();
                    console.log(`  Checking label: "${labelText}"`);

                    // Find the associated input
                    let input = null;

                    // Try next sibling
                    if (label.nextElementSibling &&
                        (label.nextElementSibling.tagName === 'INPUT' ||
                         label.nextElementSibling.tagName === 'TEXTAREA')) {
                        input = label.nextElementSibling;
                    }

                    // Try within parent
                    if (!input) {
                        const parent = label.parentElement;
                        const possibleInput = parent.querySelector('input, textarea');
                        if (possibleInput && possibleInput !== label) {
                            input = possibleInput;
                        }
                    }

                    if (!input || !input.value || input.type === 'file') return;

                    const value = input.value.trim();
                    console.log(`    Input value: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);

                    // CRITICAL: Skip if this is transcript text
                    if (isTranscriptText(value)) {
                        return;
                    }

                    // Match EXACT label text
                    const labelLower = labelText.toLowerCase();

                    if (labelLower === 'insurance company:' ||
                        labelLower === 'insurance company' ||
                        labelLower === 'carrier:' ||
                        labelLower === 'carrier name:') {
                        quoteData.carrier_name = value;
                        console.log('    ✅ Captured Insurance Company:', value);
                    }
                    else if (labelLower === 'premium ($):' ||
                             labelLower === 'premium:' ||
                             labelLower === 'premium' ||
                             labelLower === 'monthly premium:') {
                        quoteData.premium = value.replace(/[$,]/g, '');
                        console.log('    ✅ Captured Premium:', quoteData.premium);
                    }
                    else if (labelLower === 'deductible ($):' ||
                             labelLower === 'deductible:' ||
                             labelLower === 'deductible') {
                        quoteData.deductible = value.replace(/[$,]/g, '');
                        console.log('    ✅ Captured Deductible:', quoteData.deductible);
                    }
                    else if (labelLower === 'coverage amount ($):' ||
                             labelLower === 'coverage amount:' ||
                             labelLower === 'coverage:' ||
                             labelLower === 'coverage limit:') {
                        quoteData.coverage = value;
                        console.log('    ✅ Captured Coverage:', value);
                    }
                    else if (labelLower === 'notes:' || labelLower === 'quote notes:') {
                        if (value.length < 500) {  // Notes shouldn't be huge
                            quoteData.notes = value;
                            console.log('    ✅ Captured Notes');
                        }
                    }
                });

                // Only add if we have valid quote data
                if (quoteData.carrier_name || quoteData.premium) {
                    quotes.push(quoteData);
                    console.log(`✅ Quote ${cardIndex + 1} captured successfully:`, quoteData);
                } else {
                    console.log(`❌ No valid data found in card ${cardIndex + 1}`);
                }
            });
        }

        // Method 2: If no cards, check for a visible quote form/modal
        if (quotes.length === 0) {
            console.log('\nNo quote cards found, checking for quote form...');

            // Look for visible forms that might be quote forms
            const forms = document.querySelectorAll('form, .modal-content, .popup-content, [role="dialog"]');

            forms.forEach(form => {
                // Check if visible
                const rect = form.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) return;

                const style = window.getComputedStyle(form);
                if (style.display === 'none' || style.visibility === 'hidden') return;

                // Check if this looks like a quote form
                const formText = form.textContent.toLowerCase();
                if (!formText.includes('insurance') &&
                    !formText.includes('premium') &&
                    !formText.includes('quote')) {
                    return;
                }

                console.log('  Found potential quote form');
                const quoteData = {};

                // Get all inputs in the form
                const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="file"]), textarea');

                inputs.forEach(input => {
                    if (!input.value || !input.value.trim()) return;

                    const value = input.value.trim();

                    // CRITICAL: Skip transcript text
                    if (isTranscriptText(value)) {
                        return;
                    }

                    // Try to find associated label
                    const label = form.querySelector(`label[for="${input.id}"]`) ||
                                input.parentElement.querySelector('label') ||
                                input.previousElementSibling;

                    const labelText = label?.textContent?.toLowerCase() || '';
                    const placeholder = input.placeholder?.toLowerCase() || '';

                    console.log(`  Input: label="${labelText}", placeholder="${placeholder}", value="${value.substring(0, 30)}..."`);

                    // Map fields based on label or placeholder
                    if (!quoteData.carrier_name &&
                        (labelText.includes('insurance company') ||
                         labelText.includes('carrier') ||
                         placeholder.includes('insurance company') ||
                         placeholder.includes('carrier name'))) {
                        quoteData.carrier_name = value;
                        console.log('    → Carrier:', value);
                    }
                    else if (!quoteData.premium &&
                        (labelText.includes('premium') ||
                         placeholder.includes('premium'))) {
                        quoteData.premium = value.replace(/[$,]/g, '');
                        console.log('    → Premium:', quoteData.premium);
                    }
                    else if (!quoteData.deductible &&
                        (labelText.includes('deductible') ||
                         placeholder.includes('deductible'))) {
                        quoteData.deductible = value.replace(/[$,]/g, '');
                        console.log('    → Deductible:', quoteData.deductible);
                    }
                    else if (!quoteData.coverage &&
                        (labelText.includes('coverage') ||
                         placeholder.includes('coverage'))) {
                        quoteData.coverage = value;
                        console.log('    → Coverage:', value);
                    }
                });

                if (quoteData.carrier_name || quoteData.premium) {
                    quotes.push(quoteData);
                    console.log('  ✅ Form quote captured:', quoteData);
                }
            });
        }

        console.log(`\n=== TOTAL CLEAN QUOTES CAPTURED: ${quotes.length} ===`);
        if (quotes.length > 0) {
            console.log('Final quotes:', quotes);
        }

        return quotes;
    }

    // Save quotes
    async function saveQuotes() {
        console.log('=== SAVING CLEAN QUOTES ===');

        let leadId = currentLeadId || window.currentLeadId || '88571';
        console.log('Lead ID:', leadId);

        const quotes = captureQuoteData();

        if (quotes.length === 0) {
            console.error('No quotes captured!');
            alert(`No quote data found. Please make sure you've filled in the quote form fields.

The system could not find any quote forms with valid data.
Make sure the fields don't contain call transcript text.

Try:
1. Click "Add Quote" to open a new quote form
2. Type fresh values into the fields (not copy-pasted transcript)
3. Click Save`);
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

                // Validate that this isn't transcript data
                if (isTranscriptText(quote.carrier_name) ||
                    isTranscriptText(quote.premium) ||
                    isTranscriptText(quote.deductible)) {
                    console.error('Quote contains transcript data, skipping');
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
    window.debugCaptureClean = captureQuoteData;

    console.log('QUOTE CAPTURE CLEAN loaded - use debugCaptureClean() in console to test');
})();