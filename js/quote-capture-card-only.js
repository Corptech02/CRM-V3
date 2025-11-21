// QUOTE CAPTURE CARD ONLY - Only captures from quote cards
(function() {
    'use strict';

    console.log('QUOTE CAPTURE CARD ONLY loading...');

    let currentLeadId = null;

    // Add save button
    function addSaveButton() {
        if (document.getElementById('quote-save-btn')) return;

        const buttons = Array.from(document.querySelectorAll('button'));
        let targetButton = buttons.find(btn =>
            btn.textContent.includes('Quote Application') ||
            btn.textContent.includes('Add Quote')
        );

        if (!targetButton) return;

        const saveBtn = document.createElement('button');
        saveBtn.id = 'quote-save-btn';
        saveBtn.innerHTML = 'Save Quote';
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
            captureAndSave();
        };

        targetButton.parentElement.insertBefore(saveBtn, targetButton);
        console.log('Save button added');
    }

    // Capture ONLY from quote cards
    function captureAndSave() {
        console.log('=== QUOTE CARD CAPTURE ===');

        // Debug: Check what quote elements exist
        console.log('DEBUG: All .quote-card elements:', document.querySelectorAll('.quote-card').length);
        console.log('DEBUG: Saved quote cards:', document.querySelectorAll('.quote-card[data-saved="true"]').length);
        console.log('DEBUG: New quote cards:', document.querySelectorAll('.quote-card:not([data-saved="true"])').length);

        // Also check if cards have different attributes
        const allCards = document.querySelectorAll('.quote-card');
        allCards.forEach((card, idx) => {
            console.log(`Card ${idx + 1} attributes:`, {
                'data-saved': card.getAttribute('data-saved'),
                'className': card.className,
                'innerHTML preview': card.innerHTML.substring(0, 100)
            });
        });

        // Find NEW quote cards (not saved ones)
        const quoteCards = document.querySelectorAll('.quote-card:not([data-saved="true"])');
        console.log(`Found ${quoteCards.length} new quote cards`);

        // If no new cards, try looking for ALL quote cards
        if (quoteCards.length === 0) {
            console.log('No new cards found, checking ALL quote cards...');
            const allQuoteCards = document.querySelectorAll('.quote-card');

            if (allQuoteCards.length === 0) {
                alert('No quote cards found. Please click "Add Quote" first to create a quote form.');
                return;
            } else {
                console.log(`Found ${allQuoteCards.length} total quote cards, will try to process them...`);
                // Continue with all cards for now
                processQuoteCards(allQuoteCards);
                return;
            }
        }

        processQuoteCards(quoteCards);
    }

    function processQuoteCards(quoteCards) {

        const quotes = [];

        // Process each quote card
        quoteCards.forEach((card, cardIndex) => {
            console.log(`\nProcessing Quote Card ${cardIndex + 1}:`);

            const quoteData = {
                carrier_name: '',
                premium: '',
                deductible: '',
                coverage: '',
                notes: ''
            };

            // Find all inputs in THIS quote card only
            const inputs = card.querySelectorAll('input:not([type="file"]), textarea');
            console.log(`  Card has ${inputs.length} input fields`);

            inputs.forEach((input, idx) => {
                const value = input.value?.trim();
                if (!value || value === '') return;

                // Skip if this looks like transcript
                if (value.includes('Agent:') || value.includes('Customer:') || value.length > 1000) {
                    console.log(`  Field ${idx + 1}: Skipping transcript`);
                    return;
                }

                // Get the label for this input
                let labelText = '';

                // Try to find label in parent div
                const parentDiv = input.parentElement;
                if (parentDiv) {
                    const label = parentDiv.querySelector('label');
                    if (label) {
                        labelText = label.textContent.trim().toLowerCase();
                    }
                }

                // If no label found, check previous sibling
                if (!labelText && input.previousElementSibling && input.previousElementSibling.tagName === 'LABEL') {
                    labelText = input.previousElementSibling.textContent.trim().toLowerCase();
                }

                console.log(`  Field ${idx + 1}: label="${labelText}", value="${value.substring(0, 50)}"`);

                // Map based on label text
                if (labelText.includes('insurance company')) {
                    quoteData.carrier_name = value;
                    console.log('    ✓ Captured as Insurance Company');
                }
                else if (labelText.includes('premium')) {
                    quoteData.premium = value.replace(/[$,]/g, '');
                    console.log('    ✓ Captured as Premium');
                }
                else if (labelText.includes('deductible')) {
                    quoteData.deductible = value.replace(/[$,]/g, '');
                    console.log('    ✓ Captured as Deductible');
                }
                else if (labelText.includes('coverage amount') || labelText.includes('coverage')) {
                    quoteData.coverage = value.replace(/[$,]/g, '');
                    console.log('    ✓ Captured as Coverage');
                }
                else if (labelText.includes('notes') || input.tagName === 'TEXTAREA') {
                    if (value !== 'Add any notes about this quote...' && value.length < 500) {
                        quoteData.notes = value;
                        console.log('    ✓ Captured as Notes');
                    }
                }
                else {
                    console.log('    ? Could not identify this field');
                }
            });

            // If we didn't get fields by label, try by position
            if (!quoteData.carrier_name && !quoteData.premium) {
                console.log('  Trying position-based capture...');

                const textInputs = card.querySelectorAll('input[type="text"]:not([placeholder*="file"])');
                if (textInputs.length >= 4) {
                    // Assume order: carrier, premium, deductible, coverage
                    if (textInputs[0].value && !textInputs[0].value.includes('Agent:')) {
                        quoteData.carrier_name = textInputs[0].value.trim();
                        console.log(`    Position 1 → Insurance Company: ${quoteData.carrier_name}`);
                    }
                    if (textInputs[1].value) {
                        quoteData.premium = textInputs[1].value.replace(/[$,]/g, '').trim();
                        console.log(`    Position 2 → Premium: ${quoteData.premium}`);
                    }
                    if (textInputs[2].value) {
                        quoteData.deductible = textInputs[2].value.replace(/[$,]/g, '').trim();
                        console.log(`    Position 3 → Deductible: ${quoteData.deductible}`);
                    }
                    if (textInputs[3].value) {
                        quoteData.coverage = textInputs[3].value.replace(/[$,]/g, '').trim();
                        console.log(`    Position 4 → Coverage: ${quoteData.coverage}`);
                    }
                }
            }

            // Only add if we have meaningful data
            if (quoteData.carrier_name || quoteData.premium) {
                quotes.push(quoteData);
                console.log(`  ✅ Quote captured:`, quoteData);
            } else {
                console.log(`  ❌ No valid data in this card`);
            }
        });

        if (quotes.length === 0) {
            console.error('No quote data captured from cards!');
            alert('Could not capture quote data. Please make sure you filled in at least the carrier name or premium.');
            return;
        }

        // Save all captured quotes
        quotes.forEach(quote => saveQuoteNow(quote));
    }

    // Save function
    async function saveQuoteNow(quoteData) {
        console.log('Saving quote...', quoteData);

        const leadId = currentLeadId || window.currentLeadId || '88571';
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8897'
            : `http://${window.location.hostname}:8897`;

        const saveBtn = document.getElementById('quote-save-btn');
        if (saveBtn) {
            saveBtn.innerHTML = 'Saving...';
            saveBtn.disabled = true;
        }

        try {
            const quotePayload = {
                lead_id: leadId,
                application_id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                form_data: {
                    carrier_name: quoteData.carrier_name || 'Unknown Carrier',
                    premium: quoteData.premium || '0',
                    deductible: quoteData.deductible || '0',
                    coverage: quoteData.coverage || '',
                    effective_date: new Date().toISOString().split('T')[0],
                    notes: quoteData.notes || ''
                },
                status: 'quoted',
                submitted_date: new Date().toISOString()
            };

            console.log('Sending to API:', quotePayload);

            const response = await fetch(`${apiUrl}/api/quote-submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quotePayload)
            });

            if (response.ok) {
                console.log('✅ Quote saved successfully!');
                alert('Quote saved successfully!');

                if (saveBtn) {
                    saveBtn.innerHTML = 'Saved!';
                    saveBtn.style.background = '#059669';
                }

                // Mark the card as saved
                const newCards = document.querySelectorAll('.quote-card:not([data-saved="true"])');
                if (newCards[0]) {
                    newCards[0].setAttribute('data-saved', 'true');
                }

                // Reload quotes
                setTimeout(() => {
                    if (window.loadAndDisplayQuotes) {
                        window.loadAndDisplayQuotes(leadId);
                    }
                    if (saveBtn) {
                        saveBtn.innerHTML = 'Save Quote';
                        saveBtn.disabled = false;
                    }
                }, 1500);

            } else {
                const error = await response.text();
                console.error('Save failed:', error);
                alert('Failed to save quote: ' + error);
                if (saveBtn) {
                    saveBtn.innerHTML = 'Save Quote';
                    saveBtn.disabled = false;
                }
            }

        } catch (error) {
            console.error('Save error:', error);
            alert('Error saving quote: ' + error.message);
            if (saveBtn) {
                saveBtn.innerHTML = 'Save Quote';
                saveBtn.disabled = false;
            }
        }
    }

    // Initialize
    setInterval(() => {
        addSaveButton();
    }, 500);

    // Track lead ID
    const originalShow = window.showLeadProfile;
    window.showLeadProfile = function(leadId) {
        currentLeadId = leadId;
        window.currentLeadId = leadId;
        if (originalShow) {
            originalShow.apply(this, arguments);
        }
    };

    // Global function
    window.captureAndSaveQuote = captureAndSave;

    console.log('QUOTE CAPTURE CARD ONLY loaded');
    console.log('This version only captures from .quote-card elements');
})();
// Add manual test function
window.testQuoteCapture = function() {
    console.log("=== MANUAL QUOTE CAPTURE TEST ===");
    
    // Check for quote cards
    const cards = document.querySelectorAll(".quote-card");
    console.log("Total quote cards found:", cards.length);
    
    if (cards.length > 0) {
        const card = cards[cards.length - 1]; // Get the last (newest) card
        console.log("Testing with last card...");
        
        const inputs = card.querySelectorAll("input, textarea");
        console.log("Inputs in card:", inputs.length);
        
        inputs.forEach((input, idx) => {
            if (input.value) {
                console.log(`Input ${idx + 1}:`, {
                    type: input.type,
                    value: input.value,
                    placeholder: input.placeholder,
                    previousLabel: input.previousElementSibling?.tagName === "LABEL" ? input.previousElementSibling.textContent : "no label"
                });
            }
        });
    }
    
    // Also try finding inputs by looking for specific text
    console.log("\n=== Looking for inputs near quote labels ===");
    const labels = document.querySelectorAll("label");
    labels.forEach(label => {
        const text = label.textContent.toLowerCase();
        if (text.includes("insurance company") || text.includes("premium") || text.includes("deductible") || text.includes("coverage")) {
            const nextEl = label.nextElementSibling;
            if (nextEl && (nextEl.tagName === "INPUT" || nextEl.tagName === "TEXTAREA")) {
                console.log(`Found: ${label.textContent} = ${nextEl.value || "(empty)"}`);
            }
        }
    });
};

console.log("Test function added. Run testQuoteCapture() to debug");

